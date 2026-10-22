import { contextoAtual, criarLogger, type JobParaExecutar, type ResultadoDoInicio } from '@educa/nucleo'
import { CodigoDeErro, CodigoDeFalhaDeJob, definirJob, DEFINICOES_DE_JOB, TIPO_CONSOLIDAR_USO, TIPO_ELIMINAR_TITULAR, TIPO_EXPURGAR_ACESSO, TIPO_EXPURGAR_DADO_PESSOAL, TIPO_EXPURGAR_ESCOLA, TIPO_EXPURGAR_JOBS, TIPO_JOB_SINTETICO, TIPO_MONTAR_ARQUIVO, type Fila, type RegistroDeJobs, type TipoDeJob } from '@educa/shared'
import { DelayedError, UnrecoverableError } from 'bullmq'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AvisoDeVagaLivre, ESPERA_POR_VAGA_MS, ExecutorDeJobs, type DependenciasDoExecutor, type JobDaFila, type Processador, type ProcessadoresDeJob } from './executor.js'
import { FalhaDeJob } from './falha-de-job.js'

const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
const JOB_ID = '0190f5a0-0000-7000-8000-0000000000f1'

/** Executor com repository e vagas falsos que registram, em ordem, o que o worker fez. */
function montar({
  alvo = { fila: 'lote', escolaId: ESCOLA_A, finalizado: false },
  concede = true,
  processador = () => Promise.resolve(),
  processadores,
  tipo = 'sintetico',
  dados = { cpuMs: 0, falhar: false },
  definicoes,
  liberar = () => Promise.resolve(),
  renovar = () => Promise.resolve(),
  tentativas = 5,
}: {
  /** `null`: a linha não existe na escola do contexto. */
  alvo?: JobParaExecutar | null
  concede?: boolean
  processador?: Processador
  /** Os processadores da réplica, no lugar do `processador` no tipo sintético. */
  processadores?: ProcessadoresDeJob
  /** O tipo e os dados que a linha tem em `job_registro`: o que o executor valida. */
  tipo?: string
  dados?: Record<string, unknown>
  /** O registro de jobs que o executor usa, no lugar do `DEFINICOES_DE_JOB`. */
  definicoes?: RegistroDeJobs
  liberar?: () => Promise<void>
  renovar?: (eventos: string[]) => Promise<void>
  tentativas?: number
}) {
  const eventos: string[] = []
  /** O código de cada falha definitiva que o executor gravou na linha. */
  const falhas: string[] = []
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
        return Promise.resolve({ situacao: 'iniciado', tipo, dados })
      },
      concluir: () => {
        eventos.push('concluir')
        return Promise.resolve(true)
      },
      registrarFalha: (_id, codigo) => {
        falhas.push(codigo)
        return Promise.resolve(true)
      },
    },
    processadores: processadores ?? { sintetico: processador },
    ...(definicoes === undefined ? {} : { definicoes }),
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
    aoLiberarVaga: () => eventos.push('avisou_vaga_livre'),
    intervaloRenovacaoMs: 100,
  }
  const moveToDelayed = vi.fn<JobDaFila['moveToDelayed']>(() => Promise.resolve())
  const job = { id: JOB_ID, data: { escolaId: alvo === null ? ESCOLA_A : alvo.escolaId, requisicaoId: null }, attemptsMade: 0, opts: { attempts: tentativas }, moveToDelayed } as unknown as JobDaFila
  return { executor: new ExecutorDeJobs(dependencias), eventos, falhas, limites, marcacoes, job, moveToDelayed }
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
    expect(eventos).toEqual([`localizar:${ESCOLA_A}`, 'tomar', 'iniciar', 'concluir', 'liberar', 'avisou_vaga_livre'])
    expect(limites).toEqual([{ fila: 'normal', escolaId: ESCOLA_A, limite: 5 }])
  })

  it('o processador recebe os dados da linha e a execução: a chave de idempotência é o id do job, igual em toda tentativa', async () => {
    const recebidos: Array<Parameters<Processador>> = []
    const { executor, job } = montar({ processador: (...argumentos) => (recebidos.push(argumentos), Promise.resolve()) })
    await executor.processar(job, 'token')
    await executor.processar({ ...job, attemptsMade: 3 } as JobDaFila, 'token')
    const { prazoMs } = DEFINICOES_DE_JOB[TIPO_JOB_SINTETICO]
    expect(recebidos).toEqual([
      [{ cpuMs: 0, falhar: false }, { jobId: JOB_ID, tentativa: 1, chaveIdempotencia: JOB_ID, prazoMs }],
      [{ cpuMs: 0, falhar: false }, { jobId: JOB_ID, tentativa: 4, chaveIdempotencia: JOB_ID, prazoMs }],
    ])
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
    expect(eventos.slice(eventos.indexOf('liberar'))).toEqual(['liberar', 'avisou_vaga_livre'])
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
    expect(eventos.slice(eventos.indexOf('renovar'))).toEqual(['renovar', 'concluir', 'renovou', 'liberar', 'avisou_vaga_livre'])
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
    expect(eventos.slice(eventos.indexOf('renovar'))).toEqual(['renovar', 'renovou', 'liberar', 'avisou_vaga_livre'])
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

  it('só avisa o despachante depois de a vaga sair do Redis: liberação que falhou não acorda ninguém', async () => {
    const { executor, eventos, job } = montar({ liberar: () => Promise.reject(new Error('redis fora')) })
    await executor.processar(job, 'token')
    expect(eventos.slice(eventos.indexOf('concluir'))).toEqual(['concluir', 'liberar'])
    // Sem vaga, o job volta à espera e não libera nada: também não há o que avisar.
    const semVaga = montar({ concede: false })
    await expect(semVaga.executor.processar(semVaga.job, 'token')).rejects.toBeInstanceOf(DelayedError)
    expect(semVaga.eventos).not.toContain('avisou_vaga_livre')
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

/** O payload que cada um dos 8 tipos tem hoje em `job_registro`: o que o executor precisa aceitar para nenhum job gravado antes quebrar. */
const PAYLOAD_DE_HOJE: Readonly<Record<TipoDeJob, Record<string, unknown>>> = {
  [TIPO_MONTAR_ARQUIVO]: { pedidoId: '0190f5a0-0000-7000-8000-0000000000c1' },
  [TIPO_ELIMINAR_TITULAR]: { pedidoId: '0190f5a0-0000-7000-8000-0000000000c2' },
  [TIPO_EXPURGAR_ESCOLA]: {},
  [TIPO_CONSOLIDAR_USO]: {},
  [TIPO_EXPURGAR_ACESSO]: {},
  [TIPO_EXPURGAR_JOBS]: {},
  [TIPO_EXPURGAR_DADO_PESSOAL]: {},
  [TIPO_JOB_SINTETICO]: { cpuMs: 5, falhar: false, efeito: true },
}

describe('ExecutorDeJobs e a definição do tipo', () => {
  /** A linha de `job_registro` que o worker lê, com a escola que o tipo pede: o job de rotina do sistema não tem escola. */
  const alvoDo = (tipo: TipoDeJob): JobParaExecutar => ({ fila: 'lote', escolaId: DEFINICOES_DE_JOB[tipo].escopo === 'sistema' ? null : ESCOLA_A, finalizado: false })

  it('o payload de hoje de cada um dos 8 tipos passa pela definição e chega ao processador do tipo, que roda uma vez', async () => {
    expect(Object.keys(PAYLOAD_DE_HOJE).sort()).toEqual(Object.keys(DEFINICOES_DE_JOB).sort())
    for (const [tipo, dados] of Object.entries(PAYLOAD_DE_HOJE) as Array<[TipoDeJob, Record<string, unknown>]>) {
      const processador = vi.fn<Processador>(() => Promise.resolve())
      const { executor, job, falhas } = montar({ tipo, dados, alvo: alvoDo(tipo), processadores: { [tipo]: processador } })
      await executor.processar(job, 'token')
      expect(falhas, tipo).toEqual([])
      expect(processador, tipo).toHaveBeenCalledOnce()
      expect(processador.mock.calls[0]?.[0], tipo).toEqual(dados)
    }
  })

  it.each([
    ['chave a mais (a escola no corpo)', { cpuMs: 0, falhar: false, escolaId: ESCOLA_A }],
    ['campo obrigatório ausente', { cpuMs: 0 }],
    ['valor fora do formato', { cpuMs: -1, falhar: false }],
    ['tipo do valor errado', { cpuMs: 0, falhar: 'sim' }],
  ])('dados que o esquema recusa (%s): falha definitiva DADOS_INVALIDOS na primeira tentativa, sem o processador e com a vaga devolvida', async (_caso, dados) => {
    const processador = vi.fn<Processador>(() => Promise.resolve())
    const { executor, job, falhas, eventos } = montar({ dados, processador })
    // Cinco tentativas e a primeira: dado inválido não melhora numa segunda, e a retentativa gastaria o recuo à toa.
    const erro = await executor.processar(job, 'token').catch((falha: unknown) => falha)
    expect(erro).toBeInstanceOf(UnrecoverableError)
    expect(erro).toMatchObject({ message: CodigoDeFalhaDeJob.DADOS_INVALIDOS })
    expect(falhas).toEqual([CodigoDeFalhaDeJob.DADOS_INVALIDOS])
    expect(processador).not.toHaveBeenCalled()
    expect(eventos).toContain('liberar')
  })

  it('tipo que o registro não tem: TIPO_DESCONHECIDO, definitivo, sem processador, e o erro não é um TypeError de quem lê a definição que falta', async () => {
    const processador = vi.fn<Processador>(() => Promise.resolve())
    const { executor, job, falhas } = montar({ tipo: 'tipo.de-uma-versao-antiga', dados: { qualquer: 'coisa' }, processador })
    await expect(executor.processar(job, 'token')).rejects.toThrow(CodigoDeFalhaDeJob.TIPO_DESCONHECIDO)
    expect(falhas).toEqual([CodigoDeFalhaDeJob.TIPO_DESCONHECIDO])
    expect(processador).not.toHaveBeenCalled()
  })

  it('tipo com definição e sem processador nesta réplica: TIPO_DESCONHECIDO, definitivo', async () => {
    const { executor, job, falhas } = montar({ tipo: TIPO_MONTAR_ARQUIVO, dados: PAYLOAD_DE_HOJE[TIPO_MONTAR_ARQUIVO], processadores: {} })
    await expect(executor.processar(job, 'token')).rejects.toThrow(CodigoDeFalhaDeJob.TIPO_DESCONHECIDO)
    expect(falhas).toEqual([CodigoDeFalhaDeJob.TIPO_DESCONHECIDO])
  })

  it('o escopo da definição se confere com a escola da linha: rotina do sistema com escola (escrita por SQL) e job de escola sem escola não rodam', async () => {
    const rotinaComEscola = vi.fn<Processador>(() => Promise.resolve())
    const sistemaComEscola = montar({ tipo: TIPO_EXPURGAR_JOBS, dados: {}, alvo: { fila: 'lote', escolaId: ESCOLA_A, finalizado: false }, processadores: { [TIPO_EXPURGAR_JOBS]: rotinaComEscola } })
    await expect(sistemaComEscola.executor.processar(sistemaComEscola.job, 'token')).rejects.toThrow(CodigoDeFalhaDeJob.DADOS_INVALIDOS)
    expect(sistemaComEscola.falhas).toEqual([CodigoDeFalhaDeJob.DADOS_INVALIDOS])

    const jobDeEscola = vi.fn<Processador>(() => Promise.resolve())
    const escolaSemEscola = montar({ tipo: TIPO_MONTAR_ARQUIVO, dados: PAYLOAD_DE_HOJE[TIPO_MONTAR_ARQUIVO], alvo: { fila: 'normal', escolaId: null, finalizado: false }, processadores: { [TIPO_MONTAR_ARQUIVO]: jobDeEscola } })
    await expect(escolaSemEscola.executor.processar(escolaSemEscola.job, 'token')).rejects.toThrow(CodigoDeFalhaDeJob.DADOS_INVALIDOS)
    expect(escolaSemEscola.falhas).toEqual([CodigoDeFalhaDeJob.DADOS_INVALIDOS])
    expect(rotinaComEscola).not.toHaveBeenCalled()
    expect(jobDeEscola).not.toHaveBeenCalled()
  })

  it('o processador recebe os dados que o esquema leu, com o `default` aplicado, e o prazo que a definição do tipo dá', async () => {
    const definicoes: RegistroDeJobs = {
      ...DEFINICOES_DE_JOB,
      [TIPO_JOB_SINTETICO]: definirJob({
        ...DEFINICOES_DE_JOB[TIPO_JOB_SINTETICO],
        dados: z.strictObject({ cpuMs: z.number().default(7), falhar: z.boolean().default(false) }),
        prazoMs: 1_234,
      }),
    }
    const recebidos: Array<Parameters<Processador>> = []
    const { executor, job } = montar({ dados: {}, definicoes, processador: (...argumentos) => (recebidos.push(argumentos), Promise.resolve()) })
    await executor.processar(job, 'token')
    expect(recebidos).toEqual([[{ cpuMs: 7, falhar: false }, { jobId: JOB_ID, tentativa: 1, chaveIdempotencia: JOB_ID, prazoMs: 1_234 }]])
  })

  it('o tipo dos dados do processador é o da definição: ler campo que ela não tem, ou registrar processador de tipo que ela não tem, não compila', () => {
    // @ts-expect-error `titular.montar-arquivo` só tem `pedidoId`
    const lerCampoInexistente: Processador<typeof TIPO_MONTAR_ARQUIVO> = ({ cpuMs }) => Promise.resolve(void cpuMs)
    // @ts-expect-error `sistema.fantasma` não está em `DEFINICOES_DE_JOB`
    const tipoSemDefinicao: ProcessadoresDeJob = { 'sistema.fantasma': () => Promise.resolve() }
    expect([typeof lerCampoInexistente, typeof tipoSemDefinicao]).toEqual(['function', 'object'])
  })
})

describe('AvisoDeVagaLivre', () => {
  it('um aviso por vez: as vagas liberadas enquanto ele vai ao banco viram um aviso só, logo depois', async () => {
    const respostas: Array<() => void> = []
    const enviar = vi.fn(() => new Promise<void>((resolver) => respostas.push(resolver)))
    const aviso = new AvisoDeVagaLivre(enviar, () => undefined)
    aviso.avisar()
    for (let vaga = 0; vaga < 50; vaga++) aviso.avisar()
    expect(enviar).toHaveBeenCalledTimes(1)
    respostas.shift()?.()
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(2))
    respostas.shift()?.()
    await new Promise((resolver) => setTimeout(resolver, 10))
    expect(enviar).toHaveBeenCalledTimes(2)
  })

  it('banco fora: a falha vai para o aviso espaçado, e o próximo aviso sai normalmente', async () => {
    const falhas: unknown[] = []
    let falhar = true
    const enviar = vi.fn(() => (falhar ? Promise.reject(new Error('banco fora')) : Promise.resolve()))
    const aviso = new AvisoDeVagaLivre(enviar, (erro) => falhas.push(erro))
    aviso.avisar()
    await vi.waitFor(() => expect(falhas).toHaveLength(1))
    falhar = false
    await new Promise((resolver) => setTimeout(resolver, 0))
    aviso.avisar()
    await vi.waitFor(() => expect(enviar).toHaveBeenCalledTimes(2))
    expect(falhas).toHaveLength(1)
  })
})
