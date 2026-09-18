import { describe, expect, it } from 'vitest'
import { etapaDoLogin, hashDoRefresh, normalizarEmail } from './login.service.js'

describe('etapa do login depois da senha certa', () => {
  it('um professor só: pronta', () => {
    expect(etapaDoLogin([{ papel: 'professor' }], false)).toBe('pronta')
  })

  it('um coordenador só: configurar o MFA, ou informá-lo quando já tem; nunca pronta', () => {
    expect(etapaDoLogin([{ papel: 'coordenador' }], false)).toBe('configurar_mfa')
    expect(etapaDoLogin([{ papel: 'coordenador' }], true)).toBe('mfa')
  })

  it('usuário ativo em mais de uma escola: escolher, com ou sem coordenação entre elas', () => {
    expect(etapaDoLogin([{ papel: 'professor' }, { papel: 'professor' }], false)).toBe('escolher')
    expect(etapaDoLogin([{ papel: 'professor' }, { papel: 'coordenador' }], true)).toBe('escolher')
  })
})

describe('normalização e refresh', () => {
  it('o e-mail sai sem espaço nas pontas e em minúsculas, como a conta (citext) o compara', () => {
    expect(normalizarEmail('  Camila@Escola.Invalid ')).toBe('camila@escola.invalid')
  })

  it('o refresh vira SHA-256 em hex, que é o que a sessão guarda', () => {
    expect(hashDoRefresh('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})
