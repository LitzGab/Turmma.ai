import { EMISSOR_TOKEN_SINTETICO, lerConfiguracaoIdentidade, VALIDADE_MAXIMA_TOKEN_SEGUNDOS, verificarToken } from '@educa/nucleo'
import { decodeJwt, decodeProtectedHeader } from 'jose'
import { describe, expect, it } from 'vitest'
import { ConfiguracaoInvalida } from '../config.js'
import { ArgumentoInvalido, emitirTokenSintetico, lerPedido } from './token-sintetico.js'

const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
const USUARIO = '0190f5a0-0000-7000-8000-0000000000c1'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const ambienteLocal = {
  AMBIENTE: 'local',
  ACEITAR_TOKEN_SINTETICO: 'true',
  IDENTIDADE_CHAVE_ASSINATURA: 'chave_sintetica_de_teste_com_32_caracteres',
}

describe('lerPedido', () => {
  it('lê escola, usuário e validade', () => {
    expect(lerPedido(['--escola', ESCOLA_A, '--usuario', USUARIO, '--validade', '30m'])).toEqual({
      escolaId: ESCOLA_A,
      usuarioId: USUARIO,
      validadeSegundos: 1800,
    })
  })

  it('sem --usuario, gera um UUID novo a cada token; sem --validade, vale 1 hora', () => {
    const primeiro = lerPedido(['--escola', ESCOLA_A])
    const segundo = lerPedido(['--escola', ESCOLA_A])
    expect(primeiro.usuarioId).toMatch(UUID)
    expect(primeiro.usuarioId).not.toBe(segundo.usuarioId)
    expect(primeiro.validadeSegundos).toBe(3600)
  })

  it('aceita a validade máxima de 24 horas e recusa um segundo além', () => {
    expect(lerPedido(['--escola', ESCOLA_A, '--validade', '24h']).validadeSegundos).toBe(VALIDADE_MAXIMA_TOKEN_SEGUNDOS)
    expect(() => lerPedido(['--escola', ESCOLA_A, '--validade', `${VALIDADE_MAXIMA_TOKEN_SEGUNDOS + 1}s`])).toThrow(ArgumentoInvalido)
  })

  it.each([
    ['sem --escola', []],
    ['escola fora do formato UUID', ['--escola', 'Colégio Exemplo']],
    ['usuário fora do formato UUID', ['--escola', ESCOLA_A, '--usuario', 'Enzo Martins']],
    ['validade sem unidade', ['--escola', ESCOLA_A, '--validade', '3600']],
    ['validade em dias', ['--escola', ESCOLA_A, '--validade', '30d']],
    ['validade zero', ['--escola', ESCOLA_A, '--validade', '0s']],
    ['opção desconhecida', ['--escola', ESCOLA_A, '--nome', 'Enzo']],
    ['argumento solto', [ESCOLA_A]],
  ])('recusa %s', (_caso, argumentos) => {
    expect(() => lerPedido(argumentos)).toThrow(ArgumentoInvalido)
  })

  it('a mensagem de argumento inválido cita a opção, não o valor', () => {
    expect(() => lerPedido(['--escola', ESCOLA_A, '--usuario', 'Enzo Martins'])).toThrow(/^Opção inválida ou ausente: --usuario$/)
  })
})

describe('emitirTokenSintetico', () => {
  const pedido = { escolaId: ESCOLA_A, usuarioId: USUARIO, validadeSegundos: 600 }

  it('emite um token que a verificação da API aceita, com a escola e o usuário pedidos', async () => {
    const token = await emitirTokenSintetico(pedido, ambienteLocal)
    expect(await verificarToken(token, lerConfiguracaoIdentidade(ambienteLocal))).toEqual({ escolaId: ESCOLA_A, usuarioId: USUARIO })
  })

  it('o token leva só sub, esc, iss, iat e exp: nada da pessoa', async () => {
    const agora = new Date('2026-09-14T10:00:00-03:00')
    const token = await emitirTokenSintetico(pedido, ambienteLocal, agora)
    const emitidoEm = agora.getTime() / 1000
    expect(decodeProtectedHeader(token)).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(decodeJwt(token)).toEqual({ sub: USUARIO, esc: ESCOLA_A, iss: EMISSOR_TOKEN_SINTETICO, iat: emitidoEm, exp: emitidoEm + 600 })
  })

  it('o token vencido é recusado pela API', async () => {
    const token = await emitirTokenSintetico(pedido, ambienteLocal, new Date(Date.now() - 601_000))
    await expect(verificarToken(token, lerConfiguracaoIdentidade(ambienteLocal))).rejects.toMatchObject({ codigo: 'NAO_AUTENTICADO' })
  })

  it('não emite com AMBIENTE=producao', async () => {
    await expect(emitirTokenSintetico(pedido, { ...ambienteLocal, AMBIENTE: 'producao' })).rejects.toBeInstanceOf(ConfiguracaoInvalida)
  })

  it('não emite sem chave de assinatura, e o erro não traz valor do ambiente', async () => {
    const erro = await emitirTokenSintetico(pedido, { AMBIENTE: 'local' }).catch((motivo: unknown) => motivo)
    expect(erro).toBeInstanceOf(ConfiguracaoInvalida)
    expect((erro as ConfiguracaoInvalida).variaveis).toEqual(['IDENTIDADE_CHAVE_ASSINATURA'])
  })
})
