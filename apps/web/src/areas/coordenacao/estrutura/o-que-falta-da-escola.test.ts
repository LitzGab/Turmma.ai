import { describe, expect, it } from 'vitest'
import { oQueFaltaDaEscola, passosDoRoteiro, type ContagemDoRoteiro } from './o-que-falta-da-escola'

/**
 * O roteiro da escola, sem tela (telas da coordenação, 2.0): cada passo é feito, falta ou "ainda não sei", e a lista de nomes
 * nunca tem marca (ler a lista de cada turma é leitura auditada, regra 20, item 10).
 */

const TUDO_FEITO: ContagemDoRoteiro = { anoEmCurso: true, series: 3, disciplinas: 2, turmas: 4, professores: 2, vinculos: 5 }
const porTitulo = (dados: ContagemDoRoteiro | undefined) => Object.fromEntries(passosDoRoteiro(dados).map((passo) => [passo.titulo, passo.feito]))

describe('os passos do roteiro', () => {
  it('são sete, na ordem da escola', () => {
    expect(passosDoRoteiro(TUDO_FEITO).map((passo) => passo.titulo)).toEqual(['Ano letivo', 'Séries', 'Disciplinas', 'Turmas', 'Lista de nomes', 'Professores', 'Alocação'])
  })

  it('cada um é feito quando a escola tem o que ele pede, e falta quando a leitura veio zerada', () => {
    expect(porTitulo(TUDO_FEITO)).toEqual({ 'Ano letivo': true, Séries: true, Disciplinas: true, Turmas: true, 'Lista de nomes': undefined, Professores: true, Alocação: true })
    expect(porTitulo({ anoEmCurso: false, series: 0, disciplinas: 0, turmas: 0, professores: 0, vinculos: 0 })).toEqual({
      'Ano letivo': false,
      Séries: false,
      Disciplinas: false,
      Turmas: false,
      'Lista de nomes': undefined,
      Professores: false,
      Alocação: false,
    })
  })

  it('cada leitura zerada derruba só o passo dela: o ano, as séries, as disciplinas, as turmas, os professores e a alocação', () => {
    const tudo = { 'Ano letivo': true, Séries: true, Disciplinas: true, Turmas: true, 'Lista de nomes': undefined, Professores: true, Alocação: true }
    expect(porTitulo({ ...TUDO_FEITO, anoEmCurso: false })).toEqual({ ...tudo, 'Ano letivo': false })
    expect(porTitulo({ ...TUDO_FEITO, series: 0 })).toEqual({ ...tudo, Séries: false })
    expect(porTitulo({ ...TUDO_FEITO, disciplinas: 0 })).toEqual({ ...tudo, Disciplinas: false })
    expect(porTitulo({ ...TUDO_FEITO, turmas: 0 })).toEqual({ ...tudo, Turmas: false })
    expect(porTitulo({ ...TUDO_FEITO, professores: 0 })).toEqual({ ...tudo, Professores: false })
    expect(porTitulo({ ...TUDO_FEITO, vinculos: 0 })).toEqual({ ...tudo, Alocação: false })
  })

  it('"ainda não sei" é o passo cuja leitura não chegou: sem marca, e nunca "falta"', () => {
    const lidos = porTitulo({ anoEmCurso: true, series: undefined, disciplinas: 2, turmas: undefined, professores: 2, vinculos: undefined })
    expect(lidos['Séries']).toBeUndefined()
    expect(lidos['Turmas']).toBeUndefined()
    expect(lidos['Alocação']).toBeUndefined()
    expect(lidos['Disciplinas']).toBe(true)
  })

  it('sem ano letivo na escola (sem dados), nenhum passo tem marca: o roteiro todo aparece', () => {
    expect(Object.values(porTitulo(undefined))).toEqual(Array(7).fill(undefined))
  })

  it('a lista de nomes nunca tem marca, com a escola toda feita ou toda vazia, e o passo diz que é por desenho', () => {
    for (const dados of [TUDO_FEITO, { ...TUDO_FEITO, turmas: 0 }, undefined]) {
      const passo = passosDoRoteiro(dados).find((candidato) => candidato.titulo === 'Lista de nomes')
      expect(passo?.feito).toBeUndefined()
      expect(passo?.semMarca).toBe(true)
    }
    expect(passosDoRoteiro(TUDO_FEITO).filter((passo) => passo.semMarca === true)).toHaveLength(1)
  })

  it('cada passo leva à tela onde se faz: o ano, as séries e as disciplinas no painel do ano; os professores e a alocação em Professores', () => {
    const para = Object.fromEntries(passosDoRoteiro(TUDO_FEITO).map((passo) => [passo.titulo, passo.para]))
    expect(para).toEqual({
      'Ano letivo': '/estrutura?painel=ano',
      Séries: '/estrutura?painel=ano',
      Disciplinas: '/estrutura?painel=ano',
      Turmas: '/estrutura',
      'Lista de nomes': '/estrutura',
      Professores: '/professores',
      Alocação: '/professores',
    })
    // O link que fecha a frase na Estrutura é só o do passo dos professores, e leva ao mesmo lugar.
    const comLink = passosDoRoteiro(TUDO_FEITO).filter((passo) => passo.link !== undefined)
    expect(comLink.map((passo) => [passo.titulo, passo.link?.para])).toEqual([['Professores', '/professores']])
  })
})

describe('o que o Painel mostra do roteiro', () => {
  it('só os passos que faltam, na ordem do roteiro', () => {
    const { faltam } = oQueFaltaDaEscola(passosDoRoteiro({ anoEmCurso: true, series: 3, disciplinas: 0, turmas: 4, professores: 0, vinculos: 0 }))
    expect(faltam.map((passo) => passo.titulo)).toEqual(['Disciplinas', 'Professores', 'Alocação'])
  })

  it('escola montada é com todo passo medido feito: a lista de nomes, que nunca se mede, não impede', () => {
    expect(oQueFaltaDaEscola(passosDoRoteiro(TUDO_FEITO))).toMatchObject({ faltam: [], montada: true })
  })

  it('um passo ainda não lido impede a frase de escola montada, e não vira "falta"', () => {
    const resultado = oQueFaltaDaEscola(passosDoRoteiro({ ...TUDO_FEITO, series: undefined }))
    expect(resultado.montada).toBe(false)
    expect(resultado.faltam).toEqual([])
  })

  it('um passo que falta impede a frase de escola montada', () => {
    expect(oQueFaltaDaEscola(passosDoRoteiro({ ...TUDO_FEITO, turmas: 0 })).montada).toBe(false)
  })
})
