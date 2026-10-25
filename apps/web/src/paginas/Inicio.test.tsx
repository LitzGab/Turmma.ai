// @vitest-environment jsdom
import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { ROTAS } from '../caminhos'
import { prepararTela, redeFalsa, renderizarTela } from '../__fixtures__/tela'
import { Inicio } from './Inicio'

/**
 * A raiz de quem entrou (telas do aluno e primeiro acesso, 2.0; RF1): cada papel é levado à tela em que abre, trocando a
 * entrada do histórico. O aluno abre no Início dele, e não na lista de tarefas nem na conversa.
 */
prepararTela()

const ESCOLA = { id: '0197a1c0-0000-7000-8000-0000000000e1', nome: 'Colégio Vista Alegre', slug: 'vista-alegre' }

describe('a raiz de quem entrou', () => {
  it('o aluno abre em /aluno/inicio, e a raiz não fica no histórico', async () => {
    const rede = redeFalsa()
    rede.responder({
      status: 200,
      corpo: { usuarioId: '0197a1c0-0000-7000-8000-0000000000a1', papel: 'aluno', nome: 'Camila Souza', escola: ESCOLA, inatividadeMin: 30, introducaoVistaEm: '2026-02-01T10:00:00.000Z', acessos: [] },
    })
    const localizacao = memoryLocation({ path: ROTAS.inicio, record: true })
    renderizarTela(
      <Router hook={localizacao.hook}>
        <Inicio />
      </Router>,
    )

    await waitFor(() => expect(localizacao.history).toEqual([ROTAS.inicioDoAluno]))
  })
})
