import * as React from 'react'
import { cn } from '@/lib/utils'

/* O TOQUE (12ª rodada): a escolha rápida em pílula de 40 px ("Alguém me tratou mal", "1 dia · 7 dias · 30 dias",
   as turmas do convite). Borda de 2 px e degrau de 3 px (aperta); escolhido em azul (claro, borda e texto).
   GrupoToques: um ou vários (`multiplo`), com o rótulo do grupo para o leitor de tela. */

export function Toque({ selecionado, aoMudar, children, icone, disabled, className }: {
  selecionado: boolean
  aoMudar: () => void
  children: React.ReactNode
  icone?: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  return (
    <button type="button" aria-pressed={selecionado} disabled={disabled} onClick={aoMudar}
      className={cn(
        'degrau inline-flex shrink-0 rounded-full [--altura-degrau:3px] [--afunda:3px]',
        selecionado ? '[--face:var(--color-azul-claro)] [--lado:var(--color-azul-borda)]' : 'degrau-branco [--face:var(--color-white)] [--lado:var(--color-borda)]',
        className,
      )}>
      <span className={cn('face h-10 rounded-full border-2 px-4 text-[15px] font-bold leading-none [&_svg]:size-[18px]',
        selecionado ? 'border-azul-borda text-azul-texto' : 'border-borda text-apoio')}>
        {icone}{children}
      </span>
    </button>
  )
}

export type OpcaoToque = { id: string; rotulo: string; icone?: React.ReactNode }

export function GrupoToques({ opcoes, valor, aoMudar, multiplo, rotulo, className }: {
  opcoes: OpcaoToque[]
  /** o escolhido (ou os escolhidos, no múltiplo) */
  valor: string | string[] | null
  aoMudar: (valor: string | string[]) => void
  multiplo?: boolean
  rotulo?: string
  className?: string
}) {
  const marcados = Array.isArray(valor) ? valor : valor ? [valor] : []
  const tocar = (id: string) => {
    if (!multiplo) { aoMudar(id); return }
    aoMudar(marcados.includes(id) ? marcados.filter((x) => x !== id) : [...marcados, id])
  }
  return (
    <div role="group" aria-label={rotulo} className={cn('flex flex-wrap gap-2', className)}>
      {opcoes.map((o) => (
        <Toque key={o.id} selecionado={marcados.includes(o.id)} aoMudar={() => tocar(o.id)} icone={o.icone}>{o.rotulo}</Toque>
      ))}
    </div>
  )
}
