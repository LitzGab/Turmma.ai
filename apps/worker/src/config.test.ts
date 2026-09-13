import { describe, expect, it } from 'vitest'
import { lerAmbienteExemplo } from '../../../tools/ci/compose.ts'
import { ConfiguracaoInvalida, lerConfiguracao } from './config.js'

const ambienteValido = {
  BANCO_URL: 'postgres://educa:senha_sintetica_xyz@postgres:5432/educa',
  BANCO_POOL_MAXIMO: '5',
  BANCO_TIMEOUT_CONEXAO_MS: '2000',
  BANCO_TIMEOUT_CONSULTA_MS: '2000',
  REDIS_FILA_URL: 'redis://redis-fila:6379',
  WORKER_CONCORRENCIA: '5',
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

describe('lerConfiguracao do worker', () => {
  it('converte o ambiente, com statement_timeout próprio no pool', () => {
    expect(lerConfiguracao(ambienteValido)).toEqual({
      banco: { url: ambienteValido.BANCO_URL, maximoConexoes: 5, timeoutConexaoMs: 2000, timeoutConsultaMs: 2000 },
      redisFilaUrl: 'redis://redis-fila:6379',
      concorrencia: 5,
    })
  })

  it.each(Object.keys(ambienteValido))('não sobe sem %s', (variavel) => {
    expect(erroDe({ ...ambienteValido, [variavel]: undefined }).variaveis).toEqual([variavel])
  })

  it.each(['0', '-1', '2.5', 'muitos'])('não sobe com WORKER_CONCORRENCIA=%s', (valor) => {
    expect(erroDe({ ...ambienteValido, WORKER_CONCORRENCIA: valor }).variaveis).toEqual(['WORKER_CONCORRENCIA'])
  })

  it('a concorrência de .env.example cabe no pool do worker: cada job usa uma conexão por vez', () => {
    const exemplo = lerAmbienteExemplo()
    expect(Number(exemplo['WORKER_CONCORRENCIA'])).toBeLessThanOrEqual(Number(exemplo['WORKER_BANCO_POOL_MAXIMO']))
  })
})
