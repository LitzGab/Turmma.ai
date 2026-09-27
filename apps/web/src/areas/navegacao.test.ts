import { describe, expect, it } from 'vitest'
import { estaNoItem, NAVEGACAO } from './navegacao'

describe('navegação por papel', () => {
  it('W2: na A1, só "Turmas" do professor tem tela; a coordenação e o aluno ainda não têm item', () => {
    expect(NAVEGACAO.professor.map(({ rotulo, caminho }) => ({ rotulo, caminho }))).toEqual([{ rotulo: 'Turmas', caminho: '/professor/turmas' }])
    expect(NAVEGACAO.coordenador).toEqual([])
    expect(NAVEGACAO.aluno).toEqual([])
  })

  it('o item fica selecionado no endereço dele e abaixo dele, e só neles', () => {
    const turmas = { caminho: '/professor/turmas' }
    expect(estaNoItem('/professor/turmas', turmas)).toBe(true)
    expect(estaNoItem('/professor/turmas/0190f5a0-0000-7000-8000-000000000001', turmas)).toBe(true)
    // Um endereço que só começa com as mesmas letras é outra tela.
    expect(estaNoItem('/professor/turmas-antigas', turmas)).toBe(false)
    expect(estaNoItem('/professor', turmas)).toBe(false)
    expect(estaNoItem('/', turmas)).toBe(false)
  })
})
