import type { ReactNode } from 'react'
import type { TonsFamilia } from '../onca/paleta'
import { B, tri } from './forma'

/* A GRAMÁTICA DOS ÍCONES ILUSTRADOS (sistema-turmma-duolingo.md, 2.5).
   viewBox 48; só retângulo arredondado, círculo e triângulo arredondado; nada pontudo;
   sem contorno, sem degradê, sem sombra; 2 a 3 cores, a dominante na face da família;
   nenhuma peça menor que 3 px; papel branco só dentro de forma colorida (encostado no branco: #EFEFEF e linhas #D7D7D7).
   O visto, o "+" e o "×" são traços grossos de ponta redonda: a mesma forma da boca da onça, nunca um fio. */

export type Desenho = (c: TonsFamilia) => ReactNode



export const Tri = ({ pts, r, fill }: { pts: [number, number][]; r?: number; fill: string }) => <path d={tri(pts, r)} fill={fill} />

/** Traço grosso de ponta redonda (visto, mais, ×, ponteiro). */
export const Traco = ({ d, cor, e = 4 }: { d: string; cor: string; e?: number }) => (
  <path d={d} fill="none" stroke={cor} strokeWidth={e} strokeLinecap="round" strokeLinejoin="round" />
)

export const Visto = ({ x, y, s = 1, cor = B, e = 4.5 }: { x: number; y: number; s?: number; cor?: string; e?: number }) => (
  <Traco d={`M${x} ${y} l${4 * s} ${4 * s} l${8 * s} ${-9 * s}`} cor={cor} e={e} />
)

export const Mais = ({ cx, cy, r = 4.5, cor = B, e = 4 }: { cx: number; cy: number; r?: number; cor?: string; e?: number }) => (
  <Traco d={`M${cx - r} ${cy} H${cx + r} M${cx} ${cy - r} V${cy + r}`} cor={cor} e={e} />
)

export const Xis = ({ cx, cy, r = 4, cor = B, e = 4 }: { cx: number; cy: number; r?: number; cor?: string; e?: number }) => (
  <Traco d={`M${cx - r} ${cy - r} L${cx + r} ${cy + r} M${cx + r} ${cy - r} L${cx - r} ${cy + r}`} cor={cor} e={e} />
)

/** Relógio: aro, miolo branco e dois ponteiros. */
export const Relogio = ({ cx, cy, r = 10, aro, ponteiro }: { cx: number; cy: number; r?: number; aro: string; ponteiro: string }) => (
  <>
    <circle cx={cx} cy={cy} r={r} fill={aro} />
    <circle cx={cx} cy={cy} r={r - 3} fill={B} />
    <Traco d={`M${cx} ${cy - r * 0.42} V${cy} H${cx + r * 0.36}`} cor={ponteiro} e={3} />
  </>
)

/** Pessoa: cabeça redonda e ombros em meia pílula. */
export const Pessoa = ({ x, y, s = 1, cor }: { x: number; y: number; s?: number; cor: string }) => (
  <>
    <circle cx={x} cy={y} r={6.5 * s} fill={cor} />
    <path d={`M${x - 11 * s} ${y + 27 * s} V${y + 19 * s} a${9 * s} ${9 * s} 0 0 1 ${9 * s} ${-9 * s} h${4 * s} a${9 * s} ${9 * s} 0 0 1 ${9 * s} ${9 * s} V${y + 27 * s} Z`} fill={cor} />
  </>
)


/** Balão de fala: corpo e rabicho de triângulo arredondado. */
export const Balao = ({ cor, x = 5, y = 6, w = 38, h = 29 }: { cor: string; x?: number; y?: number; w?: number; h?: number }) => (
  <>
    <rect x={x} y={y} width={w} height={h} rx={11} fill={cor} />
    <Tri pts={[[x + 7, y + h - 4], [x + 18, y + h - 2], [x + 6, y + h + 9]]} r={2.5} fill={cor} />
  </>
)

/** Texto de rótulo dentro de uma forma (Aa, Hi, ?). Peso 800, na fonte do sistema. */
export const Letra = ({ x, y, t, tam, cor = B }: { x: number; y: number; t: string; tam: number; cor?: string }) => (
  <text x={x} y={y} textAnchor="middle" fontSize={tam} fontWeight={800} fill={cor}
    fontFamily='ui-sans-serif, -apple-system, system-ui, "Segoe UI", Roboto, sans-serif'>{t}</text>
)
