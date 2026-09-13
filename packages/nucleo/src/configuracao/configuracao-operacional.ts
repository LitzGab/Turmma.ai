import { FILAS, type Fila } from '@educa/shared'
import { z } from 'zod'
import { validarAmbiente } from '../config/validar-config.js'
import { contextoAtual } from '../contexto/contexto.js'
import type { ConfiguracaoOperacionalRepository, LinhaOperacional } from './configuracao-operacional.repository.js'

/** Por quanto tempo a configuração lida de uma escola vale na memória do processo. Mudança leva até isso para valer. */
export const VALIDADE_DA_CONFIGURACAO_MS = 30_000
/** Leitura que falhou (Postgres fora ou lento) é tentada de novo depois disso, e não a cada requisição. */
export const NOVA_TENTATIVA_DA_CONFIGURACAO_MS = 5_000

export type VagasPorFila = Readonly<Record<Fila, number>>

export interface LimitesDeRequisicao {
  readonly porUsuarioMin: number
  readonly porEscolaMin: number
}

const vagaPositiva = z.coerce.number().int().positive()
const esquemaAmbienteVagas = z.object({
  VAGAS_ESCOLA_INTERATIVA: vagaPositiva,
  VAGAS_ESCOLA_NORMAL: vagaPositiva,
  VAGAS_ESCOLA_LOTE: vagaPositiva,
})

/**
 * Vagas por fila de toda escola sem vagas próprias (D41). Despachante e worker leem o mesmo padrão:
 * o despachante toma a vaga ao publicar, e o worker a confere ao começar.
 */
export function lerVagasPadrao(ambiente: Record<string, string | undefined>): VagasPorFila {
  const valores = validarAmbiente(esquemaAmbienteVagas, ambiente)
  return { interativa: valores.VAGAS_ESCOLA_INTERATIVA, normal: valores.VAGAS_ESCOLA_NORMAL, lote: valores.VAGAS_ESCOLA_LOTE }
}

/** Vagas da escola: a fila que ela não configurou usa o padrão do ambiente. */
export function resolverVagas(padrao: VagasPorFila, linha: LinhaOperacional | undefined): VagasPorFila {
  return Object.fromEntries(FILAS.map((fila) => [fila, linha?.vagas?.[fila] ?? padrao[fila]])) as Record<Fila, number>
}

/** Limites de requisição da escola, cada um caindo no padrão do ambiente quando nulo. */
export function resolverLimites(padrao: LimitesDeRequisicao, linha: LinhaOperacional | undefined): LimitesDeRequisicao {
  return {
    porUsuarioMin: linha?.limiteReqUsuarioMin ?? padrao.porUsuarioMin,
    porEscolaMin: linha?.limiteReqEscolaMin ?? padrao.porEscolaMin,
  }
}

interface Entrada<T> {
  valor: T
  validaAte: number
}

export interface OpcoesDaConfiguracaoOperacional {
  /** Relógio em ms. Só o teste troca. */
  agora?: () => number
  /** Chamado quando a leitura falha; o valor usado segue sendo o último lido, ou o padrão. */
  aoFalhar?: (erro: unknown) => void
}

/**
 * A configuração operacional da escola do contexto, lida do Postgres e guardada por
 * `VALIDADE_DA_CONFIGURACAO_MS` em memória. Está no caminho de toda requisição (rate limit) e de toda
 * rodada do despachante: ler o banco a cada vez seria uma consulta por requisição às 10h.
 *
 * - A escola vem só do contexto (token na API, job no despachante), e é a chave da memória: uma
 *   escola nunca recebe a configuração de outra.
 * - Vencida, a configuração anterior segue valendo enquanto a nova é lida em segundo plano: o
 *   Postgres lento não atrasa a requisição.
 * - Leitura que falha não vira erro: vale a última lida ou, sem nenhuma, o padrão do ambiente. O
 *   rate limit e o despachante nunca param por causa dela.
 * - Rotina do sistema (sem escola) usa o padrão, sem consultar.
 *
 * Não é estado que outra instância precise (regra 80, item 5): cada instância lê do Postgres.
 */
export class ConfiguracaoOperacional<T> {
  readonly #entradas = new Map<string, Entrada<T>>()
  readonly #leituras = new Map<string, Promise<T>>()
  readonly #agora: () => number
  readonly #aoFalhar: (erro: unknown) => void

  constructor(
    private readonly repositorio: Pick<ConfiguracaoOperacionalRepository, 'daEscola'>,
    private readonly resolver: (linha: LinhaOperacional | undefined) => T,
    opcoes: OpcoesDaConfiguracaoOperacional = {},
  ) {
    this.#agora = opcoes.agora ?? (() => performance.now())
    this.#aoFalhar = opcoes.aoFalhar ?? (() => undefined)
  }

  daEscola(): Promise<T> {
    const contexto = contextoAtual()
    if (contexto?.escolaId === undefined) {
      if (contexto?.rotinaDoSistema === true) return Promise.resolve(this.resolver(undefined))
      return Promise.reject(new Error('configuração operacional sem escola no contexto'))
    }
    const escolaId = contexto.escolaId
    const entrada = this.#entradas.get(escolaId)
    if (entrada !== undefined && this.#agora() < entrada.validaAte) return Promise.resolve(entrada.valor)
    const leitura = this.#leituras.get(escolaId) ?? this.ler(escolaId, entrada)
    return entrada === undefined ? leitura : Promise.resolve(entrada.valor)
  }

  /**
   * Uma leitura por escola de cada vez, no contexto em andamento: é dele que o repository tira o
   * escopo, e ele é da mesma escola da chave.
   */
  private ler(escolaId: string, anterior: Entrada<T> | undefined): Promise<T> {
    const leitura = this.repositorio
      .daEscola()
      .then(
        (linha) => this.guardar(escolaId, this.resolver(linha), VALIDADE_DA_CONFIGURACAO_MS),
        (erro: unknown) => {
          this.#aoFalhar(erro)
          return this.guardar(escolaId, anterior?.valor ?? this.resolver(undefined), NOVA_TENTATIVA_DA_CONFIGURACAO_MS)
        },
      )
      .finally(() => this.#leituras.delete(escolaId))
    this.#leituras.set(escolaId, leitura)
    return leitura
  }

  private guardar(escolaId: string, valor: T, validadeMs: number): T {
    this.#entradas.set(escolaId, { valor, validaAte: this.#agora() + validadeMs })
    return valor
  }
}
