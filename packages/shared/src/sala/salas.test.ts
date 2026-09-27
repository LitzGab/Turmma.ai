import { describe, expect, it } from 'vitest'
import { TAMANHO_MAXIMO_TOKEN_DE_CONVITE } from '../sessao/convite.js'
import { TAMANHO_MAXIMO_SLUG_NO_LOGIN } from '../sessao/matricula.js'
import { esquemaPedidoAbrirSala, esquemaRespostaSalaAberta, MAXIMO_DE_NOMES_NA_SALA, TAMANHO_MAXIMO_CODIGO_DIGITADO } from './salas.js'

describe('contrato de salas/abrir (A1, tarefa 5.0)', () => {
  // Valores fixos e sintéticos: o pacote não tem os tipos do Node.
  const token = 'A'.repeat(43)
  const UM_ID = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b'

  it('aceita o slug com o token ou com o código como o aluno digita, e nada mais', () => {
    expect(esquemaPedidoAbrirSala.parse({ slug: 'colegio-horizonte', token })).toEqual({ slug: 'colegio-horizonte', token })
    expect(esquemaPedidoAbrirSala.parse({ slug: 'colegio-horizonte', codigo: 'abcd 2345' })).toEqual({ slug: 'colegio-horizonte', codigo: 'abcd 2345' })
    // O formato do token e do código fica para a busca: o que não é vigente responde NAO_ENCONTRADO, como o inexistente.
    expect(esquemaPedidoAbrirSala.safeParse({ slug: 'colegio-horizonte', token: 'curto' }).success).toBe(true)
    expect(esquemaPedidoAbrirSala.safeParse({ slug: 'colegio-horizonte', codigo: 'x'.repeat(TAMANHO_MAXIMO_CODIGO_DIGITADO) }).success).toBe(true)
  })

  it('P5: escolaId, turmaId, campo a mais, os dois caminhos juntos ou nenhum deles não passam', () => {
    for (const corpo of [
      { slug: 'a', token, escolaId: UM_ID },
      { slug: 'a', codigo: 'ABCD2345', turmaId: UM_ID },
      { slug: 'a', token, codigo: 'ABCD2345' },
      { slug: 'a' },
      { token },
      { slug: '', token },
      { slug: 'a', codigo: '' },
      { slug: 'a', token: '' },
      { slug: 'a', codigo: 'x'.repeat(TAMANHO_MAXIMO_CODIGO_DIGITADO + 1) },
      { slug: 'a', token: 'x'.repeat(TAMANHO_MAXIMO_TOKEN_DE_CONVITE + 1) },
      { slug: 'a'.repeat(TAMANHO_MAXIMO_SLUG_NO_LOGIN + 1), token },
    ]) {
      expect(esquemaPedidoAbrirSala.safeParse(corpo).success, JSON.stringify(Object.keys(corpo))).toBe(false)
    }
  })

  it('a resposta é estrita: nome da turma e nomes com id e nome, sem matrícula nem id de turma, até o teto', () => {
    const nome = { id: UM_ID, nome: 'Ana' }
    expect(esquemaRespostaSalaAberta.safeParse({ turma: { nome: '2ºB' }, nomes: [nome] }).success).toBe(true)
    expect(esquemaRespostaSalaAberta.safeParse({ turma: { nome: '2ºB' }, nomes: [{ ...nome, matricula: '123' }] }).success).toBe(false)
    expect(esquemaRespostaSalaAberta.safeParse({ turma: { nome: '2ºB', id: UM_ID }, nomes: [] }).success).toBe(false)
    expect(esquemaRespostaSalaAberta.safeParse({ turma: { nome: '2ºB' }, nomes: [{ id: nome.id, nome: null }] }).success).toBe(false)
    expect(esquemaRespostaSalaAberta.safeParse({ turma: { nome: '2ºB' }, nomes: Array.from({ length: MAXIMO_DE_NOMES_NA_SALA + 1 }, () => nome) }).success).toBe(false)
  })
})
