import { criarClienteRedisDaApi, ErroDeDominio } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import type { Redis } from 'ioredis'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../../tools/ci/compose.ts'
import { ConsumoDeDesafio, EmissorDeDesafio, PREFIXO_DESAFIO_USADO, verificarDesafio } from './desafio.js'

const CHAVE = new TextEncoder().encode('chave-de-teste-da-assinatura-com-32-bytes')
const CONTA = '0190f5a0-0000-7000-8000-0000000000c1'

async function pronto(cliente: Redis): Promise<void> {
  const prazo = performance.now() + 10_000
  while (cliente.status !== 'ready') {
    if (performance.now() > prazo) throw new Error('o Redis de fila de teste não conectou')
    await new Promise((resolver) => setTimeout(resolver, 20))
  }
}

describe('ConsumoDeDesafio: o jti vale uma vez só, no Redis de fila', () => {
  let cliente: Redis

  beforeAll(async () => {
    cliente = criarClienteRedisDaApi(`redis://127.0.0.1:${valorObrigatorio(lerAmbienteDeTeste(), 'REDIS_FILA_PORTA_HOST')}`, 'teste-desafio', () => undefined)
    await pronto(cliente)
  })

  afterAll(() => {
    cliente.disconnect()
  })

  it('concorrência: duas conclusões da mesma etapa ao mesmo tempo, com o mesmo desafio, passam uma vez só', async () => {
    const desafio = await verificarDesafio(await new EmissorDeDesafio(CHAVE).emitir({ contaId: CONTA, etapa: 'mfa', mfaCumprido: false }), CHAVE, ['mfa'])
    const consumo = new ConsumoDeDesafio(cliente)
    const resultados = await Promise.allSettled([consumo.consumir(desafio), consumo.consumir(desafio)])
    expect(resultados.filter((resultado) => resultado.status === 'fulfilled')).toHaveLength(1)
    const [recusa] = resultados.flatMap((resultado) => (resultado.status === 'rejected' ? [resultado.reason as unknown] : []))
    expect(recusa).toBeInstanceOf(ErroDeDominio)
    expect(recusa).toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO })
    // A marca vence com o desafio: não fica no Redis depois de 5 min.
    const vida = await cliente.pttl(`${PREFIXO_DESAFIO_USADO}${desafio.jti}`)
    expect(vida).toBeGreaterThan(0)
    expect(vida).toBeLessThanOrEqual(5 * 60_000)
  })

  it('falha: com o Redis de fila fora, o desafio é recusado, e não aceito sem marca', async () => {
    const fora = criarClienteRedisDaApi('redis://127.0.0.1:9', 'teste-desafio-fora', () => undefined)
    try {
      const desafio = await verificarDesafio(await new EmissorDeDesafio(CHAVE).emitir({ contaId: CONTA, etapa: 'escolher', mfaCumprido: false }), CHAVE, ['escolher'])
      await expect(new ConsumoDeDesafio(fora).consumir(desafio)).rejects.toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO })
    } finally {
      fora.disconnect()
    }
  })
})
