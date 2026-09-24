import type { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import { SetMetadata } from '@nestjs/common'
import { AceitaDesafio, RotaAnonima } from '../limite/rota-anonima.decorator.js'
import { marcadorDeOperacao, METADADO_ENTRADA_DE_OPERACAO, METADADO_ROTA_DE_OPERACAO } from './marcadores-de-operacao.js'
import { bearerDeDesafio, rotaSemSessao } from './rota-sem-sessao.js'
import { TIPO_DESAFIO, TIPO_TOKEN } from './verificar-token.js'

const CHAVE = new TextEncoder().encode('chave-sintetica-de-teste-com-32-bytes!!')

class Rotas {
  @AceitaDesafio()
  aceitaDesafio(): void {}

  comum(): void {}

  @RotaAnonima()
  anonima(): void {}

  // Os marcadores da operação, pelas chaves que os decoradores de `apps/api/src/operacao/marcadores.ts` gravam.
  @SetMetadata(METADADO_ROTA_DE_OPERACAO, true)
  daOperacao(): void {}

  @SetMetadata(METADADO_ENTRADA_DE_OPERACAO, true)
  entradaDaOperacao(): void {}
}

/** Controller inteiro marcado na classe: o método herda o marcador. */
@SetMetadata(METADADO_ROTA_DE_OPERACAO, true)
class RotasDaOperacao {
  qualquer(): void {}
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

  it('rota da operação, no método ou na classe, e entrada da operação: sem sessão de escola, com ou sem bearer de escola', async () => {
    expect(rotaSemSessao(reflector, execucao('daOperacao'))).toBe(true)
    expect(rotaSemSessao(reflector, execucao('daOperacao', `Bearer ${await jwt(TIPO_TOKEN)}`))).toBe(true)
    expect(rotaSemSessao(reflector, execucao('entradaDaOperacao', `Bearer ${await jwt(TIPO_TOKEN)}`))).toBe(true)
    const naClasse = { getHandler: () => RotasDaOperacao.prototype.qualquer, getClass: () => RotasDaOperacao, getType: () => 'http' } as unknown as ExecutionContext
    expect(rotaSemSessao(reflector, naClasse)).toBe(true)
    expect(marcadorDeOperacao(reflector, naClasse)).toBe('rota')
  })

  it('marcadorDeOperacao separa a rota da entrada, e a rota da escola não tem marcador', () => {
    expect(marcadorDeOperacao(reflector, execucao('daOperacao'))).toBe('rota')
    expect(marcadorDeOperacao(reflector, execucao('entradaDaOperacao'))).toBe('entrada')
    expect(marcadorDeOperacao(reflector, execucao('comum'))).toBeUndefined()
    expect(marcadorDeOperacao(reflector, execucao('anonima'))).toBeUndefined()
  })

  it('bearerDeDesafio só lê o typ do cabeçalho do JWT, sem verificar a assinatura', async () => {
    const outraChave = await new SignJWT({}).setProtectedHeader({ alg: 'HS256', typ: TIPO_DESAFIO }).sign(new TextEncoder().encode('outra-chave-sintetica-com-32-bytes!!!'))
    expect(bearerDeDesafio(`Bearer ${outraChave}`)).toBe(true)
    expect(bearerDeDesafio(['Bearer a.b.c'])).toBe(false)
    expect(bearerDeDesafio(undefined)).toBe(false)
  })
})
