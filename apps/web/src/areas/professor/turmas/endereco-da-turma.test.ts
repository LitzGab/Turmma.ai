import { describe, expect, it } from 'vitest'
import { ABAS_DA_TURMA, abaDoEndereco, abaDoId, enderecoComOPainelDoTutor, enderecoDaAba, painelDoTutorPedido } from './endereco-da-turma'

describe('a aba da turma pelo endereço', () => {
  it('são três, Hoje, Atividades e Alunos, nessa ordem', () => {
    expect(ABAS_DA_TURMA.map((aba) => aba.rotulo)).toEqual(['Hoje', 'Atividades', 'Alunos'])
  })

  it('cada aba do endereço abre a dela; sem aba, ou com o `visao-geral` de antes, ou com valor que não existe, abre Hoje', () => {
    expect(abaDoEndereco('aba=hoje')).toBe('hoje')
    expect(abaDoEndereco('aba=atividades')).toBe('atividades')
    expect(abaDoEndereco('aba=alunos')).toBe('alunos')
    expect(abaDoEndereco('aba=alunos&ver=tutor')).toBe('alunos')
    for (const busca of ['', 'aba=', 'aba=visao-geral', 'aba=ALUNOS', 'aba=alunos%20', 'outra=alunos']) expect(abaDoEndereco(busca), busca).toBe('hoje')
    expect(abaDoId(null)).toBe('hoje')
    expect(abaDoId('atividades')).toBe('atividades')
  })

  it('o endereço de uma aba leva só a aba: o painel de Hoje não acompanha a pessoa à aba seguinte', () => {
    expect(enderecoDaAba('/turmas/x', 'alunos')).toBe('/turmas/x?aba=alunos')
    expect(enderecoDaAba('/turmas/x', 'hoje')).toBe('/turmas/x?aba=hoje')
  })
})

describe('o painel do Tutor pelo endereço', () => {
  it('só `ver=tutor` o pede, e qualquer outro valor não', () => {
    expect(painelDoTutorPedido('aba=hoje&ver=tutor')).toBe(true)
    expect(painelDoTutorPedido('ver=tutor')).toBe(true)
    for (const busca of ['', 'aba=hoje', 'ver=', 'ver=lista', 'ver=TUTOR', 'tutor=1']) expect(painelDoTutorPedido(busca), busca).toBe(false)
  })

  it('abrir põe `aba=hoje&ver=tutor`; fechar tira o `ver` e deixa o resto; nunca leva nome de aluno', () => {
    expect(enderecoComOPainelDoTutor('/turmas/x', '', true)).toBe('/turmas/x?aba=hoje&ver=tutor')
    expect(enderecoComOPainelDoTutor('/turmas/x', 'aba=hoje', true)).toBe('/turmas/x?aba=hoje&ver=tutor')
    expect(enderecoComOPainelDoTutor('/turmas/x', 'aba=hoje&ver=tutor', false)).toBe('/turmas/x?aba=hoje')
    expect(enderecoComOPainelDoTutor('/turmas/x', 'ver=tutor', false)).toBe('/turmas/x?aba=hoje')
  })
})
