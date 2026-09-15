import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

  it('a migration da 1.0 com um ALTER em job_registro atrás (como a 3.0 no deploy do F1), com job_registro preso, desiste em 3 tentativas sem deixar tabela pela metade', async () => {
    // A migration real de rede, escola e auditoria, aplicada num schema só do teste: no `public` ela já está.
    const schemaDoTeste = `teste_migrar_f1_${sufixo}`
    const nomeDaMigracao = readdirSync(PASTA_MIGRACOES).find((arquivo) => /^0004_.*\.sql$/.test(arquivo))
    if (nomeDaMigracao === undefined) throw new Error('migration 0004 ausente')
    const daTarefa = readFileSync(join(PASTA_MIGRACOES, nomeDaMigracao), 'utf8').replaceAll('"public".', `"${schemaDoTeste}".`)
    const pasta = pastaCom(
      [`set local search_path to ${schemaDoTeste}`, daTarefa, `alter table public.job_registro add constraint teste_migrar_f1_${sufixo} check (escola_id is not null or tipo like 'sistema.%') not valid`].join(
        '\n--> statement-breakpoint\n',
      ),
    )
    await administrador.query(`create schema ${schemaDoTeste}`)
    // Um worker no meio de uma transação que gravou job: segura job_registro contra o ALTER.
    const worker = new pg.Client({ connectionString: urlDoBancoDeTeste() })
    await worker.connect()
    await worker.query('begin')
    await worker.query(`insert into job_registro (fila, prioridade, tipo) values ('lote', 3, 'sistema.teste-migrar')`)
    try {
      await expect(migrar(configuracao({ pasta, schemaDoRegistro: registroDoTeste, lockTimeoutMs: 500 }), logger)).rejects.toEqual(new MigracaoFalhou(TENTATIVAS_MIGRACAO))
      const falhas = registros().filter((registro) => registro['evento'] === 'migracao.tentativa_falhou')
      expect(falhas).toHaveLength(TENTATIVAS_MIGRACAO)
      expect(falhas.every((falha) => (falha['erro'] as { sqlstate?: string }).sqlstate === '55P03')).toBe(true)

      const { rows: tabelas } = await administrador.query('select table_name from information_schema.tables where table_schema = $1', [schemaDoTeste])
      expect(tabelas).toEqual([])
      const { rows: restricoes } = await administrador.query('select 1 from pg_constraint where conname = $1', [`teste_migrar_f1_${sufixo}`])
      expect(restricoes).toEqual([])
      const { rows: aplicadas } = await administrador.query<{ total: string }>(`select count(*) as total from ${registroDoTeste}.__drizzle_migrations`)
      expect(Number(aplicadas[0]?.total)).toBe(0)
    } finally {
      await worker.query('rollback')
      await worker.end()
      await administrador.query(`drop schema if exists ${schemaDoTeste} cascade`)
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
