import { OPCOES_DE_JOB_PUBLICADO, type JobReservado } from '@educa/nucleo'
import { CodigoDeFalhaDeJob } from '@educa/shared'
import { describe, expect, it, vi } from 'vitest'
import { PrazoDaFilaEsgotado, PublicacaoBullMQ, type FilaBullMQ } from './fila-de-publicacao.js'

const JOB: JobReservado = {
  id: '0190f5a0-0000-7000-8000-0000000000f1',
  escolaId: '0190f5a0-0000-7000-8000-00000000000a',
  requisicaoId: '0190f5a0-0000-7000-8000-0000000000e1',
  tipo: 'sintetico',
  fila: 'interativa',
}

type JobNaFila = Awaited<ReturnType<FilaBullMQ['getJob']>>

/** `Queue` falsa: pronta na hora, sem job nenhum, e cada parte trocável pelo teste. */
function filaFalsa(partes: Partial<FilaBullMQ> = {}): FilaBullMQ {
  return {
    waitUntilReady: () => Promise.resolve(),
    addBulk: () => Promise.resolve([]),
    getJob: () => Promise.resolve(undefined),
    close: () => Promise.resolve(),
    ...partes,
  }
}

function jobNaFila(estado: string, failedReason = ''): JobNaFila {
  return { failedReason, getState: () => Promise.resolve(estado) }
}

describe('PublicacaoBullMQ', () => {
  it('publica cada job com o id da linha como jobId, as opções de retentativa, e só escola e requisição no data', async () => {
    const addBulk = vi.fn<FilaBullMQ['addBulk']>(() => Promise.resolve([]))
    await new PublicacaoBullMQ(() => filaFalsa({ addBulk })).publicar([JOB])
    expect(addBulk).toHaveBeenCalledExactlyOnceWith([
      { name: 'sintetico', data: { escolaId: JOB.escolaId, requisicaoId: JOB.requisicaoId }, opts: { ...OPCOES_DE_JOB_PUBLICADO, jobId: JOB.id } },
    ])
  })

  it('Redis fora quando o despachante sobe: a Queue esperaria o Redis sem limite, e a publicação desiste no prazo', async () => {
    const nuncaFicaPronta = filaFalsa({ waitUntilReady: () => new Promise(() => undefined) })
    const publicacao = new PublicacaoBullMQ(() => nuncaFicaPronta, 50)
    const inicio = performance.now()
    await expect(publicacao.publicar([JOB])).rejects.toBeInstanceOf(PrazoDaFilaEsgotado)
    await expect(publicacao.consultar(JOB.id)).rejects.toBeInstanceOf(PrazoDaFilaEsgotado)
    expect(performance.now() - inicio).toBeLessThan(1_000)
  })

  it('comando travado: a publicação desiste no prazo, mesmo que o comando nunca responda', async () => {
    const publicacao = new PublicacaoBullMQ(() => filaFalsa({ addBulk: () => new Promise(() => undefined) }), 50)
    await expect(publicacao.publicar([JOB])).rejects.toBeInstanceOf(PrazoDaFilaEsgotado)
  })

  it('a preparação da Queue falhou (o BullMQ guarda essa falha para sempre): a operação falha, e a seguinte já usa uma Queue nova', async () => {
    const quebrada = filaFalsa({ waitUntilReady: () => Promise.reject(new Error('Connection is closed.')), close: vi.fn(() => Promise.resolve()) })
    const addBulkDaNova = vi.fn<FilaBullMQ['addBulk']>(() => Promise.resolve([]))
    const criadas = [quebrada, filaFalsa({ addBulk: addBulkDaNova })]
    const criar = vi.fn(() => criadas.shift() ?? filaFalsa())
    const publicacao = new PublicacaoBullMQ(criar)

    await expect(publicacao.publicar([JOB])).rejects.toThrow('Connection is closed.')
    expect(quebrada.close).toHaveBeenCalledOnce()
    await publicacao.publicar([JOB])
    expect(addBulkDaNova).toHaveBeenCalledOnce()
    expect(criar).toHaveBeenCalledTimes(2)
  })

  it('esperar o Redis ficar pronto não é falha da preparação: no prazo, a Queue não é trocada', async () => {
    const criar = vi.fn(() => filaFalsa({ waitUntilReady: () => new Promise(() => undefined) }))
    const publicacao = new PublicacaoBullMQ(criar, 20)
    await expect(publicacao.publicar([JOB])).rejects.toBeInstanceOf(PrazoDaFilaEsgotado)
    expect(criar).toHaveBeenCalledOnce()
  })

  describe('consultar', () => {
    const consultar = (job: JobNaFila) => new PublicacaoBullMQ(() => filaFalsa({ getJob: () => Promise.resolve(job) })).consultar(JOB.id)

    it('inexistente só quando a fila não tem o job', async () => {
      expect(await consultar(undefined)).toEqual({ situacao: 'inexistente' })
    })

    it.each(['waiting', 'active', 'delayed', 'prioritized', 'completed', 'unknown'])('presente quando a fila tem o job em %s', async (estado) => {
      expect(await consultar(jobNaFila(estado))).toEqual({ situacao: 'presente' })
    })

    it('falhou, com o código que o worker mandou à fila', async () => {
      expect(await consultar(jobNaFila('failed', CodigoDeFalhaDeJob.FALHA_SINTETICA))).toEqual({ situacao: 'falhou', codigo: CodigoDeFalhaDeJob.FALHA_SINTETICA })
    })

    it('falhou com motivo que não é código nosso (stalled acima do limite do BullMQ): erro interno', async () => {
      expect(await consultar(jobNaFila('failed', 'job stalled more than allowable limit'))).toEqual({ situacao: 'falhou', codigo: CodigoDeFalhaDeJob.ERRO_INTERNO })
    })
  })
})
