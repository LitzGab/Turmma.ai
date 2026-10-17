/**
 * O que uma célula de tabela diz de uma lista de nomes: até dois e "+N" para o resto ("Camila, Rafael +3"), ou o traço quando não há
 * nenhum. É a coluna Professores das Turmas e as colunas Disciplinas e Turmas dos Professores (X2, 5.0 e 6.0): a tabela tem a linha
 * de 64 px, e a lista inteira mora no painel. Arquivo próprio porque duas telas o usam.
 */
export function textoDaListaCurta(nomes: readonly string[]): string {
  if (nomes.length === 0) return '—'
  const resto = nomes.length - 2
  return resto > 0 ? `${nomes.slice(0, 2).join(', ')} +${String(resto)}` : nomes.join(', ')
}
