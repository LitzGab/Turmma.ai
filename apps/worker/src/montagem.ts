import {
  avisoEspacado,
  ConfiguracaoOperacional,
  ConfiguracaoOperacionalRepository,
  criarBanco,
  criarClienteRedisDaFila,
  criarPool,
  JobRegistroRepository,
  nomeDaFilaBullMQ,
  OPCOES_DO_POOL_POR_FILA,
  RETENCAO_JOB_CONCLUIDO_SEGUNDOS,
  RETENCAO_JOB_FALHO_SEGUNDOS,
  resolverVagas,
  VagasPorEscola,
  type Batimento,
  type DadosDoJobNaFila,
  type LoggerBase,
} from '@educa/nucleo'
import type { Fila } from '@educa/shared'
import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import type { ConfiguracaoWorker } from './config.js'
import { ExecutorDeJobs, type Processador } from './executor.js'
import { processarSintetico } from './processadores/sintetico.js'

/** Quanto o SIGTERM espera os jobs em andamento terminarem antes de fechar à força (Tech Spec, seção 5). */
export const GRACA_DO_DESLIGAMENTO_MS = 30_000
const INTERVALO_BATIMENTO_MS = 2_000

export const PROCESSADORES: Readonly<Record<string, Processador>> = {
  sintetico: processarSintetico,
}

export interface OpcoesDaMontagem {
  processadores?: Readonly<Record<string, Processador>>
  /** Prefixo das chaves do BullMQ e das vagas. Só o teste troca, para não disputar a fila com outro teste. */
  prefixo?: string
  /** Intervalo de renovação da vaga. Só o teste troca, para ver a renovação sem esperar 15 s. */
  intervaloRenovacaoDaVagaMs?: number
  /** Validade da vaga. Só o teste troca, para ver a vaga vencer sem esperar 60 s. */
  validadeDaVagaMs?: number
  batimento?: Batimento
  graca?: number
}

export interface WorkerMontado {
  /** Um `Worker` do BullMQ por fila atendida, cada um com o próprio pool. */
  workers: ReadonlyMap<Fila, Worker<DadosDoJobNaFila>>
  /** `close()` com graça em todos: espera os jobs em andamento até o prazo e só então força. */
  encerrar(): Promise<void>
}

/**
 * Workers BullMQ ligados ao Postgres (pool próprio) e ao Redis de fila, um por fila que a réplica
 * atende (`FILAS`), com a concorrência do pool da fila. Pools separados são o que garante que lote
 * nenhum ocupa a vez do interativo: o `worker-lote` nem consome a fila interativa.
 *
 * O stalled é o do BullMQ, com lock e verificação por fila (`OPCOES_DO_POOL_POR_FILA`): se a réplica
 * morre no meio, o lock vence e outra réplica retoma o job, ainda dono da vaga.
 */
export function montarWorker(config: ConfiguracaoWorker, logger: LoggerBase, opcoes: OpcoesDaMontagem = {}): WorkerMontado {
  const pool = criarPool(config.banco, () => logger.warn({ evento: 'banco.conexao_ociosa_perdida' }))
  // O BullMQ exige `maxRetriesPerRequest: null` no worker: o comando bloqueante espera o Redis voltar.
  const redis = new Redis(config.redisFilaUrl, { connectionName: 'worker', maxRetriesPerRequest: null })
  const avisarRedisIndisponivel = avisoEspacado(() => logger.warn({ evento: 'worker.redis_indisponivel' }))
  redis.on('error', avisarRedisIndisponivel)
  // As vagas usam outro cliente, sem fila offline e com prazo: Redis fora não pendura o fim do job.
  const redisDasVagas = criarClienteRedisDaFila(config.redisFilaUrl, 'worker-vagas', avisarRedisIndisponivel)
  const banco = criarBanco(pool)
  const executor = new ExecutorDeJobs({
    repositorio: new JobRegistroRepository(banco),
    processadores: opcoes.processadores ?? PROCESSADORES,
    logger,
    vagas: new VagasPorEscola(redisDasVagas, opcoes.prefixo, opcoes.validadeDaVagaMs),
    vagasDaEscola: new ConfiguracaoOperacional(new ConfiguracaoOperacionalRepository(banco), (linha) => resolverVagas(config.vagasPadrao, linha), {
      aoFalhar: avisoEspacado(() => logger.warn({ evento: 'worker.configuracao_indisponivel' })),
    }),
    ...(opcoes.intervaloRenovacaoDaVagaMs === undefined ? {} : { intervaloRenovacaoMs: opcoes.intervaloRenovacaoDaVagaMs }),
  })
  const avisarErroDaFila = avisoEspacado(() => logger.warn({ evento: 'worker.fila_com_erro' }))
  const workers = new Map<Fila, Worker<DadosDoJobNaFila>>()
  for (const [fila, concorrencia] of Object.entries(config.pools) as Array<[Fila, number]>) {
    const worker = new Worker<DadosDoJobNaFila>(nomeDaFilaBullMQ(fila), (job, token) => executor.processar(job, token), {
      connection: redis,
      concurrency: concorrencia,
      lockDuration: OPCOES_DO_POOL_POR_FILA[fila].lockDurationMs,
      stalledInterval: OPCOES_DO_POOL_POR_FILA[fila].stalledIntervalMs,
      removeOnComplete: { age: RETENCAO_JOB_CONCLUIDO_SEGUNDOS },
      removeOnFail: { age: RETENCAO_JOB_FALHO_SEGUNDOS },
      ...(opcoes.prefixo === undefined ? {} : { prefix: opcoes.prefixo }),
    })
    worker.on('error', avisarErroDaFila)
    workers.set(fila, worker)
  }

  const batimento = opcoes.batimento
  const pulso = batimento === undefined ? undefined : setInterval(() => batimento.bater(), INTERVALO_BATIMENTO_MS)
  const graca = opcoes.graca ?? GRACA_DO_DESLIGAMENTO_MS

  const encerrar = async (): Promise<void> => {
    if (pulso !== undefined) clearInterval(pulso)
    let prazo: NodeJS.Timeout | undefined
    const estourou = new Promise<'estourou'>((resolver) => {
      prazo = setTimeout(() => resolver('estourou'), graca)
    })
    const fechamento = Promise.all([...workers.values()].map((worker) => worker.close())).then(() => 'fechou' as const)
    const resultado = await Promise.race([fechamento, estourou])
    clearTimeout(prazo)
    if (resultado === 'estourou') {
      // O `close()` em andamento não aceita ser forçado: a conexão cai, o processo sai, e o job
      // interrompido volta pelo stalled em outra réplica. Nada se perde.
      logger.warn({ evento: 'worker.desligamento_forcado' })
      redis.disconnect()
    } else {
      await redis.quit().catch(() => redis.disconnect())
    }
    redisDasVagas.disconnect()
    await pool.end()
  }

  let encerramento: Promise<void> | undefined
  return {
    workers,
    // Uma vez só: o SIGTERM e o fim do teste podem pedir o encerramento juntos.
    encerrar: () => (encerramento ??= encerrar()),
  }
}
