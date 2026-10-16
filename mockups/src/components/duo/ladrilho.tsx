import * as React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { familia as estiloFamilia, type Familia } from './familia'

/* OS LADRILHOS (11ª rodada; seção 3.4).
   · LadrilhoIcone: quadrado de canto 12 (32, 40, 44 ou 56 px), fundo no tom claro da família e o ícone ilustrado no
     meio, a 72% do lado. Não aperta.
   · LadrilhoAcao: o atalho grande, que aperta — face branca, borda de 2, degrau de 4, canto 16, 110 × 96 no computador
     e 104 × 88 no celular, ícone de 40 e o rótulo em t-selo, centralizado, em até 2 linhas. */

export function LadrilhoIcone({ familia = 'laranja', tamanho = 44, icone, rotulo, className }: {
  familia?: Familia
  tamanho?: 32 | 40 | 44 | 56
  icone: React.ReactNode
  /** sem rótulo, o ladrilho é decoração (aria-hidden) */
  rotulo?: string
  className?: string
}) {
  return (
    <span role={rotulo ? 'img' : undefined} aria-label={rotulo} aria-hidden={rotulo ? undefined : true}
      style={{ ...estiloFamilia(familia), width: tamanho, height: tamanho }}
      className={cn('grid shrink-0 place-items-center bg-(--claro)', 'rounded-[12px]', className)}>
      <span className="grid size-[72%] place-items-center [&>svg]:size-full">{icone}</span>
    </span>
  )
}

type AcaoProps = {
  icone: React.ReactNode
  rotulo: string
  className?: string
} & ({ para: string; onClick?: () => void } | { para?: undefined; onClick?: () => void })

export function LadrilhoAcao({ icone, rotulo, className, para, onClick }: AcaoProps) {
  const caixa = cn(
    'degrau degrau-branco block shrink-0 rounded-[16px] [--altura-degrau:4px] [--face:var(--color-white)] [--lado:var(--color-borda)]',
    'h-[88px] w-[104px] md:h-[96px] md:w-[110px]',
    className,
  )
  const face = (
    <span className="face h-full flex-col gap-1.5 rounded-[16px] border-2 border-borda px-1.5 text-center">
      <span className="grid size-10 place-items-center [&>svg]:size-full">{icone}</span>
      <span className="t-selo line-clamp-2 text-apoio">{rotulo}</span>
    </span>
  )
  if (para !== undefined) return <Link to={para} onClick={onClick} className={caixa}>{face}</Link>
  return <button type="button" onClick={onClick} className={caixa}>{face}</button>
}
