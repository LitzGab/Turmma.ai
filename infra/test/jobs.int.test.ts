import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { emitirTokenSintetico } from '../../apps/api/src/ops/token-sintetico.js'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../tools/ci/compose.ts'
import { aguardarSaudavel, compose, composeAssincronoOuFalha, composeOuFalha } from '../../tools/testes/compose.ts'

// Contra o compose de teste, com as imagens construídas: migrar, API, dois despachantes e dois
// workers como processos de verdade. É o que prova a ligação do main.ts, o `kill -9` e o SIGTERM.
const ambiente = lerAmbienteDeTeste()
const API = `http://127.0.0.1:${valorObrigatorio(ambiente, 'API_1_PORTA_HOST')}`
const ESCOLA = '0190f5a0-0000-7000-8000-0000000000c1'
const PROCESSOS_DA_FILA = ['despachante-1', 'despachante-2', 'worker-1', 'worker-2'] as const

interface LinhaDeLog {
  servico: string
  registro: Record<string, unknown>
}

/** Linhas JSON do log dos serviços desde `desde`, com o nome do serviço que as escreveu. */
function logsDesde(desde: string, ...servicos: string[]): LinhaDeLog[] {
  return servicos.flatMap((servico) =>
    composeOuFalha('logs', '--no-color', '--no-log-prefix', '--since', desde, servico)
      .split('\n')
      .filter((linha) => linha.startsWith('{'))
      .map((linha) => ({ servico, registro: JSON.parse(linha) as Record<string, unknown> })),
  )
}

describe('job pela API até o worker, com processos de verdade', () => {
  let token: string

  const criarJob = async (corpo: Record<string, unknown>, requisicaoId = randomUUID()): Promise<string> => {
    const resposta = await fetch(`${API}/v1/sistema/jobs-sinteticos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Requisicao-Id': requisicaoId },
      body: JSON.stringify({ fila: 'interativa', naoUrgente: false, ...corpo }),
    })
    expect(resposta.status).toBe(202)
    return ((await resposta.json()) as { jobId: string }).jobId
  }

  const estado = async (jobId: string): Promise<string | undefined> => {
    const resposta = await fetch(`${API}/v1/sistema/jobs-sinteticos/${jobId}`, { headers: { Authorization: `Bearer ${token}` } })
    return ((await resposta.json()) as { estado?: string }).estado
  }

  const estadoDoServico = (servico: string) => compose('ps', '--all', '--format', '{{.State}} {{.ExitCode}}', servico).saida.trim()

  beforeAll(async () => {
    token = await emitirTokenSintetico({ escolaId: ESCOLA, usuarioId: randomUUID(), validadeSegundos: 3_600 }, ambiente)
    await composeAssincronoOuFalha('up', '--detach', '--build', '--wait', 'api-1', ...PROCESSOS_DA_FILA)
  }, 900_000)

  afterAll(async () => {
    // Derruba só o que este arquivo subiu: um despachante de pé disputaria a fila com os testes em processo.
    await composeAssincronoOuFalha('stop', 'api-1', ...PROCESSOS_DA_FILA)
  }, 120_000)

  it('o migrar rodou e saiu com sucesso antes de API, despachantes e workers', () => {
    expect(estadoDoServico('migrar')).toBe('exited 0')
    for (const servico of ['api-1', ...PROCESSOS_DA_FILA]) expect(estadoDoServico(servico), servico).toBe('running 0')
  })

  it('o mesmo requisicaoId aparece no log da API, de um despachante e de um worker, e o job termina concluido', async () => {
    const desde = new Date().toISOString()
    const requisicaoId = randomUUID()
    const jobId = await criarJob({ cpuMs: 200 }, requisicaoId)
    await expect.poll(() => estado(jobId), { timeout: 20_000, interval: 200 }).toBe('concluido')

    const daRequisicao = logsDesde(desde, 'api-1', ...PROCESSOS_DA_FILA).filter(({ registro }) => registro['requisicaoId'] === requisicaoId)
    const eventosPorServico = (prefixo: string) =>
      daRequisicao.filter(({ servico }) => servico.startsWith(prefixo)).map(({ registro }) => registro['evento'] ?? registro['msg'])
    expect(eventosPorServico('api')).toContain('job.enfileirado')
    expect(eventosPorServico('despachante')).toEqual(['job.publicado'])
    expect(eventosPorServico('worker')).toEqual(['job.iniciado', 'job.concluido'])
    for (const { registro } of daRequisicao) expect(registro['escolaId']).toBe(ESCOLA)
  }, 60_000)

  it('kill -9 no worker no meio do job: o lock vence, a outra réplica retoma, e o job termina concluido', async () => {
    await composeAssincronoOuFalha('stop', 'worker-2')
    try {
      const desde = new Date().toISOString()
      const jobId = await criarJob({ cpuMs: 8_000 })
      await expect.poll(() => estado(jobId), { timeout: 20_000, interval: 200 }).toBe('ativo')

      await composeAssincronoOuFalha('kill', '--signal', 'SIGKILL', 'worker-1')
      expect(estadoDoServico('worker-1')).toBe('exited 137')
      await composeAssincronoOuFalha('start', 'worker-2')

      // Stalled padrão do BullMQ: o lock vence em até 30 s, e o job só volta na segunda verificação
      // (a cada 30 s) depois disso. No pior caso, uns 100 s, mais os 8 s do job.
      await expect.poll(() => estado(jobId), { timeout: 150_000, interval: 1_000 }).toBe('concluido')
      const doJob = logsDesde(desde, 'worker-1', 'worker-2').filter(({ registro }) => registro['jobId'] === jobId)
      expect(doJob.filter(({ servico }) => servico === 'worker-1').map(({ registro }) => registro['evento'])).toEqual(['job.iniciado'])
      expect(doJob.filter(({ servico }) => servico === 'worker-2').map(({ registro }) => registro['evento'])).toEqual(['job.iniciado', 'job.concluido'])
    } finally {
      await composeAssincronoOuFalha('up', '--detach', '--wait', 'worker-1', 'worker-2')
    }
  }, 300_000)

  it('SIGTERM no worker no meio do job: ele termina o job antes de sair, com código 0', async () => {
    await composeAssincronoOuFalha('stop', 'worker-2')
    try {
      const desde = new Date().toISOString()
      const jobId = await criarJob({ cpuMs: 4_000 })
      await expect.poll(() => estado(jobId), { timeout: 20_000, interval: 200 }).toBe('ativo')

      await composeAssincronoOuFalha('stop', 'worker-1')
      expect(estadoDoServico('worker-1')).toBe('exited 0')
      expect(await estado(jobId)).toBe('concluido')
      const eventos = logsDesde(desde, 'worker-1').filter(({ registro }) => registro['jobId'] === jobId).map(({ registro }) => registro['evento'])
      expect(eventos).toEqual(['job.iniciado', 'job.concluido'])
    } finally {
      await composeAssincronoOuFalha('up', '--detach', '--wait', 'worker-1', 'worker-2')
    }
  }, 120_000)

  it('Redis de fila fora por 2 min: a API aceita na hora, despachantes e workers seguem de pé e saudáveis, e ao religar cada job executa uma vez', async () => {
    const desde = new Date().toISOString()
    const inicioDaQueda = performance.now()
    await composeAssincronoOuFalha('stop', 'redis-fila')
    try {
      const ids: string[] = []
      for (let indice = 0; indice < 5; indice++) {
        const inicio = performance.now()
        ids.push(await criarJob({ cpuMs: 0 }))
        expect(performance.now() - inicio).toBeLessThan(1_000)
      }
      // Dois minutos inteiros de Redis fora, conferindo os processos a cada 10 s.
      while (performance.now() - inicioDaQueda < 120_000) {
        await new Promise((resolver) => setTimeout(resolver, 10_000))
        for (const servico of PROCESSOS_DA_FILA) {
          expect(compose('ps', '--all', '--format', '{{.State}} {{.ExitCode}} {{.Health}}', servico).saida.trim(), servico).toBe('running 0 healthy')
        }
      }
      for (const id of ids) expect(await estado(id)).not.toBe('concluido')

      await composeAssincronoOuFalha('start', 'redis-fila')
      await aguardarSaudavel('redis-fila')
      // A publicação que falhou na queda volta quando a reserva vence (30 s).
      for (const id of ids) await expect.poll(() => estado(id), { timeout: 90_000, interval: 500 }).toBe('concluido')

      const registros = logsDesde(desde, ...PROCESSOS_DA_FILA)
      expect(registros.filter(({ registro }) => String(registro['evento']).startsWith('processo.'))).toEqual([])
      expect(registros.some(({ registro }) => registro['evento'] === 'despachante.publicacao_falhou')).toBe(true)
      for (const id of ids) {
        const inicios = registros.filter(({ registro }) => registro['evento'] === 'job.iniciado' && registro['jobId'] === id)
        expect(inicios, id).toHaveLength(1)
      }
    } finally {
      await composeAssincronoOuFalha('up', '--detach', '--wait', 'redis-fila')
    }
  }, 300_000)
})
