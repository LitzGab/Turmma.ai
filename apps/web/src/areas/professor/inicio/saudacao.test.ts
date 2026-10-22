import { describe, expect, it } from 'vitest'
import { cumprimentoDaHora, primeiroNome, saudacao } from './saudacao'

describe('a saudação da Home (11.2)', () => {
  it('vem pela hora: bom dia até 11h59, boa tarde até 17h59, boa noite no resto', () => {
    expect([4, 5, 11, 12, 17, 18, 23, 0].map(cumprimentoDaHora)).toEqual(['Boa noite', 'Bom dia', 'Bom dia', 'Boa tarde', 'Boa tarde', 'Boa noite', 'Boa noite', 'Boa noite'])
  })

  it('usa só o primeiro nome, e não o nome inteiro', () => {
    expect(primeiroNome('Camila Souza')).toBe('Camila')
    expect(primeiroNome('  Maria   das Dores  ')).toBe('Maria')
    expect(primeiroNome('   ')).toBeUndefined()
    expect(saudacao('Camila Souza', new Date(2026, 9, 5, 7, 30))).toBe('Bom dia, Camila.')
    expect(saudacao('Camila Souza', new Date(2026, 9, 5, 14, 0))).toBe('Boa tarde, Camila.')
    expect(saudacao('Camila Souza', new Date(2026, 9, 5, 21, 0))).toBe('Boa noite, Camila.')
  })

  it('sem o nome ainda lido, cumprimenta sem inventar um', () => {
    expect(saudacao(undefined, new Date(2026, 9, 5, 7, 30))).toBe('Bom dia.')
    expect(saudacao('  ', new Date(2026, 9, 5, 7, 30))).toBe('Bom dia.')
  })
})
