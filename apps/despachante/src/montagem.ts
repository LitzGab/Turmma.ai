import {
  avisoEspacado,
  criarBanco,
  criarClienteRedisDaFila,
  criarPool,
  DespachoRepository,
  NOME_DA_FILA_DE_JOBS,
  OuvinteDeJobs,
  type Batimento,
  type DadosDoJobNaFila,
  type LoggerBase,
} from '@educa/nucleo'
import { Queue } from 'bullmq'
import type { ConfiguracaoDespachante } from './config.js'
import { Despachante } from './despachante.js'
import { PublicacaoBullMQ } from './fila-de-publicacao.js'
import { Reconciliacao } from './reconciliacao.js'

export interface OpcoesDaMontagem {
  /** Prefixo das chaves do BullMQ. Só o teste troca, para não disputar a fila com outro teste. */
  prefixo?: string
  /** Intervalo da sondagem. Só o teste troca, para provar que o `NOTIFY` acorda o despachante antes dela. */
  intervaloMs?: number
  /** Intervalo da reconciliação. Só o teste troca, para provar que ela roda sozinha. */
  intervaloReconciliacaoMs?: number
  batimento?: Batimento
}

export interface DespachanteMontado {
  despachante: Despachante
  reconciliacao: Reconciliacao
  /** Liga o laço de publicação e o de reconciliação. */
  iniciar(): void
  /** Para os laços e fecha fila, Redis e pool, nessa ordem. */
  encerrar(): Promise<void>
}

/** Liga o despachante ao Postgres (pool próprio e `LISTEN`) e ao Redis de fila. */
export function montarDespachante(config: ConfiguracaoDespachante, logger: LoggerBase, opcoes: OpcoesDaMontagem = {}): DespachanteMontado {
  const pool = criarPool(config.banco, () => logger.warn({ evento: 'banco.conexao_ociosa_perdida' }))
  const redis = criarClienteRedisDaFila(
    config.redisFilaUrl,
    'despachante',
    avisoEspacado(() => logger.warn({ evento: 'despachante.redis_indisponivel' })),
  )
  const avisarErroDaFila = avisoEspacado(() => logger.warn({ evento: 'despachante.fila_com_erro' }))
  const fila = new PublicacaoBullMQ(() => {
    const queue = new Queue<DadosDoJobNaFila>(NOME_DA_FILA_DE_JOBS, {
      connection: redis,
      ...(opcoes.prefixo === undefined ? {} : { prefix: opcoes.prefixo }),
    })
    queue.on('error', avisarErroDaFila)
    return queue
  })
  const repositorio = new DespachoRepository(criarBanco(pool))

  // O aviso só chega depois de o laço abrir a escuta, e o laço só começa com o despachante construído.
  const ouvinte = new OuvinteDeJobs(
    pool,
    () => despachante.acordar(),
    avisoEspacado(() => logger.warn({ evento: 'despachante.escuta_indisponivel' })),
  )
  const despachante = new Despachante({
    repositorio,
    fila,
    logger,
    ouvinte,
    ...(opcoes.batimento === undefined ? {} : { batimento: opcoes.batimento }),
  }, opcoes.intervaloMs === undefined ? {} : { intervaloMs: opcoes.intervaloMs })
  const reconciliacao = new Reconciliacao(
    { repositorio, fila, logger },
    opcoes.intervaloReconciliacaoMs === undefined ? {} : { intervaloMs: opcoes.intervaloReconciliacaoMs },
  )

  let encerramento: Promise<void> | undefined
  const encerrar = async (): Promise<void> => {
    await Promise.all([despachante.parar(), reconciliacao.parar()])
    await ouvinte.fechar()
    await fila.fechar()
    await redis.quit().catch(() => redis.disconnect())
    await pool.end()
  }
  return {
    despachante,
    reconciliacao,
    iniciar: () => {
      despachante.iniciar()
      reconciliacao.iniciar()
    },
    // Uma vez só: o SIGTERM e o fim do teste podem pedir o encerramento juntos.
    encerrar: () => (encerramento ??= encerrar()),
  }
}
