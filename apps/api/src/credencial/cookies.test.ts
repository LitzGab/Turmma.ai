import { describe, expect, it } from 'vitest'
import { COOKIE_DISPOSITIVO, COOKIE_SESSAO, lerCookie, serializarCookie } from './cookies.js'

describe('cookies de sessão', () => {
  it('educa_sessao fora do local: HttpOnly, Secure, SameSite=Strict, só em /v1/sessao e sem Max-Age (some ao fechar o navegador)', () => {
    const cabecalho = serializarCookie(COOKIE_SESSAO, 'refresh-sintetico', { ambiente: 'producao' })
    expect(cabecalho.split('; ').sort()).toEqual(['HttpOnly', 'Path=/v1/sessao', 'SameSite=Strict', 'Secure', 'educa_sessao=refresh-sintetico'].sort())
    expect(serializarCookie(COOKIE_SESSAO, 'x', { ambiente: 'staging' })).toContain('Secure')
  })

  it('no local, sem Secure: o ambiente local roda em http://127.0.0.1', () => {
    expect(serializarCookie(COOKIE_SESSAO, 'x', { ambiente: 'local' }).split('; ')).not.toContain('Secure')
  })

  it('educa_dispositivo leva Max-Age, e os mesmos atributos', () => {
    const cabecalho = serializarCookie(COOKIE_DISPOSITIVO, '1.abc:1', { ambiente: 'producao', maxAgeSegundos: 2_592_000 })
    expect(cabecalho.split('; ')).toEqual(expect.arrayContaining(['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/v1/sessao', 'Max-Age=2592000']))
  })

  it('recusa valor que abriria outro atributo no cabeçalho', () => {
    expect(() => serializarCookie(COOKIE_SESSAO, 'a; Path=/', { ambiente: 'local' })).toThrow()
  })

  it('lê o cookie pedido, entre outros e com espaço, e nada quando não há', () => {
    expect(lerCookie('outro=1; educa_dispositivo=1.abc:2 ; educa_sessao=r', COOKIE_DISPOSITIVO)).toBe('1.abc:2')
    expect(lerCookie('educa_sessao=r', COOKIE_DISPOSITIVO)).toBeUndefined()
    expect(lerCookie(undefined, COOKIE_DISPOSITIVO)).toBeUndefined()
  })
})
