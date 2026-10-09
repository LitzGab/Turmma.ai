import { CHAVES_DE_CATEGORIA_DO_SUBOPERADOR } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { textoDaVigencia, textoDasCategorias, textoDoPais, textoDoTreinamento } from './textos-dos-suboperadores'

describe('textoDoPais: onde a empresa processa o dado', () => {
  it('o código vira o nome do país em português, e o que o Intl não conhece fica como veio', () => {
    expect(textoDoPais('BR')).toBe('Brasil')
    expect(textoDoPais('US')).toBe('Estados Unidos')
    expect(textoDoPais('ZZ')).toBe('Região desconhecida')
    expect(textoDoPais('xx-inválido')).toBe('xx-inválido')
  })
})

describe('textoDasCategorias: o que a empresa recebe', () => {
  it('cada categoria vira o texto dela, na ordem em que vieram, separadas por ponto e vírgula', () => {
    expect(textoDasCategorias(['conversa_do_aluno', 'cadastro'])).toBe('Conversa do aluno com o Tutor; Cadastro de alunos, professores e turmas')
    expect(textoDasCategorias(['consulta_de_busca'])).toBe('Consulta de pesquisa escrita pelo modelo, sem dado de pessoa')
  })

  it('toda categoria do contrato tem um texto, e nenhum é a chave crua', () => {
    for (const categoria of CHAVES_DE_CATEGORIA_DO_SUBOPERADOR) {
      const texto = textoDasCategorias([categoria])
      expect(texto, categoria).not.toBe('')
      expect(texto, categoria).not.toBe(categoria)
      expect(texto, categoria).not.toContain('_')
    }
  })
})

describe('textoDaVigencia: desde quando, e até quando', () => {
  it('vigente diz "Desde" o dia de início; encerrada diz o começo e o fim', () => {
    // Meio-dia de UTC cai no mesmo dia em qualquer fuso de -12 a +11.
    expect(textoDaVigencia({ inicio: '2026-10-05T12:00:00.000Z', fim: null })).toBe('Desde 05/10/2026')
    expect(textoDaVigencia({ inicio: '2026-10-05T12:00:00.000Z', fim: '2026-10-20T12:00:00.000Z' })).toBe('De 05/10/2026 até 20/10/2026')
  })
})

describe('textoDoTreinamento: o que o contrato diz sobre treinar IA com o dado', () => {
  it('proibido e não proibido são ditos por extenso, e diferentes', () => {
    expect(textoDoTreinamento(true)).toBe('O contrato proíbe usar o dado para treinar IA')
    expect(textoDoTreinamento(false)).toBe('O contrato não proíbe usar o dado para treinar IA')
  })
})
