import type { ConfiguracaoBanco } from '@educa/nucleo'
import { z } from 'zod'

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
}

export class ConfiguracaoInvalida extends Error {
  constructor(readonly variaveis: string[]) {
    // Só o nome da variável: o valor pode conter senha (BANCO_URL).
    super(`Configuração inválida ou ausente: ${variaveis.join(', ')}`)
    this.name = 'ConfiguracaoInvalida'
  }
}

export function lerConfiguracao(ambiente: Record<string, string | undefined>): ConfiguracaoApi {
  const resultado = esquemaAmbiente.safeParse(ambiente)
  if (!resultado.success) {
    const variaveis = [...new Set(resultado.error.issues.map((problema) => String(problema.path[0])))]
    throw new ConfiguracaoInvalida(variaveis.sort())
  }
  const valores = resultado.data
  return {
    porta: valores.API_PORTA,
    banco: {
      url: valores.BANCO_URL,
      maximoConexoes: valores.BANCO_POOL_MAXIMO,
      timeoutConexaoMs: valores.BANCO_TIMEOUT_CONEXAO_MS,
      timeoutConsultaMs: valores.BANCO_TIMEOUT_CONSULTA_MS,
    },
  }
}
