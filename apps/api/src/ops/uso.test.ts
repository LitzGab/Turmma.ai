import { ConfiguracaoInvalida } from '@educa/nucleo'
import { describe, expect, it } from 'vitest'
import { ArgumentoInvalido, lerPedidoDeUso, urlDoBancoDeOperacao } from './uso.js'

const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
// 01h de 01/01/2027 em São Paulo; em UTC já são 04h.
const relogio = { agora: () => new Date('2027-01-01T01:00:00-03:00') }

describe('lerPedidoDeUso', () => {
  it('sem --dia, vale o último dia fechado em São Paulo, e o mês dele', () => {
    expect(lerPedidoDeUso(['--escola', ESCOLA_A], relogio)).toEqual({ escolaId: ESCOLA_A, dia: '2026-12-31', mes: '2026-12' })
  })

  it('--dia e --mes escolhem o período, e a escola sai em minúsculas', () => {
    expect(lerPedidoDeUso(['--escola', ESCOLA_A.toUpperCase(), '--dia', '2026-09-15', '--mes', '2026-08'], relogio)).toEqual({
      escolaId: ESCOLA_A,
      dia: '2026-09-15',
      mes: '2026-08',
    })
  })

  it.each([
    ['sem --escola', [], 'escola'],
    ['escola que não é UUID', ['--escola', '1837'], 'escola'],
    ['dia inexistente', ['--escola', ESCOLA_A, '--dia', '2026-02-30'], 'dia'],
    ['dia em outro formato', ['--escola', ESCOLA_A, '--dia', '15/09/2026'], 'dia'],
    ['mês inválido', ['--escola', ESCOLA_A, '--mes', '2026-13'], 'mes'],
  ])('%s: recusa citando só a opção', (_caso, argumentos, opcao) => {
    expect(() => lerPedidoDeUso(argumentos, relogio)).toThrow(new ArgumentoInvalido(opcao))
  })

  it('opção desconhecida não repete o valor recebido na mensagem', () => {
    expect(() => lerPedidoDeUso(['--escola', ESCOLA_A, '--senha', 'segredo_sintetico'], relogio)).toThrow(ArgumentoInvalido)
    expect(() => lerPedidoDeUso(['--escola', ESCOLA_A, '--senha', 'segredo_sintetico'], relogio)).not.toThrow(/segredo_sintetico/)
  })
})

describe('urlDoBancoDeOperacao', () => {
  const prazos = { BANCO_TIMEOUT_CONEXAO_MS: '2000', BANCO_TIMEOUT_CONSULTA_MS: '2000' }

  it('no container usa o BANCO_URL do serviço', () => {
    expect(urlDoBancoDeOperacao({ ...prazos, BANCO_URL: 'postgres://educa:sintetica@postgres:5432/educa' }).url).toBe('postgres://educa:sintetica@postgres:5432/educa')
  })

  it('na máquina, com .env.example, monta a URL do Postgres local do compose', () => {
    const ambiente = { ...prazos, POSTGRES_USUARIO: 'educa', POSTGRES_SENHA: 'senha sintética', POSTGRES_BANCO: 'educa', POSTGRES_PORTA_HOST: '55432' }
    expect(urlDoBancoDeOperacao(ambiente).url).toBe('postgres://educa:senha%20sint%C3%A9tica@127.0.0.1:55432/educa')
  })

  it('sem nenhum dos dois, recusa pelo nome da variável, sem valor', () => {
    expect(() => urlDoBancoDeOperacao({ ...prazos, POSTGRES_SENHA: 'segredo_sintetico' })).toThrow(ConfiguracaoInvalida)
    expect(() => urlDoBancoDeOperacao({ ...prazos, POSTGRES_SENHA: 'segredo_sintetico' })).not.toThrow(/segredo_sintetico/)
  })
})
