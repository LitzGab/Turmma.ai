import type { ReactNode } from 'react'

interface PropsDaBarraPresa {
  /** O nome da barra para o leitor de tela: "Aprovação do lote", "Pedido ao Assistente". */
  readonly rotulo: string
  /**
   * O que explica a ação, à esquerda: o contador que diz por que o botão está desligado ("3 de 5 destaques abertos").
   * Na barra da conversa não há: a caixa de pedido ocupa a largura toda.
   */
  readonly informacao?: ReactNode
  /** As ações, à direita: o `oficial` da tela e a alternativa dele; ou a `CaixaPedido`. */
  readonly children: ReactNode
  /** A linha de cima, que separa a barra da lista. A barra da caixa de pedido não leva: a caixa já tem a borda dela. */
  readonly semLinha?: boolean
}

/**
 * A barra presa embaixo (`docs/interface.md` 11.1 e 11.5): a do Aprovar, com o contador e o botão `oficial`, e a da
 * caixa de pedido na conversa. Uma peça só para as duas.
 *
 * **Presa por `sticky`, e não por `fixed`**: ela é o último bloco da tela e gruda no pé da janela enquanto a lista rola
 * por trás. Por estar no fluxo, ocupa o lugar dela no fim da página, e **não cobre o último item da lista** — com
 * `fixed`, o último destaque ficaria embaixo do botão, que é justo o que a professora precisa abrir antes de aprovar.
 * Quem usa a põe como último filho do bloco que rola (a `Tela`, ou a coluna da conversa).
 *
 * A 360 px a informação e as ações quebram em duas linhas, e os botões continuam com 44 px. O fundo é cheio (`fundo`):
 * sem vidro fosco nem transparência, que custam quadro no Chromebook e deixariam o texto da lista vazar por trás.
 */
export function BarraPresa({ rotulo, informacao, children, semLinha = false }: PropsDaBarraPresa) {
  return (
    <div role="group" aria-label={rotulo} data-barra-presa="" className={`sticky bottom-0 z-10 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-fundo py-3 ${semLinha ? '' : 'border-t border-linha'}`}>
      {informacao !== undefined && <div className="min-w-0 text-sm break-words text-apoio">{informacao}</div>}
      <div className={`flex min-w-0 flex-wrap items-center gap-3 ${informacao === undefined ? 'w-full' : 'ml-auto'}`}>{children}</div>
    </div>
  )
}
