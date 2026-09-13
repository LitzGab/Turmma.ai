import { contextoAtual, LOTE_DO_EXPURGO, type ExpurgoDeJobsRepository, type LoggerBase } from '@educa/nucleo'
import { CodigoDeFalhaDeJob } from '@educa/shared'
import type { Processador } from '../executor.js'
import { FalhaDeJob } from '../falha-de-job.js'

export const TIPO_EXPURGAR_JOBS = 'sistema.expurgar-jobs'

export interface DependenciasDoExpurgo {
  repositorio: Pick<ExpurgoDeJobsRepository, 'apagarLoteVencido'>
  logger: LoggerBase
  /** Linhas por lote. Só o teste troca. */
  lote?: number
}

/**
 * `sistema.expurgar-jobs`: apaga de `job_registro` o job concluído ou falho há mais de 7 dias, um lote
 * de 5.000 por instrução, até sobrar lote incompleto. Cada lote é uma transação curta, então o
 * expurgo de uma noite com 100 mil linhas não segura lock que atrase o despachante.
 *
 * Tolera reexecução (D49): o que já saiu não volta, e apagar de novo não apaga nada. Duas execuções ao
 * mesmo tempo pegam linhas diferentes; o lote de um worker que morreu no meio é desfeito pelo Postgres
 * e sai na execução seguinte.
 */
export function criarExpurgoDeJobs({ repositorio, logger, lote = LOTE_DO_EXPURGO }: DependenciasDoExpurgo): Processador {
  return async () => {
    if (contextoAtual()?.rotinaDoSistema !== true) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
    let total = 0
    let lotesTotal = 0
    for (;;) {
      const apagadas = await repositorio.apagarLoteVencido(lote)
      total += apagadas
      lotesTotal += 1
      if (apagadas < lote) break
    }
    logger.info({ evento: 'job_registro.expurgado', total, lotesTotal })
  }
}
