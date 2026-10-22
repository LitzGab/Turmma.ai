import { describe, expect, it } from 'vitest'
import { enderecoComParametro } from './endereco-da-tela'

/** O endereço das telas que abrem algo por cima ou filtram (telas da coordenação, 5.0 e 6.0): põe e tira um parâmetro sem mexer nos outros. */
describe('enderecoComParametro', () => {
  it('põe e tira um parâmetro sem mexer no outro', () => {
    expect(enderecoComParametro('/estrutura', 'situacao=sem-professor', 'painel', 'ano')).toBe('/estrutura?situacao=sem-professor&painel=ano')
    expect(enderecoComParametro('/estrutura', 'situacao=sem-professor&painel=ano', 'painel', undefined)).toBe('/estrutura?situacao=sem-professor')
    expect(enderecoComParametro('/estrutura', 'painel=ano', 'painel', undefined)).toBe('/estrutura')
  })

  it('o professor aberto é o parâmetro `professor`, com o id codificado, e sai sem deixar o `?`', () => {
    expect(enderecoComParametro('/professores', '', 'professor', '0197a1c0-0000-7000-8000-000000000301')).toBe('/professores?professor=0197a1c0-0000-7000-8000-000000000301')
    expect(enderecoComParametro('/professores', 'professor=0197a1c0-0000-7000-8000-000000000301', 'professor', undefined)).toBe('/professores')
  })
})
