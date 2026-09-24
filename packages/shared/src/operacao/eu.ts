import { z } from 'zod'

/**
 * Identificador curto da pessoa da nossa equipe (`joaquim`, `gabriel-s`): o apelido do operador e o `OPERADOR` dos
 * comandos `ops:*`, que vai para `auditoria.autor_operador`. É a única definição: os checks do banco
 * (`operador_apelido_formato`, `auditoria_operador_formato` e `auditoria_operacao_autor_formato`) são gerados desta
 * expressão, e um teste compara o que está no banco com ela.
 */
export const FORMATO_OPERADOR = /^[a-z][a-z0-9-]{1,31}$/

const apelidoDoOperador = z.string().regex(FORMATO_OPERADOR)

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
