import {
  avisoEspacado,
  criarBanco,
  criarPool,
  JobRegistroRepository,
  NOME_DA_FILA_DE_JOBS,
  RETENCAO_JOB_CONCLUIDO_SEGUNDOS,
  RETENCAO_JOB_FALHO_SEGUNDOS,
  type Batimento,
  type DadosDoJobNaFila,
  type LoggerBase,
} from '@educa/nucleo'
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
  /** Prefixo das chaves do BullMQ. Só o teste troca, para não disputar a fila com outro teste. */
  prefixo?: string
  batimento?: Batimento
  graca?: number
}

export interface WorkerMontado {
  worker: Worker<DadosDoJobNaFila>
  /** `worker.close()` com graça: espera os jobs em andamento até o prazo e só então força. */
  encerrar(): Promise<void>
}

/**
 * Worker BullMQ ligado ao Postgres (pool próprio) e ao Redis de fila. O stalled é o padrão do
 * BullMQ: se a réplica morre no meio, o lock vence e outra réplica retoma o job.
 */
export function montarWorker(config: ConfiguracaoWorker, logger: LoggerBase, opcoes: OpcoesDaMontagem = {}): WorkerMontado {
  const pool = criarPool(config.banco, () => logger.warn({ evento: 'banco.conexao_ociosa_perdida' }))
  // O BullMQ exige `maxRetriesPerRequest: null` no worker: o comando bloqueante espera o Redis voltar.
  const redis = new Redis(config.redisFilaUrl, { connectionName: 'worker', maxRetriesPerRequest: null })
  redis.on('error', avisoEspacado(() => logger.warn({ evento: 'worker.redis_indisponivel' })))
  const executor = new ExecutorDeJobs(new JobRegistroRepository(criarBanco(pool)), opcoes.processadores ?? PROCESSADORES, logger)
  const worker = new Worker<DadosDoJobNaFila>(NOME_DA_FILA_DE_JOBS, (job) => executor.processar(job), {
    connection: redis,
    concurrency: config.concorrencia,
    removeOnComplete: { age: RETENCAO_JOB_CONCLUIDO_SEGUNDOS },
    removeOnFail: { age: RETENCAO_JOB_FALHO_SEGUNDOS },
    ...(opcoes.prefixo === undefined ? {} : { prefix: opcoes.prefixo }),
  })
  worker.on('error', avisoEspacado(() => logger.warn({ evento: 'worker.fila_com_erro' })))

  const batimento = opcoes.batimento
  const pulso = batimento === undefined ? undefined : setInterval(() => batimento.bater(), INTERVALO_BATIMENTO_MS)
  const graca = opcoes.graca ?? GRACA_DO_DESLIGAMENTO_MS

  const encerrar = async (): Promise<void> => {
    if (pulso !== undefined) clearInterval(pulso)
    let prazo: NodeJS.Timeout | undefined
    const estourou = new Promise<'estourou'>((resolver) => {
      prazo = setTimeout(() => resolver('estourou'), graca)
    })
    const resultado = await Promise.race([worker.close().then(() => 'fechou' as const), estourou])
    clearTimeout(prazo)
    if (resultado === 'estourou') {
      // O `close()` em andamento não aceita ser forçado: a conexão cai, o processo sai, e o job
      // interrompido volta pelo stalled em outra réplica. Nada se perde.
      logger.warn({ evento: 'worker.desligamento_forcado' })
      redis.disconnect()
    } else {
      await redis.quit().catch(() => redis.disconnect())
    }
    await pool.end()
  }

  let encerramento: Promise<void> | undefined
  return {
    worker,
    // Uma vez só: o SIGTERM e o fim do teste podem pedir o encerramento juntos.
    encerrar: () => (encerramento ??= encerrar()),
  }
}
