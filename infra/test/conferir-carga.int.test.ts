import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { urlDoBancoDeTeste } from '../../tools/testes/integracao.setup.ts'
import { aguardarInterativosIniciados, conferirJobRegistro, ESPERA_MAXIMA_INTERATIVO_MS } from '../scripts/conferir-carga.ts'

// Contra o Postgres do compose de teste, com as migrations: o banco confirma o que o k6 mediu. As linhas são
// gravadas direto, com os instantes escolhidos, como o despachante e o worker as deixariam.

const pool = new pg.Pool({ connectionString: urlDoBancoDeTeste(), max: 2 })
const escolasDoTeste: string[] = []

/**
 * Escola de verdade, com rede própria: desde a tarefa 3.0 `job_registro` tem FK para `escola`, e id
 * inventado seria recusado pelo banco. O cenário cria as dele com `ops:escola`; aqui o insert é direto,
 * porque a conferência só olha `job_registro` e o banco de teste é descartável.
 */
async function escola(): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `with nova_rede as (insert into rede (nome, tipo) values ('Rede da conferência', 'independente') returning id)
     insert into escola (rede_id, nome, slug) select id, 'Escola da conferência', $1 from nova_rede returning id`,
    [`conferencia-${randomUUID()}`],
  )
  const id = rows[0]?.id
  if (id === undefined) throw new Error('escola de teste não criada')
  escolasDoTeste.push(id)
  return id
}

interface Linha {
  escolaId: string
  fila?: 'interativa' | 'normal' | 'lote'
  estado: 'aguardando' | 'publicado' | 'ativo' | 'concluido' | 'falhou'
  /** Há quantos ms o job foi criado. */
  criadoHaMs: number
  /** Quanto esperou para começar; sem isto, não começou. */
  esperaMs?: number
}

async function gravar(...linhas: Linha[]): Promise<void> {
  for (const { escolaId, fila = 'interativa', estado, criadoHaMs, esperaMs } of linhas) {
    await pool.query(
      `insert into job_registro (escola_id, fila, prioridade, tipo, estado, criado_em, iniciado_em, concluido_em, codigo_falha)
       values ($1, $2, 0, 'sintetico', $3,
               now() - make_interval(secs => $4::float8 / 1000),
               case when $5::float8 is null then null else now() - make_interval(secs => ($4::float8 - $5::float8) / 1000) end,
               case when $3 in ('concluido', 'falhou') then now() end,
               case when $3 = 'falhou' then 'ERRO_INTERNO' end)`,
      [escolaId, fila, estado, criadoHaMs, esperaMs ?? null],
    )
  }
}

beforeAll(async () => {
  await pool.query('select 1')
})

afterEach(async () => {
  await pool.query('delete from job_registro where escola_id = any($1::uuid[])', [escolasDoTeste.splice(0)])
})

afterAll(async () => {
  await pool.end()
})

describe('conferência do cenário de carga em job_registro', () => {
  it('aprova quando todo interativo começou dentro de 30 s e nenhum job falhou, com a espera por escola e fila', async () => {
    const [a, b] = await Promise.all([escola(), escola()])
    await gravar(
      { escolaId: a, estado: 'concluido', criadoHaMs: 60_000, esperaMs: 12_000 },
      { escolaId: a, estado: 'concluido', criadoHaMs: 50_000, esperaMs: 29_000 },
      // Lote que ainda nem começou, depois de muito tempo: é o acúmulo da escola A, e não reprova nada.
      { escolaId: a, fila: 'lote', estado: 'aguardando', criadoHaMs: 300_000 },
      { escolaId: b, estado: 'concluido', criadoHaMs: 40_000, esperaMs: 40 },
    )
    const conferencia = await conferirJobRegistro(pool, [a, b])
    expect(conferencia.reprovacoes).toEqual([])
    const daA = conferencia.linhas.find((linha) => linha.escolaId === a && linha.fila === 'interativa')
    expect(daA).toMatchObject({ total: 2, concluidos: 2, falhos: 0, semInicio: 0, acimaDoPrazo: 0 })
    expect(daA?.esperaMaximaMs).toBeGreaterThanOrEqual(28_900)
    expect(daA?.esperaMaximaMs).toBeLessThanOrEqual(29_100)
    expect(conferencia.linhas.find((linha) => linha.escolaId === a && linha.fila === 'lote')).toMatchObject({ semInicio: 1, acimaDoPrazo: 0, esperaP95Ms: null })
  })

  it('reprova com interativo que esperou mais de 30 s para começar, mesmo que tenha concluído', async () => {
    const a = await escola()
    await gravar({ escolaId: a, estado: 'concluido', criadoHaMs: 90_000, esperaMs: ESPERA_MAXIMA_INTERATIVO_MS + 1_000 })
    const { reprovacoes } = await conferirJobRegistro(pool, [a])
    expect(reprovacoes).toEqual(['1 job(s) interativo(s) esperaram mais de 30 s para começar'])
  })

  it('reprova com interativo que ainda não começou e já passou de 30 s: parado na fila também é espera', async () => {
    const a = await escola()
    await gravar({ escolaId: a, estado: 'publicado', criadoHaMs: 31_000 }, { escolaId: a, estado: 'aguardando', criadoHaMs: 1_000 })
    const conferencia = await conferirJobRegistro(pool, [a])
    expect(conferencia.reprovacoes).toEqual(['1 job(s) interativo(s) esperaram mais de 30 s para começar'])
    expect(conferencia.linhas[0]).toMatchObject({ semInicio: 2, acimaDoPrazo: 1 })
  })

  it('reprova com job falhou, em qualquer fila', async () => {
    const a = await escola()
    await gravar({ escolaId: a, fila: 'lote', estado: 'falhou', criadoHaMs: 20_000, esperaMs: 100 })
    expect((await conferirJobRegistro(pool, [a])).reprovacoes).toEqual(['1 job(s) terminaram falhou'])
  })

  it('só olha as escolas do cenário: a falha de outra escola no mesmo banco não entra', async () => {
    const [doCenario, outra] = await Promise.all([escola(), escola()])
    await gravar({ escolaId: doCenario, estado: 'concluido', criadoHaMs: 5_000, esperaMs: 30 }, { escolaId: outra, estado: 'falhou', criadoHaMs: 5_000, esperaMs: 30 })
    const conferencia = await conferirJobRegistro(pool, [doCenario])
    expect(conferencia.reprovacoes).toEqual([])
    expect(conferencia.linhas.map((linha) => linha.escolaId)).toEqual([doCenario])
  })

  it('reprova quando nenhum job das escolas está no banco: cenário que não enfileirou nada não passa', async () => {
    expect((await conferirJobRegistro(pool, [await escola()])).reprovacoes).toEqual(['nenhum job das escolas do cenário em job_registro'])
  })

  it('espera os interativos começarem até o prazo, sem esperar o lote', async () => {
    const a = await escola()
    await gravar({ escolaId: a, fila: 'lote', estado: 'aguardando', criadoHaMs: 1_000 }, { escolaId: a, estado: 'aguardando', criadoHaMs: 1_000 })
    const inicio = performance.now()
    const espera = aguardarInterativosIniciados(pool, [a], 20_000)
    await new Promise((resolver) => setTimeout(resolver, 1_500))
    await pool.query(`update job_registro set estado = 'ativo', iniciado_em = now() where escola_id = $1 and fila = 'interativa'`, [a])
    await espera
    expect(performance.now() - inicio).toBeLessThan(5_000)

    const b = await escola()
    await gravar({ escolaId: b, estado: 'aguardando', criadoHaMs: 1_000 })
    const inicioB = performance.now()
    await aguardarInterativosIniciados(pool, [b], 1_500)
    expect(performance.now() - inicioB).toBeGreaterThanOrEqual(1_400)
  })
})
