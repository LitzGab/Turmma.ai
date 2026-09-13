import {
  avisoEspacado,
  criarBanco,
  criarPool,
  DespachoRepository,
  NOME_DA_FILA_DE_JOBS,
  OuvinteDeJobs,
  type Batimento,
  type DadosDoJobNaFila,
  type LoggerBase,
} from '@educa/nucleo'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import type { ConfiguracaoDespachante } from './config.js'
import { Despachante } from './despachante.js'

export interface OpcoesDaMontagem {
  /** Prefixo das chaves do BullMQ. Só o teste troca, para não disputar a fila com outro teste. */
  prefixo?: string
  /** Intervalo da sondagem. Só o teste troca, para provar que o `NOTIFY` acorda o despachante antes dela. */
  intervaloMs?: number
  batimento?: Batimento
}

export interface DespachanteMontado {
  despachante: Despachante
  /** Para o laço e fecha fila, Redis e pool, nessa ordem. */
  encerrar(): Promise<void>
}

/** Liga o despachante ao Postgres (pool próprio e `LISTEN`) e ao Redis de fila. */
export function montarDespachante(config: ConfiguracaoDespachante, logger: LoggerBase, opcoes: OpcoesDaMontagem = {}): DespachanteMontado {
  const pool = criarPool(config.banco, () => logger.warn({ evento: 'banco.conexao_ociosa_perdida' }))
  const redis = new Redis(config.redisFilaUrl, { connectionName: 'despachante' })
  // Sem ouvinte, o ioredis escreve cada tentativa de reconexão no console, fora do log JSON.
  redis.on('error', avisoEspacado(() => logger.warn({ evento: 'despachante.redis_indisponivel' })))
  const fila = new Queue<DadosDoJobNaFila>(NOME_DA_FILA_DE_JOBS, {
    connection: redis,
    ...(opcoes.prefixo === undefined ? {} : { prefix: opcoes.prefixo }),
  })
  fila.on('error', avisoEspacado(() => logger.warn({ evento: 'despachante.fila_com_erro' })))

  // O aviso só chega depois de o laço abrir a escuta, e o laço só começa com o despachante construído.
  const ouvinte = new OuvinteDeJobs(
    pool,
    () => montado.acordar(),
    avisoEspacado(() => logger.warn({ evento: 'despachante.escuta_indisponivel' })),
  )
  const montado = new Despachante({
    repositorio: new DespachoRepository(criarBanco(pool)),
    fila,
    logger,
    ouvinte,
    ...(opcoes.batimento === undefined ? {} : { batimento: opcoes.batimento }),
  }, opcoes.intervaloMs === undefined ? {} : { intervaloMs: opcoes.intervaloMs })

  let encerramento: Promise<void> | undefined
  const encerrar = async (): Promise<void> => {
    await montado.parar()
    await ouvinte.fechar()
    await fila.close()
    await redis.quit().catch(() => redis.disconnect())
    await pool.end()
  }
  return {
    despachante: montado,
    // Uma vez só: o SIGTERM e o fim do teste podem pedir o encerramento juntos.
    encerrar: () => (encerramento ??= encerrar()),
  }
}
