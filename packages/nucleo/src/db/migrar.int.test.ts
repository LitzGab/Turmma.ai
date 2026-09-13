import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import pg from 'pg'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { urlDoBancoDeTeste } from '../../../../tools/testes/integracao.setup.ts'
import { criarLogger } from '../log/logger.js'
import { LOCK_TIMEOUT_MIGRACAO_MS, migrar, MigracaoFalhou, PASTA_MIGRACOES, TENTATIVAS_MIGRACAO, type ConfiguracaoMigracao } from './migrar.js'

const linhas: string[] = []
const logger = criarLogger({ servico: 'migrar-teste', destino: { write: (linha: string) => linhas.push(linha) } })
const registros = () => linhas.map((linha) => JSON.parse(linha) as Record<string, unknown>)

const configuracao = (ajuste: Partial<ConfiguracaoMigracao> = {}): ConfiguracaoMigracao => ({
  url: urlDoBancoDeTeste(),
  timeoutConexaoMs: 2_000,
  timeoutConsultaMs: 60_000,
  ...ajuste,
})

describe('migrar', () => {
  const administrador = new pg.Client({ connectionString: urlDoBancoDeTeste() })
  const pastas: string[] = []
  const sufixo = Date.now()
  const tabela = `teste_migrar_${sufixo}`
  const registroDoTeste = `teste_migrar_registro_${sufixo}`

  /** Pasta de migrations no formato do drizzle-kit, com uma instrução só. */
  function pastaCom(instrucao: string): string {
    const pasta = mkdtempSync(join(tmpdir(), 'educa-migrar-'))
    pastas.push(pasta)
    mkdirSync(join(pasta, 'meta'))
    writeFileSync(join(pasta, '0000_teste.sql'), instrucao)
    writeFileSync(
      join(pasta, 'meta', '_journal.json'),
      JSON.stringify({ version: '7', dialect: 'postgresql', entries: [{ idx: 0, version: '7', when: 1_700_000_000_000, tag: '0000_teste', breakpoints: true }] }),
    )
    return pasta
  }

  beforeAll(async () => {
    await administrador.connect()
    await administrador.query(`create table ${tabela} (id int)`)
  })

  afterEach(async () => {
    linhas.length = 0
    await administrador.query(`drop schema if exists ${registroDoTeste} cascade`)
    await administrador.query(`alter table ${tabela} drop column if exists nova`)
  })

  afterAll(async () => {
    await administrador.query(`drop table if exists ${tabela}`)
    await administrador.end()
    for (const pasta of pastas) rmSync(pasta, { recursive: true, force: true })
  })

  it('rodar de novo não reaplica nada: o serviço migrar pode subir a cada `docker compose up`', async () => {
    await migrar(configuracao(), logger)
    await migrar(configuracao(), logger)
    const { rows } = await administrador.query<{ total: string }>('select count(*) as total from drizzle.__drizzle_migrations')
    const diario = JSON.parse(readFileSync(join(PASTA_MIGRACOES, 'meta', '_journal.json'), 'utf8')) as { entries: unknown[] }
    expect(Number(rows[0]?.total)).toBe(diario.entries.length)
    expect(registros().filter((registro) => registro['evento'] === 'migracao.concluida')).toHaveLength(2)
  })

  it('job_registro nasce com os índices parciais e o check de escola da Tech Spec', async () => {
    const { rows: indices } = await administrador.query<{ indexname: string; indexdef: string }>(
      `select indexname, indexdef from pg_indexes where tablename = 'job_registro' order by indexname`,
    )
    expect(indices.map((indice) => indice.indexname)).toEqual(['job_registro_finalizados_idx', 'job_registro_pendentes_idx', 'job_registro_pendentes_urgentes_idx', 'job_registro_pkey'])
    expect(indices[1]?.indexdef).toMatch(/\(fila, escola_id, criado_em\) WHERE \(estado <> ALL \(ARRAY\['concluido'::text, 'falhou'::text\]\)\)$/)
    expect(indices[0]?.indexdef).toMatch(/\(concluido_em\) WHERE \(estado = ANY \(ARRAY\['concluido'::text, 'falhou'::text\]\)\)/)
    // O da reserva no horário letivo: só os urgentes pendentes.
    expect(indices[2]?.indexdef).toMatch(/\(fila, escola_id, criado_em\) WHERE \(\(estado <> ALL \(ARRAY\['concluido'::text, 'falhou'::text\]\)\) AND \(NOT nao_urgente\)\)$/)

    // Job de escola sem escola é recusado pelo próprio banco, mesmo por fora do repository.
    await expect(
      administrador.query(`insert into job_registro (fila, prioridade, tipo) values ('normal', 2, 'sintetico')`),
    ).rejects.toMatchObject({ code: '23514', constraint: 'job_registro_escola_ou_sistema' })
    const { rows } = await administrador.query<{ id: string }>(
      `insert into job_registro (fila, prioridade, tipo) values ('normal', 2, 'sistema.teste') returning id`,
    )
    // UUIDv7: a versão é o 13º dígito.
    expect(rows[0]?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/)
    await administrador.query('delete from job_registro where id = $1', [rows[0]?.id])
  })

  it('com a tabela presa por outra transação, desiste do lock em 5 s e consegue na tentativa seguinte', async () => {
    const bloqueio = new pg.Client({ connectionString: urlDoBancoDeTeste() })
    await bloqueio.connect()
    await bloqueio.query('begin')
    await bloqueio.query(`lock table ${tabela} in access exclusive mode`)
    // Solta o lock depois de a primeira tentativa desistir e antes de a segunda desistir.
    const soltar = setTimeout(() => void bloqueio.query('rollback'), LOCK_TIMEOUT_MIGRACAO_MS + 2_000)
    try {
      const inicio = performance.now()
      await migrar(configuracao({ pasta: pastaCom(`alter table ${tabela} add column nova int`), schemaDoRegistro: registroDoTeste }), logger)
      expect(performance.now() - inicio).toBeGreaterThanOrEqual(LOCK_TIMEOUT_MIGRACAO_MS)
      const tentativasFalhas = registros().filter((registro) => registro['evento'] === 'migracao.tentativa_falhou')
      expect(tentativasFalhas).toEqual([expect.objectContaining({ tentativa: 1, erro: expect.objectContaining({ sqlstate: '55P03' }) })])
      expect(registros().find((registro) => registro['evento'] === 'migracao.concluida')).toMatchObject({ tentativa: 2 })
    } finally {
      clearTimeout(soltar)
      await bloqueio.query('rollback').catch(() => undefined)
      await bloqueio.end()
    }
  }, 30_000)

  it('com o lock preso o tempo todo, desiste depois de 3 tentativas, sem ficar pendurado', async () => {
    const bloqueio = new pg.Client({ connectionString: urlDoBancoDeTeste() })
    await bloqueio.connect()
    await bloqueio.query('begin')
    await bloqueio.query(`lock table ${tabela} in access exclusive mode`)
    try {
      await expect(
        migrar(configuracao({ pasta: pastaCom(`alter table ${tabela} add column nova int`), schemaDoRegistro: registroDoTeste, lockTimeoutMs: 500 }), logger),
      ).rejects.toEqual(new MigracaoFalhou(TENTATIVAS_MIGRACAO))
      expect(registros().filter((registro) => registro['evento'] === 'migracao.tentativa_falhou')).toHaveLength(TENTATIVAS_MIGRACAO)
    } finally {
      await bloqueio.query('rollback')
      await bloqueio.end()
    }
  }, 30_000)

  it('erro que não é de lock falha na primeira tentativa: repetir não conserta migration errada', async () => {
    await expect(
      migrar(configuracao({ pasta: pastaCom(`alter table ${tabela} add column nova tipo_que_nao_existe`), schemaDoRegistro: registroDoTeste }), logger),
    ).rejects.toBeInstanceOf(MigracaoFalhou)
    expect(registros().filter((registro) => registro['evento'] === 'migracao.tentativa_falhou')).toEqual([
      expect.objectContaining({ tentativa: 1, erro: expect.objectContaining({ sqlstate: '42704' }) }),
    ])
  })
})
