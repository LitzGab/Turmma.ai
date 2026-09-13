import { describe, expect, it } from 'vitest'
import { ConfiguracaoInvalida, lerConfiguracao } from './config.js'

const ambienteValido = {
  BANCO_URL: 'postgres://educa:senha_sintetica_xyz@postgres:5432/educa',
  BANCO_POOL_MAXIMO: '3',
  BANCO_TIMEOUT_CONEXAO_MS: '2000',
  BANCO_TIMEOUT_CONSULTA_MS: '2000',
  REDIS_FILA_URL: 'redis://redis-fila:6379',
}

function erroDe(ambiente: Record<string, string | undefined>): ConfiguracaoInvalida {
  try {
    lerConfiguracao(ambiente)
  } catch (erro) {
    if (erro instanceof ConfiguracaoInvalida) return erro
    throw erro
  }
  throw new Error('a configuração deveria ter sido recusada')
}

describe('lerConfiguracao do despachante', () => {
  it('converte o ambiente, com statement_timeout próprio no pool', () => {
    expect(lerConfiguracao(ambienteValido)).toEqual({
      banco: { url: ambienteValido.BANCO_URL, maximoConexoes: 3, timeoutConexaoMs: 2000, timeoutConsultaMs: 2000 },
      redisFilaUrl: 'redis://redis-fila:6379',
    })
  })

  it.each(Object.keys(ambienteValido))('não sobe sem %s', (variavel) => {
    expect(erroDe({ ...ambienteValido, [variavel]: undefined }).variaveis).toEqual([variavel])
  })

  it('aponta os problemas pelo nome, sem repetir a senha da URL', () => {
    const erro = erroDe({ ...ambienteValido, BANCO_URL: 'mysql://educa:senha_sintetica_xyz@postgres/educa', REDIS_FILA_URL: 'redis-fila:6379' })
    expect(erro.variaveis).toEqual(['BANCO_URL', 'REDIS_FILA_URL'])
    expect(erro.message).not.toContain('senha_sintetica_xyz')
  })
})
