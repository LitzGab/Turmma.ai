/* As medidas da onça no quadro de 240 (sistema-turmma-duolingo.md, 4.2). */

/** Corpo e cabeça numa forma só: cantos de 70 em cima e 44 embaixo, x 36–204, y 44–216. */
export const CORPO_D = 'M106 44 H134 A70 70 0 0 1 204 114 V172 A44 44 0 0 1 160 216 H80 A44 44 0 0 1 36 172 V114 A70 70 0 0 1 106 44 Z'

/** Só a cabeça (o mesmo topo, com os cantos de baixo em y 176): avatar e onça dormindo. */
export const CABECA_D = 'M106 44 H134 A70 70 0 0 1 204 114 V132 A44 44 0 0 1 160 176 H80 A44 44 0 0 1 36 132 V114 A70 70 0 0 1 106 44 Z'

/** Os ombros (ponto de giro das patas): o centro da ponta de cima de cada pílula. */
export const OMBRO_E = { x: 75, y: 173 }
export const OMBRO_D = { x: 165, y: 173 }

/** Uma roseta: a pinta da marca girada. `s` é a escala (0,020 a 0,024 no corpo). */
export type Roseta = { x: number; y: number; r: number; s: number }

export const ROSETAS: Roseta[] = [
  { x: 120, y: 62, r: 0, s: 0.022 }, // testa
  { x: 46, y: 136, r: 30, s: 0.024 }, // flanco esquerdo
  { x: 196, y: 128, r: -40, s: 0.022 }, // flanco direito
  { x: 50, y: 194, r: 80, s: 0.02 }, // quadril esquerdo
  { x: 192, y: 188, r: 140, s: 0.02 }, // quadril direito
]
