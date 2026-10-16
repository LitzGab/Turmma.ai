import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, CalendarClock, ChevronRight, CircleHelp, TriangleAlert } from 'lucide-react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import { Botao } from './botao'
import { Selo } from './selo'
import type { Origem, TipoDado } from '@/dados/gestao'

/* AS PEÇAS DOS PAINÉIS DE GESTÃO (06/10/2026; pesquisa/paineis-gestao/plano.md). Os números vêm de dados/gestao.ts.

   · Etiqueta: OFICIAL (anil) ou TURMMA (laranja), selo pequeno e discreto. OFICIAL = lido do diário, do APOIA, do
     Pé-de-Meia ou do INEP; TURMMA = só existe porque o Turmma está na escola.
       <Etiqueta tipo="oficial" />
   · LinhaDeFonte: a etiqueta + a fonte curta, numa linha ("Diário Professor Online · hoje 7h").
       <LinhaDeFonte origem={painel.frequencia.origem} />
   · Movimento: "↑ 18 pioraram" (vermelho, seta para cima) ou "↓ 9 melhoraram" (verde, seta para baixo). Seta e
     palavra sempre junto da cor. Zero fica cinza. `desde` acrescenta "desde agosto".
       <Movimento n={18} tipo="pioraram" desde="agosto" />
   · CelulaLimiar: o número da tabela, que só ganha cor (fundo vermelho-claro, texto vermelho e um triângulo) quando
     `passou` é verdadeiro — use `passaDoLimiar(coluna, valor, alunos)` de dados/gestao. Nas redes, passe
     `menosDe5` para 1 a 4 virar "menos de 5". null vira "—".
       <CelulaLimiar valor={7} passou titulo="Colorido a partir de 1 aluno" />
   · BarraDeFaixas: a barra empilhada horizontal das faixas de frequência, com a legenda (rótulo, contagem e o
     movimento opcional). A faixa `destaque` (padrão: a última, "abaixo de 75%") vai em vermelho e as outras em tons
     de anil, do claro (em dia) ao escuro (falta crônica). `marca` desenha a linha de 80% do Pé-de-Meia no ponto em
     que começam os alunos abaixo dela (`abaixo` = alunos abaixo de 80%, incluindo os abaixo de 75%). Cabe em 375.
       <BarraDeFaixas rotulo="Frequência por faixa" faixas={painel.frequencia.faixas.map(...)} marca={{ abaixo: 302, rotulo: 'Pé-de-Meia · 80%' }} />
   · CartaoDeAcao: o cartão de "Pede ação esta semana": etiqueta, número grande, unidade + frase, limiar, detalhe,
     prazo e o botão secundário (no máximo um botão cheio por tela, R4). Aceita o objeto de dados por spread:
       <CartaoDeAcao {...painel.acoes[0]} aoAbrir={() => abrirLista('apoia')} />   ou   para="/coordenacao/registros?aba=ia"
   Tudo com os tokens do sistema: o modo escuro (?tema=escuro) vira sozinho. */

/* ── Etiqueta ──────────────────────────────────────────────────────────────────────────────────────────── */

const ETIQUETA: Record<TipoDado, { texto: string; familia: 'anil' | 'laranja'; explica: string }> = {
  oficial: { texto: 'Oficial', familia: 'anil', explica: 'Lido do sistema oficial (diário, APOIA, Pé-de-Meia ou INEP)' },
  turmma: { texto: 'Turmma', familia: 'laranja', explica: 'Só existe porque o Turmma está na escola' },
}

export function Etiqueta({ tipo, className }: { tipo: TipoDado; className?: string }) {
  const e = ETIQUETA[tipo]
  return (
    <Selo familia={e.familia} tamanho="p" title={e.explica} className={cn('h-[18px] px-1.5 text-[11px] tracking-[.06em]', className)}>
      {e.texto}
    </Selo>
  )
}

/* ── Linha de fonte ────────────────────────────────────────────────────────────────────────────────────── */

export function LinhaDeFonte({ origem, tipo, fonte, className }: {
  origem?: Origem
  tipo?: TipoDado
  fonte?: string
  className?: string
}) {
  const t = origem?.tipo ?? tipo ?? 'oficial'
  const f = origem?.fonte ?? fonte ?? ''
  return (
    <p className={cn('flex min-w-0 items-center gap-1.5 text-[13px] font-medium leading-4 text-sutil', className)}>
      <Etiqueta tipo={t} />
      <span className="min-w-0 truncate" title={f}>{f}</span>
    </p>
  )
}

/* ── Movimento ─────────────────────────────────────────────────────────────────────────────────────────── */

export type TipoMovimento = 'pioraram' | 'melhoraram' | 'entraram' | 'sairam'

const MOVIMENTO: Record<TipoMovimento, { ruim: boolean; um: string; varios: string; nenhum: string }> = {
  pioraram: { ruim: true, um: 'piorou', varios: 'pioraram', nenhum: 'nenhum piorou' },
  melhoraram: { ruim: false, um: 'melhorou', varios: 'melhoraram', nenhum: 'nenhum melhorou' },
  entraram: { ruim: true, um: 'entrou', varios: 'entraram', nenhum: 'nenhum entrou' },
  sairam: { ruim: false, um: 'saiu', varios: 'saíram', nenhum: 'nenhum saiu' },
}

export function Movimento({ n, tipo, desde, texto, className }: {
  n: number
  tipo: TipoMovimento
  /** "agosto" → "desde agosto"; "o trimestre anterior" → "desde o trimestre anterior" */
  desde?: string
  /** troca a palavra ("pioraram de faixa") */
  texto?: string
  className?: string
}) {
  const m = MOVIMENTO[tipo]
  const fim = desde ? ` desde ${desde}` : ''
  if (n <= 0) {
    return <span className={cn('inline-flex items-center text-[14px] font-semibold leading-5 text-sutil', className)}>{m.nenhum}{fim}</span>
  }
  const palavra = texto ?? (n === 1 ? m.um : m.varios)
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[14px] font-bold leading-5 tabular-nums [&_svg]:size-4 [&_svg]:shrink-0',
      m.ruim ? 'text-vermelho-texto' : 'text-verde-texto', className)}>
      {m.ruim ? <ArrowUp strokeWidth={3} aria-hidden /> : <ArrowDown strokeWidth={3} aria-hidden />}
      <span>{n.toLocaleString('pt-BR')} {palavra}{fim}</span>
    </span>
  )
}

/* ── Célula com limiar ─────────────────────────────────────────────────────────────────────────────────── */

export function CelulaLimiar({ valor, passou, menosDe5, titulo, className }: {
  valor: number | null | undefined
  /** passou do limiar da coluna: ganha cor e o triângulo */
  passou?: boolean
  /** nas redes: de 1 a 4 aparece "menos de 5" */
  menosDe5?: boolean
  /** o limiar em palavras, para o title */
  titulo?: string
  className?: string
}) {
  if (valor === null || valor === undefined) {
    return <span className={cn('tabular-nums text-apagado', className)} title="Sem dados">—</span>
  }
  const texto = menosDe5 && valor > 0 && valor < 5 ? '< 5' : valor.toLocaleString('pt-BR')
  if (!passou) {
    return <span className={cn('inline-flex h-7 items-center px-1.5 text-[15px] font-medium tabular-nums text-tinta', valor === 0 && 'text-sutil', className)} title={titulo}>{texto}</span>
  }
  return (
    <span title={titulo ? `${titulo} · passou do limiar` : 'Passou do limiar'}
      className={cn('inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-[8px] bg-vermelho-claro px-1.5 text-[15px] font-bold tabular-nums text-vermelho-texto [&_svg]:size-3.5 [&_svg]:shrink-0', className)}>
      <TriangleAlert strokeWidth={2.75} aria-label="passou do limiar" />
      {texto}
    </span>
  )
}

/* ── Barra de faixas ───────────────────────────────────────────────────────────────────────────────────── */

export type FaixaDaBarra = {
  id: string
  /** curto: "≥ 95%", "< 75%" */
  rotulo: string
  alunos: number
  /** (não aparece mais na legenda; fica para o leitor de tela) */
  explica?: string
  pioraram?: number
  melhoraram?: number
}

/* Do claro ao escuro em anil; a faixa de destaque, em vermelho. Classes literais (o Tailwind precisa enxergá-las). */
const TONS = ['bg-anil-borda', 'bg-anil', 'bg-anil-degrau', 'bg-anil-texto']

/** A barra empilhada das faixas, grossa, e embaixo uma legenda só de números: rótulo curto, contagem, % e o delta. */
export function BarraDeFaixas({ faixas, rotulo, destaque, marca, menosDe5, desde, className }: {
  faixas: FaixaDaBarra[]
  rotulo: string
  destaque?: string
  /** a linha de 80% (Pé-de-Meia): `abaixo` = alunos abaixo da marca, incluindo a faixa de baixo */
  marca?: { abaixo: number; rotulo: string }
  menosDe5?: boolean
  desde?: string
  className?: string
}) {
  const total = faixas.reduce((s, f) => s + f.alunos, 0)
  const idDestaque = destaque ?? faixas[faixas.length - 1]?.id
  const conta = (n: number) => (menosDe5 && n > 0 && n < 5 ? 'menos de 5' : n.toLocaleString('pt-BR'))
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)
  const fracaoDaMarca = marca && total > 0 ? Math.min(1, Math.max(0, (total - marca.abaixo) / total)) : null
  const outras = faixas.filter((f) => f.id !== idDestaque).map((f) => f.id)
  const corDa = (id: string) => (id === idDestaque ? 'bg-vermelho' : TONS[Math.min(outras.indexOf(id), TONS.length - 1)])
  const resumo = `${rotulo}: ${faixas.map((f) => `${conta(f.alunos)} ${f.explica ?? f.rotulo}`).join(', ')}` +
    (marca ? `; ${conta(marca.abaixo)} abaixo de ${marca.rotulo}` : '') + (desde ? ` (movimento desde ${desde})` : '')

  return (
    <figure aria-label={resumo} className={cn('flex min-w-0 flex-1 flex-col gap-3', className)}>
      <div aria-hidden className={cn('relative', marca && 'pt-5')}>
        {marca && fracaoDaMarca !== null && (
          <span className={cn('absolute top-0 whitespace-nowrap text-[12px] font-bold leading-4 text-tinta',
            fracaoDaMarca > 0.7 ? '-translate-x-full pr-1.5' : fracaoDaMarca < 0.3 ? 'pl-1.5' : '-translate-x-1/2')}
            style={{ left: `${fracaoDaMarca * 100}%` }}>
            {marca.rotulo} · {conta(marca.abaixo)}
          </span>
        )}
        <div className="flex h-11 gap-[3px] overflow-hidden rounded-[10px]">
          {faixas.map((f) => f.alunos > 0 && (
            <span key={f.id} title={`${f.rotulo}: ${conta(f.alunos)}`} className={cn('h-full', corDa(f.id))} style={{ flex: `${f.alunos} 1 0`, minWidth: 10 }} />
          ))}
        </div>
        {marca && fracaoDaMarca !== null && (
          <span className="absolute bottom-[-4px] top-4 w-[3px] -translate-x-1/2 rounded-full bg-tinta" style={{ left: `${fracaoDaMarca * 100}%` }} />
        )}
      </div>
      <ul className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
        {faixas.map((f, i) => {
          const eDestaque = f.id === idDestaque
          // a de cima conta quem subiu para ela (bom); as outras, quem desceu para elas (ruim)
          const d = i === 0 ? f.melhoraram ?? 0 : f.pioraram ?? 0
          return (
            <li key={f.id} title={f.explica} className={cn('flex min-w-0 flex-col justify-between rounded-[12px] px-2.5 py-2', eDestaque ? 'bg-vermelho-claro' : 'bg-fundo-suave/70')}>
              <p className={cn('flex min-w-0 items-center gap-1.5 text-[13px] font-bold leading-4 tabular-nums', eDestaque ? 'text-vermelho-texto' : 'text-sutil')}>
                <span aria-hidden className={cn('size-2.5 shrink-0 rounded-[3px]', corDa(f.id))} />
                <span className="min-w-0 flex-1 truncate">{f.rotulo}</span>
              </p>
              <b className={cn('truncate font-bold leading-8 tabular-nums', conta(f.alunos).length > 4 ? 'text-[23px] tracking-[-.02em]' : 'text-[28px]', eDestaque ? 'text-vermelho-texto' : 'text-tinta')}>{conta(f.alunos)}</b>
              <span className="flex min-h-4 items-center justify-between gap-1">
                {d > 0 ? <Delta n={d} ruimSobe={i !== 0} menosDe5={menosDe5} className="text-[13px] leading-4" /> : <span />}
                {!(menosDe5 && f.alunos > 0 && f.alunos < 5) && <span className="text-[13px] font-bold leading-4 tabular-nums text-sutil">{pct(f.alunos)}%</span>}
              </span>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}

/* ── Peças do dashboard (07/10/2026: "Painel é dado. Não faz sentido esse monte de texto.") ─────────────────────
   · Ajuda: o "?" que abre o popover com o limiar, a lei e a fonte (o texto que saiu da tela).
   · MarcaOrigem: o ponto mínimo da origem (anil = oficial, laranja = Turmma); o nome vai no title e no leitor de tela.
   · Delta: "↑ 18" (vermelho quando subir é ruim) ou "↓ 9" (verde); `desde` acrescenta "desde ago" em cinza.
   · Minigrafico: a linha de 8 meses dentro do ladrilho.
   · LadrilhoKPI: número enorme + rótulo de 2 a 4 palavras + delta/prazo + minigráfico; `alerta` = pede ação (borda e
     triângulo vermelhos); `para` ou `aoAbrir` levam ao 2º nível. Altura fixa: a linha de ladrilhos fica alinhada.
   · CartaoGrafico: o cartão de um gráfico (título curto, ponto de origem, "?" e um canto à direita); estica na linha.
   · ColunasMensais: pequenos múltiplos de colunas fev → set, uma fileira por série (escalas separadas, sem eixo duplo).
   · BarrasHorizontais: uma barra por linha (empilhável), a contagem no fim; para escola, turma, componente, habilidade. */

export function Ajuda({ rotulo, children, className }: { rotulo: string; children: React.ReactNode; className?: string }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button type="button" aria-label={`Como ler: ${rotulo}`} onClick={(e) => e.stopPropagation()}
          className={cn('relative z-10 grid size-6 shrink-0 place-items-center rounded-full text-sutil transition-colors hover:bg-fundo-suave hover:text-tinta focus-visible:ring-[3px] focus-visible:ring-azul outline-none', className)}>
          <CircleHelp className="size-[18px]" strokeWidth={2.5} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content side="bottom" align="end" sideOffset={6} collisionPadding={12} onClick={(e) => e.stopPropagation()}
          className="z-50 grid w-[300px] max-w-[calc(100vw-24px)] gap-1.5 rounded-[12px] border-2 border-borda bg-white px-3.5 py-2.5 text-[14px] font-medium leading-5 text-apoio shadow-[0_4px_0_0_var(--color-borda)] [&_b]:font-bold [&_b]:text-tinta">
          <p className="t-selo text-tinta">{rotulo}</p>
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export function MarcaOrigem({ tipo, className }: { tipo: TipoDado; className?: string }) {
  const e = ETIQUETA[tipo]
  return (
    <span title={`${e.texto}: ${e.explica}`} className={cn('relative inline-flex shrink-0 items-center', className)}>
      <span aria-hidden className={cn('size-2 rounded-full', tipo === 'oficial' ? 'bg-anil' : 'bg-laranja')} />
      <span className="sr-only">{e.texto}</span>
    </span>
  )
}

/** A linha de dentro do "?": o ponto, a palavra e a fonte. */
export function FonteNaAjuda({ origem }: { origem: Origem }) {
  return (
    <p className="flex items-center gap-1.5 text-[13px] leading-4 text-sutil">
      <MarcaOrigem tipo={origem.tipo} />
      <span><b className="!text-sutil">{ETIQUETA[origem.tipo].texto}</b> · {origem.fonte}</span>
    </p>
  )
}

export function Delta({ n, ruimSobe = true, desde, menosDe5, className }: {
  n: number
  /** subir é ruim (vermelho)? Padrão: sim (mais alunos acima do limiar) */
  ruimSobe?: boolean
  /** "ago" → "desde ago" em cinza */
  desde?: string
  menosDe5?: boolean
  className?: string
}) {
  const fim = desde ? <span className="ml-1 font-semibold text-sutil max-sm:hidden">desde {desde}</span> : null
  if (n === 0) return <span className={cn('text-[14px] font-bold leading-5 text-sutil', className)}>= {fim}</span>
  const ruim = n > 0 === ruimSobe
  const abs = Math.abs(n)
  const t = menosDe5 && abs < 5 ? 'menos de 5' : abs.toLocaleString('pt-BR')
  return (
    <span className={cn('inline-flex items-center gap-0.5 whitespace-nowrap text-[14px] font-bold leading-5 tabular-nums [&_svg]:size-3.5 [&_svg]:shrink-0',
      ruim ? 'text-vermelho-texto' : 'text-verde-texto', className)}>
      {n > 0 ? <ArrowUp strokeWidth={3} aria-label="subiu" /> : <ArrowDown strokeWidth={3} aria-label="desceu" />}
      {t}{fim}
    </span>
  )
}

export function Minigrafico({ valores, cor = 'anil', className }: { valores: number[]; cor?: 'anil' | 'vermelho' | 'azul' | 'verde'; className?: string }) {
  if (valores.length < 2) return null
  const min = Math.min(...valores), max = Math.max(...valores)
  const amp = Math.max(1, max - min)
  const X = (i: number) => 3 + (i / (valores.length - 1)) * 82
  const Y = (v: number) => 29 - ((v - min) / amp) * 24
  const pts = valores.map((v, i) => `${X(i)},${Y(v)}`).join(' ')
  const c = `var(--color-${cor})`
  return (
    <svg viewBox="0 0 88 32" width={88} height={32} aria-hidden className={cn('shrink-0 overflow-visible', className)}>
      <polygon points={`${X(0)},31 ${pts} ${X(valores.length - 1)},31`} style={{ fill: `var(--color-${cor}-claro)` }} />
      <polyline points={pts} fill="none" style={{ stroke: c }} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={X(valores.length - 1)} cy={Y(valores[valores.length - 1])} r={3.5} style={{ fill: c }} />
    </svg>
  )
}

export function LadrilhoKPI({ rotulo, valor, origem, alerta, prazo, delta, serie, corSerie, ajuda, para, aoAbrir, ativo, className }: {
  rotulo: string
  valor: string
  origem: TipoDado
  /** pede ação: borda e triângulo vermelhos */
  alerta?: boolean
  /** o prazo curto ("até 24/09"), nos que pedem ação */
  prazo?: string
  /** o delta já montado (<Delta />) */
  delta?: React.ReactNode
  serie?: number[]
  corSerie?: 'anil' | 'vermelho' | 'azul' | 'verde'
  /** o conteúdo do "?" */
  ajuda?: React.ReactNode
  para?: string
  aoAbrir?: () => void
  ativo?: boolean
  className?: string
}) {
  const clicavel = !!(para || aoAbrir)
  const alvo = 'absolute inset-0 z-0 rounded-[14px] outline-none focus-visible:ring-[3px] focus-visible:ring-azul'
  return (
    <section aria-label={`${rotulo}: ${valor}`} data-origem={origem}
      className={cn('group/kpi relative flex h-[128px] min-w-0 flex-col justify-between rounded-[16px] border-2 bg-white px-4 pb-2.5 pt-3 transition-colors duration-150',
        alerta ? 'border-vermelho-borda' : 'border-borda',
        ativo && 'border-azul bg-azul-claro/40',
        clicavel && (alerta ? 'shadow-[0_3px_0_0_var(--color-vermelho-borda)]' : 'shadow-[0_3px_0_0_var(--color-borda)]'),
        clicavel && 'hover:bg-fundo-suave active:translate-y-[2px] active:shadow-none', className)}>
      {para ? <Link to={para} aria-label={`${rotulo}: ${valor}. Abrir`} className={alvo} />
        : aoAbrir ? <button type="button" onClick={aoAbrir} aria-label={`${rotulo}: ${valor}. Abrir`} aria-pressed={ativo} className={alvo} /> : null}
      <div className="pointer-events-none relative flex min-w-0 items-center gap-1.5">
        <h3 className={cn('min-w-0 truncate text-[13px] font-bold leading-5 sm:text-[14px]', alerta ? 'text-vermelho-texto' : 'text-apoio')} title={rotulo}>{rotulo}</h3>
        <span className="flex-1" />
        {ajuda && <span className="pointer-events-auto -my-1 -mr-1.5"><Ajuda rotulo={rotulo}>{ajuda}</Ajuda></span>}
      </div>
      <div className="pointer-events-none relative flex min-w-0 items-end justify-between gap-2">
        <span className="min-w-0 truncate text-[40px] font-bold leading-[44px] tracking-[-.01em] tabular-nums text-tinta">{valor}</span>
        {serie && <Minigrafico valores={serie} cor={corSerie} className="mb-1.5 max-sm:hidden" />}
      </div>
      <div className="pointer-events-none relative flex min-h-5 min-w-0 items-center gap-1.5">
        {alerta && <TriangleAlert aria-label="pede ação" className="size-4 shrink-0 text-vermelho-texto" strokeWidth={2.75} />}
        {prazo && (
          <span className={cn('flex min-w-0 items-center gap-1 text-[13px] font-bold leading-4 [&_svg]:size-3.5 [&_svg]:shrink-0', alerta ? 'text-vermelho-texto' : 'text-sutil')}>
            {!alerta && <CalendarClock strokeWidth={2.5} aria-hidden />}<span className="truncate">{prazo}</span>
          </span>
        )}
        {delta && <span className="min-w-0 truncate">{delta}</span>}
        <span className="flex-1" />
        {clicavel && <ChevronRight aria-hidden className="size-4 shrink-0 text-sutil" strokeWidth={2.75} />}
      </div>
    </section>
  )
}

export function CartaoGrafico({ titulo, origem, ajuda, direita, children, className, rotulo }: {
  titulo: string
  origem?: TipoDado
  ajuda?: React.ReactNode
  direita?: React.ReactNode
  children: React.ReactNode
  className?: string
  rotulo?: string
}) {
  return (
    <section aria-label={rotulo ?? titulo} className={cn('flex min-w-0 flex-col rounded-[16px] border-2 border-borda bg-white p-4', className)}>
      <div className="mb-3 flex min-h-6 min-w-0 shrink-0 items-center gap-2">
        <h2 className="min-w-0 truncate text-[15px] font-bold leading-5 text-tinta">{titulo}</h2>
        {origem && <MarcaOrigem tipo={origem} />}
        {ajuda && <Ajuda rotulo={titulo}>{ajuda}</Ajuda>}
        {direita && <div className="ml-auto flex min-w-0 shrink-0 items-center gap-3">{direita}</div>}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </section>
  )
}

/** A legenda curta de um gráfico: quadradinho + palavra. */
export function Legenda({ itens }: { itens: { rotulo: string; cor: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5 text-[13px] font-bold leading-4 text-sutil">
          <span aria-hidden className={cn('size-2.5 rounded-[3px]', i.cor)} />{i.rotulo}
        </li>
      ))}
    </ul>
  )
}

const COR_SERIE = {
  vermelho: { forte: 'bg-vermelho', claro: 'bg-vermelho-borda', texto: 'text-vermelho-texto' },
  anil: { forte: 'bg-anil', claro: 'bg-anil-borda', texto: 'text-anil-texto' },
} as const

export function ColunasMensais({ meses, series, rotulo, menosDe5 }: {
  meses: string[]
  series: { nome: string; valores: number[]; cor: keyof typeof COR_SERIE }[]
  rotulo: string
  menosDe5?: boolean
}) {
  const conta = (n: number) => (menosDe5 && n > 0 && n < 5 ? '<5' : n.toLocaleString('pt-BR'))
  const ultimo = meses.length - 1
  return (
    <figure aria-label={`${rotulo}: ${series.map((s) => `${s.nome}, ${s.valores.map((v, i) => `${meses[i]} ${conta(v)}`).join(', ')}`).join('; ')}`}
      className="flex min-h-0 flex-1 flex-col gap-2">
      {series.map((s) => {
        const max = Math.max(1, ...s.valores)
        const c = COR_SERIE[s.cor]
        return (
          <div key={s.nome} aria-hidden className="grid min-h-[72px] flex-1 grid-cols-[72px_minmax(0,1fr)] items-stretch gap-2">
            <div className="flex flex-col justify-end pb-0.5">
              <span className={cn('flex items-center gap-1.5 whitespace-nowrap text-[13px] font-bold leading-4', c.texto)}>
                <span className={cn('size-2.5 shrink-0 rounded-[3px]', c.forte)} />{s.nome}
              </span>
            </div>
            <ul className="flex min-w-0 items-end gap-1.5 border-b-2 border-borda">
              {s.valores.map((v, i) => (
                <li key={meses[i]} title={`${meses[i]}: ${conta(v)}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5">
                  <span className={cn('text-[12px] font-bold leading-4 tabular-nums', i === ultimo ? cn('text-[14px]', c.texto) : 'text-sutil')}>{conta(v)}</span>
                  <span className={cn('block w-full max-w-9 rounded-t-[5px]', i === ultimo ? c.forte : c.claro)} style={{ height: `calc((100% - 22px) * ${v / max})`, minHeight: 3 }} />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
      <div aria-hidden className="grid grid-cols-[72px_minmax(0,1fr)] gap-2">
        <span />
        <span className="flex gap-1.5">
          {meses.map((m, i) => <span key={m} className={cn('min-w-0 flex-1 text-center text-[12px] font-bold uppercase leading-4', i === ultimo ? 'text-tinta' : 'text-sutil')}>{m}</span>)}
        </span>
      </div>
    </figure>
  )
}

export type ItemBarraH = {
  id: string
  rotulo: string
  /** a linha de baixo, pequena (opcional) */
  sub?: string
  /** os pedaços, empilhados; null = sem dados */
  partes: { valor: number; cor: string }[] | null
  /** o que vem depois do número (um Delta) */
  depois?: React.ReactNode
  aoAbrir?: () => void
  titulo?: string
}

export function BarrasHorizontais({ itens, max, menosDe5, rotulo, largura = 104, vazio = 'sem dados', compacto, empilhado }: {
  itens: ItemBarraH[]
  max?: number
  menosDe5?: boolean
  rotulo: string
  /** a largura da coluna dos rótulos, em px */
  largura?: number
  vazio?: string
  compacto?: boolean
  /** rótulo e número numa linha, a barra embaixo, inteira (cartões estreitos) */
  empilhado?: boolean
}) {
  const soma = (i: ItemBarraH) => (i.partes ?? []).reduce((s, p) => s + p.valor, 0)
  const topo = max ?? Math.max(1, ...itens.map(soma))
  const conta = (n: number) => (menosDe5 && n > 0 && n < 5 ? '<5' : n.toLocaleString('pt-BR'))
  return (
    <ul aria-label={rotulo} className={cn('grid min-w-0 content-between', compacto ? 'gap-0.5' : 'gap-1')}>
      {itens.map((i) => {
        const total = soma(i)
        const barra = (
          <span className={cn('relative flex min-w-0 shrink-0 gap-[2px] overflow-hidden rounded-[6px] bg-fundo-suave', empilhado ? 'h-3.5 w-full' : 'h-5 flex-1')}>
            {i.partes?.map((p, k) => p.valor > 0 && <span key={k} className={cn('h-full', p.cor)} style={{ width: `${(p.valor / topo) * 100}%` }} />)}
          </span>
        )
        const numero = i.partes ? <b className="text-[15px] font-bold leading-5 tabular-nums text-tinta">{conta(total)}</b> : <span className="text-[13px] font-semibold text-sutil">{vazio}</span>
        if (empilhado) {
          const conteudo = (
            <>
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-[14px] font-bold leading-5 text-tinta">{i.rotulo}{i.sub && <span className="ml-1.5 text-[12px] font-semibold text-sutil">{i.sub}</span>}</span>
                {numero}{i.depois}
              </span>
              {barra}
            </>
          )
          const c2 = 'flex w-full min-w-0 flex-col gap-1 rounded-[8px] px-1.5 py-1 text-left'
          return (
            <li key={i.id} title={i.titulo}>
              {i.aoAbrir
                ? <button type="button" onClick={i.aoAbrir} className={cn(c2, 'transition-colors hover:bg-fundo-suave focus-visible:ring-[3px] focus-visible:ring-azul outline-none')}>{conteudo}</button>
                : <div className={c2}>{conteudo}</div>}
            </li>
          )
        }
        const corpo = (
          <>
            <span className="min-w-0" style={{ width: largura }}>
              <span className="block truncate text-[14px] font-bold leading-[18px] text-tinta">{i.rotulo}</span>
              {i.sub && <span className="block truncate text-[12px] font-semibold leading-4 text-sutil">{i.sub}</span>}
            </span>
            {barra}
            <span className={cn('flex shrink-0 items-baseline justify-end gap-1.5', i.depois ? 'w-[84px]' : 'w-12')}>
              {numero}
              {i.depois}
            </span>
          </>
        )
        const cls = cn('flex w-full min-w-0 items-center gap-2.5 rounded-[8px] px-1.5 text-left', compacto ? 'min-h-8' : 'min-h-9')
        return (
          <li key={i.id} title={i.titulo}>
            {i.aoAbrir
              ? <button type="button" onClick={i.aoAbrir} className={cn(cls, 'transition-colors hover:bg-fundo-suave focus-visible:ring-[3px] focus-visible:ring-azul outline-none')}>{corpo}</button>
              : <div className={cls}>{corpo}</div>}
          </li>
        )
      })}
    </ul>
  )
}

/** Um número pequeno do rodapé (IA, INEP): rótulo curto em cima, valor embaixo. */
export function NumeroPequeno({ rotulo, valor, origem, titulo }: { rotulo: string; valor: string; origem: TipoDado; titulo?: string }) {
  return (
    <div title={titulo} className="flex min-w-0 flex-col justify-between gap-1 rounded-[14px] border-2 border-borda bg-white px-3 py-2">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="min-w-0 truncate text-[12px] font-bold uppercase leading-4 tracking-[.04em] text-sutil">{rotulo}</span>
        <MarcaOrigem tipo={origem} />
      </span>
      <span className="text-[22px] font-bold leading-7 tabular-nums text-tinta">{valor}</span>
    </div>
  )
}

/* ── Cartão de ação ────────────────────────────────────────────────────────────────────────────────────── */

export function CartaoDeAcao({ numero, unidade, frase, limiar, detalhe, prazo, botao, origem, aoAbrir, para, menosDe5, className }: {
  numero: number
  /** "alunos", "turmas", "APOIAs" */
  unidade: string
  /** "no critério do APOIA, ainda sem aviso aberto" */
  frase: string
  limiar: string
  detalhe?: string
  /** "Abrir o aviso no APOIA até 24/09" */
  prazo: string
  /** o texto do botão ("Ver os 4") */
  botao: string
  origem: Origem
  aoAbrir?: () => void
  /** em vez de `aoAbrir`, um endereço */
  para?: string
  /** nas redes, de 1 a 4 vira "menos de 5" */
  menosDe5?: boolean
  className?: string
}) {
  const valor = menosDe5 && numero > 0 && numero < 5 ? 'menos de 5' : numero.toLocaleString('pt-BR')
  return (
    <article aria-label={`${valor} ${unidade} ${frase}`}
      className={cn('flex min-w-0 flex-col gap-2 rounded-[16px] border-2 border-borda bg-white p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <Etiqueta tipo={origem.tipo} />
        <span className="flex min-w-0 items-center gap-1 text-[13px] font-bold leading-4 text-amarelo-texto [&_svg]:size-4 [&_svg]:shrink-0">
          <CalendarClock strokeWidth={2.5} aria-hidden />
          <span className="min-w-0 truncate" title={prazo}>{prazo}</span>
        </span>
      </div>
      <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <span className="t-numero-g text-tinta">{valor}</span>
        <span className="t-cartao text-tinta">{unidade}</span>
      </p>
      <p className="t-cartao -mt-1 text-tinta">{frase}</p>
      <p className="t-apoio">{limiar}</p>
      {detalhe && <p className="text-[14px] font-semibold leading-5 text-apoio">{detalhe}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="min-w-0 truncate text-[12px] font-medium leading-4 text-sutil" title={origem.fonte}>{origem.fonte}</span>
        {para
          ? <Botao variante="secundario" tamanho="p" asChild><Link to={para}>{botao}</Link></Botao>
          : <Botao variante="secundario" tamanho="p" onClick={aoAbrir} disabled={!aoAbrir}>{botao}</Botao>}
      </div>
    </article>
  )
}
