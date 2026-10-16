import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/* OS PASSOS (12ª rodada): onde a pessoa está num caminho de 2 a 7 etapas (Redação: Rubrica · Lote anônimo · Corrigir;
   a montagem da escola). Cada passo é um círculo de 32 px: feito em verde com o visto; o atual em azul, com o número;
   o que falta, branco com borda de 2 px. O rótulo vai em t-selo embaixo. Com `aoIr`, os feitos voltam por clique.
   Mede o que tem fim (os passos), nunca tempo. */

export type PassoDuo = { id?: string; rotulo: string }

export function Passos({ passos, atual, aoIr, className }: {
  passos: (PassoDuo | string)[]
  /** o índice do passo atual (0 é o primeiro) */
  atual: number
  aoIr?: (indice: number) => void
  className?: string
}) {
  const lista = passos.map((p) => (typeof p === 'string' ? { rotulo: p } : p))
  return (
    <ol className={cn('flex w-full items-start', className)} aria-label="Passos">
      {lista.map((p, i) => {
        const feito = i < atual
        const agora = i === atual
        const circulo = (
          <span className={cn('grid size-8 shrink-0 place-items-center rounded-full border-2 text-[15px] font-bold tabular-nums',
            feito ? 'border-verde-degrau bg-verde text-sobre-cor' : agora ? 'border-azul-degrau bg-azul text-sobre-cor' : 'border-borda bg-white text-sutil')}>
            {feito ? <Check aria-hidden className="size-4" strokeWidth={3.5} /> : i + 1}
          </span>
        )
        return (
          <li key={p.id ?? p.rotulo} aria-current={agora ? 'step' : undefined} className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
            {i > 0 && <span aria-hidden className={cn('absolute right-1/2 top-[15px] h-[2px] w-[calc(100%-32px)] -translate-x-4', i <= atual ? 'bg-verde' : 'bg-borda')} />}
            {aoIr && feito
              ? <button type="button" onClick={() => aoIr(i)} aria-label={`Voltar ao passo ${i + 1}: ${p.rotulo}`} className="relative rounded-full">{circulo}</button>
              : <span className="relative">{circulo}</span>}
            <span className={cn('t-selo px-1', agora ? 'text-azul-texto' : feito ? 'text-tinta' : 'text-sutil')}>{p.rotulo}</span>
          </li>
        )
      })}
    </ol>
  )
}
