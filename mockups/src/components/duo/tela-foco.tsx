import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BotaoIcone } from './botao'
import { BarraProgresso } from './progresso'
import type { Familia } from './familia'

/* A TELA DE FOCO (12ª rodada; R2): sem a casca (sem lateral, sem barra de baixo), para o que pede a pessoa inteira:
   a prova do aluno, o primeiro acesso com a onça, "Começar aula". Topo de 64 px com borda de 2 px (some quando não há
   nada nele): voltar (‹ ou ×),
   o título, o meio (a barra de progresso, quando há) e até duas ações fantasmas. O miolo rola por dentro; o rodapé
   fica preso embaixo. Cabe em 1440 × 780 e em 375. */

export function TelaFoco({ topo, progresso, rodape, children, className, classeMiolo }: {
  topo: {
    /** rota, função, ou false (sem voltar). O padrão volta no histórico */
    voltar?: string | (() => void) | false
    /** o glifo do voltar: ‹ (padrão) ou × (sair de uma coisa inteira) */
    sair?: boolean
    titulo?: React.ReactNode
    meio?: React.ReactNode
    acoes?: React.ReactNode
  }
  /** a barra do que tem fim (questões da prova) */
  progresso?: { valor: number; max: number; familia?: Familia; rotulo?: string }
  rodape?: React.ReactNode
  children: React.ReactNode
  className?: string
  classeMiolo?: string
}) {
  const navegar = useNavigate()
  const ir = () => {
    const v = topo.voltar
    if (typeof v === 'function') v()
    else if (typeof v === 'string') navegar(v)
    else navegar(-1)
  }
  const meio = topo.meio ?? (progresso ? (
    <BarraProgresso valor={progresso.valor} max={progresso.max} familia={progresso.familia ?? 'verde'} rotulo={progresso.rotulo ?? 'Progresso'} className="max-w-[560px]" />
  ) : null)
  return (
    <div className={cn('flex h-svh min-h-0 flex-col bg-white text-tinta', className)}>
      {(topo.voltar !== false || topo.titulo || meio || topo.acoes) && <header className="flex h-16 shrink-0 items-center gap-3 border-b-2 border-borda px-3 md:px-5">
        {topo.voltar !== false && (
          <BotaoIcone rotulo={topo.sair ? 'Sair' : 'Voltar'} onClick={ir}>
            {topo.sair ? <X strokeWidth={2.5} /> : <ChevronLeft strokeWidth={2.5} />}
          </BotaoIcone>
        )}
        {topo.titulo && <h1 className="t-cartao min-w-0 shrink truncate text-tinta">{topo.titulo}</h1>}
        <div className="flex min-w-0 flex-1 items-center justify-center">{meio}</div>
        {topo.acoes && <div className="flex shrink-0 items-center gap-1">{topo.acoes}</div>}
      </header>}
      <main className={cn('min-h-0 flex-1 overflow-y-auto', classeMiolo)}>{children}</main>
      {rodape && (
        <footer className="shrink-0 border-t-2 border-borda bg-white px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] md:px-6">{rodape}</footer>
      )}
    </div>
  )
}
