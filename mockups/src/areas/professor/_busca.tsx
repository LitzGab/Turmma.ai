import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

/* O que o Catálogo e a Biblioteca dividem: a busca em pílula e a veste do botão em pílula da barra de 36 px. */

export const limpa = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export const campoBusca = 'h-9 w-full rounded-full border border-borda-campo bg-superficie pl-10 pr-3 text-sm text-tinta outline-none transition-colors duration-150 placeholder:text-inativo focus-visible:border-tinta'
export const pilula = 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium transition-colors duration-150'

export function Busca({ valor, aoMudar, rotulo, className }: { valor: string; aoMudar: (v: string) => void; rotulo: string; className?: string }) {
  return (
    <label className={cn('relative w-full sm:w-64', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-inativo" />
      <input value={valor} onChange={(e) => aoMudar(e.target.value)} placeholder={rotulo} aria-label={rotulo} className={campoBusca} />
    </label>
  )
}
