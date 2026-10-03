import {
  esquemaRespostaDecisao,
  esquemaRespostaPedidosDaTurma,
  TAMANHO_MAXIMO_DA_PAGINA,
  type DecisorDaReivindicacao,
  type FinalidadeDaLeituraDeAlunos,
  type PedidoDecidirReivindicacoes,
  type RespostaDecisao,
  type RespostaPedidosDaTurma,
} from '@educa/shared'
import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { buscarComSessao, chamarComSessao } from './sessao'

/**
 * Os pedidos de reivindicação da turma, por quem decide (A1, 16.0; RF12; as rotas são da 8.0): o professor com vínculo
 * confirmado e a coordenação leem os pendentes e aprovam ou recusam os marcados. A escola, o ano e o vínculo vêm do
 * token e do servidor: o que vai no pedido é a turma, no caminho, e os ids dos pedidos.
 *
 * O nome do aluno só passa pela resposta da leitura e pela memória da página: nunca no endereço, em `localStorage` nem
 * em `sessionStorage` (regra 20; regra 50, item 7).
 */

/**
 * Por que a coordenação lê os pedidos de dentro da turma (regra 20, item 10): conferir o cadastro que ela está montando,
 * a mesma finalidade da lista de nomes da mesma tela. Cada leitura dela fica na auditoria (`turma.reivindicacoes_lidas`).
 */
export const FINALIDADE_DOS_PEDIDOS_NA_ESTRUTURA: FinalidadeDaLeituraDeAlunos = 'conferencia_de_cadastro'

/** Uma leitura traz até uma página, a maior que a API entrega: havendo mais, a tela diz, e eles vêm depois da decisão. */
export const PEDIDOS_POR_LEITURA = TAMANHO_MAXIMO_DA_PAGINA

/** O começo da chave das leituras dos pedidos: a troca de escola e a pessoa seguinte esvaziam tudo junto (`main.tsx`). */
const CHAVE_DOS_PEDIDOS = ['pedidos-da-turma'] as const

/**
 * Os pedidos pendentes da turma (`GET /v1/turmas/:id/reivindicacoes`), como quem decide os lê.
 *
 * - **O professor** lê ao abrir a turma, sem finalidade, e a tela relê sozinha (`atualizacao-dos-pedidos.ts`).
 * - **A coordenação** manda a finalidade, e a leitura só sai quando ela pede (`enabled: false`, e o "Atualizar" chama o
 *   `refetch`): cada leitura grava um registro de auditoria em nome dela, e nenhuma sai sozinha, nem ao abrir a turma,
 *   nem ao voltar para a aba, nem quando a sessão volta a valer.
 *
 * Fora da tela a lista não fica guardada, nos dois papéis (`gcTime: 0`): os nomes não ficam na memória da aba do
 * computador compartilhado, e voltar à turma não mostra uma leitura antiga.
 *
 * Quem decide entra na chave: a lista que o professor leu nunca é a que a coordenação vê sem a leitura dela.
 */
export function consultaPedidosDaTurma(turmaId: string, quem: DecisorDaReivindicacao) {
  const daCoordenacao = quem === 'coordenacao'
  return queryOptions({
    queryKey: [...CHAVE_DOS_PEDIDOS, turmaId, quem],
    queryFn: ({ signal }) => {
      const consulta = new URLSearchParams({ limite: String(PEDIDOS_POR_LEITURA) })
      if (daCoordenacao) consulta.set('finalidade', FINALIDADE_DOS_PEDIDOS_NA_ESTRUTURA)
      return buscarComSessao(`/v1/turmas/${encodeURIComponent(turmaId)}/reivindicacoes?${consulta.toString()}`, esquemaRespostaPedidosDaTurma, signal)
    },
    enabled: !daCoordenacao,
    gcTime: 0,
  })
}

/** `POST /v1/reivindicacoes/decidir`: aprova ou recusa os pedidos dados, e diz o que aconteceu com cada um. */
export function decidirPedidos(pedido: PedidoDecidirReivindicacoes): Promise<RespostaDecisao> {
  return chamarComSessao('/v1/reivindicacoes/decidir', esquemaRespostaDecisao, { metodo: 'POST', corpo: pedido })
}

/**
 * A lista depois da decisão. Todo id da resposta deixou de esperar por esta pessoa (`decidida`, `ja_decidida` ou
 * `nao_encontrada`), e sai da lista na hora, sem leitura nova. A leitura que estava no ar é descartada antes: ela foi
 * feita antes da decisão, e traria de volta o pedido decidido. Depois a lista é marcada como velha: a do professor, que
 * está ligada, é relida em seguida; a da coordenação, desligada (`enabled: false`), não é: leitura dela só no "Atualizar".
 */
export async function aplicarDecisao(cliente: QueryClient, turmaId: string, quem: DecisorDaReivindicacao, resposta: RespostaDecisao): Promise<void> {
  const { queryKey } = consultaPedidosDaTurma(turmaId, quem)
  await cliente.cancelQueries({ queryKey })
  const fechados = new Set(resposta.resultados.map((resultado) => resultado.id))
  cliente.setQueryData<RespostaPedidosDaTurma>(queryKey, (lista) => (lista === undefined ? undefined : { ...lista, itens: lista.itens.filter((pedido) => !fechados.has(pedido.id)) }))
  void cliente.invalidateQueries({ queryKey })
}

/**
 * A lista depois da decisão que falhou. Um erro no meio do lote não desfaz os pedidos já decididos, e a resposta não diz
 * quais foram (nota da 8.0): a lista na tela deixou de valer. A do professor é relida, e fica na tela enquanto a releitura
 * não volta (o diálogo aberto continua com os nomes); a da coordenação é esvaziada, e volta ao estado de antes da primeira
 * leitura, até ela pedir de novo.
 */
export async function descartarListaDepoisDaFalha(cliente: QueryClient, turmaId: string, quem: DecisorDaReivindicacao): Promise<void> {
  const { queryKey } = consultaPedidosDaTurma(turmaId, quem)
  if (quem === 'professor') await cliente.invalidateQueries({ queryKey })
  else await cliente.resetQueries({ queryKey, exact: true })
}
