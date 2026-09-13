import {
  avisoEspacado,
  executarNoContexto,
  FILAS_POR_PRIORIDADE,
  resumirErro,
  type Batimento,
  type ConfiguracaoOperacional,
  type ContextoDaRequisicao,
  type DespachoRepository,
  type EscolaComPendentes,
  type JobReservado,
  type LoggerBase,
  type VagasPorEscola,
  type VagasPorFila,
} from '@educa/nucleo'
import type { Fila } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import type { FilaDePublicacao } from './fila-de-publicacao.js'

/** Sem aviso de job novo, o despachante procura de novo a cada 500 ms (Tech Spec, seção 5). */
export const INTERVALO_SONDAGEM_MS = 500
/** Quantos jobs uma rodada publica no máximo. Rodada cheia emenda na seguinte sem esperar. */
export const LOTE_DE_RESERVA = 100

export interface DependenciasDaPublicacao {
  repositorio: Pick<DespachoRepository, 'marcarPublicados' | 'devolverParaAguardando'>
  fila: Pick<FilaDePublicacao, 'publicar'>
  vagas: Pick<VagasPorEscola, 'tomar' | 'liberar'>
  /** Vagas por fila da escola do contexto: as da configuração dela, ou o padrão do ambiente. */
  vagasDaEscola: Pick<ConfiguracaoOperacional<VagasPorFila>, 'daEscola'>
  logger: LoggerBase
}

export interface DependenciasDoDespachante extends DependenciasDaPublicacao {
  repositorio: Pick<DespachoRepository, 'listarEscolasComPendentes' | 'publicadosEntre' | 'reservarDaEscola' | 'devolverParaAguardando' | 'marcarPublicados'>
  vagas: Pick<VagasPorEscola, 'membros' | 'manter' | 'livres' | 'tomar' | 'liberar'>
  /** `LISTEN job`. Sem ele, o despachante só sonda; nada se perde, só demora até 500 ms. */
  ouvinte?: { garantir(): Promise<void> }
  batimento?: Batimento
}

export interface OpcoesDoDespachante {
  intervaloMs?: number
  lote?: number
}

/**
 * Leva o que está em `job_registro` para as filas do BullMQ, respeitando as vagas de cada escola.
 * Várias instâncias rodam juntas sem pisar uma na outra: a reserva é no banco (`FOR UPDATE SKIP
 * LOCKED` e troca condicional), a vaga é tomada atomicamente no Redis, e o `jobId` do BullMQ é o id
 * da linha, então publicar duas vezes o mesmo job não cria dois.
 *
 * Cada rodada percorre as filas em ordem de prioridade e, em cada fila, as escolas com job à espera,
 * em rodízio: a escola que começa a rodada muda a cada rodada. Para cada escola:
 *
 * 1. renova a vaga dos jobs dela já publicados e ainda não iniciados (pool cheio, réplica fora): parados
 *    na fila do BullMQ, eles seguem contando, e a escola não ganha mais publicados acima do teto;
 *    depois estima as vagas livres, com o limite da configuração dela; sem vaga, nem reserva (a escola
 *    com mil lotes na fila não gera escrita no banco a cada 500 ms);
 * 2. reserva no máximo essa quantidade, dos jobs mais antigos dela;
 * 3. só então toma a vaga de cada job reservado, no Lua; reserva sem vaga volta a `aguardando`;
 * 4. publica os que ficaram com vaga; se a publicação falhar, devolve as vagas e a reserva vence.
 *
 * Com o Redis de fila fora, a API segue aceitando (o job fica em `job_registro`), a estimativa de
 * vaga falha na hora, nada é reservado, e o laço segue. Nenhuma falha de dependência derruba o processo.
 */
export class Despachante {
  readonly #intervaloMs: number
  readonly #lote: number
  readonly #proximaNoRodizio = new Map<Fila, number>()
  readonly #avisarVagaIndisponivel: (erro: unknown) => void
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
    let ultimoErro: unknown
    const aviso = avisoEspacado(() => dependencias.logger.warn({ evento: 'despachante.vaga_indisponivel', erro: resumirErro(ultimoErro) }))
    this.#avisarVagaIndisponivel = (erro) => {
      ultimoErro = erro
      aviso()
    }
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
   * Uma rodada pelas filas e escolas com job à espera. Devolve quantos jobs publicou. Se o Redis de
   * fila não responde à vaga de uma escola, a rodada termina ali: não responderia às outras, e com ele
   * travado cada tentativa custaria o prazo inteiro do comando.
   */
  async rodada(): Promise<number> {
    this.#avisoPendente = false
    const pendentes = await this.dependencias.repositorio.listarEscolasComPendentes()
    let publicados = 0
    for (const fila of FILAS_POR_PRIORIDADE) {
      for (const escolaId of this.emRodizio(fila, pendentes)) {
        if (publicados >= this.#lote) return publicados
        const despachados = await this.despacharDaEscola(fila, escolaId, this.#lote - publicados)
        if (despachados === 'vaga_indisponivel') return publicados
        publicados += despachados
      }
    }
    return publicados
  }

  /** As escolas da fila, começando por uma diferente a cada rodada. */
  private emRodizio(fila: Fila, pendentes: readonly EscolaComPendentes[]): Array<string | null> {
    const escolas = pendentes.filter((pendente) => pendente.fila === fila).map((pendente) => pendente.escolaId)
    if (escolas.length === 0) return escolas
    const inicio = (this.#proximaNoRodizio.get(fila) ?? 0) % escolas.length
    this.#proximaNoRodizio.set(fila, (inicio + 1) % escolas.length)
    return [...escolas.slice(inicio), ...escolas.slice(0, inicio)]
  }

  /** Passos 1 a 4 para uma escola numa fila, no contexto dela: a configuração e a reserva são dela. */
  private despacharDaEscola(fila: Fila, escolaId: string | null, maximo: number): Promise<number | 'vaga_indisponivel'> {
    return executarNoContexto(contextoDaEscola(escolaId), async () => {
      const { repositorio, vagas, vagasDaEscola } = this.dependencias
      const limite = (await vagasDaEscola.daEscola())[fila]
      let comVaga: string[]
      try {
        comVaga = await vagas.membros(fila, escolaId)
      } catch (erro) {
        this.#avisarVagaIndisponivel(erro)
        return 'vaga_indisponivel'
      }
      const publicados = await repositorio.publicadosEntre(comVaga)
      let livres: number
      try {
        await vagas.manter(fila, escolaId, publicados)
        livres = await vagas.livres(fila, escolaId, limite)
      } catch (erro) {
        this.#avisarVagaIndisponivel(erro)
        return 'vaga_indisponivel'
      }
      if (livres <= 0) return 0
      const reservados = await repositorio.reservarDaEscola(fila, Math.min(livres, maximo))
      return (await publicarComVaga(this.dependencias, reservados, 'job.publicado')).length
    })
  }

  private async lacar(): Promise<void> {
    const { logger, ouvinte, batimento } = this.dependencias
    while (this.#ativo) {
      let publicados = 0
      try {
        await ouvinte?.garantir()
        publicados = await this.rodada()
      } catch (erro) {
        // Banco fora: o laço segue, e a próxima rodada tenta de novo. Nunca derruba o processo.
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
 * Toma a vaga de jobs já reservados e publica os que a conseguiram. Vale para a rodada e para a
 * republicação da reconciliação. A vaga é sempre da fila e da escola da linha reservada.
 *
 * - Sem vaga, a reserva volta a `aguardando`, e nenhuma vaga fica tomada por ela.
 * - Redis fora ao tomar: todas voltam a `aguardando`.
 * - Publicação que falha devolve as vagas; as linhas ficam `reservado` até a reserva vencer.
 *
 * Devolve os ids publicados.
 */
export async function publicarComVaga(dependencias: DependenciasDaPublicacao, jobs: readonly JobReservado[], evento: 'job.publicado' | 'job.republicado'): Promise<string[]> {
  const publicados: string[] = []
  for (const grupo of agruparPorFilaEEscola(jobs)) {
    const doGrupo = await executarNoContexto(contextoDaEscola(grupo.escolaId), () => publicarGrupoComVaga(dependencias, grupo, evento))
    publicados.push(...doGrupo)
  }
  return publicados
}

interface GrupoDeJobs {
  fila: Fila
  escolaId: string | null
  jobs: JobReservado[]
}

async function publicarGrupoComVaga(dependencias: DependenciasDaPublicacao, { fila, escolaId, jobs }: GrupoDeJobs, evento: 'job.publicado' | 'job.republicado'): Promise<string[]> {
  const { repositorio, vagas, vagasDaEscola, logger } = dependencias
  const ids = jobs.map((job) => job.id)
  let concedidos: ReadonlySet<string>
  try {
    concedidos = await vagas.tomar(fila, escolaId, (await vagasDaEscola.daEscola())[fila], ids)
  } catch (erro) {
    logger.warn({ evento: 'despachante.vaga_indisponivel', jobIds: ids, erro: resumirErro(erro) })
    await repositorio.devolverParaAguardando(ids)
    return []
  }
  await repositorio.devolverParaAguardando(ids.filter((id) => !concedidos.has(id)))
  const comVaga = jobs.filter((job) => concedidos.has(job.id))
  if (comVaga.length === 0) return []
  const comVagaIds = comVaga.map((job) => job.id)
  if (await publicarReservados(dependencias, comVaga, evento)) return comVagaIds
  try {
    await vagas.liberar(fila, escolaId, comVagaIds)
  } catch (erro) {
    // A vaga vence sozinha em 60 s.
    logger.warn({ evento: 'despachante.vaga_nao_liberada', jobIds: comVagaIds, erro: resumirErro(erro) })
  }
  return []
}

function agruparPorFilaEEscola(jobs: readonly JobReservado[]): GrupoDeJobs[] {
  const grupos = new Map<string, GrupoDeJobs>()
  for (const job of jobs) {
    const chave = `${job.fila}:${job.escolaId ?? ''}`
    const grupo = grupos.get(chave) ?? { fila: job.fila, escolaId: job.escolaId, jobs: [] }
    grupo.jobs.push(job)
    grupos.set(chave, grupo)
  }
  return [...grupos.values()]
}

/**
 * Publica jobs com vaga e marca `publicado`. Falha da fila não lança: fica no log só com os ids, e a
 * reserva vence sozinha. Devolve se publicou. Falha do banco ao marcar lança, e as linhas também
 * voltam pela reserva vencida: a próxima publicação, com o mesmo `jobId`, não duplica.
 */
async function publicarReservados(
  { repositorio, fila, logger }: Pick<DependenciasDaPublicacao, 'repositorio' | 'fila' | 'logger'>,
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

/** Contexto de uma escola (ou da rotina do sistema, sem escola) para ler a configuração e reservar os jobs dela. */
function contextoDaEscola(escolaId: string | null): ContextoDaRequisicao {
  return { requisicaoId: randomUUID(), ...(escolaId === null ? { rotinaDoSistema: true } : { escolaId }) }
}

/** O log da publicação sai com a escola e a requisição do job: é a mesma trilha da API e do worker. */
export function contextoDoJob(job: JobReservado): { requisicaoId: string; escolaId?: string } {
  return {
    requisicaoId: job.requisicaoId ?? randomUUID(),
    ...(job.escolaId === null ? {} : { escolaId: job.escolaId }),
  }
}
