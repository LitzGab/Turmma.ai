import {
  esquemaRespostaEntrega,
  esquemaRespostaListaDeEntregas,
  TAMANHO_MAXIMO_DA_PAGINA,
  type Entrega,
  type PedidoDecidirEntrega,
  type RespostaEntrega,
  type RespostaListaDeEntregas,
} from '@educa/shared'
import { infiniteQueryOptions, queryOptions, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import { CHAVE_DAS_ENTREGAS, CHAVE_DOS_ARTEFATOS } from './chaves-do-professor'
import { buscarComSessao, chamarComSessao } from './sessao'

const CAMINHO_DAS_ENTREGAS = '/v1/entregas'

/**
 * O que a IA produziu e espera a professora (`GET /v1/entregas?estado=pendente`), nas turmas em que ela tem vínculo
 * confirmado. Uma página, a maior que a API entrega: é o que "Esperando você" mostra na Home, no Seu time e no contador
 * da lateral. Havendo mais, a tela diz que há mais (`quantasEsperam`).
 */
export const consultaEntregasPendentes = queryOptions({
  queryKey: [...CHAVE_DAS_ENTREGAS, 'pendentes'],
  queryFn: ({ signal }) => buscarComSessao(`${CAMINHO_DAS_ENTREGAS}?estado=pendente&limite=${String(TAMANHO_MAXIMO_DA_PAGINA)}`, esquemaRespostaListaDeEntregas, signal),
})

/** Todas as entregas da professora, de qualquer estado, paginadas: é o que o Assistente fez, na conversa do Seu time. */
export const consultaEntregas = infiniteQueryOptions({
  queryKey: [...CHAVE_DAS_ENTREGAS, 'todas'],
  queryFn: ({ pageParam, signal }) =>
    buscarComSessao(pageParam === undefined ? CAMINHO_DAS_ENTREGAS : `${CAMINHO_DAS_ENTREGAS}?pagina=${encodeURIComponent(pageParam)}`, esquemaRespostaListaDeEntregas, signal),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (ultima) => ultima.proxima,
})

/**
 * As entregas de uma turma, para a tela do artefato dizer quem aprovou a versão adaptada e quando: o artefato traz só o
 * estado e a data da entrega dele (`esquemaEntregaDoArtefato`), sem o autor nem a justificativa.
 */
export function consultaEntregasDaTurma(turmaId: string) {
  return queryOptions({
    queryKey: [...CHAVE_DAS_ENTREGAS, 'turma', turmaId],
    queryFn: ({ signal }) => buscarComSessao(`${CAMINHO_DAS_ENTREGAS}?turmaId=${encodeURIComponent(turmaId)}&limite=${String(TAMANHO_MAXIMO_DA_PAGINA)}`, esquemaRespostaListaDeEntregas, signal),
  })
}

export interface QuantasEsperam {
  readonly quantidade: number
  /** A página veio cheia e há outra: a tela diz "100 ou mais", e não um número que não sabe. */
  readonly haMais: boolean
}

/** Quantas entregas esperam a professora, pelo que a leitura trouxe. Sem leitura, nenhuma: o contador não inventa. */
export function quantasEsperam(pagina: RespostaListaDeEntregas | undefined): QuantasEsperam {
  if (pagina === undefined) return { quantidade: 0, haMais: false }
  return { quantidade: pagina.itens.filter((entrega) => entrega.estado === 'pendente').length, haMais: pagina.proxima !== undefined }
}

/**
 * `POST /v1/entregas/:id/decidir`: a aprovação registrada, com autor e data, ou a rejeição com justificativa (regra 70,
 * item 3). **É o único caminho de decisão da tela**: não existe atalho em volta dele. A que já tinha decisão responde
 * `ENTREGA_JA_DECIDIDA`.
 */
export function decidirEntrega(id: string, pedido: PedidoDecidirEntrega): Promise<RespostaEntrega> {
  return chamarComSessao(`${CAMINHO_DAS_ENTREGAS}/${encodeURIComponent(id)}/decidir`, esquemaRespostaEntrega, { metodo: 'POST', corpo: pedido })
}

/**
 * A tela depois da decisão: a entrega decidida entra no lugar da pendente em toda lista já lida, na hora, com quem decidiu
 * e quando, e sai de "Esperando você". Depois tudo é marcado como velho e relido: as entregas, e o artefato, que mostra
 * o estado da versão adaptada.
 */
export async function aplicarEntregaDecidida(cliente: QueryClient, decidida: Entrega): Promise<void> {
  await cliente.cancelQueries({ queryKey: CHAVE_DAS_ENTREGAS })
  cliente.setQueryData<RespostaListaDeEntregas>(consultaEntregasPendentes.queryKey, (lista) => (lista === undefined ? undefined : { ...lista, itens: lista.itens.filter((entrega) => entrega.id !== decidida.id) }))
  cliente.setQueryData<InfiniteData<RespostaListaDeEntregas, string | undefined>>(consultaEntregas.queryKey, (lido) =>
    lido === undefined ? undefined : { ...lido, pages: lido.pages.map((pagina) => ({ ...pagina, itens: pagina.itens.map((entrega) => (entrega.id === decidida.id ? decidida : entrega)) })) },
  )
  recarregarEntregas(cliente)
}

/** Marca como velho o que depende de uma decisão: a entrega já decidida por outro caminho também cai aqui. */
export function recarregarEntregas(cliente: QueryClient): void {
  void cliente.invalidateQueries({ queryKey: CHAVE_DAS_ENTREGAS })
  void cliente.invalidateQueries({ queryKey: CHAVE_DOS_ARTEFATOS })
}
