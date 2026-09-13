import {
  ConfiguracaoInvalida,
  lerConfiguracaoDrenagem,
  lerConfiguracaoIdentidade,
  lerConfiguracaoTelemetria,
  validarAmbiente,
  type ConfiguracaoDrenagem,
  type ConfiguracaoIdentidade,
  type ConfiguracaoTelemetria,
} from '@educa/nucleo'
import { z } from 'zod'

export { ConfiguracaoInvalida }

const inteiroPositivo = z.coerce.number().int().positive()

const esquemaAmbiente = z.object({
  REALTIME_PORTA: inteiroPositivo,
  REDIS_FILA_URL: z.string().regex(/^redis:\/\/[^/\s]+(\/\d+)?$/),
  REALTIME_STREAM_TAMANHO_MAXIMO: inteiroPositivo,
})

export interface ConfiguracaoRealtime {
  porta: number
  redis: {
    url: string
    /** Teto de mensagens guardadas no stream do adaptador, no Redis de fila (`noeviction`). */
    tamanhoMaximoDoStream: number
  }
  identidade: ConfiguracaoIdentidade
  drenagem: ConfiguracaoDrenagem
  /** Para onde e de quanto em quanto tempo as métricas vão. */
  telemetria: ConfiguracaoTelemetria
}

type Leitura<T> = { valor: T } | { erro: ConfiguracaoInvalida }

function tentar<T>(ler: () => T): Leitura<T> {
  try {
    return { valor: ler() }
  } catch (erro) {
    if (erro instanceof ConfiguracaoInvalida) return { erro }
    throw erro
  }
}

/**
 * Lê e valida o ambiente do realtime. Não sobe com variável faltando ou inválida, nem com token
 * sintético ligado em produção. Todos os problemas saem de uma vez, só pelo nome da variável.
 */
export function lerConfiguracao(ambiente: Record<string, string | undefined>): ConfiguracaoRealtime {
  const realtime = tentar(() => validarAmbiente(esquemaAmbiente, ambiente))
  const identidade = tentar(() => lerConfiguracaoIdentidade(ambiente))
  const drenagem = tentar(() => lerConfiguracaoDrenagem(ambiente))
  const telemetria = tentar(() => lerConfiguracaoTelemetria(ambiente))
  if ('erro' in realtime || 'erro' in identidade || 'erro' in drenagem || 'erro' in telemetria) {
    const erros = [realtime, identidade, drenagem, telemetria].flatMap((leitura) => ('erro' in leitura ? [leitura.erro] : []))
    throw new ConfiguracaoInvalida(
      erros.flatMap((erro) => erro.variaveis).sort(),
      erros.flatMap((erro) => erro.motivos),
    )
  }
  return {
    porta: realtime.valor.REALTIME_PORTA,
    redis: { url: realtime.valor.REDIS_FILA_URL, tamanhoMaximoDoStream: realtime.valor.REALTIME_STREAM_TAMANHO_MAXIMO },
    identidade: identidade.valor,
    drenagem: drenagem.valor,
    telemetria: telemetria.valor,
  }
}
