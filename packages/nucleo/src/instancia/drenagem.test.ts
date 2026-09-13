import { Logger } from '@nestjs/common'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfiguracaoInvalida } from '../config/validar-config.js'
import { Drenagem, lerConfiguracaoDrenagem } from './drenagem.js'

const config = { esperaDaBordaMs: 4_000, prazoMs: 10_000 }

describe('Drenagem', () => {
  beforeAll(() => {
    Logger.overrideLogger(false)
  })

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pronta até o SIGTERM; a partir dele a prontidão é 503 na hora, antes de a espera da borda acabar', async () => {
    const drenagem = new Drenagem(config, () => undefined)
    expect(drenagem.prontidao()).toEqual({ status: 200, corpo: { pronta: true } })

    let esperaAcabou = false
    const antesDeFechar = drenagem.beforeApplicationShutdown().then(() => {
      esperaAcabou = true
    })
    expect(drenagem.prontidao()).toEqual({ status: 503, corpo: { pronta: false } })

    await vi.advanceTimersByTimeAsync(config.esperaDaBordaMs - 1)
    expect(esperaAcabou).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await antesDeFechar
    expect(esperaAcabou).toBe(true)
    expect(drenagem.prontidao().status).toBe(503)
  })

  it('sai com código 1 quando o fechamento passa do prazo, com requisição ainda presa', async () => {
    const encerrar = vi.fn<(codigo: number) => void>()
    const drenagem = new Drenagem(config, encerrar)
    const antesDeFechar = drenagem.beforeApplicationShutdown()
    await vi.advanceTimersByTimeAsync(config.esperaDaBordaMs)
    await antesDeFechar

    // O servidor ainda não fechou: nenhum `onApplicationShutdown` chegou.
    await vi.advanceTimersByTimeAsync(config.prazoMs - config.esperaDaBordaMs - 1)
    expect(encerrar).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(encerrar).toHaveBeenCalledExactlyOnceWith(1)
  })

  it('não força a saída quando tudo fechou dentro do prazo', async () => {
    const encerrar = vi.fn<(codigo: number) => void>()
    const drenagem = new Drenagem(config, encerrar)
    const antesDeFechar = drenagem.beforeApplicationShutdown()
    await vi.advanceTimersByTimeAsync(config.esperaDaBordaMs)
    await antesDeFechar
    drenagem.onApplicationShutdown()

    await vi.advanceTimersByTimeAsync(config.prazoMs * 2)
    expect(encerrar).not.toHaveBeenCalled()
  })

  it('um segundo sinal durante a drenagem não reinicia a espera nem o prazo', async () => {
    const encerrar = vi.fn<(codigo: number) => void>()
    const drenagem = new Drenagem(config, encerrar)
    void drenagem.beforeApplicationShutdown()
    await vi.advanceTimersByTimeAsync(3_000)
    await drenagem.beforeApplicationShutdown()

    await vi.advanceTimersByTimeAsync(config.prazoMs - 3_000)
    expect(encerrar).toHaveBeenCalledExactlyOnceWith(1)
  })
})

describe('lerConfiguracaoDrenagem', () => {
  it('lê espera e prazo do ambiente', () => {
    expect(lerConfiguracaoDrenagem({ DRENAGEM_ESPERA_BORDA_MS: '4000', DRENAGEM_PRAZO_MS: '10000' })).toEqual(config)
  })

  it.each([
    ['sem espera', { DRENAGEM_PRAZO_MS: '10000' }, ['DRENAGEM_ESPERA_BORDA_MS']],
    ['sem prazo', { DRENAGEM_ESPERA_BORDA_MS: '4000' }, ['DRENAGEM_PRAZO_MS']],
    ['espera igual ao prazo', { DRENAGEM_ESPERA_BORDA_MS: '10000', DRENAGEM_PRAZO_MS: '10000' }, ['DRENAGEM_ESPERA_BORDA_MS']],
    ['espera zero', { DRENAGEM_ESPERA_BORDA_MS: '0', DRENAGEM_PRAZO_MS: '10000' }, ['DRENAGEM_ESPERA_BORDA_MS']],
  ])('recusa %s', (_caso, ambiente, variaveis) => {
    expect(() => lerConfiguracaoDrenagem(ambiente)).toThrow(ConfiguracaoInvalida)
    try {
      lerConfiguracaoDrenagem(ambiente)
    } catch (erro) {
      expect((erro as ConfiguracaoInvalida).variaveis).toEqual(variaveis)
    }
  })
})
