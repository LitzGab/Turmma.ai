import { z } from 'zod'
import { PAPEIS_DE_USUARIO } from '../permissao/matriz.js'

/**
 * Um acesso da conta, para o seletor de escola (RF14, tarefa 12.0): o usuário ativo, o nome da escola e o papel nela.
 * Nada além disso da outra escola: nem id dela, nem turma, nem vínculo.
 */
export const esquemaAcessoDaConta = z.object({ usuarioId: z.uuid(), escolaNome: z.string().min(1), papel: z.enum(PAPEIS_DE_USUARIO) }).strict()

export type AcessoDaConta = z.infer<typeof esquemaAcessoDaConta>

/**
 * Corpo de `GET /v1/eu`: quem está na sessão, na escola da sessão, e os minutos sem uso até ela vencer. Estrito: nada
 * além destes campos, e nenhum e-mail (a conta da equipe não sai aqui). `acessos` lista os usuários ativos da conta da
 * sessão, este incluído; o aluno não tem conta, e para ele vem vazio.
 */
export const esquemaRespostaEu = z
  .object({
    usuarioId: z.uuid(),
    papel: z.enum(PAPEIS_DE_USUARIO),
    nome: z.string().min(1),
    escola: z.object({ id: z.uuid(), nome: z.string().min(1), slug: z.string().min(1) }).strict(),
    inatividadeMin: z.number().int().positive(),
    acessos: z.array(esquemaAcessoDaConta),
  })
  .strict()

export type RespostaEu = z.infer<typeof esquemaRespostaEu>
