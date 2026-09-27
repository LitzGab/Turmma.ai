import { describe, expect, it } from 'vitest'
import { nomeDaSerie } from './serie.js'

describe('a série por extenso (A1, 12.0)', () => {
  it('escreve o ano e a etapa como a escola fala, com a etapa lida da série e não fixa', () => {
    expect(nomeDaSerie({ etapa: 'ef_anos_finais', ano: 7 })).toBe('7º ano do Ensino Fundamental')
    expect(nomeDaSerie({ etapa: 'em', ano: 2 })).toBe('2º ano do Ensino Médio')
  })
})
