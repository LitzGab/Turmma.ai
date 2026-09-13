import { z } from 'zod'
import { CODIGOS_DE_FALHA_DE_JOB, ESTADOS_DE_JOB, FILAS } from './jobs.js'

/** Teto do trabalho simulado por um job sintético: o bastante para o cenário de carga e para o teste de queda. */
export const CPU_MS_MAXIMO_SINTETICO = 60_000

/**
 * Corpo de `POST /v1/sistema/jobs-sinteticos`. Estrito: `tipo` e `escolaId` no corpo são
 * recusados, e não ignorados. O tipo é sempre o do job sintético, e a escola vem só do token
 * (regra 10, item 3).
 */
export const esquemaPedidoJobSintetico = z
  .object({
    fila: z.enum(FILAS),
    cpuMs: z.number().int().min(0).max(CPU_MS_MAXIMO_SINTETICO),
    naoUrgente: z.boolean(),
    falhar: z.boolean().optional(),
  })
  .strict()

export type PedidoJobSintetico = z.infer<typeof esquemaPedidoJobSintetico>

/** Resposta 202 do `POST`: o job foi gravado e ainda vai ser executado. */
export const esquemaRespostaJobAceito = z.object({ jobId: z.uuid() }).strict()
export type RespostaJobAceito = z.infer<typeof esquemaRespostaJobAceito>

/**
 * Corpo de `GET /v1/sistema/jobs-sinteticos/:id`, lido de `job_registro`. Só estado e datas: nem
 * os dados do job, nem a escola, nem o motivo em texto livre.
 */
export const esquemaRespostaEstadoDeJob = z
  .object({
    estado: z.enum(ESTADOS_DE_JOB),
    criadoEm: z.iso.datetime(),
    iniciadoEm: z.iso.datetime().optional(),
    concluidoEm: z.iso.datetime().optional(),
    codigoFalha: z.enum(CODIGOS_DE_FALHA_DE_JOB).optional(),
  })
  .strict()

export type RespostaEstadoDeJob = z.infer<typeof esquemaRespostaEstadoDeJob>
