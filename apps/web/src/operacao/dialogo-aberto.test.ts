import { describe, expect, it } from 'vitest'
import { fecharSeAindaAberta, proximaAbertura } from './dialogo-aberto'

describe('a resposta de um pedido fecha só a abertura em que ele saiu (correção 2026-09-25-resposta-atrasada-fecha-o-dialogo-reaberto)', () => {
  it('cancelar e reabrir o mesmo diálogo dá outra abertura, e a resposta da primeira não fecha a segunda', () => {
    const primeira = proximaAbertura('escola', 0)
    const segunda = proximaAbertura('escola', primeira.numero)
    expect(segunda.tipo).toBe(primeira.tipo)
    expect(segunda.numero).not.toBe(primeira.numero)
    expect(fecharSeAindaAberta(segunda, primeira)).toBe(segunda)
  })

  it('a resposta com outro diálogo aberto também não o fecha', () => {
    const escola = proximaAbertura('escola', 0)
    const rede = proximaAbertura('rede', escola.numero)
    expect(fecharSeAindaAberta<'escola' | 'rede'>(rede, escola)).toBe(rede)
  })

  it('a resposta com a própria abertura ainda aberta a fecha', () => {
    const aberta = proximaAbertura('rede', 3)
    expect(fecharSeAindaAberta(aberta, aberta)).toBeUndefined()
    // A mesma abertura vista por outro objeto (um render depois) continua sendo ela: vale o número.
    expect(fecharSeAindaAberta({ ...aberta }, aberta)).toBeUndefined()
  })

  it('com nada aberto, a resposta atrasada não abre nada', () => {
    expect(fecharSeAindaAberta(undefined, proximaAbertura('escola', 0))).toBeUndefined()
  })
})
