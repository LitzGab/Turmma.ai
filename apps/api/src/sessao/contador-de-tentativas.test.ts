import { ProporcaoEmJanela } from '@educa/nucleo'
import type { Redis } from 'ioredis'
import { describe, expect, it } from 'vitest'
import { ContadorDeTentativas, ESPERA_INICIAL_MS, ESPERA_MAXIMA_MS, esperaDaFalha, VALIDADE_DO_CONTADOR_MS } from './contador-de-tentativas.js'

const CHAVE = new TextEncoder().encode('chave-de-teste-do-contador-com-32-bytes')

/** Cliente do Redis que nunca ficou pronto: todo pedido vai ao seguro em memória, como com o Redis de fila fora. */
const redisFora = { status: 'end' } as unknown as Redis

function relogioParado(inicio = Date.parse('2026-09-21T07:30:00Z')) {
  let agora = inicio
  return { agora: () => new Date(agora), avancar: (ms: number) => (agora += ms) }
}

describe('esperaDaFalha: 5 falhas seguram por 30 s, e a espera dobra até 15 min', () => {
  it.each([
    [1, 0],
    [4, 0],
    [5, 30_000],
    [6, 60_000],
    [7, 120_000],
    [9, 480_000],
    [10, 900_000],
    [30, 900_000],
  ])('a falha %i espera %i ms', (falhas, espera) => {
    expect(esperaDaFalha(falhas)).toBe(espera)
  })

  it('as constantes são as da Tech Spec, seção 5', () => {
    expect([ESPERA_INICIAL_MS, ESPERA_MAXIMA_MS, VALIDADE_DO_CONTADOR_MS]).toEqual([30_000, 900_000, 900_000])
  })
})

describe('ContadorDeTentativas no seguro em memória (Redis de fila fora): a mesma regra', () => {
  it('borda: quatro falhas passam sem espera, a quinta segura 30 s, e a tentativa seguinte nem chega ao hash', async () => {
    const relogio = relogioParado()
    const contador = new ContadorDeTentativas(redisFora, CHAVE, relogio)
    const chave = contador.chaveDe('camila@escola.invalid', 'outro')
    for (let tentativa = 1; tentativa <= 4; tentativa++) expect(await contador.reservar(chave)).toEqual({ liberada: true, esperaSeFalharMs: 0 })
    expect(await contador.reservar(chave)).toEqual({ liberada: true, esperaSeFalharMs: 30_000 })
    relogio.avancar(10_000)
    expect(await contador.reservar(chave)).toEqual({ liberada: false, esperaMs: 20_000 })
  })

  it('borda: com o relógio 30 s adiante, a sexta falha segura 60 s, e a sétima 120 s', async () => {
    const relogio = relogioParado()
    const contador = new ContadorDeTentativas(redisFora, CHAVE, relogio)
    const chave = contador.chaveDe('camila@escola.invalid', 'outro')
    for (let tentativa = 1; tentativa <= 5; tentativa++) await contador.reservar(chave)
    relogio.avancar(30_000)
    expect(await contador.reservar(chave)).toEqual({ liberada: true, esperaSeFalharMs: 60_000 })
    relogio.avancar(59_999)
    expect(await contador.reservar(chave)).toEqual({ liberada: false, esperaMs: 1 })
    relogio.avancar(1)
    expect(await contador.reservar(chave)).toEqual({ liberada: true, esperaSeFalharMs: 120_000 })
  })

  it('o acerto zera: depois de zerar, outras quatro falhas não seguram', async () => {
    const contador = new ContadorDeTentativas(redisFora, CHAVE, relogioParado())
    const chave = contador.chaveDe('camila@escola.invalid', 'outro')
    for (let tentativa = 1; tentativa <= 4; tentativa++) await contador.reservar(chave)
    await contador.zerar(chave)
    for (let tentativa = 1; tentativa <= 4; tentativa++) expect(await contador.reservar(chave)).toEqual({ liberada: true, esperaSeFalharMs: 0 })
  })

  it('borda: 15 min sem falha nova, o contador vence e recomeça do zero', async () => {
    const relogio = relogioParado()
    const contador = new ContadorDeTentativas(redisFora, CHAVE, relogio)
    const chave = contador.chaveDe('camila@escola.invalid', 'outro')
    for (let tentativa = 1; tentativa <= 4; tentativa++) await contador.reservar(chave)
    relogio.avancar(VALIDADE_DO_CONTADOR_MS)
    expect(await contador.reservar(chave)).toEqual({ liberada: true, esperaSeFalharMs: 0 })
  })

  it('segurar o contador `outro` não segura o `conhecido` da mesma conta, nem o de outra conta', async () => {
    const contador = new ContadorDeTentativas(redisFora, CHAVE, relogioParado())
    const outro = contador.chaveDe('camila@escola.invalid', 'outro')
    for (let tentativa = 1; tentativa <= 5; tentativa++) await contador.reservar(outro)
    expect((await contador.reservar(outro)).liberada).toBe(false)
    expect((await contador.reservar(contador.chaveDe('camila@escola.invalid', 'conhecido'))).liberada).toBe(true)
    expect((await contador.reservar(contador.chaveDe('renata@escola.invalid', 'outro'))).liberada).toBe(true)
  })

  it('a proporção do seguro (limite.seguro_ativo) vai a 1 quando só o seguro conta', async () => {
    const contador = new ContadorDeTentativas(redisFora, CHAVE, relogioParado(), new ProporcaoEmJanela())
    expect(contador.proporcaoDoSeguro).toBe(0)
    await contador.reservar(contador.chaveDe('camila@escola.invalid', 'outro'))
    expect(contador.proporcaoDoSeguro).toBe(1)
  })

  it('privacidade: a chave leva o HMAC do e-mail, nunca o e-mail, e muda com a chave do ambiente e com a origem', () => {
    const contador = new ContadorDeTentativas(redisFora, CHAVE)
    const chave = contador.chaveDe('camila@escola.invalid', 'outro')
    expect(chave).toMatch(/^login:[\w-]{43}:outro$/)
    expect(chave).not.toContain('camila')
    expect(contador.chaveDe('camila@escola.invalid', 'conhecido')).toBe(chave.replace(':outro', ':conhecido'))
    const comOutraChave = new ContadorDeTentativas(redisFora, new TextEncoder().encode('outra-chave-de-teste-do-contador-32b'))
    expect(comOutraChave.chaveDe('camila@escola.invalid', 'outro')).not.toBe(chave)
  })
})
