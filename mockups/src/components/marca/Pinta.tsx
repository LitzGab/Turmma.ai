import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/** A pinta da onça — a marca da Turmma. Herda a cor de quem a contém.
 *  Não gira, não estica e não vira indicador de carregamento (interface.md 9.6). */
export function Pinta({ className = 'h-6 w-6', style, rotulo }: {
  className?: string; style?: CSSProperties; rotulo?: string
}) {
  return (
    <svg viewBox="-34 -34 68 68" className={className} style={style} fill="currentColor"
      role={rotulo ? 'img' : undefined} aria-label={rotulo} aria-hidden={rotulo ? undefined : true}>
      <ellipse cx="-1.8" cy="-20.9" rx="11" ry="7.5" transform="rotate(-5 -1.8 -20.9)" />
      <ellipse cx="15.3" cy="-12.9" rx="9" ry="7" transform="rotate(50 15.3 -12.9)" />
      <ellipse cx="21.3" cy="5.7" rx="11.5" ry="8" transform="rotate(105 21.3 5.7)" />
      <ellipse cx="6.5" cy="17.9" rx="8.5" ry="6.5" transform="rotate(160 6.5 17.9)" />
      <ellipse cx="-12" cy="17.2" rx="10.5" ry="7.5" transform="rotate(215 -12 17.2)" />
      <ellipse cx="-19.9" cy="-1.7" rx="9.5" ry="7" transform="rotate(275 -19.9 -1.7)" />
      <circle cx="-2" cy="3" r="5.5" />
      <circle cx="6" cy="-5" r="3" />
    </svg>
  )
}

/** O lockup: pinta caramelo + palavra em Fustat. */
export function Marca({ className, negativo = false }: { className?: string; negativo?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-marca text-[20px] font-semibold tracking-[-0.03em]',
      negativo ? 'text-white' : 'text-tinta', className)}>
      <Pinta className="h-[1.2em] w-[1.2em] shrink-0 text-caramelo" />
      Turmma
    </span>
  )
}

/* Cada turma tem a pinta dela (manual da marca): mesma forma, giro e cor fixos por turma.
   No mockup o giro e a cor saem do nome da turma, sempre iguais para a mesma turma. */
const CORES_TURMA = ['#E8732E', '#0D0D0D', '#E8732E', '#5D5D5D', '#E8732E', '#0D0D0D']

export function PintaTurma({ turma, className = 'h-7 w-7' }: { turma: string; className?: string }) {
  let soma = 0
  for (const c of turma) soma += c.charCodeAt(0)
  const cor = CORES_TURMA[soma % CORES_TURMA.length]
  return (
    <span aria-hidden className={cn('grid shrink-0 place-items-center rounded-full bg-realce-suave', className)}>
      <Pinta className="h-[70%] w-[70%]" style={{ color: cor, transform: `rotate(${(soma * 47) % 360}deg)` }} />
    </span>
  )
}
