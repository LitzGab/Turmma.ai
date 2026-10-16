import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/* A OPÇÃO, o cartão de escolha (11ª rodada; seção 3.13): o cartão de resposta do onboarding do Duolingo.
   Altura mínima de 64, canto 12, borda de 2 e degrau de 4, ícone de 40 à esquerda e texto t-cartao.
   É um <label> com o <input> de verdade dentro: o rótulo inteiro é clicável, as setas andam no grupo de `radio`
   (mesmo `nome`) e a barra de espaço marca o `checkbox`. Escolhida: azul-claro, azul-borda e azul-texto, com um
   visto num círculo de 24 px à direita. */

export function Opcao({ tipo = 'radio', nome, valor, marcado, aoMudar, icone, children, disabled, className }: {
  tipo?: 'radio' | 'checkbox'
  /** o grupo (name do input); obrigatório no radio */
  nome?: string
  valor?: string
  marcado: boolean
  aoMudar: (marcado: boolean) => void
  icone?: React.ReactNode
  children: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  return (
    <label data-marcado={marcado || undefined} aria-disabled={disabled || undefined}
      className={cn(
        'degrau block w-full rounded-[12px] [--altura-degrau:4px] [--afunda:2px]',
        marcado ? '[--face:var(--color-azul-claro)] [--lado:var(--color-azul-borda)]' : 'degrau-branco [--face:var(--color-white)] [--lado:var(--color-borda)]',
        'has-[input:focus-visible]:outline-3 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-azul-texto has-[input:focus-visible]:outline-solid',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      )}>
      <input type={tipo} name={nome} value={valor} checked={marcado} disabled={disabled}
        onChange={(e) => aoMudar(e.currentTarget.checked)} className="sr-only" />
      <span className={cn('face min-h-16 justify-start gap-3 rounded-[12px] border-2 px-3 py-2 text-left',
        marcado ? 'border-azul-borda text-azul-texto' : 'border-borda text-tinta')}>
        {icone && <span aria-hidden className="grid size-10 shrink-0 place-items-center [&>svg]:size-full">{icone}</span>}
        <span className="t-cartao min-w-0 flex-1">{children}</span>
        <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-full border-2',
          marcado ? 'border-azul bg-azul text-white' : 'border-borda bg-white text-transparent')}>
          <Check className="size-3.5" strokeWidth={4} />
        </span>
      </span>
    </label>
  )
}
