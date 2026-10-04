/**
 * A matrícula com forma de documento (regra 20, item 2: aluno não tem CPF nem data de nascimento). Sem cabeçalho, a
 * segunda coluna da lista é a matrícula, e um `nome;CPF` ou `nome;nascimento` gravaria o CPF ou a data como matrícula.
 * A regra é do contrato (regra 00, itens 1 e 6): a API recusa, na prévia, na gravação da lista e no nome avulso, e a
 * tela usa as mesmas funções para avisar antes de enviar (correção `2026-10-03-trava-de-documento-so-na-tela`).
 *
 * Nenhuma destas funções guarda, loga ou devolve o valor: dizem só sim ou não.
 */

const PARECE_CPF = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
const PARECE_DATA = /^(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})$/
const ONZE_ALGARISMOS = /^\d{11}$/

/**
 * Quantas matrículas com forma de CPF sem pontuação, no mínimo, fazem da lista uma coluna de CPF. Uma só é a matrícula
 * numérica de 11 algarismos que por acaso tem o dígito certo (1 em 100), e passa, como no avulso.
 */
const MINIMO_DE_CPFS_NA_COLUNA = 2

/**
 * A matrícula tem a forma de CPF pontuado (`000.000.000-00`) ou de data (`01/02/2012`, `1/2/12`, `2012-02-01`). Esta
 * forma se recusa sozinha, na lista e no avulso: matrícula de escola não se escreve assim.
 */
export function pareceDocumento(matricula: string): boolean {
  return PARECE_CPF.test(matricula) || PARECE_DATA.test(matricula)
}

/** O dígito verificador do CPF sobre os primeiros `quantos` algarismos (9 para o primeiro, 10 para o segundo). */
function digitoDoCpf(algarismos: readonly number[], quantos: number): number {
  let soma = 0
  for (let posicao = 0; posicao < quantos; posicao += 1) soma += (algarismos[posicao] ?? 0) * (quantos + 1 - posicao)
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

/**
 * A matrícula tem 11 algarismos, sem pontuação, com os dois dígitos verificadores do CPF certos: é como o Excel exporta
 * o CPF, como número. Os 11 algarismos iguais (`11111111111`) passam no cálculo e não são CPF de ninguém, e ficam de
 * fora. Sozinha, esta forma **não** se recusa: matrícula numérica de 11 algarismos existe, e 1 em 100 tem o dígito certo
 * por acaso. Ela pesa na lista, pela maioria (`matriculasQueParecemDocumento`).
 */
export function pareceCpfSemPontuacao(matricula: string): boolean {
  if (!ONZE_ALGARISMOS.test(matricula) || /^(\d)\1{10}$/.test(matricula)) return false
  const algarismos = [...matricula].map(Number)
  return digitoDoCpf(algarismos, 9) === algarismos[9] && digitoDoCpf(algarismos, 10) === algarismos[10]
}

/**
 * Quais matrículas da lista parecem documento, posição a posição:
 * - a que tem forma de CPF pontuado ou de data (`pareceDocumento`), em qualquer lista;
 * - a de CPF sem pontuação (`pareceCpfSemPontuacao`), quando a lista é uma coluna de CPF: a maioria das matrículas
 *   preenchidas (mais da metade, e pelo menos duas) tem essa forma. Ao acaso, duas matrículas numéricas com o dígito
 *   certo saem 1 vez em 10 mil; uma coluna de CPF de verdade passa da metade sempre.
 */
export function matriculasQueParecemDocumento(matriculas: readonly string[]): boolean[] {
  const preenchidas = matriculas.filter((matricula) => matricula !== '').length
  const semPontuacao = matriculas.map(pareceCpfSemPontuacao)
  const cpfs = semPontuacao.filter(Boolean).length
  const colunaDeCpf = cpfs >= MINIMO_DE_CPFS_NA_COLUNA && cpfs * 2 > preenchidas
  return matriculas.map((matricula, posicao) => pareceDocumento(matricula) || (colunaDeCpf && semPontuacao[posicao] === true))
}
