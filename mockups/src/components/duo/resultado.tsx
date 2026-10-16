import * as React from 'react'
import { Check, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { familia as estiloFamilia, type Familia } from './familia'

/* A FAIXA DE RESULTADO (11ª rodada; seção 3.12): a gaveta do rodapé que SOBE com um quique (200 ms), como o
   "Correto!" do Duolingo. Fundo claro da família, borda de cima de 2 px na borda da família, o glifo num círculo de
   32 px e o título em 20/700 na cor texto. Serve para "Aprovado", "Enviado" e "Visto" nos painéis, e para o acerto e
   o erro da questão nas próximas rodadas. Nunca comemora nota (seção 4.8). */

const TIPO: Record<'certo' | 'erro' | 'info', { familia: Familia; glifo: React.ReactNode }> = {
  certo: { familia: 'verde', glifo: <Check strokeWidth={3.5} /> },
  erro: { familia: 'vermelho', glifo: <X strokeWidth={3.5} /> },
  info: { familia: 'azul', glifo: <Info strokeWidth={3} /> },
}

export function FaixaResultado({ tipo, titulo, children, acao, className }: {
  tipo: 'certo' | 'erro' | 'info'
  titulo: React.ReactNode
  children?: React.ReactNode
  acao?: React.ReactNode
  className?: string
}) {
  const t = TIPO[tipo]
  return (
    <div role="status" style={estiloFamilia(t.familia)}
      className={cn('animate-sobe flex flex-wrap items-center gap-x-4 gap-y-3 border-t-2 border-(--borda) bg-(--claro) px-5 py-4', className)}>
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-(--texto) [&_svg]:size-[18px]">{t.glifo}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[20px] font-bold leading-[26px] text-(--texto)">{titulo}</p>
        {children && <div className="t-apoio mt-0.5 text-(--texto)">{children}</div>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  )
}
