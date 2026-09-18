import type { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import { AceitaDesafio, RotaAnonima } from '../limite/rota-anonima.decorator.js'
import { bearerDeDesafio, rotaSemSessao } from './rota-sem-sessao.js'
import { TIPO_DESAFIO, TIPO_TOKEN } from './verificar-token.js'

const CHAVE = new TextEncoder().encode('chave-sintetica-de-teste-com-32-bytes!!')

class Rotas {
  @AceitaDesafio()
  aceitaDesafio(): void {}

  comum(): void {}

  @RotaAnonima()
  anonima(): void {}
}

function execucao(metodo: keyof Rotas, authorization?: string, tipo = 'http'): ExecutionContext {
  const requisicao = { headers: authorization === undefined ? {} : { authorization } }
  return {
    getHandler: () => Rotas.prototype[metodo],
    getClass: () => Rotas,
    getType: () => tipo,
    switchToHttp: () => ({ getRequest: () => requisicao }),
  } as unknown as ExecutionContext
}

async function jwt(typ: string): Promise<string> {
  return new SignJWT({ sub: 'x' }).setProtectedHeader({ alg: 'HS256', typ }).setIssuedAt().setExpirationTime('5m').sign(CHAVE)
}

describe('rotaSemSessao: quando as guardas tratam a requisição como anônima', () => {
  const reflector = new Reflector()

  it('rota @AceitaDesafio com desafio no Authorization: anônima para as guardas', async () => {
    expect(rotaSemSessao(reflector, execucao('aceitaDesafio', `Bearer ${await jwt(TIPO_DESAFIO)}`))).toBe(true)
  })

  it('rota @AceitaDesafio com token de acesso, sem bearer ou com bearer que não é JWT: segue o caminho autenticado', async () => {
    expect(rotaSemSessao(reflector, execucao('aceitaDesafio', `Bearer ${await jwt(TIPO_TOKEN)}`))).toBe(false)
    expect(rotaSemSessao(reflector, execucao('aceitaDesafio'))).toBe(false)
    expect(rotaSemSessao(reflector, execucao('aceitaDesafio', 'Bearer nao-e-jwt'))).toBe(false)
    expect(rotaSemSessao(reflector, execucao('aceitaDesafio', `Basic ${await jwt(TIPO_DESAFIO)}`))).toBe(false)
  })

  it('rota sem @AceitaDesafio com desafio no Authorization: não vira anônima, e a autenticação o recusa', async () => {
    expect(rotaSemSessao(reflector, execucao('comum', `Bearer ${await jwt(TIPO_DESAFIO)}`))).toBe(false)
  })

  it('execução que não é HTTP nunca vira anônima pelo desafio', async () => {
    expect(rotaSemSessao(reflector, execucao('aceitaDesafio', `Bearer ${await jwt(TIPO_DESAFIO)}`, 'ws'))).toBe(false)
  })

  it('rota @RotaAnonima continua anônima, com ou sem token', () => {
    expect(rotaSemSessao(reflector, execucao('anonima'))).toBe(true)
  })

  it('bearerDeDesafio só lê o typ do cabeçalho do JWT, sem verificar a assinatura', async () => {
    const outraChave = await new SignJWT({}).setProtectedHeader({ alg: 'HS256', typ: TIPO_DESAFIO }).sign(new TextEncoder().encode('outra-chave-sintetica-com-32-bytes!!!'))
    expect(bearerDeDesafio(`Bearer ${outraChave}`)).toBe(true)
    expect(bearerDeDesafio(['Bearer a.b.c'])).toBe(false)
    expect(bearerDeDesafio(undefined)).toBe(false)
  })
})
