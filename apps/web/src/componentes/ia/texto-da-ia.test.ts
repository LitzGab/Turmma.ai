import { describe, expect, it } from 'vitest'
import { paragrafosDoTexto } from './texto-da-ia'

describe('texto da IA em parágrafos', () => {
  it('a linha em branco separa os parágrafos, e a quebra simples fica dentro deles', () => {
    expect(paragrafosDoTexto('Primeiro parágrafo.\n\nSegundo, com lista:\n1. um\n2. dois\n\n\n\nTerceiro.')).toEqual(['Primeiro parágrafo.', 'Segundo, com lista:\n1. um\n2. dois', 'Terceiro.'])
  })

  it('linha só com espaço também separa, e as pontas em branco somem', () => {
    expect(paragrafosDoTexto('\n\n  Um.  \n \t \nDois.\r\n\r\nTrês.\n')).toEqual(['Um.', 'Dois.', 'Três.'])
  })

  it('texto vazio ou só de espaço não tem parágrafo', () => {
    expect(paragrafosDoTexto('')).toEqual([])
    expect(paragrafosDoTexto(' \n\n \t ')).toEqual([])
  })

  it('o que parece marcação continua sendo o texto que veio', () => {
    const texto = '<img src=x onerror="alert(1)">\n\n**negrito** e [link](javascript:alert(1))'
    expect(paragrafosDoTexto(texto)).toEqual(['<img src=x onerror="alert(1)">', '**negrito** e [link](javascript:alert(1))'])
  })
})
