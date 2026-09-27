import type { EntradaDaSala } from '../sessao/acesso-da-sala.js'
import { hashDoToken } from '../sessao/hash-do-token.js'
import { hmacDoCodigoDaTurma } from './codigo-da-sala.js'

/**
 * Como o `AcessoDaSala` procura a sala do pedido: o SHA-256 do token do link, ou o HMAC do código digitado com a chave da
 * sala. O abrir e o reivindicar chegam do mesmo jeito, pelo slug e por um dos dois.
 */
export function entradaDaSala(pedido: { readonly slug: string } & ({ readonly token: string } | { readonly codigo: string }), chaveCodigo: Uint8Array): EntradaDaSala {
  return 'token' in pedido ? { slug: pedido.slug, tokenHash: hashDoToken(pedido.token) } : { slug: pedido.slug, codigoHmac: hmacDoCodigoDaTurma(chaveCodigo, pedido.codigo) }
}
