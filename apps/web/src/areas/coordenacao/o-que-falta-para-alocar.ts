/**
 * O vazio da Alocação (A1, 13.0 e 14.0; W4): o que ainda falta para ligar um professor a uma turma e a uma disciplina,
 * dito no título e na descrição. O título diz só o que falta de fato: com a turma criada, "Crie uma turma e um professor
 * primeiro" ao lado de "Falta: uma disciplina" contradizia a descrição.
 */

/** O que a alocação precisa e a escola ainda não tem, na ordem em que a escola se monta. */
export type FaltaParaAlocar = 'turma' | 'disciplina' | 'professor'

/** O professor conta quando é alocável: com o convite em aberto e dentro do prazo, ou já aceito. */
export function oQueFaltaParaAlocar(tem: { readonly turmas: number; readonly disciplinas: number; readonly professores: number }): readonly FaltaParaAlocar[] {
  return [...(tem.turmas === 0 ? (['turma'] as const) : []), ...(tem.disciplinas === 0 ? (['disciplina'] as const) : []), ...(tem.professores === 0 ? (['professor'] as const) : [])]
}

const NO_TITULO: Readonly<Record<FaltaParaAlocar, string>> = { turma: 'uma turma', disciplina: 'uma disciplina', professor: 'um professor' }

const NA_DESCRICAO: Readonly<Record<FaltaParaAlocar, string>> = {
  turma: 'uma turma',
  disciplina: 'uma disciplina',
  professor: 'um professor cadastrado, com o convite em aberto ou já aceito',
}

const EM_LISTA = new Intl.ListFormat('pt-BR', { type: 'conjunction' })

/** "Crie uma turma e um professor primeiro", só com o que falta. */
export function tituloDoQueFalta(faltam: readonly FaltaParaAlocar[]): string {
  return `Crie ${EM_LISTA.format(faltam.map((falta) => NO_TITULO[falta]))} primeiro`
}

/** O que a alocação faz e o que falta, com o estado em que o professor precisa estar. */
export function descricaoDoQueFalta(faltam: readonly FaltaParaAlocar[]): string {
  return `A alocação liga um professor a uma turma e a uma disciplina. Falta: ${faltam.map((falta) => NA_DESCRICAO[falta]).join('; ')}.`
}
