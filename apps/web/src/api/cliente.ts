import { CodigoDeErro, MENSAGENS_DE_ERRO } from '@educa/shared'

/**
 * Erro de chamada à API, só com o código tipado. A tela decide o que mostrar pelo código e nunca
 * pelo status HTTP nem pela mensagem da resposta (regra 00, item 9; regra 50, item 12).
 */
export class ErroDaApi extends Error {
  constructor(readonly codigo: CodigoDeErro) {
    super(codigo)
    this.name = 'ErroDaApi'
  }
}

/** O mínimo de um esquema zod de `packages/shared` que o cliente usa, sem a web depender do zod. */
export interface EsquemaDeResposta<T> {
  safeParse(valor: unknown): { success: true; data: T } | { success: false }
}

function ehCodigoDeErro(valor: unknown): valor is CodigoDeErro {
  return typeof valor === 'string' && Object.hasOwn(CodigoDeErro, valor)
}

/** O código do envelope `{ erro: { codigo } }`; sem envelope reconhecível, o código que o status permite deduzir. */
function codigoDaResposta(corpo: unknown, status: number): CodigoDeErro {
  if (typeof corpo === 'object' && corpo !== null && 'erro' in corpo) {
    const { erro } = corpo
    if (typeof erro === 'object' && erro !== null && 'codigo' in erro && ehCodigoDeErro(erro.codigo)) return erro.codigo
  }
  if (status === 429) return CodigoDeErro.LIMITE_EXCEDIDO
  // Borda sem instância, ou instância drenando: o sistema volta sozinho.
  if (status === 502 || status === 503 || status === 504) return CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO
  return CodigoDeErro.ERRO_INTERNO
}

async function lerJson(resposta: Response): Promise<unknown> {
  try {
    return await resposta.json()
  } catch {
    return undefined
  }
}

/**
 * `GET` na API por caminho relativo, com a resposta validada pelo contrato de `packages/shared`.
 * Toda falha sai como `ErroDaApi`: sem rede, erro da API e resposta fora do contrato.
 */
export async function buscarDaApi<T>(caminho: string, esquema: EsquemaDeResposta<T>, sinal?: AbortSignal): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(caminho, { headers: { Accept: 'application/json' }, ...(sinal ? { signal: sinal } : {}) })
  } catch (erro) {
    if (sinal?.aborted) throw erro
    throw new ErroDaApi(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
  }
  const corpo = await lerJson(resposta)
  if (!resposta.ok) throw new ErroDaApi(codigoDaResposta(corpo, resposta.status))
  const lido = esquema.safeParse(corpo)
  if (!lido.success) throw new ErroDaApi(CodigoDeErro.ERRO_INTERNO)
  return lido.data
}

/** A mensagem do catálogo pt-BR para qualquer erro; o que não é `ErroDaApi` vira erro interno. */
export function mensagemDoErro(erro: unknown): string {
  return MENSAGENS_DE_ERRO[erro instanceof ErroDaApi ? erro.codigo : CodigoDeErro.ERRO_INTERNO]
}
