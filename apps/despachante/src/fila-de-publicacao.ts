import { OPCOES_DE_JOB_PUBLICADO, TIMEOUT_COMANDO_REDIS_FILA_MS, type DadosDoJobNaFila, type JobReservado } from '@educa/nucleo'
import { CODIGOS_DE_FALHA_DE_JOB, CodigoDeFalhaDeJob, FILAS, type Fila } from '@educa/shared'

/** O que a consulta à fila diz de um job. Só `inexistente` autoriza publicar de novo. */
export type SituacaoNaFila =
  | { situacao: 'inexistente' }
  | { situacao: 'presente' }
  /** A fila desistiu do job (tentativas esgotadas, stalled acima do limite, dado inválido). */
  | { situacao: 'falhou'; codigo: CodigoDeFalhaDeJob }

/** O lado do Redis de fila que o despachante usa: publicar e consultar, sempre com prazo. */
export interface FilaDePublicacao {
  /** Publica cada job na fila dele, com `jobId` igual ao id da linha: publicar de novo um job que a fila tem não cria outro. */
  publicar(jobs: readonly JobReservado[]): Promise<void>
  consultar(job: Pick<JobReservado, 'id' | 'fila'>): Promise<SituacaoNaFila>
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
 * `FilaDePublicacao` sobre as três filas do BullMQ, uma `Queue` por fila, para o Redis de fila fora
 * ou travado não pendurar o despachante:
 *
 * - o cliente Redis não tem fila offline e tem `commandTimeout` (`criarClienteRedisDaFila`);
 * - toda operação tem `prazoMs` também por fora, porque a `Queue` espera o Redis ficar pronto antes
 *   do primeiro comando, e essa espera não tem limite: um despachante que sobe com o Redis fora
 *   ficaria parado nela;
 * - se a preparação de uma `Queue` falhar (o Redis caiu no meio dela), o BullMQ guarda a falha para
 *   sempre; a `Queue` é trocada por uma nova, e a operação seguinte já usa a nova.
 */
export class PublicacaoBullMQ implements FilaDePublicacao {
  readonly #filas: Map<Fila, FilaBullMQ>

  constructor(
    private readonly criarFila: (fila: Fila) => FilaBullMQ,
    private readonly prazoMs: number = TIMEOUT_COMANDO_REDIS_FILA_MS,
  ) {
    this.#filas = new Map(FILAS.map((fila) => [fila, criarFila(fila)]))
  }

  /** Um `addBulk` por fila, todos dentro do mesmo prazo. */
  publicar(jobs: readonly JobReservado[]): Promise<void> {
    const porFila = new Map<Fila, JobReservado[]>()
    for (const job of jobs) porFila.set(job.fila, [...(porFila.get(job.fila) ?? []), job])
    return comPrazo(async () => {
      await Promise.all(
        [...porFila].map(([fila, daFila]) =>
          this.comFila(fila, (queue) =>
            queue.addBulk(
              daFila.map((job) => ({
                name: job.tipo,
                data: { escolaId: job.escolaId, requisicaoId: job.requisicaoId },
                opts: { ...OPCOES_DE_JOB_PUBLICADO, jobId: job.id },
              })),
            ),
          ),
        ),
      )
    }, this.prazoMs)
  }

  consultar(job: Pick<JobReservado, 'id' | 'fila'>): Promise<SituacaoNaFila> {
    return comPrazo(
      () =>
        this.comFila(job.fila, async (queue) => {
          // Sem o hash do job, a fila não o tem. Com o hash e fora de toda lista, ele existe para o
          // BullMQ, que ignoraria a republicação: não é `inexistente`.
          const naFila = await queue.getJob(job.id)
          if (naFila === undefined) return { situacao: 'inexistente' } as const
          if ((await naFila.getState()) !== 'failed') return { situacao: 'presente' } as const
          return { situacao: 'falhou', codigo: codigoDaFalha(naFila.failedReason) } as const
        }),
      this.prazoMs,
    )
  }

  async fechar(): Promise<void> {
    await Promise.all([...this.#filas.values()].map((queue) => queue.close()))
  }

  private async comFila<T>(fila: Fila, operacao: (queue: FilaBullMQ) => Promise<T>): Promise<T> {
    const queue = this.queueDa(fila)
    try {
      await queue.waitUntilReady()
    } catch (erro) {
      this.trocar(fila, queue)
      throw erro
    }
    return operacao(queue)
  }

  private queueDa(fila: Fila): FilaBullMQ {
    const queue = this.#filas.get(fila)
    if (queue === undefined) throw new Error('fila sem Queue do BullMQ')
    return queue
  }

  private trocar(fila: Fila, falhou: FilaBullMQ): void {
    if (this.#filas.get(fila) !== falhou) return
    this.#filas.set(fila, this.criarFila(fila))
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
