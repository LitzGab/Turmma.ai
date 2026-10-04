import { setTimeout as esperar } from 'node:timers/promises'
import type { AdaptadorDeModelo, ChamadaAoModelo, RespostaDoModelo } from './adaptador.js'
import { ErroDeIa } from './erros.js'
import type { Perfil } from './perfis.js'
import { MaterialSemConteudoAproveitavel, type DefinicaoDeTarefa } from './tarefa.js'

export const MODELO_FALSO = 'falso-deterministico'

/** Estimativa grosseira e estável: quatro caracteres por token. Serve para o consumo aparecer na governança sem modelo. */
export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 4)
}

function versaoDeterministica<Entrada, Saida>(tarefa: DefinicaoDeTarefa<Entrada, Saida>, entrada: Entrada): Saida {
  try {
    return tarefa.falso(entrada)
  } catch (erro) {
    // Sem material aproveitável não há o que citar, e por isso não há saída (regra 30, item 12).
    if (erro instanceof MaterialSemConteudoAproveitavel) throw new ErroDeIa('MATERIAL_INSUFICIENTE')
    throw erro
  }
}

export interface OpcoesDoAdaptadorFalso {
  /** Espera simulada por chamada, para ensaio e teste de carga sem provedor (regra 80, item 11). */
  readonly latenciaMs?: number
}

/**
 * O adaptador dos testes e da demonstração sem modelo: devolve a versão determinística da tarefa, feita só do que
 * veio na entrada. Mesma entrada, mesma saída. Não chama ninguém, e por isso nunca há envio externo.
 */
export class AdaptadorFalso implements AdaptadorDeModelo {
  readonly origem = 'falso'
  readonly envioExterno = false

  constructor(private readonly opcoes: OpcoesDoAdaptadorFalso = {}) {}

  modeloDoPerfil(_perfil: Perfil): string {
    return MODELO_FALSO
  }

  async chamar<Entrada, Saida>(chamada: ChamadaAoModelo<Entrada, Saida>): Promise<RespostaDoModelo> {
    const latenciaMs = this.opcoes.latenciaMs ?? 0
    if (latenciaMs > 0) {
      await esperar(latenciaMs, undefined, { signal: chamada.sinal }).catch(() => {
        throw new ErroDeIa('IA_TEMPO_ESGOTADO')
      })
    }
    const texto = JSON.stringify(versaoDeterministica(chamada.tarefa, chamada.entrada))
    return {
      texto,
      modelo: MODELO_FALSO,
      tokensDeEntrada: estimarTokens(JSON.stringify(chamada.entrada)),
      tokensDeSaida: estimarTokens(texto),
    }
  }
}
