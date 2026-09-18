import { criarClienteRedisDaApi } from '@educa/nucleo'
import type { Redis } from 'ioredis'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../../tools/ci/compose.ts'
import { ContadorDeTentativas, FALHAS_ANTES_DE_SEGURAR, VALIDADE_DO_CONTADOR_MS } from './contador-de-tentativas.js'

const CHAVE = new TextEncoder().encode('chave-de-teste-do-contador-com-32-bytes')

function relogioParado(inicio = Date.parse('2026-09-21T07:30:00Z')) {
  let agora = inicio
  return { agora: () => new Date(agora), avancar: (ms: number) => (agora += ms) }
}

async function pronto(cliente: Redis): Promise<void> {
  const prazo = performance.now() + 10_000
  while (cliente.status !== 'ready') {
    if (performance.now() > prazo) throw new Error('o Redis de fila de teste não conectou')
    await new Promise((resolver) => setTimeout(resolver, 20))
  }
}

describe('ContadorDeTentativas no Redis de fila', () => {
  let cliente: Redis

  beforeAll(async () => {
    cliente = criarClienteRedisDaApi(`redis://127.0.0.1:${valorObrigatorio(lerAmbienteDeTeste(), 'REDIS_FILA_PORTA_HOST')}`, 'teste-contador', () => undefined)
    await pronto(cliente)
  })

  afterAll(() => {
    cliente.disconnect()
  })

  const emailNovo = () => `teste-${randomUUID()}@escola.invalid`

  it('borda: a quinta falha segura 30 s; com o relógio 30 s adiante, a sexta segura 60 s; e o Redis nunca vê o e-mail', async () => {
    const relogio = relogioParado()
    const contador = new ContadorDeTentativas(cliente, CHAVE, relogio)
    const email = emailNovo()
    const chave = contador.chaveDe(email, 'outro')
    for (let tentativa = 1; tentativa < FALHAS_ANTES_DE_SEGURAR; tentativa++) expect(await contador.reservar(chave)).toEqual({ liberada: true, esperaSeFalharMs: 0 })
    expect(await contador.reservar(chave)).toEqual({ liberada: true, esperaSeFalharMs: 30_000 })
    expect(await contador.reservar(chave)).toEqual({ liberada: false, esperaMs: 30_000 })
    relogio.avancar(30_000)
    expect(await contador.reservar(chave)).toEqual({ liberada: true, esperaSeFalharMs: 60_000 })
    relogio.avancar(59_000)
    expect(await contador.reservar(chave)).toEqual({ liberada: false, esperaMs: 1_000 })
    expect(contador.proporcaoDoSeguro).toBe(0)
    // Só o HMAC, e o contador vive a retenção do docs/lgpd.md (15 min), não para sempre.
    expect(await cliente.keys(`*${email}*`)).toEqual([])
    const vida = await cliente.pttl(chave)
    expect(vida).toBeGreaterThan(VALIDADE_DO_CONTADOR_MS - 5_000)
    expect(vida).toBeLessThanOrEqual(VALIDADE_DO_CONTADOR_MS)
  })

  it('borda: a espera para em 15 min, por mais falhas que venham', async () => {
    const relogio = relogioParado()
    const contador = new ContadorDeTentativas(cliente, CHAVE, relogio)
    const chave = contador.chaveDe(emailNovo(), 'outro')
    let ultima = 0
    for (let tentativa = 1; tentativa <= 12; tentativa++) {
      const reserva = await contador.reservar(chave)
      if (!reserva.liberada) throw new Error('reserva recusada fora da espera')
      ultima = reserva.esperaSeFalharMs
      relogio.avancar(ultima)
    }
    expect(ultima).toBe(15 * 60_000)
  })

  it('concorrência: dez reservas ao mesmo tempo liberam exatamente cinco; as outras cinco já encontram a conta segurada', async () => {
    const contador = new ContadorDeTentativas(cliente, CHAVE)
    const chave = contador.chaveDe(emailNovo(), 'outro')
    const reservas = await Promise.all(Array.from({ length: 10 }, () => contador.reservar(chave)))
    expect(reservas.filter((reserva) => reserva.liberada)).toHaveLength(FALHAS_ANTES_DE_SEGURAR)
    expect(reservas.filter((reserva) => !reserva.liberada)).toHaveLength(10 - FALHAS_ANTES_DE_SEGURAR)
  })

  it('o acerto zera só aquele contador: o `outro` segurado continua segurado quando o `conhecido` zera', async () => {
    const contador = new ContadorDeTentativas(cliente, CHAVE)
    const email = emailNovo()
    const outro = contador.chaveDe(email, 'outro')
    const conhecido = contador.chaveDe(email, 'conhecido')
    for (let tentativa = 1; tentativa <= FALHAS_ANTES_DE_SEGURAR; tentativa++) await contador.reservar(outro)
    for (let tentativa = 1; tentativa < FALHAS_ANTES_DE_SEGURAR; tentativa++) await contador.reservar(conhecido)
    await contador.zerar(conhecido)
    expect(await cliente.exists(conhecido)).toBe(0)
    expect((await contador.reservar(outro)).liberada).toBe(false)
    for (let tentativa = 1; tentativa < FALHAS_ANTES_DE_SEGURAR; tentativa++) expect(await contador.reservar(conhecido)).toEqual({ liberada: true, esperaSeFalharMs: 0 })
  })
})
