import * as React from 'react'
import { ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, Lock, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Botao, BotaoIcone } from './botao'
import { Cartao } from './cartao'
import { Dialogo } from './dialogo'
import { familia as estiloFamilia, type Familia } from './familia'
import { AbasDaPagina, LinkVoltar, type CabecalhoPaginaProps } from './pagina'
import { Selo } from './selo'

/* AS PEÇAS DO DOCUMENTO (14ª rodada, 05/10/2026; plano ux-composicao, seções 3.3, 3.4 e 3.6), no modelo do Geekie One
   e do Plurall: a atividade tem lugar próprio, um esqueleto só para os 9 tipos, a questão é a unidade e a página do
   livro é metadado; gabarito e "como o aluno vê" são modos de ver.
   SÓ DESENHO: nenhuma peça lê dados (quem liga aos dados é a tarefa DOC).

   · CabecalhoDocumento: ‹ voltar (13/700) · ícone 40 · título 24/700 (renomeia no lugar) · selo do estado · à direita
     as ações (no máximo um cheio) · a linha de dados (TIPO · metadados) · a linha do estado · as abas com o número.
   · MesaDocumento: o fundo `mesa` de ponta a ponta, rolando por dentro; o sumário de 200 px preso à esquerda (a partir
     de 1200 px de janela); a folha de 760 centrada.
   · Folha (760; estreita 560 para o lado a lado; ampliada com letra 19) · CabecalhoFolha (escola · disciplina ·
     turma; Nome ____ Data __/__ Valor) · BlocoQuestao · Sumario · CartoesResumo · LinhaDoTempo · BlocoFixo ·
     TabelaSequencia · TabelaRubrica · GradeSlides · SlideAberto · MapaMental · FaixaResultados · CartaoDocumento ·
     SeloEstadoDocumento.
   A 375: a folha sem borda e sem mesa; a rubrica vira um cartão por critério; o mapa mental, uma árvore vertical. */

export type TipoDocumento = 'prova' | 'atividade' | 'simulado' | 'adaptada' | 'plano' | 'sequencia' | 'material' | 'apresentacao' | 'rubrica' | 'redacao'

/* ── O estado ─────────────────────────────────────────────────────────────────────────────────────────── */

export function SeloEstadoDocumento({ estado, por, quando }: {
  estado: 'espera' | 'aprovado' | 'recusado' | 'so-voce'
  por?: string
  quando?: string
}) {
  const quem = [por && `por ${por}`, quando].filter(Boolean).join(' · ')
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {estado === 'espera' && <Selo familia="amarelo">Para aprovar</Selo>}
      {estado === 'aprovado' && <Selo familia="verde" icone={<Check strokeWidth={3} />}>Aprovado</Selo>}
      {estado === 'recusado' && <Selo familia="vermelho">Recusado</Selo>}
      {estado === 'so-voce' && <Selo icone={<Lock strokeWidth={2.5} />} title="Fica com você: não vai à turma">Só você vê</Selo>}
      {quem && estado !== 'so-voce' && <span className="truncate text-[14px] font-medium text-sutil">{quem}</span>}
    </span>
  )
}

/* ── O cabeçalho ──────────────────────────────────────────────────────────────────────────────────────── */

function TituloEditavel({ titulo, aoRenomear }: { titulo: string; aoRenomear?: (t: string) => void }) {
  const [editando, setEditando] = React.useState(false)
  const [valor, setValor] = React.useState(titulo)
  React.useEffect(() => { if (!editando) setValor(titulo) }, [titulo, editando])
  const salvar = () => { const t = valor.trim(); if (t && t !== titulo) aoRenomear?.(t); setEditando(false) }
  if (editando) {
    return (
      <input autoFocus value={valor} onChange={(e) => setValor(e.target.value)} onBlur={salvar} aria-label="Nome do documento"
        onKeyDown={(e) => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(false) }}
        className="t-titulo h-10 min-w-0 flex-1 rounded-[10px] border-2 border-azul-borda bg-campo px-2 text-tinta outline-none" />
    )
  }
  return (
    <h1 className="t-titulo min-w-0 text-tinta [overflow-wrap:anywhere]">
      {aoRenomear
        ? <button type="button" onClick={() => setEditando(true)} title="Renomear" className="group/titulo -mx-1 rounded-[8px] px-1 text-left hover:bg-fundo-suave">
            {titulo}<Pencil aria-hidden className="ml-2 inline size-4 align-middle text-sutil opacity-0 transition-opacity group-hover/titulo:opacity-100" strokeWidth={2.5} />
          </button>
        : titulo}
    </h1>
  )
}

export function CabecalhoDocumento({ voltar, icone, tipo, titulo, aoRenomear, selo, estado, metadados, acoes, abas }: {
  voltar: { para: string; rotulo: string }
  /** o ícone da ferramenta, a 40 px */
  icone: React.ReactNode
  /** "Prova", "Plano de aula"… (vai em caixa alta) */
  tipo: string
  titulo: string
  aoRenomear?: (t: string) => void
  /** o SeloEstadoDocumento */
  selo: React.ReactNode
  /** a linha do estado: "Só você vê. Chega ao 2ºB quando você aprovar." */
  estado?: React.ReactNode
  /** "2ºB · Química", "10 questões", "50 min", "Química 2, cap. 7", "Assistente, 21/09" */
  metadados: string[]
  acoes?: React.ReactNode
  abas?: CabecalhoPaginaProps['abas']
}) {
  return (
    <header className="shrink-0">
      <LinkVoltar para={voltar.para} rotulo={voltar.rotulo} />
      <div className="mt-1 flex flex-wrap items-start gap-x-3 gap-y-2 md:pr-[var(--reserva-sino,0px)]">
        <span className="grid size-10 shrink-0 place-items-center [&>svg]:size-10 max-sm:hidden">{icone}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-h-10 min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <TituloEditavel titulo={titulo} aoRenomear={aoRenomear} />
            {selo}
          </div>
          <p className="text-[14px] font-medium leading-5 text-sutil">
            <span className="t-selo">{tipo}</span>
            {metadados.filter(Boolean).map((m) => <span key={m}><span aria-hidden className="mx-1.5">·</span>{m}</span>)}
          </p>
          {estado && <p className="t-apoio">{estado}</p>}
        </div>
        {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:w-full">{acoes}</div>}
      </div>
      {abas && <AbasDaPagina {...abas} className="mt-3" />}
      {!abas && <div className="mt-4" />}
    </header>
  )
}

/* ── A mesa e a folha ─────────────────────────────────────────────────────────────────────────────────── */

/** A mesa: de ponta a ponta, rolando por dentro. `ladoALado` (as duas folhas de 560) entra no lugar da folha. */
export const MesaDocumento = React.forwardRef<HTMLDivElement, { sumario?: React.ReactNode; children: React.ReactNode; ladoALado?: React.ReactNode }>(
  function MesaDocumento({ sumario, children, ladoALado }, ref) {
    return (
      <div ref={ref} data-mesa className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white sm:bg-mesa">
        <div className={cn('mx-auto flex w-full justify-center gap-8 px-4 pb-16 pt-0 sm:px-8 sm:pt-6', sumario ? 'max-w-[1080px]' : 'max-w-[1240px]')}>
          {sumario && <div className="hidden w-[200px] shrink-0 min-[1200px]:block"><div className="sticky top-0">{sumario}</div></div>}
          <div className="flex min-w-0 flex-1 justify-center">{ladoALado ?? children}</div>
          {/* contrapeso do sumário: a folha fica no centro da mesa */}
          {sumario && <div aria-hidden className="hidden w-[200px] shrink-0 min-[1440px]:block" />}
        </div>
      </div>
    )
  },
)

export function Folha({ children, ampliada, estreita, className }: {
  children: React.ReactNode
  ampliada?: boolean
  /** 560 px, para o lado a lado */
  estreita?: boolean
  className?: string
}) {
  return (
    <article className={cn('w-full min-w-0 bg-white text-tinta sm:rounded-[16px] sm:border-2 sm:border-borda sm:px-10 sm:py-10',
      estreita ? 'max-w-[560px]' : 'max-w-[760px]',
      ampliada ? 'text-[19px] leading-[1.6]' : 'text-[17px] leading-[1.6]', 'font-medium', className)}>
      {children}
    </article>
  )
}

export function CabecalhoFolha({ escola, disciplina, turma, valor, instrucoes, area, tempo }: {
  escola: string
  disciplina: string
  turma: string
  valor?: string
  instrucoes?: string[]
  /** no simulado: "Ciências da Natureza · formato ENEM" (no lugar da disciplina) */
  area?: string
  /** "Tempo: o da turma + 50%" */
  tempo?: string
}) {
  // rótulo, linha e valor na mesma linha de base (a linha vazia se apoia na base do texto)
  const campo = (rotulo: string, largura: string) => (
    <span className={cn('inline-flex min-w-0 items-baseline gap-1.5', largura)}><span className="t-selo shrink-0 text-sutil">{rotulo}</span><span aria-hidden className="inline-block h-5 min-w-8 flex-1 border-b-2 border-borda-forte" /></span>
  )
  return (
    <header className="mb-8 border-b-2 border-borda pb-5">
      <p className="t-selo text-sutil">{[escola, area ?? disciplina, turma].join(' · ')}</p>
      <div className="mt-4 flex flex-nowrap items-baseline gap-x-5 text-[15px] leading-5">
        {campo('Nome', 'max-w-[280px] flex-1')}
        {campo('Data', 'w-[104px] shrink-0')}
        {valor && <span className="inline-flex shrink-0 items-baseline gap-1.5"><span className="t-selo text-sutil">Valor</span><b className="font-bold tabular-nums">{valor}</b></span>}
      </div>
      {tempo && <p className="mt-3 text-[15px] font-bold text-tinta">{tempo}</p>}
      {instrucoes && instrucoes.length > 0 && (
        <ul className="mt-3 grid gap-1 text-[15px] leading-[22px] text-apoio">
          {instrucoes.map((i) => <li key={i}>{i}</li>)}
        </ul>
      )}
    </header>
  )
}

/* ── A questão ────────────────────────────────────────────────────────────────────────────────────────── */

const LETRAS = 'ABCDEFGH'

export function BlocoQuestao({ n, id, enunciado, pergunta, dados, alternativas, certa, gabarito, resolucao, meta, linhasResposta, ampliada }: {
  n: number
  id?: string
  enunciado: React.ReactNode
  pergunta?: React.ReactNode
  dados?: string
  alternativas?: string[]
  /** o índice da certa (0 = A) */
  certa?: number
  gabarito?: boolean
  resolucao?: React.ReactNode
  /** "OBJETIVA", "EM13CNT301", "p. 142", "fácil" */
  meta?: string[]
  /** a discursiva: linhas em branco para responder */
  linhasResposta?: number
  ampliada?: boolean
}) {
  const [porQue, setPorQue] = React.useState(false)
  const duas = !!alternativas && alternativas.length > 0 && Math.max(...alternativas.map((a) => a.length)) <= 28
  return (
    <section id={id} data-questao={n} className="grid scroll-mt-6 grid-cols-[32px_minmax(0,1fr)] gap-x-3 border-t-2 border-borda py-6 first-of-type:border-t-0 first-of-type:pt-0">
      <span className={cn('font-bold tabular-nums text-tinta', ampliada ? 'text-[21px]' : 'text-[19px]')}>{n}</span>
      <div className="grid min-w-0 gap-3">
        <div className="[overflow-wrap:anywhere]">{enunciado}</div>
        {pergunta && <p className="font-bold">{pergunta}</p>}
        {dados && <p className="text-[15px] leading-[22px] text-apoio">{dados}</p>}
        {alternativas && alternativas.length > 0 && (
          <ol className={cn('grid gap-2', duas && 'sm:grid-cols-2')}>
            {alternativas.map((a, i) => {
              const ok = gabarito && certa === i
              return (
                <li key={i} className={cn('flex min-h-11 items-center gap-3 rounded-[12px] border-2 px-2 py-1.5',
                  ok ? 'border-verde-borda bg-verde-claro text-verde-texto' : 'border-borda')}>
                  <span className={cn('grid size-7 shrink-0 place-items-center rounded-full border-2 text-[14px] font-bold',
                    ok ? 'border-verde-degrau bg-verde text-sobre-cor' : 'border-borda-forte text-apoio')}>{LETRAS[i]}</span>
                  <span className={cn('min-w-0 flex-1 leading-[1.4]', ok && 'font-bold')}>{a}</span>
                  {ok && <Check aria-label="Certa" className="size-5 shrink-0" strokeWidth={3} />}
                </li>
              )
            })}
          </ol>
        )}
        {linhasResposta && linhasResposta > 0 && (
          <div aria-label="Espaço para a resposta" className="grid">
            {Array.from({ length: linhasResposta }, (_, i) => <span key={i} className="h-9 border-b-2 border-dashed border-borda" />)}
          </div>
        )}
        {gabarito && resolucao && (
          <div>
            <button type="button" aria-expanded={porQue} onClick={() => setPorQue((v) => !v)}
              className="t-selo inline-flex items-center gap-1 rounded-[8px] px-1 py-0.5 text-azul-texto hover:bg-fundo-suave">
              Por quê <ChevronDown aria-hidden className={cn('size-4 transition-transform', porQue && 'rotate-180')} strokeWidth={3} />
            </button>
            {porQue && <div className="mt-2 rounded-[12px] bg-fundo-suave px-4 py-3 text-[15px] leading-[22px] text-apoio">{resolucao}</div>}
          </div>
        )}
        {meta && meta.length > 0 && <p className="text-[13px] font-bold uppercase leading-4 tracking-[.04em] text-sutil">{meta.filter(Boolean).join(' · ')}</p>}
      </div>
    </section>
  )
}

/* ── O sumário ────────────────────────────────────────────────────────────────────────────────────────── */

export function Sumario({ titulo, itens, grade, rolagem }: {
  titulo: string
  itens: { id: string; rotulo: string }[]
  /** a prova: as questões em grade de bolinhas */
  grade?: boolean
  /** quem rola (a mesa): para acender a seção visível */
  rolagem: React.RefObject<HTMLElement | null>
}) {
  const [ativo, setAtivo] = React.useState(itens[0]?.id)
  /** o item clicado manda até a rolagem suave parar (sem isso, a regra do fim acendia o último) */
  const clicado = React.useRef<{ id: string; ate: number } | null>(null)
  React.useEffect(() => {
    const raiz = rolagem.current
    if (!raiz) return
    let parou: number | undefined
    const medir = () => {
      const c = clicado.current
      if (c) {
        window.clearTimeout(parou)
        parou = window.setTimeout(() => { clicado.current = null }, 160)
        if (Date.now() < c.ate) { setAtivo(c.id); return }
        clicado.current = null
      }
      const topo = raiz.getBoundingClientRect().top + 96
      let atual = itens[0]?.id
      for (const i of itens) {
        const el = document.getElementById(i.id)
        if (el && el.getBoundingClientRect().top <= topo) atual = i.id
      }
      // no fim da rolagem, a última seção acende
      if (raiz.scrollTop + raiz.clientHeight >= raiz.scrollHeight - 4) atual = itens[itens.length - 1]?.id
      setAtivo(atual)
    }
    medir()
    raiz.addEventListener('scroll', medir, { passive: true })
    return () => { raiz.removeEventListener('scroll', medir); window.clearTimeout(parou) }
  }, [rolagem, itens])
  const ir = (id: string) => {
    clicado.current = { id, ate: Date.now() + 1500 }
    document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    setAtivo(id)
  }
  return (
    <nav aria-label={titulo} className="rounded-[16px] border-2 border-borda bg-white p-3">
      <p className="t-selo px-1 pb-2 text-sutil">{titulo}</p>
      {grade ? (
        <ol className="grid grid-cols-5 gap-1.5">
          {itens.map((i) => (
            <li key={i.id}>
              <button type="button" onClick={() => ir(i.id)} aria-current={ativo === i.id ? 'true' : undefined} aria-label={`Questão ${i.rotulo}`}
                className={cn('grid size-8 place-items-center rounded-full border-2 text-[14px] font-bold tabular-nums transition-colors',
                  ativo === i.id ? 'border-azul-borda bg-azul-claro text-azul-texto' : 'border-borda text-apoio hover:bg-fundo-suave')}>
                {i.rotulo}
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="grid gap-1">
          {itens.map((i) => (
            <li key={i.id}>
              <button type="button" onClick={() => ir(i.id)} aria-current={ativo === i.id ? 'true' : undefined}
                className={cn('flex min-h-9 w-full items-center rounded-[10px] px-2 py-1.5 text-left text-[15px] font-bold leading-snug transition-colors',
                  ativo === i.id ? 'bg-azul-claro text-azul-texto' : 'text-apoio hover:bg-fundo-suave hover:text-tinta')}>
                {i.rotulo}
              </button>
            </li>
          ))}
        </ol>
      )}
    </nav>
  )
}

/* ── Plano: resumo, linha do tempo e blocos fixos ─────────────────────────────────────────────────────── */

export function CartoesResumo({ cartoes }: { cartoes: { titulo: string; itens: React.ReactNode[] }[] }) {
  return (
    <div className="mb-8 grid gap-3 md:grid-cols-2">
      {cartoes.map((c) => (
        <section key={c.titulo} className="rounded-[12px] border-2 border-borda bg-fundo-suave px-4 py-3">
          <h3 className="t-selo mb-2 text-sutil">{c.titulo} <span className="tabular-nums">({c.itens.length})</span></h3>
          <ul className="grid gap-1.5 text-[15px] leading-[22px] text-tinta">
            {c.itens.map((i, k) => <li key={k} className="flex gap-2"><span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-sutil" />{i}</li>)}
          </ul>
        </section>
      ))}
    </div>
  )
}

export type Momento = { minutos?: string; nome: string; texto?: React.ReactNode; pagina?: number; pratique?: boolean }

export function LinhaDoTempo({ aulas, familia = 'turquesa' }: {
  aulas: { id: string; titulo: string; duracao?: string; momentos: Momento[] }[]
  familia?: Familia
}) {
  let n = 0
  return (
    <div className="grid gap-8" style={estiloFamilia(familia)}>
      {aulas.map((a) => (
        <section key={a.id} id={a.id} className="scroll-mt-6">
          <h3 className="t-selo mb-3 text-tinta">{a.titulo}{a.duracao && <span className="text-sutil"> · {a.duracao}</span>}</h3>
          <ol className="relative">
            {/* o trilho */}
            <span aria-hidden className="absolute bottom-3 left-[75px] top-3 w-[2px] bg-borda max-sm:left-[59px]" />
            {a.momentos.map((m, k) => {
              n++
              return (
                <li key={k} className="relative grid grid-cols-[64px_24px_minmax(0,1fr)] gap-x-3 pb-5 last:pb-0 max-sm:grid-cols-[48px_24px_minmax(0,1fr)]">
                  <span className="pt-0.5 text-right text-[14px] font-bold leading-6 tabular-nums text-sutil">{m.minutos ?? ''}</span>
                  <span aria-hidden className="relative z-[1] mt-1.5 size-3.5 justify-self-center rounded-full border-[3px] border-(--face) bg-white" />
                  {m.pratique ? (
                    <div className="rounded-[12px] border-2 border-(--borda) bg-(--claro) px-4 py-3">
                      <p className="t-selo text-(--texto)">Pratique</p>
                      <p className="mt-0.5 flex items-baseline justify-between gap-3">
                        <span className="font-bold text-tinta"><span className="mr-2 tabular-nums text-sutil">{n}</span>{m.nome}</span>
                        {m.pagina && <span className="shrink-0 text-[13px] font-bold text-sutil">p. {m.pagina}</span>}
                      </p>
                      {m.texto && <div className="mt-1 text-[16px] leading-[1.55] text-tinta">{m.texto}</div>}
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <p className="flex items-baseline justify-between gap-3">
                        <span className="font-bold text-tinta"><span className="mr-2 tabular-nums text-sutil">{n}</span>{m.nome}</span>
                        {m.pagina && <span className="shrink-0 text-[13px] font-bold text-sutil">p. {m.pagina}</span>}
                      </p>
                      {m.texto && <div className="mt-0.5 text-[16px] leading-[1.55] text-apoio">{m.texto}</div>}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}

/** Para casa · Recursos · Como avaliar: o rótulo à esquerda, o texto à direita. */
export function BlocoFixo({ rotulo, children, id }: { rotulo: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="grid scroll-mt-6 gap-x-4 gap-y-1 border-t-2 border-borda py-4 first-of-type:mt-8 sm:grid-cols-[132px_minmax(0,1fr)]">
      <h3 className="t-selo pt-1 text-sutil">{rotulo}</h3>
      <div className="text-[16px] leading-[1.55] text-tinta">{children}</div>
    </section>
  )
}

/* ── Sequência e rubrica ──────────────────────────────────────────────────────────────────────────────── */

export function TabelaSequencia({ colunas, grupos }: {
  colunas: { nome: string; largura?: string }[]
  grupos: { titulo: string; linhas: { celulas: React.ReactNode[]; selo?: React.ReactNode }[] }[]
}) {
  // o selo vai na coluna que estica (a do conteúdo)
  const daCor = Math.max(0, colunas.findIndex((c) => !c.largura))
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[560px] table-fixed border-collapse text-[15px] leading-5">
        <colgroup>{colunas.map((c) => <col key={c.nome} style={c.largura ? { width: c.largura } : undefined} />)}</colgroup>
        <thead>
          <tr>{colunas.map((c) => <th key={c.nome} scope="col" className="t-selo h-8 px-2 text-left align-bottom text-sutil first:pl-0">{c.nome}</th>)}</tr>
        </thead>
        {grupos.map((g) => (
          <tbody key={g.titulo}>
            <tr><th colSpan={colunas.length} scope="colgroup" className="t-selo h-8 rounded-[8px] bg-fundo-suave px-2 text-left text-apoio">{g.titulo}</th></tr>
            {g.linhas.map((l, k) => (
              <tr key={k} className="border-b-2 border-borda last:border-b-0">
                {l.celulas.map((c, i) => (
                  <td key={i} className={cn('px-2 py-2.5 align-top first:pl-0', i === daCor ? 'font-medium text-tinta' : 'text-apoio tabular-nums')}>
                    {c}{i === daCor && l.selo && <span className="ml-2 inline-flex align-middle">{l.selo}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}

export function TabelaRubrica({ enunciado, niveis, criterios, total, nota }: {
  enunciado?: React.ReactNode
  niveis: { nome: string; pontos: string }[]
  criterios: { nome: string; descricoes: string[] }[]
  /** o total de cada nível ("10,0", "6,0", "2,0") */
  total: string[]
  /** "Quem corrige e escreve a devolutiva é a professora." */
  nota?: string
}) {
  return (
    <div className="grid gap-5">
      {enunciado && <div className="rounded-[12px] bg-fundo-suave px-4 py-3 text-[16px] leading-[1.55] text-tinta">{enunciado}</div>}
      {/* computador: a tabela com a primeira coluna de 180 */}
      <div className="overflow-hidden rounded-[12px] border-2 border-borda max-sm:hidden">
        <table className="w-full table-fixed border-collapse text-[15px] leading-[21px]">
          <colgroup><col style={{ width: 180 }} />{niveis.map((n) => <col key={n.nome} />)}</colgroup>
          <thead className="bg-fundo-suave">
            <tr>
              <th scope="col" className="t-selo h-10 px-3 text-left text-sutil">Critério</th>
              {niveis.map((n) => <th key={n.nome} scope="col" className="t-selo h-10 border-l-2 border-borda px-3 text-left text-sutil">{n.nome} · <span className="tabular-nums text-tinta">{n.pontos}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {criterios.map((c) => (
              <tr key={c.nome} className="border-t-2 border-borda">
                <th scope="row" className="px-3 py-3 text-left align-top font-bold text-tinta">{c.nome}</th>
                {c.descricoes.map((d, i) => <td key={i} className="border-l-2 border-borda px-3 py-3 align-top font-medium text-apoio">{d}</td>)}
              </tr>
            ))}
            <tr className="border-t-2 border-borda bg-fundo-suave">
              <th scope="row" className="t-selo px-3 py-2.5 text-left text-tinta">Total</th>
              {total.map((t, i) => <td key={i} className="border-l-2 border-borda px-3 py-2.5 text-[17px] font-bold tabular-nums text-tinta">{t}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
      {/* celular: um cartão por critério */}
      <div className="grid gap-3 sm:hidden">
        {criterios.map((c) => (
          <section key={c.nome} className="rounded-[12px] border-2 border-borda p-3">
            <h3 className="t-cartao text-tinta">{c.nome}</h3>
            <dl className="mt-2 grid gap-2">
              {niveis.map((n, i) => (
                <div key={n.nome}>
                  <dt className="t-selo text-sutil">{n.nome} · {n.pontos}</dt>
                  <dd className="text-[15px] leading-[21px] text-apoio">{c.descricoes[i]}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="t-selo text-tinta">Total: {niveis.map((n, i) => `${n.nome} ${total[i]}`).join(' · ')}</p>
      </div>
      {nota && <p className="t-apoio">{nota}</p>}
    </div>
  )
}

/* ── Apresentação ─────────────────────────────────────────────────────────────────────────────────────── */

type Slide = { n: number; titulo: string; topicos: string[]; notas?: string }

function CorpoSlide({ s, grande }: { s: Slide; grande?: boolean }) {
  const capa = s.n === 1
  return (
    <div className={cn('flex aspect-video w-full flex-col overflow-hidden rounded-[12px] border-2',
      // a capa tem cor própria, que não inverte no escuro (bg-tinta virava um bloco quase branco)
      capa ? 'border-capa-borda bg-capa text-capa-texto' : 'border-borda bg-white text-tinta', grande ? 'gap-5 p-10' : 'gap-2 p-4')}>
      {capa ? (
        <div className="flex flex-1 flex-col justify-end">
          <p className={cn('font-bold leading-tight', grande ? 'text-[40px]' : 'text-[18px]')}>{s.titulo}</p>
          {s.topicos[0] && <p className={cn('mt-1 font-medium opacity-80', grande ? 'text-[20px]' : 'text-[13px]')}>{s.topicos[0]}</p>}
        </div>
      ) : (
        <>
          <p className={cn('font-bold leading-tight', grande ? 'text-[32px]' : 'text-[15px]')}>{s.titulo}</p>
          <ul className={cn('grid', grande ? 'gap-3 text-[22px]' : 'gap-1 text-[12px]')}>
            {s.topicos.slice(0, grande ? 6 : 3).map((t) => (
              <li key={t} className="flex gap-2 leading-snug"><span aria-hidden className={cn('shrink-0 rounded-full bg-laranja', grande ? 'mt-3 size-2.5' : 'mt-1.5 size-1.5')} />{t}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export function GradeSlides({ slides, aoAbrir }: { slides: Slide[]; aoAbrir: (n: number) => void }) {
  return (
    <ol className="grid w-full max-w-[1080px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {slides.map((s) => (
        <li key={s.n}>
          <button type="button" onClick={() => aoAbrir(s.n)} aria-label={`Slide ${s.n}: ${s.titulo}`}
            className="block w-full rounded-[14px] text-left transition-transform duration-150 hover:-translate-y-0.5">
            <CorpoSlide s={s} />
          </button>
          <p className="mt-1.5 text-[13px] font-bold tabular-nums text-sutil">{s.n}</p>
        </li>
      ))}
    </ol>
  )
}

export function SlideAberto({ slides, atual, aoMudar, aoFechar, telaCheia }: {
  slides: Slide[]
  atual: number
  aoMudar: (n: number) => void
  aoFechar: () => void
  /** a tela de foco do APRESENTAR, sem a casca */
  telaCheia?: boolean
}) {
  const s = slides.find((x) => x.n === atual) ?? slides[0]
  const i = slides.indexOf(s)
  const anterior = () => { if (i > 0) aoMudar(slides[i - 1].n) }
  const proximo = () => { if (i < slides.length - 1) aoMudar(slides[i + 1].n) }
  React.useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') anterior()
      else if (e.key === 'ArrowRight') proximo()
      else if (e.key === 'Escape' && telaCheia) aoFechar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })
  const controles = (
    <div className="flex items-center justify-center gap-3">
      <BotaoIcone variante="secundario" rotulo="Slide anterior" onClick={anterior} disabled={i === 0}><ChevronLeft strokeWidth={2.5} /></BotaoIcone>
      <span className="min-w-16 text-center text-[15px] font-bold tabular-nums text-apoio">{i + 1} de {slides.length}</span>
      <BotaoIcone variante="secundario" rotulo="Próximo slide" onClick={proximo} disabled={i === slides.length - 1}><ChevronRight strokeWidth={2.5} /></BotaoIcone>
    </div>
  )
  if (telaCheia) {
    return (
      <div role="dialog" aria-modal="true" aria-label={`Apresentação: ${s.titulo}`} className="fixed inset-0 z-50 flex flex-col bg-fundo">
        <div className="flex h-14 shrink-0 items-center justify-end px-4">
          <BotaoIcone rotulo="Sair da apresentação" onClick={aoFechar}><X strokeWidth={2.5} /></BotaoIcone>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center px-6">
          <div className="w-full max-w-[min(1200px,calc((100svh-160px)*16/9))]"><CorpoSlide s={s} grande /></div>
        </div>
        <div className="shrink-0 py-4">{controles}</div>
      </div>
    )
  }
  return (
    <Dialogo aberto aoMudar={(v) => { if (!v) aoFechar() }} titulo={`Slide ${s.n} · ${s.titulo}`} largura={960}>
      <div className="grid gap-4">
        <CorpoSlide s={s} grande />
        {controles}
        {s.notas && (
          <section className="rounded-[12px] bg-fundo-suave px-4 py-3">
            <h3 className="t-selo text-sutil">Notas do professor</h3>
            <p className="mt-1 text-[16px] leading-[1.55] text-tinta">{s.notas}</p>
          </section>
        )}
      </div>
    </Dialogo>
  )
}

/* ── Mapa mental ──────────────────────────────────────────────────────────────────────────────────────── */

const CORES_RAMOS: Familia[] = ['azul', 'verde', 'roxo', 'amarelo', 'turquesa', 'rosa', 'anil', 'lima']

/** Um ramo: o cartão na cor da família, as folhas em pílulas, e as linhas de 2 px que o ligam à espinha (a 30 px do
    topo de cada cartão; cada um desce a espinha até o próximo). */
function Ramo({ r, f, lado, ultimo, primeiro }: { r: { nome: string; folhas: string[] }; f: Familia; lado: 'esq' | 'dir'; ultimo: boolean; primeiro?: 'pilula' }) {
  const x = lado === 'esq' ? '-right-[26px]' : '-left-[26px]'
  return (
    <div style={estiloFamilia(f)} className="relative min-w-0 rounded-[12px] border-2 border-(--borda) bg-(--claro) px-3 py-2.5">
      <span aria-hidden className={cn('absolute top-[30px] h-[2px] w-6 bg-borda-forte', lado === 'esq' ? '-right-[26px]' : '-left-[26px]')} />
      {!ultimo && <span aria-hidden className={cn('absolute top-[30px] h-[calc(100%+16px)] w-[2px] bg-borda-forte', x)} />}
      {primeiro === 'pilula' && <span aria-hidden className={cn('absolute -top-[18px] h-[50px] w-[2px] bg-borda-forte', x)} />}
      <p className="t-cartao text-(--texto)">{r.nome}</p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {r.folhas.map((x) => <li key={x} className="rounded-full border-2 border-borda bg-white px-2.5 py-0.5 text-[14px] font-medium leading-5 text-tinta">{x}</li>)}
      </ul>
    </div>
  )
}

export function MapaMental({ centro, ramos }: { centro: string; ramos: { nome: string; folhas: string[] }[] }) {
  const metade = Math.ceil(ramos.length / 2)
  const esq = ramos.slice(0, metade)
  const dir = ramos.slice(metade)
  const pilula = <div className="rounded-full bg-laranja px-5 py-3 text-center text-[19px] font-bold leading-6 text-sobre-cor">{centro}</div>
  const lado = (lista: typeof ramos, l: 'esq' | 'dir', base: number) => (
    <div className={cn('flex flex-col gap-4', l === 'esq' ? 'pr-[26px]' : 'pl-[26px]')}>
      {lista.map((r, i) => <Ramo key={r.nome} r={r} f={CORES_RAMOS[(base + i) % CORES_RAMOS.length]} lado={l} ultimo={i === lista.length - 1} />)}
    </div>
  )
  return (
    <figure aria-label={`Mapa mental: ${centro}`} className="w-full">
      {/* computador: o centro no meio, os ramos dos dois lados */}
      <div className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center md:grid">
        {lado(esq, 'esq', 0)}
        <div className="flex items-center">
          <span aria-hidden className="h-[2px] w-5 bg-borda-forte" />
          {pilula}
          {dir.length > 0 && <span aria-hidden className="h-[2px] w-5 bg-borda-forte" />}
        </div>
        {dir.length > 0 ? lado(dir, 'dir', metade) : <span />}
      </div>
      {/* celular: a árvore vertical */}
      <div className="grid gap-4 md:hidden">
        <div className="justify-self-start">{pilula}</div>
        <div className="ml-6 flex flex-col gap-4 pl-[26px]">
          {ramos.map((r, i) => <Ramo key={r.nome} r={r} f={CORES_RAMOS[i % CORES_RAMOS.length]} lado="dir" ultimo={i === ramos.length - 1} primeiro={i === 0 ? 'pilula' : undefined} />)}
        </div>
      </div>
    </figure>
  )
}

/* ── Resultados ───────────────────────────────────────────────────────────────────────────────────────── */

export function FaixaResultados({ itens }: { itens: { rotulo: string; valor: string; apoio?: string }[] }) {
  // colunas iguais que enchem a linha (5 a 1080; 2 por linha no celular, a última na linha inteira quando sobra)
  return (
    <dl className="grid grid-cols-2 gap-3 md:[grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
      {itens.map((i, k) => (
        <div key={i.rotulo} className={cn('flex h-[104px] min-w-0 flex-col rounded-[12px] border-2 border-borda bg-white px-4 py-3',
          k === itens.length - 1 && itens.length % 2 === 1 && 'max-md:col-span-2')}>
          <dt className="t-selo truncate text-sutil">{i.rotulo}</dt>
          <dd className="t-numero mt-1.5 text-tinta">{i.valor}</dd>
          <dd className="mt-auto truncate text-[14px] font-medium leading-[18px] text-sutil">{i.apoio ?? ''}</dd>
        </div>
      ))}
    </dl>
  )
}

/* ── O cartão do documento na conversa ────────────────────────────────────────────────────────────────── */

export function CartaoDocumento({ icone, tipo, titulo, linha, selo, para, aoEditar }: {
  icone: React.ReactNode
  /** "PROVA · 2ºB · QUÍMICA" */
  tipo: string
  titulo: string
  /** "10 questões · 50 min · Química 2, cap. 7" */
  linha: string
  selo?: React.ReactNode
  para: string
  aoEditar?: () => void
}) {
  return (
    <div className="relative w-full max-w-[560px]">
      <Cartao para={para} aria-label={`Abrir ${titulo}`} className="flex gap-3 px-4 pb-3 pt-4">
        <span className="grid size-10 shrink-0 place-items-center [&>svg]:size-10">{icone}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 items-center justify-between gap-2 max-sm:flex-col max-sm:items-start">
            <span className="t-selo min-w-0 max-w-full truncate text-sutil">{tipo}</span>
            {selo && <span className="flex shrink-0 items-center">{selo}</span>}
          </span>
          <span className="t-cartao text-tinta">{titulo}</span>
          <span className="t-apoio truncate">{linha}</span>
          {/* ABRIR e EDITAR O PEDIDO na mesma linha de 32 px */}
          <span className="t-rotulo mt-2 inline-flex h-8 items-center gap-1 text-[14px] text-azul-texto">Abrir <ArrowRight aria-hidden className="size-4" strokeWidth={3} /></span>
        </span>
      </Cartao>
      {aoEditar && (
        <Botao variante="fantasma" tamanho="p" icone={<Pencil strokeWidth={2.5} />} onClick={aoEditar}
          className="absolute bottom-[26px] right-3" aria-label="Editar o pedido">Editar o pedido</Botao>
      )}
    </div>
  )
}
