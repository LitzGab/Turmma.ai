import {
  criarBanco,
  criarLogger,
  criarPool,
  DespachoRepository,
  Enfileirador,
  executarNoContexto,
  JobRegistroRepository,
  NOME_DA_FILA_DE_JOBS,
  type Banco,
  type ConfiguracaoBanco,
  type DadosDoJobNaFila,
  type LoggerBase,
  type PedidoDeJob,
  type PoolBanco,
} from '@educa/nucleo'
import type { EstadoDeJob } from '@educa/shared'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { randomUUID } from 'node:crypto'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../tools/ci/compose.ts'
import { urlDoBancoDeTeste } from '../../../tools/testes/integracao.setup.ts'
import { montarDespachante, type DespachanteMontado } from '../../despachante/src/montagem.js'
import type { Processador } from '../src/executor.js'
import { montarWorker, type WorkerMontado } from '../src/montagem.js'

export const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
export const ESCOLA_B = '0190f5a0-0000-7000-8000-00000000000b'

const ambiente = lerAmbienteDeTeste()

export function configuracaoDoBanco(maximoConexoes = 5): ConfiguracaoBanco {
  return { url: urlDoBancoDeTeste(), maximoConexoes, timeoutConexaoMs: 2_000, timeoutConsultaMs: 2_000 }
}

export function urlRedisDeFila(): string {
  return `redis://127.0.0.1:${valorObrigatorio(ambiente, 'REDIS_FILA_PORTA_HOST')}`
}

/** Log em memória, para o teste ler o que o processo escreveria no stdout. */
export class LogEmMemoria {
  readonly linhas: string[] = []
  readonly logger: LoggerBase

  constructor(servico: string) {
    this.logger = criarLogger({ servico, destino: { write: (linha: string) => this.linhas.push(linha) } })
  }

  registros(): Array<Record<string, unknown>> {
    return this.linhas.map((linha) => JSON.parse(linha) as Record<string, unknown>)
  }

  doEvento(evento: string): Array<Record<string, unknown>> {
    return this.registros().filter((registro) => registro['evento'] === evento)
  }
}

/**
 * O que o teste usa para olhar o banco e a fila por fora: pool próprio, repositories reais e uma
 * `Queue` no mesmo prefixo dos despachantes e workers do teste.
 */
export class BancadaDeFila {
  readonly prefixo = `teste-${randomUUID()}`
  readonly pool: PoolBanco = criarPool(configuracaoDoBanco(), () => undefined)
  readonly banco: Banco = criarBanco(this.pool)
  readonly registro = new JobRegistroRepository(this.banco)
  readonly despacho = new DespachoRepository(this.banco)
  readonly enfileirador = new Enfileirador(this.registro)
  readonly redis = new Redis(urlRedisDeFila(), { maxRetriesPerRequest: null })
  readonly fila = new Queue<DadosDoJobNaFila>(NOME_DA_FILA_DE_JOBS, { connection: this.redis, prefix: this.prefixo })
  readonly #montados: Array<DespachanteMontado | WorkerMontado> = []

  /** Enfileira como a API faz: na transação, com a escola e a requisição no contexto. */
  enfileirar(escolaId: string, pedido: Partial<PedidoDeJob> & { dados?: Record<string, unknown> } = {}, requisicaoId = randomUUID()): Promise<string> {
    return executarNoContexto({ requisicaoId, escolaId }, () =>
      this.banco.transaction((tx) =>
        this.enfileirador.enfileirar(tx, {
          tipo: 'sintetico',
          fila: 'interativa',
          naoUrgente: false,
          dados: { cpuMs: 0, falhar: false },
          ...pedido,
        }),
      ),
    )
  }

  async estado(id: string): Promise<{ estado: EstadoDeJob; escolaId: string | null; codigoFalha: string | null } | undefined> {
    const { rows } = await this.pool.query<{ estado: EstadoDeJob; escolaId: string | null; codigoFalha: string | null }>(
      'select estado, escola_id as "escolaId", codigo_falha as "codigoFalha" from job_registro where id = $1',
      [id],
    )
    return rows[0]
  }

  despachante(log: LogEmMemoria, opcoes: { intervaloMs?: number } = {}): DespachanteMontado {
    const montado = montarDespachante({ banco: configuracaoDoBanco(3), redisFilaUrl: urlRedisDeFila() }, log.logger, { prefixo: this.prefixo, ...opcoes })
    this.#montados.push(montado)
    return montado
  }

  worker(log: LogEmMemoria, opcoes: { concorrencia?: number; processadores?: Readonly<Record<string, Processador>> } = {}): WorkerMontado {
    const montado = montarWorker(
      { banco: configuracaoDoBanco(), redisFilaUrl: urlRedisDeFila(), concorrencia: opcoes.concorrencia ?? 5 },
      log.logger,
      { prefixo: this.prefixo, ...(opcoes.processadores === undefined ? {} : { processadores: opcoes.processadores }) },
    )
    this.#montados.push(montado)
    return montado
  }

  /** Todo job pendente vira histórico: um teste não herda fila de outro. */
  async limparRegistro(): Promise<void> {
    await this.pool.query('delete from job_registro')
  }

  async fechar(): Promise<void> {
    await Promise.all(this.#montados.splice(0).map((montado) => montado.encerrar()))
    await this.fila.obliterate({ force: true })
    await this.fila.close()
    await this.redis.quit()
    await this.pool.end()
  }
}
