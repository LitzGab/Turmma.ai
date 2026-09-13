import {
  esquemaDadosDoJobNaFila,
  executarNoContexto,
  resumirErro,
  type ContextoDaRequisicao,
  type JobRegistroRepository,
  type LoggerBase,
} from '@educa/nucleo'
import { CodigoDeErro, CodigoDeFalhaDeJob } from '@educa/shared'
import { UnrecoverableError, type Job } from 'bullmq'
import { randomUUID } from 'node:crypto'
import { FalhaDeJob } from './falha-de-job.js'

export type Processador = (dados: Record<string, unknown>) => Promise<void>

export type JobDaFila = Pick<Job, 'id' | 'data' | 'attemptsMade' | 'opts'>

/** Erro que já saiu com a mensagem limpa (só o código) e pode ir para o Redis como está. */
class ErroParaAFila extends Error {
  override readonly name = 'ErroParaAFila'
}

/**
 * O que o worker faz com cada job que o BullMQ entrega:
 *
 * 1. restaura o contexto (`escolaId`, `requisicaoId`) do `data` que o despachante copiou da linha
 *    persistida; nada vem de parâmetro solto;
 * 2. marca `ativo` pelo repository, que aplica o escopo dessa escola: job inexistente e job de
 *    outra escola dão o mesmo `nao_encontrado` e não rodam;
 * 3. roda o processador do tipo, com os dados lidos do Postgres;
 * 4. marca `concluido`, ou, na última tentativa, `falhou` com código tipado.
 *
 * Job que já terminou não roda de novo, mesmo que a fila o entregue outra vez.
 */
export class ExecutorDeJobs {
  constructor(
    private readonly repositorio: JobRegistroRepository,
    private readonly processadores: Readonly<Record<string, Processador>>,
    private readonly logger: LoggerBase,
  ) {}

  processar(job: JobDaFila): Promise<void> {
    const dados = esquemaDadosDoJobNaFila.safeParse(job.data)
    if (job.id === undefined || !dados.success) {
      this.logger.warn({ evento: 'job.dados_da_fila_invalidos', jobId: job.id })
      return Promise.reject(new UnrecoverableError(CodigoDeFalhaDeJob.DADOS_INVALIDOS))
    }
    const jobId = job.id
    const contexto: ContextoDaRequisicao = {
      requisicaoId: dados.data.requisicaoId ?? randomUUID(),
      // Sem escola, o job só pode ser rotina do sistema, e o repository só alcança os jobs sem escola.
      ...(dados.data.escolaId === null ? { rotinaDoSistema: true } : { escolaId: dados.data.escolaId }),
    }
    return executarNoContexto(contexto, () =>
      this.executar(job, jobId).catch((erro: unknown) => {
        if (erro instanceof UnrecoverableError || erro instanceof ErroParaAFila) throw erro
        // Banco fora ao marcar o estado: a tentativa conta, e a mensagem original não vai ao Redis.
        this.logger.warn({ evento: 'job.estado_nao_gravado', jobId, erro: resumirErro(erro) })
        throw new ErroParaAFila(CodigoDeFalhaDeJob.ERRO_INTERNO)
      }),
    )
  }

  private async executar(job: JobDaFila, jobId: string): Promise<void> {
    const inicio = await this.repositorio.iniciarExecucao(jobId)
    if (inicio.situacao === 'nao_encontrado') {
      this.logger.warn({ evento: 'job.nao_encontrado', jobId })
      throw new UnrecoverableError(CodigoDeErro.NAO_ENCONTRADO)
    }
    if (inicio.situacao === 'nao_executavel') {
      this.logger.info({ evento: 'job.ja_finalizado', jobId })
      return
    }
    const tentativa = job.attemptsMade + 1
    this.logger.info({ evento: 'job.iniciado', jobId, tentativa })
    try {
      const processador = this.processadores[inicio.tipo]
      if (processador === undefined) throw new FalhaDeJob(CodigoDeFalhaDeJob.TIPO_DESCONHECIDO, true)
      await processador(inicio.dados)
    } catch (erro) {
      throw await this.falhar(job, jobId, erro)
    }
    await this.repositorio.concluir(jobId)
    this.logger.info({ evento: 'job.concluido', jobId, tentativa })
  }

  /**
   * Decide se a falha encerra o job e devolve o erro para o BullMQ. O erro devolvido nunca é o
   * original: a mensagem vai para o Redis, e só o código tipado pode ir.
   */
  private async falhar(job: JobDaFila, jobId: string, erro: unknown): Promise<Error> {
    const codigo = erro instanceof FalhaDeJob ? erro.codigo : CodigoDeFalhaDeJob.ERRO_INTERNO
    const tentativa = job.attemptsMade + 1
    const definitiva = (erro instanceof FalhaDeJob && erro.definitiva) || tentativa >= (job.opts.attempts ?? 1)
    this.logger.warn({ evento: 'job.tentativa_falhou', jobId, tentativa, codigo, erro: resumirErro(erro) })
    if (!definitiva) return new ErroParaAFila(codigo)
    try {
      await this.repositorio.registrarFalha(jobId, codigo)
      this.logger.warn({ evento: 'job.falhou', jobId, codigo })
    } catch (erroAoRegistrar) {
      this.logger.error({ evento: 'job.falha_nao_registrada', jobId, codigo, erro: resumirErro(erroAoRegistrar) })
    }
    return new UnrecoverableError(codigo)
  }
}
