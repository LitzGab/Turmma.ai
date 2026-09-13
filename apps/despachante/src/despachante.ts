import { executarNoContexto, resumirErro, type Batimento, type DespachoRepository, type JobReservado, type LoggerBase } from '@educa/nucleo'
import { randomUUID } from 'node:crypto'
import type { FilaDePublicacao } from './fila-de-publicacao.js'

/** Sem aviso de job novo, o despachante procura de novo a cada 500 ms (Tech Spec, seção 5). */
export const INTERVALO_SONDAGEM_MS = 500
/** Quantos jobs uma rodada reserva de uma vez. Rodada cheia emenda na seguinte sem esperar. */
export const LOTE_DE_RESERVA = 100

export interface DependenciasDaPublicacao {
  repositorio: Pick<DespachoRepository, 'marcarPublicados'>
  fila: Pick<FilaDePublicacao, 'publicar'>
  logger: LoggerBase
}

export interface DependenciasDoDespachante extends DependenciasDaPublicacao {
  repositorio: DespachoRepository
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
 * Com o Redis de fila fora, a API segue aceitando (o job fica em `job_registro`), a publicação falha
 * em até 2 s, e o laço segue: a reserva vence e a rodada seguinte, desta ou da outra instância, tenta
 * de novo. Nenhuma falha de dependência derruba o processo.
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
   * Uma rodada: reserva no banco, publica no BullMQ fora de transação e marca `publicado`. Devolve
   * quantos publicou. Se a publicação falhar, as linhas ficam `reservado` até a reserva vencer, e uma
   * próxima rodada (desta ou de outra instância) as pega de novo.
   */
  async rodada(): Promise<number> {
    this.#avisoPendente = false
    const reservados = await this.dependencias.repositorio.reservar(this.#lote)
    if (reservados.length === 0) return 0
    return (await publicarReservados(this.dependencias, reservados, 'job.publicado')) ? reservados.length : 0
  }

  private async lacar(): Promise<void> {
    const { logger, ouvinte, batimento } = this.dependencias
    while (this.#ativo) {
      let publicados = 0
      try {
        await ouvinte?.garantir()
        publicados = await this.rodada()
      } catch (erro) {
        // Banco ou Redis fora: o laço segue, e a próxima rodada tenta de novo. Nunca derruba o processo.
        logger.warn({ evento: 'despachante.rodada_falhou', erro: resumirErro(erro) })
      }
      batimento?.bater()
      // Rodada cheia emenda na seguinte; rodada que publicou pouco, ou que falhou, espera.
      if (publicados < this.#lote) await this.esperar()
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

/**
 * Publica jobs já reservados e marca `publicado`. Falha da fila não lança: fica no log só com os ids,
 * e a reserva vence sozinha. Devolve se publicou. Falha do banco ao marcar lança, e as linhas também
 * voltam pela reserva vencida: a próxima publicação, com o mesmo `jobId`, não duplica.
 */
export async function publicarReservados(
  { repositorio, fila, logger }: DependenciasDaPublicacao,
  jobs: readonly JobReservado[],
  evento: 'job.publicado' | 'job.republicado',
): Promise<boolean> {
  const ids = jobs.map((job) => job.id)
  try {
    await fila.publicar(jobs)
  } catch (erro) {
    logger.warn({ evento: 'despachante.publicacao_falhou', jobIds: ids, erro: resumirErro(erro) })
    return false
  }
  await repositorio.marcarPublicados(ids)
  for (const job of jobs) {
    executarNoContexto(contextoDoJob(job), () => logger.info({ evento, jobId: job.id }))
  }
  return true
}

/** O log da publicação sai com a escola e a requisição do job: é a mesma trilha da API e do worker. */
export function contextoDoJob(job: JobReservado): { requisicaoId: string; escolaId?: string } {
  return {
    requisicaoId: job.requisicaoId ?? randomUUID(),
    ...(job.escolaId === null ? {} : { escolaId: job.escolaId }),
  }
}
