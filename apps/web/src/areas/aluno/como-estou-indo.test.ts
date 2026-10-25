import { describe, expect, it } from 'vitest'
import {
  DESCRICAO_DO_VAZIO,
  ROTULO_DAS_HABILIDADES,
  ROTULO_DO_CARREGANDO,
  TEXTO_DA_CONTESTACAO,
  textoDasCertas,
  TITULO_DE_COMO_ESTOU_INDO,
  TITULO_DO_VAZIO,
} from './como-estou-indo'

/**
 * Os textos de "Como estou indo" (telas do aluno e primeiro acesso, 7.0; RF9, RF10): o número escrito e as frases do vazio e da
 * contestação. Nenhum diz "nota" (D46), compara com ninguém nem cobra uso (regra 50, item 9; D59).
 */
describe('textoDasCertas', () => {
  it('escreve quantas certas de quantas, e não um percentual', () => {
    expect(textoDasCertas(7, 8)).toBe('7 de 8 certas')
    expect(textoDasCertas(0, 5)).toBe('0 de 5 certas')
  })
})

describe('os textos de "Como estou indo"', () => {
  const todos = [TITULO_DE_COMO_ESTOU_INDO, ROTULO_DO_CARREGANDO, TITULO_DO_VAZIO, DESCRICAO_DO_VAZIO, ROTULO_DAS_HABILIDADES, TEXTO_DA_CONTESTACAO]

  it('dizem o vazio e a contestação com as palavras da spec', () => {
    expect(TITULO_DO_VAZIO).toBe('Nada corrigido ainda')
    expect(DESCRICAO_DO_VAZIO).toBe('Depois que quem dá a aula aprovar a primeira correção, ela aparece aqui.')
    expect(TEXTO_DA_CONTESTACAO).toBe('Achou algo errado? Fale com quem dá a aula.')
  })

  it('nunca dizem "nota", "vale revisar", nem comparam o aluno com a turma ou cobram uso', () => {
    for (const texto of todos) expect(texto).not.toMatch(/\bnotas?\b|vale revisar|colega|média|posição|ranking|sequência|pontos|meta\b|prêmio/i)
  })
})
