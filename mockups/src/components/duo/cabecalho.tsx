import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Marca, Pinta } from '@/components/marca/Pinta'
import { cn } from '@/lib/utils'
import { BotaoIcone } from './botao'

/* CABEÇALHO E BARRA DO APP (11ª rodada; seção 3.9).
   · Cabecalho (página de objeto): ‹ voltar como botão fantasma redondo de 40, título t-titulo, uma ação e o ⋯.
     Mede 64 px, sem descrição (R6). 14ª rodada: guarda o canto do sino (--reserva-sino), como o CabecalhoPagina.
   · BarraApp (a secretaria agora; a Família e a Operação depois): 72 px, fundo branco, borda de baixo de 2 px; à
     esquerda a Marca, uma linha vertical de 2 px e o contexto; à direita as ações (até uma e o avatar). No celular,
     56 px e só a pinta. */

export function Cabecalho({ voltar, titulo, acao, menu, className }: {
  /** para onde volta (rota), ou o que fazer; sem ele, volta no histórico */
  voltar?: string | (() => void) | false
  titulo: React.ReactNode
  acao?: React.ReactNode
  menu?: React.ReactNode
  className?: string
}) {
  const navegar = useNavigate()
  const ir = () => {
    if (typeof voltar === 'function') voltar()
    else if (typeof voltar === 'string') navegar(voltar)
    else navegar(-1)
  }
  return (
    <header className={cn('flex min-h-16 shrink-0 items-center gap-3 md:pr-[var(--reserva-sino,0px)]', className)}>
      {voltar !== false && (
        <BotaoIcone rotulo="Voltar" onClick={ir} className="-ml-2"><ChevronLeft strokeWidth={2.5} /></BotaoIcone>
      )}
      <h1 className="t-titulo min-w-0 flex-1 truncate text-tinta">{titulo}</h1>
      {acao}
      {menu}
    </header>
  )
}

export function BarraApp({ esquerda, contexto, acoes, className }: {
  /** no lugar da Marca */
  esquerda?: React.ReactNode
  contexto: React.ReactNode
  acoes?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex h-14 shrink-0 items-center gap-3 border-b-2 border-borda bg-white px-4 md:h-[72px] md:gap-4 md:px-6', className)}>
      {esquerda ?? (
        <>
          <Marca className="hidden text-[24px] md:inline-flex" />
          <Pinta className="h-7 w-7 shrink-0 text-laranja md:hidden" rotulo="Turmma" />
        </>
      )}
      <span aria-hidden className="h-8 w-[2px] shrink-0 bg-borda" />
      <div className="flex min-w-0 flex-1 items-center gap-3">{contexto}</div>
      {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
    </header>
  )
}
