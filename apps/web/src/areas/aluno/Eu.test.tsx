// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { prepararTela, redeFalsa, renderizarTela } from '../../__fixtures__/tela'
import { ContextoDaSaida } from '../../componentes/saida-da-casca'
import Eu from './Eu'

/**
 * "Eu" do aluno nos quatro estados (telas do aluno e primeiro acesso, 2.0; RF3, RF9, RF20): carregando, erro, o aluno sem
 * turma — que é o vazio dele, e só vale com a leitura terminada — e com dado. As linhas **Privacidade** e **Sair** existem em
 * todos: o "Sair" não pode depender de a turma ter chegado (D59). O "Sair" é o da casca, pelo contexto.
 */
prepararTela()

const REQUISICAO = '0190f5a0-0000-7000-8000-000000000001'
const FALHA = { status: 429, corpo: { erro: { codigo: 'LIMITE_EXCEDIDO', mensagem: 'x', requisicaoId: REQUISICAO } } } as const
const NAO_ACHADA = { status: 404, corpo: { erro: { codigo: 'NAO_ENCONTRADO', mensagem: 'x', requisicaoId: REQUISICAO } } } as const
const COM_TURMA = {
  status: 200,
  corpo: {
    escola: { nome: 'Escola sintética' },
    turma: { id: '0192a4c0-5b1e-7c3d-8e4f-a0b1c2d3e4f5', nome: '7º A' },
    serie: { id: '0192a4c0-5b1e-7c3d-8e4f-a0b1c2d3e4f6', etapa: 'ef_anos_finais', ano: 7 },
  },
} as const
const SEM_TURMA_NO_ANO = 'Você ainda não está em uma turma neste ano letivo. Fale com quem dá a aula ou com a coordenação.'

/** A área do aluno monta as rotas sob `/aluno`; o `Router` com a mesma base dá ao link o endereço que o navegador teria. */
function montar(saida?: ComponentProps<typeof ContextoDaSaida>['value']) {
  const eu = (
    <Router base="/aluno">
      <Eu />
    </Router>
  )
  return renderizarTela(saida === undefined ? eu : <ContextoDaSaida value={saida}>{eu}</ContextoDaSaida>)
}

/** As linhas Privacidade e Sair, que têm de estar em qualquer estado. */
function conferirAsLinhas(): { sair: HTMLElement; privacidade: HTMLElement } {
  const linhas = screen.getByRole('list', { name: 'Privacidade e saída' })
  const privacidade = within(linhas).getByRole('link', { name: 'Privacidade' })
  expect(privacidade.getAttribute('href')).toBe('/aluno/privacidade')
  return { sair: within(linhas).getByRole('button', { name: 'Sair' }), privacidade }
}

describe('Eu', () => {
  it('carregando: o título, o rótulo do carregamento e as duas linhas, e nenhuma turma ainda', async () => {
    const rede = redeFalsa()
    rede.segurar()
    montar()

    expect((await screen.findByRole('status')).textContent).toBe('Carregando a sua turma…')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Eu')
    expect(screen.queryByText(SEM_TURMA_NO_ANO)).toBeNull()
    conferirAsLinhas()
  })

  it('com dado: a turma, a série por extenso e a escola, e as duas linhas', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minha-turma', COM_TURMA)
    montar()

    expect(await screen.findByRole('heading', { level: 2, name: '7º A' })).toBeTruthy()
    const principal = document.body
    expect(principal.textContent).toContain('Escola sintética')
    expect(principal.textContent).toContain('7º ano do Ensino Fundamental')
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
    conferirAsLinhas()
  })

  it('o aluno sem turma no ano: o texto de hoje numa região de status, sem "Tentar de novo" nem erro de rede, e as linhas continuam', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minha-turma', NAO_ACHADA)
    montar()

    // O carregando também é uma região de status: o texto de quem está sem turma é o que prova que a leitura terminou.
    expect((await screen.findByText(SEM_TURMA_NO_ANO)).getAttribute('role')).toBe('status')
    expect(screen.queryByText('Carregando a sua turma…')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
    conferirAsLinhas()
  })

  it('com erro de rede: o alerta com "Tentar de novo", e o "Sair" continua ao alcance', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minha-turma', FALHA)
    montar()

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
    expect(screen.queryByText(SEM_TURMA_NO_ANO)).toBeNull()
    conferirAsLinhas()
  })

  it('"Sair" é a saída da casca: um clique chama a saída do contexto, uma vez, e nada mais é pedido à API pela linha', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minha-turma', COM_TURMA)
    const sair = vi.fn()
    montar({ sair, saindo: false })
    await screen.findByRole('heading', { level: 2, name: '7º A' })
    const chamadasAntes = rede.chamadas.length

    await userEvent.setup().click(conferirAsLinhas().sair)

    expect(sair).toHaveBeenCalledTimes(1)
    expect(rede.chamadas).toHaveLength(chamadasAntes)
  })

  it('saindo: a linha diz "Saindo…" no lugar de "Sair"', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minha-turma', COM_TURMA)
    montar({ sair: () => undefined, saindo: true })
    await screen.findByRole('heading', { level: 2, name: '7º A' })

    expect(screen.getByRole('button', { name: 'Saindo…' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Sair' })).toBeNull()
  })

  it('nada de colega, média, posição, sequência de dias, ponto ou meta (RF10)', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minha-turma', COM_TURMA)
    montar()
    await screen.findByRole('heading', { level: 2, name: '7º A' })

    expect(document.body.textContent ?? '').not.toMatch(/colega|média|posição|ranking|sequência|pontos|meta\b|prêmio/i)
  })
})
