import { z } from 'zod'

/** O formato do apelido do operador, o mesmo do `FORMATO_OPERADOR` do comando e do check do banco. */
const apelidoDoOperador = z.string().regex(/^[a-z][a-z0-9-]{1,31}$/)

/**
 * Corpo de `GET /v1/operacao/eu` (Tech Spec da A0, seção 4): o apelido e o nome do operador da sessão, e nada mais.
 * Estrito: nem id, nem e-mail, nem nada da sessão sai por aqui (seção 7, "DTO de saída").
 */
export const esquemaRespostaEuDoOperador = z
  .object({
    apelido: apelidoDoOperador,
    nome: z.string().min(1).max(200),
  })
  .strict()

export type RespostaEuDoOperador = z.infer<typeof esquemaRespostaEuDoOperador>
