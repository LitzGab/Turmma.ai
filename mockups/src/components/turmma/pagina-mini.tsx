import type { CSSProperties, ReactNode } from 'react'
import type { Bloco } from '@/dados/biblioteca'
import { cn } from '@/lib/utils'

/* A MINIATURA DA PÁGINA, para a Biblioteca no desenho do Google Docs. Rodada de 20/09/2026: o Gabriel pediu para
   "tirar essas capas falsas e deixar o documento real aparecendo em partes". Então aqui NÃO existe barrinha de
   esqueleto: a miniatura é o próprio documento — a folha branca com margem, o cabeçalho da escola numa linha fina,
   o título e o TEXTO DE VERDADE (os blocos de `dados/biblioteca`), em corpo de miniatura: ilegível de propósito,
   como no Docs, mas é texto, com quebra de linha, número de questão, alternativas a) b) c) d), tabela com fio,
   slide escuro com o título legível e mapa mental com os rótulos nos nós. A folha é cortada embaixo pelo esfumado
   do cartão (`Biblioteca.tsx`).

   · Escala: tudo em `em` sobre uma base de 4% da largura do cartão (`cqw`); o corpo do texto roda a .46em dessa
     base (.78em na versão de fonte ampliada), e o que está dentro dele é medido em `em` do corpo.
   · Cor: tinta de documento (preto a 85%), sem cinza lavado. É a folha do ALUNO: não tem alternativa marcada.
     Laranja só onde o documento impresso tem destaque: o fio do quadro de segurança e o traço da capa do slide.
   · Decorativa: `aria-hidden`. Quem fala com o leitor de tela é o link do cartão.
   No produto isto é uma imagem gerada do artefato. */

const LETRAS = 'abcde'

/** Alternativas: curtas ficam numa linha só, médias em duas colunas, longas uma por linha — como na folha impressa. */
function Alternativas({ alt, ampliada }: { alt: string[]; ampliada?: boolean }) {
  const maior = Math.max(...alt.map((a) => a.length))
  const colunas = ampliada ? (maior <= 8 ? 2 : 1) : maior <= 9 ? alt.length : maior <= 24 ? 2 : 1
  return (
    <div className="mt-[.3em] grid gap-x-[1em]" style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))` }}>
      {alt.map((a, i) => <span key={a} className="min-w-0"><b className="font-semibold text-tinta">{LETRAS[i]})</b> {a}</span>)}
    </div>
  )
}

/** O mapa mental: SVG, com o conceito no centro e o rótulo de verdade em cada ramo e em cada folha. */
function Mapa({ centro, ramos }: { centro: string; ramos: { nome: string; folhas: string[] }[] }) {
  const W = 240, H = 162, cx = W / 2, cy = 80, no = { w: 70, h: 13 }, linha = 6.4
  const esquerda = ramos.slice(0, Math.ceil(ramos.length / 2))
  const lados = [{ lista: esquerda, x: 1, dentro: 1 + no.w, saida: cx - 33 }, { lista: ramos.slice(esquerda.length), x: W - 1 - no.w, dentro: W - 1 - no.w, saida: cx + 33 }]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" fill="none">
      {lados.map(({ lista, x, dentro, saida }) => lista.map((r, i) => {
        const vao = H / lista.length
        const topo = vao * i + (vao - (no.h + 3 + r.folhas.length * linha)) / 2
        const y = topo + no.h / 2
        const meio = (saida + dentro) / 2
        return (
          <g key={r.nome}>
            <path d={`M${saida} ${cy}C${meio} ${cy} ${meio} ${y} ${dentro} ${y}`} stroke="#0D0D0D" strokeOpacity=".45" strokeWidth=".9" />
            <rect x={x} y={topo} width={no.w} height={no.h} rx={no.h / 2} fill="#fff" stroke="#0D0D0D" strokeOpacity=".7" strokeWidth=".9" />
            <text x={x + no.w / 2} y={y + 2.15} textAnchor="middle" fontSize="6" fontWeight="700" fill="#0D0D0D">{r.nome}</text>
            <path d={`M${x + 5} ${topo + no.h + 1.5}v${r.folhas.length * linha}`} stroke="#0D0D0D" strokeOpacity=".3" strokeWidth=".7" />
            {r.folhas.map((f, j) => <text key={f} x={x + 8} y={topo + no.h + 3 + linha * j + 4.4} fontSize="4.9" fill="#0D0D0D" fillOpacity=".82">{f}</text>)}
          </g>
        )
      }))}
      <rect x={cx - 33} y={cy - 10} width="66" height="20" rx="10" fill="#0D0D0D" />
      <text x={cx} y={cy + 2.5} textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">{centro}</text>
    </svg>
  )
}

type Slide = Extract<Bloco, { t: 'slide' }>

/** A apresentação: a capa escura, com o título legível, e os slides seguintes dois a dois, como na exportação em PDF. */
function Apresentacao({ slides }: { slides: Slide[] }) {
  const [capa, ...resto] = slides
  return (
    <div className="grid gap-[.75em]">
      <div className="flex aspect-video flex-col justify-between rounded-[.25em] bg-tinta p-[1.05em] text-white">
        <i className="block h-[.2em] w-[2.2em] bg-caramelo" />
        <div>
          <p className="text-[1.06em] font-bold leading-[1.1] tracking-[-.01em]">{capa.titulo}</p>
          <p className="mt-[.7em] text-[.5em] leading-[1.35] text-white/80">{capa.topicos[0]}</p>
        </div>
        <p className="flex justify-between text-[.4em] leading-none text-white/60"><span>{capa.topicos[1]}</span><span>{capa.n}</span></p>
      </div>
      <div className="grid grid-cols-2 gap-[.75em]">
        {resto.map((s) => (
          <div key={s.n} className="relative aspect-video overflow-hidden rounded-[.2em] border border-tinta/25 px-[.7em] pt-[.65em]">
            <p className="text-[.54em] font-bold leading-[1.12] text-tinta">{s.titulo}</p>
            <ul className="mt-[.9em] grid gap-[.45em] text-[.36em] leading-[1.25] text-tinta/85">
              {s.topicos.map((x) => <li key={x} className="flex gap-[.5em]"><span>•</span><span className="min-w-0">{x}</span></li>)}
            </ul>
            <span className="absolute bottom-[.8em] right-[1em] text-[.32em] leading-none text-tinta/55">{s.n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Um bloco do documento, em `em` do corpo. */
function Desenho({ b, ampliada }: { b: Exclude<Bloco, Slide>; ampliada?: boolean }): ReactNode {
  switch (b.t) {
    case 'identificacao': {
      const campo = (nome: string, peso: string) => <span className={cn('flex min-w-0 items-end gap-[.35em]', peso)}>{nome}<i className="mb-[.25em] block min-w-[1.5em] flex-1 border-b-[.1em] border-tinta/70" /></span>
      return <div className="flex gap-[.9em] pb-[.3em] text-tinta">{campo('Nome:', 'flex-[5_1_auto]')}{campo('Turma:', 'flex-[1_1_auto]')}{campo('Data:', 'flex-[1_1_auto]')}</div>
    }
    case 'sub': return <p className="pt-[.35em] text-[1.1em] font-bold leading-[1.2] text-tinta">{b.x}</p>
    case 'p': return <p>{b.x}</p>
    case 'nota': return <p className="italic text-tinta/70">{b.x}</p>
    case 'destaque': return <p className="px-[1.5em] text-center text-[1.1em] font-bold leading-[1.3] text-tinta">{b.x}</p>
    case 'questao': return (
      <div className="flex gap-[.45em]">
        <b className="w-[1.35em] shrink-0 text-right font-bold text-tinta">{b.n}.</b>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-line">{b.origem && <b className="font-semibold text-tinta">({b.origem}) </b>}{b.x}</p>
          {b.pergunta && <p className="font-bold text-tinta">{b.pergunta}</p>}
          {b.dados && <p className="text-[.8em] text-tinta/70">{b.dados}</p>}
          {b.alt && <Alternativas alt={b.alt} ampliada={ampliada} />}
        </div>
      </div>
    )
    case 'item': return (
      <div className="flex gap-[.55em] pl-[.4em]">
        {b.marca === 'caixa' ? <i className="mt-[.12em] block size-[1.15em] shrink-0 rounded-[.15em] border-[.1em] border-tinta/60" /> : <b className="shrink-0 font-bold text-tinta">{b.marca === 'ponto' ? '•' : `${b.marca}.`}</b>}
        <p className="min-w-0 flex-1">{b.x}</p>
      </div>
    )
    case 'etapa': return (
      /* a coluna do tempo alarga quando leva um período ("28/09 a 02/10"), para a data não quebrar */
      <div className={cn('grid gap-[.9em] border-t border-tinta/20 pt-[.55em]', (b.quando?.length ?? 0) > 8 ? 'grid-cols-[7.6em_minmax(0,1fr)]' : 'grid-cols-[5.4em_minmax(0,1fr)]')}>
        <p className="font-bold text-tinta">{b.tempo}{b.quando && <span className="block whitespace-nowrap font-normal text-tinta/70">{b.quando}</span>}</p>
        <div className="min-w-0"><p className="font-bold text-tinta">{b.nome}</p><p>{b.x}</p></div>
      </div>
    )
    case 'tabela': return (
      <div className="grid gap-px bg-tinta/30 p-px leading-[1.3]" style={{ gridTemplateColumns: b.larguras.map((l) => `minmax(0, ${l}fr)`).join(' ') }}>
        {b.colunas.map((c) => <b key={c} className="bg-realce-suave px-[.55em] py-[.4em] font-bold text-tinta">{c}</b>)}
        {b.linhas.flatMap((l, i) => l.map((c, j) => <span key={`${i}-${j}`} className={cn('min-w-0 bg-white px-[.55em] py-[.4em]', j === 0 && b.primeiraForte && 'font-bold text-tinta')}>{c}</span>))}
      </div>
    )
    case 'caixa': return (
      <div className={cn('border border-tinta/30 px-[.9em] py-[.65em]', b.alerta && 'border-l-[.45em] border-l-caramelo')}>
        <p className="text-[.86em] font-bold uppercase leading-[1.3] tracking-[.06em] text-tinta">{b.rotulo}</p>
        <p className="mt-[.2em]">{b.x}</p>
        {b.fonte && <p className="mt-[.2em] text-right text-[.86em] italic text-tinta/70">{b.fonte}</p>}
      </div>
    )
    case 'mapa': return <Mapa centro={b.centro} ramos={b.ramos} />
  }
}

/** `selo`: largura em px do selo de estado que o cartão põe no canto de cima, à direita. Em miniatura de 200 px ou
    mais, o cabeçalho e o título param antes dele (o título quebra em duas linhas) em vez de passar por baixo. */
export function PaginaMini({ titulo, cabecalho, blocos, ampliada, selo, className }: { titulo: string; cabecalho: string; blocos: Bloco[]; ampliada?: boolean; selo?: number; className?: string }) {
  // o selo fica a 8 px da borda; a folha tem 9% de margem: o que falta reservar é selo + 8 + 6 de respiro − 9cqw
  const canto = selo ? '@min-[200px]:pr-[calc(var(--selo)_+_14px_-_9cqw)]' : undefined
  const slides = blocos.filter((b): b is Slide => b.t === 'slide')
  const folha = blocos.filter((b): b is Exclude<Bloco, Slide> => b.t !== 'slide')
  return (
    <div aria-hidden className={cn('h-full w-full overflow-hidden bg-white [container-type:inline-size]', className)}>
      <div className="h-full px-[9%] pt-[6.6%] text-[4cqw] leading-none" style={selo ? { '--selo': `${selo}px` } as CSSProperties : undefined}>
        {/* a entrelinha folgada é para o acento das maiúsculas não ser cortado pelo `truncate` */}
        <p className={cn('truncate text-[.5em] font-medium uppercase leading-[1.8] tracking-[.07em] text-tinta/60', canto)}>{cabecalho}</p>
        {slides.length > 0 ? <div className="mt-[.6em]"><Apresentacao slides={slides} /></div> : (
          <>
            <p className={cn('mt-[.35em] line-clamp-2 font-bold leading-[1.12] tracking-[-.01em] text-tinta', ampliada ? 'text-[1.32em]' : 'text-[1em]', canto)}>{titulo}</p>
            <div className="mb-[.8em] mt-[.7em] h-[.1em] bg-tinta/85" />
            <div className={cn('grid text-tinta/85 [overflow-wrap:anywhere]', ampliada ? 'gap-[.85em] text-[.78em] leading-[1.42]' : 'gap-[.8em] text-[.46em] leading-[1.42]')}>
              {folha.map((b, i) => <Desenho key={i} b={b} ampliada={ampliada} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
