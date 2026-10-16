import * as React from 'react'
import { cn } from '@/lib/utils'

/* O ESTADO VAZIO (11ª rodada; seção 3.12): a onça (que entra por `ilustracao`), o título em t-secao, com 2 a 4
   palavras, e no máximo um botão. NÃO tem parágrafo explicando. */

export function EstadoVazio({ ilustracao, titulo, acao, className }: {
  ilustracao?: React.ReactNode
  titulo: React.ReactNode
  acao?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-4 py-6 text-center', className)}>
      {ilustracao}
      <h3 className="t-secao text-tinta">{titulo}</h3>
      {acao}
    </div>
  )
}
