/**
 * O que a turma aberta guarda no endereço (Tech Spec de telas-do-professor, seção 5, "Abas no endereço"): a aba em `?aba=` e,
 * em Hoje, o painel "O que o Tutor viu" em `?ver=tutor`. Só valor de lista fechada vai ao endereço, nunca nome de aluno
 * (regra 20, item 9). Recarregar a página, ou voltar pelo histórico, devolve a mesma aba e o mesmo painel.
 */

export const ABAS_DA_TURMA = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: 'atividades', rotulo: 'Atividades' },
  { id: 'alunos', rotulo: 'Alunos' },
] as const

export type AbaDaTurma = (typeof ABAS_DA_TURMA)[number]['id']

/**
 * A aba do endereço. Sem `aba`, ou com valor que não é de nenhuma (o `visao-geral` de antes, um erro de digitação), abre em
 * Hoje: a página nunca fica sem aba nem pergunta nada.
 */
export function abaDoEndereco(busca: string): AbaDaTurma {
  return abaDoId(new URLSearchParams(busca).get('aba'))
}

/** A aba de um id (o de uma aba clicada, o do endereço). Id que não é de nenhuma é Hoje. */
export function abaDoId(id: string | null): AbaDaTurma {
  return ABAS_DA_TURMA.find((aba) => aba.id === id)?.id ?? 'hoje'
}

/** O painel do Tutor está pedido no endereço. Quem o abre é Hoje: em outra aba o parâmetro não abre nada. */
export function painelDoTutorPedido(busca: string): boolean {
  return new URLSearchParams(busca).get('ver') === 'tutor'
}

/**
 * O endereço de uma aba, com **só** o `aba`: o que uma aba põe por cima dela (o painel de Hoje) não acompanha a pessoa à
 * aba seguinte, e o endereço antigo não reabre um painel que ela já fechou.
 */
export function enderecoDaAba(caminho: string, aba: AbaDaTurma): string {
  return `${caminho}?aba=${aba}`
}

/** O endereço de Hoje com o painel do Tutor aberto (`aberto`) ou fechado, sem mexer no resto. */
export function enderecoComOPainelDoTutor(caminho: string, busca: string, aberto: boolean): string {
  const parametros = new URLSearchParams(busca)
  parametros.set('aba', 'hoje')
  if (aberto) parametros.set('ver', 'tutor')
  else parametros.delete('ver')
  return `${caminho}?${parametros.toString()}`
}
