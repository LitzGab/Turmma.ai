import { useState } from 'react'
import type React from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpenCheck, Building2, CalendarDays, Check, ChevronDown, ChevronRight, ChevronsUpDown, ClipboardList,
  Ellipsis, FileDown, FileSearch, Flag, Folder, FolderInput, FolderOpen, Folders, HelpCircle, LayoutGrid, LifeBuoy, LogOut, Pencil, Trash2,
  MessageCircleQuestion, PanelLeft, ScrollText, SquarePen, Settings, ShieldCheck, Shield, SlidersHorizontal, Sparkles,
  TrendingUp, UsersRound, Brain, ChartNoAxesColumn, Workflow, type LucideIcon,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, useSidebar,
} from '@/components/blocks/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Marca, Pinta } from '@/components/marca/Pinta'
import { Configuracoes } from '@/components/turmma/Configuracoes'
import { AvatarAgente, Contador } from '@/components/turmma/ia'
import { agente } from '@/dados/agentes'
import { acervo, grupoDe, useAcervo, type Conversa } from '@/dados/conversas'
import { ALUNO, COORDENADORA, ESCOLAS, PROFESSORA, TURMAS } from '@/dados/escola'
import { definirEscolaAtiva, useEscolaAtiva } from '@/dados/escola-ativa'
import { useResumoTime, type ResumoAgente } from '@/dados/time'
import { cn } from '@/lib/utils'

/* A casca, igual nos três papéis (11.1) — shadcn/sidebar (21st.dev · 1627) com 260 px aberta e trilho de 56 px,
   no desenho da lateral do ChatGPT: marca e recolher · escola · "Nova conversa" como primeira linha ·
   itens de 36 px com canto de 10 · rótulo de grupo cinza · histórico · a pessoa no rodapé.
   No professor, o TIME mora na lateral (referência do Gabriel, 19/09/2026): cada agente é uma linha com avatar e
   contador, e clicar abre a thread dele em tela cheia. PROJETOS é item do menu, logo abaixo de "Nova conversa"
   (como no Claude e no ChatGPT); na lateral ficam só os projetos FIXADOS. O HISTÓRICO é o de verdade: sai do
   acervo de conversas (dados/conversas), agrupado por data, e cada linha renomeia, move para um projeto e apaga.
   Conversa que mora num projeto aparece no projeto, não aqui.
   O menu da pessoa segue o do ChatGPT: o nome em cima, personalização, configurações, ajuda, sair.
   Recolhida, a lateral mostra SÓ ícone e avatar: o texto some de verdade (antes ele sobrava cortado: "N.", "F.").

   20/09/2026, sétima rodada — três pedidos do Gabriel, vendo a lateral:
   · "SEU TIME" virou a lista de conversas da peça que ele colou (HextaUI · messaging-people-list): linha de 52 px com
     o avatar de 32 px e o PONTO DE ESTADO no canto (verde só quando o agente está trabalhando agora), o nome e a hora,
     e embaixo a ÚLTIMA MENSAGEM truncada com o contador das não lidas. Antes era avatar + nome + número, e não dizia
     o que o agente tinha a dizer. O dado saiu da constante local e vem de dados/time (useResumoTime), o mesmo que a
     thread usa: o contador é o número da faixa "Esperando você" e cai junto quando ela aprova na conversa. Da peça saíram o cabeçalho "Chats", a busca e o grupo "Groups": aqui são dois agentes numa lateral.
     Recolhida, a linha volta a ser só o avatar de 24 px com o pontinho do contador.
   · O SELETOR DE ESCOLA ("melhore essa visualização") eram duas linhas só de texto. Agora é um seletor de espaço de
     trabalho: ladrilho com a sigla, nome, "rede · turno · turmas", o visto na escolhida e, no pé, a regra que
     importa — nada passa de uma escola para a outra. A escolha deixou de ser estado local: mora em
     dados/escola-ativa e vale para o app inteiro (a barra do celular e o menu de turma da caixa de pedido leem dali).
   · Aluno e coordenação continuam sem menu: têm uma escola só. */

export type Papel = 'professor' | 'aluno' | 'coordenacao'

type Item = { para: string; rotulo: string; icone: LucideIcon; fim?: boolean; contador?: number }
type Grupo = { titulo?: string; itens: Item[] }

const NAV: Record<Papel, Grupo[]> = {
  professor: [{ itens: [
    { para: '/professor', rotulo: 'Nova conversa', icone: SquarePen, fim: true },
    { para: '/professor/projetos', rotulo: 'Projetos', icone: Folders, fim: true },
    { para: '/professor/ferramentas', rotulo: 'Ferramentas', icone: LayoutGrid },
    { para: '/professor/calendario', rotulo: 'Calendário', icone: CalendarDays },
    { para: '/professor/turmas', rotulo: 'Minhas turmas', icone: UsersRound },
  ] }],
  aluno: [{ itens: [
    { para: '/aluno', rotulo: 'Tutor', icone: MessageCircleQuestion, fim: true },
    { para: '/aluno/atividades', rotulo: 'Atividades e provas', icone: ClipboardList },
    { para: '/aluno/desempenho', rotulo: 'Meu desempenho', icone: TrendingUp },
    { para: '/aluno/memoria', rotulo: 'O que o Tutor sabe de mim', icone: Brain },
  ] }],
  coordenacao: [
    { titulo: 'Escola', itens: [
      { para: '/coordenacao/estrutura', rotulo: 'Estrutura', icone: Building2 },
      { para: '/coordenacao/material', rotulo: 'Material', icone: FolderOpen },
      { para: '/coordenacao/adaptacoes', rotulo: 'Adaptações', icone: SlidersHorizontal },
    ] },
    { titulo: 'IA e ensino', itens: [
      { para: '/coordenacao', rotulo: 'Governança', icone: ShieldCheck, fim: true },
      { para: '/coordenacao/analista', rotulo: 'Analista', icone: ChartNoAxesColumn, contador: 2 },
      { para: '/coordenacao/agentes', rotulo: 'Agentes', icone: Workflow },
    ] },
    { titulo: 'Conformidade', itens: [
      { para: '/coordenacao/conformidade', rotulo: 'Conformidade', icone: BookOpenCheck },
      { para: '/coordenacao/denuncias', rotulo: 'Denúncias', icone: Flag },
      { para: '/coordenacao/auditoria', rotulo: 'Auditoria', icone: FileSearch },
      { para: '/coordenacao/exportar', rotulo: 'Exportar', icone: FileDown },
    ] },
  ],
}

/* Rodapé fixo de cada papel. No aluno, "Avisar um adulto" tem o mesmo peso de qualquer item (D61). */
const RODAPE: Record<Papel, Item[]> = {
  professor: [],
  aluno: [
    { para: '/aluno/avisar', rotulo: 'Avisar um adulto', icone: LifeBuoy },
    { para: '/aluno/privacidade', rotulo: 'Privacidade', icone: Shield },
  ],
  coordenacao: [{ para: '/coordenacao/configuracoes', rotulo: 'Configurações', icone: Settings }],
}

const PESSOA = { professor: PROFESSORA, aluno: ALUNO, coordenacao: COORDENADORA }

/* A peça da lateral (blocks/sidebar) apaga o contorno do item (`outline-none`) e não põe nada no lugar: pelo teclado,
   não dava para ver em que linha se estava. Devolve o contorno de foco do app (index.css), por dentro da linha para
   a vizinha não cobrir. */
const FOCO = 'focus-visible:outline-solid focus-visible:-outline-offset-2'

function LinhaNav({ item }: { item: Item }) {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const { projetos } = useAcervo()
  const projetoAberto = pathname.startsWith('/professor/projetos/') ? projetos.find((p) => pathname === `/professor/projetos/${p.id}`) : undefined
  const ativo = item.para === '/professor/projetos'
    ? pathname === item.para || (pathname.startsWith('/professor/projetos/') && !projetoAberto?.fixado)
    : item.fim ? pathname === item.para : pathname.startsWith(item.para)
  const Icone = item.icone
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={ativo} tooltip={item.rotulo} className={FOCO}>
        <NavLink to={item.para} end={item.fim} onClick={() => setOpenMobile(false)}>
          <Icone strokeWidth={1.75} />
          <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.rotulo}</span>
          {item.contador ? <Contador n={item.contador} className="group-data-[collapsible=icon]:hidden" /> : null}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/** Um agente do time, na anatomia da people-list: avatar com o ponto de estado, nome e hora, última mensagem e não lidas.
    Laranja é o que ESPERA a professora; o que só não foi lido vai em preto. Recolhida a lateral, fica só o avatar. */
function LinhaAgente({ id, contador, espera, ultima, quando, ativo }: ResumoAgente) {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const a = agente(id)
  const para = `/professor/time/${id}`
  // /professor/time e os endereços antigos (/corretor, /adaptador, /planejador) abrem o Assistente: a linha dele acende
  const noTutor = pathname.startsWith('/professor/time/tutor')
  const aberta = id === 'tutor' ? noTutor : !noTutor && (pathname === '/professor/time' || pathname.startsWith('/professor/time/'))
  // o anel dos pontos tem a cor do chão da linha: a da lateral, ou o cinza da linha escolhida / sob o mouse
  const anel = aberta ? 'ring-realce' : 'ring-lateral group-hover/menu-item:ring-realce'
  const naoLidas = contador > 0 ? (espera ? `${contador} esperando você` : `${contador} não lidas`) : ''
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={aberta} tooltip={a.nome} className={cn('h-[52px] gap-3 px-2 md:h-[52px]', FOCO)}>
        <NavLink to={para} onClick={() => setOpenMobile(false)} aria-label={[a.nome, ativo ? 'trabalhando agora' : '', naoLidas].filter(Boolean).join(', ')}>
          <span className="relative shrink-0">
            <AvatarAgente id={id} tamanho={32} className="group-data-[collapsible=icon]:hidden" />
            <AvatarAgente id={id} tamanho={24} className="hidden group-data-[collapsible=icon]:flex" />
            <span aria-hidden className={cn('absolute -bottom-px -right-px size-2.5 rounded-full ring-2 transition-shadow duration-150 group-data-[collapsible=icon]:hidden', anel, ativo ? 'bg-ok' : 'bg-borda-campo')} />
            {contador > 0 && <span aria-hidden className={cn('absolute -right-0.5 -top-0.5 hidden size-2 rounded-full ring-2 transition-shadow duration-150 group-data-[collapsible=icon]:block', anel, espera ? 'bg-caramelo' : 'bg-tinta')} />}
          </span>
          <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="flex items-baseline gap-2">
              <span className={cn('min-w-0 flex-1 truncate text-sm leading-5 text-tinta', contador > 0 ? 'font-semibold' : 'font-medium')}>{a.curto}</span>
              <span className="shrink-0 text-[11px] font-normal leading-5 text-inativo">{quando}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-normal leading-[18px] text-sutil">{ultima}</span>
              {contador > 0 && (
                <span aria-hidden className={cn('grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full px-[5px] text-[11px] font-semibold leading-none',
                  espera ? 'bg-caramelo text-tinta' : 'bg-tinta text-white')}>{contador}</span>
              )}
            </span>
          </span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/** O time na lateral lê o resumo VIVO (dados/time): ela aprova na conversa e o contador daqui cai junto com a faixa de lá. */
function LinhasDoTime() {
  const resumo = useResumoTime()
  return <SidebarMenu className="gap-0.5">{resumo.map((t) => <LinhaAgente key={t.id} {...t} />)}</SidebarMenu>
}

/** Uma conversa do histórico. O menu aparece ao passar o mouse (e sempre no toque): renomear, mover, apagar. */
function LinhaConversa({ c }: { c: Conversa }) {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const { setOpenMobile } = useSidebar()
  const { projetos } = useAcervo()
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(c.titulo)
  const para = `/professor/conversa/${c.id}`
  const ativo = pathname === para
  const salvar = () => { acervo.renomearConversa(c.id, titulo); setEditando(false) }

  if (editando) {
    return (
      <SidebarMenuItem>
        <form onSubmit={(e) => { e.preventDefault(); salvar() }}>
          <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} onBlur={salvar} aria-label="Nome da conversa"
            onKeyDown={(e) => { if (e.key === 'Escape') { setTitulo(c.titulo); setEditando(false) } }}
            className="h-11 w-full rounded-linha border border-tinta bg-superficie px-2.5 text-sm text-tinta outline-none md:h-9" />
        </form>
      </SidebarMenuItem>
    )
  }
  return (
    <SidebarMenuItem className="group/linha relative">
      <SidebarMenuButton asChild isActive={ativo} className={cn('pr-9 font-normal', FOCO)}>
        <Link to={para} onClick={() => setOpenMobile(false)}><span>{c.titulo}</span></Link>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Opções de ${c.titulo}`}
            className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-[8px] text-sutil transition-opacity duration-150 hover:bg-realce hover:text-tinta focus-visible:opacity-100 data-[state=open]:bg-realce data-[state=open]:opacity-100 md:opacity-0 md:group-hover/linha:opacity-100">
            <Ellipsis className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="right" className="w-56 rounded-cartao border-0 p-1.5 shadow-flutua">
          <DropdownMenuItem className="h-9 gap-2.5 rounded-linha" onSelect={() => { setTitulo(c.titulo); setEditando(true) }}><Pencil className="size-4 text-sutil" /> Renomear</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="h-9 gap-2.5 rounded-linha"><FolderInput className="size-4 text-sutil" /> Mover para um projeto</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56 rounded-cartao border-0 p-1.5 shadow-flutua">
              {projetos.map((p) => <DropdownMenuItem key={p.id} className="h-9 gap-2.5 rounded-linha" onSelect={() => acervo.moverConversa(c.id, p.id)}><Folder className="size-4 text-sutil" /><span className="truncate">{p.nome}</span></DropdownMenuItem>)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="h-9 gap-2.5 rounded-linha text-erro focus:text-erro" onSelect={() => { acervo.apagarConversa(c.id); if (ativo) navegar('/professor') }}><Trash2 className="size-4" /> Apagar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

/** Os projetos fixados e o histórico de verdade, tirados do acervo. */
function ProjetosEHistorico() {
  const { projetos, conversas } = useAcervo()
  const fixados = projetos.filter((p) => p.fixado)
  const soltas = conversas.filter((c) => !c.projetoId).sort((a, b) => b.em - a.em)
  const grupos: [string, Conversa[]][] = []
  for (const c of soltas) {
    const g = grupoDe(c.em)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo[0] === g) ultimo[1].push(c); else grupos.push([g, [c]])
  }
  return (
    <>
      {fixados.length > 0 && (
        <GrupoAbre titulo="Fixados" soAberta>
          <SidebarMenu className="gap-0">{fixados.map((p) => <LinhaNav key={p.id} item={{ para: `/professor/projetos/${p.id}`, rotulo: p.nome, icone: Folder }} />)}</SidebarMenu>
        </GrupoAbre>
      )}
      <GrupoAbre titulo="Histórico" soAberta>
        {grupos.length === 0 && <p className="px-2.5 py-1.5 text-[13px] leading-snug text-sutil">Nenhuma conversa ainda. O que você pedir na página inicial aparece aqui.</p>}
        {grupos.map(([nome, lista]) => (
          <div key={nome}>
            <p className="px-2.5 pb-0.5 pt-2.5 text-xs text-inativo first:pt-0.5">{nome}</p>
            <SidebarMenu className="gap-0">{lista.map((c) => <LinhaConversa key={c.id} c={c} />)}</SidebarMenu>
          </div>
        ))}
        <p className="px-2.5 pt-2.5 text-xs leading-snug text-sutil">Só você vê suas conversas. A coordenação não tem acesso.</p>
      </GrupoAbre>
    </>
  )
}

/** Grupo que abre e fecha, com o rótulo cinza do ChatGPT. Recolhida a lateral, o rótulo some e o conteúdo fica. */
function GrupoAbre({ titulo, children, soAberta = false, className }: { titulo: string; children: React.ReactNode; soAberta?: boolean; className?: string }) {
  return (
    <Collapsible defaultOpen className={cn('group/abre', soAberta && 'group-data-[collapsible=icon]:hidden', className)}>
      <SidebarGroup className="px-0 pb-1.5 pt-3">
        <CollapsibleTrigger className="flex h-8 w-full items-center gap-1 rounded-linha px-2.5 group-data-[collapsible=icon]:hidden">
          <span className="rotulo">{titulo}</span>
          <ChevronDown className="size-3.5 text-inativo transition-transform duration-[260ms] group-data-[state=closed]/abre:-rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

/** O seletor de escola, no desenho de um seletor de espaço de trabalho (ChatGPT, Linear, Notion). */
function SeletorEscola({ papel }: { papel: Papel }) {
  const ativa = useEscolaAtiva()
  // Quem tem uma escola só (aluno, coordenação) está sempre no Colégio Aurora, seja qual for a escolha da professora
  const escola = papel === 'professor' ? ativa : ESCOLAS[0]
  const caixa = 'flex h-11 w-full items-center gap-2.5 rounded-linha px-2 text-left md:h-10'
  const conteudo = (
    <>
      <span className="grid size-6 shrink-0 place-items-center rounded-[7px] bg-tinta text-[10.5px] font-semibold leading-none text-white">{escola.sigla}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium leading-tight text-tinta">{escola.nome}</span>
      </span>
    </>
  )
  // Para quem tem uma escola só, mostra o nome e não abre (11.1)
  if (papel !== 'professor') return <div className={cn(caixa, 'group-data-[collapsible=icon]:hidden')}>{conteudo}</div>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`Escola: ${escola.nome}. Trocar de escola`} className={cn(caixa, 'transition-colors duration-150 hover:bg-realce data-[state=open]:bg-realce group-data-[collapsible=icon]:hidden')}>
          {conteudo}
          <ChevronsUpDown className="size-4 shrink-0 text-sutil" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-[276px] rounded-cartao border-0 p-1.5 shadow-flutua md:w-[288px]">
        <DropdownMenuLabel className="px-2 pb-1.5 pt-2 text-[13px] font-medium leading-tight text-sutil">Suas escolas</DropdownMenuLabel>
        {ESCOLAS.map((e) => {
          const turmas = TURMAS.filter((t) => t.escolaId === e.id).length
          const escolhida = e.id === escola.id
          return (
            <DropdownMenuItem key={e.id} onSelect={() => definirEscolaAtiva(e.id)} className="h-[52px] gap-3 rounded-linha px-2 py-0">
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-[9px] text-xs font-semibold leading-none', escolhida ? 'bg-tinta text-white' : 'bg-realce text-tinta')}>{e.sigla}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium leading-[1.35] text-tinta">{e.nome}</span>
                <span className="block truncate text-[12.5px] leading-[1.35] text-sutil">{e.rede} · {e.turno} · {turmas} {turmas === 1 ? 'turma' : 'turmas'}</span>
              </span>
              {escolhida && <Check className="size-4 shrink-0 text-tinta" aria-label="Escola ativa" />}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator className="mx-2 my-1.5 bg-linha" />
        <p className="px-2 pb-1.5 pt-0.5 text-xs leading-snug text-sutil">Cada escola tem o seu material e as suas turmas. Nada passa de uma para a outra.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BotaoRecolher({ className }: { className?: string }) {
  const { toggleSidebar, state } = useSidebar()
  return (
    <button type="button" onClick={toggleSidebar} aria-label={state === 'expanded' ? 'Recolher a lateral' : 'Abrir a lateral'}
      className={cn('grid size-9 shrink-0 place-items-center rounded-linha text-sutil transition-colors duration-150 hover:bg-realce hover:text-tinta', className)}>
      <PanelLeft className="size-[18px]" strokeWidth={1.75} />
    </button>
  )
}

function Lateral({ papel }: { papel: Papel }) {
  const pessoa = PESSOA[papel]
  const navegar = useNavigate()
  const [config, setConfig] = useState<string | null>(null)
  const item = 'h-10 gap-2.5 rounded-linha text-sm [&_svg]:size-[18px] [&_svg]:text-sutil'
  return (
    <>
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="gap-1.5 px-1.5 pb-0 pt-2.5">
        <div className="flex h-11 items-center justify-between pl-2 pr-1 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:px-0">
          <Link to={`/${papel}`} className="rounded-linha px-1 py-0.5" aria-label="Turmma, início">
            <Marca className="group-data-[collapsible=icon]:hidden" />
            <Pinta className="hidden h-7 w-7 text-caramelo group-data-[collapsible=icon]:block" />
          </Link>
          <BotaoRecolher />
        </div>
        <SeletorEscola papel={papel} />
      </SidebarHeader>

      <SidebarContent className="gap-0 px-1.5">
        {NAV[papel].map((grupo, i) => (
          <SidebarGroup key={i} className="px-0 py-1.5">
            {grupo.titulo && <SidebarGroupLabel className="rotulo h-8 px-2.5">{grupo.titulo}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">{grupo.itens.map((it) => <LinhaNav key={it.para} item={it} />)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {papel === 'professor' && (
          <>
            <GrupoAbre titulo="Seu time">
              <LinhasDoTime />
            </GrupoAbre>

            <ProjetosEHistorico />
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="gap-1 px-1.5 pb-2">
        {RODAPE[papel].length > 0 && (
          <SidebarMenu className="gap-0 border-t border-sidebar-border px-0 pt-1.5">
            {RODAPE[papel].map((it) => <LinhaNav key={it.para} item={it} />)}
          </SidebarMenu>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex h-12 items-center gap-2.5 rounded-linha px-2 text-left transition-colors duration-150 hover:bg-realce group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-caramelo text-[11px] font-semibold text-tinta">{pessoa.iniciais}</span>
              <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <span className="block truncate text-sm leading-tight text-tinta">{pessoa.nome}</span>
                <span className="block truncate text-xs text-sutil">{pessoa.papel}</span>
              </span>
              <Ellipsis className="size-4 shrink-0 text-inativo group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          {/* No modelo do ChatGPT: a pessoa em cima, depois personalização e configurações, depois ajuda e sair.
              Sair a um clique, do mesmo tamanho de qualquer outro item (D59). */}
          <DropdownMenuContent side="top" align="start" className="w-[252px] rounded-cartao border-0 p-1.5 shadow-flutua">
            <DropdownMenuItem className="h-auto gap-2.5 rounded-linha py-2" onSelect={() => setConfig(papel === 'aluno' ? 'geral' : 'perfil')}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-caramelo text-xs font-semibold text-tinta">{pessoa.iniciais}</span>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-tinta">{pessoa.nome}</span><span className="block truncate text-xs text-sutil">{pessoa.papel}</span></span>
              <ChevronRight className="size-4 text-inativo" />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {papel === 'professor' && <DropdownMenuItem className={item} onSelect={() => setConfig('assistente')}><Sparkles strokeWidth={1.75} /> Personalizar o Assistente</DropdownMenuItem>}
            <DropdownMenuItem className={item} onSelect={() => setConfig('geral')}><Settings strokeWidth={1.75} /> Configurações</DropdownMenuItem>
            {papel === 'aluno' && <DropdownMenuItem className={item} onSelect={() => navegar('/aluno/privacidade')}><Shield strokeWidth={1.75} /> Privacidade</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem className={item} onSelect={() => setConfig('ia')}><ScrollText strokeWidth={1.75} /> Como a IA funciona aqui</DropdownMenuItem>
            <DropdownMenuItem className={item}><HelpCircle strokeWidth={1.75} /> Ajuda</DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => navegar('/entrar')}><LogOut strokeWidth={1.75} /> Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
    <Configuracoes papel={papel} aberta={config} aoFechar={() => setConfig(null)} />
    </>
  )
}

/* < 768 px: barra de 56 px no topo com o botão do menu, a pinta e a ESCOLA ATIVA; a lateral vira gaveta. */
function BarraCelular({ papel }: { papel: Papel }) {
  const { toggleSidebar } = useSidebar()
  const ativa = useEscolaAtiva()
  const escola = papel === 'professor' ? ativa : ESCOLAS[0]
  return (
    <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-linha bg-fundo px-2 md:hidden">
      <button type="button" onClick={toggleSidebar} aria-label="Abrir o menu" className="grid size-11 place-items-center rounded-controle text-tinta hover:bg-realce">
        <PanelLeft className="size-5" strokeWidth={1.75} />
      </button>
      <Pinta className="h-6 w-6 text-caramelo" rotulo="Turmma" />
      <span className="truncate text-sm font-semibold text-tinta">{escola.nome}</span>
    </div>
  )
}

export function Casca({ papel }: { papel: Papel }) {
  // ≥ 1024 px abre com a lateral de 260 px; entre 768 e 1023 px, trilho de 56 px por padrão (11.1)
  const [abertaDeInicio] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1024)
  return (
    <SidebarProvider defaultOpen={abertaDeInicio}>
      <Lateral papel={papel} />
      <SidebarInset className="min-w-0 bg-fundo">
        <BarraCelular papel={papel} />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
