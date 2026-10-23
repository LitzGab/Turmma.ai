import { describe, expect, it } from 'vitest'
import { ErroDeInvariante } from './erro-de-invariante.js'

describe('ErroDeInvariante', () => {
  it('leva o motivo na message e é um Error com o próprio nome', () => {
    const erro = new ErroDeInvariante('turma não criada')

    expect(erro).toBeInstanceOf(Error)
    expect(erro.message).toBe('turma não criada')
    expect(erro.name).toBe('ErroDeInvariante')
  })

  it('a subclasse continua sendo ErroDeInvariante e guarda o próprio campo', () => {
    class ComCampo extends ErroDeInvariante {
      constructor(readonly lista: readonly string[]) {
        super('lista com problema')
      }
    }

    const erro = new ComCampo(['a'])

    expect(erro).toBeInstanceOf(ErroDeInvariante)
    expect(erro.lista).toEqual(['a'])
  })
})
