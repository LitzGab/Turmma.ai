import { CodigoDeErro } from '@educa/shared'
import { decodeJwt, decodeProtectedHeader } from 'jose'
import { describe, expect, it } from 'vitest'
import { EMISSOR_TOKEN, type ConfiguracaoIdentidade } from '../config/validar-config.js'
import { EmissorDeToken, VALIDADE_TOKEN_ACESSO_SEGUNDOS } from './emissor-de-token.js'
import { verificarToken } from './verificar-token.js'

const CHAVE = new TextEncoder().encode('chave_sintetica_de_teste_com_32_caracteres')
const pedido = {
  escolaId: '0190f5a0-0000-7000-8000-00000000000a',
  usuarioId: '0190f5a0-0000-7000-8000-0000000000a1',
  sessaoId: '0190f5a0-0000-7000-8000-0000000000d1',
}
const config: ConfiguracaoIdentidade = { ambiente: 'local', chaveAssinatura: CHAVE }

describe('EmissorDeToken', () => {
  it('emite JWT HS256 de 10 min, typ JWT, emissor educa, só com sub, esc, sid, iat e exp', async () => {
    const agora = new Date('2026-09-15T10:00:00-03:00')
    const { token, expiraEm } = await new EmissorDeToken(CHAVE, { agora: () => agora }).emitir(pedido)
    const emitidoEm = agora.getTime() / 1000
    expect(decodeProtectedHeader(token)).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(decodeJwt(token)).toEqual({
      sub: pedido.usuarioId,
      esc: pedido.escolaId,
      sid: pedido.sessaoId,
      iss: EMISSOR_TOKEN,
      iat: emitidoEm,
      exp: emitidoEm + VALIDADE_TOKEN_ACESSO_SEGUNDOS,
    })
    expect(VALIDADE_TOKEN_ACESSO_SEGUNDOS).toBe(600)
    expect(expiraEm).toEqual(new Date(agora.getTime() + 600_000))
  })

  it('a verificação da API aceita o token emitido e devolve a escola, o usuário e a sessão pedidos', async () => {
    const { token } = await new EmissorDeToken(CHAVE).emitir(pedido)
    expect(await verificarToken(token, config)).toEqual(pedido)
  })

  it('passados os 10 min, o token é recusado', async () => {
    const onzeMinutosAtras = new Date(Date.now() - 11 * 60_000)
    const { token } = await new EmissorDeToken(CHAVE, { agora: () => onzeMinutosAtras }).emitir(pedido)
    await expect(verificarToken(token, config)).rejects.toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO })
  })
})
