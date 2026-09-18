import type { Ambiente } from '@educa/nucleo'

/** Cookie de renovação da sessão: o refresh aleatório, cujo SHA-256 é o `refresh_hash` da `sessao`. */
export const COOKIE_SESSAO = 'educa_sessao'
/** Cookie de prioridade de login: HMACs das contas que já entraram neste navegador (`cookie-dispositivo.ts`). */
export const COOKIE_DISPOSITIVO = 'educa_dispositivo'
/** Os dois só vão às rotas de sessão: nenhuma outra rota da API recebe o refresh nem o dispositivo. */
export const CAMINHO_DOS_COOKIES = '/v1/sessao'

// Nome de cookie e valor que nós mesmos escrevemos: sem espaço, aspas, vírgula, ponto e vírgula nem barra invertida.
const VALOR_SEGURO = /^[\w.:~-]*$/

export interface OpcoesDoCookie {
  readonly ambiente: Ambiente
  /** Sem ele, o cookie é de sessão do navegador: some quando o navegador fecha. */
  readonly maxAgeSegundos?: number
}

/**
 * O `Set-Cookie` dos cookies de sessão: sempre `HttpOnly` (o JavaScript da página não lê), `SameSite=Strict` e só no
 * caminho `/v1/sessao`; `Secure` em todo ambiente menos o local, que roda em `http://127.0.0.1`.
 */
export function serializarCookie(nome: string, valor: string, opcoes: OpcoesDoCookie): string {
  if (!VALOR_SEGURO.test(nome) || !VALOR_SEGURO.test(valor)) throw new Error('cookie com caractere fora do formato')
  const atributos = [`${nome}=${valor}`, `Path=${CAMINHO_DOS_COOKIES}`, 'HttpOnly', 'SameSite=Strict']
  if (opcoes.ambiente !== 'local') atributos.push('Secure')
  if (opcoes.maxAgeSegundos !== undefined) atributos.push(`Max-Age=${String(opcoes.maxAgeSegundos)}`)
  return atributos.join('; ')
}

/** O valor de um cookie no cabeçalho `Cookie`, ou `undefined`. Repetido, vale o primeiro, como no navegador. */
export function lerCookie(cabecalho: string | undefined, nome: string): string | undefined {
  if (cabecalho === undefined) return undefined
  for (const parte of cabecalho.split(';')) {
    const igual = parte.indexOf('=')
    if (igual < 0) continue
    if (parte.slice(0, igual).trim() === nome) return parte.slice(igual + 1).trim()
  }
  return undefined
}
