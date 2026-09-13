import pg from 'pg'
import { afterEach, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../../tools/ci/compose.ts'
import { aguardarSaudavel, compose, composeOuFalha } from '../../../../tools/testes/compose.ts'
import { bancoResponde, criarPool, type ConfiguracaoBanco, type PoolBanco } from './pool.js'

function configuracaoLocal(): ConfiguracaoBanco {
  const ambiente = lerAmbienteDeTeste()
  const usuario = valorObrigatorio(ambiente, 'POSTGRES_USUARIO')
  const senha = valorObrigatorio(ambiente, 'POSTGRES_SENHA')
  const banco = valorObrigatorio(ambiente, 'POSTGRES_BANCO')
  const porta = valorObrigatorio(ambiente, 'POSTGRES_PORTA_HOST')
  return {
    url: `postgres://${usuario}:${senha}@127.0.0.1:${porta}/${banco}`,
    maximoConexoes: 1,
    timeoutConexaoMs: 1_000,
    timeoutConsultaMs: 300,
  }
}

describe('criarPool', () => {
  const abertos: Array<PoolBanco | pg.Client> = []
  afterEach(async () => {
    await Promise.all(abertos.splice(0).map((recurso) => recurso.end()))
  })

  it('sobrevive à conexão ociosa derrubada pelo Postgres e avisa, em vez de encerrar o processo', async () => {
    const perdas: number[] = []
    const pool = criarPool(configuracaoLocal(), () => perdas.push(Date.now()))
    abertos.push(pool)
    const { rows } = await pool.query<{ pid: number }>('select pg_backend_pid() as pid')
    const pidOcioso = rows[0]?.pid

    const administrador = new pg.Client({ connectionString: configuracaoLocal().url })
    abertos.push(administrador)
    await administrador.connect()
    await administrador.query('select pg_terminate_backend($1)', [pidOcioso])

    await expect.poll(() => perdas.length).toBe(1)
    expect(await bancoResponde(pool)).toBe(true)
  })

  it('aplica o timeout de consulta no servidor, para uma consulta lenta não segurar a conexão', async () => {
    const pool = criarPool(configuracaoLocal(), () => undefined)
    abertos.push(pool)
    const { rows } = await pool.query<{ statement_timeout: string }>('show statement_timeout')
    expect(rows[0]?.statement_timeout).toBe('300ms')
    // 57014 é o cancelamento pelo statement_timeout do servidor, não o timeout do cliente.
    await expect(pool.query('select pg_sleep(2)')).rejects.toMatchObject({ code: '57014' })
    expect(await bancoResponde(pool)).toBe(true)
  })

  it('desiste de abrir conexão dentro do timeout quando o Postgres trava, mesmo com o pool vazio', async () => {
    const pool = criarPool({ ...configuracaoLocal(), timeoutConsultaMs: 10_000 }, () => undefined)
    abertos.push(pool)
    composeOuFalha('pause', 'postgres')
    try {
      const inicio = performance.now()
      expect(await bancoResponde(pool)).toBe(false)
      expect(performance.now() - inicio).toBeLessThan(3_000)
    } finally {
      compose('unpause', 'postgres')
      await aguardarSaudavel('postgres')
    }
  })
})
