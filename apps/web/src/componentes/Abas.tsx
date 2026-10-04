import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { abaDaTecla } from './teclado-das-abas'

export interface Aba {
  readonly id: string
  readonly rotulo: string
  /** Quantos itens esperam a pessoa naquela aba. Zero não aparece. */
  readonly contador?: number
}

interface PropsDasAbas {
  /** O nome da lista de abas para o leitor de tela: "Seções da turma". */
  readonly rotulo: string
  readonly abas: readonly Aba[]
  readonly ativa: string
  readonly aoMudar: (id: string) => void
  /** O conteúdo da aba ativa. */
  readonly children: ReactNode
}

/**
 * Abas, no padrão da WAI-ARIA, escritas à mão: o `@radix-ui/react-tabs` medido neste build pesa perto de 8 kB em brotli
 * para o que cabe em sessenta linhas, e o teto da área do professor inteira é 8 kB (regra 50, item 1).
 *
 * - **Uma parada só no Tab**: a aba ativa. As setas trocam de aba (e dão a volta), `Home` e `End` vão às pontas, e o
 *   Tab seguinte entra no painel.
 * - **Clique e toque** trocam do mesmo jeito: nada aqui depende de teclado nem de hover (regra 50, item 2a).
 * - **A ativa tem três pistas** (11.1): o texto em `tinta` com peso 600, o filete embaixo e o `aria-selected`. Só a cor
 *   não diria nada num Chromebook de entrada.
 * - **A lista rola por dentro** quando não cabe: a 360 px ela não empurra a página.
 *
 * 44 px de altura no celular e 36 px a partir de 768 px, que é a barra de controles da 9.3.
 */
export function Abas({ rotulo, abas, ativa, aoMudar, children }: PropsDasAbas) {
  const base = useId()
  const lista = useRef<HTMLDivElement>(null)
  const idDaAba = (id: string) => `${base}-aba-${id}`
  const idDoPainel = `${base}-painel`

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>): void {
    const destino = abaDaTecla(
      abas.map((aba) => aba.id),
      ativa,
      evento.key,
    )
    if (destino === undefined) return
    evento.preventDefault()
    aoMudar(destino)
    // O foco acompanha a aba: sem isto, ele ficaria na aba que deixou de ser a ativa, que saiu da ordem do Tab.
    lista.current?.querySelector<HTMLElement>(`[id="${idDaAba(destino)}"]`)?.focus()
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div ref={lista} role="tablist" aria-label={rotulo} onKeyDown={aoTeclar} className="flex min-w-0 gap-1 overflow-x-auto border-b border-linha">
        {abas.map((aba) => {
          const selecionada = aba.id === ativa
          return (
            <button
              key={aba.id}
              type="button"
              role="tab"
              id={idDaAba(aba.id)}
              aria-selected={selecionada}
              aria-controls={idDoPainel}
              tabIndex={selecionada ? 0 : -1}
              onClick={() => aoMudar(aba.id)}
              className={`relative inline-flex min-h-11 shrink-0 items-center gap-2 px-3 text-sm whitespace-nowrap -outline-offset-2 md:min-h-9 ${selecionada ? 'font-semibold text-tinta' : 'text-sutil hover:text-tinta'}`}
            >
              {aba.rotulo}
              {aba.contador !== undefined && aba.contador > 0 && (
                <span className="rounded-full bg-pendente-cx px-1.5 text-[13px] font-semibold text-pendente tabular-nums">
                  {aba.contador}
                  <span className="sr-only"> esperando você</span>
                </span>
              )}
              {selecionada && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-tinta" />}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={idDoPainel} aria-labelledby={idDaAba(ativa)} tabIndex={0} className="min-w-0">
        {children}
      </div>
    </div>
  )
}
