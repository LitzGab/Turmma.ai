import type { IconeMateriaId } from './ids'
import { Balao, Letra, Mais, Pessoa, Traco, Tri, type Desenho } from './base'
import { B, TONS } from './forma'

/* Matérias (tabela 2.1.4). A cor ajuda; quem identifica é o desenho. P2: geografia, inglês, arte,
   educação física, filosofia e sociologia. */

export const MATERIAS: Record<IconeMateriaId, Desenho> = {
  // régua com +
  matematica: (c) => (
    <>
      <g transform="rotate(-45 22 28)">
        <rect x={2} y={22} width={40} height={13} rx={4} fill={c.face} />
        {[8, 15, 22, 29, 36].map((x, i) => (
          <rect key={x} x={x - 1.5} y={22} width={3} height={i % 2 ? 5 : 7.5} rx={1.5} fill={B} />
        ))}
      </g>
      <circle cx={36} cy={36} r={10} fill={c.degrau} />
      <Mais cx={36} cy={36} />
    </>
  ),
  // livro com Aa
  portugues: (c) => (
    <>
      <rect x={7} y={4} width={34} height={40} rx={6} fill={c.face} />
      <rect x={7} y={4} width={9} height={40} rx={4.5} fill={c.degrau} />
      <rect x={16} y={36} width={25} height={4} rx={2} fill={B} />
      <Letra x={28.5} y={28} t="Aa" tam={15} />
    </>
  ),
  // broto
  ciencias: (c) => (
    <>
      <rect x={21.5} y={14} width={5} height={22} rx={2.5} fill={c.degrau} />
      <rect x={6} y={12} width={18} height={10} rx={5} fill={c.face} transform="rotate(30 15 17)" />
      <rect x={24} y={5} width={19} height={11} rx={5.5} fill={c.face} transform="rotate(-30 33.5 10.5)" />
      <path d="M11 33 h26 l-3 9 a3 3 0 0 1 -2.9 2 H16.9 a3 3 0 0 1 -2.9 -2 Z" fill={TONS.amarelo.degrau} />
      <rect x={9} y={30} width={30} height={6} rx={3} fill={TONS.amarelo.face} />
    </>
  ),
  // célula
  biologia: (c) => (
    <>
      <circle cx={24} cy={24} r={20} fill={c.face} />
      <circle cx={27} cy={21} r={8} fill={c.degrau} />
      <rect x={10} y={27} width={9} height={4.5} rx={2.25} fill={B} transform="rotate(-20 14.5 29)" />
      <circle cx={30} cy={34} r={3} fill={B} />
      <circle cx={14} cy={17} r={2.5} fill={B} />
    </>
  ),
  // erlenmeyer com bolha
  quimica: (c) => (
    <>
      <path d="M18 9 H30 V17 L40.5 36 C42 39 40 43 36.5 43 H11.5 C8 43 6 39 7.5 36 L18 17 Z" fill={c.face} />
      <rect x={15} y={4} width={18} height={6} rx={3} fill={c.degrau} />
      <circle cx={21} cy={33} r={3.5} fill={B} />
      <circle cx={29} cy={27} r={2.5} fill={B} />
    </>
  ),
  // ímã em U
  fisica: (c) => (
    <>
      <Traco d="M14 12 V24 A10 10 0 0 0 34 24 V12" cor={c.face} e={11} />
      <rect x={8.5} y={4} width={11} height={10} rx={2.5} fill={c.degrau} />
      <rect x={28.5} y={4} width={11} height={10} rx={2.5} fill={c.degrau} />
      <rect x={10.5} y={6.5} width={7} height={4} rx={2} fill={B} />
      <rect x={30.5} y={6.5} width={7} height={4} rx={2} fill={B} />
    </>
  ),
  // ampulheta
  historia: (c) => (
    <>
      <Tri pts={[[11, 8], [37, 8], [24, 25]]} r={4} fill={c.face} />
      <Tri pts={[[24, 23], [37, 40], [11, 40]]} r={4} fill={c.face} />
      <Tri pts={[[16, 37], [32, 37], [24, 29]]} r={3} fill={B} />
      <rect x={8} y={3} width={32} height={6} rx={3} fill={c.degrau} />
      <rect x={8} y={39} width={32} height={6} rx={3} fill={c.degrau} />
    </>
  ),
  // globo
  geografia: (c) => (
    <>
      <circle cx={24} cy={24} r={20} fill={TONS.azul.face} />
      <rect x={9} y={11} width={16} height={11} rx={5.5} fill={c.face} />
      <rect x={14} y={19} width={9} height={13} rx={4.5} fill={c.face} />
      <rect x={27} y={24} width={12} height={10} rx={5} fill={c.face} />
      <rect x={28} y={9} width={7} height={5} rx={2.5} fill={c.face} />
    </>
  ),
  // balão com Hi
  ingles: (c) => (
    <>
      <Balao cor={c.face} />
      <Letra x={24} y={27} t="Hi" tam={17} />
    </>
  ),
  // paleta
  arte: (c) => (
    <>
      <path d="M24 4 C35 4 44 12 44 22 C44 28 40 31 35 30 C31 29.5 28.5 31.5 29.5 35 C30.5 38.5 29 44 24 44 C13 44 4 35 4 24 C4 13 13 4 24 4 Z" fill={c.face} />
      <circle cx={14} cy={20} r={4} fill={TONS.azul.face} />
      <circle cx={22} cy={12.5} r={4} fill={TONS.amarelo.face} />
      <circle cx={32} cy={14} r={4} fill={TONS.verde.face} />
      <circle cx={15} cy={32} r={4} fill={B} />
    </>
  ),
  // bola
  'educacao-fisica': (c) => (
    <>
      <circle cx={24} cy={24} r={20} fill={c.face} />
      <Traco d="M10 12 C18 18 18 30 10 36" cor={B} e={3.5} />
      <Traco d="M38 12 C30 18 30 30 38 36" cor={B} e={3.5} />
      <Traco d="M24 4 V44" cor={B} e={3.5} />
    </>
  ),
  // balão de pensamento
  filosofia: (c) => (
    <>
      <circle cx={17} cy={19} r={11} fill={c.face} />
      <circle cx={29} cy={15} r={12} fill={c.face} />
      <circle cx={34} cy={25} r={9} fill={c.face} />
      <circle cx={22} cy={27} r={9} fill={c.face} />
      <circle cx={10} cy={37} r={4.5} fill={c.face} />
      <circle cx={5} cy={44} r={2.5} fill={c.face} />
      {[18, 25, 32].map((x) => <circle key={x} cx={x} cy={21} r={2.4} fill={B} />)}
    </>
  ),
  // três pessoas
  sociologia: (c) => (
    <>
      <Pessoa x={10} y={23} s={0.78} cor={c.face} />
      <Pessoa x={38} y={23} s={0.78} cor={c.face} />
      <Pessoa x={24} y={11} s={0.78} cor={c.degrau} />
      <Traco d="M14 18 L20 14 M34 18 L28 14" cor={c.degrau} e={3.5} />
    </>
  ),
}

