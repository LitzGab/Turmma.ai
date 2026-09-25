import { z } from 'zod'
import { TAMANHO_MAXIMO_SENHA } from './login.js'

/**
 * Menor senha aceita quando a pessoa define a dela, no aceite do convite. É mais que o mínimo de 8 do NIST para senha
 * com segundo fator, e o coordenador ainda configura o MFA logo depois. O login não tem mínimo: ele só confere.
 */
export const TAMANHO_MINIMO_SENHA_NOVA = 12

/**
 * Maior token aceito no corpo. O token de verdade tem 43 caracteres (32 bytes em base64url); o teto só impede que um
 * corpo enorme chegue ao hash. Token de outro formato é tratado como inexistente, com a mesma resposta.
 */
export const TAMANHO_MAXIMO_TOKEN_DE_CONVITE = 128

/**
 * Validade do convite da coordenação, contada da criação (Tech Spec do F1, seção 3). Aqui, e não só no banco, porque o
 * painel da operação a mostra no resumo antes de gerar (A0b, tarefa 7.0): o número dito é o mesmo que o banco aplica.
 */
export const VALIDADE_DO_CONVITE_HORAS = 72

const token = z.string().min(1).max(TAMANHO_MAXIMO_TOKEN_DE_CONVITE)

/**
 * Corpo de `POST /v1/convites/consultar`. O token vai sempre no corpo, nunca na URL da API, que fica em log de borda e
 * no histórico (regra 20, item 8).
 */
export const esquemaPedidoConsultarConvite = z.object({ token }).strict()

export type PedidoConsultarConvite = z.infer<typeof esquemaPedidoConsultarConvite>

/** Resposta de `consultar`: só o nome da escola que convida. Nunca o nome nem o e-mail do convidado. */
export const esquemaRespostaConsultarConvite = z.object({ escolaNome: z.string().min(1) }).strict()

export type RespostaConsultarConvite = z.infer<typeof esquemaRespostaConsultarConvite>

/**
 * Corpo de `POST /v1/convites/aceitar`: o token e, para quem ainda não tem conta com senha, a senha nova. Para quem já
 * tem (trabalha em outra escola cliente), a senha é ignorada: o link nunca troca a senha de uma conta existente.
 */
export const esquemaPedidoAceitarConvite = z
  .object({
    token,
    senha: z.string().min(TAMANHO_MINIMO_SENHA_NOVA).max(TAMANHO_MAXIMO_SENHA).optional(),
  })
  .strict()

export type PedidoAceitarConvite = z.infer<typeof esquemaPedidoAceitarConvite>

/**
 * Resposta de `aceitar` (Tech Spec, seção 5, "Convite"):
 * - `configurar_mfa`: a conta era nova, a senha foi definida e o usuário ativado; o desafio leva à configuração do MFA
 *   (RF12), sem sessão e sem cookie;
 * - `entrar`: a conta já tinha senha; a web leva ao `/entrar` com o `bilhete` (30 min), que vai no corpo do login por
 *   e-mail. O usuário da escola só é ativado pelo login com a senha e o segundo fator que a conta já tem e com esse
 *   bilhete: sem ele, o login da conta nunca ativa o convite.
 */
export const esquemaRespostaAceitarConvite = z.discriminatedUnion('etapa', [
  z.object({ etapa: z.literal('configurar_mfa'), desafio: z.string().min(1) }).strict(),
  z.object({ etapa: z.literal('entrar'), bilhete: z.string().min(1) }).strict(),
])

export type RespostaAceitarConvite = z.infer<typeof esquemaRespostaAceitarConvite>
