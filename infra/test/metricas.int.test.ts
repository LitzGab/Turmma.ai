import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { emitirTokenSintetico } from '../../apps/api/src/ops/token-sintetico.js'
import { FILAS_POR_PRIORIDADE, nomeDaFilaBullMQ } from '../../packages/nucleo/src/fila/filas.ts'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../tools/ci/compose.ts'
import { raizRepositorio } from '../../tools/ci/executar.ts'
import { aguardarSaudavel, compose, composeAssincronoOuFalha, PROCESSOS_DA_FILA } from '../../tools/testes/compose.ts'
import { urlDoBancoDeTeste } from '../../tools/testes/integracao.setup.ts'
import { NOMES_NO_PROMETHEUS } from '../../tools/testes/metricas.ts'

// Contra o compose de teste, com as imagens construídas: a observabilidade (grafana/otel-lgtm), uma API, os
// dois despachantes e um realtime exportando OTLP de verdade, e as consultas pela API do Prometheus dela.
// Sem worker: os jobs ficam publicados ou aguardando, e a espera cresce.
const ambiente = lerAmbienteDeTeste()
const porta = (variavel: string) => valorObrigatorio(ambiente, variavel)
const API = `http://127.0.0.1:${porta('API_1_PORTA_HOST')}`
const PROMETHEUS = `http://127.0.0.1:${porta('PROMETHEUS_PORTA_HOST')}`
const GRAFANA = `http://127.0.0.1:${porta('GRAFANA_PORTA_HOST')}`
const SERVICOS = ['observabilidade', 'api-1', 'despachante-1', 'despachante-2', 'realtime-1'] as const
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
/** Exportação a cada 5 s e medição da fila a cada 5 s: com folga, o Prometheus vê a mudança nisto. */
const PRAZO_DA_METRICA_MS = 60_000

// Escolas e usuário novos a cada execução: nenhuma série herda valor de uma execução anterior.
const ESCOLA_A = randomUUID()
const ESCOLA_B = randomUUID()
const ESCOLA_C = randomUUID()
const USUARIO = randomUUID()

interface Serie {
  metric: Record<string, string>
  value: [number, string]
}

async function consultar(expr: string): Promise<Serie[]> {
  const resposta = await fetch(`${PROMETHEUS}/api/v1/query?${new URLSearchParams({ query: expr })}`)
  const corpo = (await resposta.json()) as { status: string; data?: { result: Serie[] }; error?: string }
  if (corpo.status !== 'success') throw new Error(`consulta ${expr} falhou: ${corpo.error ?? resposta.status}`)
  return corpo.data?.result ?? []
}

async function valor(expr: string): Promise<number | undefined> {
  const [serie] = await consultar(expr)
  return serie === undefined ? undefined : Number(serie.value[1])
}

async function valoresDoRotulo(rotulo: string): Promise<string[]> {
  const corpo = (await (await fetch(`${PROMETHEUS}/api/v1/label/${encodeURIComponent(rotulo)}/values`)).json()) as { data: string[] }
  return corpo.data
}

describe('métricas na observabilidade local, por rota, fila e escola', () => {
  const tokens = new Map<string, string>()
  const jobs: string[] = []

  const token = async (escolaId: string): Promise<string> => {
    const existente = tokens.get(escolaId)
    if (existente !== undefined) return existente
    const novo = await emitirTokenSintetico({ escolaId, usuarioId: USUARIO, validadeSegundos: 3_600 }, ambiente)
    tokens.set(escolaId, novo)
    return novo
  }

  const criarJob = async (escolaId: string, fila: string): Promise<string> => {
    const resposta = await fetch(`${API}/v1/sistema/jobs-sinteticos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await token(escolaId)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fila, cpuMs: 0, naoUrgente: false }),
    })
    expect(resposta.status).toBe(202)
    const { jobId } = (await resposta.json()) as { jobId: string }
    jobs.push(jobId)
    return jobId
  }

  const espera = (escolaId: string, fila: string) => valor(`max(job_espera_mais_antiga_s{escola_id="${escolaId}", fila="${fila}"})`)

  /** A instância da API deste arquivo, pelo nome do host (o `service.instance.id`): série de container anterior fica no Prometheus por 5 min. */
  let instanciaDaApi = ''

  beforeAll(async () => {
    // Worker nenhum: o job criado não começa, e a espera dele sobe.
    compose('stop', ...PROCESSOS_DA_FILA)
    // Observabilidade recriada, sem volume: nenhuma série de uma execução anterior.
    await composeAssincronoOuFalha('up', '--detach', '--force-recreate', '--wait', 'observabilidade')
    await composeAssincronoOuFalha('up', '--detach', '--build', '--wait', ...SERVICOS)
    instanciaDaApi = compose('exec', '-T', 'api-1', 'hostname').saida.trim()
    expect(instanciaDaApi).toMatch(/^[0-9a-f]{12}$/)
  }, 900_000)

  afterAll(async () => {
    // Os jobs deste arquivo não ficam para o worker de outro teste executar, nem no banco nem na fila.
    const pool = new pg.Pool({ connectionString: urlDoBancoDeTeste(), max: 1 })
    await pool.query('delete from job_registro where escola_id = any($1)', [[ESCOLA_A, ESCOLA_B, ESCOLA_C]])
    await pool.end()
    const redis = new Redis(`redis://127.0.0.1:${porta('REDIS_FILA_PORTA_HOST')}`, { maxRetriesPerRequest: null })
    for (const fila of FILAS_POR_PRIORIDADE) {
      const queue = new Queue(nomeDaFilaBullMQ(fila), { connection: redis })
      for (const jobId of jobs) await queue.remove(jobId)
      await queue.close()
    }
    await redis.quit()
    await composeAssincronoOuFalha('stop', ...SERVICOS)
  }, 120_000)

  it('caminho feliz: depois de jobs das escolas A e B, a espera do mais antigo tem uma série por escola e fila, e a vaga e o tamanho da fila também', async () => {
    await criarJob(ESCOLA_A, 'interativa')
    await criarJob(ESCOLA_A, 'lote')
    await criarJob(ESCOLA_B, 'interativa')

    const seriesDaEspera = async () =>
      (await consultar(`max by (fila, escola_id) (job_espera_mais_antiga_s{escola_id=~"${ESCOLA_A}|${ESCOLA_B}"})`)).map(({ metric }) => `${metric['fila']}:${metric['escola_id']}`).sort()
    await expect.poll(seriesDaEspera, { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toEqual([`interativa:${ESCOLA_A}`, `interativa:${ESCOLA_B}`, `lote:${ESCOLA_A}`].sort())

    await expect.poll(() => espera(ESCOLA_A, 'interativa'), { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBeGreaterThan(0)
    expect(await valor(`max(job_pendentes{escola_id="${ESCOLA_A}", fila="lote"})`)).toBe(1)
    // O despachante publicou o job com vaga: sem worker, a vaga fica tomada, e cada escola conta a sua.
    await expect.poll(() => valor(`max(fila_vagas_em_uso{escola_id="${ESCOLA_B}", fila="interativa"})`), { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBe(1)
    // Os dois despachantes medem, cada um na sua instância; o painel usa `max`. Cada um mede a cada 5 s e
    // exporta a cada 5 s, em fases independentes, então a série do segundo pode chegar até um ciclo de medição
    // mais um de exportação depois da do primeiro, que é a que satisfez as esperas acima: espera pelas duas
    // instâncias, com o mesmo prazo das outras métricas.
    const pendentesPorInstancia = async () => {
      const series = await consultar(`job_pendentes{escola_id="${ESCOLA_A}", fila="interativa"}`)
      return { jobs: series.map(({ metric }) => metric['job']), instancias: new Set(series.map(({ metric }) => metric['instance'])).size }
    }
    await expect
      .poll(pendentesPorInstancia, { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 })
      .toEqual({ jobs: ['educa/despachante', 'educa/despachante'], instancias: 2 })
  }, 120_000)

  it('borda: com o Redis de fila parado, a espera continua subindo, e o job criado na queda aparece: a métrica vem de criado_em', async () => {
    await expect.poll(() => espera(ESCOLA_A, 'interativa'), { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBeGreaterThan(0)
    await composeAssincronoOuFalha('stop', 'redis-fila')
    try {
      const antes = (await espera(ESCOLA_A, 'interativa')) ?? 0
      await criarJob(ESCOLA_C, 'interativa')
      await expect.poll(() => espera(ESCOLA_C, 'interativa'), { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBeGreaterThan(0)
      // Pelo menos duas medições e duas exportações depois, ainda com o Redis fora.
      await expect.poll(() => espera(ESCOLA_A, 'interativa'), { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBeGreaterThanOrEqual(antes + 10)
      // O Redis fora também aparece, no processo que usa ele.
      await expect.poll(() => valor('max(redis_disponivel{job="educa/despachante", instancia="fila"})'), { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBe(0)
    } finally {
      await composeAssincronoOuFalha('start', 'redis-fila')
      await aguardarSaudavel('redis-fila')
    }
  }, 240_000)

  it('borda: `http.route` registra `/v1/sistema/jobs-sinteticos/:id`, nunca o id', async () => {
    const jobId = await criarJob(ESCOLA_B, 'normal')
    for (let pedido = 0; pedido < 3; pedido++) {
      const resposta = await fetch(`${API}/v1/sistema/jobs-sinteticos/${jobId}`, { headers: { Authorization: `Bearer ${await token(ESCOLA_B)}` } })
      expect(resposta.status).toBe(200)
    }
    await expect
      .poll(() => valor('sum(http_server_request_duration_seconds_count{job="educa/api", http_route="/v1/sistema/jobs-sinteticos/:id", http_response_status_code="200"})'), {
        timeout: PRAZO_DA_METRICA_MS,
        interval: 1_000,
      })
      .toBeGreaterThanOrEqual(3)
    const rotas = await valoresDoRotulo('http_route')
    expect(rotas).toContain('/v1/sistema/jobs-sinteticos/:id')
    expect(rotas.filter((rota) => UUID.test(rota))).toEqual([])
  }, 120_000)

  it('borda: parar o Redis de cache leva `limite.seguro_ativo` de 0 a 1, o Redis de cache fora aparece na API, e ao religar o seguro volta a 0', async () => {
    // Tráfego na janela a cada consulta: o seguro só conta requisição limitada.
    const seguroComTrafego = async (): Promise<number | undefined> => {
      for (let pedido = 0; pedido < 5; pedido++) await fetch(`${API}/v1/sistema/contexto`, { headers: { Authorization: `Bearer ${await token(ESCOLA_A)}` } })
      return valor(`max(limite_seguro_ativo{job="educa/api", instance="${instanciaDaApi}"})`)
    }
    // Com o Redis de cache no ar, quem limita é ele.
    await expect.poll(seguroComTrafego, { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBe(0)
    await composeAssincronoOuFalha('stop', 'redis-cache')
    try {
      await expect.poll(seguroComTrafego, { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBe(1)
      await expect.poll(() => valor(`max(redis_disponivel{job="educa/api", instance="${instanciaDaApi}", instancia="cache"})`), { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBe(0)
    } finally {
      await composeAssincronoOuFalha('start', 'redis-cache')
      await aguardarSaudavel('redis-cache')
    }
    await expect.poll(() => valor(`min(redis_disponivel{job="educa/api", instance="${instanciaDaApi}", instancia="cache"})`), { timeout: PRAZO_DA_METRICA_MS, interval: 1_000 }).toBe(1)
    // A janela de 30 s do seguro passa, e a proporção volta a 0 com o Redis atendendo.
    await expect.poll(seguroComTrafego, { timeout: 2 * PRAZO_DA_METRICA_MS, interval: 1_000 }).toBe(0)
  }, 300_000)

  it('o painel provisionado está no Grafana, com as consultas do arquivo, e elas respondem com as séries das escolas; o anônimo só lê e não publica fora', async () => {
    const resposta = await fetch(`${GRAFANA}/api/dashboards/uid/educa-fundacao`)
    expect(resposta.status).toBe(200)
    const { dashboard, meta } = (await resposta.json()) as { dashboard: { panels: Array<{ type: string; targets?: Array<{ expr: string }> }> }; meta: { provisioned: boolean } }
    expect(meta.provisioned).toBe(true)
    const expressoes = dashboard.panels.flatMap((painel) => (painel.targets ?? []).map((alvo) => alvo.expr))
    const doArquivo = JSON.parse(readFileSync(join(raizRepositorio, 'infra/grafana/paineis/fundacao.json'), 'utf8')) as { panels: Array<{ targets?: Array<{ expr: string }> }> }
    expect(expressoes).toEqual(doArquivo.panels.flatMap((painel) => (painel.targets ?? []).map((alvo) => alvo.expr)))
    // Visitante anônimo não grava painel, e o snapshot público (fora da máquina) está desligado.
    const gravar = await fetch(`${GRAFANA}/api/dashboards/db`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dashboard: { title: 'intruso' } }) })
    expect(gravar.status).toBe(403)
    expect(((await (await fetch(`${GRAFANA}/api/snapshot/shared-options`)).json()) as { externalEnabled: boolean }).externalEnabled).toBe(false)
    for (const expr of expressoes) await consultar(expr)
    const daEspera = expressoes.find((expr) => expr.includes('job_espera_mais_antiga_s')) ?? ''
    expect((await consultar(daEspera)).map(({ metric }) => metric['escola_id'])).toEqual(expect.arrayContaining([ESCOLA_A, ESCOLA_B]))
    // Os nomes que o teste do painel supõe são os que o Prometheus deu às métricas que este cenário exercita.
    const nomes = await valoresDoRotulo('__name__')
    for (const chave of ['duracaoHttp', 'esperaMaisAntiga', 'pendentes', 'vagasEmUso', 'conexoesRealtime', 'poolEmUso', 'redisDisponivel', 'seguroAtivo', 'atrasoEventLoop'] as const) {
      for (const nome of NOMES_NO_PROMETHEUS[chave]) expect(nomes, chave).toContain(nome)
    }
  }, 120_000)

  it('permissão: nenhuma série tem rótulo de usuário nem o id do usuário em rótulo algum, e `escola_id` só aparece em métrica de job', async () => {
    const { data: rotulos } = (await (await fetch(`${PROMETHEUS}/api/v1/labels`)).json()) as { data: string[] }
    expect(rotulos.filter((rotulo) => /usuario|user/i.test(rotulo))).toEqual([])
    expect(await consultar('{usuario_id!=""}')).toEqual([])
    for (const rotulo of rotulos) expect(await valoresDoRotulo(rotulo), rotulo).not.toContain(USUARIO)

    const comEscola = (await consultar('count by (__name__) ({escola_id!=""})')).map(({ metric }) => metric['__name__']).sort()
    expect(comEscola).toEqual(expect.arrayContaining(['job_espera_mais_antiga_s', 'job_pendentes', 'fila_vagas_em_uso']))
    const deJob = new Set<string>([...NOMES_NO_PROMETHEUS.esperaMaisAntiga, ...NOMES_NO_PROMETHEUS.pendentes, ...NOMES_NO_PROMETHEUS.vagasEmUso, ...NOMES_NO_PROMETHEUS.aguardandoVaga])
    expect(comEscola.filter((nome) => !deJob.has(nome ?? ''))).toEqual([])
  }, 120_000)
})
