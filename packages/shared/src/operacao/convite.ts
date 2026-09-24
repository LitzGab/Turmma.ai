import { z } from 'zod'
import { TAMANHO_MAXIMO_TOKEN_DE_CONVITE, TAMANHO_MINIMO_SENHA_NOVA } from '../sessao/convite.js'
import { TAMANHO_MAXIMO_SENHA } from '../sessao/login.js'

/** O token do link do convite de operador, no corpo e nunca na URL da API (regra 20, item 8). Mesmo teto do F1. */
const token = z.string().min(1).max(TAMANHO_MAXIMO_TOKEN_DE_CONVITE)

/** Corpo de `POST /v1/operacao/convite/consultar` (Tech Spec da A0, seção 4): só o token do `#` do link. */
export const esquemaPedidoConsultarConviteDeOperador = z.object({ token }).strict()

export type PedidoConsultarConviteDeOperador = z.infer<typeof esquemaPedidoConsultarConviteDeOperador>

/**
 * Resposta de `consultar`: só que o convite vale. Nem o apelido, nem o nome, nem o e-mail do operador: quem tem o link
 * ainda não provou nada. O convite que não vale (usado, vencido, revogado, de operador desativado ou inexistente)
 * responde com o erro de "não encontrado", igual nos cinco casos (C9).
 */
export const esquemaRespostaConsultarConviteDeOperador = z.object({ valido: z.literal(true) }).strict()

export type RespostaConsultarConviteDeOperador = z.infer<typeof esquemaRespostaConsultarConviteDeOperador>

/**
 * Corpo de `POST /v1/operacao/convite/aceitar`: o token e a senha nova, com as regras do convite do F1 (de 12 a 1.024
 * caracteres). A senha é sempre exigida: o convite do operador é também o caminho de recuperar a conta (PRD da A0,
 * seção 3), e sempre grava a senha que vier.
 */
export const esquemaPedidoAceitarConviteDeOperador = z
  .object({
    token,
    senha: z.string().min(TAMANHO_MINIMO_SENHA_NOVA).max(TAMANHO_MAXIMO_SENHA),
  })
  .strict()

export type PedidoAceitarConviteDeOperador = z.infer<typeof esquemaPedidoAceitarConviteDeOperador>

/**
 * Resposta de `aceitar`: a etapa `configurar_mfa` e o desafio de operador (`desafio-operador+jwt`, 5 min) que leva a
 * ela, sem sessão e sem cookie. Sai com `no-store`. Nada mais: nem o operador, nem o convite.
 */
export const esquemaRespostaAceitarConviteDeOperador = z
  .object({
    etapa: z.literal('configurar_mfa'),
    desafio: z.string().min(1),
  })
  .strict()

export type RespostaAceitarConviteDeOperador = z.infer<typeof esquemaRespostaAceitarConviteDeOperador>
