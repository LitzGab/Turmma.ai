import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/* A TABELA (12ª rodada): para o que se compara linha a linha (alunos, professores, o que a IA gerou, as escolas).
   · Cabeçalho em t-selo `sutil`; linhas de 64 px separadas por 2 px `borda`; a linha ativa em `azul-claro`.
   · Com `aoAbrir`, a linha inteira abre (R5): Enter e espaço também.
   · `rolaPorDentro`: a tabela ocupa o espaço que sobra e rola por dentro, com o cabeçalho preso (R10).
   · A 375, cada linha vira um cartão empilhado: a primeira coluna é o título, as outras vêm embaixo com o nome.
   Sem ordenar por nota nem por pessoa (D64): a ordem é a que a tela passa. */

export type ColunaTabela<T> = {
  titulo: string
  /** classes da coluna (largura, alinhamento) */
  classe?: string
  celula: (linha: T) => React.ReactNode
  /** some a 375 (o dado é secundário) */
  soComputador?: boolean
}

export function Tabela<T>({ colunas, linhas, chave, aoAbrir, ativa, vazio = 'Nada por aqui.', rolaPorDentro, rotulo, className }: {
  colunas: ColunaTabela<T>[]
  linhas: T[]
  chave: (linha: T) => string
  aoAbrir?: (linha: T) => void
  /** a chave da linha aberta ao lado */
  ativa?: string | null
  vazio?: React.ReactNode
  rolaPorDentro?: boolean
  /** o nome da tabela, para o leitor de tela */
  rotulo?: string
  className?: string
}) {
  const teclar = (e: React.KeyboardEvent, l: T) => {
    if (!aoAbrir || (e.key !== 'Enter' && e.key !== ' ')) return
    e.preventDefault()
    aoAbrir(l)
  }
  if (!linhas.length) {
    return <div className={cn('rounded-[16px] border-2 border-borda bg-white px-4 py-6 text-center t-apoio', className)}>{vazio}</div>
  }
  return (
    <div className={cn('overflow-hidden rounded-[16px] border-2 border-borda bg-white', rolaPorDentro && 'flex min-h-0 flex-col', className)}>
      {/* computador: tabela de verdade */}
      <div className={cn('hidden md:block', rolaPorDentro && 'min-h-0 flex-1 overflow-y-auto overscroll-contain')}>
        <table className="w-full border-collapse text-left" aria-label={rotulo}>
          <thead className={cn('bg-white', rolaPorDentro && 'sticky top-0 z-[1] shadow-[inset_0_-2px_0_var(--color-borda)]')}>
            <tr className={cn(!rolaPorDentro && 'border-b-2 border-borda')}>
              {colunas.map((c) => <th key={c.titulo} scope="col" className={cn('t-selo h-11 px-4 align-middle text-sutil', c.classe)}>{c.titulo}</th>)}
              {aoAbrir && <th aria-hidden className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const k = chave(l)
              const aberta = ativa === k
              return (
                <tr key={k} tabIndex={aoAbrir ? 0 : undefined} onClick={aoAbrir ? () => aoAbrir(l) : undefined} onKeyDown={(e) => teclar(e, l)}
                  aria-selected={aoAbrir ? aberta : undefined}
                  className={cn('h-16 border-t-2 border-borda first:border-t-0 text-[15px] font-medium text-tinta transition-colors duration-150',
                    aoAbrir && 'cursor-pointer hover:bg-fundo-suave focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-azul-texto',
                    aberta && 'bg-azul-claro hover:bg-azul-claro')}>
                  {colunas.map((c) => <td key={c.titulo} className={cn('px-4 py-2 align-middle', c.classe)}>{c.celula(l)}</td>)}
                  {aoAbrir && <td className="pr-3"><ChevronRight aria-hidden strokeWidth={2.5} className="size-5 text-apagado" /></td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* celular: cada linha é um cartão empilhado */}
      <ul className={cn('md:hidden', rolaPorDentro && 'min-h-0 flex-1 overflow-y-auto')} aria-label={rotulo}>
        {linhas.map((l) => {
          const k = chave(l)
          const [primeira, ...resto] = colunas.filter((c) => !c.soComputador)
          const conteudo = (
            <>
              <div className="t-cartao min-w-0 text-tinta">{primeira?.celula(l)}</div>
              {resto.length > 0 && (
                <dl className="mt-1.5 grid gap-1">
                  {resto.map((c) => (
                    <div key={c.titulo} className="flex min-w-0 items-center justify-between gap-3">
                      <dt className="t-selo shrink-0 text-sutil">{c.titulo}</dt>
                      <dd className="min-w-0 text-right text-[15px] font-medium text-tinta">{c.celula(l)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </>
          )
          return (
            <li key={k} className="border-t-2 border-borda first:border-t-0">
              {aoAbrir
                ? <button type="button" onClick={() => aoAbrir(l)} className={cn('block w-full px-4 py-3 text-left hover:bg-fundo-suave', ativa === k && 'bg-azul-claro')}>{conteudo}</button>
                : <div className="px-4 py-3">{conteudo}</div>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
