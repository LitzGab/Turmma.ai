import { cn } from '@/lib/utils'

/* O INTERRUPTOR (12ª rodada): liga e desliga uma coisa, na hora (sem SALVAR). Trilho de 52 × 32 com borda de 2 px;
   desligado em `borda`, ligado em `azul` (selecionado). A bolinha branca anda por transform. O estado também vai
   escrito para o leitor de tela (role="switch", aria-checked). */

export function Interruptor({ ligado, aoMudar, rotulo, disabled, className }: {
  ligado: boolean
  aoMudar: (ligado: boolean) => void
  /** o que liga, para o leitor de tela (o rótulo visível fica ao lado) */
  rotulo: string
  disabled?: boolean
  className?: string
}) {
  return (
    <button type="button" role="switch" aria-checked={ligado} aria-label={rotulo} disabled={disabled}
      onClick={() => aoMudar(!ligado)}
      className={cn(
        'relative inline-flex h-8 w-[52px] shrink-0 items-center rounded-full border-2 transition-colors duration-150',
        ligado ? 'border-azul-degrau bg-azul' : 'border-borda bg-borda',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}>
      <span aria-hidden className={cn('block size-6 rounded-full bg-white transition-transform duration-150',
        ligado ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
    </button>
  )
}
