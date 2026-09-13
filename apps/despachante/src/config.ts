import {
  ConfiguracaoInvalida,
  lerConfiguracaoBanco,
  lerConfiguracaoTelemetria,
  lerJanelaPadrao,
  lerVagasPadrao,
  validarAmbiente,
  type ConfiguracaoBanco,
  type ConfiguracaoTelemetria,
  type JanelaLetiva,
  type VagasPorFila,
} from '@educa/nucleo'
import { z } from 'zod'

export { ConfiguracaoInvalida }

const esquemaAmbiente = z.object({
  REDIS_FILA_URL: z.string().regex(/^redis:\/\/[^/\s]+(\/\d+)?$/),
})

export interface ConfiguracaoDespachante {
  /** Pool próprio, com o `statement_timeout` do ambiente; a conexão do `LISTEN` sai dele. */
  banco: ConfiguracaoBanco
  redisFilaUrl: string
  /** Vagas simultâneas por fila da escola que não configurou as próprias (D41). */
  vagasPadrao: VagasPorFila
  /** Horário letivo da escola que não configurou o próprio, em que o lote não urgente fica segurado (D41). */
  janelaPadrao: JanelaLetiva
  /** Para onde e de quanto em quanto tempo as métricas vão. */
  telemetria: ConfiguracaoTelemetria
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
  const vagasPadrao = ler(() => lerVagasPadrao(ambiente))
  const janelaPadrao = ler(() => lerJanelaPadrao(ambiente))
  const telemetria = ler(() => lerConfiguracaoTelemetria(ambiente))
  if (banco === undefined || proprio === undefined || vagasPadrao === undefined || janelaPadrao === undefined || telemetria === undefined) {
    throw new ConfiguracaoInvalida(problemas.flatMap((erro) => erro.variaveis).sort(), problemas.flatMap((erro) => erro.motivos))
  }
  return {
    banco,
    redisFilaUrl: proprio.REDIS_FILA_URL,
    vagasPadrao,
    janelaPadrao,
    telemetria,
  }
}
