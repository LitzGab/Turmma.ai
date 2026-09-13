import { z } from 'zod'

/**
 * Corpo de `GET /v1/sistema/contexto`: a escola e o usuário que a API leu do token verificado.
 * Só ids. O parse descarta qualquer outro campo, então nada além destes dois sai na resposta.
 */
export const esquemaRespostaContexto = z.object({
  escolaId: z.uuid(),
  usuarioId: z.uuid(),
})

export type RespostaContexto = z.infer<typeof esquemaRespostaContexto>
