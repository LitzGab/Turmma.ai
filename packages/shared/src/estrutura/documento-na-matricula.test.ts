import { describe, expect, it } from 'vitest'
import { matriculasQueParecemDocumento, pareceCpfSemPontuacao, pareceDocumento } from './documento-na-matricula.js'

/**
 * A matrícula com forma de documento (correção `2026-10-03-trava-de-documento-so-na-tela`, G2 da validação da A1; regra
 * 20, item 2: aluno não tem CPF nem data de nascimento). Os CPFs daqui são sintéticos, com o dígito verificador calculado.
 */

/** CPFs com o dígito verificador certo, sem pontuação. */
const CPFS_VALIDOS = ['12345678909', '52998224725', '11144477735', '39053344705']

describe('pareceDocumento: a forma que se recusa sozinha, na lista e no avulso', () => {
  it('o CPF pontuado e as datas que a tela já pegava', () => {
    for (const documento of ['123.456.789-09', '529.982.247-25', '000.000.000-00', '01/02/2012', '1/2/12', '31/12/2011', '2012-02-01']) {
      expect(pareceDocumento(documento), documento).toBe(true)
    }
  })

  it('a matrícula normal passa, também a numérica de 11 algarismos e a de 8 com forma de data sem separador', () => {
    for (const matricula of ['1001', 'A2024-0001', '2024-0001', '20240101', '12345678909', '52998224725', '123.456.789', '2012-2-1']) {
      expect(pareceDocumento(matricula), matricula).toBe(false)
    }
  })
})

describe('pareceCpfSemPontuacao: 11 algarismos com o dígito verificador do CPF', () => {
  it('os 11 algarismos com o dígito certo parecem CPF', () => {
    for (const cpf of CPFS_VALIDOS) expect(pareceCpfSemPontuacao(cpf), cpf).toBe(true)
  })

  it('o dígito errado, o tamanho errado, a pontuação e os 11 algarismos iguais não parecem', () => {
    for (const matricula of ['12345678900', '12345678919', '52998224724', '1234567890', '123456789090', '123.456.789-09', '11111111111', '00000000000', 'a2345678909']) {
      expect(pareceCpfSemPontuacao(matricula), matricula).toBe(false)
    }
  })
})

describe('matriculasQueParecemDocumento: a lista inteira, posição a posição', () => {
  it('o CPF pontuado e a data são marcados em qualquer lista, mesmo sozinhos', () => {
    expect(matriculasQueParecemDocumento(['1001', '123.456.789-09', '1003', '01/02/2012'])).toEqual([false, true, false, true])
  })

  it('a maioria das matrículas preenchidas com CPF sem pontuação marca a coluna: cada CPF é marcado, e o resto, não', () => {
    const [a, b, c] = CPFS_VALIDOS as [string, string, string]
    expect(matriculasQueParecemDocumento([a, b, '1003'])).toEqual([true, true, false])
    // A matrícula vazia não conta na maioria: dois de três preenchidos.
    expect(matriculasQueParecemDocumento([a, '', b, '1004'])).toEqual([true, false, true, false])
    expect(matriculasQueParecemDocumento([a, b, c])).toEqual([true, true, true])
  })

  it('metade, ou um só, não marca: é a matrícula numérica que por acaso tem o dígito certo (o avulso sozinho também passa)', () => {
    const [a, b] = CPFS_VALIDOS as [string, string]
    expect(matriculasQueParecemDocumento([a, b, '1003', '1004'])).toEqual([false, false, false, false])
    expect(matriculasQueParecemDocumento([a])).toEqual([false])
    expect(matriculasQueParecemDocumento([a, '1002'])).toEqual([false, false])
  })

  it('11 algarismos com o dígito errado não contam para a maioria, nem são marcados', () => {
    const [a] = CPFS_VALIDOS as [string]
    expect(matriculasQueParecemDocumento([a, '12345678900', '52998224724'])).toEqual([false, false, false])
  })

  it('o CPF pontuado não conta para a maioria do sem pontuação, mas é marcado por si', () => {
    const [a] = CPFS_VALIDOS as [string]
    expect(matriculasQueParecemDocumento([a, '529.982.247-25', '1003'])).toEqual([false, true, false])
  })
})
