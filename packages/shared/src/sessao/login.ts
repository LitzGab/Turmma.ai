import { z } from 'zod'

/** Maior e-mail aceito, o mesmo teto do check de `conta` no banco. */
export const TAMANHO_MAXIMO_EMAIL = 254
/**
 * Maior senha aceita no login. Sem teto, um corpo com megabytes de senha ocuparia o hash de propósito; nenhuma senha
 * de verdade chega perto disto.
 */
export const TAMANHO_MAXIMO_SENHA = 1_024

/**
 * Etapas do login (Tech Spec, seção 5, "Etapas"):
 * - `pronta`: a sessão foi gravada, e a resposta traz o token de acesso;
 * - `escolher`: a conta tem usuário ativo em mais de uma escola, e a pessoa escolhe em qual entrar (12.0);
 * - `configurar_mfa` e `mfa`: o coordenador configura ou informa o segundo fator antes de entrar (6.0).
 */
export const ETAPAS_DE_LOGIN = ['pronta', 'escolher', 'configurar_mfa', 'mfa'] as const
export type EtapaDeLogin = (typeof ETAPAS_DE_LOGIN)[number]

/** As etapas que ainda não dão sessão: a resposta traz só o desafio que a rota da etapa consome. */
export const ETAPAS_COM_DESAFIO = ['escolher', 'configurar_mfa', 'mfa'] as const satisfies readonly EtapaDeLogin[]
export type EtapaComDesafio = (typeof ETAPAS_COM_DESAFIO)[number]

/** Corpo de `POST /v1/sessao/email`. Estrito: nada além do e-mail e da senha. */
export const esquemaPedidoLoginEmail = z
  .object({
    email: z.string().trim().min(3).max(TAMANHO_MAXIMO_EMAIL),
    senha: z.string().min(1).max(TAMANHO_MAXIMO_SENHA),
  })
  .strict()

export type PedidoLoginEmail = z.infer<typeof esquemaPedidoLoginEmail>

/**
 * Resposta 200 do login. Em `pronta`, o token de acesso de 10 min, que a web guarda só em memória, e o cookie
 * `educa_sessao` de renovação no cabeçalho. Nas outras etapas, só o desafio de 5 min e nenhuma sessão.
 */
export const esquemaRespostaLogin = z.discriminatedUnion('etapa', [
  z.object({ etapa: z.literal('pronta'), token: z.string().min(1), expiraEm: z.iso.datetime() }).strict(),
  z.object({ etapa: z.enum(ETAPAS_COM_DESAFIO), desafio: z.string().min(1) }).strict(),
])

export type RespostaLogin = z.infer<typeof esquemaRespostaLogin>
