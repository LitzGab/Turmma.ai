import { OPCOES_DE_JOB_PUBLICADO, TIMEOUT_COMANDO_REDIS_FILA_MS, type DadosDoJobNaFila, type JobReservado } from '@educa/nucleo'
import { CODIGOS_DE_FALHA_DE_JOB, CodigoDeFalhaDeJob } from '@educa/shared'

/** O que a consulta à fila diz de um job. Só `inexistente` autoriza publicar de novo. */
export type SituacaoNaFila =
  | { situacao: 'inexistente' }
  | { situacao: 'presente' }
  /** A fila desistiu do job (tentativas esgotadas, stalled acima do limite, dado inválido). */
  | { situacao: 'falhou'; codigo: CodigoDeFalhaDeJob }

/** O lado do Redis de fila que o despachante usa: publicar e consultar, sempre com prazo. */
export interface FilaDePublicacao {
  /** Publica com `jobId` igual ao id da linha: publicar de novo um job que a fila tem não cria outro. */
  publicar(jobs: readonly JobReservado[]): Promise<void>
  consultar(jobId: string): Promise<SituacaoNaFila>
}

/** A parte da `Queue` do BullMQ que o despachante usa. */
export interface FilaBullMQ {
  waitUntilReady(): Promise<void>
  addBulk(jobs: Array<{ name: string; data: DadosDoJobNaFila; opts: { jobId: string } & typeof OPCOES_DE_JOB_PUBLICADO }>): Promise<unknown>
  getJob(jobId: string): Promise<{ failedReason: string; getState(): Promise<string> } | undefined>
  close(): Promise<void>
}

export class PrazoDaFilaEsgotado extends Error {
  override readonly name = 'PrazoDaFilaEsgotado'
}

/**
 * `FilaDePublicacao` sobre o BullMQ, para o Redis de fila fora ou travado não pendurar o despachante:
 *
 * - o cliente Redis não tem fila offline e tem `commandTimeout` (`criarClienteRedisDaFila`);
 * - toda operação tem `prazoMs` também por fora, porque a `Queue` espera o Redis ficar pronto antes
 *   do primeiro comando, e essa espera não tem limite: um despachante que sobe com o Redis fora
 *   ficaria parado nela;
 * - se a preparação da `Queue` falhar (o Redis caiu no meio dela), o BullMQ guarda a falha para
 *   sempre; a `Queue` é trocada por uma nova, e a operação seguinte já usa a nova.
 */
export class PublicacaoBullMQ implements FilaDePublicacao {
  #fila: FilaBullMQ

  constructor(
    private readonly criarFila: () => FilaBullMQ,
    private readonly prazoMs: number = TIMEOUT_COMANDO_REDIS_FILA_MS,
  ) {
    this.#fila = criarFila()
  }

  publicar(jobs: readonly JobReservado[]): Promise<void> {
    return this.comFila(async (fila) => {
      await fila.addBulk(
        jobs.map((job) => ({
          name: job.tipo,
          data: { escolaId: job.escolaId, requisicaoId: job.requisicaoId },
          opts: { ...OPCOES_DE_JOB_PUBLICADO, jobId: job.id },
        })),
      )
    })
  }

  consultar(jobId: string): Promise<SituacaoNaFila> {
    return this.comFila(async (fila) => {
      // Sem o hash do job, a fila não o tem. Com o hash e fora de toda lista, ele existe para o
      // BullMQ, que ignoraria a republicação: não é `inexistente`.
      const job = await fila.getJob(jobId)
      if (job === undefined) return { situacao: 'inexistente' }
      if ((await job.getState()) !== 'failed') return { situacao: 'presente' }
      return { situacao: 'falhou', codigo: codigoDaFalha(job.failedReason) }
    })
  }

  fechar(): Promise<void> {
    return this.#fila.close()
  }

  private comFila<T>(operacao: (fila: FilaBullMQ) => Promise<T>): Promise<T> {
    const fila = this.#fila
    return comPrazo(async () => {
      try {
        await fila.waitUntilReady()
      } catch (erro) {
        this.trocar(fila)
        throw erro
      }
      return operacao(fila)
    }, this.prazoMs)
  }

  private trocar(falhou: FilaBullMQ): void {
    if (this.#fila !== falhou) return
    this.#fila = this.criarFila()
    falhou.close().catch(() => undefined)
  }
}

/** O worker só manda à fila o código tipado; o que não for um deles (stalled do BullMQ) é erro interno. */
function codigoDaFalha(motivo: string): CodigoDeFalhaDeJob {
  return CODIGOS_DE_FALHA_DE_JOB.find((codigo) => codigo === motivo) ?? CodigoDeFalhaDeJob.ERRO_INTERNO
}

/**
 * A operação ou `PrazoDaFilaEsgotado`, o que vier antes. A operação que perdeu segue até o fim e é
 * ignorada: uma publicação que chega ao Redis depois do prazo é inofensiva, porque a próxima
 * publicação do mesmo job usa o mesmo `jobId`.
 */
function comPrazo<T>(operacao: () => Promise<T>, prazoMs: number): Promise<T> {
  let temporizador: NodeJS.Timeout | undefined
  const prazo = new Promise<never>((_resolver, rejeitar) => {
    temporizador = setTimeout(() => rejeitar(new PrazoDaFilaEsgotado()), prazoMs)
  })
  const execucao = operacao()
  execucao.catch(() => undefined)
  return Promise.race([execucao, prazo]).finally(() => clearTimeout(temporizador))
}
