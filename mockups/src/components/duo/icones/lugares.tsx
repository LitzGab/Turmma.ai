import type { IconeLugarId } from './ids'
import { Pessoa, Tri, Visto, type Desenho } from './base'
import { B, ESCUDO, LINHA, PAPEL, TONS } from './forma'

/* Lugares da navegação: Início, Tarefas, Eu, Avisar, Turmas, Agenda, Criados, Escola, IA, Registros, Rede, Painel. */

export const LUGARES: Record<IconeLugarId, Desenho> = {
  // casa com telhado de triângulo arredondado e porta em pílula
  inicio: (c) => (
    <>
      <rect x={10} y={20} width={28} height={23} rx={5} fill={c.face} />
      <Tri pts={[[4, 24], [24, 6], [44, 24]]} r={4} fill={c.degrau} />
      <rect x={19.5} y={29} width={9} height={14} rx={4.5} fill={B} />
    </>
  ),
  // prancheta com um visto
  tarefas: (c) => (
    <>
      <rect x={8} y={7} width={32} height={37} rx={7} fill={c.face} />
      <rect x={13} y={13} width={22} height={26} rx={4} fill={B} />
      <rect x={16} y={3.5} width={16} height={8} rx={4} fill={c.degrau} />
      <Visto x={17.5} y={25.5} cor={TONS.verde.face} />
    </>
  ),
  // carteirinha com o círculo do rosto e 2 linhas
  eu: (c) => (
    <>
      <rect x={4} y={10} width={40} height={30} rx={7} fill={c.face} />
      <rect x={19} y={6} width={10} height={8} rx={3} fill={c.degrau} />
      <circle cx={15.5} cy={25} r={6.5} fill={B} />
      <rect x={26} y={20} width={13} height={4} rx={2} fill={B} />
      <rect x={26} y={27} width={9} height={4} rx={2} fill={c.claro} />
    </>
  ),
  // mão aberta erguida com um balãozinho
  avisar: (c) => (
    <>
      <rect x={9} y={21} width={23} height={23} rx={9} fill={c.face} />
      {[[9, 13, 14], [14.5, 9, 18], [20, 10, 17], [25.5, 14, 14]].map(([x, y, h]) => (
        <rect key={x} x={x} y={y} width={5.5} height={h} rx={2.75} fill={c.face} />
      ))}
      <rect x={1} y={27} width={14} height={6} rx={3} fill={c.face} transform="rotate(40 8 30)" />
      <rect x={29} y={3} width={17} height={13} rx={6.5} fill={c.degrau} />
      <Tri pts={[[32, 13], [38, 13], [31, 20]]} r={1.5} fill={c.degrau} />
      <circle cx={34.5} cy={9.5} r={1.8} fill={B} />
      <circle cx={40.5} cy={9.5} r={1.8} fill={B} />
    </>
  ),
  // três cabeças em fila (a do meio na frente)
  turmas: (c) => (
    <>
      <Pessoa x={11} y={15} s={0.85} cor={c.degrau} />
      <Pessoa x={37} y={15} s={0.85} cor={c.degrau} />
      <Pessoa x={24} y={14} s={1.1} cor={c.face} />
    </>
  ),
  // calendário com argolas e um dia marcado
  agenda: (c) => (
    <>
      <rect x={5} y={9} width={38} height={35} rx={7} fill={PAPEL} />
      <path d="M5 16 a7 7 0 0 1 7 -7 h24 a7 7 0 0 1 7 7 v4 H5 Z" fill={c.face} />
      <rect x={13} y={4} width={5} height={10} rx={2.5} fill={c.degrau} />
      <rect x={30} y={4} width={5} height={10} rx={2.5} fill={c.degrau} />
      {[[10, 25], [18, 25], [26, 25], [10, 33], [18, 33]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={5} height={5} rx={1.5} fill={LINHA} />
      ))}
      <circle cx={32} cy={35} r={6} fill={c.face} />
    </>
  ),
  // pasta com 2 folhas
  criados: (c) => (
    <>
      <path d="M4 14 a5 5 0 0 1 5 -5 h9 a4 4 0 0 1 3.2 1.6 l2 2.4 H39 a5 5 0 0 1 5 5 V38 a5 5 0 0 1 -5 5 H9 a5 5 0 0 1 -5 -5 Z" fill={c.degrau} />
      <g transform="rotate(-10 20 18)">
        <rect x={10} y={5} width={20} height={24} rx={4} fill={PAPEL} />
        <rect x={14} y={10} width={11} height={3.5} rx={1.75} fill={LINHA} />
      </g>
      <g transform="rotate(8 29 20)">
        <rect x={19} y={7} width={20} height={24} rx={4} fill={B} />
        <rect x={19} y={7} width={20} height={24} rx={4} fill={PAPEL} />
        <rect x={23} y={12} width={12} height={3.5} rx={1.75} fill={LINHA} />
      </g>
      <rect x={4} y={21} width={40} height={22} rx={5} fill={c.face} />
    </>
  ),
  // prédio com bandeirinha
  escola: (c) => (
    <>
      <rect x={23} y={2} width={3.5} height={12} rx={1.75} fill={c.degrau} />
      <rect x={25} y={2.5} width={11} height={7} rx={2.5} fill={TONS.vermelho.face} />
      <Tri pts={[[4, 22], [24, 10], [44, 22]]} r={4} fill={c.degrau} />
      <rect x={8} y={19} width={32} height={25} rx={4} fill={c.face} />
      <rect x={12} y={25} width={6} height={6} rx={2} fill={B} />
      <rect x={30} y={25} width={6} height={6} rx={2} fill={B} />
      <rect x={19.5} y={30} width={9} height={14} rx={4.5} fill={B} />
    </>
  ),
  // escudo com visto
  ia: (c) => (
    <>
      <path d={ESCUDO} fill={c.face} />
      <path d="M24 4.5 C29 7.5 34.5 9 40 9 Q42 9 42 11 V23 C42 33 34 40.5 25.2 43.6 Q24 44 24 43.6 Z" fill={c.degrau} />
      <Visto x={16} y={23} s={1.05} />
    </>
  ),
  // gaveta de arquivo
  registros: (c) => (
    <>
      <rect x={7} y={4} width={34} height={40} rx={7} fill={c.face} />
      <rect x={11} y={9} width={26} height={14} rx={4} fill={c.degrau} />
      <rect x={11} y={26} width={26} height={14} rx={4} fill={c.degrau} />
      <rect x={19} y={14} width={10} height={4} rx={2} fill={B} />
      <rect x={19} y={31} width={10} height={4} rx={2} fill={B} />
    </>
  ),
  // prédio público de 3 colunas
  rede: (c) => (
    <>
      <Tri pts={[[3, 17], [24, 4], [45, 17]]} r={4} fill={c.face} />
      <rect x={6} y={15} width={36} height={6} rx={3} fill={c.degrau} />
      {[10, 21, 32].map((x) => <rect key={x} x={x} y={22} width={6} height={15} rx={2} fill={c.face} />)}
      <rect x={4} y={37} width={40} height={7} rx={3.5} fill={c.degrau} />
    </>
  ),
  // painel: um cartão com três barras (14ª rodada; coordenação e secretaria)
  painel: (c) => (
    <>
      <rect x={4} y={6} width={40} height={36} rx={8} fill={c.face} />
      <rect x={9} y={11} width={30} height={26} rx={5} fill={B} />
      <rect x={13} y={25} width={6} height={9} rx={2} fill={c.degrau} />
      <rect x={21} y={16} width={6} height={18} rx={2} fill={c.face} />
      <rect x={29} y={21} width={6} height={13} rx={2} fill={TONS.amarelo.face} />
    </>
  ),
}
