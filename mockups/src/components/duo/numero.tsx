import * as React from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Familia } from './familia'
import { LadrilhoIcone } from './ladrilho'

/* O NÚMERO GRANDE (11ª rodada; seção 3.15): cartão de LEITURA (canto 16, borda de 2, 16 px por dentro, sem degrau,
   não clica). Em cima, o ladrilho de 32 px; depois, o valor em t-numero (ou t-numero-g); embaixo, o rótulo em t-selo
   sutil, com 1 a 3 palavras. A variação opcional vira um selo pequeno com a SETA — verde-texto quando é bom,
   vermelho-texto quando não é —, sempre com a seta além da cor. */

export function NumeroGrande({ icone, valor, rotulo, familia = 'laranja', grande, variacao, className }: {
  icone: React.ReactNode
  valor: React.ReactNode
  rotulo: string
  familia?: Familia
  grande?: boolean
  variacao?: { valor: React.ReactNode; bom?: boolean }
  className?: string
}) {
  const subiu = variacao && (typeof variacao.valor === 'number' ? variacao.valor >= 0 : !String(variacao.valor).trim().startsWith('-'))
  return (
    <div className={cn('flex min-w-0 flex-col gap-2 rounded-[16px] border-2 border-borda bg-white p-4', className)}>
      <div className="flex items-start justify-between gap-2">
        <LadrilhoIcone familia={familia} tamanho={32} icone={icone} />
        {variacao && (
          <span className={cn('inline-flex h-6 items-center gap-0.5 rounded-[8px] px-1.5 text-[14px] font-bold tabular-nums [&_svg]:size-4',
            variacao.bom ? 'bg-verde-claro text-verde-texto' : 'bg-vermelho-claro text-vermelho-texto')}>
            {subiu ? <ArrowUp strokeWidth={3} aria-label="subiu" /> : <ArrowDown strokeWidth={3} aria-label="caiu" />}
            {variacao.valor}
          </span>
        )}
      </div>
      <p className={cn(grande ? 't-numero-g' : 't-numero', 'text-tinta')}>{valor}</p>
      <p className="t-selo text-sutil">{rotulo}</p>
    </div>
  )
}
