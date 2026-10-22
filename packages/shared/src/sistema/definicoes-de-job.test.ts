import { describe, expect, expectTypeOf, it } from 'vitest'
import { z } from 'zod'
import {
  DEFINICOES_DE_JOB,
  definirJob,
  TIPO_CONSOLIDAR_USO,
  TIPO_ELIMINAR_TITULAR,
  TIPO_EXPURGAR_ACESSO,
  TIPO_EXPURGAR_DADO_PESSOAL,
  TIPO_EXPURGAR_ESCOLA,
  TIPO_EXPURGAR_JOBS,
  TIPO_JOB_SINTETICO,
  TIPO_MONTAR_ARQUIVO,
  type DadosDoJob,
  type DefinicaoDeJob,
  type OpcoesDoJob,
  type TipoDeJob,
} from './definicoes-de-job.js'
import { FILAS } from './jobs.js'

const OS_8_TIPOS = [
  TIPO_MONTAR_ARQUIVO,
  TIPO_ELIMINAR_TITULAR,
  TIPO_EXPURGAR_ESCOLA,
  TIPO_CONSOLIDAR_USO,
  TIPO_EXPURGAR_ACESSO,
  TIPO_EXPURGAR_JOBS,
  TIPO_EXPURGAR_DADO_PESSOAL,
  TIPO_JOB_SINTETICO,
] as const

const UM_UUID = '0191f3a6-6b9e-7c1a-8f35-2d4c5b6a7e80'

const base = { filas: ['lote'], escopo: 'escola', executor: 'worker', retentativa: { tentativas: 1, recuoMs: 1, jitter: 0 }, prazoMs: 1, naoUrgente: true } as const

describe('o registro de jobs', () => {
  it('tem os 8 tipos de hoje, com o nome que o banco e o worker já usam', () => {
    expect(Object.keys(DEFINICOES_DE_JOB).sort()).toEqual(
      [
        'titular.montar-arquivo',
        'titular.eliminar',
        'retencao.expurgar-escola',
        'sistema.consolidar-uso',
        'sistema.expurgar-acesso',
        'sistema.expurgar-jobs',
        'sistema.expurgar-dado-pessoal',
        'sintetico',
      ].sort(),
    )
    expect([...OS_8_TIPOS].sort()).toEqual(Object.keys(DEFINICOES_DE_JOB).sort())
  })

  it('cada tipo declara a fila, o não urgente, o escopo e o executor de hoje', () => {
    const resumo = Object.fromEntries(Object.entries(DEFINICOES_DE_JOB).map(([tipo, d]) => [tipo, [d.filas, d.naoUrgente, d.escopo, d.executor]]))
    expect(resumo).toEqual({
      'titular.montar-arquivo': [['normal'], false, 'escola', 'worker'],
      'titular.eliminar': [['lote'], true, 'escola', 'worker'],
      'retencao.expurgar-escola': [['lote'], true, 'escola', 'worker'],
      'sistema.consolidar-uso': [['lote'], true, 'sistema', 'worker'],
      'sistema.expurgar-acesso': [['lote'], true, 'sistema', 'worker'],
      'sistema.expurgar-jobs': [['lote'], true, 'sistema', 'worker'],
      'sistema.expurgar-dado-pessoal': [['lote'], true, 'sistema', 'worker'],
      sintetico: [[...FILAS], 'do-pedido', 'escola', 'worker'],
    })
  })

  it('o escopo é `sistema` se, e somente se, o tipo começa com `sistema.`: é o que o check do banco aceita', () => {
    for (const [tipo, definicao] of Object.entries(DEFINICOES_DE_JOB)) {
      expect(definicao.escopo === 'sistema', tipo).toBe(tipo.startsWith('sistema.'))
    }
  })

  it('o payload de hoje de cada tipo passa, e a chave a mais não', () => {
    const pedidoId = UM_UUID
    const payloads: Record<TipoDeJob, Record<string, unknown>> = {
      [TIPO_MONTAR_ARQUIVO]: { pedidoId },
      [TIPO_ELIMINAR_TITULAR]: { pedidoId },
      [TIPO_EXPURGAR_ESCOLA]: {},
      [TIPO_CONSOLIDAR_USO]: {},
      [TIPO_EXPURGAR_ACESSO]: {},
      [TIPO_EXPURGAR_JOBS]: {},
      [TIPO_EXPURGAR_DADO_PESSOAL]: {},
      [TIPO_JOB_SINTETICO]: { cpuMs: 0, falhar: false },
    }
    for (const tipo of OS_8_TIPOS) {
      const { dados } = DEFINICOES_DE_JOB[tipo]
      expect(dados.safeParse(payloads[tipo]).success, `${tipo} aceita o de hoje`).toBe(true)
      expect(dados.safeParse({ ...payloads[tipo], escolaId: UM_UUID }).success, `${tipo} recusa a chave a mais`).toBe(false)
    }
  })

  it('o prazo é positivo e a retentativa é a de hoje: cinco tentativas, recuo de 2 s e jitter de 0,5', () => {
    for (const [tipo, definicao] of Object.entries(DEFINICOES_DE_JOB)) {
      expect(definicao.prazoMs, tipo).toBeGreaterThan(0)
      expect(definicao.retentativa, tipo).toEqual({ tentativas: 5, recuoMs: 2_000, jitter: 0.5 })
    }
  })

  it('o prazo do sintético cobre o teto de CPU dele', () => {
    expect(DEFINICOES_DE_JOB[TIPO_JOB_SINTETICO].prazoMs).toBeGreaterThan(60_000)
  })
})

describe('definirJob', () => {
  it('devolve a definição que recebeu, com o esquema estrito de `z.strictObject` ou de `.strict()`', () => {
    const estrita = { ...base, dados: z.strictObject({ id: z.uuid() }) }
    const comMetodo = { ...base, dados: z.object({ id: z.uuid() }).strict() }
    expect(definirJob(estrita)).toBe(estrita)
    expect(definirJob(comMetodo)).toBe(comMetodo)
  })

  it('recusa, ao carregar, o esquema que ignora chave a mais: `z.object()` tem o mesmo tipo do estrito', () => {
    expect(() => definirJob({ ...base, dados: z.object({ id: z.uuid() }) })).toThrow(TypeError)
  })

  it('não compila: esquema que aceita chave a mais, definição sem prazo, sem fila ou com valor fora do que se declara', () => {
    // O compilador é o teste: cada linha precisa do seu `@ts-expect-error`, e nada disto roda.
    const naoChamada = () => [
      // @ts-expect-error `z.looseObject` aceita qualquer chave
      definirJob({ ...base, dados: z.looseObject({ id: z.uuid() }) }),
      // @ts-expect-error `.catchall()` também
      definirJob({ ...base, dados: z.object({ id: z.uuid() }).catchall(z.unknown()) }),
      // @ts-expect-error falta o prazo
      definirJob({ filas: ['lote'], escopo: 'escola', executor: 'worker', retentativa: base.retentativa, naoUrgente: true, dados: z.strictObject({}) }),
      // @ts-expect-error uma definição sem fila
      definirJob({ ...base, filas: [], dados: z.strictObject({}) }),
      // @ts-expect-error fila que não existe
      definirJob({ ...base, filas: ['urgentissima'], dados: z.strictObject({}) }),
      // @ts-expect-error o escopo é `escola` ou `sistema`
      definirJob({ ...base, escopo: 'rede', dados: z.strictObject({}) }),
    ]
    expect(naoChamada).toBeTypeOf('function')
  })
})

describe('os tipos que o `Enfileirador` lê da definição', () => {
  it('o tipo é uma das chaves do registro, e os dados são os do tipo', () => {
    expectTypeOf<TipoDeJob>().toEqualTypeOf<(typeof OS_8_TIPOS)[number]>()
    expectTypeOf<DadosDoJob<typeof TIPO_MONTAR_ARQUIVO>>().toEqualTypeOf<{ pedidoId: string }>()
    expectTypeOf<DadosDoJob<typeof TIPO_EXPURGAR_JOBS>>().toEqualTypeOf<Record<string, never>>()
    // @ts-expect-error tipo que não está no registro
    const deTipoInexistente: DadosDoJob<'tipo.inexistente'> = {}
    // @ts-expect-error os dados de montar-arquivo não são os do sintético
    const deOutroTipo: DadosDoJob<typeof TIPO_MONTAR_ARQUIVO> = { cpuMs: 0, falhar: false }
    expect([deTipoInexistente, deOutroTipo]).toHaveLength(2)
  })

  it('a fila das opções é uma das do tipo, e o não urgente só existe no tipo que o deixa com quem enfileira', () => {
    expectTypeOf<OpcoesDoJob<typeof TIPO_MONTAR_ARQUIVO>>().toEqualTypeOf<{ readonly fila?: 'normal' } & { readonly naoUrgente?: never }>()
    expectTypeOf<OpcoesDoJob<typeof TIPO_JOB_SINTETICO>>().toEqualTypeOf<{ readonly fila?: 'interativa' | 'normal' | 'lote' } & { readonly naoUrgente: boolean }>()
  })

  it('uma definição, vista como `DefinicaoDeJob`, tem os campos que o Enfileirador e o worker leem', () => {
    const definicao: DefinicaoDeJob = DEFINICOES_DE_JOB[TIPO_MONTAR_ARQUIVO]
    expect(Object.keys(definicao).sort()).toEqual(['dados', 'escopo', 'executor', 'filas', 'naoUrgente', 'prazoMs', 'retentativa'])
  })
})
