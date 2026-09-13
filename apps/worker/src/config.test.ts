import { describe, expect, it } from 'vitest'
import { ConfiguracaoInvalida, lerConfiguracao } from './config.js'

const ambienteValido = {
  BANCO_URL: 'postgres://educa:senha_sintetica_xyz@postgres:5432/educa',
  BANCO_POOL_MAXIMO: '80',
  BANCO_TIMEOUT_CONEXAO_MS: '2000',
  BANCO_TIMEOUT_CONSULTA_MS: '2000',
  REDIS_FILA_URL: 'redis://redis-fila:6379',
  FILAS: 'interativa,normal',
  WORKER_POOL_INTERATIVA: '50',
  WORKER_POOL_NORMAL: '30',
  VAGAS_ESCOLA_INTERATIVA: '5',
  VAGAS_ESCOLA_NORMAL: '5',
  VAGAS_ESCOLA_LOTE: '2',
}

const storageValido = {
  STORAGE_URL: 'http://storage:8333',
  STORAGE_REGIAO: 'us-east-1',
  STORAGE_BUCKET: 'educa-local',
  STORAGE_CHAVE_ACESSO: 'chave_sintetica',
  STORAGE_CHAVE_SECRETA: 'segredo_sintetico_xyz',
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
  it('converte o ambiente: só as filas de FILAS, cada uma com o próprio pool', () => {
    expect(lerConfiguracao(ambienteValido)).toEqual({
      banco: { url: ambienteValido.BANCO_URL, maximoConexoes: 80, timeoutConexaoMs: 2000, timeoutConsultaMs: 2000 },
      redisFilaUrl: 'redis://redis-fila:6379',
      pools: { interativa: 50, normal: 30 },
      vagasPadrao: { interativa: 5, normal: 5, lote: 2 },
    })
  })

  it('o worker-lote atende só o lote, e o pool de outra fila no ambiente não liga a fila', () => {
    const lote = { ...ambienteValido, ...storageValido, FILAS: 'lote', WORKER_POOL_LOTE: '10' }
    expect(lerConfiguracao(lote).pools).toEqual({ lote: 10 })
  })

  it('o worker-lote lê o storage, onde a consolidação mede os bytes; o worker-interativo não precisa dele', () => {
    const lote = { ...ambienteValido, ...storageValido, FILAS: 'lote', WORKER_POOL_LOTE: '10' }
    expect(lerConfiguracao(lote).storage).toEqual({
      url: 'http://storage:8333',
      regiao: 'us-east-1',
      bucket: 'educa-local',
      chaveAcesso: 'chave_sintetica',
      chaveSecreta: 'segredo_sintetico_xyz',
    })
    expect(lerConfiguracao(ambienteValido).storage).toBeUndefined()
  })

  it.each(Object.keys(storageValido))('o worker-lote não sobe sem %s', (variavel) => {
    const lote = { ...ambienteValido, ...storageValido, FILAS: 'lote', WORKER_POOL_LOTE: '10', [variavel]: undefined }
    expect(erroDe(lote).variaveis).toEqual([variavel])
  })

  it('a mensagem do storage inválido cita só a variável, nunca o segredo', () => {
    const erro = erroDe({ ...ambienteValido, ...storageValido, FILAS: 'lote', WORKER_POOL_LOTE: '10', STORAGE_URL: 'storage:8333', STORAGE_CHAVE_SECRETA: '' })
    expect(erro.variaveis).toEqual(['STORAGE_CHAVE_SECRETA', 'STORAGE_URL'])
    expect(erro.message).not.toContain(storageValido.STORAGE_CHAVE_SECRETA)
  })

  it.each(Object.keys(ambienteValido))('não sobe sem %s', (variavel) => {
    expect(erroDe({ ...ambienteValido, [variavel]: undefined }).variaveis).toContain(variavel)
  })

  it('não sobe sem o pool de uma fila que atende', () => {
    expect(erroDe({ ...ambienteValido, ...storageValido, FILAS: 'interativa,normal,lote' }).variaveis).toEqual(['WORKER_POOL_LOTE'])
  })

  it.each(['', 'interativa,prioritaria', 'interativa,interativa', 'INTERATIVA'])('não sobe com FILAS=%j', (valor) => {
    expect(erroDe({ ...ambienteValido, FILAS: valor }).variaveis).toEqual(['FILAS'])
  })

  it.each(['0', '-1', '2.5', 'muitos'])('não sobe com WORKER_POOL_INTERATIVA=%s', (valor) => {
    expect(erroDe({ ...ambienteValido, WORKER_POOL_INTERATIVA: valor }).variaveis).toEqual(['WORKER_POOL_INTERATIVA'])
  })
})
