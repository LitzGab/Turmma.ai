import { MAXIMO_DE_PEDIDOS_POR_DECISAO, type DecisorDaReivindicacao, type PedidoDaTurma, type RespostaDecisao } from '@educa/shared'

/**
 * A lista de pedidos que se atualiza, e o que sobrevive a cada atualização (A1, 16.0; RF12; W15): quem tem a lista
 * relida sozinha, de quanto em quanto tempo e só com a aba à vista; o que continua marcado; o que continua no diálogo
 * aberto; e quantos pedidos chegaram. Sem React aqui, para a regra ter teste de unidade com relógio falso.
 */

/** De quanto em quanto tempo a lista do professor é relida, com a aba à vista (Tech Spec da A1, seção 9, "Decisão"). */
export const INTERVALO_DA_ATUALIZACAO_MS = 15_000

/**
 * Só a lista do professor se atualiza sozinha. A leitura da coordenação grava um registro de auditoria em nome dela a
 * cada vez (regra 20, item 10): nenhuma sai sem ela pedir, no "Atualizar".
 */
export function atualizaSozinha(quem: DecisorDaReivindicacao): boolean {
  return quem === 'professor'
}

/** O que a atualização precisa saber da aba: se ela está à vista, e quando isso muda. É o `document` do navegador. */
export interface AbaDoNavegador {
  readonly visibilityState: 'visible' | 'hidden'
  addEventListener(tipo: 'visibilitychange', ouvinte: () => void): void
  removeEventListener(tipo: 'visibilitychange', ouvinte: () => void): void
}

/**
 * Relê a lista a cada 15 s enquanto a aba está à vista, e para com ela escondida: a aba esquecida atrás de outra não fica
 * batendo na API (regra 80). Quando a aba volta, relê na hora e recomeça a contagem. Para a coordenação não agenda nada.
 * Devolve como parar, para quando a lista sai da tela.
 */
export function agendarAtualizacao(quem: DecisorDaReivindicacao, atualizar: () => void, aba: AbaDoNavegador): () => void {
  if (!atualizaSozinha(quem)) return () => undefined
  let relogio: ReturnType<typeof setInterval> | undefined
  function parar(): void {
    if (relogio !== undefined) clearInterval(relogio)
    relogio = undefined
  }
  function comecar(): void {
    parar()
    if (aba.visibilityState === 'visible') relogio = setInterval(atualizar, INTERVALO_DA_ATUALIZACAO_MS)
  }
  function aoMudarDeVista(): void {
    if (aba.visibilityState === 'visible') atualizar()
    comecar()
  }
  comecar()
  aba.addEventListener('visibilitychange', aoMudarDeVista)
  return () => {
    parar()
    aba.removeEventListener('visibilitychange', aoMudarDeVista)
  }
}

/**
 * Os pedidos de uma lista de ids que continuam esperando, na ordem da lista da tela. É por id, e não pela posição: a
 * atualização que traz pedidos novos, ou que tira os que outra pessoa decidiu, não troca o que está marcado nem o que o
 * diálogo aberto mostra. O pedido que saiu da lista sai da marcação e do diálogo.
 */
export function pedidosQueContinuam(ids: Iterable<string>, pedidos: readonly PedidoDaTurma[]): PedidoDaTurma[] {
  const procurados = new Set(ids)
  return pedidos.filter((pedido) => procurados.has(pedido.id))
}

/**
 * A marcação depois da resposta da decisão: todo id da resposta deixou de esperar por esta pessoa (`decidida`,
 * `ja_decidida` ou `nao_encontrada`) e sai dela na hora, sem depender de a tela desenhar a lista sem ele. Uma releitura
 * velha que ainda o traga volta com ele desmarcado (correção 2026-10-03-decididos-continuam-marcados).
 */
export function semOsDecididos(marcados: readonly string[], resposta: RespostaDecisao): string[] {
  const fechados = new Set(resposta.resultados.map((resultado) => resultado.id))
  return marcados.filter((id) => !fechados.has(id))
}

/** Dá para marcar mais um? Uma decisão leva até 40 pedidos (RF12): o 41º fica desligado, com o texto do limite. */
export function podeMarcarMais(marcados: number): boolean {
  return marcados < MAXIMO_DE_PEDIDOS_POR_DECISAO
}

/**
 * Os ids marcados depois do clique num pedido: marcar o que não estava, até o limite, e desmarcar o que estava. Parte
 * dos que continuam na lista: o pedido que saiu dela não segura lugar entre os 40.
 */
export function alternarMarca(marcados: readonly string[], id: string): string[] {
  if (marcados.includes(id)) return marcados.filter((marcado) => marcado !== id)
  return podeMarcarMais(marcados.length) ? [...marcados, id] : [...marcados]
}

/** Quantos pedidos da lista de agora não estavam na de antes. */
export function quantosNovos(anteriores: ReadonlySet<string>, pedidos: readonly PedidoDaTurma[]): number {
  return pedidos.filter((pedido) => !anteriores.has(pedido.id)).length
}
