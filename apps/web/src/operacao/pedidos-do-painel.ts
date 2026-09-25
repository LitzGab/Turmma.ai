import {
  esquemaPedidoConviteDaCoordenacao,
  esquemaPedidoCriarEscola,
  esquemaPedidoCriarRede,
  type PedidoConviteDaCoordenacao,
  type PedidoCriarEscola,
  type PedidoCriarRede,
  type TipoDeRede,
} from '@educa/shared'
import { REGRA_DO_ENDERECO, TEXTO_DO_EMAIL_INVALIDO, TEXTO_DO_NOME_INVALIDO } from './textos'

/**
 * O id do pedido de rede ou de escola (Tech Spec da A0b, seção 5, "Idempotência"): um UUID v4, sorteado quando o diálogo
 * abre e esquecido quando ele fecha. O clique duplo e a nova tentativa depois de uma resposta perdida mandam o mesmo id,
 * e o servidor devolve o que já criou em vez de criar outra.
 *
 * Pelo `crypto.getRandomValues`, e não pelo `crypto.randomUUID`: o segundo só existe em contexto seguro, e o sorteio não
 * pode depender de como o endereço foi aberto.
 */
export function sortearIdDoPedido(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  // Versão 4 no nibble alto do byte 6, e a variante RFC 4122 (`10xx`) no byte 8.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** O pedido pronto para enviar, ou o texto de cada campo que não passa no contrato. */
export type Validacao<Pedido, Campo extends string> = { readonly ok: true; readonly pedido: Pedido } | { readonly ok: false; readonly erros: Readonly<Partial<Record<Campo, string>>> }

export type CampoDaRede = 'nome'
export type CampoDaEscola = 'redeId' | 'nome' | 'slug'
export type CampoDoConvite = 'nome' | 'email'

const TEXTO_DO_CAMPO_DA_REDE: Readonly<Record<CampoDaRede, string>> = { nome: TEXTO_DO_NOME_INVALIDO }

const TEXTO_DO_CAMPO_DA_ESCOLA: Readonly<Record<CampoDaEscola, string>> = {
  redeId: 'Escolha a rede da escola.',
  nome: TEXTO_DO_NOME_INVALIDO,
  slug: REGRA_DO_ENDERECO,
}

const TEXTO_DO_CAMPO_DO_CONVITE: Readonly<Record<CampoDoConvite, string>> = {
  nome: TEXTO_DO_NOME_INVALIDO,
  email: TEXTO_DO_EMAIL_INVALIDO,
}

/**
 * Os campos que o contrato recusou, com o texto de cada um. Só os campos digitados têm texto: o id e o tipo vêm da tela,
 * nunca do que se digitou.
 */
function errosDos<Campo extends string>(caminhos: readonly (readonly PropertyKey[])[], textos: Readonly<Record<Campo, string>>): Partial<Record<Campo, string>> {
  const erros: Partial<Record<Campo, string>> = {}
  const campos = Object.keys(textos) as Campo[]
  for (const caminho of caminhos) {
    const campo = campos.find((nome) => nome === caminho[0])
    if (campo !== undefined) erros[campo] = textos[campo]
  }
  return erros
}

/**
 * O pedido de `POST /v1/operacao/redes`, lido pelo **mesmo** contrato estrito que a API usa: o que sai daqui é o que o
 * servidor aceita, e o nome vai sem os espaços das pontas. É isso que faz a nova tentativa mandar os mesmos dados com o
 * mesmo id — com o nome cru, " Rede X" e "Rede X" seriam dois pedidos diferentes para o mesmo id, e a segunda tentativa
 * voltaria `CONFLITO`.
 */
export function pedidoDeRede(id: string, campos: { readonly nome: string; readonly tipo: TipoDeRede }): Validacao<PedidoCriarRede, CampoDaRede> {
  const lido = esquemaPedidoCriarRede.safeParse({ id, nome: campos.nome, tipo: campos.tipo })
  if (lido.success) return { ok: true, pedido: lido.data }
  return { ok: false, erros: errosDos(lido.error.issues.map((problema) => problema.path), TEXTO_DO_CAMPO_DA_REDE) }
}

/** O pedido de `POST /v1/operacao/escolas`, pelo mesmo contrato da API, como o da rede. */
export function pedidoDeEscola(id: string, campos: { readonly redeId: string; readonly nome: string; readonly slug: string }): Validacao<PedidoCriarEscola, CampoDaEscola> {
  const lido = esquemaPedidoCriarEscola.safeParse({ id, redeId: campos.redeId, nome: campos.nome, slug: campos.slug.trim() })
  if (lido.success) return { ok: true, pedido: lido.data }
  return { ok: false, erros: errosDos(lido.error.issues.map((problema) => problema.path), TEXTO_DO_CAMPO_DA_ESCOLA) }
}

/**
 * O pedido de `POST /v1/operacao/escolas/:id/convite-coordenacao` (tarefa 7.0), pelo mesmo contrato estrito da API: o
 * nome sem os espaços das pontas e o e-mail em minúsculas, como o login o procura. O resumo antes de gerar mostra o que
 * sai daqui, e não o que foi digitado.
 */
export function pedidoDeConvite(campos: { readonly nome: string; readonly email: string }): Validacao<PedidoConviteDaCoordenacao, CampoDoConvite> {
  const lido = esquemaPedidoConviteDaCoordenacao.safeParse({ nome: campos.nome, email: campos.email })
  if (lido.success) return { ok: true, pedido: lido.data }
  return { ok: false, erros: errosDos(lido.error.issues.map((problema) => problema.path), TEXTO_DO_CAMPO_DO_CONVITE) }
}
