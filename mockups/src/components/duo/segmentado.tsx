import * as React from 'react'
import { cn } from '@/lib/utils'

/* O SEGMENTADO (11ª rodada; seção 3.14): um grupo de 44 px, borda de 2, canto 12. Cada opção leva o ícone de 24 px
   (opcional) e o texto em 15/700, em caixa normal para caber. Ativa: azul-claro, borda de 2 azul-borda e texto
   azul-texto. Até 4 opções. É para trocar o JEITO DE VER, não é aba (R3). Setas trocam a opção. */

export type OpcaoSegmentado = { id: string; rotulo: string; icone?: React.ReactNode }

export function Segmentado({ opcoes, valor, aoMudar, rotulo, className }: {
  opcoes: OpcaoSegmentado[]
  valor: string
  aoMudar: (id: string) => void
  /** o que o grupo escolhe, para o leitor de tela */
  rotulo?: string
  className?: string
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  const teclar = (e: React.KeyboardEvent, i: number) => {
    const passo = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const j = (i + passo + opcoes.length) % opcoes.length
    aoMudar(opcoes[j].id)
    refs.current[j]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={rotulo}
      className={cn('inline-flex h-11 items-stretch gap-0.5 rounded-[12px] border-2 border-borda bg-white p-0.5', className)}>
      {opcoes.map((o, i) => {
        const ativa = o.id === valor
        return (
          <button key={o.id} ref={(el) => { refs.current[i] = el }} type="button" role="radio" aria-checked={ativa}
            tabIndex={ativa ? 0 : -1} onClick={() => aoMudar(o.id)} onKeyDown={(e) => teclar(e, i)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border-2 px-3 text-[15px] font-bold leading-none transition-colors duration-150 [&_svg]:size-6 [&_svg]:shrink-0',
              ativa ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-transparent text-sutil hover:bg-fundo-suave hover:text-tinta',
            )}>
            {o.icone}{o.rotulo}
          </button>
        )
      })}
    </div>
  )
}
