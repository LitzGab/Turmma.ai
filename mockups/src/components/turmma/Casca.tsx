import { useState } from 'react'
import type React from 'react'
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Check, ChevronsUpDown, Ellipsis, HelpCircle, LogOut, Mail, MessageCircle, MessageSquareText, PanelLeft, Pencil,
  RotateCcw, ScrollText, Settings, SquarePen, Trash2, UserRound,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarProvider, useSidebar,
} from '@/components/blocks/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BotaoIcone, Contador, Dialogo, MenuMais } from '@/components/duo'
import { Icone, type IconeId } from '@/components/duo/icones'
import { AvatarIA } from '@/components/duo/onca'
import { Marca, Pinta } from '@/components/marca/Pinta'
import { Configuracoes } from '@/components/turmma/Configuracoes'
import { useParametro } from '@/components/turmma/tela'
import { Sino } from '@/components/turmma/sino'
import { PainelDaFila } from '@/areas/professor/_fila'
import { PainelDoItemCoordenacao } from '@/areas/coordenacao/_alerta'
import { usePedidosDadosNaoLidos, useRespostasNaoLidas } from '@/dados/avisos'
import { praFazer, useTarefasDoAluno } from '@/dados/avaliacoes'
import { acervo, grupoDe, useAcervo, type Conversa } from '@/dados/conversas'
import { conversasAluno, useConversasDoAluno, type ConversaAluno } from '@/dados/conversas-aluno'
import { COORDENADORA, ESCOLAS, TURMAS } from '@/dados/escola'
import { definirEscolaAtiva, useEscolaAtiva } from '@/dados/escola-ativa'
import { useAlunoAtual, useProfessorAtual } from '@/dados/sessao'
import { useTamanhoDoTexto } from '@/dados/preferencias'
import { LISTA_REDES, REDES_DO_PAINEL, useRedeAtual, type RedeId } from '@/dados/rede-atual'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/* A CASCA — 12ª rodada (04/10/2026; plano de polimento, seção 3), na pele Turmma × Duolingo.

   A navegação final de cada papel:
       Aluno:       Início · Tarefas · Eu · Avisar um adulto   (sem lápis, sem recolher, sem menu)
       Professor:   Início · Turmas · Criados                   (a Agenda virou "Semana" dentro de Turmas; Projetos saiu)
       Coordenação: Início · Escola · IA · Registros
   · O único número laranja é o do Início (o tamanho da fila, R9). No aluno, AVISAR ganha um contador AMARELO só
     quando chega resposta que ele ainda não leu.
   · Aluno: CONVERSAS (até 5, sem abrir e fechar; some quando vazia) e o cartão do nome, que é um LINK para Eu.
     Tocar INÍCIO sempre volta à caixa vazia, e por isso o lápis saiu.
   · Professor: o lápis "Nova conversa" (some no Início vazio), o recolher, o seletor de escola só para quem dá aula em
     duas, CONVERSAS (até 5 + VER TODAS; ⋯ Renomear · Apagar) e o menu Configurações · Como a IA funciona · Ajuda · Sair.
   · Coordenação: o menu Configurações da escola · Minha conta · Ajuda · Sair.
   · 13ª rodada: "Rever a introdução" (professor e coordenação) leva a /<papel>/bem-vindo?rever=1; o tamanho do texto do
     papel (dados/preferencias.ts) vale enquanto a casca dele está aberta.
   · Ajuda abre "Falar com a Turmma" (e-mail e WhatsApp; D78). Sair é um clique (D59).
   · `?config=<seção>` abre as Configurações naquela seção. (`?como=<pessoa>` é lido na raiz do app, App.tsx.)
   O nome, as iniciais e o papel vêm da sessão (dados/sessao.ts).
   Medidas: ≥ 1024 px, lateral branca de 256 px com borda de 2 px; 768 a 1023, trilho de 88 px; < 768 px, topo de 56 e
   barra de baixo de 68 (as alturas moram em variáveis da classe `casca`, index.css). */

/* 14ª RODADA (05/10/2026; plano ux-composicao, seção 1):
   · Professor: Início · Turmas · Ferramentas · Criados. Coordenação: Painel · Analista · Escola · Registros. A
     prefeitura (`rede`) ganha a casca: Painel · Analista · Escolas, o cartão "Rede Municipal de Joinville" no lugar da
     escola e o menu da conta.
   · O Início perde o número: "Esperando você" vira o SINO (turmma/sino.tsx), desenhado aqui no canto de cima à
     direita (no celular, na barra do topo), em toda tela do professor e da coordenação. O único número laranja é o
     dele (R9). A casca leva `data-sino`, e as páginas guardam o canto (--reserva-sino, index.css).
   · Tarefas do aluno ganha o número AZUL do que está Para fazer (o mesmo cálculo da tela), no lugar do ponto.
   · O painel do item (?item=, ?contestar=1) é desenhado AQUI, por cima de qualquer tela: no professor, PainelDaFila;
     na coordenação, PainelDoItemCoordenacao. */

/* PAINÉIS DE GESTÃO (06/10/2026; pesquisa/paineis-gestao/plano.md): a persona rede tem DUAS redes. A pílula da
   organização no topo da lateral vira o menu de troca (SeletorRede): Prefeitura de Joinville · Estado de SC · Regional
   Joinville (useRedeAtual, dados/rede-atual.ts). No celular, a gaveta traz o mesmo menu e a barra do topo mostra a rede.
   O nome da conta no rodapé acompanha: "Secretaria de Educação · Joinville" × "Coordenadoria Regional · SED/SC". */

export type Papel = 'professor' | 'aluno' | 'coordenacao' | 'rede'

type Lugar = {
  para: string
  rotulo: string
  /** na barra de baixo, quando o rótulo não cabe */
  curto?: string
  icone: IconeId
  /** no lugar do ícone ilustrado: a cabeça da onça do agente (o Analista) */
  avatar?: 'analista'
  /** este lugar acende para estes caminhos (e a busca, para o `?de=inicio`) */
  aceso: (caminho: string, busca: string) => boolean
  /** tarefas é o número azul do que está Para fazer; avisos, o amarelo das respostas; eu, o ponto azul de "novo" */
  contador?: 'avisos' | 'tarefas' | 'eu'
}

const comeca = (base: string) => (c: string) => c === base || c.startsWith(`${base}/`)
/** Quem abriu um documento pelo cartão do Início (`?de=inicio`) continua no Início; pela conversa (`?de=conversa`), a
    lateral não acende Criados (o ‹ leva de volta à conversa). */
const deOnde = (b: string) => new URLSearchParams(b).get('de')
const doInicio = (b: string) => deOnde(b) === 'inicio'
const doProfessorFora = (c: string) => comeca('/professor/criados')(c) || c.startsWith('/professor/aprovar/')

const LUGARES: Record<Papel, Lugar[]> = {
  aluno: [
    // numa conversa, quem acende é a conversa (em CONVERSAS), não o Início
    { para: '/aluno', rotulo: 'Início', icone: 'inicio', aceso: (c) => c === '/aluno' },
    { para: '/aluno/tarefas', rotulo: 'Tarefas', icone: 'tarefas', aceso: comeca('/aluno/tarefas'), contador: 'tarefas' },
    { para: '/aluno/eu', rotulo: 'Eu', icone: 'eu', aceso: comeca('/aluno/eu'), contador: 'eu' },
    { para: '/aluno/avisar', rotulo: 'Avisar um adulto', curto: 'Avisar', icone: 'avisar', aceso: comeca('/aluno/avisar'), contador: 'avisos' },
  ],
  professor: [
    { para: '/professor', rotulo: 'Início', icone: 'inicio',
      aceso: (c, b) => c === '/professor' || c === '/professor/conversa/nova' || (doProfessorFora(c) && doInicio(b)) },
    { para: '/professor/turmas', rotulo: 'Turmas', icone: 'turmas', aceso: comeca('/professor/turmas') },
    // as notas para aprovar (/professor/aprovar/*) não são de Ferramentas: o ‹ leva ao Início, e a lateral não contradiz
    { para: '/professor/ferramentas', rotulo: 'Ferramentas', icone: 'mais', aceso: comeca('/professor/ferramentas') },
    { para: '/professor/criados', rotulo: 'Criados', icone: 'criados',
      aceso: (c, b) => comeca('/professor/criados')(c) && !['inicio', 'conversa'].includes(deOnde(b) ?? '') },
  ],
  coordenacao: [
    { para: '/coordenacao', rotulo: 'Painel', icone: 'painel', aceso: (c) => c === '/coordenacao' },
    { para: '/coordenacao/analista', rotulo: 'Analista', icone: 'painel', avatar: 'analista', aceso: comeca('/coordenacao/analista') },
    { para: '/coordenacao/escola', rotulo: 'Escola', icone: 'escola', aceso: comeca('/coordenacao/escola') },
    { para: '/coordenacao/registros', rotulo: 'Registros', icone: 'registros', aceso: comeca('/coordenacao/registros') },
  ],
  rede: [
    { para: '/rede', rotulo: 'Painel', icone: 'painel', aceso: (c) => c === '/rede' },
    { para: '/rede/analista', rotulo: 'Analista', icone: 'painel', avatar: 'analista', aceso: comeca('/rede/analista') },
    { para: '/rede/escolas', rotulo: 'Escolas', icone: 'escola', aceso: comeca('/rede/escolas') },
  ],
}

/* D61: "AVISAR UM ADULTO" a 15 px em caixa alta não cabe no item de 256 px; então TODOS os rótulos do aluno descem
   para 14 px, para o peso ser igual. Os outros papéis ficam nos 15 px do t-rotulo. */
const ROTULO_LUGAR: Record<Papel, string> = { aluno: 't-rotulo text-[14px]', professor: 't-rotulo', coordenacao: 't-rotulo', rede: 't-rotulo' }

type Numeros = Record<NonNullable<Lugar['contador']>, number>

/** Os números da casca (só do aluno; o da fila mora no sino): as respostas de aviso não lidas (Avisar, amarelo), o que
    está Para fazer (Tarefas, azul: o mesmo cálculo da tela) e o pedido de dados respondido (Eu, o ponto azul). */
function useNumeros(papel: Papel): Numeros {
  const respostas = useRespostasNaoLidas()
  const dados = usePedidosDadosNaoLidos()
  const tarefas = praFazer(useTarefasDoAluno()).length
  const aluno = papel === 'aluno'
  return {
    avisos: aluno ? respostas : 0,
    tarefas: aluno ? tarefas : 0,
    eu: aluno ? dados : 0,
  }
}

/** O ponto azul de "novo" (10 px), sem número. */
const PONTO = (n: number) => `${n} ${n === 1 ? 'novidade' : 'novidades'}`

/** A pessoa da sessão, como a casca mostra. */
function usePessoa(papel: Papel) {
  const aluno = useAlunoAtual()
  const prof = useProfessorAtual()
  const [rede] = useRedeAtual()
  if (papel === 'aluno') return { nome: aluno.nome, iniciais: aluno.iniciais, papel: `${aluno.turma} · ${aluno.escola}` }
  if (papel === 'professor') return { nome: prof.nome, iniciais: prof.iniciais, papel: prof.papel }
  // rótulos curtos no rodapé da lateral (o seletor da rede, no topo, já diz qual é a rede)
  if (papel === 'rede') return rede === 'estado'
    ? { nome: 'Coordenadoria Regional', iniciais: 'CR', papel: 'SED/SC' }
    : { nome: 'Secretaria de Educação', iniciais: 'SE', papel: 'Joinville' }
  return { nome: COORDENADORA.nome, iniciais: COORDENADORA.iniciais, papel: 'Coordenação' }
}

/** Um lugar da lateral: 52 px, ícone ilustrado de 32 numa caixa de 36, rótulo em caixa alta. No trilho, só o ícone. */
function ItemLugar({ papel, lugar, numeros }: { papel: Papel; lugar: Lugar; numeros: Numeros }) {
  const { pathname, search } = useLocation()
  const { setOpenMobile, state, isMobile } = useSidebar()
  const aceso = lugar.aceso(pathname, search)
  const recolhida = state === 'collapsed' && !isMobile
  const n = lugar.contador ? numeros[lugar.contador] : 0
  const ponto = lugar.contador === 'eu'
  const familia = lugar.contador === 'avisos' ? 'amarelo' : 'azul'
  const rotuloN = ponto ? PONTO(n).replace(/^\d+ /, '') : lugar.contador === 'avisos' ? 'resposta nova' : 'para fazer'
  // no aluno, o número e o ponto ficam no canto do ícone: o rótulo "AVISAR UM ADULTO" usa a linha inteira
  const noIcone = papel === 'aluno'
  const item = (
    <Link to={lugar.para} onClick={() => setOpenMobile(false)} aria-current={aceso ? 'page' : undefined}
      aria-label={recolhida || (noIcone && n > 0) ? (n > 0 ? `${lugar.rotulo}, ${n} ${rotuloN}` : lugar.rotulo) : undefined}
      className={cn(
        'relative flex h-[52px] items-center gap-4 rounded-[12px] border-2 px-2 py-1 transition-colors duration-150',
        'group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-14 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0',
        aceso ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-transparent text-sutil hover:bg-fundo-suave hover:text-tinta',
      )}>
      <span className="relative grid size-9 shrink-0 place-items-center">
        {lugar.avatar ? <AvatarIA agente={lugar.avatar} tamanho={32} /> : <Icone id={lugar.icone} tamanho={32} />}
        {n > 0 && noIcone && (ponto
          ? <span aria-hidden className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-azul ring-2 ring-white group-data-[collapsible=icon]:hidden" />
          : <Contador n={n} tamanho="p" familia={familia} rotulo={rotuloN} className="absolute -right-2.5 -top-2 h-5 min-w-5 px-1 text-[12px] ring-2 ring-white group-data-[collapsible=icon]:hidden" />)}
      </span>
      <span className={cn('min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden', ROTULO_LUGAR[papel])}>{lugar.rotulo}</span>
      {n > 0 && !noIcone && <Contador n={n} familia={familia} rotulo={rotuloN} className="shrink-0 group-data-[collapsible=icon]:hidden" />}
      {/* no trilho, o contador vira um ponto de 10 px no canto do ícone */}
      {n > 0 && <span aria-hidden className={cn('absolute right-2 top-1.5 hidden size-2.5 rounded-full ring-2 ring-white group-data-[collapsible=icon]:block', ponto || familia === 'azul' ? 'bg-azul' : 'bg-amarelo')} />}
    </Link>
  )
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="right" align="center" hidden={!recolhida}>{lugar.rotulo}</TooltipContent>
      </Tooltip>
    </li>
  )
}

const ITEM_GRUPO = 'flex h-10 min-w-0 items-center gap-2.5 rounded-[12px] px-3 text-[15px] font-medium leading-5 transition-colors duration-150'
const ITEM_GRUPO_ESTADO = (ativo: boolean) => ativo ? 'bg-azul-claro text-azul-texto' : 'text-apoio hover:bg-fundo-suave hover:text-tinta'

/** Uma conversa do professor. O ⋯ (Renomear · Apagar) aparece ao passar o mouse (e sempre no toque). */
function LinhaConversa({ c }: { c: Conversa }) {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const { setOpenMobile } = useSidebar()
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(c.titulo)
  const para = `/professor/conversa/${c.id}`
  const ativo = pathname === para
  const salvar = () => { acervo.renomearConversa(c.id, titulo); setEditando(false) }

  if (editando) {
    return (
      <li>
        <form onSubmit={(e) => { e.preventDefault(); salvar() }}>
          <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} onBlur={salvar} aria-label="Nome da conversa"
            onKeyDown={(e) => { if (e.key === 'Escape') { setTitulo(c.titulo); setEditando(false) } }}
            className="h-10 w-full rounded-[12px] border-2 border-azul-borda bg-campo px-3 text-[15px] font-medium text-tinta outline-none" />
        </form>
      </li>
    )
  }
  return (
    <li className="group/linha relative">
      <Link to={para} onClick={() => setOpenMobile(false)} aria-current={ativo ? 'page' : undefined}
        className={cn(ITEM_GRUPO, ITEM_GRUPO_ESTADO(ativo), 'pr-10')}>
        <span className="truncate">{c.titulo}</span>
      </Link>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 transition-opacity duration-150 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 md:opacity-0 md:group-hover/linha:opacity-100">
        <MenuMais alinhar="start" lado="right" rotulo={`Opções de ${c.titulo}`}
          gatilho={(
            <button type="button" aria-label={`Opções de ${c.titulo}`}
              className="grid size-8 place-items-center rounded-[10px] text-sutil hover:bg-borda hover:text-tinta data-[state=open]:bg-borda">
              <Ellipsis className="size-[18px]" strokeWidth={2.5} />
            </button>
          )}
          itens={[
            { rotulo: 'Renomear', icone: <Pencil strokeWidth={2.5} />, aoEscolher: () => { setTitulo(c.titulo); setEditando(true) } },
            { rotulo: 'Apagar', icone: <Trash2 strokeWidth={2.5} />, perigo: true, aoEscolher: () => { acervo.apagarConversa(c.id); if (ativo) navegar('/professor') } },
          ]} />
      </div>
    </li>
  )
}

/** Uma conversa do aluno, acesa quando o endereço é o dela. O ⋯ (Renomear · Apagar), como na do professor. */
function LinhaConversaAluno({ c }: { c: ConversaAluno }) {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const { setOpenMobile } = useSidebar()
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(c.titulo)
  const para = `/aluno/c/${c.id}`
  const ativo = pathname === para
  const salvar = () => { conversasAluno.renomear(c.id, titulo); setEditando(false) }
  if (editando) {
    return (
      <li>
        <form onSubmit={(e) => { e.preventDefault(); salvar() }}>
          <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} onBlur={salvar} aria-label="Nome da conversa"
            onKeyDown={(e) => { if (e.key === 'Escape') { setTitulo(c.titulo); setEditando(false) } }}
            className="h-10 w-full rounded-[12px] border-2 border-azul-borda bg-campo px-3 text-[15px] font-medium text-tinta outline-none" />
        </form>
      </li>
    )
  }
  return (
    <li className="group/linha relative">
      <Link to={para} onClick={() => setOpenMobile(false)} aria-current={ativo ? 'page' : undefined} className={cn(ITEM_GRUPO, ITEM_GRUPO_ESTADO(ativo), 'pr-10')}>
        <span className="truncate">{c.titulo}</span>
      </Link>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 transition-opacity duration-150 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 md:opacity-0 md:group-hover/linha:opacity-100">
        <MenuMais alinhar="start" lado="right" rotulo={`Opções de ${c.titulo}`}
          gatilho={(
            <button type="button" aria-label={`Opções de ${c.titulo}`}
              className="grid size-8 place-items-center rounded-[10px] text-sutil hover:bg-borda hover:text-tinta data-[state=open]:bg-borda">
              <Ellipsis className="size-[18px]" strokeWidth={2.5} />
            </button>
          )}
          itens={[
            { rotulo: 'Renomear', icone: <Pencil strokeWidth={2.5} />, aoEscolher: () => { setTitulo(c.titulo); setEditando(true) } },
            { rotulo: 'Apagar', icone: <Trash2 strokeWidth={2.5} />, perigo: true, aoEscolher: () => { conversasAluno.apagar(c.id); if (ativo) navegar('/aluno') } },
          ]} />
      </div>
    </li>
  )
}

/** As conversas em grupos de data, como no ChatGPT: Hoje · Ontem · Últimos 7 dias · Mais antigas. Em cima, o botão
    NOVA CONVERSA (o grupo "Conversas" fica só para o leitor de tela). */
function Grupos<T>({ itens, grupo, linha, nova, rodape }: {
  itens: T[]; grupo: (x: T) => string; linha: (x: T) => React.ReactNode; nova: () => void; rodape?: React.ReactNode
}) {
  const ordem: string[] = []
  const por = new Map<string, T[]>()
  for (const x of itens) { const g = grupo(x); if (!por.has(g)) { por.set(g, []); ordem.push(g) } por.get(g)!.push(x) }
  return (
    <section className="pt-3 group-data-[collapsible=icon]:hidden" aria-label="Conversas">
      <button type="button" onClick={nova} className={cn(ITEM_GRUPO, 'w-full font-bold text-tinta hover:bg-fundo-suave')}>
        <SquarePen className="size-[18px] shrink-0" strokeWidth={2.5} /> Nova conversa
      </button>
      {ordem.map((g) => (
        <div key={g} className="pt-2">
          <h2 className="flex h-7 items-center px-3 text-[13px] font-bold text-sutil">{g}</h2>
          <ul className="flex flex-col gap-0.5">{por.get(g)!.map((x) => linha(x))}</ul>
        </div>
      ))}
      {rodape && <ul className="pt-1">{rodape}</ul>}
    </section>
  )
}

/** O grupo de data de uma conversa do professor. */
const grupoProfessor = (em: number) => { const g = grupoDe(em); return g === '7 dias anteriores' ? 'Últimos 7 dias' : g === 'Hoje' || g === 'Ontem' ? g : 'Mais antigas' }
/** O do aluno, pelo "quando" guardado ("Hoje, 10h42", "Ontem", "18/09"). */
const grupoAluno = (q: string) => /^hoje/i.test(q) ? 'Hoje' : /^ontem/i.test(q) ? 'Ontem' : 'Últimos 7 dias'

/** Conversas do professor (até 5 e "Ver todas"). */
function ConversasProfessor() {
  const { conversas } = useAcervo()
  const navegar = useNavigate()
  const { setOpenMobile } = useSidebar()
  const [todas, setTodas] = useState(false)
  const lista = [...conversas].sort((a, b) => b.em - a.em)
  const visiveis = todas ? lista : lista.slice(0, 5)
  return (
    <Grupos itens={visiveis} grupo={(c) => grupoProfessor(c.em)} linha={(c) => <LinhaConversa key={c.id} c={c} />}
      nova={() => { setOpenMobile(false); navegar('/professor', { state: { nova: true } }) }}
      rodape={lista.length > 5 && (
        <li>
          <button type="button" onClick={() => setTodas((t) => !t)} className={cn(ITEM_GRUPO, 't-rotulo w-full text-azul-texto hover:bg-fundo-suave')}>
            {todas ? 'Ver menos' : 'Ver todas'}
          </button>
        </li>
      )} />
  )
}

/** Conversas do aluno (até 5). NOVA CONVERSA leva à caixa vazia do Início. */
function ConversasAluno() {
  const conversas = useConversasDoAluno()
  const navegar = useNavigate()
  const { setOpenMobile } = useSidebar()
  return (
    <Grupos itens={conversas.slice(0, 5)} grupo={(c) => grupoAluno(c.quando)} linha={(c) => <LinhaConversaAluno key={c.id} c={c} />}
      nova={() => { setOpenMobile(false); navegar('/aluno') }} />
  )
}

/** A sigla da escola num ladrilho de 32 px, na face azul com texto tinta. */
function SiglaEscola({ sigla, apagada }: { sigla: string; apagada?: boolean }) {
  return (
    <span className={cn('grid size-8 shrink-0 place-items-center rounded-[10px] text-[14px] font-bold leading-none',
      apagada ? 'bg-fundo-suave text-apoio' : 'bg-azul text-sobre-cor')}>{sigla}</span>
  )
}

/** A sigla da rede (JOI · SC) no ladrilho de 32 px: anil na prefeitura, verde no Estado. */
const SIGLA_DA_REDE: Record<RedeId, { sigla: string; cor: string }> = {
  prefeitura: { sigla: 'JOI', cor: 'bg-anil' },
  estado: { sigla: 'SC', cor: 'bg-verde' },
}

function SiglaRede({ rede, apagada }: { rede: RedeId; apagada?: boolean }) {
  const s = SIGLA_DA_REDE[rede]
  return (
    <span className={cn('grid size-8 shrink-0 place-items-center rounded-[10px] text-[13px] font-bold leading-none',
      apagada ? 'bg-fundo-suave text-apoio' : cn(s.cor, 'text-sobre-cor'))}>{s.sigla}</span>
  )
}

/** As duas redes no menu (o mesmo na lateral e na barra do topo do celular). */
function ItensDaRede({ rede, mudar }: { rede: RedeId; mudar: (r: RedeId) => void }) {
  return (
    <>
      <DropdownMenuLabel className="t-selo px-2 pb-1.5 pt-2 text-sutil">Ver a rede</DropdownMenuLabel>
      {LISTA_REDES.map((id) => {
        const r = REDES_DO_PAINEL[id]
        const escolhida = id === rede
        return (
          <DropdownMenuItem key={id} onSelect={() => mudar(id)}
            className={cn('min-h-14 gap-3 rounded-[12px] border-2 px-2 py-1.5', escolhida ? 'border-azul-borda bg-azul-claro focus:bg-azul-claro' : 'border-transparent')}>
            <SiglaRede rede={id} apagada={!escolhida} />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold leading-5 text-tinta">{r.nome}</span>
              <span className="block text-[14px] font-medium leading-5 text-sutil">{r.etapas} · diário {r.sistema}</span>
            </span>
            {escolhida && <Check className="size-5 shrink-0 text-azul-texto" strokeWidth={3} aria-label="Rede escolhida" />}
          </DropdownMenuItem>
        )
      })}
    </>
  )
}

/** A rede: a pílula da organização vira o menu de troca (Prefeitura de Joinville · Estado de SC · Regional Joinville). */
function SeletorRede() {
  const [rede, mudar] = useRedeAtual()
  const r = REDES_DO_PAINEL[rede]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`Rede: ${r.nome}. Trocar de rede`}
          className="degrau degrau-branco block w-full rounded-[16px] text-left [--altura-degrau:4px] [--afunda:2px] [--face:var(--color-white)] [--lado:var(--color-borda)] group-data-[collapsible=icon]:hidden">
          <span className="face min-h-12 justify-start gap-2.5 rounded-[16px] border-2 border-borda px-2 py-1.5">
            <SiglaRede rede={rede} />
            <span className="min-w-0 flex-1 text-[15px] font-bold leading-[18px] text-tinta">{r.nome}</span>
            <ChevronsUpDown className="size-[18px] shrink-0 text-sutil" strokeWidth={2.5} />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-[300px] p-1.5">
        <ItensDaRede rede={rede} mudar={mudar} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** No celular, o nome da rede na barra do topo também troca de rede. */
function RedeNoTopo() {
  const [rede, mudar] = useRedeAtual()
  const r = REDES_DO_PAINEL[rede]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`Rede: ${r.nome}. Trocar de rede`}
          className="-ml-1 flex h-11 min-w-0 flex-1 items-center gap-1 rounded-[10px] px-1 text-left transition-colors hover:bg-fundo-suave">
          <span className="min-w-0 truncate text-[16px] font-bold text-tinta">{r.nome.length > 24 ? r.curto : r.nome}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-sutil" strokeWidth={2.5} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-[300px] max-w-[calc(100vw-24px)] p-1.5">
        <ItensDaRede rede={rede} mudar={mudar} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A escola: cartão clicável para quem dá aula em duas; só de leitura para a coordenação; nada para o aluno. */
function SeletorEscola({ papel }: { papel: Papel }) {
  const ativa = useEscolaAtiva()
  const prof = useProfessorAtual()
  if (papel === 'aluno') return null
  if (papel === 'rede') return <SeletorRede />
  const duas = papel === 'professor' && prof.escolas.length > 1
  if (papel === 'professor' && !duas) return null
  const escola = papel === 'professor' ? ativa : ESCOLAS[0]
  const conteudo = (
    <>
      <SiglaEscola sigla={escola.sigla} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-bold leading-tight text-tinta">{escola.nome}</span>
    </>
  )
  if (!duas) {
    return (
      <div className="flex h-12 items-center gap-2.5 rounded-[16px] border-2 border-borda bg-white px-2 group-data-[collapsible=icon]:hidden">
        {conteudo}
      </div>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`Escola: ${escola.nome}. Trocar de escola`}
          className="degrau degrau-branco block w-full rounded-[16px] text-left [--altura-degrau:4px] [--afunda:2px] [--face:var(--color-white)] [--lado:var(--color-borda)] group-data-[collapsible=icon]:hidden">
          <span className="face h-12 justify-start gap-2.5 rounded-[16px] border-2 border-borda px-2">
            {conteudo}
            <ChevronsUpDown className="size-[18px] shrink-0 text-sutil" strokeWidth={2.5} />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-[276px] p-1.5 md:w-[288px]">
        <DropdownMenuLabel className="t-selo px-2 pb-1.5 pt-2 text-sutil">Suas escolas</DropdownMenuLabel>
        {ESCOLAS.filter((e) => prof.escolas.includes(e.id)).map((e) => {
          const turmas = TURMAS.filter((t) => t.escolaId === e.id).length
          const escolhida = e.id === escola.id
          return (
            <DropdownMenuItem key={e.id} onSelect={() => definirEscolaAtiva(e.id)}
              className={cn('h-14 gap-3 rounded-[12px] border-2 px-2 py-0', escolhida ? 'border-azul-borda bg-azul-claro focus:bg-azul-claro' : 'border-transparent')}>
              <SiglaEscola sigla={e.sigla} apagada={!escolhida} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold leading-5 text-tinta">{e.nome}</span>
                <span className="block truncate text-[14px] font-medium leading-5 text-sutil">{e.turno} · {turmas} {turmas === 1 ? 'turma' : 'turmas'}</span>
              </span>
              {escolhida && <Check className="size-5 shrink-0 text-azul-texto" strokeWidth={3} aria-label="Escola ativa" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BotaoRecolher({ className }: { className?: string }) {
  const { toggleSidebar, state } = useSidebar()
  return (
    <BotaoIcone rotulo={state === 'expanded' ? 'Recolher a lateral' : 'Abrir a lateral'} onClick={toggleSidebar} className={className}>
      <PanelLeft strokeWidth={2.5} />
    </BotaoIcone>
  )
}

/** O lápis "Nova conversa", só do professor. Some no Início vazio (lá a caixa já é a conversa nova). */
function Lapis({ tamanho = 40, className }: { tamanho?: 40 | 44; className?: string }) {
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  // no Início vazio a caixa já é a conversa nova: o lápis some, mas guarda o lugar, para o topo não mudar de uma página para outra
  const escondido = pathname === '/professor'
  return (
    <BotaoIcone rotulo="Nova conversa" tamanho={tamanho} aria-hidden={escondido || undefined} tabIndex={escondido ? -1 : undefined}
      onClick={() => { setOpenMobile(false); navegar('/professor', { state: { nova: true } }) }} className={cn('text-tinta', escondido && 'invisible', className)}>
      <SquarePen strokeWidth={2.5} />
    </BotaoIcone>
  )
}

/** A bolinha com as iniciais (40 px, face laranja, texto tinta). */
function Iniciais({ iniciais }: { iniciais: string }) {
  return <span className="grid size-10 shrink-0 place-items-center rounded-full bg-laranja text-[15px] font-bold text-sobre-cor">{iniciais}</span>
}

/** O aluno: o cartão do nome é um LINK para Eu (sem menu). */
function CartaoAluno() {
  const p = usePessoa('aluno')
  const { setOpenMobile } = useSidebar()
  return (
    <Link to="/aluno/eu" onClick={() => setOpenMobile(false)} aria-label={`${p.nome}, abrir Eu`}
      className="flex h-14 w-full items-center gap-3 rounded-[12px] px-2 text-left transition-colors duration-150 hover:bg-fundo-suave group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-14 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <Iniciais iniciais={p.iniciais} />
      <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
        <span className="block truncate text-[15px] font-bold leading-5 text-tinta">{p.nome}</span>
        <span className="block truncate text-[14px] font-medium leading-5 text-sutil">{p.papel}</span>
      </span>
    </Link>
  )
}

/** O menu da pessoa (professor e coordenação), no rodapé da lateral. Sair é um clique (D59). */
function MenuPessoa({ papel, aoConfig, aoAjuda }: { papel: Exclude<Papel, 'aluno'>; aoConfig: (secao: string) => void; aoAjuda: () => void }) {
  const p = usePessoa(papel)
  const navegar = useNavigate()
  const item = 'h-11 gap-2.5 rounded-[10px] text-[15px] font-medium [&_svg]:size-[18px] [&_svg]:text-sutil'
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`${p.nome}, menu da conta`}
          className="flex min-h-14 w-full items-center gap-3 rounded-[12px] px-2 py-1.5 text-left transition-colors duration-150 hover:bg-fundo-suave data-[state=open]:bg-fundo-suave group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-14 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Iniciais iniciais={p.iniciais} />
          <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            {/* o nome quebra em 2 linhas em vez de cortar ("Secretaria de E…") */}
            <span className="line-clamp-2 block text-[15px] font-bold leading-5 text-tinta">{p.nome}</span>
            <span className="block truncate text-[14px] font-medium leading-5 text-sutil">{p.papel}</span>
          </span>
          <Ellipsis className="size-5 shrink-0 text-sutil group-data-[collapsible=icon]:hidden" strokeWidth={2.5} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-[252px] p-1.5">
        <DropdownMenuLabel className="px-2 py-1.5 text-[14px] font-bold text-sutil">{p.nome}</DropdownMenuLabel>
        {papel === 'rede' ? (
          <>
            <DropdownMenuItem className={item} onSelect={() => aoConfig('geral')}><Settings strokeWidth={2.5} /> Configurações</DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => navegar('/rede?protecao=1')}><ScrollText strokeWidth={2.5} /> Como protegemos os dados</DropdownMenuItem>
          </>
        ) : papel === 'professor' ? (
          <>
            <DropdownMenuItem className={item} onSelect={() => aoConfig('geral')}><Settings strokeWidth={2.5} /> Configurações</DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => aoConfig('ia')}><ScrollText strokeWidth={2.5} /> Como a IA funciona</DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem className={item} onSelect={() => navegar('/coordenacao/configuracoes')}><Settings strokeWidth={2.5} /> Configurações da escola</DropdownMenuItem>
            <DropdownMenuItem className={item} onSelect={() => aoConfig('geral')}><UserRound strokeWidth={2.5} /> Minha conta</DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem className={item} onSelect={() => navegar(`/${papel}/bem-vindo?rever=1`)}><RotateCcw strokeWidth={2.5} /> Rever a introdução</DropdownMenuItem>
        <DropdownMenuItem className={item} onSelect={aoAjuda}><HelpCircle strokeWidth={2.5} /> Ajuda</DropdownMenuItem>
        <DropdownMenuItem className={item} onSelect={() => navegar('/entrar')}><LogOut strokeWidth={2.5} /> Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "Falar com a Turmma": o e-mail e o WhatsApp da equipe (D78). */
function Ajuda({ aberta, aoMudar }: { aberta: boolean; aoMudar: (v: boolean) => void }) {
  const linha = 'flex min-h-14 items-center gap-3 rounded-[12px] border-2 border-borda px-4 py-2 text-[17px] font-bold text-tinta transition-colors duration-150 hover:bg-fundo-suave'
  return (
    <Dialogo aberto={aberta} aoMudar={aoMudar} titulo="Falar com a Turmma" largura={440}>
      <div className="grid gap-3">
        <a href="mailto:ajuda@turmma.com.br" className={linha}><Mail className="size-5 text-azul-texto" strokeWidth={2.5} /> ajuda@turmma.com.br</a>
        <a href="https://wa.me/554730000000" target="_blank" rel="noreferrer" className={linha}><MessageCircle className="size-5 text-verde-texto" strokeWidth={2.5} /> WhatsApp (47) 3000-0000</a>
        <p className="t-apoio">Dias úteis, das 8h às 18h.</p>
      </div>
    </Dialogo>
  )
}

function Lateral({ papel, aoConfig, aoAjuda }: { papel: Papel; aoConfig: (s: string) => void; aoAjuda: () => void }) {
  const { isMobile } = useSidebar()
  const numeros = useNumeros(papel)
  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-2 border-borda">
      <SidebarHeader className="gap-3 p-0 px-3">
        <div className="flex h-[88px] shrink-0 items-center gap-1 pl-1 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:pb-2 group-data-[collapsible=icon]:pl-0 group-data-[collapsible=icon]:pt-6">
          <Link to={`/${papel}`} className="mr-auto rounded-[10px] px-1 py-0.5 group-data-[collapsible=icon]:mr-0" aria-label="Turmma, início">
            <Marca className="text-[24px] group-data-[collapsible=icon]:hidden" />
            <Pinta className="hidden h-9 w-9 text-laranja group-data-[collapsible=icon]:block" />
          </Link>
          {papel === 'professor' && <Lapis className="group-data-[collapsible=icon]:hidden" />}
          {!isMobile && papel !== 'aluno' && <BotaoRecolher />}
        </div>
        <SeletorEscola papel={papel} />
      </SidebarHeader>

      <SidebarContent className="gap-0 px-3 pb-2 pt-3">
        {/* no celular os lugares moram na barra de baixo: a gaveta traz só as conversas e a pessoa */}
        {!isMobile && (
          <nav aria-label="Lugares">
            <ul className="flex flex-col gap-2">{LUGARES[papel].map((l) => <ItemLugar key={l.para} papel={papel} lugar={l} numeros={numeros} />)}</ul>
          </nav>
        )}
        {(papel === 'professor' || papel === 'aluno') && (
          <div className="mt-3 border-t-2 border-borda pt-1 empty:hidden group-data-[collapsible=icon]:hidden max-md:mt-0 max-md:border-t-0">
            {papel === 'professor' ? <ConversasProfessor /> : <ConversasAluno />}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t-2 border-borda p-2 px-3">
        {papel === 'aluno' ? <CartaoAluno /> : <MenuPessoa papel={papel} aoConfig={aoConfig} aoAjuda={aoAjuda} />}
      </SidebarFooter>
    </Sidebar>
  )
}

/* < 768 px: a barra do topo, de 56 px, com borda de 2 px. Aluno: a pinta, a turma e o botão Conversas (sem lápis). */
function BarraTopoCelular({ papel }: { papel: Papel }) {
  const { toggleSidebar } = useSidebar()
  const ativa = useEscolaAtiva()
  const aluno = useAlunoAtual()
  const celular = useIsMobile()
  const contexto = papel === 'aluno' ? aluno.turma : papel === 'professor' ? ativa.nome : papel === 'rede' ? 'Secretaria de Educação' : ESCOLAS[0].nome
  const menu = papel === 'coordenacao' || papel === 'rede'
  const gaveta = menu ? 'Abrir o menu' : 'Abrir as conversas'
  return (
    <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b-2 border-borda bg-white pl-4 pr-1.5 md:hidden">
      <Pinta className="h-7 w-7 shrink-0 text-laranja" rotulo="Turmma" />
      {papel === 'rede' ? <RedeNoTopo /> : <span className="min-w-0 flex-1 truncate text-[16px] font-bold text-tinta">{contexto}</span>}
      {celular && (papel === 'professor' || papel === 'coordenacao') && <Sino papel={papel} />}
      <BotaoIcone rotulo={gaveta} tamanho={44} onClick={toggleSidebar} className="text-tinta">
        {menu ? <Ellipsis strokeWidth={2.5} /> : <MessageSquareText strokeWidth={2.5} />}
      </BotaoIcone>
      {papel === 'professor' && <Lapis tamanho={44} />}
    </div>
  )
}

/* < 768 px: a barra de baixo, fixa, de 68 px (mais a área segura), com os mesmos lugares. */
function BarraBaixo({ papel }: { papel: Papel }) {
  const { pathname, search } = useLocation()
  const numeros = useNumeros(papel)
  const lugares = LUGARES[papel]
  return (
    <nav aria-label="Lugares" style={{ gridTemplateColumns: `repeat(${lugares.length}, minmax(0, 1fr))` }}
      className="fixed inset-x-0 bottom-0 z-30 grid border-t-2 border-borda bg-white px-1 pb-[env(safe-area-inset-bottom,0px)] md:hidden">
      {lugares.map((l) => {
        const aceso = l.aceso(pathname, search)
        const n = l.contador ? numeros[l.contador] : 0
        const ponto = l.contador === 'eu'
        return (
          <Link key={l.para} to={l.para} aria-current={aceso ? 'page' : undefined} aria-label={n > 0 ? `${l.rotulo}, ${ponto ? PONTO(n) : n}` : l.rotulo}
            className="flex h-[68px] flex-col items-center justify-center gap-1">
            <span className={cn('relative grid h-9 w-12 place-items-center rounded-[12px] border-2 transition-colors duration-150',
              aceso ? 'border-azul-borda bg-azul-claro' : 'border-transparent')}>
              {l.avatar ? <AvatarIA agente={l.avatar} tamanho={28} /> : <Icone id={l.icone} tamanho={28} />}
              {n > 0 && ponto && <span aria-hidden className="absolute -right-1 -top-1 size-3 rounded-full bg-azul ring-2 ring-white" />}
              {n > 0 && !ponto && (
                <Contador n={n} tamanho="p" familia={l.contador === 'avisos' ? 'amarelo' : 'azul'}
                  className="absolute -right-2.5 -top-2 h-5 min-w-5 px-1 text-[12px] ring-2 ring-white" />
              )}
            </span>
            <span className={cn('text-[12px] font-bold uppercase leading-none tracking-[.04em]', aceso ? 'text-azul-texto' : 'text-sutil')}>
              {l.curto ?? l.rotulo}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

/** O tamanho do texto vale só para quem tem a escolha (aluno, professor, coordenação). */
function TamanhoDoTexto({ papel }: { papel: 'aluno' | 'professor' | 'coordenacao' }) {
  useTamanhoDoTexto(papel)
  return null
}

/** O painel do item (?item=, ?contestar=1), por cima de qualquer tela: fechar tira os dois do endereço. */
function PainelDoItem({ papel }: { papel: 'professor' | 'coordenacao' }) {
  const [params, setParams] = useSearchParams()
  const item = params.get('item')
  const contestar = params.get('contestar') === '1'
  const fechar = () => setParams((a) => { const p = new URLSearchParams(a); p.delete('item'); p.delete('contestar'); return p }, { replace: true })
  if (papel === 'professor') return <PainelDaFila itemId={item} aoFechar={fechar} contestar={contestar} />
  return <PainelDoItemCoordenacao itemId={item} aoFechar={fechar} />
}

export function Casca({ papel }: { papel: Papel }) {
  // ≥ 1024 px abre com a lateral de 256 px; entre 768 e 1023 px, o trilho de 88 px
  const [abertaDeInicio] = useState(() => typeof window === 'undefined' || window.innerWidth >= 1024)
  const [configUrl, setConfigUrl] = useParametro('config')
  const [config, setConfig] = useState<string | null>(null)
  const [ajuda, setAjuda] = useState(false)
  const celular = useIsMobile()
  const aberta = configUrl ?? config
  const comSino = papel === 'professor' || papel === 'coordenacao'
  return (
    <SidebarProvider defaultOpen={abertaDeInicio} className="casca" data-sino={comSino ? '' : undefined} data-papel={papel}
      style={{ '--sidebar-width': '256px', '--sidebar-width-icon': '88px' } as React.CSSProperties}>
      {papel !== 'rede' && <TamanhoDoTexto papel={papel} />}
      <Lateral papel={papel} aoConfig={setConfig} aoAjuda={() => setAjuda(true)} />
      <SidebarInset className="relative min-w-0 bg-fundo pb-[var(--barra-baixo)]">
        <BarraTopoCelular papel={papel} />
        {/* o sino: no canto de cima à direita da área de conteúdo, acima do conteúdo e abaixo dos diálogos */}
        {comSino && !celular && (
          <div className="absolute right-4 top-3 z-20" data-sino-canto>
            <Sino papel={papel} />
          </div>
        )}
        <Outlet />
      </SidebarInset>
      {comSino && <PainelDoItem papel={papel} />}
      <BarraBaixo papel={papel} />
      <Configuracoes papel={papel} aberta={aberta} aoFechar={() => { setConfig(null); if (configUrl) setConfigUrl(null) }} />
      <Ajuda aberta={ajuda} aoMudar={setAjuda} />
    </SidebarProvider>
  )
}
