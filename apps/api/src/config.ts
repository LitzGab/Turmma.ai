import {
  ConfiguracaoInvalida,
  lerConfiguracaoBanco,
  lerConfiguracaoDrenagem,
  lerConfiguracaoIdentidade,
  lerConfiguracaoLimite,
  validarAmbiente,
  type ConfiguracaoBanco,
  type ConfiguracaoDrenagem,
  type ConfiguracaoIdentidade,
  type ConfiguracaoLimite,
} from '@educa/nucleo'
import { z } from 'zod'

export { ConfiguracaoInvalida }

const inteiroPositivo = z.coerce.number().int().positive()

export const MOTIVO_ROTAS_SINTETICAS_EM_PRODUCAO =
  'ROTAS_SINTETICAS=true é proibido com AMBIENTE=producao: rota de teste não existe em produção'

/**
 * `ROTAS_SINTETICAS` liga o `POST /v1/sistema/jobs-sinteticos`, que só serve a teste e ao cenário de
 * carga. Como a flag do token sintético, só aceita `true` ou `false` escrito assim, e não sobe ligada
 * em produção.
 */
const esquemaAmbiente = z
  .object({
    API_PORTA: inteiroPositivo,
    // Validado pela identidade; aqui só é lido para a trava de produção, sem apontar a falta duas vezes.
    AMBIENTE: z.string().optional(),
    ROTAS_SINTETICAS: z.enum(['true', 'false']),
    // Só para o contador de uso por escola (D30): a API não depende dele para atender.
    REDIS_FILA_URL: z.string().regex(/^redis:\/\/[^/\s]+(\/\d+)?$/),
  })
  .superRefine((valores, contexto) => {
    if (valores.AMBIENTE === 'producao' && valores.ROTAS_SINTETICAS === 'true') {
      contexto.addIssue({ code: 'custom', path: ['ROTAS_SINTETICAS'], message: MOTIVO_ROTAS_SINTETICAS_EM_PRODUCAO })
    }
  })

export interface ConfiguracaoApi {
  porta: number
  /** Liga as rotas que só existem para teste e carga. */
  rotasSinteticas: boolean
  /** Redis de fila, onde a API marca o uso de cada escola sem esperar resposta. */
  redisFilaUrl: string
  banco: ConfiguracaoBanco
  identidade: ConfiguracaoIdentidade
  drenagem: ConfiguracaoDrenagem
  limite: ConfiguracaoLimite
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
  const banco = tentar(() => lerConfiguracaoBanco(ambiente))
  const identidade = tentar(() => lerConfiguracaoIdentidade(ambiente))
  const drenagem = tentar(() => lerConfiguracaoDrenagem(ambiente))
  const limite = tentar(() => lerConfiguracaoLimite(ambiente))
  if ('erro' in api || 'erro' in banco || 'erro' in identidade || 'erro' in drenagem || 'erro' in limite) {
    const erros = [api, banco, identidade, drenagem, limite].flatMap((leitura) => ('erro' in leitura ? [leitura.erro] : []))
    throw new ConfiguracaoInvalida(
      erros.flatMap((erro) => erro.variaveis).sort(),
      erros.flatMap((erro) => erro.motivos),
    )
  }
  return {
    porta: api.valor.API_PORTA,
    rotasSinteticas: api.valor.ROTAS_SINTETICAS === 'true',
    redisFilaUrl: api.valor.REDIS_FILA_URL,
    banco: banco.valor,
    identidade: identidade.valor,
    drenagem: drenagem.valor,
    limite: limite.valor,
  }
}
