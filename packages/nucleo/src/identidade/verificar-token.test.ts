import { CodigoDeErro } from '@educa/shared'
import { SignJWT, UnsecuredJWT, type JWTPayload } from 'jose'
import { describe, expect, it } from 'vitest'
import { EMISSOR_TOKEN_SINTETICO, type ConfiguracaoIdentidade } from '../config/validar-config.js'
import { ErroDeDominio } from '../erro/erro-de-dominio.js'
import { extrairTokenBearer, VALIDADE_MAXIMA_TOKEN_SEGUNDOS, verificarToken } from './verificar-token.js'

const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
const USUARIO = '0190f5a0-0000-7000-8000-0000000000c1'
const codificar = (texto: string) => new TextEncoder().encode(texto)
const CHAVE = codificar('chave_sintetica_de_teste_com_32_caracteres')

const configAceitandoSintetico: ConfiguracaoIdentidade = {
  ambiente: 'local',
  chaveAssinatura: CHAVE,
  emissoresAceitos: [EMISSOR_TOKEN_SINTETICO],
}

const agora = () => Math.floor(Date.now() / 1000)

interface OpcoesDeToken {
  claims?: JWTPayload
  semClaims?: string[]
  chave?: Uint8Array
  alg?: string
  semTyp?: boolean
}

async function assinar(opcoes: OpcoesDeToken = {}): Promise<string> {
  const todas: JWTPayload = {
    esc: ESCOLA_A,
    sub: USUARIO,
    iss: EMISSOR_TOKEN_SINTETICO,
    iat: agora(),
    exp: agora() + 3600,
    ...opcoes.claims,
  }
  const claims = Object.fromEntries(Object.entries(todas).filter(([claim]) => !(opcoes.semClaims ?? []).includes(claim)))
  const cabecalho = { alg: opcoes.alg ?? 'HS256', ...(opcoes.semTyp === true ? {} : { typ: 'JWT' }) }
  return new SignJWT(claims).setProtectedHeader(cabecalho).sign(opcoes.chave ?? CHAVE)
}

async function recusa(token: string, config: ConfiguracaoIdentidade = configAceitandoSintetico): Promise<ErroDeDominio> {
  try {
    await verificarToken(token, config)
  } catch (erro) {
    if (erro instanceof ErroDeDominio) return erro
    throw erro
  }
  throw new Error('o token deveria ter sido recusado')
}

describe('verificarToken', () => {
  it('devolve a escola e o usuário do token válido', async () => {
    expect(await verificarToken(await assinar(), configAceitandoSintetico)).toEqual({ escolaId: ESCOLA_A, usuarioId: USUARIO })
  })

  it('devolve os ids em minúsculas: a mesma escola não vira outra chave por causa da caixa', async () => {
    const token = await assinar({ claims: { esc: ESCOLA_A.toUpperCase(), sub: USUARIO.toUpperCase() } })
    expect(await verificarToken(token, configAceitandoSintetico)).toEqual({ escolaId: ESCOLA_A, usuarioId: USUARIO })
  })

  it('aceita o token com a validade máxima de 24 horas pela frente', async () => {
    const token = await assinar({ claims: { exp: agora() + VALIDADE_MAXIMA_TOKEN_SEGUNDOS } })
    expect(await verificarToken(token, configAceitandoSintetico)).toEqual({ escolaId: ESCOLA_A, usuarioId: USUARIO })
  })

  it('com a flag desligada, recusa o token sintético mesmo com assinatura e prazo válidos', async () => {
    const erro = await recusa(await assinar(), { ...configAceitandoSintetico, emissoresAceitos: [] })
    expect(erro).toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO, status: 401 })
  })

  const recusados: Array<[string, () => Promise<string>]> = [
    ['assinatura com outra chave', () => assinar({ chave: codificar('outra_chave_sintetica_com_32_caracteres') })],
    ['validade além de 24 horas, mesmo com assinatura certa', () => assinar({ claims: { exp: agora() + VALIDADE_MAXIMA_TOKEN_SEGUNDOS + 120 } })],
    ['token vencido', () => assinar({ claims: { iat: agora() - 7200, exp: agora() - 60 } })],
    ['sem exp', () => assinar({ semClaims: ['exp'] })],
    ['sem esc', () => assinar({ semClaims: ['esc'] })],
    ['sem sub', () => assinar({ semClaims: ['sub'] })],
    ['sem iss', () => assinar({ semClaims: ['iss'] })],
    ['emissor não aceito', () => assinar({ claims: { iss: 'login-real' } })],
    ['esc fora do formato UUID', () => assinar({ claims: { esc: 'escola-a' } })],
    ['esc como número', () => assinar({ claims: { esc: 42 } })],
    ['sub fora do formato UUID', () => assinar({ claims: { sub: 'Enzo Martins' } })],
    ['nbf no futuro', () => assinar({ claims: { nbf: agora() + 600 } })],
    ['algoritmo HS512 com a mesma chave', () => assinar({ alg: 'HS512' })],
    ['sem typ', () => assinar({ semTyp: true })],
    ['alg none, sem assinatura', async () => new UnsecuredJWT({ esc: ESCOLA_A, sub: USUARIO, iss: EMISSOR_TOKEN_SINTETICO, exp: agora() + 3600 }).encode()],
    ['assinatura de um token colada no corpo de outro', async () => {
      const [cabecalho, , assinatura] = (await assinar()).split('.')
      const [, corpoDeOutraEscola] = (await assinar({ claims: { esc: '0190f5a0-0000-7000-8000-00000000000b' } })).split('.')
      return `${cabecalho}.${corpoDeOutraEscola}.${assinatura}`
    }],
    ['texto que não é JWT', async () => 'nao.e.jwt'],
  ]

  it.each(recusados)('recusa %s com NAO_AUTENTICADO 401', async (_caso, gerar) => {
    expect(await recusa(await gerar())).toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO, status: 401 })
  })
})

describe('extrairTokenBearer', () => {
  it('extrai o token do esquema Bearer, com o nome do esquema em qualquer caixa', () => {
    expect(extrairTokenBearer('Bearer aaa.bbb.ccc')).toBe('aaa.bbb.ccc')
    expect(extrairTokenBearer('bearer aaa.bbb.ccc')).toBe('aaa.bbb.ccc')
  })

  it.each([
    ['ausente', undefined],
    ['vazio', ''],
    ['outro esquema', 'Basic dXN1YXJpbzpzZW5oYQ=='],
    ['sem esquema', 'aaa.bbb.ccc'],
    ['duas partes', 'Bearer aaa.bbb'],
    ['texto depois do token', 'Bearer aaa.bbb.ccc extra'],
    ['repetido', ['Bearer aaa.bbb.ccc', 'Bearer ddd.eee.fff']],
  ])('recusa cabeçalho %s com NAO_AUTENTICADO', (_caso, cabecalho) => {
    expect(() => extrairTokenBearer(cabecalho)).toThrow(expect.objectContaining({ codigo: CodigoDeErro.NAO_AUTENTICADO }))
  })
})
