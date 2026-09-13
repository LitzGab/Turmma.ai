import { contextoAtual, criarLogger, type JobParaExecutar, type ResultadoDoInicio } from '@educa/nucleo'
import { CodigoDeErro, CodigoDeFalhaDeJob, type Fila } from '@educa/shared'
import { DelayedError, UnrecoverableError } from 'bullmq'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ESPERA_POR_VAGA_MS, ExecutorDeJobs, type DependenciasDoExecutor, type JobDaFila } from './executor.js'
import { FalhaDeJob } from './falha-de-job.js'

const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
const JOB_ID = '0190f5a0-0000-7000-8000-0000000000f1'

/** Executor com repository e vagas falsos que registram, em ordem, o que o worker fez. */
function montar({
  alvo = { fila: 'lote', escolaId: ESCOLA_A, finalizado: false },
  concede = true,
  processador = () => Promise.resolve(),
  liberar = () => Promise.resolve(),
  renovar = () => Promise.resolve(),
  tentativas = 5,
}: {
  /** `null`: a linha não existe na escola do contexto. */
  alvo?: JobParaExecutar | null
  concede?: boolean
  processador?: () => Promise<void>
  liberar?: () => Promise<void>
  renovar?: (eventos: string[]) => Promise<void>
  tentativas?: number
}) {
  const eventos: string[] = []
  const limites: Array<{ fila: Fila; escolaId: string | null; limite: number }> = []
  /** Cada marcação de uso, com a escola do contexto em que foi feita. */
  const marcacoes: string[] = []
  const dependencias: DependenciasDoExecutor = {
    repositorio: {
      localizarParaExecucao: () => {
        eventos.push(`localizar:${contextoAtual()?.escolaId ?? ''}`)
        return Promise.resolve(alvo ?? undefined)
      },
      iniciarExecucao: (): Promise<ResultadoDoInicio> => {
        eventos.push('iniciar')
        return Promise.resolve({ situacao: 'iniciado', tipo: 'sintetico', dados: {} })
      },
      concluir: () => {
        eventos.push('concluir')
        return Promise.resolve(true)
      },
      registrarFalha: () => Promise.resolve(true),
    },
    processadores: { sintetico: processador },
    logger: criarLogger({ servico: 'worker-teste', nivel: 'silent' }),
    vagas: {
      tomar: (fila, escolaId, limite, ids) => {
        eventos.push('tomar')
        limites.push({ fila, escolaId, limite })
        return Promise.resolve(new Set(concede ? ids : []))
      },
      renovar: () => {
        eventos.push('renovar')
        return renovar(eventos)
      },
      liberar: () => {
        eventos.push('liberar')
        return liberar()
      },
    },
    vagasDaEscola: { daEscola: () => Promise.resolve({ interativa: 5, normal: 5, lote: 3 }) },
    uso: { marcar: (metrica) => marcacoes.push(`${metrica}:${contextoAtual()?.escolaId ?? 'sem escola'}`) },
    intervaloRenovacaoMs: 100,
  }
  const moveToDelayed = vi.fn<JobDaFila['moveToDelayed']>(() => Promise.resolve())
  const job = { id: JOB_ID, data: { escolaId: ESCOLA_A, requisicaoId: null }, attemptsMade: 0, opts: { attempts: tentativas }, moveToDelayed } as unknown as JobDaFila
  return { executor: new ExecutorDeJobs(dependencias), eventos, limites, marcacoes, job, moveToDelayed }
}

describe('ExecutorDeJobs e a vaga', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('toma a vaga com a fila e a escola da linha e o limite da configuração da escola, antes de marcar ativo', async () => {
    const { executor, eventos, limites, job } = montar({ alvo: { fila: 'normal', escolaId: ESCOLA_A, finalizado: false } })
    await executor.processar(job, 'token')
    expect(eventos).toEqual([`localizar:${ESCOLA_A}`, 'tomar', 'iniciar', 'concluir', 'liberar'])
    expect(limites).toEqual([{ fila: 'normal', escolaId: ESCOLA_A, limite: 5 }])
  })

  it('sem vaga: volta à espera do BullMQ sem executar, sem marcar ativo e sem gastar tentativa', async () => {
    const processador = vi.fn(() => Promise.resolve())
    const { executor, eventos, job, moveToDelayed } = montar({ concede: false, processador })
    vi.setSystemTime(1_000_000)
    await expect(executor.processar(job, 'token')).rejects.toBeInstanceOf(DelayedError)
    expect(eventos).toEqual([`localizar:${ESCOLA_A}`, 'tomar'])
    expect(processador).not.toHaveBeenCalled()
    const [ate, token] = moveToDelayed.mock.calls[0] ?? []
    expect(token).toBe('token')
    expect(Number(ate) - 1_000_000).toBeGreaterThanOrEqual(ESPERA_POR_VAGA_MS)
    expect(Number(ate) - 1_000_000).toBeLessThan(ESPERA_POR_VAGA_MS * 1.5)
  })

  it('job inexistente ou de outra escola não toca vaga nenhuma', async () => {
    const { executor, eventos, job } = montar({ alvo: null })
    await expect(executor.processar(job, 'token')).rejects.toThrow(UnrecoverableError)
    await expect(executor.processar(job, 'token')).rejects.toThrow(CodigoDeErro.NAO_ENCONTRADO)
    expect(eventos.filter((evento) => !evento.startsWith('localizar'))).toEqual([])
  })

  it('renova enquanto roda, e nenhuma renovação começa depois de a liberação ser pedida, mesmo com a liberação lenta', async () => {
    let terminarProcessador: () => void = () => undefined
    let responderLiberacao: () => void = () => undefined
    const { executor, eventos, job } = montar({
      processador: () => new Promise<void>((resolver) => (terminarProcessador = resolver)),
      liberar: () => new Promise<void>((resolver) => (responderLiberacao = resolver)),
    })
    const execucao = executor.processar(job, 'token')
    await vi.advanceTimersByTimeAsync(350)
    expect(eventos.filter((evento) => evento === 'renovar')).toHaveLength(3)

    terminarProcessador()
    await vi.advanceTimersByTimeAsync(0)
    expect(eventos.at(-1)).toBe('liberar')
    // A liberação demora vários intervalos para responder: nenhuma renovação sai nesse tempo.
    await vi.advanceTimersByTimeAsync(1_000)
    responderLiberacao()
    await execucao
    await vi.advanceTimersByTimeAsync(1_000)
    expect(eventos.slice(eventos.indexOf('liberar'))).toEqual(['liberar'])
  })

  it('renovação em andamento quando o job termina: a liberação só sai depois dela', async () => {
    let responderRenovacao: () => void = () => undefined
    const { executor, eventos, job } = montar({
      processador: () => new Promise<void>((resolver) => setTimeout(resolver, 150)),
      // A renovação do primeiro intervalo fica pendurada até o teste responder.
      renovar: (registro) =>
        new Promise<void>((resolver) => {
          responderRenovacao = () => {
            registro.push('renovou')
            resolver()
          }
        }),
    })
    const execucao = executor.processar(job, 'token')
    await vi.advanceTimersByTimeAsync(160)
    expect(eventos.filter((evento) => evento === 'renovar')).toHaveLength(1)
    expect(eventos).not.toContain('liberar')
    responderRenovacao()
    await execucao
    expect(eventos.slice(eventos.indexOf('renovar'))).toEqual(['renovar', 'concluir', 'renovou', 'liberar'])
  })

  /** Processador que falha em 150 ms, com a renovação do primeiro intervalo pendurada até o teste responder. */
  function comFalhaDuranteRenovacao(definitiva: boolean) {
    let responderRenovacao: () => void = () => undefined
    const montado = montar({
      processador: () => new Promise<void>((_resolver, rejeitar) => setTimeout(() => rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.FALHA_SINTETICA, definitiva)), 150)),
      renovar: (registro) =>
        new Promise<void>((resolver) => {
          responderRenovacao = () => {
            registro.push('renovou')
            resolver()
          }
        }),
    })
    return { ...montado, responderRenovacao: () => responderRenovacao() }
  }

  it('falha definitiva com renovação em andamento: a liberação só sai depois dela, e nenhuma renovação vem depois', async () => {
    const { executor, eventos, job, responderRenovacao } = comFalhaDuranteRenovacao(true)
    const execucao = executor.processar(job, 'token')
    const rejeitada = expect(execucao).rejects.toBeInstanceOf(UnrecoverableError)
    await vi.advanceTimersByTimeAsync(160)
    expect(eventos.filter((evento) => evento === 'renovar')).toHaveLength(1)
    expect(eventos).not.toContain('liberar')

    responderRenovacao()
    await rejeitada
    await vi.advanceTimersByTimeAsync(1_000)
    expect(eventos.slice(eventos.indexOf('renovar'))).toEqual(['renovar', 'renovou', 'liberar'])
  })

  it('falha que ainda vai ser tentada de novo: a vaga fica com o job, e a renovação para ao sair', async () => {
    const { executor, eventos, job, responderRenovacao } = comFalhaDuranteRenovacao(false)
    const execucao = executor.processar(job, 'token')
    const rejeitada = expect(execucao).rejects.toThrow(CodigoDeFalhaDeJob.FALHA_SINTETICA)
    await vi.advanceTimersByTimeAsync(160)
    responderRenovacao()
    await rejeitada
    await vi.advanceTimersByTimeAsync(1_000)
    expect(eventos).not.toContain('liberar')
    expect(eventos.filter((evento) => evento === 'renovar')).toHaveLength(1)
  })

  describe('uso da escola', () => {
    it('cada tentativa que começa conta um job na escola do job, inclusive a que falha e vai ser tentada de novo', async () => {
      let falhar = true
      const { executor, marcacoes, job } = montar({ processador: () => (falhar ? Promise.reject(new Error('instável')) : Promise.resolve()) })
      await expect(executor.processar(job, 'token')).rejects.toThrow()
      falhar = false
      await executor.processar({ ...job, attemptsMade: 1 } as JobDaFila, 'token')
      expect(marcacoes).toEqual([`jobs:${ESCOLA_A}`, `jobs:${ESCOLA_A}`])
    })

    it('job que não começa não conta: sem vaga, de outra escola ou já finalizado', async () => {
      const semVaga = montar({ concede: false })
      await expect(semVaga.executor.processar(semVaga.job, 'token')).rejects.toBeInstanceOf(DelayedError)
      const deOutraEscola = montar({ alvo: null })
      await expect(deOutraEscola.executor.processar(deOutraEscola.job, 'token')).rejects.toThrow(UnrecoverableError)
      const finalizado = montar({ alvo: { fila: 'lote', escolaId: ESCOLA_A, finalizado: true } })
      await finalizado.executor.processar(finalizado.job, 'token')
      expect([...semVaga.marcacoes, ...deOutraEscola.marcacoes, ...finalizado.marcacoes]).toEqual([])
    })
  })
})
