import { describe, expect, it } from 'vitest'
import { podeEnviar, teclaEnvia, textoDoPedido } from './caixa-pedido'

describe('caixa de pedido', () => {
  it('Enter envia e Shift+Enter quebra a linha', () => {
    expect(teclaEnvia({ key: 'Enter', shiftKey: false, isComposing: false })).toBe(true)
    expect(teclaEnvia({ key: 'Enter', shiftKey: true, isComposing: false })).toBe(false)
  })

  it('o Enter que confirma um acento em composição não envia o pedido pela metade', () => {
    expect(teclaEnvia({ key: 'Enter', shiftKey: false, isComposing: true })).toBe(false)
  })

  it('nenhuma outra tecla envia', () => {
    for (const key of ['a', ' ', 'Tab', 'Escape', 'ArrowDown']) expect(teclaEnvia({ key, shiftKey: false, isComposing: false })).toBe(false)
  })

  it('o pedido vai sem o espaço das pontas, com as quebras de linha do meio', () => {
    expect(textoDoPedido('  monta uma atividade\nde estequiometria \n')).toBe('monta uma atividade\nde estequiometria')
  })

  it('só espaço e quebra de linha não é pedido', () => {
    expect(textoDoPedido('')).toBeUndefined()
    expect(textoDoPedido(' \n\t ')).toBeUndefined()
    expect(podeEnviar(' \n ', 'pronta')).toBe(false)
  })

  it('só a caixa pronta envia: com a resposta chegando ou desligada, um segundo pedido não sai', () => {
    expect(podeEnviar('oi', 'pronta')).toBe(true)
    expect(podeEnviar('oi', 'gerando')).toBe(false)
    expect(podeEnviar('oi', 'desligada')).toBe(false)
  })
})
