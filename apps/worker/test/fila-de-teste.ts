import {
  ConfiguracaoOperacional,
  ConfiguracaoOperacionalRepository,
  criarBanco,
  criarLogger,
  criarPool,
  DespachoRepository,
  Enfileirador,
  executarNoContexto,
  JobRegistroRepository,
  nomeDaFilaBullMQ,
  resolverVagas,
  VagasPorEscola,
  type Banco,
  type ConfiguracaoBanco,
  type DadosDoJobNaFila,
  type LoggerBase,
  type PedidoDeJob,
  type PoolBanco,
  type VagasConfiguradas,
  type VagasPorFila,
} from '@educa/nucleo'
import { FILAS, type EstadoDeJob, type Fila } from '@educa/shared'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { randomUUID } from 'node:crypto'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../tools/ci/compose.ts'
import { urlDoBancoDeTeste } from '../../../tools/testes/integracao.setup.ts'
import { montarDespachante, type DespachanteMontado, type OpcoesDaMontagem as OpcoesDoDespachante } from '../../despachante/src/montagem.js'
import type { Processador } from '../src/executor.js'
import { montarWorker, type WorkerMontado } from '../src/montagem.js'

export const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
export const ESCOLA_B = '0190f5a0-0000-7000-8000-00000000000b'

const ambiente = lerAmbienteDeTeste()

export function configuracaoDoBanco(maximoConexoes = 5): ConfiguracaoBanco {
  return { url: urlDoBancoDeTeste(), maximoConexoes, timeoutConexaoMs: 2_000, timeoutConsultaMs: 2_000 }
}

/** As vagas por fila do padrão do ambiente, as mesmas de `.env.example` com que o despachante sobe. */
export function vagasPadraoDoAmbiente(): VagasPorFila {
  return {
    interativa: Number(valorObrigatorio(ambiente, 'VAGAS_ESCOLA_INTERATIVA')),
    normal: Number(valorObrigatorio(ambiente, 'VAGAS_ESCOLA_NORMAL')),
    lote: Number(valorObrigatorio(ambiente, 'VAGAS_ESCOLA_LOTE')),
  }
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
 * O que o teste usa para olhar o banco e as filas por fora: pool próprio, repositories reais, uma
 * `Queue` por fila e as vagas, no mesmo prefixo dos despachantes e workers do teste.
 */
export class BancadaDeFila {
  readonly prefixo = `teste-${randomUUID()}`
  readonly pool: PoolBanco = criarPool(configuracaoDoBanco(), () => undefined)
  readonly banco: Banco = criarBanco(this.pool)
  readonly registro = new JobRegistroRepository(this.banco)
  readonly despacho = new DespachoRepository(this.banco)
  readonly enfileirador = new Enfileirador(this.registro)
  readonly redis = new Redis(urlRedisDeFila(), { maxRetriesPerRequest: null })
  readonly filas: Readonly<Record<Fila, Queue<DadosDoJobNaFila>>> = Object.fromEntries(
    FILAS.map((fila) => [fila, new Queue<DadosDoJobNaFila>(nomeDaFilaBullMQ(fila), { connection: this.redis, prefix: this.prefixo })]),
  ) as Record<Fila, Queue<DadosDoJobNaFila>>
  readonly vagas = new VagasPorEscola(this.redis, this.prefixo)
  readonly #montados: Array<DespachanteMontado | WorkerMontado> = []

  constructor() {
    // Os testes param o Redis de fila: sem ouvinte, o ioredis escreve cada reconexão no console.
    this.redis.on('error', () => undefined)
    for (const fila of Object.values(this.filas)) fila.on('error', () => undefined)
  }

  /** A fila interativa, onde a maior parte dos testes publica. */
  get fila(): Queue<DadosDoJobNaFila> {
    return this.filas.interativa
  }

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

  /** Reserva como o despachante faz, na escola do contexto e na fila, sem tomar vaga. */
  reservar(escolaId: string, fila: Fila = 'interativa', limite = 1_000) {
    return executarNoContexto({ requisicaoId: randomUUID(), escolaId }, () => this.despacho.reservarDaEscola(fila, limite))
  }

  /** Vagas no mesmo prefixo, sobre outro cliente: como outra instância as veria. */
  vagasCom(cliente: Redis): VagasPorEscola {
    return new VagasPorEscola(cliente, this.prefixo)
  }

  /** As vagas por fila da escola do contexto, lidas como o despachante lê. */
  vagasDaEscola(): ConfiguracaoOperacional<VagasPorFila> {
    return new ConfiguracaoOperacional(new ConfiguracaoOperacionalRepository(this.banco), (linha) => resolverVagas(vagasPadraoDoAmbiente(), linha))
  }

  /** Grava a configuração operacional da escola, como a escola a teria. */
  async configurarEscola(escolaId: string, configuracao: { vagas?: VagasConfiguradas | null; limiteReqUsuarioMin?: number; limiteReqEscolaMin?: number }): Promise<void> {
    await this.pool.query(
      `insert into configuracao_operacional_escola (escola_id, vagas, limite_req_usuario_min, limite_req_escola_min) values ($1, $2, $3, $4)
       on conflict (escola_id) do update set vagas = excluded.vagas, limite_req_usuario_min = excluded.limite_req_usuario_min, limite_req_escola_min = excluded.limite_req_escola_min`,
      [escolaId, configuracao.vagas === undefined || configuracao.vagas === null ? null : JSON.stringify(configuracao.vagas), configuracao.limiteReqUsuarioMin ?? null, configuracao.limiteReqEscolaMin ?? null],
    )
  }

  despachante(log: LogEmMemoria, opcoes: Omit<OpcoesDoDespachante, 'prefixo'> = {}): DespachanteMontado {
    const montado = montarDespachante({ banco: configuracaoDoBanco(3), redisFilaUrl: urlRedisDeFila(), vagasPadrao: vagasPadraoDoAmbiente() }, log.logger, { prefixo: this.prefixo, ...opcoes })
    this.#montados.push(montado)
    return montado
  }

  /** Um worker que atende as três filas, com `concorrencia` em cada uma, salvo `pools` explícito. */
  worker(
    log: LogEmMemoria,
    opcoes: {
      concorrencia?: number
      pools?: Partial<Record<Fila, number>>
      processadores?: Readonly<Record<string, Processador>>
      graca?: number
      intervaloRenovacaoDaVagaMs?: number
      validadeDaVagaMs?: number
    } = {},
  ): WorkerMontado {
    const pools = opcoes.pools ?? Object.fromEntries(FILAS.map((fila) => [fila, opcoes.concorrencia ?? 5]))
    const montado = montarWorker({ banco: configuracaoDoBanco(), redisFilaUrl: urlRedisDeFila(), pools, vagasPadrao: vagasPadraoDoAmbiente() }, log.logger, {
      prefixo: this.prefixo,
      ...(opcoes.processadores === undefined ? {} : { processadores: opcoes.processadores }),
      ...(opcoes.graca === undefined ? {} : { graca: opcoes.graca }),
      ...(opcoes.intervaloRenovacaoDaVagaMs === undefined ? {} : { intervaloRenovacaoDaVagaMs: opcoes.intervaloRenovacaoDaVagaMs }),
      ...(opcoes.validadeDaVagaMs === undefined ? {} : { validadeDaVagaMs: opcoes.validadeDaVagaMs }),
    })
    this.#montados.push(montado)
    return montado
  }

  /** Todo job pendente vira histórico, e toda escola volta ao padrão: um teste não herda fila nem configuração de outro. */
  async limparRegistro(): Promise<void> {
    await this.pool.query('delete from job_registro')
    await this.pool.query('delete from configuracao_operacional_escola')
  }

  async fechar(): Promise<void> {
    await Promise.all(this.#montados.splice(0).map((montado) => montado.encerrar()))
    for (const fila of Object.values(this.filas)) {
      await fila.obliterate({ force: true })
      await fila.close()
    }
    const vagas = await this.redis.keys(`${this.prefixo}:vaga:*`)
    if (vagas.length > 0) await this.redis.del(...vagas)
    await this.redis.quit()
    await this.pool.end()
  }
}
