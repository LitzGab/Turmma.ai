import { CodigoDeFalhaDeJob, CPU_MS_MAXIMO_SINTETICO } from '@educa/shared'
import { Worker } from 'node:worker_threads'
import { z } from 'zod'
import type { Processador } from '../executor.js'
import { FalhaDeJob } from '../falha-de-job.js'

const esquemaDados = z.object({
  cpuMs: z.number().int().min(0).max(CPU_MS_MAXIMO_SINTETICO),
  falhar: z.boolean(),
})

/**
 * O arquivo da thread: o `.js` compilado no container e o próprio `.ts` no teste, que o Node carrega sem build.
 * Nunca o BullMQ `useWorkerThreads`: ele poria o executor inteiro (estado no banco, vaga) dentro da thread, e
 * não tem teto de threads além da concorrência do pool.
 */
export const ARQUIVO_DO_SANDBOX = new URL(import.meta.url.endsWith('.ts') ? './sintetico.sandbox.ts' : './sintetico.sandbox.js', import.meta.url)

/** Memória de cada thread do sandbox. Ela só gira um laço: o teto impede uma thread de pesar no container. */
const MEMORIA_DA_THREAD_MB = 16

export interface QueimaDeCpu {
  queimar(cpuMs: number): Promise<void>
}

interface Pedido {
  cpuMs: number
  resolver: () => void
  rejeitar: (erro: FalhaDeJob) => void
}

/**
 * Sandbox de CPU do job sintético (15.0): no máximo `threadsMaximo` threads queimando CPU ao mesmo tempo, e o
 * resto na fila, por ordem de chegada. As threads nascem sob demanda e ficam para o pedido seguinte.
 *
 * É o que deixa o cenário de carga medir justiça entre escolas sem depender da máquina: o trabalho de CPU sai
 * do event loop (o lock de 10 s da fila interativa segue sendo renovado), e o teto casa com o `cpus:` fixo do
 * container em `infra/compose.carga.yml`, então o lote de uma réplica não disputa CPU além da dela.
 *
 * Thread que morre no meio (erro, memória) falha o job com `ERRO_INTERNO`, que vai para nova tentativa, e dá
 * lugar a outra. `encerrar` termina as threads e falha o que ainda esperava.
 */
export class SandboxDeCpu implements QueimaDeCpu {
  readonly #ociosas: Worker[] = []
  readonly #ocupadas = new Map<Worker, Pedido>()
  readonly #fila: Pedido[] = []
  #encerrado = false

  constructor(
    private readonly threadsMaximo: number,
    private readonly arquivo: URL = ARQUIVO_DO_SANDBOX,
  ) {
    if (!Number.isInteger(threadsMaximo) || threadsMaximo < 1) throw new Error('o sandbox de CPU precisa de pelo menos uma thread')
  }

  /** Threads existentes agora, ociosas ou não. Nunca passa de `threadsMaximo`. */
  get threads(): number {
    return this.#ociosas.length + this.#ocupadas.size
  }

  queimar(cpuMs: number): Promise<void> {
    if (this.#encerrado) return Promise.reject(new FalhaDeJob(CodigoDeFalhaDeJob.ERRO_INTERNO))
    if (cpuMs === 0) return Promise.resolve()
    return new Promise((resolver, rejeitar) => {
      this.#fila.push({ cpuMs, resolver, rejeitar })
      this.#distribuir()
    })
  }

  /** Termina as threads e falha o que estava esperando ou em andamento. Depois disso, todo pedido falha. */
  async encerrar(): Promise<void> {
    this.#encerrado = true
    for (const pedido of this.#fila.splice(0)) pedido.rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.ERRO_INTERNO))
    const threads = [...this.#ociosas.splice(0), ...this.#ocupadas.keys()]
    for (const pedido of this.#ocupadas.values()) pedido.rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.ERRO_INTERNO))
    this.#ocupadas.clear()
    await Promise.all(threads.map((thread) => thread.terminate()))
  }

  #distribuir(): void {
    while (this.#fila.length > 0) {
      const thread = this.#ociosas.pop() ?? (this.threads < this.threadsMaximo ? this.#criarThread() : undefined)
      if (thread === undefined) return
      const pedido = this.#fila.shift()
      if (pedido === undefined) {
        this.#ociosas.push(thread)
        return
      }
      this.#ocupadas.set(thread, pedido)
      thread.postMessage({ cpuMs: pedido.cpuMs })
    }
  }

  #criarThread(): Worker {
    const thread = new Worker(this.arquivo, { resourceLimits: { maxOldGenerationSizeMb: MEMORIA_DA_THREAD_MB } })
    // Ociosa, a thread não segura o processo: quem o mantém vivo é o worker do BullMQ.
    thread.unref()
    thread.on('message', (resposta: unknown) => {
      const pedido = this.#ocupadas.get(thread)
      if (pedido === undefined) return
      this.#ocupadas.delete(thread)
      if (resposta === 'pronto') pedido.resolver()
      else pedido.rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true))
      if (this.#encerrado) return
      this.#ociosas.push(thread)
      this.#distribuir()
    })
    const perder = (): void => {
      const pedido = this.#ocupadas.get(thread)
      this.#ocupadas.delete(thread)
      const ociosa = this.#ociosas.indexOf(thread)
      if (ociosa >= 0) this.#ociosas.splice(ociosa, 1)
      pedido?.rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.ERRO_INTERNO))
      if (!this.#encerrado) this.#distribuir()
    }
    // A mensagem do erro da thread não sai daqui: o código tipado basta, e ela nunca carrega dado de job.
    thread.on('error', perder)
    thread.on('exit', perder)
    return thread
  }
}

/**
 * Job sintético, para teste e carga: queima `cpuMs` de CPU no sandbox, fora do event loop, e falha se pedido.
 * Com `cpuMs` zero, nem chega a uma thread.
 */
export function criarProcessadorSintetico(cpu: QueimaDeCpu): Processador {
  return async (dados) => {
    const leitura = esquemaDados.safeParse(dados)
    if (!leitura.success) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
    await cpu.queimar(leitura.data.cpuMs)
    if (leitura.data.falhar) throw new FalhaDeJob(CodigoDeFalhaDeJob.FALHA_SINTETICA)
  }
}
