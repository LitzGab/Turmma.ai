import {
  executarNoContexto,
  OPCOES_DE_JOB_PUBLICADO,
  resumirErro,
  type Batimento,
  type DadosDoJobNaFila,
  type DespachoRepository,
  type JobReservado,
  type LoggerBase,
} from '@educa/nucleo'
import type { Queue } from 'bullmq'
import { randomUUID } from 'node:crypto'

/** Sem aviso de job novo, o despachante procura de novo a cada 500 ms (Tech Spec, seção 5). */
export const INTERVALO_SONDAGEM_MS = 500
/** Quantos jobs uma rodada reserva de uma vez. Rodada cheia emenda na seguinte sem esperar. */
export const LOTE_DE_RESERVA = 100

export interface DependenciasDoDespachante {
  repositorio: DespachoRepository
  fila: Pick<Queue<DadosDoJobNaFila>, 'addBulk'>
  logger: LoggerBase
  /** `LISTEN job`. Sem ele, o despachante só sonda; nada se perde, só demora até 500 ms. */
  ouvinte?: { garantir(): Promise<void> }
  batimento?: Batimento
}

export interface OpcoesDoDespachante {
  intervaloMs?: number
  lote?: number
}

/**
 * Leva o que está em `job_registro` para o BullMQ. Várias instâncias rodam juntas sem pisar uma na
 * outra: a reserva é no banco (`FOR UPDATE SKIP LOCKED` e troca condicional), e o `jobId` do BullMQ é
 * o id da linha, então publicar duas vezes o mesmo job não cria dois.
 *
 * Nesta etapa há uma fila só, sem vaga por escola nem janela letiva (9.0 e 10.0).
 */
export class Despachante {
  readonly #intervaloMs: number
  readonly #lote: number
  #ativo = false
  #laco: Promise<void> | undefined
  #avisoPendente = false
  #encerrarEspera: (() => void) | undefined

  constructor(
    private readonly dependencias: DependenciasDoDespachante,
    opcoes: OpcoesDoDespachante = {},
  ) {
    this.#intervaloMs = opcoes.intervaloMs ?? INTERVALO_SONDAGEM_MS
    this.#lote = opcoes.lote ?? LOTE_DE_RESERVA
  }

  /** Chamado pelo `NOTIFY job`: encurta a espera. Aviso que chega no meio de uma rodada não se perde. */
  acordar(): void {
    this.#avisoPendente = true
    this.#encerrarEspera?.()
  }

  iniciar(): void {
    if (this.#ativo) return
    this.#ativo = true
    this.#laco = this.lacar()
  }

  /** Termina a rodada em andamento e para. Nada fica reservado pela metade: a reserva vence sozinha. */
  async parar(): Promise<void> {
    this.#ativo = false
    this.#encerrarEspera?.()
    await this.#laco
  }

  /**
   * Uma rodada: reserva no banco, publica no BullMQ fora de transação e marca `publicado`.
   * Se a publicação falhar, as linhas ficam `reservado` até a reserva vencer, e uma próxima
   * rodada (desta ou de outra instância) as pega de novo.
   */
  async rodada(): Promise<JobReservado[]> {
    this.#avisoPendente = false
    const { repositorio, fila, logger } = this.dependencias
    const reservados = await repositorio.reservar(this.#lote)
    if (reservados.length === 0) return reservados
    await fila.addBulk(
      reservados.map((job) => ({
        name: job.tipo,
        data: { escolaId: job.escolaId, requisicaoId: job.requisicaoId },
        opts: { ...OPCOES_DE_JOB_PUBLICADO, jobId: job.id },
      })),
    )
    await repositorio.marcarPublicados(reservados.map((job) => job.id))
    for (const job of reservados) {
      executarNoContexto(contextoDoJob(job), () => logger.info({ evento: 'job.publicado', jobId: job.id }))
    }
    return reservados
  }

  private async lacar(): Promise<void> {
    const { logger, ouvinte, batimento } = this.dependencias
    while (this.#ativo) {
      let reservados = 0
      try {
        await ouvinte?.garantir()
        reservados = (await this.rodada()).length
      } catch (erro) {
        // Banco ou Redis fora: o laço segue, e a próxima rodada tenta de novo. Nunca derruba o processo.
        logger.warn({ evento: 'despachante.rodada_falhou', erro: resumirErro(erro) })
      }
      batimento?.bater()
      if (reservados < this.#lote) await this.esperar()
    }
  }

  private esperar(): Promise<void> {
    if (this.#avisoPendente || !this.#ativo) return Promise.resolve()
    return new Promise((resolver) => {
      const encerrar = (): void => {
        clearTimeout(prazo)
        this.#encerrarEspera = undefined
        resolver()
      }
      const prazo = setTimeout(encerrar, this.#intervaloMs)
      this.#encerrarEspera = encerrar
    })
  }
}

/** O log da publicação sai com a escola e a requisição do job: é a mesma trilha da API e do worker. */
function contextoDoJob(job: JobReservado): { requisicaoId: string; escolaId?: string } {
  return {
    requisicaoId: job.requisicaoId ?? randomUUID(),
    ...(job.escolaId === null ? {} : { escolaId: job.escolaId }),
  }
}
