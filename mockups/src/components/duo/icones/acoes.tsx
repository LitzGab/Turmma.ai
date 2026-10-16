import type { IconeAcaoId } from './ids'
import { type Desenho } from './base'
import { TONS } from './forma'

/* Ações. O "mais" é multicolorido de propósito: 4 quadradinhos laranja, azul, verde e roxo. */

export const ACOES: Record<IconeAcaoId, Desenho> = {
  mais: () => (
    <>
      <rect x={5} y={5} width={17} height={17} rx={5} fill={TONS.laranja.face} />
      <rect x={26} y={5} width={17} height={17} rx={5} fill={TONS.azul.face} />
      <rect x={5} y={26} width={17} height={17} rx={5} fill={TONS.verde.face} />
      <rect x={26} y={26} width={17} height={17} rx={5} fill={TONS.roxo.face} />
    </>
  ),
}
