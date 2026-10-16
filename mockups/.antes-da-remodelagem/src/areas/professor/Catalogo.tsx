import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpDown, CheckCheck, ClipboardList, FileCheck, MessageCircle, Presentation, Search, SearchX, Sparkles, Star, X, type LucideIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IconeFerramenta } from '@/components/turmma/icones-ferramenta'
import { BotaoT, tipo, VazioT } from '@/components/turmma/teachy'
import { alternarFavorita, useFavoritas } from '@/dados/favoritas'
import { CATALOGO, CATEGORIAS, categoria, rotaDa, type CategoriaId, type Ferramenta } from '@/dados/ferramentas'
import { cn } from '@/lib/utils'
import { limpa } from './_busca'

/* O CATÁLOGO: as 17 ferramentas de `dados/ferramentas` — só o que entrega um OUTPUT PRÓPRIO.

   OITAVA RODADA (20/09/2026): CÓPIA do modal "Criar mais com IA" da Teachy. A sétima rodada tinha "adaptado" a Teachy
   (grade de três colunas, sem lista de categorias, sem título) e o Gabriel respondeu: "eu quero um ctrl c e ctrl v da
   Teachy. Não está interessante o seu." As medidas vêm da Teachy real (ESPEC, seção A); as cores são as nossas
   (`components/turmma/teachy`): nada de azul, fundo e borda neutros, laranja só em link, estrela marcada e detalhe.
   · CABEÇALHO de 88 px: ícone de 32 px + "Criar com IA" (Quicksand 24/700) e a BUSCA enorme — o resto da linha,
     40 px, pílula cinza, lupa À DIREITA (com texto, a lupa vira o X; Esc também limpa). Quem monta o cabeçalho é a
     casca (Ferramentas.tsx), que põe o seletor [Ferramentas | Biblioteca] no fim, onde a Teachy tem o X do modal;
   · LISTA de 256 px à esquerda: Todos, as quatro categorias de `dados/ferramentas` (a Teachy tem doze; não se inventa
     categoria), um fio e Favoritas. Item de 40 px, canto 8; o ativo em cinza com Quicksand 14/700. A escolha mora no
     endereço (`?cat=`), para o "voltar" de uma ferramenta cair na mesma categoria;
   · CONTEÚDO em #FBFBFB, rolando por dentro: no alto à direita o link "Pedir ao Assistente" (na Teachy, "Lara
     (Chatbot)"); "Recomendados" (8) e "Todos" (17, com o seletor de ordem: Padrão | De A a Z). Categoria escolhida ou
     Favoritas: uma seção só. Busca: "Resultados" (procura no catálogo inteiro e volta a lista para "Todos"); sem
     resultado, o estado vazio leva o pedido para a conversa — a regra "o que não é ferramenta, pede-se ao Assistente";
   · CARTÃO de 96 px, canto 8, fio de 1 px, sem sombra: ícone ilustrado de 40 px centralizado numa área de 109 px,
     nome em Quicksand 16/700, resumo em 12/16 (duas linhas) e a ESTRELA de 20 px no canto, laranja quando marcada. A
     estrela é irmã do link, não filha: favoritar não abre a ferramenta. Grade de DUAS colunas, vão 12.
   O que saiu da sétima rodada: a grade de 12 trilhos sem buraco (`vaos`), a medição de colunas por ResizeObserver
   (agora é container query), o ladrilho cinza atrás do ícone, a seção "Favoritas" no alto da página (virou item da
   lista), o texto longo no cartão largo e a busca de 36 px na barra de controles.
   Estreito (quadro com menos de 720 px — celular, ou janela pequena com a lateral aberta): a lista vira uma fileira de
   botões que rola de lado, os cartões ficam em uma coluna e a área do ícone encolhe para 48 px. */

/** O texto do cartão: a mesma ideia de `texto`, escrita para caber em duas linhas de 12 px (uns 72 toques).
    O `texto` inteiro de `dados/ferramentas` continua valendo no `title` e na busca. No produto isto é um campo do dado. */
export const RESUMO: Record<string, string> = {
  plano: 'Uma aula ou a sequência inteira: etapas com tempo, BNCC e o que levar.',
  periodo: 'O que dar em cada aula da quinzena ou do bimestre, no seu calendário.',
  projeto: 'Pergunta norteadora, etapas com data, papéis no grupo e rubrica final.',
  recuperacao: 'Retoma as habilidades com mais erro na turma, com exercícios e checagem.',
  apresentacao: 'Slides com roteiro de fala, tirados do capítulo, na duração da sua aula.',
  material: 'Resumo, texto de apoio ou folha de revisão do capítulo que você escolher.',
  mapa: 'O capítulo em ramos: o conceito no centro e a página de cada ideia.',
  experimento: 'Prática com o que você tem: materiais, passos, segurança e descarte.',
  adaptacao: 'A mesma prova ou atividade em outra forma. O conteúdo cobrado não muda.',
  prova: 'Questões do material da escola, com gabarito, versões e a página citada.',
  atividade: 'Exercícios do fácil ao difícil, do tipo que você escolher, com gabarito.',
  diagnostica: 'Sondagem curta antes do assunto: cada questão mira um pré-requisito.',
  simulado: 'Questões oficiais do ENEM por assunto e habilidade, com ano e número.',
  proposta: 'Tema, comando e textos motivadores, com a rubrica por competência pronta.',
  importar: 'Sua prova em PDF ou Word vira prova editável, com gabarito e habilidade.',
  correcao: 'O Assistente corrige a objetiva. Só vai ao aluno depois que você aprova.',
  redacao: 'Rubrica, lote organizado e correção cega. Quem corrige e devolve é você.',
}

/** "Recomendados": as oito de todo dia, nesta ordem. No produto sai do uso da própria professora. */
const RECOMENDADOS = ['plano', 'prova', 'apresentacao', 'atividade', 'mapa', 'material', 'periodo', 'adaptacao']
  .map((id) => CATALOGO.find((f) => f.id === id)).filter((f): f is Ferramenta => Boolean(f))

type Filtro = 'todos' | CategoriaId | 'favoritas'
type Ordem = 'padrao' | 'az'

const ICONE_DA_CATEGORIA: Record<CategoriaId, LucideIcon> = { planejar: ClipboardList, preparar: Presentation, avaliar: FileCheck, corrigir: CheckCheck }
const ehFiltro = (v: string | null): v is Filtro => v === 'favoritas' || CATEGORIAS.some((c) => c.id === v)

/* ── Cabeçalho: o título e a busca (a casca junta os dois com o seletor de abas) ───────────────────── */

/** No quadro largo o bloco do título tem 248 px: 32 de respiro + 248 + 8 de vão = 288, e a busca começa na mesma
    vertical dos cartões (lista de 256 + respiro de 32), como na Teachy, onde "Criar mais com IA" ocupa essa largura. */
function Titulo() {
  return (
    <div className="flex w-full shrink-0 items-center gap-2 @min-[720px]:w-[248px]">
      <Sparkles aria-hidden className="size-8 shrink-0 text-caramelo" strokeWidth={1.75} fill="currentColor" />
      <h1 className={cn(tipo.titulo, 'whitespace-nowrap')}>Criar com IA</h1>
    </div>
  )
}

/** A busca da Teachy: o resto da linha, 40 px, pílula cinza com fio, lupa à direita. Com texto, a lupa vira o X. */
function BuscaT({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  return (
    <div className="relative min-w-0 flex-1 basis-full @min-[720px]:basis-0">
      <input value={valor} onChange={(e) => aoMudar(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape' && valor) aoMudar('') }}
        placeholder="Buscar..." aria-label="Buscar ferramenta" enterKeyHint="search"
        className="h-10 w-full rounded-full border border-borda-campo bg-realce-suave py-1 pl-4 pr-10 text-[14px] leading-5 text-tinta outline-none transition-colors duration-150 placeholder:text-inativo focus-visible:border-tinta" />
      {valor ? (
        <button type="button" aria-label="Limpar a busca" onClick={() => aoMudar('')}
          className="absolute right-1.5 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-sutil transition-colors duration-150 hover:bg-realce hover:text-tinta">
          <X className="size-[18px]" strokeWidth={1.75} />
        </button>
      ) : <Search aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-sutil" strokeWidth={1.75} />}
    </div>
  )
}

/* ── A lista de categorias ─────────────────────────────────────────────────────────────────────────── */

function ItemLista({ icone: Icone, nome, ativo, aoClicar }: { icone: LucideIcon; nome: string; ativo: boolean; aoClicar: () => void }) {
  return (
    <button type="button" aria-pressed={ativo} onClick={aoClicar}
      className={cn('flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-[8px] px-3 text-left text-[14px] leading-5 text-tinta transition-colors duration-150 @min-[720px]:w-full',
        ativo ? 'bg-realce font-teachy font-bold' : 'hover:bg-realce-suave')}>
      <Icone aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />
      <span className="truncate">{nome}</span>
    </button>
  )
}

function Lista({ filtro, aoMudar }: { filtro: Filtro; aoMudar: (f: Filtro) => void }) {
  const nav = useRef<HTMLElement>(null)
  // na fileira do celular, o item escolhido vem para o meio (na lista em pé não há o que rolar de lado)
  useEffect(() => {
    const caixa = nav.current, el = caixa?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!caixa || !el) return
    const a = el.getBoundingClientRect(), b = caixa.getBoundingClientRect()
    caixa.scrollTo({ left: Math.max(0, a.left - b.left + caixa.scrollLeft - (b.width - a.width) / 2) })
  }, [filtro])
  return (
    <nav ref={nav} aria-label="Categorias"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-linha bg-superficie px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden @min-[720px]:w-64 @min-[720px]:flex-col @min-[720px]:overflow-y-auto @min-[720px]:overflow-x-hidden @min-[720px]:border-b-0 @min-[720px]:border-r-2 @min-[720px]:p-4">
      <ItemLista icone={Sparkles} nome="Todos" ativo={filtro === 'todos'} aoClicar={() => aoMudar('todos')} />
      {CATEGORIAS.map((c) => <ItemLista key={c.id} icone={ICONE_DA_CATEGORIA[c.id]} nome={c.nome} ativo={filtro === c.id} aoClicar={() => aoMudar(c.id)} />)}
      <span aria-hidden className="mx-1 my-2 w-px shrink-0 bg-linha @min-[720px]:mx-0 @min-[720px]:my-1 @min-[720px]:h-px @min-[720px]:w-auto" />
      <ItemLista icone={Star} nome="Favoritas" ativo={filtro === 'favoritas'} aoClicar={() => aoMudar('favoritas')} />
    </nav>
  )
}

/* ── O cartão e a grade ────────────────────────────────────────────────────────────────────────────── */

function CartaoFerramenta({ f, favorita }: { f: Ferramenta; favorita: boolean }) {
  return (
    <li className="group relative min-w-0">
      <Link to={rotaDa(f)} title={f.texto}
        className="flex h-24 items-center gap-3 rounded-[8px] border border-linha bg-superficie p-4 transition-colors duration-150 group-hover:border-borda-campo @min-[480px]:gap-4">
        <span className="grid h-10 w-12 shrink-0 place-items-center @min-[480px]:w-[109px]"><IconeFerramenta id={f.id} className="size-10" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate pr-5 font-teachy text-[16px] font-bold leading-7 text-noite-alto">{f.nome}</span>
          <span className="line-clamp-2 text-[12px] leading-4 text-sutil">{RESUMO[f.id] ?? f.texto}</span>
        </span>
      </Link>
      {/* a estrela de 20 px fica a 12 px do topo e da direita; o botão tem 28 px para o dedo */}
      <button type="button" aria-pressed={favorita} aria-label={`Favoritar ${f.nome}`} title={favorita ? 'Tirar das favoritas' : 'Favoritar'}
        onClick={() => alternarFavorita(f.id)}
        className={cn('absolute right-2 top-2 grid size-7 place-items-center rounded-full transition-[color,transform] duration-150 active:scale-90 motion-reduce:transform-none',
          favorita ? 'text-caramelo hover:text-caramelo-fundo' : 'text-inativo hover:text-tinta')}>
        <Star className="size-5" strokeWidth={1.75} fill={favorita ? 'currentColor' : 'none'} />
      </button>
    </li>
  )
}

function Secao({ titulo, conta, lado, itens, favoritas, className }: { titulo: string; conta?: number; lado?: ReactNode; itens: Ferramenta[]; favoritas: readonly string[]; className?: string }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={className}>
      <div className="flex min-h-8 items-center justify-between gap-3 px-2">
        <h2 id={id} aria-live={conta === undefined ? undefined : 'polite'} className={tipo.secao}>
          {titulo}{conta !== undefined && <span className="ml-2 font-teachy-corpo text-[14px] font-normal leading-none text-inativo">{conta}</span>}
        </h2>
        {lado}
      </div>
      <ul className="mt-2 grid grid-cols-[minmax(0,1fr)] gap-3 @min-[760px]:grid-cols-[repeat(2,minmax(0,1fr))]">
        {itens.map((f) => <CartaoFerramenta key={f.id} f={f} favorita={favoritas.includes(f.id)} />)}
      </ul>
    </section>
  )
}

/** O seletor de ordem de "Todos": pílula de 42 px, fio de 1 px, ⇅ à esquerda. */
function SeletorDeOrdem({ valor, aoMudar }: { valor: Ordem; aoMudar: (v: Ordem) => void }) {
  return (
    <Select value={valor} onValueChange={(v) => aoMudar(v === 'az' ? 'az' : 'padrao')}>
      <SelectTrigger aria-label="Ordem das ferramentas"
        className="h-[42px] w-auto shrink-0 gap-2 rounded-full border-borda-campo bg-superficie px-4 text-[14px] leading-5 text-tinta shadow-none focus:ring-0 focus:ring-offset-0 focus-visible:border-tinta">
        <ArrowUpDown aria-hidden className="size-4 shrink-0 text-sutil" strokeWidth={1.75} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="rounded-[8px] font-teachy-corpo">
        <SelectItem value="padrao" className="rounded-[6px]">Padrão</SelectItem>
        <SelectItem value="az" className="rounded-[6px]">De A a Z</SelectItem>
      </SelectContent>
    </Select>
  )
}

const arteVazio = (Icone: LucideIcon) => <span aria-hidden className="grid size-14 place-items-center rounded-full bg-realce-suave text-sutil"><Icone className="size-6" strokeWidth={1.75} /></span>

/* ── O corpo: lista + conteúdo que rola por dentro ─────────────────────────────────────────────────── */

function Corpo({ busca, filtro, aoFiltrar }: { busca: string; filtro: Filtro; aoFiltrar: (f: Filtro) => void }) {
  const navegar = useNavigate()
  const favoritas = useFavoritas()
  const [ordem, setOrdem] = useState<Ordem>('padrao')
  const rolagem = useRef<HTMLDivElement>(null)
  const q = limpa(busca.trim())
  // trocou de categoria ou de busca: o conteúdo volta para o alto
  useEffect(() => { rolagem.current?.scrollTo({ top: 0 }) }, [filtro, q])

  // acha por nome, texto, apelido e categoria; quem tem a palavra no NOME vem primeiro (a ordem do catálogo desempata)
  const peso = (f: Ferramenta) => { const n = limpa(f.nome); return n.startsWith(q) ? 0 : n.includes(q) ? 1 : 2 }
  const achadas = q ? CATALOGO.filter((f) => limpa(`${f.nome} ${f.texto} ${f.busca} ${categoria(f.categoria).nome}`).includes(q)).sort((a, b) => peso(a) - peso(b)) : []
  const todas = ordem === 'az' ? [...CATALOGO].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) : CATALOGO
  const comEstrela = CATALOGO.filter((f) => favoritas.includes(f.id))

  let miolo: ReactNode
  if (q) {
    miolo = achadas.length > 0
      ? <Secao titulo="Resultados" conta={achadas.length} itens={achadas} favoritas={favoritas} />
      : (
        <VazioT tracejado className="mt-2" arte={arteVazio(SearchX)} titulo={`Nenhuma ferramenta chamada "${busca.trim()}"`}
          texto="Peça do seu jeito: o Assistente entende o pedido e, se existir ferramenta para isso, ele pergunta antes de usar."
          acao={<BotaoT onClick={() => navegar('/professor', { state: { pedido: busca.trim() } })}><MessageCircle aria-hidden /> Pedir na conversa</BotaoT>} />
      )
  } else if (filtro === 'todos') {
    miolo = (
      <>
        <Secao titulo="Recomendados" itens={RECOMENDADOS} favoritas={favoritas} />
        <Secao className="mt-6" titulo="Todos" lado={<SeletorDeOrdem valor={ordem} aoMudar={setOrdem} />} itens={todas} favoritas={favoritas} />
      </>
    )
  } else if (filtro === 'favoritas') {
    miolo = comEstrela.length > 0
      ? <Secao titulo="Favoritas" itens={comEstrela} favoritas={favoritas} />
      : (
        <VazioT tracejado className="mt-2" arte={arteVazio(Star)} titulo="Nenhuma favorita ainda"
          texto="Marque a estrela no canto de uma ferramenta e ela passa a aparecer aqui."
          acao={<BotaoT variante="contorno" onClick={() => aoFiltrar('todos')}>Ver todas as ferramentas</BotaoT>} />
      )
  } else {
    miolo = <Secao titulo={categoria(filtro).nome} itens={CATALOGO.filter((f) => f.categoria === filtro)} favoritas={favoritas} />
  }

  return (
    <>
      <Lista filtro={filtro} aoMudar={aoFiltrar} />
      <div ref={rolagem} className="@container min-h-0 min-w-0 flex-1 overflow-y-auto bg-[#FBFBFB]">
        <div className="px-4 py-4 @min-[560px]:px-8">
          <div className="flex h-6 items-center justify-end px-2">
            <Link to="/professor" className="inline-flex items-center gap-1.5 rounded-[4px] font-teachy text-[14px] font-bold leading-6 text-caramelo-texto underline-offset-4 hover:underline">
              <MessageCircle aria-hidden className="size-[18px]" strokeWidth={2} /> Pedir ao Assistente
            </Link>
          </div>
          {miolo}
        </div>
      </div>
    </>
  )
}

/** O catálogo em três pedaços, para a casca (Ferramentas.tsx) montar o quadro: `titulo` e `busca` vão no cabeçalho de
    88 px, `corpo` (lista + conteúdo) embaixo. A busca é dos dois lados, por isso é um hook e não três componentes. */
export function useCatalogo(): { titulo: ReactNode; busca: ReactNode; corpo: ReactNode } {
  const [params, setParams] = useSearchParams()
  const [busca, setBusca] = useState('')
  const cat = params.get('cat')
  const filtro: Filtro = ehFiltro(cat) ? cat : 'todos'
  // a busca procura no catálogo inteiro: quem digita volta para "Todos"; quem escolhe uma categoria limpa a busca
  const aoBuscar = (v: string) => { setBusca(v); if (v.trim() && filtro !== 'todos') setParams({}, { replace: true }) }
  const aoFiltrar = (f: Filtro) => { setBusca(''); setParams(f === 'todos' ? {} : { cat: f }, { replace: true }) }
  return {
    titulo: <Titulo />,
    busca: <BuscaT valor={busca} aoMudar={aoBuscar} />,
    corpo: <Corpo busca={busca} filtro={filtro} aoFiltrar={aoFiltrar} />,
  }
}
