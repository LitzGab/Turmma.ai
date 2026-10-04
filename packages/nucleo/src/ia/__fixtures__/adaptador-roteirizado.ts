import type { AdaptadorDeModelo, ChamadaAoModelo, CorrecaoPedida, RespostaDoModelo } from '../adaptador.js'
import type { Perfil } from '../perfis.js'

/**
 * Um modelo de mentira que devolve, em ordem, os textos do roteiro: é como o teste põe na boca do "modelo" a saída
 * que a conferência precisa barrar. Um item que é `Error` é lançado, como um adaptador com defeito faria.
 */
export class AdaptadorRoteirizado implements AdaptadorDeModelo {
  readonly origem = 'openai_compat'
  /** O que cada chamada recebeu de correção (`undefined` na primeira). */
  readonly correcoes: (CorrecaoPedida | undefined)[] = []

  constructor(
    private readonly roteiro: readonly (string | Error)[],
    readonly envioExterno = true,
  ) {}

  get chamadas(): number {
    return this.correcoes.length
  }

  modeloDoPerfil(perfil: Perfil): string {
    return `roteirizado-${perfil}`
  }

  async chamar<Entrada, Saida>(chamada: ChamadaAoModelo<Entrada, Saida>): Promise<RespostaDoModelo> {
    const item = this.roteiro[this.correcoes.length]
    this.correcoes.push(chamada.correcao)
    if (item === undefined) throw new Error('o roteiro do teste acabou antes das chamadas')
    if (item instanceof Error) throw item
    return { texto: item, modelo: this.modeloDoPerfil(chamada.tarefa.perfil), tokensDeEntrada: 100, tokensDeSaida: 20 }
  }
}
