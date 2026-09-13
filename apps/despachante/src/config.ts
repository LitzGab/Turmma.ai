import { ConfiguracaoInvalida, lerConfiguracaoBanco, validarAmbiente, type ConfiguracaoBanco } from '@educa/nucleo'
import { z } from 'zod'

export { ConfiguracaoInvalida }

const esquemaAmbiente = z.object({
  REDIS_FILA_URL: z.string().regex(/^redis:\/\/[^/\s]+(\/\d+)?$/),
})

export interface ConfiguracaoDespachante {
  /** Pool próprio, com o `statement_timeout` do ambiente; a conexão do `LISTEN` sai dele. */
  banco: ConfiguracaoBanco
  redisFilaUrl: string
}

/** Lê e valida o ambiente do despachante. Todos os problemas saem de uma vez, só pelo nome. */
export function lerConfiguracao(ambiente: Record<string, string | undefined>): ConfiguracaoDespachante {
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
  return { banco, redisFilaUrl: proprio.REDIS_FILA_URL }
}
