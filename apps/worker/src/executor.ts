import {
  esquemaDadosDoJobNaFila,
  executarNoContexto,
  INTERVALO_RENOVACAO_DA_VAGA_MS,
  resumirErro,
  type ConfiguracaoOperacional,
  type ContextoDaRequisicao,
  type JobRegistroRepository,
  type LoggerBase,
  type VagasPorEscola,
  type VagasPorFila,
} from '@educa/nucleo'
import { CodigoDeErro, CodigoDeFalhaDeJob, type Fila } from '@educa/shared'
import { DelayedError, UnrecoverableError, type Job } from 'bullmq'
import { randomUUID } from 'node:crypto'
import { FalhaDeJob } from './falha-de-job.js'

export type Processador = (dados: Record<string, unknown>) => Promise<void>

export type JobDaFila = Pick<Job, 'id' | 'data' | 'attemptsMade' | 'opts' | 'moveToDelayed'>

/** Espera mínima de um job que chegou ao worker sem vaga, antes de a fila o entregar de novo. */
export const ESPERA_POR_VAGA_MS = 1_000

export interface DependenciasDoExecutor {
  repositorio: Pick<JobRegistroRepository, 'localizarParaExecucao' | 'iniciarExecucao' | 'concluir' | 'registrarFalha'>
  processadores: Readonly<Record<string, Processador>>
  logger: LoggerBase
  vagas: Pick<VagasPorEscola, 'tomar' | 'renovar' | 'liberar'>
  /** Vagas por fila da escola do contexto: as da configuração dela, ou o padrão do ambiente. */
  vagasDaEscola: Pick<ConfiguracaoOperacional<VagasPorFila>, 'daEscola'>
  intervaloRenovacaoMs?: number
}

/** A vaga do job: fila e escola da linha persistida, nunca do `data` do job na fila. */
interface VagaDoJob {
  fila: Fila
  escolaId: string | null
  jobId: string
}

/** Erro que já saiu com a mensagem limpa (só o código) e pode ir para o Redis como está. */
class ErroParaAFila extends Error {
  override readonly name = 'ErroParaAFila'
}

/**
 * Renovação periódica da vaga de um job em execução. As renovações saem uma de cada vez, e `parar`
 * espera a que estiver em andamento: nenhuma renovação chega ao Redis depois da liberação, o que
 * devolveria ao ZSET a vaga de um job já terminado por mais uma validade.
 */
class RenovacaoDaVaga {
  #fila: Promise<void> = Promise.resolve()
  readonly #temporizador: NodeJS.Timeout

  constructor(renovar: () => Promise<void>, intervaloMs: number) {
    this.#temporizador = setInterval(() => {
      this.#fila = this.#fila.then(renovar)
    }, intervaloMs)
  }

  parar(): Promise<void> {
    clearInterval(this.#temporizador)
    return this.#fila
  }
}

/**
 * O que o worker faz com cada job que o BullMQ entrega:
 *
 * 1. restaura o contexto (`escolaId`, `requisicaoId`) do `data` que o despachante copiou da linha
 *    persistida; nada vem de parâmetro solto;
 * 2. localiza a linha pelo repository, que aplica o escopo dessa escola: job inexistente e job de
 *    outra escola dão o mesmo `nao_encontrado` e não rodam;
 * 3. toma a vaga com a fila e a escola da linha e o limite da configuração dessa escola. O despachante
 *    já a tomou ao publicar, e aqui ela só se confirma; sem vaga (publicação ambígua, vaga vencida
 *    numa queda longa), o job volta a esperar sem gastar tentativa nem executar: o teto vale na
 *    execução, e não só na publicação;
 * 4. marca `ativo`, roda o processador do tipo com os dados lidos do Postgres, e renova a vaga
 *    enquanto ele roda;
 * 5. marca `concluido`, ou, na última tentativa, `falhou` com código tipado, e libera a vaga.
 *
 * Na retentativa, a vaga fica com o job. Job que já terminou não roda de novo, mesmo que a fila o
 * entregue outra vez. Falha do Redis ao tomar, renovar ou liberar não para o job: a vaga vence sozinha.
 */
export class ExecutorDeJobs {
  readonly #intervaloRenovacaoMs: number

  constructor(private readonly dependencias: DependenciasDoExecutor) {
    this.#intervaloRenovacaoMs = dependencias.intervaloRenovacaoMs ?? INTERVALO_RENOVACAO_DA_VAGA_MS
  }

  processar(job: JobDaFila, token?: string): Promise<void> {
    const { logger } = this.dependencias
    const dados = esquemaDadosDoJobNaFila.safeParse(job.data)
    if (job.id === undefined || !dados.success) {
      logger.warn({ evento: 'job.dados_da_fila_invalidos', jobId: job.id })
      return Promise.reject(new UnrecoverableError(CodigoDeFalhaDeJob.DADOS_INVALIDOS))
    }
    const jobId = job.id
    const contexto: ContextoDaRequisicao = {
      requisicaoId: dados.data.requisicaoId ?? randomUUID(),
      // Sem escola, o job só pode ser rotina do sistema, e o repository só alcança os jobs sem escola.
      ...(dados.data.escolaId === null ? { rotinaDoSistema: true } : { escolaId: dados.data.escolaId }),
    }
    return executarNoContexto(contexto, () =>
      this.executar(job, jobId, token).catch((erro: unknown) => {
        if (erro instanceof UnrecoverableError || erro instanceof ErroParaAFila || erro instanceof DelayedError) throw erro
        // Banco fora ao marcar o estado: a tentativa conta, e a mensagem original não vai ao Redis.
        logger.warn({ evento: 'job.estado_nao_gravado', jobId, erro: resumirErro(erro) })
        throw new ErroParaAFila(CodigoDeFalhaDeJob.ERRO_INTERNO)
      }),
    )
  }

  private async executar(job: JobDaFila, jobId: string, token: string | undefined): Promise<void> {
    const { repositorio, processadores, logger } = this.dependencias
    const alvo = await repositorio.localizarParaExecucao(jobId)
    if (alvo === undefined) {
      logger.warn({ evento: 'job.nao_encontrado', jobId })
      throw new UnrecoverableError(CodigoDeErro.NAO_ENCONTRADO)
    }
    if (alvo.finalizado) {
      logger.info({ evento: 'job.ja_finalizado', jobId })
      return
    }
    const vaga: VagaDoJob = { fila: alvo.fila, escolaId: alvo.escolaId, jobId }
    if (!(await this.tomarVaga(vaga))) {
      await this.esperarVaga(job, jobId, token)
      return
    }
    const inicio = await repositorio.iniciarExecucao(jobId)
    if (inicio.situacao !== 'iniciado') {
      // Terminou (ou sumiu) entre a localização e o início: a vaga que acabou de ser tomada não fica.
      await this.liberarVaga(vaga)
      if (inicio.situacao === 'nao_encontrado') {
        logger.warn({ evento: 'job.nao_encontrado', jobId })
        throw new UnrecoverableError(CodigoDeErro.NAO_ENCONTRADO)
      }
      logger.info({ evento: 'job.ja_finalizado', jobId })
      return
    }
    const tentativa = job.attemptsMade + 1
    logger.info({ evento: 'job.iniciado', jobId, tentativa })
    const renovacao = new RenovacaoDaVaga(() => this.renovarVaga(vaga), this.#intervaloRenovacaoMs)
    try {
      try {
        const processador = processadores[inicio.tipo]
        if (processador === undefined) throw new FalhaDeJob(CodigoDeFalhaDeJob.TIPO_DESCONHECIDO, true)
        await processador(inicio.dados)
      } catch (erro) {
        const falha = await this.falhar(job, jobId, erro)
        if (falha instanceof UnrecoverableError) {
          await renovacao.parar()
          await this.liberarVaga(vaga)
        }
        throw falha
      }
      // Conclui antes de liberar: se o Postgres falhar aqui, o job volta a tentar ainda dono da vaga.
      await repositorio.concluir(jobId)
      await renovacao.parar()
      await this.liberarVaga(vaga)
    } finally {
      await renovacao.parar()
    }
    logger.info({ evento: 'job.concluido', jobId, tentativa })
  }

  /** Sem Redis, o job segue: com o Redis de fila fora, ele nem teria chegado aqui, e a vaga vence sozinha. */
  private async tomarVaga(vaga: VagaDoJob): Promise<boolean> {
    try {
      const limite = (await this.dependencias.vagasDaEscola.daEscola())[vaga.fila]
      return (await this.dependencias.vagas.tomar(vaga.fila, vaga.escolaId, limite, [vaga.jobId])).has(vaga.jobId)
    } catch (erro) {
      this.dependencias.logger.warn({ evento: 'job.vaga_nao_conferida', jobId: vaga.jobId, erro: resumirErro(erro) })
      return true
    }
  }

  /**
   * Devolve o job à espera do BullMQ por um instante, sem contar tentativa e sem marcar `ativo`: a
   * linha continua `publicado`, e o despachante segue renovando a vaga de quem a tem.
   */
  private async esperarVaga(job: JobDaFila, jobId: string, token: string | undefined): Promise<never> {
    if (token === undefined) throw new Error('job sem token do BullMQ não pode voltar à espera')
    this.dependencias.logger.info({ evento: 'job.aguardando_vaga', jobId })
    const esperaMs = ESPERA_POR_VAGA_MS + Math.floor(Math.random() * (ESPERA_POR_VAGA_MS / 2))
    await job.moveToDelayed(Date.now() + esperaMs, token)
    throw new DelayedError()
  }

  private async renovarVaga({ fila, escolaId, jobId }: VagaDoJob): Promise<void> {
    try {
      await this.dependencias.vagas.renovar(fila, escolaId, jobId)
    } catch (erro) {
      this.dependencias.logger.warn({ evento: 'job.vaga_nao_renovada', jobId, erro: resumirErro(erro) })
    }
  }

  private async liberarVaga({ fila, escolaId, jobId }: VagaDoJob): Promise<void> {
    try {
      await this.dependencias.vagas.liberar(fila, escolaId, [jobId])
    } catch (erro) {
      this.dependencias.logger.warn({ evento: 'job.vaga_nao_liberada', jobId, erro: resumirErro(erro) })
    }
  }

  /**
   * Decide se a falha encerra o job e devolve o erro para o BullMQ. O erro devolvido nunca é o
   * original: a mensagem vai para o Redis, e só o código tipado pode ir.
   */
  private async falhar(job: JobDaFila, jobId: string, erro: unknown): Promise<Error> {
    const codigo = erro instanceof FalhaDeJob ? erro.codigo : CodigoDeFalhaDeJob.ERRO_INTERNO
    const tentativa = job.attemptsMade + 1
    const definitiva = (erro instanceof FalhaDeJob && erro.definitiva) || tentativa >= (job.opts.attempts ?? 1)
    this.dependencias.logger.warn({ evento: 'job.tentativa_falhou', jobId, tentativa, codigo, erro: resumirErro(erro) })
    if (!definitiva) return new ErroParaAFila(codigo)
    try {
      await this.dependencias.repositorio.registrarFalha(jobId, codigo)
      this.dependencias.logger.warn({ evento: 'job.falhou', jobId, codigo })
    } catch (erroAoRegistrar) {
      this.dependencias.logger.error({ evento: 'job.falha_nao_registrada', jobId, codigo, erro: resumirErro(erroAoRegistrar) })
    }
    return new UnrecoverableError(codigo)
  }
}
