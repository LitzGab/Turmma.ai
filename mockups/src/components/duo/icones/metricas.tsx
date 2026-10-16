import type { IconeMetricaId } from './ids'
import { Balao, Letra, Traco, Visto, type Desenho } from './base'
import { B, ESCUDO, LINHA } from './forma'

/* Métricas dos cartões de número. */

export const METRICAS: Record<IconeMetricaId, Desenho> = {
  // mochila
  alunos: (c) => (
    <>
      <rect x={17} y={3} width={14} height={11} rx={5.5} fill={c.degrau} />
      <rect x={20.5} y={6.5} width={7} height={6} rx={3} fill={B} />
      <rect x={8} y={10} width={32} height={34} rx={10} fill={c.face} />
      <rect x={13} y={27} width={22} height={13} rx={5} fill={c.degrau} />
      <rect x={20} y={30} width={8} height={4} rx={2} fill={B} />
    </>
  ),
  // balão com ?
  tutor: (c) => (
    <>
      <Balao cor={c.face} />
      <Letra x={24} y={28} t="?" tam={22} />
    </>
  ),
  // escudo com visto
  aprovado: (c) => (
    <>
      <path d={ESCUDO} fill={c.face} />
      <path d="M24 4.5 C29 7.5 34.5 9 40 9 Q42 9 42 11 V23 C42 33 34 40.5 25.2 43.6 Q24 44 24 43.6 Z" fill={c.degrau} />
      <Visto x={16} y={23} s={1.05} />
    </>
  ),
  // alvo
  acerto: (c) => (
    <>
      <circle cx={24} cy={24} r={20} fill={c.face} />
      <circle cx={24} cy={24} r={13.5} fill={B} />
      <circle cx={24} cy={24} r={8} fill={c.face} />
      <circle cx={24} cy={24} r={3} fill={B} />
    </>
  ),
  // medidor
  pacote: (c) => (
    <>
      <Traco d="M8 34 A16 16 0 0 1 40 34" cor={LINHA} e={9} />
      <Traco d="M8 34 A16 16 0 0 1 33.5 21" cor={c.face} e={9} />
      <Traco d="M24 34 L32 22" cor={c.degrau} e={4.5} />
      <circle cx={24} cy={34} r={5.5} fill={c.degrau} />
    </>
  ),
  // pilha de folhas com visto
  corrigidas: (c) => (
    <>
      <rect x={12} y={3} width={28} height={34} rx={6} fill={c.degrau} transform="rotate(8 26 20)" />
      <rect x={8} y={8} width={28} height={36} rx={6} fill={c.face} />
      <rect x={13} y={14} width={13} height={4} rx={2} fill={B} />
      <Visto x={14} y={29} s={1.05} />
    </>
  ),
}
