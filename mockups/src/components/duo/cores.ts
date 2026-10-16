import type { IconeId } from './icones'
import type { TipoItem } from '@/dados/fila'
import type { Familia } from './familia'

/* AS CORES DO SISTEMA (11ª rodada; sistema-turmma-duolingo.md, seção 2.1).
   Famílias (2.1.2) em ./familia; aqui, quem usa qual: as matérias (2.1.4) e os tipos da fila (2.1.5).
   Nas matérias, a cor AJUDA e o ícone IDENTIFICA. O laranja não vai em matéria: é ação e é a marca. */

export { FAMILIAS, LISTA_FAMILIAS, familia } from './familia'
export type { Familia, TomFamilia } from './familia'

export type MateriaId =
  | 'matematica' | 'portugues' | 'ciencias' | 'biologia' | 'quimica' | 'fisica' | 'historia'
  | 'geografia' | 'ingles' | 'arte' | 'educacao-fisica' | 'filosofia' | 'sociologia'

export type Materia = { id: MateriaId; nome: string; familia: Familia; icone: IconeId }

export const MATERIAS: Materia[] = [
  { id: 'matematica', nome: 'Matemática', familia: 'azul', icone: 'matematica' },
  { id: 'portugues', nome: 'Língua Portuguesa', familia: 'roxo', icone: 'portugues' },
  { id: 'ciencias', nome: 'Ciências', familia: 'verde', icone: 'ciencias' },
  { id: 'biologia', nome: 'Biologia', familia: 'verde', icone: 'biologia' },
  { id: 'quimica', nome: 'Química', familia: 'turquesa', icone: 'quimica' },
  { id: 'fisica', nome: 'Física', familia: 'anil', icone: 'fisica' },
  { id: 'historia', nome: 'História', familia: 'amarelo', icone: 'historia' },
  { id: 'geografia', nome: 'Geografia', familia: 'lima', icone: 'geografia' },
  { id: 'ingles', nome: 'Língua Inglesa', familia: 'vermelho', icone: 'ingles' },
  { id: 'arte', nome: 'Arte', familia: 'rosa', icone: 'arte' },
  { id: 'educacao-fisica', nome: 'Educação Física', familia: 'rosa', icone: 'educacao-fisica' },
  { id: 'filosofia', nome: 'Filosofia', familia: 'amarelo', icone: 'filosofia' },
  { id: 'sociologia', nome: 'Sociologia', familia: 'lima', icone: 'sociologia' },
]

/** tira acento, caixa e espaço das pontas: "Química" → "quimica" */
const chave = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const APELIDOS: Record<string, MateriaId> = {
  matematica: 'matematica',
  portugues: 'portugues', 'lingua portuguesa': 'portugues', redacao: 'portugues',
  ciencias: 'ciencias', biologia: 'biologia', quimica: 'quimica', fisica: 'fisica', historia: 'historia',
  geografia: 'geografia', ingles: 'ingles', 'lingua inglesa': 'ingles', arte: 'arte', artes: 'arte',
  'educacao fisica': 'educacao-fisica', filosofia: 'filosofia', sociologia: 'sociologia',
}

/** A matéria pelo nome, com ou sem acento e em qualquer caixa ("Química", "quimica", "Língua Portuguesa"). */
export function materiaDe(nome: string | undefined | null): Materia | undefined {
  if (!nome) return undefined
  const k = chave(nome)
  const id = APELIDOS[k] ?? APELIDOS[k.replace(/-/g, ' ')]
  return id ? MATERIAS.find((m) => m.id === id) : undefined
}

/** Cada tipo de item da fila "Esperando você": a família e o ícone (tabela 2.1.5). */
export const TIPO_FILA: Record<TipoItem, { familia: Familia; icone: IconeId }> = {
  atencao: { familia: 'roxo', icone: 'atencao' },
  notas: { familia: 'amarelo', icone: 'notas' },
  sinal: { familia: 'azul', icone: 'sinal' },
  pedidos: { familia: 'verde', icone: 'pedidos' },
  'pedidos-nome': { familia: 'verde', icone: 'pedidos' },
  material: { familia: 'amarelo', icone: 'adaptada' },
  turma: { familia: 'turquesa', icone: 'turma' },
  aviso: { familia: 'vermelho', icone: 'aviso' },
  contestacao: { familia: 'amarelo', icone: 'contestacao' },
  alerta: { familia: 'anil', icone: 'alerta' },
  'material-falhou': { familia: 'vermelho', icone: 'material-falhou' },
  convite: { familia: 'amarelo', icone: 'convite' },
  dossie: { familia: 'anil', icone: 'dossie' },
  /* 12ª rodada: o pedido de revisão do aluno, o encaminhamento de risco à vida e o pedido do titular */
  revisao: { familia: 'amarelo', icone: 'contestacao' },
  risco: { familia: 'roxo', icone: 'atencao' },
  titular: { familia: 'anil', icone: 'titular' },
}
