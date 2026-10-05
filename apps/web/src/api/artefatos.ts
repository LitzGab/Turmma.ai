import {
  CodigoDeErro,
  esquemaRespostaArtefato,
  esquemaRespostaExecucaoAceita,
  esquemaRespostaListaDeArtefatos,
  type PedidoAdaptarArtefato,
  type RespostaArtefato,
  type RespostaExecucaoAceita,
} from '@educa/shared'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'
import { CHAVE_DOS_ARTEFATOS } from './chaves-do-professor'
import { ErroDaApi } from './cliente'
import { buscarComSessao, chamarComSessao, renovarSessao, tokenDeAcesso } from './sessao'

const CAMINHO_DOS_ARTEFATOS = '/v1/artefatos'

/**
 * O que a professora já gerou (`GET /v1/artefatos`), nas turmas em que ela tem vínculo confirmado: a escola, o ano e o
 * vínculo vêm do token. Paginada, como a API entrega (regra 80, item 8).
 */
export const consultaArtefatos = infiniteQueryOptions({
  queryKey: [...CHAVE_DOS_ARTEFATOS, 'lista'],
  queryFn: ({ pageParam, signal }) =>
    buscarComSessao(pageParam === undefined ? CAMINHO_DOS_ARTEFATOS : `${CAMINHO_DOS_ARTEFATOS}?pagina=${encodeURIComponent(pageParam)}`, esquemaRespostaListaDeArtefatos, signal),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (ultima) => ultima.proxima,
})

/** Um artefato inteiro (`GET /v1/artefatos/:id`): o conteúdo, as versões adaptadas que saíram dele e as aplicações. */
export function consultaArtefato(id: string) {
  return queryOptions({
    queryKey: [...CHAVE_DOS_ARTEFATOS, 'um', id],
    queryFn: ({ signal }) => buscarComSessao(`${CAMINHO_DOS_ARTEFATOS}/${encodeURIComponent(id)}`, esquemaRespostaArtefato, signal),
  })
}

/** `PATCH /v1/artefatos/:id`: só o título. O conteúdo gerado não se edita por aqui. */
export function renomearArtefato(id: string, titulo: string): Promise<RespostaArtefato> {
  return chamarComSessao(`${CAMINHO_DOS_ARTEFATOS}/${encodeURIComponent(id)}`, esquemaRespostaArtefato, { metodo: 'PATCH', corpo: { titulo } })
}

/**
 * `POST /v1/artefatos/:id/adaptar`: os **tipos de adaptação**, de lista fechada, o tempo extra e a chave do envio. O
 * pedido não tem campo de texto, e o tipo `PedidoAdaptarArtefato` não deixa pôr um (D35, D67). Responde 202; a versão
 * nasce com uma entrega pendente.
 */
export function adaptarArtefato(id: string, pedido: PedidoAdaptarArtefato): Promise<RespostaExecucaoAceita> {
  return chamarComSessao(`${CAMINHO_DOS_ARTEFATOS}/${encodeURIComponent(id)}/adaptar`, esquemaRespostaExecucaoAceita, { metodo: 'POST', corpo: pedido })
}

/** O nome do arquivo quando o cabeçalho não diz: o título, sem o que um nome de arquivo não aceita. */
export function nomeDoArquivoPdf(titulo: string): string {
  const limpo = titulo
    .replace(/[\\/:*?"<>|\p{Cc}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
    .trim()
  return `${limpo === '' ? 'artefato' : limpo}.pdf`
}

/** O `filename` de um `Content-Disposition: attachment`, na forma simples e na codificada (`filename*=UTF-8''…`). */
export function nomeNoCabecalho(cabecalho: string | null): string | undefined {
  if (cabecalho === null) return undefined
  const codificado = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(cabecalho)?.[1]
  if (codificado !== undefined) {
    try {
      return decodeURIComponent(codificado.trim())
    } catch {
      // Codificação quebrada: vale o nome simples, ou o do título.
    }
  }
  const simples = /filename\s*=\s*("([^"]*)"|[^;]+)/i.exec(cabecalho)
  const nome = (simples?.[2] ?? simples?.[1])?.trim()
  return nome === undefined || nome === '' ? undefined : nome
}

function ehCodigoDeErro(valor: unknown): valor is CodigoDeErro {
  return typeof valor === 'string' && Object.hasOwn(CodigoDeErro, valor)
}

/** O erro de uma resposta que não trouxe o PDF: o código do envelope da API, ou o que o status permite dizer. */
async function erroDoPdf(resposta: Response): Promise<ErroDaApi> {
  try {
    const corpo: unknown = await resposta.json()
    if (typeof corpo === 'object' && corpo !== null && 'erro' in corpo) {
      const { erro } = corpo
      if (typeof erro === 'object' && erro !== null && 'codigo' in erro && ehCodigoDeErro(erro.codigo)) return new ErroDaApi(erro.codigo)
    }
  } catch {
    // Sem envelope: o status decide.
  }
  if (resposta.status === 404) return new ErroDaApi(CodigoDeErro.NAO_ENCONTRADO)
  if (resposta.status === 429) return new ErroDaApi(CodigoDeErro.LIMITE_EXCEDIDO)
  if (resposta.status >= 502 && resposta.status <= 504) return new ErroDaApi(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
  return new ErroDaApi(CodigoDeErro.ERRO_INTERNO)
}

async function pedirPdf(caminho: string): Promise<Response> {
  const token = tokenDeAcesso()
  try {
    // `no-store`: o PDF tem o gabarito, e o cache HTTP do navegador fica em disco no computador da escola.
    return await fetch(caminho, { cache: 'no-store', headers: { Accept: 'application/pdf', ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }) } })
  } catch {
    throw new ErroDaApi(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
  }
}

export interface PdfDoArtefato {
  readonly arquivo: Blob
  readonly nome: string
}

/**
 * `GET /v1/artefatos/:id/pdf`: o artefato em PDF. É binário, e por isso não passa por `chamarComSessao`, que valida
 * JSON; a sessão é a mesma: o token vai no cabeçalho (nunca na URL, regra 50, item 7) e, recusado, é renovado uma vez.
 * Toda falha sai como `ErroDaApi`, com código do catálogo.
 */
export async function baixarPdfDoArtefato(id: string, titulo: string): Promise<PdfDoArtefato> {
  const caminho = `${CAMINHO_DOS_ARTEFATOS}/${encodeURIComponent(id)}/pdf`
  let resposta = await pedirPdf(caminho)
  if (resposta.status === 401) {
    await renovarSessao()
    resposta = await pedirPdf(caminho)
  }
  if (!resposta.ok) throw await erroDoPdf(resposta)
  return { arquivo: await resposta.blob(), nome: nomeNoCabecalho(resposta.headers.get('Content-Disposition')) ?? nomeDoArquivoPdf(titulo) }
}

/** Entrega o arquivo à pessoa pelo navegador, como um download comum. O endereço temporário é solto em seguida. */
export function salvarArquivo({ arquivo, nome }: PdfDoArtefato): void {
  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = endereco
  link.download = nome
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(endereco)
}
