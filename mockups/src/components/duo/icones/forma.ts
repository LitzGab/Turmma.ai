import { NEUTRO, TONS } from '../onca/paleta'

/* Constantes e contas dos ícones (sem componentes, para o recarregamento rápido do Vite). */

export const B = NEUTRO.branco
export const PAPEL = NEUTRO.papel
export const LINHA = NEUTRO.linha
export { TONS }

/** Triângulo de cantos redondos: cada canto vira uma curva que começa `r` antes do vértice. */
export function tri(pts: [number, number][], r = 3): string {
  const n = pts.length
  const ponto = (a: [number, number], b: [number, number], d: number): [number, number] => {
    const dx = b[0] - a[0], dy = b[1] - a[1]
    const len = Math.hypot(dx, dy)
    return [a[0] + (dx / len) * d, a[1] + (dy / len) * d]
  }
  let d = ''
  for (let i = 0; i < n; i++) {
    const v = pts[i], ant = pts[(i + n - 1) % n], prox = pts[(i + 1) % n]
    const p1 = ponto(v, ant, r), p2 = ponto(v, prox, r)
    d += `${i === 0 ? 'M' : 'L'}${p1[0].toFixed(2)} ${p1[1].toFixed(2)} Q${v[0]} ${v[1]} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `
  }
  return d + 'Z'
}

/** Escudo de topo reto e base redonda. */
export const ESCUDO = 'M24 4.5 C29 7.5 34.5 9 40 9 Q42 9 42 11 V23 C42 33 34 40.5 25.2 43.6 Q24 44 22.8 43.6 C14 40.5 6 33 6 23 V11 Q6 9 8 9 C13.5 9 19 7.5 24 4.5 Z'
