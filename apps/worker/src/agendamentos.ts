import { executarNoContexto, type Banco, type Enfileirador, type LoggerBase } from '@educa/nucleo'
import { UnrecoverableError, type Job, type Queue } from 'bullmq'
import { randomUUID } from 'node:crypto'
import { TIPO_CONSOLIDAR_USO } from './processadores/consolidar-uso.js'
import { TIPO_EXPURGAR_ACESSO } from './processadores/expurgar-acesso.js'
import { TIPO_EXPURGAR_JOBS } from './processadores/expurgar-jobs.js'

/**
 * A fila do BullMQ onde só moram os disparos agendados. O disparo não executa a rotina: grava o job
 * dela em `job_registro` pelo `Enfileirador`, e dali ela segue a trilha de todo job (despachante, vaga,
 * worker de lote, estado consultável).
 */
export const FILA_DOS_AGENDAMENTOS = 'agendamentos'

/** O fuso do horário dos agendamentos: "2h" é 2h em São Paulo, e não em UTC. */
export const FUSO_DOS_AGENDAMENTOS = 'America/Sao_Paulo'

export interface Agendamento {
  /** O tipo do job gravado, que é também o id do agendador no BullMQ. */
  tipo: string
  /** Cron, no fuso `FUSO_DOS_AGENDAMENTOS`. */
  padrao: string
}

/**
 * As rotinas noturnas do sistema, fora do horário letivo e longe uma da outra. O job nasce não urgente
 * na fila de lote: se o disparo atrasar até a manhã, ele fica segurado pela janela letiva padrão até
 * a aula acabar (regra 80, item 2). O expurgo do acesso (17.0) fica às 4h30: uma hora depois do de jobs e duas e meia
 * antes do primeiro turno.
 */
export const AGENDAMENTOS: readonly Agendamento[] = [
  { tipo: TIPO_CONSOLIDAR_USO, padrao: '0 2 * * *' },
  { tipo: TIPO_EXPURGAR_JOBS, padrao: '30 3 * * *' },
  { tipo: TIPO_EXPURGAR_ACESSO, padrao: '30 4 * * *' },
]

/**
 * Tentativas do disparo (gravar a linha no Postgres) com recuo exponencial a partir de 5 s: com o
 * Postgres fora na hora do disparo, ele tenta de novo por mais de uma hora antes de desistir da noite.
 */
export const TENTATIVAS_DO_DISPARO = 10
const RECUO_DO_DISPARO_MS = 5_000
const UM_DIA_SEGUNDOS = 24 * 60 * 60

/**
 * Registra (ou atualiza) cada agendador no Redis de fila. É idempotente pelo id: as duas réplicas do
 * worker-lote registram o mesmo agendador, e o BullMQ gera um disparo só por horário.
 */
export async function registrarAgendamentos(fila: Pick<Queue, 'upsertJobScheduler'>, agendamentos: readonly Agendamento[] = AGENDAMENTOS): Promise<void> {
  for (const { tipo, padrao } of agendamentos) {
    await fila.upsertJobScheduler(
      tipo,
      { pattern: padrao, tz: FUSO_DOS_AGENDAMENTOS },
      {
        name: tipo,
        data: {},
        opts: {
          attempts: TENTATIVAS_DO_DISPARO,
          backoff: { type: 'exponential', delay: RECUO_DO_DISPARO_MS },
          removeOnComplete: { age: UM_DIA_SEGUNDOS },
          removeOnFail: { age: 7 * UM_DIA_SEGUNDOS },
        },
      },
    )
  }
}

/**
 * O processador da fila de agendamentos: grava o job da rotina em `job_registro`, no contexto da
 * rotina do sistema (sem escola), e devolve o id dele. Tipo que não é um agendamento conhecido não
 * grava nada.
 *
 * Um disparo repetido (a fila entregou de novo) grava um segundo job da mesma rotina. Isso é aceito:
 * as duas rotinas toleram reexecução (D49), e a segunda não muda o que a primeira gravou.
 */
export function criarDisparoDeAgendamento(
  banco: Banco,
  enfileirador: Pick<Enfileirador, 'enfileirar'>,
  logger: LoggerBase,
  agendamentos: readonly Agendamento[] = AGENDAMENTOS,
): (job: Pick<Job, 'name'>) => Promise<string> {
  const tipos = new Set(agendamentos.map(({ tipo }) => tipo))
  return (job) => {
    if (!tipos.has(job.name)) return Promise.reject(new UnrecoverableError('agendamento desconhecido'))
    const tipo = job.name
    return executarNoContexto({ requisicaoId: randomUUID(), rotinaDoSistema: true }, async () => {
      const jobId = await banco.transaction((tx) => enfileirador.enfileirar(tx, { tipo, fila: 'lote', naoUrgente: true, dados: {} }))
      logger.info({ evento: 'agendamento.disparado', tipo, jobId })
      return jobId
    })
  }
}
