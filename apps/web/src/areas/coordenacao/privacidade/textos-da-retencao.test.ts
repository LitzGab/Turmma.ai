import { describe, expect, it } from 'vitest'
import { textoDaOrigem, textoDoPrazo } from './textos-da-retencao'

describe('textoDoPrazo: o prazo que a coordenação lê', () => {
  it('um prazo de anos exatos é dito em anos, no singular e no plural', () => {
    expect(textoDoPrazo(12)).toBe('1 ano')
    expect(textoDoPrazo(24)).toBe('2 anos')
    expect(textoDoPrazo(60)).toBe('5 anos')
  })

  it('o resto é dito em meses, e um mês no singular', () => {
    expect(textoDoPrazo(6)).toBe('6 meses')
    expect(textoDoPrazo(3)).toBe('3 meses')
    expect(textoDoPrazo(1)).toBe('1 mês')
  })
})

describe('textoDaOrigem: de onde vem o prazo que vale', () => {
  it('um prazo sem trava diz se é o padrão do sistema ou o ajuste da escola', () => {
    expect(textoDaOrigem({ origem: 'padrao', limitadaPor: null })).toBe('Padrão do sistema')
    expect(textoDaOrigem({ origem: 'ajustada', limitadaPor: null })).toBe('Ajustado pela escola')
  })

  it('um prazo que a trava encurtou diz com qual categoria, mesmo sem ajuste da escola', () => {
    expect(textoDaOrigem({ origem: 'padrao', limitadaPor: 'conversa_professor' })).toBe(
      'Padrão do sistema; encurtado pela trava com "Conversa do professor com o Assistente de ensino"',
    )
    expect(textoDaOrigem({ origem: 'ajustada', limitadaPor: 'conversa_tutor' })).toBe(
      'Ajustado pela escola; encurtado pela trava com "Conversa do aluno com o Tutor"',
    )
  })
})
