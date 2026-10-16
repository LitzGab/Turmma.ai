import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Botao, BotaoIcone } from './botao'
import { MenuMais, type ItemMenuMais } from './menu'

/* AS PEÇAS DE PÁGINA (14ª rodada, 05/10/2026; plano ux-composicao, seção 5.1). "Muito espaço vazio, coisas mal
   posicionadas dando impressão de desalinhamento": quatro tipos de página e quatro larguras, um cabeçalho só.

   | Tipo      | Largura                                  | Ancoragem                                                      |
   | Conversa  | coluna de 768, centrada                  | barra de 56; mensagens a 24 do topo; caixa presa a 24 do fim   |
   | Leitura   | 880, na borda esquerda da moldura de 1200 | cabeçalho a 24 do topo; corpo logo abaixo, rolando por dentro  |
   | Painel    | até 1200, margem de 32, centrada         | do topo; grade de 12 colunas, vão de 16                        |
   | Documento | cabeçalho em 1080; mesa de ponta a ponta | do topo; a mesa rola por dentro                                |

   · A página nunca rola a 1440 × 780: quem rola é o corpo (`rolagem="corpo"`), ou a própria tela por dentro
     (`rolagem="nenhuma"`).
   · O cabeçalho (CabecalhoPagina) tem 64 px e guarda à direita o canto do sino (--reserva-sino, index.css).
   · Nada centrado na vertical, fora a conversa vazia (ConversaVazia: grade 1fr · auto · 2fr, o grupo a 1/3). */

export const LARGURA = { conversa: 768, leitura: 880, painel: 1200, documento: 1080, folha: 760 } as const

type TipoPagina = 'leitura' | 'painel' | 'documento'

/** A coluna centrada de cada tipo (com as margens: 16 no celular, 32 a partir de 768). */
const COLUNA: Record<TipoPagina | 'conversa', string> = {
  conversa: 'max-w-[768px]',
  leitura: 'max-w-[880px]',
  painel: 'max-w-[1200px]',
  documento: 'max-w-[1080px]',
}
const MARGEM = 'px-4 md:px-8'
/** A moldura comum: 1200 centrada; a coluna de cada tipo começa na borda esquerda dela. */
const MOLDURA = 'max-w-[1200px]'

export function Pagina({ tipo, cabecalho, children, rodape, rolagem = 'corpo', className }: {
  tipo: TipoPagina
  cabecalho: React.ReactNode
  children: React.ReactNode
  /** a barra presa embaixo (a ação do documento no celular, a barra de aprovar) */
  rodape?: React.ReactNode
  /** quem rola: o corpo (padrão) ou ninguém (a tela cuida da própria rolagem por dentro) */
  rolagem?: 'corpo' | 'nenhuma'
  className?: string
}) {
  // no documento, o corpo é a mesa de ponta a ponta (MesaDocumento): sem coluna e sem margem
  const comColuna = tipo !== 'documento'
  /* no celular, o cabeçalho rola junto com o corpo (um cabeçalho fixo de 290 px deixava 370 para o conteúdo): quem
     rola é a página inteira; o rodapé fica preso embaixo. Vale para o corpo que rola e para o documento (a mesa). */
  const rolaTudo = rolagem === 'corpo' || tipo === 'documento'
  /* Uma borda esquerda só (correção da 14ª rodada): toda página fica numa moldura de 1200 centrada, e a coluna do
     tipo (880, 1080, 1200) começa na borda esquerda dela. Trocar de aba na lateral não faz o título pular. Leitura e
     documento terminam antes do canto do sino e não guardam a reserva dele; o painel, que chega à borda, guarda. */
  const coluna = (filho: React.ReactNode, extra?: string) => (
    <div className={cn('mx-auto w-full', MOLDURA)}><div className={cn('w-full', COLUNA[tipo], extra)}>{filho}</div></div>
  )
  return (
    <div data-pagina={tipo} className={cn('altura-tela flex min-h-0 w-full flex-col', tipo !== 'painel' && '[--reserva-sino:0px]',
      rolaTudo && 'max-md:overflow-y-auto max-md:overscroll-contain', className)}>
      <div className={cn('shrink-0 pt-6', MARGEM)}>{coluna(cabecalho)}</div>
      <div className={cn('flex min-h-0 flex-1 flex-col', rolagem === 'corpo' ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden',
        rolaTudo && 'max-md:flex-none max-md:overflow-visible [&>[data-mesa]]:max-md:flex-none [&>[data-mesa]]:max-md:overflow-visible')}>
        {comColuna
          ? (
            // o corpo que rola cresce mas não encolhe: assim os 32 px de baixo aparecem no fim da rolagem
            <div className={cn('flex w-full flex-col pb-8 pt-4', rolagem === 'corpo' ? 'flex-[1_0_auto]' : 'min-h-0 flex-1', MARGEM)}>
              <div className={cn('mx-auto flex w-full flex-col', MOLDURA, rolagem === 'corpo' ? 'flex-[1_0_auto]' : 'min-h-0 flex-1')}>
                <div className={cn('flex w-full flex-col', COLUNA[tipo], rolagem === 'corpo' ? 'flex-[1_0_auto]' : 'min-h-0 flex-1')}>{children}</div>
              </div>
            </div>
          )
          : children}
      </div>
      {rodape && (
        <div className={cn('shrink-0 border-t-2 border-borda bg-white py-3 max-md:sticky max-md:bottom-0 max-md:z-[2] max-md:mt-auto', MARGEM)}>
          {coluna(rodape, 'flex items-center justify-end gap-2')}
        </div>
      )}
    </div>
  )
}

/* ── O cabeçalho de página ─────────────────────────────────────────────────────────────────────────────── */

export type AbasPagina = {
  abas: { id: string; rotulo: string; n?: number }[]
  valor: string
  aoMudar: (id: string) => void
  /** o que é da aba, na ponta direita da linha (filtro, interruptor, NOVA ATIVIDADE) */
  fim?: React.ReactNode
}

export type CabecalhoPaginaProps = {
  titulo: React.ReactNode
  /** só em tela de segundo nível: "‹ Rótulo" na linha de cima do título, dentro da coluna */
  voltar?: { para: string; rotulo: string } | (() => void)
  /** a linha pequena acima do título (t-selo) */
  sobrelinha?: React.ReactNode
  /** em t-apoio, na mesma linha do título ("2º ano EM · Manhã") */
  complemento?: React.ReactNode
  /** o selo do estado, logo depois do título */
  selo?: React.ReactNode
  /** a linha de apoio embaixo do título */
  linha?: React.ReactNode
  /** à direita: no máximo 1 cheia e 1 de contorno */
  acoes?: React.ReactNode
  /** o raro, no ⋯ */
  menu?: ItemMenuMais[]
  abas?: AbasPagina
  className?: string
}

/** O ‹ com a palavra ("‹ Tarefas"), DENTRO da coluna, na linha de cima do título: o título começa sempre na mesma
    borda da coluna, com ou sem voltar, e nada encosta na lateral. */
function Voltar({ voltar }: { voltar: NonNullable<CabecalhoPaginaProps['voltar']> }) {
  if (typeof voltar === 'function') {
    return (
      <button type="button" onClick={voltar} className={CLASSE_VOLTAR}>
        <ChevronLeft aria-hidden className="size-4" strokeWidth={3} /> Voltar
      </button>
    )
  }
  return <Link to={voltar.para} aria-label={`Voltar para ${voltar.rotulo}`} className={CLASSE_VOLTAR}><ChevronLeft aria-hidden className="size-4" strokeWidth={3} /> {voltar.rotulo}</Link>
}

const CLASSE_VOLTAR = '-ml-1.5 inline-flex h-7 items-center gap-0.5 self-start rounded-[8px] pl-0.5 pr-2 text-[13px] font-bold uppercase tracking-[.04em] text-sutil transition-colors duration-150 hover:bg-fundo-suave hover:text-tinta'

/** A linha das abas: 44 px, o número entre parênteses, o fio de 2 px até a borda da coluna e o fim à direita. */
export function AbasDaPagina({ abas, valor, aoMudar, fim, className }: AbasPagina & { className?: string }) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])
  if (abas.length > 3 && import.meta.env.DEV) console.warn(`Abas: no máximo 3 (R3); vieram ${abas.length}.`)
  const lista = abas.slice(0, 3)
  const teclar = (e: React.KeyboardEvent, i: number) => {
    const passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const j = (i + passo + lista.length) % lista.length
    aoMudar(lista[j].id)
    refs.current[j]?.focus()
  }
  return (
    // no celular, o fim (o filtro, o interruptor) sobe para a linha de cima e as abas ficam com a largura toda
    <div className={cn('flex shrink-0 items-stretch gap-x-4 border-b-2 border-borda max-md:flex-wrap md:h-11', className)}>
      <div role="tablist" className="flex h-11 min-w-0 items-stretch gap-6 overflow-x-auto [scrollbar-width:none] max-md:order-2 max-md:w-full">
        {lista.map((a, i) => {
          const ativa = a.id === valor
          return (
            <button key={a.id} ref={(el) => { refs.current[i] = el }} type="button" role="tab" aria-selected={ativa} tabIndex={ativa ? 0 : -1}
              onClick={() => aoMudar(a.id)} onKeyDown={(e) => teclar(e, i)}
              className={cn('t-rotulo relative -mb-[2px] shrink-0 whitespace-nowrap px-0.5 transition-colors duration-150',
                ativa ? 'text-azul-texto' : 'text-sutil hover:text-tinta')}>
              {a.rotulo}{a.n !== undefined && <span className="tabular-nums"> ({a.n})</span>}
              <span aria-hidden className={cn('absolute inset-x-0 bottom-0 h-[3px] rounded-full', ativa ? 'bg-azul' : 'bg-transparent')} />
            </button>
          )
        })}
      </div>
      {fim && <div className="ml-auto flex shrink-0 items-center gap-2 pb-1 max-md:order-1 max-md:w-full max-md:justify-end max-md:pb-2">{fim}</div>}
    </div>
  )
}

export function CabecalhoPagina({ titulo, voltar, sobrelinha, complemento, selo, linha, acoes, menu, abas, className }: CabecalhoPaginaProps) {
  return (
    <header className={cn('relative shrink-0', className)}>
      {voltar && <div className="flex h-7 md:pr-[var(--reserva-sino,0px)]"><Voltar voltar={voltar} /></div>}
      {/* a reserva do sino só vale na linha que fica na altura dele: a do voltar, quando existe (o título desce para
          baixo do sino e vai até a borda, como as abas e o corpo); senão, a do título */}
      <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', voltar ? 'min-h-12 pb-2 pt-1' : 'min-h-16 py-2 md:pr-[var(--reserva-sino,0px)]')}>
        <div className="flex min-w-0 flex-1 flex-col">
          {sobrelinha && <p className="t-selo text-sutil">{sobrelinha}</p>}
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="t-titulo min-w-0 text-tinta [overflow-wrap:anywhere]">{titulo}</h1>
            {complemento && <span className="t-apoio min-w-0">{complemento}</span>}
            {selo && <span className="flex shrink-0 items-center">{selo}</span>}
          </div>
        </div>
        {(acoes || (menu && menu.length > 0)) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {acoes}
            {menu && menu.length > 0 && <MenuMais itens={menu} />}
          </div>
        )}
      </div>
      {linha && <div className="t-apoio -mt-1 pb-3">{linha}</div>}
      {abas && <AbasDaPagina {...abas} className="mt-1" />}
    </header>
  )
}

/* ── A conversa ────────────────────────────────────────────────────────────────────────────────────────── */

/** A barra da conversa: o título (t-cartao) e o selo, alinhados à coluna de 768; guarda o canto do sino. Tem 64 px no
    computador para o centro dela cair na linha do sino (12 + 40/2 = 32), como a linha do título das outras abas. */
export function BarraConversa({ titulo, selo, inicio, acoes }: {
  titulo?: React.ReactNode
  selo?: React.ReactNode
  /** antes do título (a pílula da aula, o avatar) */
  inicio?: React.ReactNode
  acoes?: React.ReactNode
}) {
  return (
    <div className={cn('h-14 shrink-0 md:h-16 md:pr-[var(--reserva-sino,0px)]', MARGEM)}>
      <div className="mx-auto flex h-full w-full max-w-[768px] items-center gap-3">
        {inicio}
        {titulo && <h1 className="t-cartao min-w-0 truncate text-tinta">{titulo}</h1>}
        {selo && <span className="flex shrink-0 items-center">{selo}</span>}
        {acoes && <div className="ml-auto flex shrink-0 items-center gap-2">{acoes}</div>}
      </div>
    </div>
  )
}

/** A conversa vazia: o grupo (a saudação, a caixa, as sugestões) um pouco acima do meio (grade 2fr · auto · 3fr). */
export function ConversaVazia({ barra, topo, caixa, baixo }: {
  barra?: React.ReactNode
  /** a saudação */
  topo: React.ReactNode
  caixa: React.ReactNode
  /** sob a caixa: as sugestões e o aviso */
  baixo?: React.ReactNode
}) {
  return (
    <div data-pagina="conversa" className="altura-tela flex min-h-0 w-full flex-col">
      {barra}
      {/* no celular a caixa já nasce presa embaixo (como fica depois da primeira mensagem, sem pular): a saudação no
          meio do espaço livre, o que vai sob a caixa sobe para logo acima dela */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[2fr_auto_3fr] overflow-y-auto max-md:flex max-md:flex-col">
        <span aria-hidden className="max-md:hidden" />
        <div className={cn('w-full py-4 max-md:flex max-md:flex-1 max-md:flex-col', MARGEM)}>
          <div className="mx-auto grid w-full max-w-[768px] grid-cols-[minmax(0,1fr)] gap-6 max-md:flex max-md:flex-1 max-md:flex-col max-md:gap-4">
            <div className="min-w-0 pb-2 max-md:my-auto max-md:py-4">{topo}</div>
            <div className="min-w-0 max-md:order-3">{caixa}</div>
            {baixo && <div className="min-w-0 max-md:order-2">{baixo}</div>}
          </div>
        </div>
        <span aria-hidden className="max-md:hidden" />
      </div>
    </div>
  )
}

/** A conversa aberta: as mensagens a partir de 24 px do topo, rolando por dentro; a caixa presa a 24 px do fim.
    Rola sozinha enquanto a resposta chega, se quem lê está no fim; quem sobe vê o botão ↓ para voltar ao fim.
    `fim`: quando muda (uma pergunta nova), volta ao fim mesmo que a pessoa tenha subido. */
export function ColunaConversa({ barra, children, caixa, acimaDaCaixa, rolo, fim }: {
  barra?: React.ReactNode
  children: React.ReactNode
  caixa: React.ReactNode
  /** as pílulas que ficam acima da caixa */
  acimaDaCaixa?: React.ReactNode
  rolo?: React.Ref<HTMLDivElement>
  fim?: unknown
}) {
  const el = React.useRef<HTMLDivElement | null>(null)
  const conteudo = React.useRef<HTMLDivElement>(null)
  const noFim = React.useRef(true)
  const [longe, setLonge] = React.useState(false)
  const juntar = React.useCallback((no: HTMLDivElement | null) => {
    el.current = no
    if (typeof rolo === 'function') rolo(no)
    else if (rolo) (rolo as React.MutableRefObject<HTMLDivElement | null>).current = no
  }, [rolo])
  React.useEffect(() => {
    const e = el.current
    const c = conteudo.current
    if (!e || !c) return
    e.scrollTop = e.scrollHeight
    const medir = () => {
      const d = e.scrollHeight - e.scrollTop - e.clientHeight
      noFim.current = d < 72
      setLonge(d > 160)
    }
    e.addEventListener('scroll', medir, { passive: true })
    const ro = new ResizeObserver(() => { if (noFim.current) e.scrollTop = e.scrollHeight; medir() })
    ro.observe(c)
    return () => { e.removeEventListener('scroll', medir); ro.disconnect() }
  }, [])
  const irAoFim = React.useCallback((suave: boolean) => {
    const e = el.current
    if (!e) return
    noFim.current = true
    const calmo = !suave || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    e.scrollTo({ top: e.scrollHeight, behavior: calmo ? 'auto' : 'smooth' })
  }, [])
  const primeiro = React.useRef(true)
  React.useEffect(() => {
    if (primeiro.current) { primeiro.current = false; return }
    irAoFim(false)
  }, [fim, irAoFim])
  return (
    <div data-pagina="conversa" className="altura-tela flex min-h-0 w-full flex-col">
      {barra}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={juntar} className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8 pt-6', MARGEM)}>
          <div ref={conteudo} className="mx-auto grid w-full max-w-[768px] grid-cols-[minmax(0,1fr)] content-start gap-6">{children}</div>
        </div>
        {longe && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
            <BotaoIcone variante="secundario" rotulo="Ir para o fim da conversa" onClick={() => irAoFim(true)} className="pointer-events-auto animate-entra">
              <ArrowDown strokeWidth={2.5} />
            </BotaoIcone>
          </div>
        )}
      </div>
      <div className={cn('relative shrink-0 pb-5', MARGEM)}>
        {/* o esfumado sobre a última linha, como nas IAs: a conversa some por baixo da caixa sem corte seco */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-b from-transparent to-fundo" />
        <div className="mx-auto grid w-full max-w-[768px] grid-cols-[minmax(0,1fr)] gap-3">
          {acimaDaCaixa}
          {caixa}
        </div>
      </div>
    </div>
  )
}

/* ── Seções e painel ───────────────────────────────────────────────────────────────────────────────────── */

/** Uma seção fora de cartão: o título em t-secao (20/700), o número, o apoio e a ação; 12 px até o bloco. */
export function Secao({ titulo, n, apoio, acao, children, className }: {
  titulo: React.ReactNode
  n?: number
  apoio?: React.ReactNode
  acao?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('min-w-0', className)}>
      <div className="mb-3 flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="t-secao text-tinta">{titulo}{n !== undefined && <span className="tabular-nums text-sutil"> ({n})</span>}</h2>
        {apoio && <span className="t-apoio">{apoio}</span>}
        {acao && <div className="ml-auto flex items-center gap-2">{acao}</div>}
      </div>
      {children}
    </section>
  )
}

/** A grade do painel: 12 colunas, vão de 16. Os filhos dizem quantas ocupam (`col-span-12 lg:col-span-8`). */
export function GradePainel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-12 gap-4', className)}>{children}</div>
}

/** O bloco do painel: o título em t-cartao e, no canto, a ação e o PERGUNTAR (fantasma). O que é lista rola por dentro. */
export function CartaoPainel({ titulo, acao, perguntar, children, className }: {
  titulo: React.ReactNode
  acao?: React.ReactNode
  perguntar?: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex min-h-0 min-w-0 flex-col rounded-[16px] border-2 border-borda bg-white p-4 lg:p-5', className)}>
      <div className="mb-3 flex min-h-8 shrink-0 items-center gap-2">
        <h2 className="t-cartao min-w-0 flex-1 truncate text-tinta">{titulo}</h2>
        {acao}
        {perguntar && <Botao variante="fantasma" tamanho="p" className="-mr-2" onClick={perguntar}>Perguntar</Botao>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  )
}

/** Atalho para um link de voltar como texto ("‹ Criados"), usado no documento. */
export function LinkVoltar({ para, rotulo, className }: { para: string; rotulo: string; className?: string }) {
  return (
    <Link to={para} className={cn('-ml-1.5 inline-flex h-7 items-center gap-0.5 rounded-[8px] pl-0.5 pr-2 text-[13px] font-bold uppercase tracking-[.04em] text-sutil transition-colors duration-150 hover:bg-fundo-suave hover:text-tinta', className)}>
      <ChevronLeft aria-hidden className="size-4" strokeWidth={3} /> {rotulo}
    </Link>
  )
}
