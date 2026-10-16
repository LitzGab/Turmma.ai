import * as React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* A LINHA (11ª rodada; seção 3.3): a peça de toda lista dentro de cartão — Pra fazer, as escolas da secretaria,
   "O que mudou".
   Ordem: [início: ladrilho ou avatar] [título t-cartao, 1 linha · abaixo: selos e/ou apoio] [fim].
   Mede 64 px e se separa da de cima por uma linha de 2 px. O título corta com reticência e o `title` guarda o texto
   inteiro. O chevron (glifo, 20 px, apagado) é opcional; a linha solta, fora de cartão, vira um Cartao clicável. */

export type LinhaProps = {
  inicio?: React.ReactNode
  titulo: string
  abaixo?: React.ReactNode
  fim?: React.ReactNode
  chevron?: boolean
  para?: string
  onClick?: () => void
  className?: string
  'aria-label'?: string
}

export function Linha({ inicio, titulo, abaixo, fim, chevron, para, onClick, className, ...aria }: LinhaProps) {
  const clicavel = para !== undefined || onClick !== undefined
  const classe = cn(
    'group/linha flex min-h-16 w-full items-center gap-3 border-t-2 border-borda px-4 py-2 text-left first:border-t-0',
    clicavel && 'transition-colors duration-150 hover:bg-fundo-suave',
    className,
  )
  const miolo = (
    <>
      {inicio && <span className="flex shrink-0 items-center">{inicio}</span>}
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="t-cartao truncate text-tinta" title={titulo}>{titulo}</span>
        {abaixo && <span className="flex min-w-0 flex-wrap items-center gap-1.5 t-apoio">{abaixo}</span>}
      </span>
      {fim && <span className="flex shrink-0 items-center gap-2">{fim}</span>}
      {chevron && <ChevronRight aria-hidden strokeWidth={2.5} className="size-5 shrink-0 text-apagado transition-transform duration-150 group-hover/linha:translate-x-0.5" />}
    </>
  )
  if (para !== undefined) return <Link to={para} onClick={onClick} className={classe} aria-label={aria['aria-label']}>{miolo}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={classe} aria-label={aria['aria-label']}>{miolo}</button>
  return <div className={classe}>{miolo}</div>
}
