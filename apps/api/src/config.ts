import {
  ConfiguracaoInvalida,
  lerConfiguracaoIdentidade,
  validarAmbiente,
  type ConfiguracaoBanco,
  type ConfiguracaoIdentidade,
} from '@educa/nucleo'
import { z } from 'zod'

export { ConfiguracaoInvalida }

const inteiroPositivo = z.coerce.number().int().positive()

const esquemaAmbiente = z.object({
  API_PORTA: inteiroPositivo,
  BANCO_URL: z.string().regex(/^postgres(ql)?:\/\/[^/]+\/[^/]+$/),
  BANCO_POOL_MAXIMO: inteiroPositivo,
  BANCO_TIMEOUT_CONEXAO_MS: inteiroPositivo,
  BANCO_TIMEOUT_CONSULTA_MS: inteiroPositivo,
})

export interface ConfiguracaoApi {
  porta: number
  banco: ConfiguracaoBanco
  identidade: ConfiguracaoIdentidade
}

/** Executa a leitura e devolve o erro de configuração em vez de lançar, para somar os problemas. */
function tentar<T>(ler: () => T): { valor: T } | { erro: ConfiguracaoInvalida } {
  try {
    return { valor: ler() }
  } catch (erro) {
    if (erro instanceof ConfiguracaoInvalida) return { erro }
    throw erro
  }
}

/**
 * Lê e valida o ambiente da API. Não sobe com variável faltando ou inválida, e não sobe com
 * token sintético ligado em produção. Todos os problemas saem de uma vez, só pelo nome.
 */
export function lerConfiguracao(ambiente: Record<string, string | undefined>): ConfiguracaoApi {
  const api = tentar(() => validarAmbiente(esquemaAmbiente, ambiente))
  const identidade = tentar(() => lerConfiguracaoIdentidade(ambiente))
  if ('erro' in api || 'erro' in identidade) {
    const erros = [api, identidade].flatMap((leitura) => ('erro' in leitura ? [leitura.erro] : []))
    throw new ConfiguracaoInvalida(
      erros.flatMap((erro) => erro.variaveis).sort(),
      erros.flatMap((erro) => erro.motivos),
    )
  }
  const valores = api.valor
  return {
    porta: valores.API_PORTA,
    banco: {
      url: valores.BANCO_URL,
      maximoConexoes: valores.BANCO_POOL_MAXIMO,
      timeoutConexaoMs: valores.BANCO_TIMEOUT_CONEXAO_MS,
      timeoutConsultaMs: valores.BANCO_TIMEOUT_CONSULTA_MS,
    },
    identidade: identidade.valor,
  }
}
