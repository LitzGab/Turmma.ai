import { CodigoDeFalhaDeJob } from '@educa/shared'
import { afterEach, describe, expect, it } from 'vitest'
import { FalhaDeJob } from '../falha-de-job.js'
import { criarProcessadorSintetico, SandboxDeCpu } from './sintetico.js'

const abertos: SandboxDeCpu[] = []

function sandbox(threadsMaximo: number, arquivo?: URL): SandboxDeCpu {
  const criado = arquivo === undefined ? new SandboxDeCpu(threadsMaximo) : new SandboxDeCpu(threadsMaximo, arquivo)
  abertos.push(criado)
  return criado
}

afterEach(async () => {
  await Promise.all(abertos.splice(0).map((aberto) => aberto.encerrar()))
})

const codigoDe = async (promessa: Promise<unknown>): Promise<string | undefined> => {
  try {
    await promessa
    return undefined
  } catch (erro) {
    return erro instanceof FalhaDeJob ? erro.codigo : 'outro erro'
  }
}

describe('SandboxDeCpu: o job sintético queima CPU de verdade, fora do event loop', () => {
  it('queima pelo menos o cpuMs pedido de CPU do processo, e não só espera o relógio', async () => {
    const cpu = sandbox(1)
    await cpu.queimar(1) // a primeira thread nasce fora da medição
    const antes = process.cpuUsage()
    const inicio = performance.now()
    await cpu.queimar(300)
    const gasto = process.cpuUsage(antes)
    expect((gasto.user + gasto.system) / 1_000).toBeGreaterThanOrEqual(300)
    expect(performance.now() - inicio).toBeGreaterThanOrEqual(290)
  })

  it('o event loop segue girando enquanto a thread queima: o worker renova lock e vaga no meio do job', async () => {
    const cpu = sandbox(1)
    let voltas = 0
    const relogio = setInterval(() => voltas++, 20)
    const inicio = performance.now()
    await cpu.queimar(500)
    clearInterval(relogio)
    // Com o laço preso, nenhuma volta aconteceria antes do fim.
    expect(voltas).toBeGreaterThanOrEqual(Math.floor((performance.now() - inicio) / 20 / 3))
    expect(voltas).toBeGreaterThanOrEqual(5)
  })

  it('nunca passa de threadsMaximo: o pedido a mais espera a vez, e a CPU fica no teto do container', async () => {
    const cpu = sandbox(2)
    let maximoVisto = 0
    const amostra = setInterval(() => (maximoVisto = Math.max(maximoVisto, cpu.threads)), 5)
    const inicio = performance.now()
    const terminos: number[] = []
    await Promise.all([0, 1, 2, 3].map(async (indice) => {
      await cpu.queimar(200)
      terminos[indice] = performance.now() - inicio
    }))
    clearInterval(amostra)
    expect(maximoVisto).toBe(2)
    expect(cpu.threads).toBe(2)
    // Duas threads e quatro pedidos de 200 ms de CPU: o terceiro e o quarto só começam depois de um dos dois primeiros.
    expect(Math.max(...terminos)).toBeGreaterThanOrEqual(390)
  })

  it('cpuMs zero não ocupa thread nenhuma', async () => {
    const cpu = sandbox(1)
    await cpu.queimar(0)
    expect(cpu.threads).toBe(0)
  })

  it('thread que morre no meio falha só aquele job, com ERRO_INTERNO (nova tentativa), e dá lugar a outra', async () => {
    const quebrada = new URL('data:text/javascript,import { parentPort } from "node:worker_threads"; parentPort.on("message", () => process.exit(3))')
    const cpu = sandbox(1, quebrada)
    expect(await codigoDe(cpu.queimar(50))).toBe(CodigoDeFalhaDeJob.ERRO_INTERNO)
    expect(await codigoDe(cpu.queimar(50))).toBe(CodigoDeFalhaDeJob.ERRO_INTERNO)
    const erro = await cpu.queimar(50).catch((falha: unknown) => falha)
    expect(erro).toBeInstanceOf(FalhaDeJob)
    expect((erro as FalhaDeJob).definitiva).toBe(false)
    expect(cpu.threads).toBe(0)
  })

  it('encerrar falha o que está em andamento e na fila, termina as threads, e recusa pedido novo', async () => {
    const cpu = sandbox(1)
    const emAndamento = codigoDe(cpu.queimar(5_000))
    const naFila = codigoDe(cpu.queimar(5_000))
    await new Promise((resolver) => setTimeout(resolver, 50))
    const inicio = performance.now()
    await cpu.encerrar()
    expect(await emAndamento).toBe(CodigoDeFalhaDeJob.ERRO_INTERNO)
    expect(await naFila).toBe(CodigoDeFalhaDeJob.ERRO_INTERNO)
    expect(performance.now() - inicio).toBeLessThan(2_000)
    expect(cpu.threads).toBe(0)
    expect(await codigoDe(cpu.queimar(10))).toBe(CodigoDeFalhaDeJob.ERRO_INTERNO)
  })

  it('recusa teto de threads que não é inteiro positivo', () => {
    expect(() => new SandboxDeCpu(0)).toThrow()
    expect(() => new SandboxDeCpu(1.5)).toThrow()
  })
})

describe('processador sintético', () => {
  it('dados inválidos falham na hora, definitivos, sem ocupar thread', async () => {
    const cpu = sandbox(1)
    const processar = criarProcessadorSintetico(cpu)
    const erro = await processar({ cpuMs: -1, falhar: false }).catch((falha: unknown) => falha)
    expect(erro).toBeInstanceOf(FalhaDeJob)
    expect(erro).toMatchObject({ codigo: CodigoDeFalhaDeJob.DADOS_INVALIDOS, definitiva: true })
    expect(cpu.threads).toBe(0)
  })

  it('queima a CPU no sandbox e só então falha, quando pedido', async () => {
    const pedidos: number[] = []
    const processar = criarProcessadorSintetico({ queimar: async (cpuMs) => void pedidos.push(cpuMs) })
    await expect(processar({ cpuMs: 120, falhar: false })).resolves.toBeUndefined()
    expect(await codigoDe(processar({ cpuMs: 80, falhar: true }))).toBe(CodigoDeFalhaDeJob.FALHA_SINTETICA)
    expect(pedidos).toEqual([120, 80])
  })
})
