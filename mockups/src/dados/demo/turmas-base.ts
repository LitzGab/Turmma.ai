import { TURMAS_DA_ESCOLA, type TurmaDaEscola } from '../estrutura'
import { criarFatia } from './nucleo'

/* As turmas que a coordenação cria na demonstração (12ª rodada). Mora aqui, embaixo de `acesso.ts` e de
   `escola-estado.ts`, para os dois acharem o nome e a série de uma turma nova sem um importar o outro. As telas usam
   `useTurmasDaEscola()` e `turmas.criar()` de `dados/escola-estado.ts`. */

export const fatiaTurmasCriadas = criarFatia<TurmaDaEscola[]>('turmas-criadas', [])

/** Uma turma do Colégio Aurora pelo id: as de sempre e as criadas na demonstração. */
export function turmaPorId(id: string): TurmaDaEscola | undefined {
  return TURMAS_DA_ESCOLA.find((t) => t.id === id) ?? fatiaTurmasCriadas.ler().find((t) => t.id === id)
}

/** O nome curto de uma turma ("3ºA"); o próprio id quando não há. */
export const nomeDaTurma = (id: string) => turmaPorId(id)?.nome ?? id
