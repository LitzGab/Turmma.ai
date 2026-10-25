/**
 * O que "Como estou indo" diz (telas do aluno e primeiro acesso, 7.0; RF9, RF10): só o trabalho de correção aprovada, com
 * o que o aluno acertou e as habilidades a rever **como a API mandou**. Não existe limiar, "vale revisar", matéria,
 * professor nem comparação: o contrato de `GET /v1/tutor/memoria` não traz colega, e a web não calcula nada (regra 50,
 * item 9; D66). Nunca se diz "nota": ela não existe (D46).
 */

export const TITULO_DE_COMO_ESTOU_INDO = 'Como estou indo'
export const ROTULO_DO_CARREGANDO = 'Carregando as suas tarefas corrigidas…'
export const TITULO_DO_VAZIO = 'Nada corrigido ainda'
export const DESCRICAO_DO_VAZIO = 'Depois que quem dá a aula aprovar a primeira correção, ela aparece aqui.'
export const ROTULO_DAS_HABILIDADES = 'Para rever'

/** A contestação até o F9 (regra 70, item 4d): o aluno sabe a quem recorrer se achar a memória errada. */
export const TEXTO_DA_CONTESTACAO = 'Achou algo errado? Fale com quem dá a aula.'

/** "7 de 8 certas": o número está escrito, e a barra ao lado é só desenho. */
export function textoDasCertas(acertos: number, total: number): string {
  return `${String(acertos)} de ${String(total)} certas`
}
