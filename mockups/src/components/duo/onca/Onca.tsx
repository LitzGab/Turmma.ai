import { useEffect, useId, useState, type ReactNode } from 'react'
import { ONCA, PINTA_PATH } from './paleta'
import type { PoseOnca } from './tipos'
import { Boca, Focinho, Mascara, Olhos, Orelha, Rosetas, type TipoBoca, type TipoOlhos } from './partes'
import { CABECA_D, CORPO_D, OMBRO_D, OMBRO_E, ROSETAS, type Roseta } from './geometria'
import './onca.css'

/* A ONÇA DO TURMMA (sistema-turmma-duolingo.md, seção 4). O rosto das IAs, desenhado na gramática do Duolingo:
   três formas, nenhuma ponta, sem contorno, uma sombra chapada e a sombra do chão em pílula.
   Nunca agressiva: sem dente, sem garra, sem sobrancelha franzida, sem boca de rugido.

   Cada pose gira grupos (transform em atributo, com o ponto de giro explícito) e troca só olhos e boca.
   A animação mora num grupo de dentro (classe .onca-*), para o CSS não apagar o giro da pose. */

type Giro = string | undefined
/** A mão: 'creme' quando cai em cima do corpo; 'punho' (círculo da cor da pata, com a almofada creme) quando sai da silhueta. */
type Mao = 'creme' | 'punho'

type Config = {
  figura?: Giro // tudo menos a sombra do chão; giro na base
  rosto?: Giro
  orelhaE?: Giro
  orelhaD?: Giro
  pataE?: Giro
  pataD?: Giro
  pataLonga?: boolean // o braço esticado de 26 × 64 (apontando)
  maoE?: Mao
  maoD?: Mao
  peE?: Giro
  peD?: Giro
  sombraChao?: Giro
  ladoSombra?: boolean // o lado de trás em 3/4
  cauda: string
  olhos: TipoOlhos
  boca: TipoBoca
  extra?: (p: { pontos: boolean }) => ReactNode
}

const giro = (a: number, o: { x: number; y: number }) => `rotate(${a} ${o.x} ${o.y})`

const CAUDA_BASE = 'M196 196 C226 192 230 160 214 140'

const POSES: Record<Exclude<PoseOnca, 'dormindo'>, Config> = {
  acenando: {
    figura: 'rotate(-4 120 220)',
    pataD: `translate(30 -16) ${giro(-150, OMBRO_D)}`,
    maoD: 'punho',
    peE: 'rotate(-15 98 213)',
    cauda: 'M196 196 C230 190 234 140 214 124 C202 114 190 126 198 136',
    olhos: 'frente',
    boca: 'aberta',
    extra: () => (
      <g data-parte="movimento" fill="none" stroke={ONCA.sombra} strokeWidth={5} strokeLinecap="round">
        <path d="M212 88 Q222 96 223 108" />
        <path d="M220 72 Q236 86 235 106" />
      </g>
    ),
  },
  comemorando: {
    figura: 'translate(0 -10) scale(1 1.06)',
    sombraChao: 'translate(120 228) scale(.8 1) translate(-120 -228)',
    pataE: `translate(-30 -16) ${giro(150, OMBRO_E)}`,
    pataD: `translate(30 -16) ${giro(-150, OMBRO_D)}`,
    maoE: 'punho',
    maoD: 'punho',
    peE: 'translate(-4 4) rotate(-12 78 213)',
    peD: 'translate(4 4) rotate(12 162 213)',
    cauda: 'M196 198 C232 196 204 160 226 138',
    olhos: 'feliz',
    boca: 'muito-aberta',
  },
  pensando: {
    rosto: 'rotate(8 120 120)',
    orelhaE: 'rotate(8 120 120) translate(0 -2)',
    orelhaD: 'rotate(8 120 120) translate(0 4)',
    pataD: giro(116, OMBRO_D),
    maoD: 'creme',
    cauda: CAUDA_BASE,
    olhos: 'pensando',
    boca: 'lado',
    extra: ({ pontos }) => (
      <g data-parte="balao">
        <circle cx={182} cy={54} r={5} fill={ONCA.realce} />
        <rect x={178} y={14} width={58} height={30} rx={15} fill={ONCA.realce} />
        <g className={pontos ? 'onca-pontos' : undefined} fill={ONCA.olho}>
          <circle cx={194} cy={29} r={4.5} />
          <circle cx={207} cy={29} r={4.5} />
          <circle cx={220} cy={29} r={4.5} />
        </g>
      </g>
    ),
  },
  apontando: {
    rosto: 'translate(9 0)',
    orelhaE: 'translate(12 8)',
    orelhaD: 'translate(4 0)',
    pataD: `translate(14 -6) ${giro(-90, OMBRO_D)}`,
    pataLonga: true,
    maoD: 'punho',
    ladoSombra: true,
    cauda: 'M196 196 C224 196 226 170 216 152',
    olhos: 'lado',
    boca: 'sorriso',
  },
  acolhendo: {
    figura: 'translate(0 9) scale(1 .96)',
    rosto: 'rotate(-5 120 120)',
    orelhaE: 'rotate(-5 120 120)',
    orelhaD: 'rotate(-5 120 120)',
    pataE: giro(-68, OMBRO_E),
    pataD: giro(68, OMBRO_D),
    cauda: CAUDA_BASE,
    olhos: 'acolhendo',
    boca: 'leve',
  },
}

/** Lê e grava "já acenou nesta sessão" sem quebrar no modo privado. */
function jaAcenou(): boolean {
  try {
    if (sessionStorage.getItem('turmma-onca-acenou')) return true
    sessionStorage.setItem('turmma-onca-acenou', '1')
    return false
  } catch {
    return false
  }
}

const reduzMovimento = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Pisca ao acaso a cada 3 a 6 s, no máximo 4 vezes; `ciclo` recomeça a conta. */
function usePiscar(ligado: boolean, ciclo: unknown) {
  const [piscando, setPiscando] = useState(false)
  useEffect(() => {
    if (!ligado || reduzMovimento()) return
    let n = 0
    let t: ReturnType<typeof setTimeout>
    let fim: ReturnType<typeof setTimeout>
    const agenda = () => {
      t = setTimeout(() => {
        setPiscando(true)
        fim = setTimeout(() => setPiscando(false), 160)
        n += 1
        if (n < 4) agenda()
      }, 3000 + Math.random() * 3000)
    }
    agenda()
    return () => { clearTimeout(t); clearTimeout(fim) }
  }, [ligado, ciclo])
  return piscando
}

export function Onca({ pose = 'acenando', tamanho = 120, animada = true, espelhada = false, rotulo, className, acordar }: {
  pose?: PoseOnca; tamanho?: number; animada?: boolean; espelhada?: boolean; rotulo?: string; className?: string; acordar?: unknown
}) {
  const uid = 'onca' + useId().replace(/[^a-zA-Z0-9-]/g, '')
  const [gesto, setGesto] = useState(0)
  const [acena, setAcena] = useState(false)
  const piscaLigado = animada && pose !== 'dormindo' && pose !== 'comemorando'
  const piscando = usePiscar(piscaLigado, `${gesto}|${String(acordar)}|${pose}`)

  useEffect(() => {
    if (pose !== 'acenando' || !animada || reduzMovimento()) return
    // sincroniza com o sessionStorage (sistema externo): acena só na primeira onça da sessão
    // oxlint-disable-next-line react/set-state-in-effect
    if (!jaAcenou()) setAcena(true)
  }, [pose, animada])

  const pequena = tamanho < 72
  const a11y = rotulo ? { role: 'img' as const, 'aria-label': rotulo } : { 'aria-hidden': true as const }
  const acordarGesto = () => setGesto((g) => g + 1)

  return (
    <svg
      viewBox="0 0 240 240"
      width={tamanho}
      height={tamanho}
      className={['onca', animada ? 'onca-animada' : '', piscando ? 'onca-pisca' : '', className ?? ''].filter(Boolean).join(' ')}
      onPointerEnter={acordarGesto}
      onFocus={acordarGesto}
      {...a11y}
    >
      <defs>
        <path id={`${uid}-pinta`} fillRule="evenodd" d={PINTA_PATH} />
      </defs>
      <g transform={espelhada ? 'translate(240 0) scale(-1 1)' : undefined}>
        {pose === 'dormindo'
          ? <Dormindo uid={uid} pequena={pequena} />
          : <Sentada uid={uid} c={POSES[pose]} pequena={pequena} animada={animada} acena={acena} comemora={pose === 'comemorando' && animada} />}
      </g>
    </svg>
  )
}

function Cauda({ d, pequena, ponta = true }: { d: string; pequena: boolean; ponta?: boolean }) {
  const fim = d.trim().split(/[\s,CML]+/).filter(Boolean).slice(-2).map(Number)
  return (
    <g data-parte="cauda">
      <path d={d} fill="none" stroke={ONCA.pelagem} strokeWidth={16} strokeLinecap="round" />
      {!pequena && (
        <path d={d} fill="none" stroke={ONCA.roseta} strokeWidth={16} strokeLinecap="butt" strokeDasharray="0 40 6 10 6 400" />
      )}
      {ponta && <circle cx={fim[0]} cy={fim[1]} r={8} fill={ONCA.roseta} />}
    </g>
  )
}

function Pata({ lado, transform, longa, mao, classe }: { lado: 'e' | 'd'; transform?: string; longa?: boolean; mao?: Mao; classe?: string }) {
  const o = lado === 'e' ? OMBRO_E : OMBRO_D
  const h = longa ? 64 : 54
  return (
    <g data-parte={`pata-${lado}`} transform={transform}>
      <g className={classe}>
        <rect x={o.x - 13} y={160} width={26} height={h} rx={13} fill={ONCA.sombra} />
        {mao === 'creme' && <circle cx={o.x} cy={160 + h - 12} r={14} fill={ONCA.creme} />}
        {mao === 'punho' && (
          <>
            <circle cx={o.x} cy={160 + h - 12} r={16} fill={ONCA.sombra} />
            <circle cx={o.x} cy={160 + h - 10} r={7} fill={ONCA.creme} />
          </>
        )}
      </g>
    </g>
  )
}

function Sentada({ uid, c, pequena, animada, acena, comemora }: {
  uid: string; c: Config; pequena: boolean; animada: boolean; acena: boolean; comemora: boolean
}) {
  const clip = `${uid}-corpo`
  const rosetas: Roseta[] = pequena ? ROSETAS.slice(0, 3) : ROSETAS
  return (
    <>
      <defs><clipPath id={clip}><path d={CORPO_D} /></clipPath></defs>
      <g data-parte="sombra" transform={c.sombraChao}>
        <rect x={50} y={222} width={140} height={12} rx={6} style={{ fill: ONCA.chao }} />
      </g>
      <g data-parte="corpo" transform={c.figura}>
        <g className={comemora ? 'onca-comemora' : animada ? 'onca-entra' : undefined}>
          <Cauda d={c.cauda} pequena={pequena} />
          <g transform={c.orelhaE}><Orelha lado="e" /></g>
          <g transform={c.orelhaD}><Orelha lado="d" /></g>
          <path d={CORPO_D} fill={ONCA.pelagem} />
          {c.ladoSombra && (
            <g clipPath={`url(#${clip})`}><rect x={30} y={40} width={22} height={180} fill={ONCA.sombra} /></g>
          )}
          <Rosetas pinta={`${uid}-pinta`} clip={clip} lista={rosetas} />
          <g data-parte="barriga">
            <rect x={84} y={150} width={72} height={62} rx={30} fill={ONCA.creme} />
            <use href={`#${uid}-pinta`} transform="translate(120 180) scale(.03)" fill={ONCA.pelagem} />
          </g>
          <g data-parte="rosto" transform={c.rosto}>
            <Mascara />
            <Olhos tipo={c.olhos} uid={uid} classe="onca-olho" />
            <Focinho />
            <Boca tipo={c.boca} uid={uid} />
          </g>
          <Pata lado="e" transform={c.pataE} mao={c.maoE} />
          <Pata lado="d" transform={c.pataD} longa={c.pataLonga} mao={c.maoD} classe={acena ? 'onca-acena' : undefined} />
          <g data-parte="pe-e" transform={c.peE}><rect x={58} y={204} width={40} height={18} rx={9} fill={ONCA.creme} /></g>
          <g data-parte="pe-d" transform={c.peD}><rect x={142} y={204} width={40} height={18} rx={9} fill={ONCA.creme} /></g>
          {c.extra?.({ pontos: animada })}
        </g>
      </g>
    </>
  )
}

/* DORMINDO: o corpo vira uma pílula de 180 × 96, a cabeça (a mesma, em escala) apoiada nas patas,
   a cauda dando a volta pela frente e um "z" pequeno e parado. Nunca "volte amanhã". */

function Dormindo({ uid, pequena }: { uid: string; pequena: boolean }) {
  const clip = `${uid}-deitada`
  const clipCab = `${uid}-cabeca`
  const lombo: Roseta[] = pequena
    ? [{ x: 150, y: 140, r: 20, s: 0.024 }, { x: 206, y: 176, r: -30, s: 0.022 }]
    : [{ x: 146, y: 138, r: 20, s: 0.024 }, { x: 200, y: 150, r: -50, s: 0.022 }, { x: 178, y: 196, r: 110, s: 0.02 }, { x: 226, y: 200, r: 60, s: 0.02 }]
  return (
    <>
      <defs>
        <clipPath id={clip}><rect x={48} y={124} width={180} height={96} rx={48} /></clipPath>
        <clipPath id={clipCab}><path d={CABECA_D} /></clipPath>
      </defs>
      <g data-parte="sombra"><rect x={22} y={220} width={208} height={12} rx={6} style={{ fill: ONCA.chao }} /></g>
      <g data-parte="corpo">
        <rect x={48} y={124} width={180} height={96} rx={48} fill={ONCA.pelagem} />
        <Rosetas pinta={`${uid}-pinta`} clip={clip} lista={lombo} />
        <Cauda d="M222 196 C236 222 190 224 150 218" pequena={pequena} />
        <g data-parte="pata-e"><rect x={22} y={200} width={74} height={20} rx={10} fill={ONCA.sombra} /></g>
        <g data-parte="pata-d"><rect x={60} y={204} width={74} height={16} rx={8} fill={ONCA.sombra} /></g>
        <g data-parte="rosto" transform="translate(-6 94) scale(.66)">
          <Orelha lado="e" />
          <Orelha lado="d" />
          <path d={CABECA_D} fill={ONCA.sombra} transform="translate(12 6)" />
          <path d={CABECA_D} fill={ONCA.pelagem} />
          <Rosetas pinta={`${uid}-pinta`} clip={clipCab} lista={[ROSETAS[0]]} />
          <Mascara />
          <Olhos tipo="dormindo" uid={uid} />
          <Focinho />
          <Boca tipo="fechada" uid={uid} />
        </g>
        <path data-parte="z" d="M150 70 H170 L150 92 H170" fill="none" stroke={ONCA.sombra} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  )
}
