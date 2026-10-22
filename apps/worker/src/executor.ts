import {
  esquemaDadosDoJobNaFila,
  executarNoContexto,
  INTERVALO_RENOVACAO_DA_VAGA_MS,
  resumirErro,
  type ConfiguracaoOperacional,
  type ContadorDeUso,
  type ContextoDaRequisicao,
  type JobRegistroRepository,
  type LoggerBase,
  type VagasPorEscola,
  type VagasPorFila,
} from '@educa/nucleo'
import { CodigoDeErro, CodigoDeFalhaDeJob, DEFINICOES_DE_JOB, type DadosLidosDoJob, type Fila, type RegistroDeJobs, type TipoDeJob } from '@educa/shared'
import { DelayedError, UnrecoverableError, type Job } from 'bullmq'
import { randomUUID } from 'node:crypto'
import { FalhaDeJob } from './falha-de-job.js'

/**
 * A execução que o processador está rodando. A entrega é pelo menos uma vez (D49): o mesmo job pode chegar
 * ao processador mais de uma vez, e todo efeito dele (linha gravada, chamada de IA, aviso) usa
 * `chaveIdempotencia` para não duplicar. Efeito externo pago reserva a chave **antes** de disparar (grava com a
 * chave e só chama se a gravação entrou, ou entrega a chave ao gateway): o `on conflict` depois da chamada
 * protege a linha, não a fatura.
 */
export interface ExecucaoDoJob {
  /** O id do job em `job_registro`, que é também o `jobId` do BullMQ. */
  readonly jobId: string
  /**
   * A tentativa do BullMQ, a partir de 1: sobe na retentativa depois de falha. O stalled devolve o job sem
   * contar tentativa, e a republicação pela reconciliação recomeça do 1. Serve ao log, nunca à idempotência.
   */
  readonly tentativa: number
  /** Igual ao id do job em toda tentativa, em toda reentrega pelo stalled e em toda republicação pela reconciliação. */
  readonly chaveIdempotencia: string
  /** O prazo de uma tentativa, da definição do tipo (`DEFINICOES_DE_JOB`). O worker só o entrega: aplicá-lo é da onda 3 (43.0). */
  readonly prazoMs: number
}

/**
 * Processa os dados de um tipo de job, lidos do Postgres e validados pelo esquema estrito do tipo (`DEFINICOES_DE_JOB`), no
 * contexto da escola do job. O tipo de `dados` é o da definição: ler campo que ela não tem não compila. Precisa tolerar
 * reexecução: pode rodar de novo depois de ter gravado o efeito, e até ao mesmo tempo que outra execução.
 */
export type Processador<Tipo extends TipoDeJob = TipoDeJob> = (dados: DadosLidosDoJob<Tipo>, execucao: ExecucaoDoJob) => Promise<void>

/** Os processadores de uma réplica, um por tipo: o de cada chave recebe os dados do tipo dela. */
export type ProcessadoresDeJob = { readonly [Tipo in TipoDeJob]?: Processador<Tipo> }

/**
 * O processador sem o tipo dos dados. O tipo do job é lido da linha, em execução, e o compilador não liga o texto à chave do
 * `ProcessadoresDeJob`: este é o único ponto sem prova de tipo, e o que o protege é o executor passar a ele só o que o esquema
 * do mesmo tipo leu.
 */
type ProcessadorSemTipo = (dados: never, execucao: ExecucaoDoJob) => Promise<void>

export type JobDaFila = Pick<Job, 'id' | 'data' | 'attemptsMade' | 'opts' | 'moveToDelayed'>

/**
 * Aviso de vaga livre ao despachante, com no máximo um aviso em andamento: as vagas que se liberam enquanto ele
 * vai ao banco viram um aviso só, logo em seguida. Com cinquenta jobs terminando por segundo, o worker não
 * empilha consulta no pool, e o despachante acorda uma vez por rodada, não uma por job.
 */
export class AvisoDeVagaLivre {
  #emAndamento = false
  #pendente = false

  constructor(
    private readonly enviar: () => Promise<void>,
    private readonly aoFalhar: (erro: unknown) => void,
  ) {}

  readonly avisar = (): void => {
    if (this.#emAndamento) {
      this.#pendente = true
      return
    }
    this.#emAndamento = true
    this.enviar()
      .catch(this.aoFalhar)
      .finally(() => {
        this.#emAndamento = false
        if (!this.#pendente) return
        this.#pendente = false
        this.avisar()
      })
  }
}

/** Espera mínima de um job que chegou ao worker sem vaga, antes de a fila o entregar de novo. */
export const ESPERA_POR_VAGA_MS = 1_000

export interface DependenciasDoExecutor {
  repositorio: Pick<JobRegistroRepository, 'localizarParaExecucao' | 'iniciarExecucao' | 'concluir' | 'registrarFalha'>
  processadores: ProcessadoresDeJob
  /** O registro de jobs que valida os dados, confere o escopo e dá o prazo de cada tipo. Só o teste troca o de produção. */
  definicoes?: RegistroDeJobs
  logger: LoggerBase
  vagas: Pick<VagasPorEscola, 'tomar' | 'renovar' | 'liberar'>
  /** Vagas por fila da escola do contexto: as da configuração dela, ou o padrão do ambiente. */
  vagasDaEscola: Pick<ConfiguracaoOperacional<VagasPorFila>, 'daEscola'>
  /** Conta cada execução iniciada na escola do job (D30). Disparar e esquecer: nunca atrasa nem falha o job. */
  uso: Pick<ContadorDeUso, 'marcar'>
  /**
   * Chamado depois de cada vaga liberada no Redis, para o despachante publicar o próximo job da escola na hora.
   * Disparar e esquecer, como o uso: nunca atrasa nem falha o job.
   */
  aoLiberarVaga?: () => void
  /** Conta o job que chegou sem vaga e voltou a esperar, na fila e na escola da linha (métrica `job.aguardando_vaga`). */
  aoAguardarVaga?: (fila: Fila, escolaId: string | null) => void
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
 * 4. marca `ativo`, conta a execução no uso da escola, confere a definição do tipo (`DEFINICOES_DE_JOB`: o escopo e o
 *    esquema estrito dos dados lidos do Postgres, sem confiar em quem gravou a linha), roda o processador do tipo com esses
 *    dados e a execução (`jobId`, `tentativa`, `chaveIdempotencia`, `prazoMs`), e renova a vaga enquanto ele roda;
 * 5. marca `concluido`, ou, na última tentativa, `falhou` com código tipado, e libera a vaga.
 *
 * Na retentativa, a vaga fica com o job. Job que já terminou não roda de novo, mesmo que a fila o
 * entregue outra vez. Falha do Redis ao tomar, renovar ou liberar não para o job: a vaga vence sozinha.
 *
 * **A entrega é pelo menos uma vez, não exatamente uma vez** (D49). O que é único é a reserva no banco; a
 * execução pode se repetir: reentrega a partir de `ativo`, `concluir` que falha depois de o processador
 * terminar, falso stalled com o lock vencido, reconciliação que republica um job `ativo` que ainda roda.
 * Por isso o processador recebe a chave de idempotência, que é o id do job em toda execução.
 *
 * Reexecução no log: mais de um `job.iniciado` com o mesmo `jobId`; a `tentativa` sobe na retentativa e se
 * repete no stalled e na republicação. Só ids, nenhum dado do job.
 */
export class ExecutorDeJobs {
  readonly #intervaloRenovacaoMs: number
  readonly #definicoes: RegistroDeJobs
  readonly #processadores: Readonly<Record<string, ProcessadorSemTipo | undefined>>

  constructor(private readonly dependencias: DependenciasDoExecutor) {
    this.#intervaloRenovacaoMs = dependencias.intervaloRenovacaoMs ?? INTERVALO_RENOVACAO_DA_VAGA_MS
    this.#definicoes = dependencias.definicoes ?? DEFINICOES_DE_JOB
    this.#processadores = dependencias.processadores
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
    const { repositorio, logger } = this.dependencias
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
      await this.esperarVaga(job, vaga, token)
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
    // Cada tentativa que começa conta: é execução que ocupou worker e banco. Job do sistema não tem escola e não conta.
    this.dependencias.uso.marcar('jobs')
    logger.info({ evento: 'job.iniciado', jobId, tentativa })
    const renovacao = new RenovacaoDaVaga(() => this.renovarVaga(vaga), this.#intervaloRenovacaoMs)
    try {
      try {
        await this.rodarProcessador(inicio.tipo, inicio.dados, vaga, { jobId, tentativa, chaveIdempotencia: jobId })
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

  /**
   * O que o worker confere antes do processador, nesta ordem: a definição do tipo (sem ela, `TIPO_DESCONHECIDO`), o escopo da
   * definição contra a escola da linha, os dados contra o esquema estrito do tipo e o processador da réplica. Toda recusa é
   * definitiva e leva só o código: o `issues` do zod repete chave e valor, e iria ao log e ao Redis. O worker não confia
   * na gravação: a linha pode ter sido escrita por SQL, por uma versão antiga ou por quem não passou pelo `Enfileirador`.
   */
  private async rodarProcessador(tipo: string, dados: unknown, { escolaId }: VagaDoJob, execucao: Omit<ExecucaoDoJob, 'prazoMs'>): Promise<void> {
    const definicao = this.#definicoes[tipo]
    if (definicao === undefined) throw new FalhaDeJob(CodigoDeFalhaDeJob.TIPO_DESCONHECIDO, true)
    // A rotina do sistema não tem escola, e o job de escola sempre tem: a linha com o outro arranjo (`sistema.*` com escola, por SQL) não roda.
    if ((definicao.escopo === 'sistema') !== (escolaId === null)) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
    const lidos = definicao.dados.safeParse(dados)
    if (!lidos.success) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
    const processador = this.#processadores[tipo]
    if (processador === undefined) throw new FalhaDeJob(CodigoDeFalhaDeJob.TIPO_DESCONHECIDO, true)
    // O esquema lido é o do mesmo tipo da chave do processador: o `never` é a ponte que o compilador não faz (`ProcessadorSemTipo`).
    await processador(lidos.data as never, { ...execucao, prazoMs: definicao.prazoMs })
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
  private async esperarVaga(job: JobDaFila, { fila, escolaId }: VagaDoJob, token: string | undefined): Promise<never> {
    if (token === undefined) throw new Error('job sem token do BullMQ não pode voltar à espera')
    // Métrica, e não log: com a escola no teto, cada job volta aqui a cada segundo, e uma linha por volta
    // encheria o log sem dizer mais que a contagem por escola.
    this.dependencias.aoAguardarVaga?.(fila, escolaId)
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
      this.dependencias.aoLiberarVaga?.()
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
