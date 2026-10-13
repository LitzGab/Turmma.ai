// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { escolherAparencia } from '../../tema'
import { CascaDaOperacao, CascaPublicaDaOperacao } from './CascaDaOperacao'

/**
 * A Aparência da operação (RF3 da X1): na faixa de cima, ao lado do "Sair", só com a sessão aberta. As telas de fora da
 * sessão seguem o sistema, sem controle. A largura, a ordem e o que a escolha pinta são do e2e (`e2e/aparencia.spec.ts`).
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

describe('a faixa da operação', () => {
  it('com a sessão aberta, a faixa leva a Aparência, com o nome só para o leitor de tela, e o "Sair"', () => {
    render(
      <CascaDaOperacao titulo="Escolas" nome="Operador Exemplo" aoSair={() => undefined} saindo={false}>
        <p>conteúdo</p>
      </CascaDaOperacao>,
    )
    expect(screen.getByRole('radiogroup', { name: 'Aparência' })).toBeTruthy()
    expect(screen.queryByText('Aparência')).toBeNull()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeTruthy()
  })

  it('as telas de fora da sessão (entrar e o segundo fator) não têm o controle', () => {
    render(
      <CascaPublicaDaOperacao titulo="Entrar">
        <p>formulário</p>
      </CascaPublicaDaOperacao>,
    )
    expect(screen.queryByRole('radiogroup', { name: 'Aparência' })).toBeNull()
  })
})
