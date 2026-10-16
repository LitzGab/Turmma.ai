import { Busca as BuscaDuo, CLASSE_CAMPO } from '@/components/duo'
import { cn } from '@/lib/utils'

/* O que o Catálogo e Criados dividem: a busca e a veste do botão em pílula da barra de controles.
   12ª rodada: a busca é a peça duo (44 px, borda de 2 px, canto 12, foco em azul). */

export const limpa = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export const campoBusca = cn(CLASSE_CAMPO, 'h-11 pl-11 text-[16px]')
export const pilula = 'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border-2 border-borda px-4 text-[15px] font-bold transition-colors duration-150'

export function Busca({ valor, aoMudar, rotulo, className }: { valor: string; aoMudar: (v: string) => void; rotulo: string; className?: string }) {
  return <BuscaDuo valor={valor} aoMudar={aoMudar} rotulo={rotulo} className={cn('w-full sm:w-64', className)} />
}
