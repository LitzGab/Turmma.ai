import { FILAS, type Fila } from '@educa/shared'

/**
 * As filas do BullMQ, uma por prioridade, na ordem em que o despachante as atende. A prioridade de
 * um job é a fila dele (regra 80, item 2): cada fila tem o próprio pool de workers, então lote
 * nenhum ocupa a vez de um interativo.
 */
export const FILAS_POR_PRIORIDADE: readonly Fila[] = FILAS

/** Nome da fila no BullMQ. É o próprio nome da fila de `job_registro`, para quem lê o Redis. */
export function nomeDaFilaBullMQ(fila: Fila): string {
  return fila
}

export interface OpcoesDoPool {
  /** Quanto o lock do job vale sem renovação. O worker renova na metade. */
  readonly lockDurationMs: number
  /** De quanto em quanto tempo os workers da fila procuram job com lock vencido (réplica morta). */
  readonly stalledIntervalMs: number
}

/**
 * Lock e verificação de stalled por fila. Na interativa e na normal, uma réplica morta com `kill -9`
 * devolve o job em até ~15 s (lock vence em 10 s, verificação a cada 5 s), abaixo do alerta de job
 * interativo esperando 30 s. No lote vale o padrão do BullMQ: job longo, e ninguém esperando na tela.
 *
 * Lock curto só é seguro porque nenhum processador trava o event loop: trabalho de CPU roda em
 * sandbox (15.0), e o worker segue renovando o lock enquanto isso.
 */
export const OPCOES_DO_POOL_POR_FILA: Readonly<Record<Fila, OpcoesDoPool>> = {
  interativa: { lockDurationMs: 10_000, stalledIntervalMs: 5_000 },
  normal: { lockDurationMs: 10_000, stalledIntervalMs: 5_000 },
  lote: { lockDurationMs: 30_000, stalledIntervalMs: 30_000 },
}
