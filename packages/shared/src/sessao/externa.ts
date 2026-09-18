/**
 * O login pela conta Google ou Microsoft da escola (13.0) termina num redirecionamento à web, e nunca num corpo JSON:
 * quem chega ao retorno é o navegador, vindo do provedor. A falha vai no parâmetro `falha` do endereço da escola
 * (`/e/:slug?falha=...`), e a tela (19.0) mostra o que fazer.
 *
 * - `provedor`: o Google ou a Microsoft responderam com erro (a escola não liberou o app, a pessoa cancelou), não
 *   responderam a tempo, ou o retorno chegou sem o cookie do início. A tela oferece a matrícula ou o e-mail.
 * - `conta_externa_nao_ligada`: a conta não é de um domínio ou tenant da escola, ou não está ligada a ninguém dela
 *   (`CONTA_EXTERNA_NAO_LIGADA`). É a mesma para todos os casos, para não dizer qual deles aconteceu.
 */
export const FALHAS_DO_LOGIN_EXTERNO = ['provedor', 'conta_externa_nao_ligada'] as const
export type FalhaDoLoginExterno = (typeof FALHAS_DO_LOGIN_EXTERNO)[number]

/** O parâmetro do endereço da web que leva a falha do login pela conta da escola. */
export const PARAMETRO_DA_FALHA_DO_LOGIN_EXTERNO = 'falha'
