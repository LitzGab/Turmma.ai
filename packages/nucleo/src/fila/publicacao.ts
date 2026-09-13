import { z } from 'zod'

/**
 * A fila única do BullMQ até a 9.0, que a divide em `interativa`, `normal` e `lote`. O job leva a
 * fila e a prioridade gravadas em `job_registro` desde já.
 */
export const NOME_DA_FILA_DE_JOBS = 'jobs'

/** Tentativas antes de o job falhar de vez (Tech Spec, seção 5, "Retentativa"). */
export const TENTATIVAS_DE_JOB = 5
/** Recuo exponencial a partir de 2 s: 2, 4, 8 e 16 s entre as cinco tentativas. */
export const RECUO_INICIAL_JOB_MS = 2_000
/**
 * Fração do recuo sorteada para baixo: com 0,5, a espera cai entre metade e o valor cheio. Sem
 * isso, mil jobs que falharam juntos por causa de uma dependência voltam todos no mesmo instante.
 */
export const JITTER_DO_RECUO = 0.5

/** Quanto tempo o BullMQ guarda o job terminado. É o que ainda deduplica um reenvio com o mesmo `jobId`. */
export const RETENCAO_JOB_CONCLUIDO_SEGUNDOS = 24 * 60 * 60
export const RETENCAO_JOB_FALHO_SEGUNDOS = 7 * 24 * 60 * 60

/** Opções de todo job publicado. O `jobId` é o id de `job_registro`, e é ele que torna o reenvio inofensivo. */
export const OPCOES_DE_JOB_PUBLICADO = {
  attempts: TENTATIVAS_DE_JOB,
  backoff: { type: 'exponential', delay: RECUO_INICIAL_JOB_MS, jitter: JITTER_DO_RECUO },
} as const

/**
 * O que vai no `data` do job no Redis: só a escola e a requisição, copiadas da linha persistida
 * pelo despachante. Os dados do trabalho o worker lê do Postgres, dentro do escopo da escola.
 */
export const esquemaDadosDoJobNaFila = z
  .object({
    escolaId: z.uuid().nullable(),
    requisicaoId: z.uuid().nullable(),
  })
  .strict()

export type DadosDoJobNaFila = z.infer<typeof esquemaDadosDoJobNaFila>
