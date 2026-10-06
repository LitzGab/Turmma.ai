import {
  avisoEspacado,
  CATEGORIAS_DO_EXPURGO,
  executarNoContexto,
  METRICAS,
  noitesSeguidasSemConcluir,
  resumirErro,
  ROTULO_ESCOLA,
  type ConfiguracaoOperacional,
  type EscolasDaRotinaRepository,
  type ExpurgoDaEscolaRepository,
  type JanelaLetiva,
  type LoggerBase,
  type Meter,
  type Relogio,
} from '@educa/nucleo'
import { randomUUID } from 'node:crypto'

/** De quanto em quanto tempo o worker-lote mede as noites do expurgo. O valor muda uma vez por noite: 5 min sobram. */
export const INTERVALO_DA_MEDICAO_DO_EXPURGO_MS = 5 * 60_000

export interface DependenciasDaMedicaoDoExpurgo {
  escolas: Pick<EscolasDaRotinaRepository, 'listarIds'>
  repositorio: Pick<ExpurgoDaEscolaRepository, 'noitesDoAlerta'>
  /** O horário letivo da escola do contexto: dele sai o fuso em que a noite é contada. */
  janelaDaEscola: Pick<ConfiguracaoOperacional<JanelaLetiva>, 'daEscola'>
  relogio: Relogio
  logger: LoggerBase
  medidor: Meter
}

/**
 * `expurgo.noites_incompletas` por escola (F3, tarefa 3.0; Tech Spec do F3, seção 7c): de ontem para trás, quantas
 * noites seguidas o expurgo da escola não terminou todas as categorias, contadas no fuso dela. A categoria sem linha na
 * noite conta como não concluída; a noite anterior à primeira execução da escola não conta. O alerta "Expurgo
 * incompleto por duas noites numa escola" dispara em 2.
 *
 * Mede a cada 5 min, num laço próprio, e a exportação só lê o resultado guardado (como a medição da fila no
 * despachante). A medição não guarda estado que outra réplica precise: cada worker-lote mede do Postgres, e o painel usa
 * `max`. A lista de escolas sai da `EscolasDaRotinaRepository`, a mesma da rotina, e cada escola é lida no contexto
 * dela. Escola que nunca rodou o expurgo não tem série. Com o Postgres fora, a medição anterior sai da exportação.
 */
export class MedicaoDoExpurgo {
  readonly #series = new Map<string, number>()
  readonly #intervaloMs: number
  readonly #avisarFalha: (erro: unknown) => void
  #laco: Promise<void> | undefined
  #ativa = false
  #encerrada = false
  #acordar: (() => void) | undefined

  constructor(
    private readonly dependencias: DependenciasDaMedicaoDoExpurgo,
    opcoes: { intervaloMs?: number } = {},
  ) {
    this.#intervaloMs = opcoes.intervaloMs ?? INTERVALO_DA_MEDICAO_DO_EXPURGO_MS
    let ultimoErro: unknown
    const aviso = avisoEspacado(() => dependencias.logger.warn({ evento: 'worker.medicao_do_expurgo_indisponivel', erro: resumirErro(ultimoErro) }))
    this.#avisarFalha = (erro) => {
      ultimoErro = erro
      aviso()
    }
    const gauge = dependencias.medidor.createObservableGauge(METRICAS.noitesIncompletasDoExpurgo, {
      description: 'Noites seguidas em que o expurgo da escola não terminou todas as categorias',
    })
    gauge.addCallback((observador) => {
      for (const [escolaId, noites] of this.#series) observador.observe(noites, { [ROTULO_ESCOLA]: escolaId })
    })
  }

  /**
   * Uma medição de todas as escolas. A escola que falha fica sem série nesta volta; a lista que falha zera a exportação.
   * Depois de `encerrar`, a volta em andamento para na escola seguinte, sem trocar as séries.
   */
  async medir(): Promise<void> {
    const { escolas, repositorio, janelaDaEscola, relogio } = this.dependencias
    let ids: string[]
    try {
      ids = await escolas.listarIds()
    } catch (erro) {
      this.#series.clear()
      this.#avisarFalha(erro)
      return
    }
    const agora = relogio.agora()
    const medidas = new Map<string, number>()
    for (const escolaId of ids) {
      // O desligamento não espera a volta inteira: com milhares de escolas, ela leva segundos.
      if (this.#encerrada) return
      try {
        const noites = await executarNoContexto({ requisicaoId: randomUUID(), escolaId }, async () => {
          const { fuso } = await janelaDaEscola.daEscola()
          return repositorio.noitesDoAlerta(fuso, agora, CATEGORIAS_DO_EXPURGO)
        })
        if (noites !== undefined) medidas.set(escolaId, noitesSeguidasSemConcluir(noites, CATEGORIAS_DO_EXPURGO.length))
      } catch (erro) {
        this.#avisarFalha(erro)
      }
    }
    this.#series.clear()
    for (const [escolaId, noites] of medidas) this.#series.set(escolaId, noites)
  }

  /** Mede agora e, depois, a cada intervalo, até `encerrar`. */
  iniciar(): void {
    if (this.#ativa) return
    this.#ativa = true
    this.#laco = (async () => {
      while (this.#ativa) {
        await this.medir()
        if (!this.#ativa) break
        await new Promise<void>((acordar) => {
          const prazo = setTimeout(acordar, this.#intervaloMs)
          this.#acordar = () => {
            clearTimeout(prazo)
            acordar()
          }
        })
      }
    })()
  }

  /** Para o laço e espera a medição em andamento terminar. */
  async encerrar(): Promise<void> {
    this.#ativa = false
    this.#encerrada = true
    this.#acordar?.()
    await this.#laco
  }
}
