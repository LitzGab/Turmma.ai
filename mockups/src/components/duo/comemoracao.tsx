import * as React from 'react'
import { cn } from '@/lib/utils'
import { PINTA_PATH } from './onca'

/* A COMEMORAÇÃO (11ª rodada; seção 3.12): a onça (pose `comemorando`, entra por `ilustracao`) SALTA uma vez (600 ms)
   e cinco pintas laranja — a marca: "cada estudante é uma pinta" — saem de trás dela em leque e somem em 700 ms, só
   por transform e opacity (--dx, --dy e --giro em cada uma). Título em 24/700 verde-texto e, no máximo, um botão.
   Uma vez, e para. Com movimento reduzido, tudo aparece parado (a regra global do index.css).
   Só comemora ENTREGA e ACERTO, nunca nota (seção 4.8). Nada de confete em laço, nada de recompensa variável
   (ECA Digital, Lei 15.211/2025; Decreto 12.880/2026). */

const PINTAS = [
  { dx: -96, dy: -54, giro: -50, t: 22 },
  { dx: -52, dy: -98, giro: 35, t: 16 },
  { dx: 6, dy: -112, giro: 80, t: 20 },
  { dx: 58, dy: -94, giro: -30, t: 15 },
  { dx: 100, dy: -48, giro: 60, t: 21 },
]

export function Comemoracao({ ilustracao, titulo, acao, aoTerminar, className }: {
  ilustracao: React.ReactNode
  titulo: React.ReactNode
  acao?: React.ReactNode
  aoTerminar?: () => void
  className?: string
}) {
  React.useEffect(() => {
    if (!aoTerminar) return
    const t = window.setTimeout(aoTerminar, 700)
    return () => window.clearTimeout(t)
  }, [aoTerminar])
  return (
    <div role="status" className={cn('flex flex-col items-center gap-4 text-center', className)}>
      <div className="relative isolate grid place-items-center">
        {PINTAS.map((p, i) => (
          <svg key={i} aria-hidden viewBox="-500 -500 1000 1000" width={p.t} height={p.t}
            className="absolute left-1/2 top-1/2 -z-10 -ml-[10px] -mt-[10px] opacity-0"
            style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--giro': `${p.giro}deg`,
              animation: `pinta-voa 700ms cubic-bezier(.22,1,.36,1) ${80 + i * 25}ms both` } as React.CSSProperties}>
            <path d={PINTA_PATH} fill="#E8732E" fillRule="evenodd" />
          </svg>
        ))}
        <div className="animate-salta">{ilustracao}</div>
      </div>
      <p className="text-[24px] font-bold leading-[30px] text-verde-texto">{titulo}</p>
      {acao}
    </div>
  )
}
