import type { IconeFilaId } from './ids'
import { Balao, Mais, Pessoa, Relogio, Traco, Tri, Visto, Xis, type Desenho } from './base'
import { B, ESCUDO, TONS } from './forma'

/* Tipos de item da fila "Esperando você" (tabela 2.1.5). */

const CORACAO = 'M24 29.5 C18.5 26 14.5 22.8 14.5 18.6 C14.5 15.6 16.8 13.4 19.6 13.4 C21.6 13.4 23.1 14.5 24 16.2 C24.9 14.5 26.4 13.4 28.4 13.4 C31.2 13.4 33.5 15.6 33.5 18.6 C33.5 22.8 29.5 26 24 29.5 Z'

export const FILA: Record<IconeFilaId, Desenho> = {
  // coração dentro de um balão
  atencao: (c) => (
    <>
      <Balao cor={c.face} />
      <path d={CORACAO} fill={B} />
    </>
  ),
  // folha de prova com visto
  notas: (c) => (
    <>
      <rect x={7} y={4} width={30} height={39} rx={6} fill={c.face} />
      <rect x={12} y={10} width={14} height={4} rx={2} fill={B} />
      <rect x={12} y={18} width={20} height={4} rx={2} fill={B} />
      <rect x={12} y={26} width={10} height={4} rx={2} fill={B} />
      <circle cx={35} cy={35} r={10} fill={TONS.verde.face} />
      <Visto x={29.5} y={35} s={0.85} e={4} />
    </>
  ),
  // lâmpada
  sinal: (c) => (
    <>
      <circle cx={24} cy={19} r={14} fill={c.face} />
      <rect x={17} y={26} width={14} height={9} rx={3} fill={c.face} />
      <rect x={17} y={34} width={14} height={5} rx={2.5} fill={c.degrau} />
      <rect x={19.5} y={39} width={9} height={5} rx={2.5} fill={c.degrau} />
      <rect x={15} y={11} width={5} height={10} rx={2.5} fill={B} transform="rotate(25 17.5 16)" />
    </>
  ),
  // pessoa com +
  pedidos: (c) => (
    <>
      <Pessoa x={18} y={13} s={1.15} cor={c.face} />
      <circle cx={36} cy={33} r={10} fill={c.degrau} />
      <Mais cx={36} cy={33} />
    </>
  ),
  // folha com 2 controles deslizantes
  adaptada: (c) => (
    <>
      <rect x={7} y={4} width={34} height={40} rx={6} fill={c.face} />
      <rect x={12} y={14} width={24} height={5} rx={2.5} fill={B} />
      <rect x={12} y={29} width={24} height={5} rx={2.5} fill={B} />
      <circle cx={19} cy={16.5} r={5.5} fill={c.degrau} />
      <circle cx={30} cy={31.5} r={5.5} fill={c.degrau} />
    </>
  ),
  // lousa com visto
  turma: (c) => (
    <>
      <rect x={10} y={32} width={4.5} height={12} rx={2.25} fill={c.degrau} />
      <rect x={33.5} y={32} width={4.5} height={12} rx={2.25} fill={c.degrau} />
      <rect x={4} y={6} width={40} height={28} rx={6} fill={c.face} />
      <rect x={14} y={30} width={20} height={5} rx={2.5} fill={c.degrau} />
      <Visto x={16} y={19} s={1.1} />
    </>
  ),
  // bandeira
  aviso: (c) => (
    <>
      <rect x={8} y={4} width={5} height={40} rx={2.5} fill={c.degrau} />
      <path d="M12 9 a4 4 0 0 1 4 -4 H38 Q42 5 40 8.5 L35.5 15.5 L40 22.5 Q42 26 38 26 H12 Z" fill={c.face} />
    </>
  ),
  // pessoa com ×
  contestacao: (c) => (
    <>
      <Pessoa x={18} y={13} s={1.15} cor={c.face} />
      <circle cx={36} cy={33} r={10} fill={TONS.vermelho.face} />
      <Xis cx={36} cy={33} r={3.8} />
    </>
  ),
  // barras com seta
  alerta: (c) => (
    <>
      <rect x={6} y={30} width={9} height={14} rx={3} fill={c.face} />
      <rect x={19.5} y={23} width={9} height={21} rx={3} fill={c.face} />
      <rect x={33} y={16} width={9} height={28} rx={3} fill={c.face} />
      <Traco d="M7 21 L18 12 L25 16 L36 7" cor={c.degrau} e={4.5} />
      <Tri pts={[[30, 4.5], [41, 3], [39, 13.5]]} r={2} fill={c.degrau} />
    </>
  ),
  // livro com ×
  'material-falhou': (c) => (
    <>
      <rect x={8} y={4} width={32} height={40} rx={6} fill={c.face} />
      <rect x={8} y={4} width={9} height={40} rx={4.5} fill={c.degrau} />
      <rect x={17} y={36} width={23} height={4} rx={2} fill={B} />
      <Xis cx={28.5} cy={20} r={5.5} e={4.5} />
    </>
  ),
  // envelope com relógio
  convite: (c) => (
    <>
      <rect x={3} y={9} width={36} height={28} rx={6} fill={c.face} />
      <Tri pts={[[5, 12], [37, 12], [21, 26]]} r={4} fill={c.degrau} />
      <Relogio cx={36} cy={35} r={11} aro={TONS.vermelho.face} ponteiro={TONS.vermelho.degrau} />
    </>
  ),
  // pasta com escudo
  dossie: (c) => (
    <>
      <path d="M4 13 a5 5 0 0 1 5 -5 h9 a4 4 0 0 1 3.2 1.6 l2 2.4 H39 a5 5 0 0 1 5 5 V38 a5 5 0 0 1 -5 5 H9 a5 5 0 0 1 -5 -5 Z" fill={c.degrau} />
      <rect x={4} y={17} width={40} height={26} rx={5} fill={c.face} />
      <path d={ESCUDO} fill={B} transform="translate(14.5 18) scale(.4)" />
    </>
  ),
  // pasta com cadeado: o pedido do titular sobre os próprios dados (LGPD, art. 18)
  titular: (c) => (
    <>
      <path d="M4 13 a5 5 0 0 1 5 -5 h9 a4 4 0 0 1 3.2 1.6 l2 2.4 H39 a5 5 0 0 1 5 5 V38 a5 5 0 0 1 -5 5 H9 a5 5 0 0 1 -5 -5 Z" fill={c.degrau} />
      <rect x={4} y={17} width={40} height={26} rx={5} fill={c.face} />
      <Traco d="M19.5 28 V24.5 a4.5 4.5 0 0 1 9 0 V28" cor={B} e={3.5} />
      <rect x={16} y={27} width={16} height={12} rx={3} fill={B} />
      <circle cx={24} cy={32.2} r={2.2} fill={c.degrau} />
      <rect x={22.9} y={33} width={2.2} height={3.6} rx={1.1} fill={c.degrau} />
    </>
  ),
}
