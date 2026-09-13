import 'reflect-metadata'
import { METRICAS } from '@educa/nucleo'
import type { Socket as SocketCliente } from 'socket.io-client'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MedidorDeTeste } from '../../../tools/testes/metricas.ts'
import { conectar, criarCliente, ESCOLA_A, ESCOLA_B, loggerEmMemoria, subirInstancia, tokenDe, type InstanciaDeTeste } from './realtime-de-teste.js'

// Uma instância do realtime montada como no boot, com o Redis de fila do compose de teste, lendo as métricas
// que ela exportaria.

describe('métricas do realtime', () => {
  const medidor = new MedidorDeTeste()
  let instancia: InstanciaDeTeste
  const clientes: SocketCliente[] = []

  beforeAll(async () => {
    instancia = await subirInstancia(loggerEmMemoria().logger, {}, medidor.medidor)
  })

  afterAll(async () => {
    for (const cliente of clientes) cliente.disconnect()
    await instancia.app.close()
    await medidor.encerrar()
  })

  const valores = async (nome: string) => (await medidor.pontos(nome)).map(({ atributos, valor }) => ({ atributos, valor }))

  it('realtime.conexoes acompanha os clientes abertos nesta instância, sem rótulo de escola, sala ou usuário', async () => {
    expect(await valores(METRICAS.conexoesRealtime)).toEqual([{ atributos: {}, valor: 0 }])
    for (const [escolaId, usuarioId] of [[ESCOLA_A, '0190f5a0-0000-7000-8000-0000000000a1'], [ESCOLA_B, '0190f5a0-0000-7000-8000-0000000000b1']] as const) {
      const cliente = criarCliente(instancia.url, await tokenDe(escolaId, usuarioId))
      clientes.push(cliente)
      await conectar(cliente)
    }
    expect(await valores(METRICAS.conexoesRealtime)).toEqual([{ atributos: {}, valor: 2 }])

    clientes[0]?.disconnect()
    await expect.poll(async () => (await valores(METRICAS.conexoesRealtime))[0]?.valor, { timeout: 5_000, interval: 50 }).toBe(1)
  })

  it('o Redis de fila do adaptador aparece disponível, e a prontidão é medida pela rota template', async () => {
    expect(await valores(METRICAS.redisDisponivel)).toEqual([{ atributos: { instancia: 'fila' }, valor: 1 }])
    expect((await fetch(`${instancia.url}/prontidao`)).status).toBe(200)
    await expect
      .poll(async () => (await medidor.pontos(METRICAS.duracaoHttp)).map(({ atributos }) => atributos['http.route']), { timeout: 5_000, interval: 50 })
      .toContain('/prontidao')
  })
})
