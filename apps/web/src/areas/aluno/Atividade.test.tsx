// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { prepararTela, redeFalsa, renderizarTela, type RedeFalsa, type RespostaFalsa } from '../../__fixtures__/tela'
import { AVISO_DE_OUTRA_JANELA } from './atividade'
import Atividade from './Atividade'

/**
 * A atividade do aluno na tela (51.0, RF21): a escolha que perdeu para uma mais nova de outra janela não é reenviada, a
 * alternativa que fica marcada é a gravada, e o aviso "Sua resposta foi alterada em outra janela" aparece em lugar fixo,
 * numa região `role="status"`. A rede é falsa; a fila de respostas, o cliente de consultas e a tela são os de verdade.
 * O tamanho e o toque nas duas larguras, e o fluxo inteiro, são do e2e (`e2e/aluno-atividade.spec.ts`).
 *
 * A fila de respostas é uma por atividade e vive no módulo, como na aba: cada caso usa uma atividade (id) própria.
 */
prepararTela()

const idDaAtividade = (n: number) => `0197a1c0-0000-7000-8000-${String(n).padStart(12, '0')}`

const ALTERNATIVAS = ['Quatro', 'Cinco', 'Seis', 'Sete']
const questao = (numero: number) => ({ numero, enunciado: `Enunciado sintético da questão ${String(numero)}`, alternativas: ALTERNATIVAS })

function prova(atividadeAplicadaId: string, respostas: readonly { questao: number; alternativa: number; sequencia: number }[] = []): RespostaFalsa {
  return {
    status: 200,
    corpo: { atividadeAplicadaId, titulo: 'Lista sintética', avaliativa: false, estado: 'aberta', adaptacao: null, questoes: [questao(1), questao(2), questao(3)], respostas, enviadaEm: null },
  }
}

const gravada = (alternativa: number, sequencia: number): RespostaFalsa => ({ status: 200, corpo: { questao: 1, alternativa, sequencia, respondidaEm: '2026-10-22T13:10:00.000Z' } })

function montar(atividadeAplicadaId: string) {
  const localizacao = memoryLocation({ path: `/aluno/atividades/${atividadeAplicadaId}` })
  return renderizarTela(
    <Router hook={localizacao.hook}>
      <Atividade atividadeAplicadaId={atividadeAplicadaId} />
    </Router>,
  )
}

/** Os corpos dos `PUT` da resposta, na ordem em que a fila os mandou. */
const envios = (rede: RedeFalsa) =>
  rede.chamadas.flatMap((chamada, indice) => {
    if (chamada.metodo !== 'PUT') return []
    const opcoes = vi.mocked(fetch).mock.calls[indice]?.[1]
    return [JSON.parse(String(opcoes?.body)) as { alternativa: number; sequencia: number }]
  })

/** A região de status da questão: a que diz "Resposta salva", e onde o aviso da outra janela tem de estar. */
const regiaoDeStatus = () => screen.getByRole('status')
const marcada = () => screen.getAllByRole('radio').findIndex((radio) => (radio as HTMLInputElement).checked)

describe('a atividade na tela: a escolha mais nova vale (51.0, RF21)', () => {
  it('a aba que perde adota a alternativa gravada, não reenvia, e avisa dentro da região de status', async () => {
    const usuario = userEvent.setup()
    const id = idDaAtividade(1)
    const rede = redeFalsa()
    rede.responderPor(`/v1/atividades-aplicadas/${id}/prova`, prova(id))
    // O servidor já tinha, de outra janela, a alternativa C com a sequência 8: a escolha desta janela perde.
    rede.responderPor(`/v1/atividades-aplicadas/${id}/respostas/1`, gravada(2, 8))
    montar(id)

    await usuario.click(await screen.findByRole('radio', { name: /^B\./ }))
    await within(regiaoDeStatus()).findByText('Sua resposta foi alterada em outra janela')

    // A que ficou marcada é a do servidor (C), e a escolha daqui (B) foi embora; nada foi reenviado.
    expect(marcada()).toBe(2)
    expect(envios(rede)).toEqual([{ alternativa: 1, sequencia: 1 }])
    // O aviso está na região de status, junto do estado da resposta, e só uma vez.
    expect(screen.getAllByText(AVISO_DE_OUTRA_JANELA)).toHaveLength(1)
    expect(regiaoDeStatus().textContent).toContain('Resposta salva')
  })

  it('o clique seguinte da aba que perdeu sai com servidor + 1, vence, e o aviso some', async () => {
    const usuario = userEvent.setup()
    const id = idDaAtividade(2)
    const rede = redeFalsa()
    rede.responderPor(`/v1/atividades-aplicadas/${id}/prova`, prova(id))
    let chamada = 0
    rede.responderPor(`/v1/atividades-aplicadas/${id}/respostas/1`, () => (++chamada === 1 ? gravada(2, 8) : gravada(0, 9)))
    montar(id)

    await usuario.click(await screen.findByRole('radio', { name: /^B\./ }))
    await within(regiaoDeStatus()).findByText(AVISO_DE_OUTRA_JANELA)
    await usuario.click(screen.getByRole('radio', { name: /^A\./ }))

    await waitFor(() => expect(screen.queryByText(AVISO_DE_OUTRA_JANELA)).toBeNull())
    await waitFor(() => expect(envios(rede)).toHaveLength(2))
    expect(envios(rede)).toEqual([
      { alternativa: 1, sequencia: 1 },
      { alternativa: 0, sequencia: 9 },
    ])
    await waitFor(() => expect(marcada()).toBe(0))
    expect(regiaoDeStatus().textContent).toContain('Resposta salva')
  })

  it('a aba que venceu mostra a sua até a leitura seguinte, e então adota a do servidor com o mesmo aviso', async () => {
    const usuario = userEvent.setup()
    const id = idDaAtividade(3)
    const rede = redeFalsa()
    rede.responderPor(`/v1/atividades-aplicadas/${id}/prova`, prova(id))
    rede.responderPor(`/v1/atividades-aplicadas/${id}/respostas/1`, gravada(1, 1))
    montar(id)

    await usuario.click(await screen.findByRole('radio', { name: /^B\./ }))
    await waitFor(() => expect(regiaoDeStatus().textContent).toContain('Resposta salva'))
    // Ganhou: mostra a sua, sem aviso nenhum.
    expect(marcada()).toBe(1)
    expect(screen.queryByText(AVISO_DE_OUTRA_JANELA)).toBeNull()

    // A prova é lida de novo (a tela é aberta outra vez, sem F5): a outra janela gravou D, com a sequência 5.
    cleanup()
    const redeDaLeitura = redeFalsa()
    redeDaLeitura.responderPor(`/v1/atividades-aplicadas/${id}/prova`, prova(id, [{ questao: 1, alternativa: 3, sequencia: 5 }]))
    redeDaLeitura.responderPor(`/v1/atividades-aplicadas/${id}/respostas/1`, gravada(2, 6))
    montar(id)

    await screen.findByRole('radio', { name: /^D\./ })
    await within(regiaoDeStatus()).findByText(AVISO_DE_OUTRA_JANELA)
    expect(marcada()).toBe(3)
    // E a escolha seguinte sai uma acima da do servidor.
    await usuario.click(screen.getByRole('radio', { name: /^C\./ }))
    await waitFor(() => expect(envios(redeDaLeitura)).toEqual([{ alternativa: 2, sequencia: 6 }]))
  })

  it('a primeira abertura da atividade, com respostas já gravadas, não avisa nada: nesta janela não havia o que alterar', async () => {
    const id = idDaAtividade(4)
    const rede = redeFalsa()
    rede.responderPor(`/v1/atividades-aplicadas/${id}/prova`, prova(id, [{ questao: 1, alternativa: 2, sequencia: 4 }]))
    montar(id)

    await screen.findByRole('radio', { name: /^C\./ })
    await waitFor(() => expect(marcada()).toBe(2))
    expect(screen.queryByText(AVISO_DE_OUTRA_JANELA)).toBeNull()
    expect(envios(rede)).toEqual([])
  })
})
