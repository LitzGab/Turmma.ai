import type { Perfil } from './perfis.js'
import type { TarefaDeIa } from './tarefa.js'

/** O que voltou errado na tentativa anterior, para o modelo corrigir. Só existe na repetição. */
export interface CorrecaoPedida {
  readonly respostaAnterior: string
  readonly problemas: readonly string[]
}

export interface ChamadaAoModelo<Entrada, Saida> {
  readonly tarefa: TarefaDeIa<Entrada, Saida>
  /** Já validada pelo schema de entrada. */
  readonly entrada: Entrada
  readonly sinal: AbortSignal
  readonly correcao?: CorrecaoPedida
}

export interface RespostaDoModelo {
  /** O texto que o modelo devolveu, já sem bloco de raciocínio e sem cerca de código. Ainda não validado. */
  readonly texto: string
  readonly modelo: string
  readonly tokensDeEntrada: number
  readonly tokensDeSaida: number
}

/**
 * O que muda de um provedor para outro, e só isso: fazer uma chamada e devolver o texto e o uso. Validação,
 * repetição, orçamento, registro e log são do `ProvedorDeIa`, iguais para todo adaptador.
 */
export interface AdaptadorDeModelo {
  readonly origem: 'falso' | 'openai_compat'
  readonly envioExterno: boolean
  modeloDoPerfil(perfil: Perfil): string
  /** Falha com `ErroDeIa` (`IA_INDISPONIVEL` ou `IA_TEMPO_ESGOTADO`); nunca devolve nem lança erro cru do provedor. */
  chamar<Entrada, Saida>(chamada: ChamadaAoModelo<Entrada, Saida>): Promise<RespostaDoModelo>
}
