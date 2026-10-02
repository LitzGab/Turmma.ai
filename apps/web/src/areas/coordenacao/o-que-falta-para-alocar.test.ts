import { describe, expect, it } from 'vitest'
import { descricaoDoQueFalta, oQueFaltaParaAlocar, tituloDoQueFalta } from './o-que-falta-para-alocar'

describe('W4 (Alocação): o vazio diz o que falta, no título e na descrição', () => {
  it('falta só o que a escola não tem, na ordem em que ela se monta', () => {
    expect(oQueFaltaParaAlocar({ turmas: 0, disciplinas: 0, professores: 0 })).toEqual(['turma', 'disciplina', 'professor'])
    expect(oQueFaltaParaAlocar({ turmas: 2, disciplinas: 0, professores: 1 })).toEqual(['disciplina'])
    expect(oQueFaltaParaAlocar({ turmas: 0, disciplinas: 3, professores: 0 })).toEqual(['turma', 'professor'])
    expect(oQueFaltaParaAlocar({ turmas: 1, disciplinas: 1, professores: 1 })).toEqual([])
  })

  it('o título não pede o que a escola já tem: com a turma e o professor, e sem a disciplina, pede só a disciplina', () => {
    expect(tituloDoQueFalta(['turma', 'professor'])).toBe('Crie uma turma e um professor primeiro')
    expect(tituloDoQueFalta(['disciplina'])).toBe('Crie uma disciplina primeiro')
    expect(tituloDoQueFalta(['professor'])).toBe('Crie um professor primeiro')
    expect(tituloDoQueFalta(['turma', 'disciplina', 'professor'])).toBe('Crie uma turma, uma disciplina e um professor primeiro')
  })

  it('a descrição diz o que falta e em que estado o professor precisa estar', () => {
    expect(descricaoDoQueFalta(['turma'])).toBe('A alocação liga um professor a uma turma e a uma disciplina. Falta: uma turma.')
    expect(descricaoDoQueFalta(['turma', 'disciplina', 'professor'])).toBe(
      'A alocação liga um professor a uma turma e a uma disciplina. Falta: uma turma; uma disciplina; um professor cadastrado, com o convite em aberto ou já aceito.',
    )
  })
})
