import * as React from 'react'
import { cn } from '@/lib/utils'

/* O BALÃO DE FALA (11ª rodada; seção 3.10): a fala da onça.
   Borda de 2 px, canto 16, padding 12/16, t-balao em tinta, fundo branco. A PONTA é um quadrado de 14 px girado 45°,
   com borda em dois lados, encostada na onça: `lado` diz onde a onça está (esquerda, o padrão; baixo; cima).
   Até 12 palavras; nada de parágrafo. */

const PONTA: Record<'esquerda' | 'baixo' | 'cima', string> = {
  esquerda: 'left-[-8px] top-1/2 -mt-[7px] border-b-2 border-l-2',
  baixo: 'bottom-[-8px] left-1/2 -ml-[7px] border-b-2 border-r-2',
  cima: 'top-[-8px] left-1/2 -ml-[7px] border-l-2 border-t-2',
}

export function Balao({ lado = 'esquerda', children, className }: {
  lado?: 'esquerda' | 'baixo' | 'cima'
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('t-balao relative min-w-0 w-fit max-w-full rounded-[16px] border-2 border-borda bg-white px-4 py-3 text-tinta', className)}>
      <span aria-hidden className={cn('absolute size-[14px] rotate-45 border-borda bg-white', PONTA[lado])} />
      <span className="relative">{children}</span>
    </div>
  )
}
