import 'reflect-metadata'
import { TIMEOUT_COMANDO_REDIS_FILA_MS } from '@educa/nucleo'
import type { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { randomUUID } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste } from '../../../tools/ci/compose.ts'
import { aguardarSaudavel, compose, composeAssincronoOuFalha } from '../../../tools/testes/compose.ts'
import { AppModule } from '../../api/src/app.module.js'
import { configurarAplicacao } from '../../api/src/configurar-app.js'
import { emitirTokenSintetico } from '../../api/src/ops/token-sintetico.js'
import { configuracaoDeTeste } from '../../api/test/configuracao-de-teste.js'
import { BancadaDeFila, ESCOLA_A, LogEmMemoria } from '../../worker/test/fila-de-teste.js'

// API, despachantes e worker de verdade (a mesma montagem do main.ts), no processo do teste, contra o
// Postgres e o Redis de fila do compose de teste, que este arquivo para, trava e religa.

async function contarPorEstado(bancada: BancadaDeFila, ids: readonly string[]): Promise<Record<string, number>> {
  const { rows } = await bancada.pool.query<{ estado: string; total: string }>(
    'select estado, count(*) as total from job_registro where id = any($1) group by estado',
    [ids],
  )
  return Object.fromEntries(rows.map((linha) => [linha.estado, Number(linha.total)]))
}

/** Quantas vezes cada job começou a executar, somando os workers. */
function execucoesPorJob(...logs: LogEmMemoria[]): Map<string, number> {
  const execucoes = new Map<string, number>()
  for (const registro of logs.flatMap((log) => log.doEvento('job.iniciado'))) {
    const id = String(registro['jobId'])
    execucoes.set(id, (execucoes.get(id) ?? 0) + 1)
  }
  return execucoes
}

beforeAll(() => {
  // Despachante ou worker do compose de pé disputaria as linhas com os deste arquivo.
  compose('stop', 'despachante-1', 'despachante-2', 'worker-1', 'worker-2')
})

describe('Redis de fila fora', () => {
  let bancada: BancadaDeFila

  afterEach(async () => {
    // Religa o Redis antes de fechar: a bancada limpa a fila dela no Redis.
    compose('unpause', 'redis-fila')
    await composeAssincronoOuFalha('up', '--detach', 'redis-fila')
    // `up --wait` desiste na hora depois de um `pause`, com o último estado ainda `unhealthy`.
    await aguardarSaudavel('redis-fila')
    await bancada.fechar()
  }, 120_000)

  it('parado: 50 POSTs dão 202 em menos de 1 s cada, a publicação falha sem derrubar o laço, e ao religar cada job executa uma vez', async () => {
    bancada = new BancadaDeFila()
    await bancada.limparRegistro()
    const logApi = new LogEmMemoria('api')
    const app: INestApplication = await NestFactory.create(AppModule.com(configuracaoDeTeste({ ambiente: { ROTAS_SINTETICAS: 'true' } })), { logger: false })
    configurarAplicacao(app, logApi.logger)
    await app.listen(0, '127.0.0.1')
    try {
      const { port } = app.getHttpServer().address() as AddressInfo
      const token = await emitirTokenSintetico({ escolaId: ESCOLA_A, usuarioId: randomUUID(), validadeSegundos: 600 }, lerAmbienteDeTeste())
      const logs = { d1: new LogEmMemoria('despachante-1'), d2: new LogEmMemoria('despachante-2'), worker: new LogEmMemoria('worker') }
      bancada.worker(logs.worker, { concorrencia: 10 })
      for (const log of [logs.d1, logs.d2]) bancada.despachante(log).despachante.iniciar()

      await composeAssincronoOuFalha('stop', 'redis-fila')
      const ids: string[] = []
      for (let indice = 0; indice < 50; indice++) {
        const inicio = performance.now()
        const resposta = await fetch(`http://127.0.0.1:${port}/v1/sistema/jobs-sinteticos`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fila: 'interativa', cpuMs: 0, naoUrgente: false }),
        })
        expect(performance.now() - inicio).toBeLessThan(1_000)
        expect(resposta.status).toBe(202)
        ids.push(((await resposta.json()) as { jobId: string }).jobId)
      }

      // Os despachantes reservam, a publicação falha, e a falha fica no log só com os ids.
      const falhas = () => [...logs.d1.doEvento('despachante.publicacao_falhou'), ...logs.d2.doEvento('despachante.publicacao_falhou')]
      await expect.poll(() => falhas().length, { timeout: 10_000 }).toBeGreaterThan(0)
      for (const falha of falhas()) {
        expect(Object.keys(falha).sort()).toEqual(['erro', 'evento', 'jobIds', 'level', 'servico', 'time'])
        for (const id of falha['jobIds'] as string[]) expect(ids).toContain(id)
      }
      const reservadosNaQueda = falhas().flatMap((falha) => falha['jobIds'] as string[])
      // Nada foi publicado nem executado, e o laço seguiu: nenhuma rodada caiu por exceção.
      const estados = await contarPorEstado(bancada, ids)
      expect(Object.keys(estados).filter((estado) => estado !== 'aguardando' && estado !== 'reservado')).toEqual([])
      expect(estados['reservado']).toBeGreaterThan(0)
      expect([...logs.d1.doEvento('despachante.rodada_falhou'), ...logs.d2.doEvento('despachante.rodada_falhou')]).toEqual([])

      await composeAssincronoOuFalha('start', 'redis-fila')
      // Os jobs que falharam na publicação só voltam quando a reserva vence (30 s).
      await expect.poll(async () => (await contarPorEstado(bancada, ids))['concluido'], { timeout: 90_000, interval: 500 }).toBe(50)

      const execucoes = execucoesPorJob(logs.worker)
      expect(execucoes.size).toBe(50)
      expect([...execucoes.values()].filter((vezes) => vezes !== 1)).toEqual([])
      for (const id of reservadosNaQueda) expect(execucoes.get(id)).toBe(1)
    } finally {
      await app.close()
    }
  }, 180_000)

  it('travado: a publicação desiste no prazo, o laço segue reservando, e ao destravar cada job executa uma vez', async () => {
    bancada = new BancadaDeFila()
    await bancada.limparRegistro()
    const antes = [await bancada.enfileirar(ESCOLA_A), await bancada.enfileirar(ESCOLA_A)]
    const logDespachante = new LogEmMemoria('despachante')
    const logWorker = new LogEmMemoria('worker')

    compose('pause', 'redis-fila')
    const inicio = performance.now()
    bancada.despachante(logDespachante).despachante.iniciar()
    const falhasDe = (id: string) => logDespachante.doEvento('despachante.publicacao_falhou').filter((falha) => (falha['jobIds'] as string[]).includes(id))
    await expect.poll(() => falhasDe(antes[0] ?? '').length, { timeout: 10_000, interval: 50 }).toBe(1)
    const desistiuEmMs = performance.now() - inicio
    expect(desistiuEmMs).toBeGreaterThanOrEqual(TIMEOUT_COMANDO_REDIS_FILA_MS - 100)
    expect(desistiuEmMs).toBeLessThan(TIMEOUT_COMANDO_REDIS_FILA_MS + 2_000)

    // O laço não ficou preso na publicação travada: o job que chega depois também é reservado e tentado.
    const depois = await bancada.enfileirar(ESCOLA_A)
    await expect.poll(() => falhasDe(depois).length, { timeout: 10_000, interval: 50 }).toBe(1)
    const ids = [...antes, depois]
    expect(await contarPorEstado(bancada, ids)).toEqual({ reservado: 3 })

    compose('unpause', 'redis-fila')
    bancada.worker(logWorker)
    await expect.poll(async () => (await contarPorEstado(bancada, ids))['concluido'], { timeout: 60_000, interval: 500 }).toBe(3)
    // A publicação que o Redis travado recebeu e só executou depois não duplica a republicação, com o mesmo jobId.
    const execucoes = execucoesPorJob(logWorker)
    expect(ids.map((id) => execucoes.get(id))).toEqual([1, 1, 1])
    expect(await bancada.fila.getJobCounts('completed', 'waiting', 'active', 'delayed', 'failed')).toEqual({ completed: 3, waiting: 0, active: 0, delayed: 0, failed: 0 })
  }, 120_000)
})
