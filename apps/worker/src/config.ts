import { ConfiguracaoInvalida, lerConfiguracaoBanco, validarAmbiente, type ConfiguracaoBanco } from '@educa/nucleo'
import { z } from 'zod'

export { ConfiguracaoInvalida }

const esquemaAmbiente = z.object({
  REDIS_FILA_URL: z.string().regex(/^redis:\/\/[^/\s]+(\/\d+)?$/),
  WORKER_CONCORRENCIA: z.coerce.number().int().positive(),
})

export interface ConfiguracaoWorker {
  /** Pool próprio, com o `statement_timeout` do ambiente. Cabe na concorrência: cada job usa uma conexão por vez. */
  banco: ConfiguracaoBanco
  redisFilaUrl: string
  /** Jobs ao mesmo tempo nesta réplica. A 9.0 troca por pools por fila. */
  concorrencia: number
}

/** Lê e valida o ambiente do worker. Todos os problemas saem de uma vez, só pelo nome. */
export function lerConfiguracao(ambiente: Record<string, string | undefined>): ConfiguracaoWorker {
  const problemas: ConfiguracaoInvalida[] = []
  const ler = <T>(leitura: () => T): T | undefined => {
    try {
      return leitura()
    } catch (erro) {
      if (!(erro instanceof ConfiguracaoInvalida)) throw erro
      problemas.push(erro)
      return undefined
    }
  }
  const banco = ler(() => lerConfiguracaoBanco(ambiente))
  const proprio = ler(() => validarAmbiente(esquemaAmbiente, ambiente))
  if (banco === undefined || proprio === undefined) {
    throw new ConfiguracaoInvalida(problemas.flatMap((erro) => erro.variaveis).sort(), problemas.flatMap((erro) => erro.motivos))
  }
  return { banco, redisFilaUrl: proprio.REDIS_FILA_URL, concorrencia: proprio.WORKER_CONCORRENCIA }
}
