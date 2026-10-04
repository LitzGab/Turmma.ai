import { TAMANHO_MAXIMO_DA_JUSTIFICATIVA, TAMANHO_MINIMO_DA_JUSTIFICATIVA } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { problemaDoTexto, tamanhoDoTexto, textoDoContador } from './texto-longo'

const JUSTIFICATIVA = { minimo: TAMANHO_MINIMO_DA_JUSTIFICATIVA, maximo: TAMANHO_MAXIMO_DA_JUSTIFICATIVA }

describe('texto do campo de várias linhas', () => {
  it('conta sem o espaço das pontas, como a API conta', () => {
    expect(tamanhoDoTexto('  abc  \n')).toBe(3)
    expect(tamanhoDoTexto('        ')).toBe(0)
    expect(textoDoContador('  A questão 3  ', JUSTIFICATIVA)).toBe('11 de 500')
  })

  it('a justificativa da rejeição tem de 8 a 500 caracteres, e a mensagem diz quanto falta', () => {
    expect(problemaDoTexto('', JUSTIFICATIVA)).toBe('Escreva pelo menos 8 caracteres.')
    // Oito espaços não são oito caracteres.
    expect(problemaDoTexto('        ', JUSTIFICATIVA)).toBe('Escreva pelo menos 8 caracteres.')
    expect(problemaDoTexto('errada', JUSTIFICATIVA)).toBe('Escreva pelo menos 8 caracteres: faltam 2.')
    expect(problemaDoTexto('erradas', JUSTIFICATIVA)).toBe('Escreva pelo menos 8 caracteres: falta 1.')
    expect(problemaDoTexto('erradas!', JUSTIFICATIVA)).toBeUndefined()
    expect(problemaDoTexto('x'.repeat(500), JUSTIFICATIVA)).toBeUndefined()
    expect(problemaDoTexto('x'.repeat(501), JUSTIFICATIVA)).toBe('Use até 500 caracteres.')
  })

  it('sem mínimo, o texto vazio serve', () => {
    expect(problemaDoTexto('', { maximo: 200 })).toBeUndefined()
  })
})
