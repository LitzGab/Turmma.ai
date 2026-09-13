import {
  ConfiguracaoInvalida,
  lerConfiguracaoBanco,
  lerConfiguracaoTelemetria,
  lerVagasPadrao,
  validarAmbiente,
  type ConfiguracaoBanco,
  type ConfiguracaoTelemetria,
  type VagasPorFila,
} from '@educa/nucleo'
import { FILAS, type Fila } from '@educa/shared'
import { z } from 'zod'

export { ConfiguracaoInvalida }

const inteiroPositivo = z.coerce.number().int().positive()

/** Variável do pool de cada fila: `WORKER_POOL_INTERATIVA`, `WORKER_POOL_NORMAL`, `WORKER_POOL_LOTE`. */
export function variavelDoPool(fila: Fila): string {
  return `WORKER_POOL_${fila.toUpperCase()}`
}

const esquemaFilas = z.object({
  // `interativa,normal` no worker-interativo e `lote` no worker-lote: cada réplica atende só as filas dela.
  FILAS: z
    .string()
    .transform((texto) => texto.split(',').map((fila) => fila.trim()))
    .pipe(z.array(z.enum(FILAS)).min(1).refine((filas) => new Set(filas).size === filas.length, 'fila repetida')),
})

const esquemaAmbiente = z.object({
  REDIS_FILA_URL: z.string().regex(/^redis:\/\/[^/\s]+(\/\d+)?$/),
})

const esquemaStorage = z.object({
  STORAGE_URL: z.url({ protocol: /^https?$/ }),
  STORAGE_REGIAO: z.string().regex(/^[a-z0-9-]+$/),
  STORAGE_BUCKET: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/),
  STORAGE_CHAVE_ACESSO: z.string().min(1),
  STORAGE_CHAVE_SECRETA: z.string().min(1),
})

/** Acesso ao storage S3-compatível, só leitura de listagem: a consolidação de uso mede os bytes de cada escola. */
export interface ConfiguracaoStorage {
  url: string
  regiao: string
  bucket: string
  chaveAcesso: string
  chaveSecreta: string
}

export interface ConfiguracaoWorker {
  /** Pool próprio, com o `statement_timeout` do ambiente. Cabe na soma dos pools das filas: cada job usa uma conexão por vez. */
  banco: ConfiguracaoBanco
  redisFilaUrl: string
  /** Jobs ao mesmo tempo nesta réplica, por fila atendida. Fila fora daqui não é consumida por esta réplica. */
  pools: Partial<Record<Fila, number>>
  /** Vagas por fila da escola sem vagas próprias: o worker confere a vaga do job ao começar (D41). */
  vagasPadrao: VagasPorFila
  /**
   * Só na réplica que atende o lote, onde rodam as rotinas do sistema (consolidação de uso e expurgo).
   * O worker-interativo não mede storage e não precisa da credencial.
   */
  storage?: ConfiguracaoStorage
  /** Para onde e de quanto em quanto tempo as métricas vão. */
  telemetria: ConfiguracaoTelemetria
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
  const filas = ler(() => validarAmbiente(esquemaFilas, ambiente))
  // O pool só é exigido para as filas que a réplica atende.
  const esquemaPools = z.object(Object.fromEntries((filas?.FILAS ?? []).map((fila) => [variavelDoPool(fila), inteiroPositivo])))
  const pools = ler(() => validarAmbiente(esquemaPools, ambiente))
  const vagasPadrao = ler(() => lerVagasPadrao(ambiente))
  const atendeLote = filas?.FILAS.includes('lote') === true
  const storage = atendeLote ? ler(() => validarAmbiente(esquemaStorage, ambiente)) : undefined
  const telemetria = ler(() => lerConfiguracaoTelemetria(ambiente))
  if (
    telemetria === undefined ||
    banco === undefined ||
    proprio === undefined ||
    filas === undefined ||
    pools === undefined ||
    vagasPadrao === undefined ||
    (atendeLote && storage === undefined)
  ) {
    throw new ConfiguracaoInvalida(problemas.flatMap((erro) => erro.variaveis).sort(), problemas.flatMap((erro) => erro.motivos))
  }
  return {
    banco,
    redisFilaUrl: proprio.REDIS_FILA_URL,
    pools: Object.fromEntries(filas.FILAS.map((fila) => [fila, Number(pools[variavelDoPool(fila)])])),
    vagasPadrao,
    telemetria,
    ...(storage === undefined
      ? {}
      : {
          storage: {
            url: storage.STORAGE_URL,
            regiao: storage.STORAGE_REGIAO,
            bucket: storage.STORAGE_BUCKET,
            chaveAcesso: storage.STORAGE_CHAVE_ACESSO,
            chaveSecreta: storage.STORAGE_CHAVE_SECRETA,
          },
        }),
  }
}
