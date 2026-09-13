import pg from 'pg'
import { describe, expect, it } from 'vitest'
import { ehErroDeConexao } from './pool.js'

function erroDoServidor(code: string, severity: string): pg.DatabaseError {
  return Object.assign(new pg.DatabaseError('mensagem', 0, 'error'), { code, severity })
}

describe('ehErroDeConexao', () => {
  it.each([
    ['violação de unicidade', '23505'],
    ['cancelada pelo statement_timeout', '57014'],
    ['sintaxe', '42601'],
    ['conflito de serialização', '40001'],
  ])('mantém a conexão depois de erro de consulta: %s', (_caso, code) => {
    expect(ehErroDeConexao(erroDoServidor(code, 'ERROR'))).toBe(false)
  })

  it.each([
    ['pg_terminate_backend', '57P01', 'FATAL'],
    ['servidor em recuperação', '57P03', 'FATAL'],
    ['falha de conexão', '08006', 'ERROR'],
    ['erro interno', 'XX000', 'ERROR'],
    ['transação ociosa por tempo demais', '25P03', 'FATAL'],
    ['transação abortada', '25P02', 'ERROR'],
    ['FATAL com texto traduzido, SQLSTATE de conexão', '57P01', 'FATAL'],
    ['PANIC', '58000', 'PANIC'],
  ])('descarta a conexão depois de erro que encerra a sessão: %s', (_caso, code, severity) => {
    expect(ehErroDeConexao(erroDoServidor(code, severity))).toBe(true)
  })

  it('descarta a conexão em erro que não veio do servidor: socket e timeout do cliente', () => {
    expect(ehErroDeConexao(new Error('Connection terminated unexpectedly'))).toBe(true)
    expect(ehErroDeConexao(new Error('Query read timeout'))).toBe(true)
  })
})
