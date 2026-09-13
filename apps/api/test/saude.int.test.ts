import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import request from 'supertest'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../tools/ci/compose.ts'
import { aguardarSaudavel, compose, composeOuFalha } from '../../../tools/testes/compose.ts'
import { AppModule } from '../src/app.module.js'

const TIMEOUT_CONSULTA_MS = 1_000

function configuracaoDeTeste() {
  const ambiente = lerAmbienteDeTeste()
  const usuario = valorObrigatorio(ambiente, 'POSTGRES_USUARIO')
  const senha = valorObrigatorio(ambiente, 'POSTGRES_SENHA')
  const banco = valorObrigatorio(ambiente, 'POSTGRES_BANCO')
  const porta = valorObrigatorio(ambiente, 'POSTGRES_PORTA_HOST')
  return {
    porta: 0,
    banco: {
      url: `postgres://${usuario}:${senha}@127.0.0.1:${porta}/${banco}`,
      maximoConexoes: 2,
      timeoutConexaoMs: TIMEOUT_CONSULTA_MS,
      timeoutConsultaMs: TIMEOUT_CONSULTA_MS,
    },
  }
}

async function religarPostgres(): Promise<void> {
  compose('unpause', 'postgres')
  composeOuFalha('start', 'postgres')
  await aguardarSaudavel('postgres')
}

describe('GET /saude', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await NestFactory.create(AppModule.com(configuracaoDeTeste()), { logger: false })
    await app.init()
  })

  afterEach(async () => {
    await religarPostgres()
  })

  afterAll(async () => {
    await religarPostgres()
    await app.close()
  })

  it('responde 200 com { ok: true } quando o Postgres responde', async () => {
    const resposta = await request(app.getHttpServer()).get('/saude')
    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ ok: true })
    expect(resposta.headers['cache-control']).toBe('no-store')
  })

  it('responde 503 com o Postgres parado, e volta a 200 quando ele volta, sem derrubar a API', async () => {
    // Conexão ociosa no pool antes da queda: é ela que o Postgres derruba ao parar.
    expect((await request(app.getHttpServer()).get('/saude')).status).toBe(200)

    composeOuFalha('stop', 'postgres')
    const indisponivel = await request(app.getHttpServer()).get('/saude')
    expect(indisponivel.status).toBe(503)
    expect(indisponivel.body).toEqual({ ok: false })

    await religarPostgres()
    const recuperada = await request(app.getHttpServer()).get('/saude')
    expect(recuperada.status).toBe(200)
    expect(recuperada.body).toEqual({ ok: true })
  })

  it('responde 503 dentro do timeout quando o Postgres trava, em vez de pendurar a requisição', async () => {
    expect((await request(app.getHttpServer()).get('/saude')).status).toBe(200)

    composeOuFalha('pause', 'postgres')
    const inicio = performance.now()
    const resposta = await request(app.getHttpServer()).get('/saude')
    const duracaoMs = performance.now() - inicio

    expect(resposta.status).toBe(503)
    expect(duracaoMs).toBeLessThan(TIMEOUT_CONSULTA_MS * 2 + 1_000)
  })
})
