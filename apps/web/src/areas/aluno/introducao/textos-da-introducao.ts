import { FALA_DO_AVISO } from './aviso-de-privacidade'
import { TEXTO_DA_SUPERVISAO } from '../tutor'

/**
 * Os quatro passos da introdução do aluno (telas do aluno e primeiro acesso, 9.0; RF12, RF13, RF19; D58, D59; Decreto 12.880,
 * art. 11). Texto fixo, em `.ts` com teste: **nenhuma fala varia com presença, ausência, acerto nem tempo de uso**, e nenhuma
 * afirma ser pessoa, professor ou amigo, promete voltar, esperar ou estar sempre ali, nem fala de vínculo ou saudade. A onça
 * fala em nome da função (o Tutor) e termina parada: só acena e aponta.
 *
 * Os passos 1 a 3 são avisos e não se pulam na primeira vez; o 4, o tamanho da letra, é uma escolha e se pula.
 */

export type IdDoPasso = 'tutor' | 'supervisao' | 'privacidade' | 'letra'

export interface PassoDoAluno {
  readonly id: IdDoPasso
  /** A onça só acena e aponta aqui; a `BemVindo` passa a pose à `Introducao`. Quem importa a `Onca` é uma lista fechada (D58), e este arquivo não está nela. */
  readonly pose: 'acenando' | 'apontando'
  /** A fala da onça, que é o `h1` do passo. */
  readonly fala: string
  /** O que o passo diz embaixo da fala, uma frase por linha. O passo do aviso e o da letra têm o conteúdo próprio. */
  readonly linhas: readonly string[]
  readonly obrigatorio: boolean
}

export const FALA_DO_TUTOR = 'Oi! Eu sou o Tutor, um programa da escola.'
export const FRASE_QUE_PODE_ERRAR = 'Eu posso errar. Confira no livro ou pergunte a quem dá a aula.'
export const FRASE_QUE_NAO_E_PESSOA = 'Eu sou um programa, e não uma pessoa.'

export const FALA_DA_SUPERVISAO = TEXTO_DA_SUPERVISAO
export const LINHAS_DA_SUPERVISAO = ['Quem dá a aula vê onde você travou.', 'Vê se você pediu a resposta pronta e qual dúvida você repetiu.'] as const

export const FALA_DA_LETRA = 'Qual tamanho de letra fica bom para você?'

/** Os passos, na ordem. */
export const PASSOS_DO_ALUNO: readonly PassoDoAluno[] = [
  { id: 'tutor', pose: 'acenando', fala: FALA_DO_TUTOR, linhas: [FRASE_QUE_PODE_ERRAR, FRASE_QUE_NAO_E_PESSOA], obrigatorio: true },
  { id: 'supervisao', pose: 'apontando', fala: FALA_DA_SUPERVISAO, linhas: LINHAS_DA_SUPERVISAO, obrigatorio: true },
  { id: 'privacidade', pose: 'apontando', fala: FALA_DO_AVISO, linhas: [], obrigatorio: true },
  { id: 'letra', pose: 'acenando', fala: FALA_DA_LETRA, linhas: [], obrigatorio: false },
]

/** Quantos passos há: o carregando e o erro da `BemVindo` mostram "Passo 1 de N" sem ainda saber qual é o modo. */
export const TOTAL_DE_PASSOS = PASSOS_DO_ALUNO.length
