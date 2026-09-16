import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BancadaDeSessoes } from '../../apps/api/test/sessao-de-teste.js'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../tools/ci/compose.ts'
import { compose, composeAssincrono, composeAssincronoOuFalha } from '../../tools/testes/compose.ts'
import { urlDoBancoDeTeste } from '../../tools/testes/integracao.setup.ts'
import {
  alertaCom,
  criarJobSintetico,
  executarEnsaioDeAlertas,
  gatilhoDaFalhaExiste,
  lerRegrasNoGrafana,
  REGRAS_DO_ENSAIO,
  type EstadoDoAlerta,
  type ResultadoDoEnsaio,
} from '../scripts/ensaio-alertas.ts'

// Contra o compose de teste, com as imagens construídas: a observabilidade (grafana/otel-lgtm) com as regras
// provisionadas de infra/grafana/alertas/, uma API, os dois despachantes e o worker-interativo exportando OTLP
// de verdade, e o estado das regras lido pela API do Grafana, como o ensaio faz.
const ambiente = lerAmbienteDeTeste()
const porta = (variavel: string) => valorObrigatorio(ambiente, variavel)
const API = `http://127.0.0.1:${porta('API_1_PORTA_HOST')}`
const GRAFANA = `http://127.0.0.1:${porta('GRAFANA_PORTA_HOST')}`
const PROMETHEUS = `http://127.0.0.1:${porta('PROMETHEUS_PORTA_HOST')}`
const SERVICOS = ['observabilidade', 'api-1', 'despachante-1', 'despachante-2', 'worker-interativo-1', 'worker-interativo-2'] as const
/**
 * A escola da borda opera com uma vaga interativa só (configuração dela): um job longo a toma inteira. Com as cinco
 * vagas do padrão seriam cinco jobs longos, e o job sintético queima CPU de verdade no sandbox (15.0): cinco deles
 * disputariam as threads do worker e esticariam a espera além do `for:` da regra.
 */
const VAGAS_INTERATIVAS_DA_ESCOLA = 1
/** Quanto os jobs que tomam as vagas da escola duram: a espera do seguinte passa de 30 s e fica bem abaixo de 30 s + 1 min. */
const DURACAO_DOS_JOBS_LONGOS_MS = 50_000

const escolas: string[] = []
const bancoUrl = urlDoBancoDeTeste()

const sessoes = new BancadaDeSessoes()

/** O token de uma sessão nova de coordenação na escola: a rota de job sintético é da unidade. */
async function token(escolaId: string): Promise<string> {
  return (await sessoes.sessao(escolaId, 'coordenador')).token
}

async function esperaNoPrometheus(escolaId: string): Promise<number | undefined> {
  const consulta = new URLSearchParams({ query: `max(job_espera_mais_antiga_s{escola_id="${escolaId}", fila="interativa"})` })
  const corpo = (await (await fetch(`${PROMETHEUS}/api/v1/query?${consulta}`)).json()) as { data: { result: Array<{ value: [number, string] }> } }
  const [serie] = corpo.data.result
  return serie === undefined ? undefined : Number(serie.value[1])
}

async function estadoDoJob(apiToken: string, jobId: string): Promise<string> {
  const resposta = await fetch(`${API}/v1/sistema/jobs-sinteticos/${jobId}`, { headers: { Authorization: `Bearer ${apiToken}` } })
  return ((await resposta.json()) as { estado: string }).estado
}

describe('alertas locais: as três regras disparam no ensaio, não disparam com condição curta e voltam a normal', () => {
  beforeAll(async () => {
    // Observabilidade recriada: nenhum estado de alerta nem série de uma execução anterior.
    await composeAssincronoOuFalha('up', '--detach', '--force-recreate', '--wait', 'observabilidade')
    await composeAssincronoOuFalha('up', '--detach', '--build', '--wait', ...SERVICOS)
  }, 900_000)

  afterAll(async () => {
    // Ensaio que falhou no meio não deixa o Redis de cache nem o worker parados para o arquivo seguinte.
    await composeAssincrono('up', '--detach', '--wait', 'redis-cache')
    const pool = new pg.Pool({ connectionString: bancoUrl, max: 1 })
    await pool.query('delete from job_registro where escola_id = any($1)', [escolas])
    await pool.query('delete from configuracao_operacional_escola where escola_id = any($1)', [escolas])
    await pool.end()
    await sessoes.fechar()
    await composeAssincronoOuFalha('stop', ...SERVICOS)
  }, 180_000)

  it('caminho feliz: `ensaio:alertas` leva as três regras a disparadas, cada uma só depois do próprio `for:`, e a condição cessada as leva de volta a normal', async () => {
    const resultado: ResultadoDoEnsaio = await executarEnsaioDeAlertas({
      compose: composeAssincrono,
      servicos: SERVICOS,
      apiUrl: API,
      grafanaUrl: GRAFANA,
      bancoUrl,
      ambiente,
      criarEscolaComSessoes: async (quantidade) => {
        const escolaId = await sessoes.escola()
        const criadas = await sessoes.sessoes(escolaId, { papel: 'coordenador', quantidade })
        return { escolaId, tokens: criadas.map((criada) => () => criada.tokenNovo()) }
      },
      // O andamento do ensaio no log do teste: é o que diz em que regra ele parou, se estourar o prazo.
      registrar: (linha) => process.stdout.write(`ensaio: ${linha}\n`),
    })
    escolas.push(resultado.escolaDoJob, resultado.escolaDaFalha, resultado.escolaDoSeguro)

    const jobInterativo = resultado.disparos[REGRAS_DO_ENSAIO.jobInterativo]
    const seguroDoLimite = resultado.disparos[REGRAS_DO_ENSAIO.seguroDoLimite]
    const taxa5xx = resultado.disparos[REGRAS_DO_ENSAIO.taxa5xx]
    // Cada regra disparou com os rótulos da condição provocada: a escola do job, a rota que falhou.
    expect(jobInterativo.rotulos).toMatchObject({ fila: 'interativa', escola_id: resultado.escolaDoJob })
    expect(taxa5xx.rotulos).toMatchObject({ job: 'educa/api', http_route: '/v1/sistema/jobs-sinteticos' })
    expect(seguroDoLimite.rotulos['instance']).toMatch(/^[0-9a-f]{12}$/)
    // E só depois de pendente pelo `for:` inteiro: início da pendência e do disparo, os dois informados pelo Grafana.
    expect([jobInterativo.duracaoS, seguroDoLimite.duracaoS, taxa5xx.duracaoS]).toEqual([60, 120, 300])
    for (const disparo of [jobInterativo, seguroDoLimite, taxa5xx]) {
      expect(disparo.disparadoDesdeMs - disparo.pendenteDesdeMs).toBeGreaterThanOrEqual(disparo.duracaoS * 1_000)
    }
    // Isolamento do gatilho: com a falha forçada valendo, outra escola gravou job na mesma rota.
    expect(resultado.jobDeOutraEscolaNaFalha).toMatch(/^[0-9a-f-]{36}$/)
    // A falha forçada é 500 da API, e nenhuma requisição virou 429 no lugar do 5xx.
    expect(resultado.statusDaFalha['500'] ?? 0).toBeGreaterThan(200)
    expect(Object.keys(resultado.statusDaFalha)).toEqual(['500'])

    // Restaurado: sem gatilho, a mesma escola grava job; Redis de cache e worker-interativo de pé.
    expect(await gatilhoDaFalhaExiste(bancoUrl)).toBe(false)
    const depois = await criarJobSintetico(API, await token(resultado.escolaDaFalha), { fila: 'interativa', cpuMs: 0 })
    expect(depois.status).toBe(202)
    for (const servico of ['redis-cache', 'worker-interativo-1', 'worker-interativo-2']) {
      expect(compose('ps', '--format', '{{.Health}}', servico).saida.trim(), servico).toBe('healthy')
    }
    // O job que esperou começou quando o worker voltou, e as três regras estão normais.
    const tokenDoJob = await token(resultado.escolaDoJob)
    await expect.poll(() => estadoDoJob(tokenDoJob, resultado.jobId), { timeout: 30_000, interval: 1_000 }).toBe('concluido')
    const regras = await lerRegrasNoGrafana(GRAFANA)
    for (const uid of Object.values(REGRAS_DO_ENSAIO)) {
      expect(regras.get(uid)?.alertas.map((alerta) => alerta.estado), uid).toEqual(expect.arrayContaining(['normal']))
      expect(regras.get(uid)?.alertas.filter((alerta) => alerta.estado !== 'normal'), uid).toEqual([])
    }
  }, 900_000)

  it('borda: espera curta não dispara — a 20 s nem fica pendente, e passando de 30 s por menos de 1 min fica pendente e volta a normal sem disparar', async () => {
    const escola = await sessoes.escola()
    escolas.push(escola)
    const apiToken = await token(escola)
    const pool = new pg.Pool({ connectionString: bancoUrl, max: 1 })
    await pool.query('insert into configuracao_operacional_escola (escola_id, vagas) values ($1, $2)', [escola, JSON.stringify({ interativa: VAGAS_INTERATIVAS_DA_ESCOLA })])
    await pool.end()
    // As vagas interativas da escola tomadas por jobs longos: o próximo job espera por elas, com o worker de pé.
    const longos: string[] = []
    for (let vaga = 0; vaga < VAGAS_INTERATIVAS_DA_ESCOLA; vaga++) {
      const resposta = await criarJobSintetico(API, apiToken, { fila: 'interativa', cpuMs: DURACAO_DOS_JOBS_LONGOS_MS })
      expect(resposta.status).toBe(202)
      longos.push(((await resposta.json()) as { jobId: string }).jobId)
    }
    await expect.poll(async () => (await Promise.all(longos.map((jobId) => estadoDoJob(apiToken, jobId)))).every((estado) => estado === 'ativo'), { timeout: 30_000, interval: 500 }).toBe(true)
    const resposta = await criarJobSintetico(API, apiToken, { fila: 'interativa', cpuMs: 0 })
    expect(resposta.status).toBe(202)
    const esperando = ((await resposta.json()) as { jobId: string }).jobId

    // O estado da regra para esta escola, amostrado sem parar da criação do job até o fim: um disparo entre duas
    // esperas do teste (um `for:` curto demais, por exemplo) não passa despercebido.
    const estados: EstadoDoAlerta[] = []
    const estadoDaEscola = async (): Promise<EstadoDoAlerta> => {
      const estado = alertaCom((await lerRegrasNoGrafana(GRAFANA)).get(REGRAS_DO_ENSAIO.jobInterativo), { escola_id: escola })?.estado ?? 'normal'
      estados.push(estado)
      return estado
    }
    let amostrando = true
    const amostragem = (async () => {
      while (amostrando) {
        await estadoDaEscola()
        await new Promise((resolver) => setTimeout(resolver, 1_000))
      }
    })()

    // Com a espera em 20 s no Prometheus, abaixo do limiar: a regra nem começou a contar.
    await expect.poll(() => esperaNoPrometheus(escola), { timeout: 60_000, interval: 1_000 }).toBeGreaterThanOrEqual(20)
    expect(await esperaNoPrometheus(escola)).toBeLessThan(30)
    expect(await estadoDaEscola()).toBe('normal')

    // Acima de 30 s ela fica pendente: o que segura o disparo é o `for:`, e não o limiar.
    await expect.poll(estadoDaEscola, { timeout: 60_000, interval: 1_000 }).toBe('pendente')
    // As vagas liberam, o job começa, a espera zera e a regra volta a normal, sem nunca ter disparado.
    await expect.poll(() => estadoDoJob(apiToken, esperando), { timeout: 60_000, interval: 1_000 }).toBe('concluido')
    await expect.poll(() => esperaNoPrometheus(escola), { timeout: 60_000, interval: 1_000 }).toBe(0)
    await expect.poll(estadoDaEscola, { timeout: 60_000, interval: 1_000 }).toBe('normal')
    // Mais duas avaliações da regra depois de normal, para um disparo atrasado aparecer.
    await new Promise((resolver) => setTimeout(resolver, 25_000))
    amostrando = false
    await amostragem
    expect(estados).toContain('pendente')
    expect(estados).not.toContain('disparado')
    expect(estados.at(-1)).toBe('normal')
  }, 300_000)

  it('o anônimo do Grafana lê as regras, mas não apaga nem pausa uma regra provisionada', async () => {
    const apagar = await fetch(`${GRAFANA}/api/v1/provisioning/alert-rules/${REGRAS_DO_ENSAIO.taxa5xx}`, { method: 'DELETE' })
    expect(apagar.status).toBe(403)
    const regras = await lerRegrasNoGrafana(GRAFANA)
    expect([...regras.keys()].sort()).toEqual(Object.values(REGRAS_DO_ENSAIO).sort())
  }, 60_000)
})
