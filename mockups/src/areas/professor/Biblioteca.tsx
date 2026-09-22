import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDownAZ, ArrowUpRight, Clock3, Copy, FileDown, FolderInput, LayoutGrid, List, MoreVertical, SearchX, Trash2 } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PaginaMini } from '@/components/turmma/pagina-mini'
import { BIBLIOTECA, type EstadoDoc, type ItemBiblioteca } from '@/dados/biblioteca'
import { useAcervo } from '@/dados/conversas'
import { escolaDe, TURMAS } from '@/dados/escola'
import { ferramenta } from '@/dados/ferramentas'
import { cn } from '@/lib/utils'
import { Busca, limpa, pilula } from './_busca'

/* A BIBLIOTECA no desenho do Google Docs: grade de miniaturas, nome, tipo, turma e data, menu de três pontos; filtro
   por tipo e por turma, ordem, e a troca entre grade e lista. Sem pastas: quem organiza é o Projeto.
   · A miniatura é O PRÓPRIO DOCUMENTO aparecendo em parte (pedido do Gabriel em 20/09/2026: "tiraria essas capas
     falsas e deixaria o documento real aparecendo em partes"): os documentos e o texto de cada um moram em
     `dados/biblioteca`, e `turmma/pagina-mini` desenha esse texto de verdade, minúsculo, cortado pelo esfumado.
   · Menos cor: o glifo do tipo é um quadradinho neutro, igual para todas as categorias.
   A tela (Ferramentas.tsx) chama `useBiblioteca()` e recebe a barra (o que vai na linha de 36 px) e o conteúdo. */

type Estado = EstadoDoc
type Item = ItemBiblioteca

const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
const quando = ([d, m]: [number, number]) => (d === 21 && m === 9 ? 'Hoje' : `${d} de ${MESES[m - 1]}`)
const ordem = ([d, m]: [number, number]) => m * 100 + d
/* `selo` é a largura do selo na miniatura, em px (11 px, peso 500, 8 px de cada lado): a folha reserva esse canto. */
const ESTADO: Record<Estado, { nome: string; classe: string; selo?: number }> = {
  aprovado: { nome: 'Aprovado', classe: 'text-sutil' },
  rascunho: { nome: 'Rascunho', classe: 'text-apoio', selo: 69 },
  espera: { nome: 'Espera você', classe: 'text-pendente', selo: 82 },
}

/** O quadradinho do tipo, no lugar do ícone azul do Docs: o traço da ferramenta, neutro, igual para todos os tipos. */
function GlifoTipo({ de, className }: { de: string; className?: string }) {
  const Icone = ferramenta(de)?.icon
  if (!Icone) return null
  return <span className={cn('grid size-5 shrink-0 place-items-center rounded-[6px] bg-realce-suave text-tinta', className)}><Icone className="size-3" strokeWidth={2.2} /></span>
}

/** A linha fina do alto da folha: a escola da turma, a turma e a disciplina. */
function cabecalho(turma: string) {
  const t = TURMAS.find((x) => x.nome === turma)
  return `${escolaDe(t?.escolaId ?? 'aurora').nome} · ${turma} · ${t?.disciplina ?? 'Química'}`
}

function MenuItem({ item }: { item: Item }) {
  const { projetos } = useAcervo()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`Mais ações para ${item.titulo}`} className="grid size-8 shrink-0 place-items-center rounded-full text-sutil transition-colors duration-150 hover:bg-realce-suave hover:text-tinta data-[state=open]:bg-realce-suave data-[state=open]:text-tinta">
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-controle">
        <DropdownMenuItem asChild className="h-9 rounded-linha"><Link to="/professor/biblioteca/prova-estequiometria"><ArrowUpRight /> Abrir</Link></DropdownMenuItem>
        <DropdownMenuItem className="h-9 rounded-linha"><FileDown /> Exportar</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="h-9 rounded-linha [&>svg:first-child]:size-4"><FolderInput /> Mover para um projeto</DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52 rounded-controle">
            {projetos.map((p) => <DropdownMenuItem key={p.id} className="h-9 rounded-linha"><span className="truncate">{p.nome}</span></DropdownMenuItem>)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem className="h-9 rounded-linha"><Copy /> Fazer uma cópia</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-9 rounded-linha text-erro focus:text-erro"><Trash2 /> Apagar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Filtro({ valor, aoMudar, opcoes, todos, rotulo }: { valor: string; aoMudar: (v: string) => void; opcoes: string[]; todos: string; rotulo: string }) {
  return (
    <Select value={valor} onValueChange={aoMudar}>
      <SelectTrigger aria-label={rotulo} className={cn('h-9 w-auto gap-2 rounded-full border-borda-campo bg-superficie px-3.5 text-[13.5px] font-medium text-tinta shadow-none focus:ring-0 focus-visible:border-tinta', valor !== 'todos' && 'border-tinta bg-realce-suave')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-controle">
        <SelectItem value="todos" className="rounded-linha">{todos}</SelectItem>
        {opcoes.map((o) => <SelectItem key={o} value={o} className="rounded-linha">{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

type Vista = 'grade' | 'lista'
type FiltrosBib = { busca: string; tipo: string; turma: string; az: boolean; vista: Vista }

const TIPOS_BIB = [...new Set(BIBLIOTECA.map((a) => ferramenta(a.de)?.nome ?? a.de))]

function Estante({ f }: { f: FiltrosBib }) {
  const navegar = useNavigate()
  const q = limpa(f.busca.trim())
  const itens = BIBLIOTECA
    .filter((a) => (f.tipo === 'todos' || ferramenta(a.de)?.nome === f.tipo) && (f.turma === 'todos' || a.turma === f.turma) && (!q || limpa(`${a.titulo} ${ferramenta(a.de)?.nome} ${a.turma}`).includes(q)))
    .sort((a, b) => (f.az ? a.titulo.localeCompare(b.titulo, 'pt-BR') : ordem(b.em) - ordem(a.em) || a.n - b.n))

  if (itens.length === 0) return (
    /* Vazio é convite para agir (seção 6) */
    <EmptyState className="mx-auto max-w-none rounded-cartao border border-dashed border-borda-campo bg-superficie p-10 hover:bg-superficie [&_.shadow-lg]:shadow-none"
      icons={[SearchX]} title={q ? 'Nada com esse nome' : 'Nada aqui ainda'}
      description="Peça ao Assistente ou abra uma ferramenta: o que você gerar fica guardado aqui, ligado à turma."
      action={{ label: 'Ver as ferramentas', onClick: () => navegar('/professor/ferramentas') }} />
  )

  if (f.vista === 'lista') return (
    <div className="overflow-hidden rounded-cartao border border-linha">
      <div className="hidden grid-cols-[minmax(0,1fr)_170px_70px_120px_96px_40px] items-center gap-3 border-b border-linha bg-lateral px-3 py-2 text-[12.5px] font-medium text-sutil md:grid">
        <span className="pl-8">Nome</span><span>Tipo</span><span>Turma</span><span>Estado</span><span>Modificado</span><span />
      </div>
      <ul>
        {itens.map((a) => (
          <li key={a.n} className="group relative grid grid-cols-[minmax(0,1fr)_40px] items-center gap-3 border-b border-linha px-3 transition-colors duration-150 last:border-0 hover:bg-realce-suave md:grid-cols-[minmax(0,1fr)_170px_70px_120px_96px_40px]">
            <Link to="/professor/biblioteca/prova-estequiometria" className="flex min-w-0 items-center gap-3 py-2.5 after:absolute after:inset-0">
              <GlifoTipo de={a.de} />
              <span className="min-w-0"><span className="block truncate text-[14px] font-medium text-tinta">{a.titulo}</span><span className="block truncate text-[12.5px] text-sutil md:hidden">{ferramenta(a.de)?.nome} · {a.turma} · {quando(a.em)}</span></span>
            </Link>
            <span className="hidden truncate text-[13px] text-sutil md:block">{ferramenta(a.de)?.nome}</span>
            <span className="hidden text-[13px] text-sutil md:block">{a.turma}</span>
            <span className={cn('hidden items-center gap-1.5 text-[13px] md:flex', ESTADO[a.estado].classe)}>{a.estado === 'espera' && <i className="block size-1.5 rounded-full bg-caramelo" />}{ESTADO[a.estado].nome}</span>
            <span className="hidden text-[13px] tabular-nums text-sutil md:block">{quando(a.em)}</span>
            <span className="relative z-[1]"><MenuItem item={a} /></span>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 min-[1700px]:grid-cols-6">
      {itens.map((a) => (
        <li key={a.n} className="group @container relative min-w-0 overflow-hidden rounded-[10px] border border-linha bg-superficie transition-[box-shadow,border-color] duration-150 focus-within:border-tinta hover:border-borda-campo hover:shadow-[0_1px_3px_rgba(0,0,0,.08),0_6px_18px_-6px_rgba(0,0,0,.14)]">
          <Link to="/professor/biblioteca/prova-estequiometria" aria-label={`${a.titulo}, ${ferramenta(a.de)?.nome}, ${a.turma}`} className="block outline-none after:absolute after:inset-0">
            <span className="relative block aspect-[4/3.35] overflow-hidden border-b border-linha">
              <PaginaMini titulo={a.folha ?? a.titulo} cabecalho={cabecalho(a.turma)} blocos={a.blocos} ampliada={a.ampliada} selo={ESTADO[a.estado].selo} />
              <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-white to-transparent" />
              {a.estado !== 'aprovado' && (
                /* o selo fica no canto de cima e a folha reserva esse canto (`selo` no PaginaMini): o título quebra antes
                   dele em vez de passar por baixo ("Planejamento até o fim do bimestre" ficava com o selo em cima).
                   Em cartão estreito (menos de 200 px: celular, janela pequena) não sobra canto: desce para o esfumado. */
                <span className={cn('absolute bottom-2 right-2 rounded-full px-2 py-[3px] text-[11px] font-medium leading-none ring-1 @min-[200px]:bottom-auto @min-[200px]:top-2', a.estado === 'espera' ? 'bg-pendente-cx text-pendente ring-caramelo/30' : 'bg-superficie text-apoio ring-linha')}>{ESTADO[a.estado].nome}</span>
              )}
            </span>
            <span className="block px-3 pb-2.5 pt-2.5">
              {/* o título usa a largura toda: o menu fica na linha de baixo, então não precisa de reserva à direita */}
              <span className="block truncate text-[14px] font-medium leading-snug text-tinta">{a.titulo}</span>
              <span className="mt-1.5 flex items-center gap-2 pr-7 text-[12.5px] leading-none text-sutil"><GlifoTipo de={a.de} /><span className="truncate">{a.turma} · {quando(a.em)}</span></span>
            </span>
          </Link>
          <span className="absolute bottom-1 right-1 z-[1]"><MenuItem item={a} /></span>
        </li>
      ))}
    </ul>
  )
}

export function useBiblioteca(): { barra: ReactNode; conteudo: ReactNode } {
  const [bib, setBib] = useState<FiltrosBib>({ busca: '', tipo: 'todos', turma: 'todos', az: false, vista: 'grade' })
  const muda = (p: Partial<FiltrosBib>) => setBib((b) => ({ ...b, ...p }))
  return {
    barra: (
      <>
        {/* abaixo de 1340 px (83.75rem; em rem para o Tailwind ordenar depois do `sm`) a busca encolhe, para o seletor
            de grade e lista não cair sozinho na linha de baixo */}
        <Busca valor={bib.busca} aoMudar={(v) => muda({ busca: v })} rotulo="Buscar na biblioteca" className="sm:w-[186px] min-[83.75rem]:w-64" />
        <Filtro rotulo="Filtrar por tipo" todos="Todos os tipos" valor={bib.tipo} aoMudar={(v) => muda({ tipo: v })} opcoes={TIPOS_BIB} />
        <Filtro rotulo="Filtrar por turma" todos="Todas as turmas" valor={bib.turma} aoMudar={(v) => muda({ turma: v })} opcoes={['2ºB', '2ºA', '1ºC', '9ºA']} />
        {/* a ordem e o seletor andam juntos, encostados à direita: se a linha quebrar, descem os dois, nunca um sozinho */}
        <div className="flex items-center gap-2 lg:ml-auto">
          <button type="button" onClick={() => muda({ az: !bib.az })} className={cn(pilula, 'text-sutil hover:bg-realce-suave hover:text-tinta')}>
            {bib.az ? <ArrowDownAZ className="size-4" /> : <Clock3 className="size-4" />} {bib.az ? 'De A a Z' : 'Mais recentes'}
          </button>
          <div role="group" aria-label="Como mostrar" className="flex rounded-full bg-realce-suave p-1">
            {([['grade', LayoutGrid, 'Grade'], ['lista', List, 'Lista']] as const).map(([v, Icone, nome]) => (
              <button key={v} type="button" aria-pressed={bib.vista === v} aria-label={nome} title={nome} onClick={() => muda({ vista: v })}
                className={cn('grid h-7 w-9 place-items-center rounded-full transition-colors duration-150', bib.vista === v ? 'bg-superficie text-tinta shadow-[0_0_0_1px_rgba(0,0,0,.06),0_1px_2px_rgba(0,0,0,.06)]' : 'text-sutil hover:text-tinta')}>
                <Icone className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </>
    ),
    conteudo: <Estante f={bib} />,
  }
}
