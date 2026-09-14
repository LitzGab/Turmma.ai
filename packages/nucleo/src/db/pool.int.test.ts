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

  describe('erro de consulta devolve a conexão ao pool, e só erro de conexão a descarta', () => {
    async function pidDa(pool: PoolBanco): Promise<number | undefined> {
      const { rows } = await pool.query<{ pid: number }>('select pg_backend_pid() as pid')
      return rows[0]?.pid
    }

    function poolComContagemDeDescarte(ajuste: Partial<ConfiguracaoBanco> = {}) {
      const pool = criarPool({ ...configuracaoLocal(), ...ajuste }, () => undefined)
      abertos.push(pool)
      const descartes: unknown[] = []
      pool.on('remove', (conexao) => descartes.push(conexao))
      return { pool, descartes }
    }

    it('reaproveita a mesma conexão depois de violação de unicidade, de consulta cortada pelo statement_timeout e de erro de sintaxe', async () => {
      const { pool, descartes } = poolComContagemDeDescarte()
      const pidInicial = await pidDa(pool)
      const tabela = `teste_pool_${Date.now()}`
      await pool.query(`create table ${tabela} (nome text unique)`)
      try {
        await pool.query(`insert into ${tabela} (nome) values ($1)`, ['Enzo Martins'])
        await expect(pool.query(`insert into ${tabela} (nome) values ($1)`, ['Enzo Martins'])).rejects.toMatchObject({ code: '23505' })
        expect(await pidDa(pool)).toBe(pidInicial)

        await expect(pool.query('select pg_sleep(2)')).rejects.toMatchObject({ code: '57014' })
        expect(await pidDa(pool)).toBe(pidInicial)

        await expect(pool.query('selec 1')).rejects.toMatchObject({ code: '42601' })
        expect(await pidDa(pool)).toBe(pidInicial)

        // A conexão devolvida está boa de verdade: a consulta seguinte não herda estado do erro.
        const { rows } = await pool.query<{ total: string }>(`select count(*) as total from ${tabela}`)
        expect(rows[0]?.total).toBe('1')
        expect(descartes).toHaveLength(0)
      } finally {
        await pool.query(`drop table if exists ${tabela}`)
      }
    })

    it('descarta a conexão que ficou com transação abortada ou aberta, para ela não envenenar as consultas seguintes', async () => {
      const { pool, descartes } = poolComContagemDeDescarte()
      const tabela = `teste_pool_tx_${Date.now()}`
      await pool.query(`create table ${tabela} (nome text unique)`)
      try {
        await pool.query(`insert into ${tabela} (nome) values ('Enzo Martins')`)
        const pidAntes = await pidDa(pool)

        await expect(
          pool.query(`begin; insert into ${tabela} (nome) values ('Enzo Martins'); commit`),
        ).rejects.toMatchObject({ code: '23505' })
        await expect.poll(() => descartes.length).toBe(1)
        expect(await pidDa(pool)).not.toBe(pidAntes)

        // Sem erro, mas com a transação deixada aberta: também não volta ao pool.
        await pool.query('begin')
        await expect.poll(() => descartes.length).toBe(2)
        const { rows } = await pool.query<{ total: string }>(`select count(*) as total from ${tabela}`)
        expect(rows[0]?.total).toBe('1')
      } finally {
        await pool.query(`drop table if exists ${tabela}`)
      }
    })

    it('descarta a conexão encerrada pelo servidor no meio da consulta e abre outra na seguinte', async () => {
      // Consulta longa, para o encerramento cair com ela em andamento, e não depois dela.
      const { pool, descartes } = poolComContagemDeDescarte({ timeoutConsultaMs: 10_000 })
      const pidInicial = await pidDa(pool)

      const administrador = new pg.Client({ connectionString: configuracaoLocal().url })
      abertos.push(administrador)
      await administrador.connect()

      // A asserção entra junto com a consulta, antes do encerramento: a rejeição pode chegar antes da resposta
      // do `pg_terminate_backend`, e uma promessa ainda sem tratador nesse instante vira rejeição não tratada.
      const rejeitada = expect(pool.query('select pg_sleep(5)')).rejects.toMatchObject({ code: '57P01' })
      await expect.poll(async () => {
        const { rows } = await administrador.query<{ ativa: boolean }>(
          `select state = 'active' as ativa from pg_stat_activity where pid = $1`,
          [pidInicial],
        )
        return rows[0]?.ativa
      }).toBe(true)
      await administrador.query('select pg_terminate_backend($1)', [pidInicial])

      await rejeitada
      await expect.poll(() => descartes.length).toBe(1)
      const pidNovo = await pidDa(pool)
      expect(pidNovo).toBeDefined()
      expect(pidNovo).not.toBe(pidInicial)
    })
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
