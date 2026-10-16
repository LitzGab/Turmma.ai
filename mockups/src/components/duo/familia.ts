import type { CSSProperties } from 'react'
import { useTema } from '@/dados/tema'

/* AS 10 FAMÍLIAS DE COR (11ª rodada, 04/10/2026; pesquisa/duolingo/sistema-turmma-duolingo.md, tabela 2.1.2).

   Cada família tem cinco tons: face (o preenchimento), degrau (a face com 20% de preto), claro (fundo de selo e de
   selecionado), borda (a borda do claro) e texto (para escrever no branco e no claro, com 4,5:1 ou mais).
   As cores moram no @theme do index.css (`--color-<família>-<tom>`); `familia(f)` devolve o `style` que aponta
   `--face`, `--degrau`, `--claro`, `--borda` e `--texto` para elas, e as peças escrevem `bg-(--face)` sem nome de
   classe dinâmico (o Tailwind não enxerga classe montada em tempo de execução).
   Regra: em cor viva, o texto é sempre `sobre-cor` (14ª rodada: no claro é o mesmo preto da tinta; no escuro continua
   escuro, enquanto a tinta clareia). Nenhuma face aceita texto branco. */

export type Familia =
  | 'laranja' | 'azul' | 'verde' | 'amarelo' | 'vermelho'
  | 'roxo' | 'turquesa' | 'anil' | 'lima' | 'rosa'

export type TomFamilia = { face: string; degrau: string; claro: string; borda: string; texto: string }

export const FAMILIAS: Record<Familia, TomFamilia & { uso: string; contraste: { tintaFace: number; textoBranco: number; textoClaro: number } }> = {
  laranja:  { face: '#E8732E', degrau: '#BA5C25', claro: '#FDEBDD', borda: '#F5C0A1', texto: '#A85220', uso: 'marca, ação',
    contraste: { tintaFace: 6.41, textoBranco: 5.39, textoClaro: 4.65 } },
  azul:     { face: '#1C9BEF', degrau: '#167CBF', claro: '#DFF1FD', borda: '#99D2F8', texto: '#146EAA', uso: 'selecionado · Matemática',
    contraste: { tintaFace: 6.46, textoBranco: 5.47, textoClaro: 4.72 } },
  verde:    { face: '#2FBF5B', degrau: '#269949', claro: '#E2F6E8', borda: '#A1E2B5', texto: '#1F7C3B', uso: 'certo · Ciências, Biologia',
    contraste: { tintaFace: 8.07, textoBranco: 5.24, textoClaro: 4.64 } },
  amarelo:  { face: '#FFC31F', degrau: '#E0A000', claro: '#FFF7E0', borda: '#FFE49A', texto: '#8C6B11', uso: 'esperando você · História',
    contraste: { tintaFace: 12.10, textoBranco: 4.97, textoClaro: 4.65 } },
  vermelho: { face: '#F2545B', degrau: '#C24349', claro: '#FDE7E8', borda: '#F9B2B5', texto: '#B84045', uso: 'problema, prazo · Inglês',
    contraste: { tintaFace: 5.73, textoBranco: 5.44, textoClaro: 4.61 } },
  roxo:     { face: '#A56EF5', degrau: '#8458C4', claro: '#F2EBFE', borda: '#D6BEFA', texto: '#7D54BA', uso: 'cuidado com pessoa · Português',
    contraste: { tintaFace: 5.69, textoBranco: 5.46, textoClaro: 4.70 } },
  turquesa: { face: '#1DBFAE', degrau: '#17998B', claro: '#DFF6F4', borda: '#99E2DB', texto: '#137A6F', uso: 'turma · Química',
    contraste: { tintaFace: 8.44, textoBranco: 5.20, textoClaro: 4.61 } },
  anil:     { face: '#6A85F7', degrau: '#556AC6', claro: '#EAEEFE', borda: '#BCC8FB', texto: '#5165BC', uso: 'Analista · Física',
    contraste: { tintaFace: 5.84, textoBranco: 5.33, textoClaro: 4.61 } },
  lima:     { face: '#9ACD2E', degrau: '#7FB01C', claro: '#F1F8E2', borda: '#D2E8A1', texto: '#59771B', uso: 'Geografia, Sociologia',
    contraste: { tintaFace: 10.32, textoBranco: 5.15, textoClaro: 4.72 } },
  rosa:     { face: '#F57CB5', degrau: '#C46391', claro: '#FEEDF5', borda: '#FAC4DE', texto: '#A25277', uso: 'Arte, Educação Física',
    contraste: { tintaFace: 7.80, textoBranco: 5.24, textoClaro: 4.65 } },
}

export const LISTA_FAMILIAS = Object.keys(FAMILIAS) as Familia[]

/** As 10 famílias no modo escuro (14ª rodada; plano ux-composicao, 2.2): a face clareada, o claro tingido sobre o
    fundo #131F24 e o texto claro. O texto escuro (`sobre-cor`) sobre a face passa de 4,5:1 em todas. Para quem lê o
    hex por JavaScript (SVG, canvas); as telas usam os tokens, que viram sozinhos. */
export const FAMILIAS_ESCURO: Record<Familia, TomFamilia> = {
  laranja:  { face: '#EB8447', degrau: '#BA5C25', claro: '#352C26', borda: '#734528', texto: '#EF9D6D' },
  azul:     { face: '#37A7F1', degrau: '#167CBF', claro: '#143344', borda: '#17577F', texto: '#60B9F4' },
  verde:    { face: '#48C76F', degrau: '#269949', claro: '#17392D', borda: '#20673D', texto: '#6DD28C' },
  amarelo:  { face: '#FFC31F', degrau: '#E0A000', claro: '#393923', borda: '#7D6922', texto: '#FFD562' },
  vermelho: { face: '#F4696F', degrau: '#C24349', claro: '#37272D', borda: '#77373D', texto: '#F6878C' },
  roxo:     { face: '#B07FF6', degrau: '#8458C4', claro: '#2A2C45', borda: '#554382', texto: '#C09AF8' },
  turquesa: { face: '#38C7B8', degrau: '#17998B', claro: '#15393A', borda: '#186762', texto: '#61D2C6' },
  anil:     { face: '#7C94F8', degrau: '#556AC6', claro: '#212F46', borda: '#3A4D83', texto: '#97AAF9' },
  lima:     { face: '#9ACD2E', degrau: '#7FB01C', claro: '#293B26', borda: '#506D28', texto: '#B8DC6D' },
  rosa:     { face: '#F68CBE', degrau: '#C46391', claro: '#372E3B', borda: '#794965', texto: '#F8A3CB' },
}

/** As famílias do tema que está valendo (hex), para quem precisa do valor e não da variável. */
export function useFamilias(): Record<Familia, TomFamilia> {
  return useTema() === 'escuro' ? FAMILIAS_ESCURO : FAMILIAS
}

/** O `style` que liga as variáveis --face, --degrau, --claro, --borda e --texto a uma família. */
export function familia(f: Familia): CSSProperties {
  return {
    '--face': `var(--color-${f})`,
    '--degrau': `var(--color-${f}-degrau)`,
    '--claro': `var(--color-${f}-claro)`,
    '--borda': `var(--color-${f}-borda)`,
    '--texto': `var(--color-${f}-texto)`,
  } as CSSProperties
}
