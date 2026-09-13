import {
  avisoEspacado,
  ConfiguracaoOperacional,
  ConfiguracaoOperacionalRepository,
  ContadorDeUso,
  criarBanco,
  DONO_DAS_VAGAS_DO_SISTEMA,
  criarClienteRedisDaFila,
  criarPool,
  Enfileirador,
  ExpurgoDeJobsRepository,
  JobRegistroRepository,
  METRICAS,
  nomeDaFilaBullMQ,
  observarPoolDoBanco,
  observarRedis,
  OPCOES_DO_POOL_POR_FILA,
  RETENCAO_JOB_CONCLUIDO_SEGUNDOS,
  RETENCAO_JOB_FALHO_SEGUNDOS,
  relogioDoSistema,
  resolverVagas,
  UsoRepository,
  VagasPorEscola,
  type Banco,
  type Batimento,
  type DadosDoJobNaFila,
  type LoggerBase,
  type Meter,
  type Relogio,
} from '@educa/nucleo'
import type { Fila } from '@educa/shared'
import { Queue, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { AGENDAMENTOS, criarDisparoDeAgendamento, FILA_DOS_AGENDAMENTOS, registrarAgendamentos, type Agendamento } from './agendamentos.js'
import type { ConfiguracaoStorage, ConfiguracaoWorker } from './config.js'
import { ExecutorDeJobs, type Processador } from './executor.js'
import { criarConsolidacaoDeUso, TIPO_CONSOLIDAR_USO } from './processadores/consolidar-uso.js'
import { criarExpurgoDeJobs, TIPO_EXPURGAR_JOBS } from './processadores/expurgar-jobs.js'
import { processarSintetico } from './processadores/sintetico.js'
import { criarClienteS3, MedidorDeStorage } from './storage/medidor-de-storage.js'

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
  /** Relógio do dia de uso (contador e consolidação). Só o teste troca, para marcar às 23h59 e consolidar às 2h. */
  relogio?: Relogio
  /** Agendamentos registrados na réplica de lote. Só o teste troca, para não esperar as 2h. */
  agendamentos?: readonly Agendamento[]
  batimento?: Batimento
  graca?: number
  /**
   * Medidor da telemetria. Com ele, o worker mede o pool, o Redis, o stalled e o job que chega sem vaga;
   * sem ele (os testes que não olham métrica), não mede nada.
   */
  medidor?: Meter
}

export interface WorkerMontado {
  /** Um `Worker` do BullMQ por fila atendida, cada um com o próprio pool. */
  workers: ReadonlyMap<Fila, Worker<DadosDoJobNaFila>>
  /** Só na réplica que atende o lote: a fila dos disparos agendados e o worker que os grava em `job_registro`. */
  agendamentos?: { fila: Queue; worker: Worker }
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
export function montarWorker(config: Omit<ConfiguracaoWorker, 'telemetria'>, logger: LoggerBase, opcoes: OpcoesDaMontagem = {}): WorkerMontado {
  const pool = criarPool(config.banco, () => logger.warn({ evento: 'banco.conexao_ociosa_perdida' }))
  // O BullMQ exige `maxRetriesPerRequest: null` no worker: o comando bloqueante espera o Redis voltar.
  const redis = new Redis(config.redisFilaUrl, { connectionName: 'worker', maxRetriesPerRequest: null })
  const avisarRedisIndisponivel = avisoEspacado(() => logger.warn({ evento: 'worker.redis_indisponivel' }))
  redis.on('error', avisarRedisIndisponivel)
  // As vagas usam outro cliente, sem fila offline e com prazo: Redis fora não pendura o fim do job.
  const redisDasVagas = criarClienteRedisDaFila(config.redisFilaUrl, 'worker-vagas', avisarRedisIndisponivel)
  const banco = criarBanco(pool)
  const relogio = opcoes.relogio ?? relogioDoSistema
  const uso = new ContadorDeUso(redisDasVagas, {
    relogio,
    ...(opcoes.prefixo === undefined ? {} : { prefixo: opcoes.prefixo }),
    aoFalhar: avisoEspacado(() => logger.warn({ evento: 'worker.contador_de_uso_indisponivel' })),
  })
  const { medidor } = opcoes
  if (medidor !== undefined) {
    observarPoolDoBanco(medidor, pool)
    observarRedis(medidor, { fila: [redis, redisDasVagas] })
  }
  const aguardandoVaga = medidor?.createCounter(METRICAS.aguardandoVaga, { description: 'Jobs que chegaram ao worker sem vaga e voltaram a esperar' })
  const stalled = medidor?.createCounter(METRICAS.jobsStalled, { description: 'Jobs devolvidos à espera por lock vencido' })
  const rotinas = config.pools.lote === undefined || config.storage === undefined ? undefined : montarRotinas(config.storage, banco, uso, relogio, logger)
  const executor = new ExecutorDeJobs({
    repositorio: new JobRegistroRepository(banco),
    processadores: opcoes.processadores ?? { ...PROCESSADORES, ...rotinas?.processadores },
    logger,
    uso,
    ...(aguardandoVaga === undefined ? {} : { aoAguardarVaga: (fila: Fila, escolaId: string | null) => aguardandoVaga.add(1, { fila, escola_id: escolaId ?? DONO_DAS_VAGAS_DO_SISTEMA }) }),
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
    // Só a fila: a escola do job não está à mão aqui sem ler o `data`, e o stalled é problema do worker, não da escola.
    if (stalled !== undefined) worker.on('stalled', () => stalled.add(1, { fila }))
    workers.set(fila, worker)
  }

  const agendamentos = rotinas === undefined ? undefined : montarAgendamentos(redis, banco, logger, opcoes.prefixo, opcoes.agendamentos ?? AGENDAMENTOS)

  const batimento = opcoes.batimento
  const pulso = batimento === undefined ? undefined : setInterval(() => batimento.bater(), INTERVALO_BATIMENTO_MS)
  const graca = opcoes.graca ?? GRACA_DO_DESLIGAMENTO_MS

  const encerrar = async (): Promise<void> => {
    if (pulso !== undefined) clearInterval(pulso)
    let prazo: NodeJS.Timeout | undefined
    const estourou = new Promise<'estourou'>((resolver) => {
      prazo = setTimeout(() => resolver('estourou'), graca)
    })
    const fechamento = Promise.all([...workers.values(), ...(agendamentos === undefined ? [] : [agendamentos.worker, agendamentos.fila])].map((aberto) => aberto.close())).then(
      () => 'fechou' as const,
    )
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
    rotinas?.encerrar()
    await pool.end()
  }

  let encerramento: Promise<void> | undefined
  return {
    workers,
    ...(agendamentos === undefined ? {} : { agendamentos }),
    // Uma vez só: o SIGTERM e o fim do teste podem pedir o encerramento juntos.
    encerrar: () => (encerramento ??= encerrar()),
  }
}

/**
 * As rotinas do sistema, que só a réplica de lote executa: consolidação de uso (com o storage) e
 * expurgo de `job_registro`.
 */
function montarRotinas(
  storage: ConfiguracaoStorage,
  banco: Banco,
  contador: ContadorDeUso,
  relogio: Relogio,
  logger: LoggerBase,
): { processadores: Record<string, Processador>; encerrar(): void } {
  const s3 = criarClienteS3(storage)
  return {
    processadores: {
      [TIPO_CONSOLIDAR_USO]: criarConsolidacaoDeUso({
        contador,
        repositorio: new UsoRepository(banco),
        storage: new MedidorDeStorage(s3, storage.bucket),
        relogio,
        logger,
      }),
      [TIPO_EXPURGAR_JOBS]: criarExpurgoDeJobs({ repositorio: new ExpurgoDeJobsRepository(banco), logger }),
    },
    encerrar: () => s3.destroy(),
  }
}

/**
 * A fila dos disparos agendados, com um worker de concorrência 1 que grava o job da rotina pelo
 * `Enfileirador`. O registro dos agendadores não segura o boot: com o Redis de fila fora, ele espera a
 * conexão na fila offline do cliente do BullMQ e completa quando o Redis volta.
 */
function montarAgendamentos(
  redis: Redis,
  banco: Banco,
  logger: LoggerBase,
  prefixo: string | undefined,
  agendamentos: readonly Agendamento[],
): { fila: Queue; worker: Worker } {
  const comPrefixo = prefixo === undefined ? {} : { prefix: prefixo }
  const fila = new Queue(FILA_DOS_AGENDAMENTOS, { connection: redis, ...comPrefixo })
  const avisarErro = avisoEspacado(() => logger.warn({ evento: 'worker.agendamentos_com_erro' }))
  fila.on('error', avisarErro)
  const agendamentosTotal = agendamentos.length
  registrarAgendamentos(fila, agendamentos).then(
    () => logger.info({ evento: 'agendamentos.registrados', agendamentosTotal }),
    () => logger.warn({ evento: 'agendamentos.nao_registrados' }),
  )
  const disparar = criarDisparoDeAgendamento(banco, new Enfileirador(new JobRegistroRepository(banco)), logger, agendamentos)
  const worker = new Worker(FILA_DOS_AGENDAMENTOS, (job) => disparar(job), { connection: redis, concurrency: 1, ...comPrefixo })
  worker.on('error', avisarErro)
  return { fila, worker }
}
