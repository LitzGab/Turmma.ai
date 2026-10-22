import { describe, expect, it } from 'vitest'
import { textoDaListaCurta } from './lista-curta'

/** A célula da tabela que diz uma lista de nomes (telas da coordenação, 5.0 e 6.0): até dois, "+N" para o resto, o traço sem nenhum. */
describe('textoDaListaCurta', () => {
  it.each([
    [[], '—'],
    [['Camila'], 'Camila'],
    [['Camila', 'Rafael'], 'Camila, Rafael'],
    [['Camila', 'Rafael', 'Beatriz'], 'Camila, Rafael +1'],
    [['Camila', 'Rafael', 'Beatriz', 'Davi', 'Elis'], 'Camila, Rafael +3'],
  ] as const)('%j → %s', (nomes, esperado) => {
    expect(textoDaListaCurta(nomes)).toBe(esperado)
  })
})
