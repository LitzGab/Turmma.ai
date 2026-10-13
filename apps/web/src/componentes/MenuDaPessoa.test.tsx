// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { escolherAparencia } from '../tema'
import { MenuDaPessoa } from './MenuDaPessoa'

/**
 * O lugar da Aparência (RF3 da X1): "Sua conta", entre os links da pessoa e o "Sair", que continua sendo o último. No
 * trilho de 56 px, onde só cabem ícones, ela não aparece. A escolha em si é de `Aparencia.test.tsx`; o que se vê na
 * lateral de verdade, no teclado, é do e2e (`e2e/casca.spec.ts › W12` e `e2e/aparencia.spec.ts`).
 */
beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal('matchMedia', undefined)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  escolherAparencia('sistema')
  window.localStorage.clear()
})

describe('MenuDaPessoa', () => {
  it('a Aparência fica no menu da conta, antes do "Sair", que continua sendo o último controle', () => {
    render(<MenuDaPessoa nome="Professora Exemplo" papel="Professor" aoSair={() => undefined} saindo={false} />)
    const grupo = screen.getByRole('radiogroup', { name: 'Aparência' })
    const sair = screen.getByRole('button', { name: 'Sair' })
    expect(grupo.compareDocumentPosition(sair) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const controles = screen.getAllByRole('button').concat(screen.getAllByRole('radio'))
    const ultimo = controles.reduce((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? b : a))
    expect(ultimo).toBe(sair)
  })

  it('no trilho, só ícones: a Aparência não aparece, e o "Sair" continua alcançável', () => {
    render(<MenuDaPessoa nome="Professora Exemplo" aoSair={() => undefined} saindo={false} trilho />)
    expect(screen.queryByRole('radiogroup', { name: 'Aparência' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy()
  })
})
