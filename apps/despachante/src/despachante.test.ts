import { contextoAtual, criarLogger, type EscolaComPendentes, type JobReservado } from '@educa/nucleo'
import type { Fila } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { Despachante, type DependenciasDoDespachante } from './despachante.js'

const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
const ESCOLA_B = '0190f5a0-0000-7000-8000-00000000000b'
const ESCOLA_C = '0190f5a0-0000-7000-8000-00000000000c'

interface Reserva {
  fila: Fila
  escolaId: string | null
  rotinaDoSistema: boolean
  limite: number
}

/** Despachante com repository, vagas e fila falsos, que registram o que o despachante pediu e em que contexto. */
function montar({
  pendentes,
  livres = () => 5,
  conceder = (ids: readonly string[]) => ids,
  publicacaoFalha = false,
  vagasDaEscola = { interativa: 5, normal: 5, lote: 2 },
  lote,
  publicadosDaEscola = [],
  membrosDaVaga = [],
}: {
  pendentes: EscolaComPendentes[]
  livres?: (fila: Fila, escolaId: string | null, limite: number) => number
  conceder?: (ids: readonly string[]) => readonly string[]
  publicacaoFalha?: boolean
  vagasDaEscola?: Record<Fila, number>
  lote?: number
  publicadosDaEscola?: string[]
  membrosDaVaga?: string[]
}) {
  const ordem: string[] = []
  const reservas: Reserva[] = []
  const devolvidos: string[] = []
  const publicados: string[] = []
  const liberados: string[] = []
  const consultasDePublicados: string[][] = []
  const mantidas: Array<{ escolaId: string | null; ids: readonly string[] }> = []
  const tomadas: Array<{ fila: Fila; escolaId: string | null; limite: number; ids: readonly string[] }> = []
  let sequencia = 0

  const repositorio: DependenciasDoDespachante['repositorio'] = {
    listarEscolasComPendentes: () => Promise.resolve(pendentes),
    publicadosEntre: (ids: readonly string[]) => {
      consultasDePublicados.push([...ids])
      return Promise.resolve(publicadosDaEscola)
    },
    reservarDaEscola: (fila: Fila, limite: number): Promise<JobReservado[]> => {
      const contexto = contextoAtual()
      const escolaId = contexto?.escolaId ?? null
      reservas.push({ fila, escolaId, rotinaDoSistema: contexto?.rotinaDoSistema === true, limite })
      return Promise.resolve(Array.from({ length: limite }, () => ({ id: `job-${++sequencia}`, escolaId, requisicaoId: null, tipo: 'sintetico', fila })))
    },
    devolverParaAguardando: (ids: readonly string[]) => {
      devolvidos.push(...ids)
      return Promise.resolve(ids.length)
    },
    marcarPublicados: (ids: readonly string[]) => Promise.resolve(ids.length),
  }

  const dependencias: DependenciasDoDespachante = {
    repositorio,
    fila: {
      publicar: (jobs) => {
        if (publicacaoFalha) return Promise.reject(new Error('Redis fora'))
        publicados.push(...jobs.map((job) => job.id))
        return Promise.resolve()
      },
    },
    vagas: {
      membros: () => {
        ordem.push('membros')
        return Promise.resolve(membrosDaVaga)
      },
      manter: (_fila, escolaId, ids) => {
        ordem.push('manter')
        mantidas.push({ escolaId, ids })
        return Promise.resolve()
      },
      livres: (fila, escolaId, limite) => {
        ordem.push('livres')
        return Promise.resolve(livres(fila, escolaId, limite))
      },
      tomar: (fila, escolaId, limite, ids) => {
        tomadas.push({ fila, escolaId, limite, ids })
        return Promise.resolve(new Set(conceder(ids)))
      },
      liberar: (_fila, _escolaId, ids) => {
        liberados.push(...ids)
        return Promise.resolve()
      },
    },
    vagasDaEscola: { daEscola: () => Promise.resolve(vagasDaEscola) },
    logger: criarLogger({ servico: 'despachante-teste', nivel: 'silent' }),
  }
  return { despachante: new Despachante(dependencias, lote === undefined ? {} : { lote }), reservas, devolvidos, publicados, liberados, tomadas, mantidas, ordem, consultasDePublicados }
}

describe('Despachante.rodada', () => {
  it('atende as filas em ordem de prioridade, e em cada fila as escolas em rodízio: quem começa muda a cada rodada', async () => {
    const pendentes: EscolaComPendentes[] = [
      { fila: 'lote', escolaId: ESCOLA_A },
      { fila: 'lote', escolaId: ESCOLA_B },
      { fila: 'interativa', escolaId: ESCOLA_A },
      { fila: 'interativa', escolaId: ESCOLA_B },
      { fila: 'interativa', escolaId: ESCOLA_C },
      { fila: 'normal', escolaId: ESCOLA_C },
    ]
    const { despachante, reservas } = montar({ pendentes, livres: () => 1 })
    const ordem = () => reservas.splice(0).map(({ fila, escolaId }) => `${fila}:${escolaId?.slice(-1)}`)

    await despachante.rodada()
    expect(ordem()).toEqual(['interativa:a', 'interativa:b', 'interativa:c', 'normal:c', 'lote:a', 'lote:b'])
    await despachante.rodada()
    expect(ordem()).toEqual(['interativa:b', 'interativa:c', 'interativa:a', 'normal:c', 'lote:b', 'lote:a'])
    await despachante.rodada()
    expect(ordem()).toEqual(['interativa:c', 'interativa:a', 'interativa:b', 'normal:c', 'lote:a', 'lote:b'])
  })

  it('reserva no contexto da escola, só as vagas livres, e toma a vaga com o limite da fila na configuração dela', async () => {
    const { despachante, reservas, tomadas, publicados } = montar({
      pendentes: [{ fila: 'lote', escolaId: ESCOLA_A }],
      livres: () => 2,
      vagasDaEscola: { interativa: 5, normal: 5, lote: 7 },
    })
    expect(await despachante.rodada()).toBe(2)
    expect(reservas).toEqual([{ fila: 'lote', escolaId: ESCOLA_A, rotinaDoSistema: false, limite: 2 }])
    expect(tomadas).toEqual([{ fila: 'lote', escolaId: ESCOLA_A, limite: 7, ids: ['job-1', 'job-2'] }])
    expect(publicados).toEqual(['job-1', 'job-2'])
  })

  it('renova a vaga dos jobs já publicados e ainda não iniciados antes de estimar as livres: busca só entre os que têm vaga', async () => {
    const { despachante, mantidas, ordem, consultasDePublicados } = montar({
      pendentes: [{ fila: 'lote', escolaId: ESCOLA_A }],
      membrosDaVaga: ['publicado-1', 'publicado-2', 'ativo-1'],
      publicadosDaEscola: ['publicado-1', 'publicado-2'],
      livres: () => 0,
    })
    await despachante.rodada()
    expect(consultasDePublicados).toEqual([['publicado-1', 'publicado-2', 'ativo-1']])
    expect(mantidas).toEqual([{ escolaId: ESCOLA_A, ids: ['publicado-1', 'publicado-2'] }])
    expect(ordem).toEqual(['membros', 'manter', 'livres'])
  })

  it('escola sem vaga livre nem reserva: nenhuma escrita no banco a cada rodada', async () => {
    const { despachante, reservas, tomadas } = montar({ pendentes: [{ fila: 'lote', escolaId: ESCOLA_A }], livres: () => 0 })
    expect(await despachante.rodada()).toBe(0)
    expect(reservas).toEqual([])
    expect(tomadas).toEqual([])
  })

  it('vaga negada depois da reserva: a linha volta a aguardando e não é publicada', async () => {
    const { despachante, devolvidos, publicados, liberados } = montar({
      pendentes: [{ fila: 'interativa', escolaId: ESCOLA_A }],
      livres: () => 3,
      conceder: (ids) => ids.slice(0, 1),
    })
    expect(await despachante.rodada()).toBe(1)
    expect(publicados).toEqual(['job-1'])
    expect(devolvidos).toEqual(['job-2', 'job-3'])
    expect(liberados).toEqual([])
  })

  it('publicação que falha devolve as vagas tomadas, e a reserva fica para vencer', async () => {
    const { despachante, devolvidos, liberados } = montar({ pendentes: [{ fila: 'normal', escolaId: ESCOLA_B }], livres: () => 2, publicacaoFalha: true })
    expect(await despachante.rodada()).toBe(0)
    expect(liberados).toEqual(['job-1', 'job-2'])
    expect(devolvidos).toEqual([])
  })

  it('Redis de fila sem resposta na vaga de uma escola: a rodada termina ali, sem reservar nada e sem tentar as outras', async () => {
    const consultadas: Array<string | null> = []
    const { despachante, reservas } = montar({
      pendentes: [
        { fila: 'interativa', escolaId: ESCOLA_A },
        { fila: 'interativa', escolaId: ESCOLA_B },
        { fila: 'lote', escolaId: ESCOLA_C },
      ],
      livres: (_fila, escolaId) => {
        consultadas.push(escolaId)
        throw new Error('Command timed out')
      },
    })
    expect(await despachante.rodada()).toBe(0)
    expect(consultadas).toEqual([ESCOLA_A])
    expect(reservas).toEqual([])
  })

  it('rotina do sistema (sem escola) reserva no contexto de rotina, com a vaga própria do sistema', async () => {
    const { despachante, reservas, tomadas } = montar({ pendentes: [{ fila: 'lote', escolaId: null }], livres: () => 1 })
    await despachante.rodada()
    expect(reservas).toEqual([{ fila: 'lote', escolaId: null, rotinaDoSistema: true, limite: 1 }])
    expect(tomadas.map(({ escolaId }) => escolaId)).toEqual([null])
  })

  it('para no teto de publicações da rodada, e a próxima continua pela escola seguinte do rodízio', async () => {
    const pendentes: EscolaComPendentes[] = [
      { fila: 'interativa', escolaId: ESCOLA_A },
      { fila: 'interativa', escolaId: ESCOLA_B },
    ]
    const { despachante, reservas } = montar({ pendentes, livres: () => 100, lote: 100 })
    expect(await despachante.rodada()).toBe(100)
    expect(reservas.splice(0).map(({ escolaId, limite }) => [escolaId, limite])).toEqual([[ESCOLA_A, 100]])
    expect(await despachante.rodada()).toBe(100)
    expect(reservas.splice(0).map(({ escolaId }) => escolaId)).toEqual([ESCOLA_B])
  })
})
