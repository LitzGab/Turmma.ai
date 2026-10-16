import * as React from 'react'
import { cn } from '@/lib/utils'
import { familia as estiloFamilia, type Familia } from './familia'

/* A FAIXA (11ª rodada; seção 3.11): o "cabeçalho de unidade" do Duolingo, uma massa de cor que diz "isto é o agora".
   Face cheia da família (no professor, a cor da matéria da aula), canto 16, 20 px por dentro, SEM degrau.
   Ordem: rótulo (t-selo) · título (22/700) · uma linha (t-corpo) · à direita, a ação e o ícone de 48 px.
   O texto é sempre tinta: nenhuma face aceita texto branco (tabela 2.1.2). */

export function Faixa({ familia = 'laranja', rotulo, titulo, linha, acao, icone, className }: {
  familia?: Familia
  rotulo?: React.ReactNode
  titulo: React.ReactNode
  linha?: React.ReactNode
  acao?: React.ReactNode
  icone?: React.ReactNode
  className?: string
}) {
  return (
    <section style={estiloFamilia(familia)}
      className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[16px] bg-(--face) p-5 text-sobre-cor', className)}>
      <div className="min-w-[min(100%,200px)] flex-1">
        {rotulo && <p className="t-selo">{rotulo}</p>}
        <h2 className="mt-1 truncate text-[22px] font-bold leading-[28px]">{titulo}</h2>
        {linha && <p className="t-corpo mt-0.5 truncate">{linha}</p>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
      {/* o ícone vai num ladrilho branco: na face da mesma família, ele sumiria */}
      {icone && <div aria-hidden className="hidden size-16 shrink-0 place-items-center rounded-[14px] bg-white sm:grid [&>svg]:size-12">{icone}</div>}
    </section>
  )
}
