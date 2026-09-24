import { z } from 'zod'
import { FORMATO_SLUG, TAMANHO_MAXIMO_SLUG, TIPOS_DE_REDE } from '../estrutura/rede-e-escola.js'
import { TAMANHO_MAXIMO_EMAIL } from '../sessao/login.js'

/** O maior nome de rede, de escola ou de pessoa convidada: o teto do check de `usuario.nome`, `rede.nome` e `escola.nome`. */
export const TAMANHO_MAXIMO_NOME_DIGITADO = 200

/** Quantas redes, no máximo, o `GET /v1/operacao/redes` devolve (Tech Spec da A0b, seção 4). */
export const MAXIMO_DE_REDES_DO_PAINEL = 200

/**
 * Nome de rede, de escola ou da pessoa convidada, digitado pelo operador no painel ou no `ops:*`: texto de uma linha, sem
 * caractere de controle, sem espaço nas pontas.
 */
export const esquemaNomeDigitado = z
  .string()
  .trim()
  .min(1)
  .max(TAMANHO_MAXIMO_NOME_DIGITADO)
  .regex(/^[^\p{Cc}]+$/u)

/**
 * O id que a web sorteia ao abrir o diálogo de rede ou de escola e manda no pedido (Tech Spec da A0b, seção 5,
 * "Idempotência"): o clique duplo repete o mesmo id, e o servidor devolve o que já criou. Só UUID v4 ou v7, os que se
 * sorteiam: nada de id escolhido à mão, sequencial ou nulo (regra 10, item 7).
 */
export const esquemaIdDoPedido = z.union([z.uuidv4(), z.uuidv7()])

/** Endereço da escola (`/e/<slug>`), com o formato e o tamanho do check de `escola.slug`. */
export const esquemaSlugDaEscola = z.string().max(TAMANHO_MAXIMO_SLUG).regex(FORMATO_SLUG)

/**
 * Corpo de `POST /v1/operacao/redes`. Estrito: campo a mais, como `autor`, é `ENTRADA_INVALIDA`. O autor da auditoria é
 * sempre o operador da sessão, conferido dentro da transação, nunca o corpo (RF6).
 */
export const esquemaPedidoCriarRede = z.strictObject({
  id: esquemaIdDoPedido,
  nome: esquemaNomeDigitado,
  tipo: z.enum(TIPOS_DE_REDE),
})

export type PedidoCriarRede = z.infer<typeof esquemaPedidoCriarRede>

/** Corpo de `POST /v1/operacao/escolas`. Estrito, como o da rede. O slug não muda depois de criado. */
export const esquemaPedidoCriarEscola = z.strictObject({
  id: esquemaIdDoPedido,
  redeId: z.uuid(),
  nome: esquemaNomeDigitado,
  slug: esquemaSlugDaEscola,
})

export type PedidoCriarEscola = z.infer<typeof esquemaPedidoCriarEscola>

/** Resposta de `POST /v1/operacao/redes` e `/escolas`: só o id, o mesmo no pedido repetido. */
export const esquemaRespostaCriadoNoPainel = z.strictObject({ id: z.uuid() })

export type RespostaCriadoNoPainel = z.infer<typeof esquemaRespostaCriadoNoPainel>

/** Uma rede na lista do painel: id, nome e tipo, e nada de escola nem de pessoa. */
export const esquemaRedeDoPainel = z.strictObject({
  id: z.uuid(),
  nome: z.string().min(1).max(TAMANHO_MAXIMO_NOME_DIGITADO),
  tipo: z.enum(TIPOS_DE_REDE),
})

export type RedeDoPainel = z.infer<typeof esquemaRedeDoPainel>

/** Resposta de `GET /v1/operacao/redes`: até 200 redes, por nome, para o diálogo Nova escola. */
export const esquemaRespostaRedesDoPainel = z.strictObject({
  itens: z.array(esquemaRedeDoPainel).max(MAXIMO_DE_REDES_DO_PAINEL),
})

export type RespostaRedesDoPainel = z.infer<typeof esquemaRespostaRedesDoPainel>

/**
 * O estado da primeira coordenação de uma escola (Tech Spec da A0b, seção 5), que decide o que gerar, refazer e revogar
 * fazem, e que a lista mostra. Calculado só por `estadoDaCoordenacao`, em `@educa/nucleo`: a escrita e a lista usam a
 * mesma função.
 */
export const ESTADOS_DA_COORDENACAO = ['sem_convite', 'pendente', 'vencido', 'revogado', 'aceito', 'sem_coordenacao', 'ativa'] as const

export type EstadoDaCoordenacao = (typeof ESTADOS_DA_COORDENACAO)[number]

/**
 * O e-mail da pessoa convidada, digitado no painel ou no `ops:convite-coordenador`: sem espaço nas pontas, em minúsculas
 * (como o login o procura), no formato de e-mail e até 254.
 */
export const esquemaEmailConvidado = z.string().trim().toLowerCase().pipe(z.email().max(TAMANHO_MAXIMO_EMAIL))

/**
 * Corpo de `POST /v1/operacao/escolas/:id/convite-coordenacao`: o nome e o e-mail da primeira coordenadora. Estrito: campo
 * a mais, como `autor` ou `escolaId`, é `ENTRADA_INVALIDA`. A escola vem do caminho; o autor, da sessão.
 */
export const esquemaPedidoConviteDaCoordenacao = z.strictObject({
  nome: esquemaNomeDigitado,
  email: esquemaEmailConvidado,
})

export type PedidoConviteDaCoordenacao = z.infer<typeof esquemaPedidoConviteDaCoordenacao>

/** O token do convite: 32 bytes sorteados, em base64url sem preenchimento. */
const FORMATO_DO_TOKEN_DE_CONVITE = /^[A-Za-z0-9_-]{43}$/

/**
 * Resposta do gerar (`POST /v1/operacao/escolas/:id/convite-coordenacao`) e do refazer
 * (`POST /v1/operacao/convites/:id/refazer`): o id do convite novo (que o refazer e o revogar recebem) e o token, que só
 * existe nesta resposta (o banco guarda o SHA-256). A web monta o link `/convite#<token>`. Sai com `no-store`. Estrito:
 * nada da pessoa.
 */
export const esquemaRespostaConviteDaCoordenacao = z.strictObject({
  conviteId: z.uuid(),
  token: z.string().regex(FORMATO_DO_TOKEN_DE_CONVITE),
})

export type RespostaConviteDaCoordenacao = z.infer<typeof esquemaRespostaConviteDaCoordenacao>
