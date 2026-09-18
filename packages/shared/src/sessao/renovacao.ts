import { z } from 'zod'

/**
 * Resposta 200 de `POST /v1/sessao/renovar`: o token de acesso novo, de 10 min, que a web guarda só em memória. O
 * cookie `educa_sessao` novo vai no cabeçalho, nunca no corpo.
 */
export const esquemaRespostaRenovacao = z.object({ token: z.string().min(1), expiraEm: z.iso.datetime() }).strict()

export type RespostaRenovacao = z.infer<typeof esquemaRespostaRenovacao>
