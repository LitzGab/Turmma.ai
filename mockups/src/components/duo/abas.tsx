import * as React from 'react'
import { cn } from '@/lib/utils'

/* AS ABAS (12ª rodada; régua R3: no máximo 3). Uma linha de 48 px: o rótulo em caixa alta (t-rotulo) e `sutil`; a ativa
   em `azul-texto`, com um sublinhado de 3 px `azul` sobre a linha de 2 px `borda`. Setas trocam a aba.
   É para trocar de PARTE da coisa (Turmas · Professores · Material). Trocar o JEITO DE VER é o Segmentado. */

export type AbaDuo = { id: string; rotulo: string }

export function Abas({ abas, valor, aoMudar, rotulo, className }: {
  abas: AbaDuo[]
  valor: string
  aoMudar: (id: string) => void
  /** o que as abas escolhem, para o leitor de tela */
  rotulo?: string
  className?: string
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  if (abas.length > 3 && import.meta.env.DEV) console.warn(`Abas: no máximo 3 (R3); vieram ${abas.length}.`)
  const lista = abas.slice(0, 3)
  const teclar = (e: React.KeyboardEvent, i: number) => {
    const passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const j = (i + passo + lista.length) % lista.length
    aoMudar(lista[j].id)
    refs.current[j]?.focus()
  }
  return (
    <div role="tablist" aria-label={rotulo} className={cn('flex h-12 shrink-0 items-stretch gap-6 border-b-2 border-borda', className)}>
      {lista.map((a, i) => {
        const ativa = a.id === valor
        return (
          <button key={a.id} ref={(el) => { refs.current[i] = el }} type="button" role="tab" aria-selected={ativa} tabIndex={ativa ? 0 : -1}
            onClick={() => aoMudar(a.id)} onKeyDown={(e) => teclar(e, i)}
            className={cn('t-rotulo relative -mb-[2px] whitespace-nowrap px-0.5 transition-colors duration-150',
              ativa ? 'text-azul-texto' : 'text-sutil hover:text-tinta')}>
            {a.rotulo}
            <span aria-hidden className={cn('absolute inset-x-0 bottom-0 h-[3px] rounded-full', ativa ? 'bg-azul' : 'bg-transparent')} />
          </button>
        )
      })}
    </div>
  )
}
