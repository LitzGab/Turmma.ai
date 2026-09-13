import { CodigoDeFalhaDeJob, CPU_MS_MAXIMO_SINTETICO } from '@educa/shared'
import { setTimeout as esperar } from 'node:timers/promises'
import { z } from 'zod'
import { FalhaDeJob } from '../falha-de-job.js'

const esquemaDados = z.object({
  cpuMs: z.number().int().min(0).max(CPU_MS_MAXIMO_SINTETICO),
  falhar: z.boolean(),
})

/**
 * Job sintético, para teste e carga. Aqui só ocupa o tempo pedido, sem prender o event loop (o
 * worker precisa renovar o lock do job enquanto isso). Queimar CPU de verdade, em sandbox, é da 15.0.
 */
export async function processarSintetico(dados: Record<string, unknown>): Promise<void> {
  const leitura = esquemaDados.safeParse(dados)
  if (!leitura.success) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
  await esperar(leitura.data.cpuMs)
  if (leitura.data.falhar) throw new FalhaDeJob(CodigoDeFalhaDeJob.FALHA_SINTETICA)
}
