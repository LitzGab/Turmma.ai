import { EMISSOR_TOKEN, ErroDeDominio, TIPO_DESAFIO_DE_OPERADOR, verificarToken, verificarTokenDeOperador } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { decodeJwt, decodeProtectedHeader, SignJWT, type JWTPayload } from 'jose'
import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { EmissorDeDesafio, verificarDesafio } from '../sessao/desafio.js'
import { AUDIENCIA_DESAFIO_DE_OPERADOR, EmissorDeDesafioDeOperador, VALIDADE_DESAFIO_DE_OPERADOR_SEGUNDOS, verificarDesafioDeOperador } from './desafio-de-operador.js'

const OPERADOR = '0190f5a0-0000-7000-8000-0000000000e1'
const CHAVE = new TextEncoder().encode('chave_sintetica_de_teste_com_32_caracteres')
const OUTRA_CHAVE = new TextEncoder().encode('outra_chave_sintetica_com_32_caracteres')
const agora = () => Math.floor(Date.now() / 1_000)

async function recusa(promessa: Promise<unknown>): Promise<ErroDeDominio> {
  try {
    await promessa
  } catch (erro) {
    if (erro instanceof ErroDeDominio) return erro
    throw erro
  }
  throw new Error('o desafio deveria ter sido recusado')
}

/** Um desafio de operador assinado à mão, com um campo trocado de cada vez. */
async function assinar(opcoes: { claims?: JWTPayload; semClaims?: string[]; typ?: string; chave?: Uint8Array } = {}): Promise<string> {
  const todas: JWTPayload = { sub: OPERADOR, etapa: 'configurar_mfa', jti: randomUUID(), iss: EMISSOR_TOKEN, aud: AUDIENCIA_DESAFIO_DE_OPERADOR, iat: agora(), exp: agora() + 300, ...opcoes.claims }
  const claims = Object.fromEntries(Object.entries(todas).filter(([claim]) => !(opcoes.semClaims ?? []).includes(claim)))
  return new SignJWT(claims).setProtectedHeader({ alg: 'HS256', typ: opcoes.typ ?? TIPO_DESAFIO_DE_OPERADOR }).sign(opcoes.chave ?? CHAVE)
}

describe('desafio do operador (tarefa 5.0)', () => {
  it('leva só o operador, a etapa e o jti, com typ e audiência próprios e 5 min de validade', async () => {
    const desafio = await new EmissorDeDesafioDeOperador(CHAVE).emitir({ operadorId: OPERADOR, etapa: 'configurar_mfa' })
    expect(decodeProtectedHeader(desafio)).toEqual({ alg: 'HS256', typ: TIPO_DESAFIO_DE_OPERADOR })
    const claims = decodeJwt(desafio)
    expect(Object.keys(claims).sort()).toEqual(['aud', 'etapa', 'exp', 'iat', 'iss', 'jti', 'sub'])
    expect(claims).toMatchObject({ sub: OPERADOR, etapa: 'configurar_mfa', aud: AUDIENCIA_DESAFIO_DE_OPERADOR, iss: EMISSOR_TOKEN })
    expect((claims.exp ?? 0) - (claims.iat ?? 0)).toBe(VALIDADE_DESAFIO_DE_OPERADOR_SEGUNDOS)
    const verificado = await verificarDesafioDeOperador(desafio, CHAVE, 'configurar_mfa')
    expect(verificado).toMatchObject({ operadorId: OPERADOR, etapa: 'configurar_mfa', jti: claims.jti })
  })

  it('cada emissão tem um jti novo', async () => {
    const emissor = new EmissorDeDesafioDeOperador(CHAVE)
    const [um, outro] = await Promise.all([emissor.emitir({ operadorId: OPERADOR, etapa: 'mfa' }), emissor.emitir({ operadorId: OPERADOR, etapa: 'mfa' })])
    expect(decodeJwt(um).jti).not.toBe(decodeJwt(outro).jti)
  })

  it('recusa, sempre com NAO_AUTENTICADO: outra etapa, outro typ, outra audiência, outro emissor, outra chave, vencido e sem jti', async () => {
    const recusados = {
      outraEtapa: await new EmissorDeDesafioDeOperador(CHAVE).emitir({ operadorId: OPERADOR, etapa: 'mfa' }),
      typDaEscola: await assinar({ typ: 'desafio+jwt' }),
      typDeAcesso: await assinar({ typ: 'operador+jwt' }),
      audDaEscola: await assinar({ claims: { aud: 'sessao' } }),
      outroEmissor: await assinar({ claims: { iss: 'outro' } }),
      outraChave: await assinar({ chave: OUTRA_CHAVE }),
      vencido: await assinar({ claims: { iat: agora() - 400, exp: agora() - 100 } }),
      semJti: await assinar({ semClaims: ['jti'] }),
      semSub: await assinar({ semClaims: ['sub'] }),
      etapaDesconhecida: await assinar({ claims: { etapa: 'escolher' } }),
    }
    // O desafio certo, com a mesma montagem, passa: a recusa vem do campo trocado.
    await expect(verificarDesafioDeOperador(await assinar(), CHAVE, 'configurar_mfa')).resolves.toMatchObject({ operadorId: OPERADOR })
    for (const [caso, desafio] of Object.entries(recusados)) {
      expect(await recusa(verificarDesafioDeOperador(desafio, CHAVE, 'configurar_mfa')), caso).toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO })
    }
  })

  it('não vale nas outras portas: nem como desafio da escola, nem como acesso da escola ou do operador; e o desafio da escola não vale aqui', async () => {
    const desafio = await new EmissorDeDesafioDeOperador(CHAVE).emitir({ operadorId: OPERADOR, etapa: 'configurar_mfa' })
    const config = { ambiente: 'local' as const, chaveAssinatura: CHAVE }
    expect(await recusa(verificarDesafio(desafio, CHAVE, ['configurar_mfa', 'mfa']))).toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO })
    expect(await recusa(verificarToken(desafio, config))).toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO })
    expect(await recusa(verificarTokenDeOperador(desafio, config))).toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO })
    const daEscola = await new EmissorDeDesafio(CHAVE).emitir({ contaId: OPERADOR, etapa: 'configurar_mfa', mfaCumprido: false })
    expect(await recusa(verificarDesafioDeOperador(daEscola, CHAVE, 'configurar_mfa'))).toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO })
  })
})
