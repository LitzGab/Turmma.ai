import { ONCA } from './paleta'
import type { Roseta } from './geometria'

/* AS PEÇAS DA ONÇA, no quadro de 240 × 240 do rascunho (sistema-turmma-duolingo.md, 4.2).
   Três formas só: retângulo arredondado, círculo e triângulo arredondado. Sem contorno, sem degradê.
   O corpo nunca é redesenhado: as poses giram grupos e trocam só o miolo dos olhos e da boca (4.4). */




export type TipoOlhos = 'frente' | 'cima' | 'lado' | 'feliz' | 'dormindo' | 'acolhendo' | 'pensando'
export type TipoBoca = 'w' | 'aberta' | 'muito-aberta' | 'lado' | 'sorriso' | 'fechada' | 'leve'


export function Rosetas({ pinta, clip, lista }: { pinta: string; clip: string; lista: Roseta[] }) {
  return (
    <g clipPath={`url(#${clip})`} fill={ONCA.roseta}>
      {lista.map((p) => (
        <use key={`${p.x}-${p.y}`} href={`#${pinta}`} transform={`translate(${p.x} ${p.y}) rotate(${p.r}) scale(${p.s})`} />
      ))}
    </g>
  )
}

/** Orelhas: círculo de r 22 com miolo de r 11, metade atrás da cabeça. */
export function Orelha({ lado, id }: { lado: 'e' | 'd'; id?: string }) {
  const cx = lado === 'e' ? 68 : 172
  return (
    <g id={id} data-parte={`orelha-${lado}`}>
      <circle cx={cx} cy={58} r={22} fill={ONCA.pelagem} />
      <circle cx={cx} cy={58} r={11} fill={ONCA.realce} />
    </g>
  )
}

/** Máscara clara: dois círculos de r 38. */
export function Mascara() {
  return (
    <>
      <circle cx={91} cy={110} r={38} fill={ONCA.realce} />
      <circle cx={149} cy={110} r={38} fill={ONCA.realce} />
    </>
  )
}

/* Olhos. O esquerdo é 2 px menor, como no Duo. Pupila recortada pelo branco (clipPath por instância). */
const OLHO = {
  e: { x: 71, y: 86, w: 38, h: 48 },
  d: { x: 130, y: 85, w: 40, h: 50 },
}

/** Onde fica a pupila em cada olhar: [x, y, largura, altura] para o olho esquerdo e o direito. */
const PUPILA: Record<'frente' | 'cima' | 'lado' | 'acolhendo', { e: number[]; d: number[] }> = {
  frente: { e: [82, 99, 24, 32], d: [134, 99, 25, 33] },
  cima: { e: [84, 86, 24, 30], d: [144, 85, 25, 31] },
  lado: { e: [85, 97, 24, 32], d: [145, 97, 25, 33] },
  acolhendo: { e: [77, 96, 29, 36], d: [135, 96, 30, 37] },
}

function Olho({ lado, uid, olhar, palpebra, classe }: {
  lado: 'e' | 'd'; uid: string; olhar: keyof typeof PUPILA; palpebra?: 'baixa' | 'preocupada'; classe?: string
}) {
  const o = OLHO[lado]
  const [px, py, pw, ph] = PUPILA[olhar][lado]
  const clip = `${uid}-olho-${lado}`
  const brilho = { x: px + pw * 0.28, y: py + ph * 0.24 }
  /* A pálpebra não é uma peça por cima (deixaria um fio branco na borda): é o recorte do próprio olho,
     a abertura que sobra embaixo da linha da pálpebra. */
  let abertura: string | null = null
  const x0 = o.x - 4, x1 = o.x + o.w + 4, base = o.y + o.h + 4
  if (palpebra === 'baixa') abertura = `M${x0} ${o.y + o.h * 0.22} H${x1} V${base} H${x0} Z`
  if (palpebra === 'preocupada') {
    // o canto de dentro sobe: preocupação, não tristeza nem raiva
    const yFora = o.y + o.h * 0.2, yDentro = o.y + o.h * 0.02
    abertura = lado === 'e'
      ? `M${x0} ${yFora} L${x1} ${yDentro} V${base} H${x0} Z`
      : `M${x0} ${yDentro} L${x1} ${yFora} V${base} H${x0} Z`
  }
  const olho = (
    <g data-parte={`olho-${lado}`} className={classe}>
      <rect x={o.x} y={o.y} width={o.w} height={o.h} rx={o.w / 2} fill={ONCA.olho} />
      <g clipPath={`url(#${clip})`}>
        <rect data-parte="pupila" x={px} y={py} width={pw} height={ph} rx={pw / 2} fill={ONCA.pupila} />
        <circle cx={brilho.x} cy={brilho.y} r={5} fill={ONCA.olho} />
      </g>
    </g>
  )
  return (
    <>
      <defs>
        <clipPath id={clip}><rect x={o.x} y={o.y} width={o.w} height={o.h} rx={o.w / 2} /></clipPath>
        {abertura && <clipPath id={`${clip}-abre`}><path d={abertura} /></clipPath>}
      </defs>
      {abertura ? <g clipPath={`url(#${clip}-abre)`}>{olho}</g> : olho}
    </>
  )
}

/** Os olhos de cada expressão. Fechados viram arco de traço redondo, sem branco. */
export function Olhos({ tipo, uid, classe }: { tipo: TipoOlhos; uid: string; classe?: string }) {
  const arco = (d: string) => <path d={d} fill="none" stroke={ONCA.pupila} strokeWidth={8} strokeLinecap="round" />
  if (tipo === 'feliz') {
    return <g data-parte="olhos">{arco('M76 116 Q90 96 104 116')}{arco('M136 116 Q150 96 164 116')}</g>
  }
  if (tipo === 'dormindo') {
    return <g data-parte="olhos">{arco('M76 108 Q90 122 104 108')}{arco('M136 108 Q150 122 164 108')}</g>
  }
  const olhar = tipo === 'cima' || tipo === 'pensando' ? 'cima' : tipo === 'lado' ? 'lado' : tipo === 'acolhendo' ? 'acolhendo' : 'frente'
  const palpebra = tipo === 'pensando' ? 'baixa' : tipo === 'acolhendo' ? 'preocupada' : undefined
  return (
    <g data-parte="olhos">
      <Olho lado="e" uid={uid} olhar={olhar} palpebra={palpebra === 'preocupada' ? palpebra : undefined} classe={classe} />
      <Olho lado="d" uid={uid} olhar={olhar} palpebra={palpebra} classe={classe} />
    </g>
  )
}

/** Focinho creme e nariz (triângulo arredondado de 22 × 13). */
export function Focinho() {
  return (
    <>
      <rect x={98} y={128} width={44} height={30} rx={15} fill={ONCA.creme} />
      <path d="M111 130 H129 Q134 130 131 134 L123 141 Q120 144 117 141 L109 134 Q106 130 111 130 Z" fill={ONCA.nariz} />
    </>
  )
}

/** A boca. A base é um "w" pequeno; aberta só em alegria, com língua e nunca dente. */
export function Boca({ tipo, uid }: { tipo: TipoBoca; uid: string }) {
  const traco = (d: string) => (
    <path d={d} fill="none" stroke={ONCA.pupila} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
  )
  if (tipo === 'aberta' || tipo === 'muito-aberta') {
    const d = tipo === 'aberta'
      ? 'M109 146 Q121 150 133 145 Q133 158 122 160 Q110 160 109 146 Z'
      : 'M104 145 Q120 151 137 145 Q137 168 121 169 Q104 168 104 145 Z'
    const clip = `${uid}-boca`
    return (
      <g data-parte="boca">
        <defs><clipPath id={clip}><path d={d} /></clipPath></defs>
        <path d={d} fill={ONCA.pupila} />
        <g clipPath={`url(#${clip})`}>
          <circle cx={tipo === 'aberta' ? 124 : 121} cy={tipo === 'aberta' ? 164 : 172} r={tipo === 'aberta' ? 9 : 13} fill={ONCA.lingua} />
        </g>
      </g>
    )
  }
  const d = {
    w: 'M110 147 Q115 152 120 146 Q125 152 130 147',
    lado: 'M121 150 Q127 152 131 147',
    sorriso: 'M111 147 Q122 155 133 145',
    fechada: 'M114 148 Q117 151 120 148 Q123 151 126 148',
    leve: 'M112 148 Q120 153 128 148',
  }[tipo]
  return <g data-parte="boca">{traco(d)}</g>
}
