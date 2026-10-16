import type { IconeTarefaId } from './ids'
import { Relogio, Tri, type Desenho } from './base'
import { B, TONS } from './forma'

/* Tarefas do aluno. Pintam com a cor da matéria quando vêm com `familia`. */

export const TAREFAS: Record<IconeTarefaId, Desenho> = {
  // folha com relógio
  prova: (c) => (
    <>
      <rect x={6} y={4} width={30} height={39} rx={6} fill={c.face} />
      <rect x={11} y={10} width={14} height={4} rx={2} fill={B} />
      <rect x={11} y={18} width={20} height={4} rx={2} fill={B} />
      <rect x={11} y={26} width={10} height={4} rx={2} fill={B} />
      <Relogio cx={35} cy={35} r={10.5} aro={c.degrau} ponteiro={c.degrau} />
    </>
  ),
  // folha com lápis
  lista: (c) => (
    <>
      <rect x={6} y={4} width={30} height={39} rx={6} fill={c.face} />
      <rect x={11} y={10} width={20} height={4} rx={2} fill={B} />
      <rect x={11} y={18} width={20} height={4} rx={2} fill={B} />
      <rect x={11} y={26} width={12} height={4} rx={2} fill={B} />
      <g transform="rotate(40 36 30)">
        <rect x={31} y={12} width={10} height={26} rx={3.5} fill={TONS.amarelo.face} />
        <rect x={31} y={12} width={10} height={6} rx={3} fill={TONS.rosa.face} />
        <Tri pts={[[31.2, 36], [40.8, 36], [36, 45]]} r={2.5} fill={TONS.amarelo.degrau} />
      </g>
    </>
  ),
  // livro aberto
  leitura: (c) => (
    <>
      <rect x={3} y={33} width={42} height={8} rx={4} fill={c.degrau} />
      <path d="M4 12 a4 4 0 0 1 4.6 -4 C14 8.8 19 10.5 23 13.5 V38 C19 35 14 33.5 8.5 33 A4.5 4.5 0 0 1 4 28.5 Z" fill={c.face} />
      <path d="M44 12 a4 4 0 0 0 -4.6 -4 C34 8.8 29 10.5 25 13.5 V38 C29 35 34 33.5 39.5 33 A4.5 4.5 0 0 0 44 28.5 Z" fill={c.face} />
      <rect x={9} y={17} width={10} height={3.5} rx={1.75} fill={B} />
      <rect x={9} y={24} width={10} height={3.5} rx={1.75} fill={B} />
      <rect x={29} y={17} width={10} height={3.5} rx={1.75} fill={B} />
      <rect x={29} y={24} width={10} height={3.5} rx={1.75} fill={B} />
    </>
  ),
}
