import * as React from 'react'
import { Info } from 'lucide-react'
import { AvatarIA } from './onca/AvatarIA'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import { Aviso } from './aviso'
import { Botao } from './botao'
import { LadrilhoIcone } from './ladrilho'
import { BarraProgresso } from './progresso'
import { familia as estiloFamilia, type Familia } from './familia'
import type { SituacaoEscola } from '@/dados/rede'

/* OS GRÁFICOS PEQUENOS (13ª rodada, 04/10/2026; plano de painéis e introdução, seções 1.1 e 6.1). Os mesmos desenhos
   no painel, na conversa do Analista e na introdução.
   · CartaoNumero: o cartão de leitura de um número (rótulo, valor, um visual, uma linha de contexto, PERGUNTAR).
   · BarrasPequenas (linhas ou colunas) · LinhaCurta · TabelaCurta · BarraPacote · BarraEmpilhada · PontosSituacao.
   COR SÓ POR CATEGORIA (a matéria, o pacote, os alunos): nenhuma seta, nenhum vermelho ou verde dizendo "ruim" ou
   "bom" (D81, até os limiares fecharem). Números em tabular-nums. Grupo pequeno: "menos de 5". */

const numero = (v: number) => v.toLocaleString('pt-BR')

/* ── O cartão de um número ──────────────────────────────────────────────────────────────────────────────── */

export function CartaoNumero({ icone, familia, rotulo, valor, contexto, children, perguntar, acao, className }: {
  icone: React.ReactNode
  familia: Familia
  rotulo: string
  valor: React.ReactNode
  contexto?: React.ReactNode
  /** o visual pequeno */
  children?: React.ReactNode
  /** o PERGUNTAR do pé: manda a pergunta pronta ao Analista */
  perguntar?: () => void
  /** uma ação fantasma à esquerda do pé (VER NA IA, VER AS ESCOLAS) */
  acao?: React.ReactNode
  className?: string
}) {
  return (
    <section aria-label={rotulo} className={cn('flex min-w-0 flex-col gap-2 rounded-[16px] border-2 border-borda bg-white p-4', className)}>
      <div className="flex min-w-0 items-center gap-2">
        <LadrilhoIcone familia={familia} tamanho={32} icone={icone} className="text-(--texto) [&_svg]:stroke-[2.5]" />
        <h3 className="t-selo min-w-0 truncate text-sutil">{rotulo}</h3>
      </div>
      <div className="t-numero-g text-tinta">{valor}</div>
      {children && <div className="min-w-0">{children}</div>}
      {contexto && <p className="t-apoio">{contexto}</p>}
      {(acao || perguntar) && (
        <div className="-mx-2 -mb-1 mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="min-w-0">{acao}</span>
          {perguntar && <Botao variante="fantasma" tamanho="p" onClick={perguntar}>Perguntar</Botao>}
        </div>
      )}
    </section>
  )
}

/* ── Barras ─────────────────────────────────────────────────────────────────────────────────────────────── */

export type ItemBarra = { rotulo: string; valor: number | null; texto?: string }

export function BarrasPequenas({ itens, max = 100, familia = 'azul', orientacao = 'linhas', vazio = 'fica de fora', rotulo }: {
  itens: ItemBarra[]
  max?: number
  familia?: Familia
  orientacao?: 'linhas' | 'colunas'
  /** o que um null diz */
  vazio?: string
  rotulo: string
}) {
  const fracao = (v: number) => `${Math.max(2, Math.min(100, (v / Math.max(1, max)) * 100))}%`
  if (orientacao === 'colunas') {
    const fora = itens.filter((i) => i.valor === null)
    return (
      <figure aria-label={rotulo} style={estiloFamilia(familia)} className="grid gap-1">
        <ul className="flex h-[96px] items-end gap-1.5">
          {itens.map((i) => (
            <li key={i.rotulo} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${i.rotulo}: ${i.valor === null ? vazio : i.texto ?? numero(i.valor)}`}>
              <span className="text-[14px] font-bold leading-4 tabular-nums text-tinta">{i.valor === null ? '—' : i.texto ?? numero(i.valor)}</span>
              {i.valor === null
                ? <span aria-hidden className="block h-3 w-full max-w-7 rounded-t-[6px] border-2 border-dashed border-borda" />
                : <span aria-hidden className="block w-full max-w-7 rounded-t-[6px] bg-(--face)" style={{ height: fracao(i.valor) }} />}
              <span className="sr-only">{i.rotulo}: {i.valor === null ? vazio : i.texto ?? numero(i.valor)}</span>
            </li>
          ))}
        </ul>
        <div aria-hidden className="flex gap-1.5 border-t-2 border-borda pt-1">
          {itens.map((i) => <span key={i.rotulo} className="min-w-0 flex-1 break-words text-center text-[14px] font-bold leading-4 text-sutil">{i.rotulo}</span>)}
        </div>
        {fora.length > 0 && <p className="t-apoio">{fora.map((i) => i.rotulo).join(', ')} {vazio}.</p>}
      </figure>
    )
  }
  return (
    <figure aria-label={rotulo} style={estiloFamilia(familia)}>
      {/* a trilha nunca fica abaixo de 96 px: no estreito (celular), quem cede é o rótulo, que quebra em 2 linhas */}
      <ul className="grid gap-1.5">
        {itens.map((i) => (
          <li key={i.rotulo} className="grid grid-cols-[minmax(0,10.5rem)_minmax(96px,1fr)_auto] items-center gap-2.5">
            <span className="line-clamp-2 break-words text-[15px] font-bold leading-[18px] text-tinta" title={i.rotulo}>{i.rotulo}</span>
            <span aria-hidden className="relative h-3 overflow-hidden rounded-full bg-borda">
              {i.valor !== null && <span className="absolute inset-y-0 left-0 rounded-full bg-(--face)" style={{ width: fracao(i.valor) }} />}
            </span>
            <span className={cn('min-w-10 text-right text-[15px] leading-5 tabular-nums', i.valor === null ? 'font-medium text-sutil' : 'font-bold text-tinta')}>
              {i.valor === null ? vazio : i.texto ?? numero(i.valor)}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

/* ── Linha curta: até 3 séries × 6 pontos ───────────────────────────────────────────────────────────────── */

const FAMILIAS_DA_LINHA: Familia[] = ['azul', 'turquesa', 'roxo']

export function LinhaCurta({ series, unidade = '', rotulo }: {
  series: { nome: string; pontos: { rotulo: string; valor: number }[] }[]
  unidade?: string
  rotulo: string
}) {
  const s = series.slice(0, 3).map((x) => ({ ...x, pontos: x.pontos.slice(0, 6) }))
  const todos = s.flatMap((x) => x.pontos.map((p) => p.valor))
  const min = Math.min(...todos)
  const max = Math.max(...todos)
  const folga = Math.max(1, (max - min) * 0.15)
  const lo = min - folga
  const hi = max + folga
  const n = Math.max(1, ...s.map((x) => x.pontos.length))
  const X = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100)
  const Y = (v: number) => 100 - ((v - lo) / Math.max(0.0001, hi - lo)) * 100
  const rotulos = s[0]?.pontos.map((p) => p.rotulo) ?? []
  return (
    <figure aria-label={rotulo} className="grid gap-1.5">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-20 w-full overflow-visible" aria-hidden>
        {[0, 50, 100].map((y) => <line key={y} x1={0} x2={100} y1={y} y2={y} stroke="var(--color-borda)" strokeWidth={2} vectorEffect="non-scaling-stroke" />)}
        {s.map((x, k) => (
          <polyline key={x.nome} fill="none" style={{ stroke: `var(--color-${FAMILIAS_DA_LINHA[k]})` }} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round"
            vectorEffect="non-scaling-stroke" points={x.pontos.map((p, i) => `${X(i)},${Y(p.valor)}`).join(' ')} />
        ))}
      </svg>
      <div aria-hidden className="flex justify-between text-[14px] font-bold leading-4 text-sutil">
        {rotulos.map((r) => <span key={r}>{r}</span>)}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {s.map((x, k) => (
          <li key={x.nome} className="flex items-center gap-1.5 text-[15px] font-medium text-tinta">
            <span aria-hidden className="size-3 rounded-full" style={{ background: `var(--color-${FAMILIAS_DA_LINHA[k]})` }} />
            {x.nome}
            <span className="sr-only">: {x.pontos.map((p) => `${p.rotulo} ${numero(p.valor)}${unidade}`).join(', ')}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

/* ── Tabela curta ───────────────────────────────────────────────────────────────────────────────────────── */

export function TabelaCurta({ colunas, linhas, rotulo }: {
  colunas: string[]
  /** null = "menos de 5"; até 7 linhas */
  linhas: (string | number | null)[][]
  rotulo: string
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full border-collapse text-[15px] leading-5 tabular-nums">
        <caption className="sr-only">{rotulo}</caption>
        <thead>
          <tr>
            {colunas.map((c, i) => (
              <th key={c} scope="col" className={cn('t-selo px-2 pb-2 align-bottom text-sutil first:pl-0 last:pr-0', i === 0 ? 'text-left' : 'text-right')}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, j) => (
            <tr key={j} className="h-10 border-t-2 border-borda">
              {l.map((v, i) => (
                <td key={i} className={cn('px-2 first:pl-0 last:pr-0', i === 0 ? 'text-left font-bold text-tinta' : 'text-right',
                  v === null ? 'font-medium text-sutil' : i > 0 && 'font-bold text-tinta')}>
                  {v === null ? 'menos de 5' : typeof v === 'number' ? numero(v) : v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── O pacote do mês: a barra turquesa com a marca dos 80% (D39) ────────────────────────────────────────── */

export function BarraPacote({ usado, projecao, rotulo }: { usado: number; projecao?: number; rotulo: string }) {
  const proj = projecao === undefined ? undefined : Math.min(100, Math.max(0, projecao))
  return (
    <div className="grid gap-2">
      <div className="relative">
        <BarraProgresso familia="turquesa" valor={Math.min(100, usado)} max={100} rotulo={rotulo} />
        {proj !== undefined && proj > usado && (
          <span aria-hidden title={`Nesse ritmo, perto de ${proj}%`}
            className="absolute -bottom-1 -top-1 w-0 border-l-2 border-dashed border-turquesa-texto" style={{ left: `${proj}%` }} />
        )}
        <span aria-hidden className="absolute -bottom-1.5 -top-1.5 left-[80%] w-[2px] -translate-x-1/2 rounded-full bg-apoio" />
        <span aria-hidden className="absolute left-[80%] top-full mt-1.5 -translate-x-1/2 text-[13px] font-bold leading-4 tabular-nums text-apoio">80%</span>
        {proj !== undefined && <span className="sr-only">Nesse ritmo, o mês fecha perto de {proj}%.</span>}
      </div>
      <div className="h-4" aria-hidden />
      {usado >= 80 && (
        <Aviso tom="info">Chegou a 80% do pacote do mês. Depois de 100%, o Tutor desacelera, nunca no meio de uma aula.</Aviso>
      )}
    </div>
  )
}

/* ── Barra empilhada ────────────────────────────────────────────────────────────────────────────────────── */

export function BarraEmpilhada({ partes, rotulo }: { partes: { rotulo: string; valor: number; familia: Familia }[]; rotulo: string }) {
  const total = Math.max(1, partes.reduce((s, p) => s + p.valor, 0))
  return (
    <figure aria-label={`${rotulo}: ${partes.map((p) => `${numero(p.valor)} ${p.rotulo}`).join(', ')}`} className="grid gap-2">
      <div aria-hidden className="flex h-4 gap-[2px] overflow-hidden rounded-full bg-borda">
        {partes.map((p) => p.valor > 0 && (
          <span key={p.rotulo} className="h-full bg-(--face)" style={{ ...estiloFamilia(p.familia), width: `${(p.valor / total) * 100}%` }} />
        ))}
      </div>
      <ul aria-hidden className="flex flex-wrap gap-x-4 gap-y-1">
        {partes.map((p) => (
          <li key={p.rotulo} className="flex items-center gap-1.5 text-[15px] font-medium leading-5 text-apoio">
            <span className="size-3 rounded-full bg-(--face)" style={estiloFamilia(p.familia)} />
            <b className="font-bold tabular-nums text-tinta">{numero(p.valor)}</b> {p.rotulo}
          </li>
        ))}
      </ul>
    </figure>
  )
}

/* ── A situação das escolas, em pontos ──────────────────────────────────────────────────────────────────── */

const NOME_SITUACAO: Record<SituacaoEscola, string> = { 'em-uso': 'Em uso', montando: 'Montando', convite: 'Convite enviado', nova: 'Sem convite' }
const PONTO_SITUACAO: Record<SituacaoEscola, string> = {
  'em-uso': 'border-verde-degrau bg-verde',
  montando: 'border-amarelo-degrau bg-[linear-gradient(90deg,var(--color-amarelo)_50%,var(--color-white)_50%)]',
  convite: 'border-azul bg-white',
  nova: 'border-borda bg-fundo-suave',
}

export function PontosSituacao({ situacoes, nomes }: {
  situacoes: SituacaoEscola[]
  /** os nomes das escolas, na mesma ordem (dica e leitor de tela) */
  nomes?: string[]
}) {
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {situacoes.map((s, i) => {
        const nome = nomes?.[i] ? `${nomes[i]}: ${NOME_SITUACAO[s]}` : NOME_SITUACAO[s]
        return (
          <li key={i} title={nome} className={cn('size-6 shrink-0 rounded-full border-2', PONTO_SITUACAO[s])}>
            <span className="sr-only">{nome}</span>
          </li>
        )
      })}
    </ul>
  )
}

/* ══ 14ª RODADA (05/10/2026): os gráficos do Painel (plano ux-composicao, 4.1 e 4.2) ══════════════════════════════
   · CartaoKPI: o cartão de número de 112 px (ícone, rótulo e "i" na linha de cima; o número em 36/700 com a tendência;
     o "quem" embaixo). Clicar escolhe o número (troca o gráfico de baixo); o escolhido fica com borda azul.
   · GraficoSemanas: o número escolhido por semana; a série atual cheia, a anterior tracejada em apagado; o valor no hover.
   · MapaDeCalor: série × disciplina numa escala só do azul (do claro à face); "menos de 5" hachurado; "—" fora.
   · TabelaBarras: a tabela com a barra atrás do número (linha de 40 px, cabeçalho em t-selo, rola por dentro).
   · Tendencia: o traço de 64 × 24.
   Cor por categoria, nunca por julgamento (D81): nada de verde "bom" ou vermelho "ruim". */

/** O traço da tendência (8 semanas), 64 × 24. */
export function Tendencia({ pontos, familia = 'azul', rotulo }: { pontos: number[]; familia?: Familia; rotulo: string }) {
  const p = pontos.filter((v) => Number.isFinite(v))
  if (p.length < 2) return null
  const min = Math.min(...p), max = Math.max(...p)
  const amp = Math.max(0.0001, max - min)
  const X = (i: number) => 2 + (i / (p.length - 1)) * 60
  const Y = (v: number) => 21 - ((v - min) / amp) * 18
  return (
    <svg viewBox="0 0 64 24" width={64} height={24} role="img" aria-label={rotulo} className="shrink-0 overflow-visible">
      <polyline fill="none" style={{ stroke: `var(--color-${familia})` }} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        points={p.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} />
      <circle cx={X(p.length - 1)} cy={Y(p[p.length - 1])} r={3} style={{ fill: `var(--color-${familia})` }} />
    </svg>
  )
}

function InfoKPI({ texto, rotulo }: { texto: string; rotulo: string }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button type="button" aria-label={`Como contamos: ${rotulo}`} onClick={(e) => e.stopPropagation()}
          className="grid size-6 shrink-0 place-items-center rounded-full text-sutil transition-colors hover:bg-fundo-suave hover:text-tinta">
          <Info className="size-4" strokeWidth={2.5} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content side="bottom" align="start" sideOffset={6} collisionPadding={12} onClick={(e) => e.stopPropagation()}
          className="z-50 max-w-[280px] rounded-[12px] border-2 border-borda bg-white px-3 py-2 text-[14px] font-medium leading-5 text-tinta shadow-[0_4px_0_0_var(--color-borda)]">
          {texto}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export function CartaoKPI({ icone, familia, rotulo, valor, apoio, variacao, tendencia, info, ativo, aoEscolher, perguntar, className }: {
  icone: React.ReactNode
  familia: Familia
  rotulo: string
  valor: React.ReactNode
  /** o "quem": "96% dos 612" */
  apoio?: React.ReactNode
  /** em texto neutro: "agosto: 65%" */
  variacao?: string
  tendencia?: number[]
  info?: string
  ativo?: boolean
  aoEscolher?: () => void
  perguntar?: () => void
  className?: string
}) {
  const clicavel = !!aoEscolher
  return (
    <section aria-label={rotulo} style={estiloFamilia(familia)}
      role={clicavel ? 'button' : undefined} tabIndex={clicavel ? 0 : undefined} aria-pressed={clicavel ? !!ativo : undefined}
      onClick={aoEscolher} onKeyDown={(e) => { if (clicavel && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); aoEscolher!() } }}
      className={cn('group/kpi flex h-[112px] min-w-0 flex-col justify-between overflow-hidden rounded-[16px] border-2 bg-white px-4 py-3 text-left transition-colors duration-150',
        ativo ? 'border-azul bg-azul-claro/40' : 'border-borda', clicavel && !ativo && 'cursor-pointer hover:border-borda-forte hover:bg-fundo-suave', className)}>
      {/* 1. o ícone, o rótulo (a linha toda) e o "i" */}
      <div className="flex min-w-0 items-center gap-1.5">
        <span aria-hidden style={estiloFamilia(familia)} className="grid size-6 shrink-0 place-items-center rounded-[8px] bg-(--claro) [&>*]:size-[18px] [&_svg]:size-[18px]">{icone}</span>
        <h3 className={cn('min-w-0 flex-1 truncate text-[13px] font-bold uppercase leading-4 tracking-[.02em]', ativo ? 'text-azul-texto' : 'text-sutil')}>{rotulo}</h3>
        {info && <InfoKPI texto={info} rotulo={rotulo} />}
      </div>
      {/* 2. o número e a tendência */}
      <div className="flex min-w-0 items-end justify-between gap-2">
        <div className="t-numero-g min-w-0 truncate text-tinta">{valor}</div>
        {tendencia && <Tendencia pontos={tendencia} familia={familia} rotulo={`${rotulo}, 8 semanas`} />}
      </div>
      {/* 3. o "quem" e o PERGUNTAR, fantasma no canto */}
      <div className="flex min-w-0 items-center gap-1">
        <p className="min-w-0 flex-1 truncate text-[14px] font-medium leading-[18px] text-sutil">
          {apoio}{apoio && variacao ? ' · ' : ''}{variacao}
        </p>
        {perguntar && (
          /* a cabeça do Analista (não um "?", que se lê como ajuda); a palavra PERGUNTAR aparece no hover e no foco */
          <button type="button" onClick={(e) => { e.stopPropagation(); perguntar() }} aria-label={`Perguntar ao Analista: ${rotulo}`} title="Perguntar ao Analista"
            className="group/perg -mb-1 -mr-1.5 flex h-7 shrink-0 items-center gap-1 rounded-[8px] px-1 text-azul-texto transition-colors hover:bg-fundo-suave focus-visible:bg-fundo-suave">
            <span className="t-selo hidden text-[12px] group-hover/kpi:inline group-focus-visible/perg:inline">Perguntar</span>
            <AvatarIA agente="analista" tamanho={22} />
          </button>
        )}
      </div>
    </section>
  )
}

/** Escala "boa" para o eixo: de 10 em 10 (ou de 5 em 5), com folga. */
function escala(valores: number[], unidade: '%' | '') {
  if (!valores.length) return { lo: 0, hi: 100 }
  const min = Math.min(...valores), max = Math.max(...valores)
  const passo = max - min > 30 ? 10 : 5
  let lo = Math.floor((min - passo / 2) / passo) * passo
  let hi = Math.ceil((max + passo / 2) / passo) * passo
  if (unidade === '%') { lo = Math.max(0, lo); hi = Math.min(100, hi) }
  if (hi - lo < passo * 2) hi = lo + passo * 2
  // a marca do meio também cai num múltiplo do passo (nada de "82,5%"): o número de passos fica par
  if (((hi - lo) / passo) % 2 === 1) {
    if (unidade === '%' && hi + passo > 100) lo -= passo
    else hi += passo
  }
  return { lo, hi }
}

export function GraficoSemanas({ series, unidade = '%', familia = 'azul', altura = 180, rotulo }: {
  series: { nome: string; pontos: { rotulo: string; valor: number | null }[]; tracejada?: boolean }[]
  unidade?: '%' | ''
  familia?: Familia
  altura?: number
  rotulo: string
}) {
  const [foco, setFoco] = React.useState<number | null>(null)
  const base = series[0]?.pontos ?? []
  const n = Math.max(1, base.length)
  const todos = series.flatMap((s) => s.pontos.map((p) => p.valor)).filter((v): v is number => v !== null)
  const { lo, hi } = escala(todos, unidade)
  const X = (i: number) => (n === 1 ? 50 : ((i + 0.5) / n) * 100)
  const Y = (v: number) => 100 - ((v - lo) / Math.max(0.0001, hi - lo)) * 100
  const linhas = [lo, (lo + hi) / 2, hi]
  const fmt = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${unidade}`
  const cor = (s: { tracejada?: boolean }) => (s.tracejada ? 'var(--color-apagado)' : `var(--color-${familia})`)
  const segmentos = (pts: { valor: number | null }[]) => {
    const out: string[][] = []; let atual: string[] = []
    pts.forEach((p, i) => { if (p.valor === null) { if (atual.length) out.push(atual); atual = [] } else atual.push(`${X(i)},${Y(p.valor)}`) })
    if (atual.length) out.push(atual)
    return out
  }
  return (
    <figure aria-label={rotulo} className="flex min-h-0 w-full flex-col gap-2">
      <div className="relative flex min-h-20 flex-[1_1_auto] gap-2" style={{ height: altura }}>
        <div aria-hidden className="flex w-9 shrink-0 flex-col justify-between py-0 text-right text-[13px] font-bold leading-none tabular-nums text-sutil">
          {[...linhas].reverse().map((l) => <span key={l} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{fmt(l)}</span>)}
        </div>
        <div className="relative min-w-0 flex-1" onMouseLeave={() => setFoco(null)}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {linhas.map((l) => <line key={l} x1={0} x2={100} y1={Y(l)} y2={Y(l)} style={{ stroke: 'var(--color-borda)' }} strokeWidth={2} vectorEffect="non-scaling-stroke" />)}
            {foco !== null && <line x1={X(foco)} x2={X(foco)} y1={0} y2={100} style={{ stroke: 'var(--color-borda-forte)' }} strokeWidth={2} vectorEffect="non-scaling-stroke" />}
            {series.map((s) => segmentos(s.pontos).map((seg, k) => (
              <polyline key={`${s.nome}-${k}`} fill="none" style={{ stroke: cor(s) }} strokeWidth={s.tracejada ? 2.5 : 3.5}
                strokeDasharray={s.tracejada ? '6 6' : undefined} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" points={seg.join(' ')} />
            )))}
          </svg>
          {/* os pontos em HTML (o SVG estica) e as faixas do hover */}
          {series.map((s) => s.pontos.map((p, i) => p.valor === null ? null : (
            <span key={`${s.nome}-${i}`} aria-hidden className={cn('absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2', foco === i ? 'scale-125' : '')}
              style={{ left: `${X(i)}%`, top: `${Y(p.valor)}%`, background: s.tracejada ? 'var(--color-white)' : cor(s), borderColor: cor(s) }} />
          )))}
          <div className="absolute inset-0 flex">
            {base.map((p, i) => (
              <span key={p.rotulo} className="h-full flex-1" onMouseEnter={() => setFoco(i)}
                title={series.map((s) => `${s.nome}: ${s.pontos[i]?.valor === null || s.pontos[i] === undefined ? '—' : fmt(s.pontos[i].valor!)}`).join(' · ')} />
            ))}
          </div>
          {foco !== null && (
            <div className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[10px] border-2 border-borda bg-white px-2.5 py-1.5 text-[13px] font-bold leading-4 text-tinta"
              style={{ left: `${Math.min(88, Math.max(12, X(foco)))}%` }}>
              <span className="text-sutil">{base[foco]?.rotulo}</span>
              {series.map((s) => <span key={s.nome} className="ml-2 tabular-nums">{s.nome} {s.pontos[foco]?.valor == null ? '—' : fmt(s.pontos[foco].valor!)}</span>)}
            </div>
          )}
        </div>
      </div>
      <div aria-hidden className="ml-11 flex text-[13px] font-bold leading-4 text-sutil">
        {base.map((p) => <span key={p.rotulo} className="min-w-0 flex-1 truncate text-center">{p.rotulo}</span>)}
      </div>
      <ul className="ml-11 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s) => (
          <li key={s.nome} className="flex items-center gap-1.5 text-[14px] font-medium leading-5 text-apoio">
            <span aria-hidden className="h-0 w-5 border-t-[3px]" style={{ borderColor: cor(s), borderStyle: s.tracejada ? 'dashed' : 'solid' }} />
            {s.nome}
            <span className="sr-only">: {s.pontos.map((p) => `${p.rotulo} ${p.valor === null ? 'sem dado' : fmt(p.valor)}`).join(', ')}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

export function MapaDeCalor({ linhas, colunas, valor, acesa, aoEscolher, rotulo }: {
  linhas: { id: string; nome: string }[]
  colunas: { id: string; nome: string; icone?: React.ReactNode }[]
  valor: (l: string, c: string) => number | null | 'poucos' | 'fora'
  acesa?: { linha?: string; coluna?: string }
  aoEscolher?: (l: string, c: string) => void
  rotulo: string
}) {
  const nums: number[] = []
  for (const l of linhas) for (const c of colunas) { const v = valor(l.id, c.id); if (typeof v === 'number') nums.push(v) }
  const min = nums.length ? Math.min(...nums) : 0
  const max = nums.length ? Math.max(...nums) : 1
  const forca = (v: number) => (max === min ? 0.5 : (v - min) / (max - min))
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[320px] border-separate border-spacing-1 text-[15px] tabular-nums">
        <caption className="sr-only">{rotulo}</caption>
        <thead>
          <tr>
            <th scope="col" className="w-14" />
            {colunas.map((c) => (
              <th key={c.id} scope="col" className={cn('t-selo h-7 px-1 text-center align-bottom', acesa?.coluna === c.id ? 'text-azul-texto' : 'text-sutil')}>
                <span className="inline-flex items-center gap-1">{c.icone}{c.nome}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.id}>
              <th scope="row" className={cn('t-selo whitespace-nowrap pr-1 text-left', acesa?.linha === l.id ? 'text-azul-texto' : 'text-sutil')}>{l.nome}</th>
              {colunas.map((c) => {
                const v = valor(l.id, c.id)
                const aceso = (acesa?.linha === l.id && (!acesa.coluna || acesa.coluna === c.id)) || (acesa?.coluna === c.id && !acesa?.linha)
                const conteudo = v === 'fora' ? '—' : v === 'poucos' ? 'menos de 5' : v === null ? '—' : `${v}%`
                const pct = typeof v === 'number' ? Math.round(18 + forca(v) * 82) : 0
                const estilo: React.CSSProperties = typeof v === 'number'
                  ? { background: `color-mix(in srgb, var(--color-azul) ${pct}%, var(--color-azul-claro))` }
                  : v === 'poucos' ? { backgroundImage: 'repeating-linear-gradient(135deg, var(--color-fundo-suave) 0 6px, var(--color-borda) 6px 8px)' } : {}
                const forte = typeof v === 'number' && pct >= 55
                const cls = cn('h-9 w-full rounded-[8px] px-1 text-center font-bold leading-none transition-[outline] duration-150',
                  typeof v === 'number' ? (forte ? 'text-sobre-cor' : 'text-tinta') : v === 'poucos' ? 'text-[12px] text-apoio' : 'bg-fundo-suave text-sutil',
                  aceso && 'outline outline-[3px] outline-offset-1 outline-azul-borda')
                return (
                  <td key={c.id} className="p-0">
                    {aoEscolher && typeof v === 'number'
                      ? <button type="button" style={estilo} className={cn(cls, 'hover:outline hover:outline-2 hover:outline-azul')} onClick={() => aoEscolher(l.id, c.id)}
                          aria-label={`${l.nome}, ${c.nome}: ${conteudo}`}>{conteudo}</button>
                      : <div style={estilo} className={cn(cls, 'grid place-items-center')}>{conteudo}</div>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TabelaBarras({ colunas, linhas, aoAbrir, rolaPorDentro, rotulo }: {
  colunas: { id: string; nome: string; largura?: string; alinhar?: 'fim' }[]
  linhas: { id: string; celulas: React.ReactNode[]; rotulo?: string; barras?: { coluna: number; valor: number | null; max?: number; familia?: Familia }[] }[]
  aoAbrir?: (id: string) => void
  rolaPorDentro?: boolean
  rotulo: string
}) {
  return (
    <div className={cn('min-w-0', rolaPorDentro ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain' : 'overflow-x-auto')}>
      <table className="w-full table-fixed border-collapse text-[15px] leading-5 tabular-nums">
        <caption className="sr-only">{rotulo}</caption>
        <colgroup>{colunas.map((c) => <col key={c.id} style={c.largura ? { width: c.largura } : undefined} />)}</colgroup>
        {/* o cabeçalho preso cobre a linha que passa por baixo: o fundo vai em cada célula (no border-collapse o fundo
            do thead não cobre) e o fio de baixo é uma sombra, que acompanha a célula presa */}
        <thead className={cn(rolaPorDentro && 'sticky top-0 z-[1]')}>
          <tr>
            {colunas.map((c) => (
              <th key={c.id} scope="col" className={cn('t-selo h-8 bg-white px-3 pb-1.5 align-bottom text-sutil shadow-[inset_0_-2px_0_var(--color-borda)] first:pl-0',
                c.alinhar === 'fim' ? 'text-right' : 'text-left')}>{c.nome}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const linha = (
              <>
                {l.celulas.map((cel, i) => {
                  const barra = l.barras?.find((b) => b.coluna === i)
                  return (
                    <td key={i} className={cn('h-10 px-3 first:pl-0', i === 0 ? 'font-bold text-tinta' : 'font-medium text-apoio', colunas[i]?.alinhar === 'fim' && 'text-right')}>
                      {barra ? (
                        <span className="relative flex h-7 items-center overflow-hidden rounded-[6px] bg-fundo-suave" style={estiloFamilia(barra.familia ?? 'azul')}>
                          {barra.valor !== null && <span aria-hidden className="absolute inset-y-0 left-0 rounded-[6px] border-r-[3px] border-(--face) bg-(--claro)" style={{ width: `${Math.max(3, Math.min(100, (barra.valor / (barra.max ?? 100)) * 100))}%` }} />}
                          <span className={cn('relative px-2 font-bold', barra.valor === null ? 'text-[13px] font-medium text-sutil' : 'text-tinta')}>{cel}</span>
                        </span>
                      ) : <span className="block truncate">{cel}</span>}
                    </td>
                  )
                })}
              </>
            )
            return aoAbrir
              ? <tr key={l.id} tabIndex={0} role="button"
                  aria-label={l.rotulo ?? (typeof l.celulas[0] === 'string' || typeof l.celulas[0] === 'number' ? `Abrir ${l.celulas[0]}` : undefined)}
                  onClick={() => aoAbrir(l.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoAbrir(l.id) } }}
                  className="cursor-pointer border-t-2 border-borda transition-colors first:border-t-0 duration-150 hover:bg-fundo-suave focus-visible:bg-fundo-suave">{linha}</tr>
              : <tr key={l.id} className="border-t-2 border-borda first:border-t-0">{linha}</tr>
          })}
        </tbody>
      </table>
    </div>
  )
}
