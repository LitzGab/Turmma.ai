// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { prepararTela, redeFalsa, renderizarTela } from '../../__fixtures__/tela'
import { AVISO_DA_AVALIACAO } from './atividades'
import Inicio from './Inicio'
import { TEXTO_DA_SUPERVISAO } from './tutor'

/**
 * O Início do aluno nos quatro estados (telas do aluno e primeiro acesso, 2.0; RF4, RF5, RF20): carregando, erro, vazio —
 * só com a leitura terminada — e com dado. A faixa de supervisão está em **todos**, sem botão de fechar (D8), porque ela
 * não depende de leitura nenhuma. A rede é falsa; a tela, o cliente de consultas e a sessão são os da aba.
 */
prepararTela()

const REQUISICAO = '0190f5a0-0000-7000-8000-000000000001'
const PAGINA_SEGUINTE = '0192a4c0-5b1e-7c3d-8e4f-0000000000aa'
const FALHA = { status: 429, corpo: { erro: { codigo: 'LIMITE_EXCEDIDO', mensagem: 'x', requisicaoId: REQUISICAO } } } as const
const atividade = (final: string, campos: Record<string, unknown> = {}) => ({
  id: `0192a4c0-5b1e-7c3d-8e4f-0000000000${final}`,
  titulo: `Lista sintética ${final}`,
  disciplina: { id: '0192a4c0-5b1e-7c3d-8e4f-0000000000ff', nome: 'Química' },
  avaliativa: false,
  situacao: 'para_fazer',
  questoes: 3,
  respondidas: 0,
  aplicadaEm: '2026-10-05T13:00:00.000Z',
  enviadaEm: null,
  ...campos,
})

/** A área do aluno monta as rotas sob `/aluno`; o `Router` com a mesma base dá aos links o endereço que o navegador teria. */
function montar() {
  return renderizarTela(
    <Router base="/aluno">
      <Inicio />
    </Router>,
  )
}

/** A faixa de supervisão: o texto de hoje, uma vez só, e nada que a feche. */
function conferirAFaixa(): void {
  const faixa = document.querySelector('[data-faixa-de-supervisao]')
  expect(faixa, 'a faixa de supervisão').not.toBeNull()
  expect(faixa?.textContent).toContain(TEXTO_DA_SUPERVISAO)
  expect(screen.getAllByText(TEXTO_DA_SUPERVISAO)).toHaveLength(1)
  expect(within(faixa as HTMLElement).queryAllByRole('button')).toHaveLength(0)
}

describe('o Início do aluno', () => {
  it('carregando: a faixa já está na tela, o rótulo do carregamento também, e o vazio ainda não', async () => {
    const rede = redeFalsa()
    rede.segurar()
    montar()

    expect(await screen.findByText('Carregando as suas atividades…')).toBeTruthy()
    conferirAFaixa()
    // O vazio só vale com a leitura terminada: lista que ainda não chegou não é lista sem nada.
    expect(screen.queryByText('Nenhuma atividade para pedir ajuda agora')).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Início')
  })

  it('com erro: o alerta com "Tentar de novo", a faixa continua, e nem o vazio nem a lista aparecem', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minhas-atividades', FALHA)
    montar()

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
    conferirAFaixa()
    expect(screen.queryByText('Nenhuma atividade para pedir ajuda agora')).toBeNull()
  })

  it('vazio, com a leitura terminada: diz que não há atividade, sem lista, e a faixa continua', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minhas-atividades', { status: 200, corpo: { itens: [] } })
    montar()

    expect(await screen.findByText('Nenhuma atividade para pedir ajuda agora')).toBeTruthy()
    expect(screen.queryByText('Carregando as suas atividades…')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
    conferirAFaixa()
  })

  it('com dado: cada atividade leva ao Tutor dela, a avaliação aberta é avisada, e a que já foi enviada não leva o aviso', async () => {
    const rede = redeFalsa()
    const aberta = atividade('01', { avaliativa: true })
    const enviada = atividade('02', { avaliativa: true, situacao: 'enviada', respondidas: 3 })
    const comum = atividade('03')
    rede.responderPor('/v1/minhas-atividades', { status: 200, corpo: { itens: [aberta, enviada, comum] } })
    montar()

    const lista = await screen.findByRole('list')
    const links = within(lista).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([`/aluno/tutor/${aberta.id}`, `/aluno/tutor/${enviada.id}`, `/aluno/tutor/${comum.id}`])
    // O aviso é só de quem ainda espera resposta: a avaliação enviada e a atividade comum não o levam.
    expect(links.map((link) => link.textContent?.includes(AVISO_DA_AVALIACAO))).toEqual([true, false, false])
    expect(screen.queryByText('Nenhuma atividade para pedir ajuda agora')).toBeNull()
    // A API não apontou página seguinte: não há o que pedir.
    expect(screen.queryByRole('button', { name: /Ver mais atividades|Carregando…/ })).toBeNull()
    conferirAFaixa()
  })

  it('"Ver mais atividades" só aparece quando a API aponta a página seguinte, e nada rola sem o aluno pedir', async () => {
    const rede = redeFalsa()
    rede.responderPor('/v1/minhas-atividades', { status: 200, corpo: { itens: [atividade('01')], proxima: PAGINA_SEGUINTE } })
    montar()

    expect(await screen.findByRole('button', { name: 'Ver mais atividades' })).toBeTruthy()
    expect(rede.chamadas.filter((chamada) => chamada.caminho.startsWith('/v1/minhas-atividades'))).toHaveLength(1)
  })

  it('"Ver mais atividades" pede a página seguinte, mostra "Carregando…" sem aceitar outro clique, e junta a página nova à lista', async () => {
    const rede = redeFalsa()
    let liberar: (resposta: { status: number; corpo: unknown }) => void = () => undefined
    let chamadas = 0
    rede.responderPor('/v1/minhas-atividades', () => {
      chamadas += 1
      if (chamadas === 1) return { status: 200, corpo: { itens: [atividade('01')], proxima: PAGINA_SEGUINTE } }
      return new Promise((resolver) => (liberar = resolver))
    })
    montar()

    fireEvent.click(await screen.findByRole('button', { name: 'Ver mais atividades' }))
    const carregando = await screen.findByRole('button', { name: 'Carregando…' })
    expect((carregando as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Ver mais atividades' })).toBeNull()

    await waitFor(() => expect(chamadas).toBe(2))
    liberar({ status: 200, corpo: { itens: [atividade('02')] } })
    expect(await screen.findByText('Lista sintética 02')).toBeTruthy()
    expect(screen.getByText('Lista sintética 01')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Ver mais atividades|Carregando…/ })).toBeNull()
  })
})
