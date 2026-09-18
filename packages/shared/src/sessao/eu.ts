import { z } from 'zod'
import { PAPEIS_DE_USUARIO } from '../permissao/matriz.js'

/**
 * Corpo de `GET /v1/eu`: quem está na sessão, na escola da sessão, e os minutos sem uso até ela vencer. Estrito: nada
 * além destes campos, e nenhum e-mail (a conta da equipe não sai aqui). `acessos` entra na tarefa 12.0.
 */
export const esquemaRespostaEu = z
  .object({
    usuarioId: z.uuid(),
    papel: z.enum(PAPEIS_DE_USUARIO),
    nome: z.string().min(1),
    escola: z.object({ id: z.uuid(), nome: z.string().min(1), slug: z.string().min(1) }).strict(),
    inatividadeMin: z.number().int().positive(),
  })
  .strict()

export type RespostaEu = z.infer<typeof esquemaRespostaEu>
