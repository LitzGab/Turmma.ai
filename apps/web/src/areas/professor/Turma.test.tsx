// @vitest-environment jsdom
import { montarTime } from '@educa/shared'
import { focusManager, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'
import { criarClienteDeConsultas } from '../../api/cliente-de-consultas'
import { prepararTela, redeFalsa, type RedeFalsa, type RespostaFalsa } from '../../__fixtures__/tela'
import Turma from './Turma'

/**
 * A turma aberta em três abas, guardadas no endereço (telas do professor, 10.0; RF15): qual aba abre, como trocar sem passo
 * no histórico, o que o parâmetro do painel faz fora de Hoje e quais leituras cada aba faz. A rede é falsa e responde por
 * caminho; a `Turma`, as abas, o cliente de consultas e a rota são os de verdade.
 */
prepararTela()

const id = (n: number) => `0197a1c0-0000-7000-8000-${String(n).padStart(12, '0')}`
const TURMA = id(100)
const SERIE = { id: id(110), etapa: 'ef_anos_finais', ano: 7 }
const ok = (corpo: unknown): RespostaFalsa => ({ status: 200, corpo })

function instalar(rede: RedeFalsa): void {
  rede.responderPor(`/v1/turmas/${TURMA}`, ok({ id: TURMA, nome: '7º A', serie: SERIE }))
  rede.responderPor('/v1/eu', ok({ usuarioId: id(1), papel: 'professor', nome: 'Professora sintética', escola: { id: id(2), nome: 'Escola sintética', slug: 'escola-sintetica' }, inatividadeMin: 30, acessos: [] }))
  rede.responderPor('/v1/sinais', ok({ itens: [{ id: id(300), tipo: 'atencao_humana', aluno: { id: id(901), nome: 'Caio Sintético' }, criadoEm: '2026-10-05T13:40:00.000Z' }], grupos: [] }))
  rede.responderPor('/v1/tutor/uso', ok({ turmaId: TURMA, limiteDoDia: 60, trocasDaTurmaNoMes: 0, pacoteDaTurmaNoMes: 0, alunos: [] }))
  rede.responderPor(`/v1/turmas/${TURMA}/desempenho`, ok({ turmaId: TURMA, lotesAprovados: 0, porHabilidade: [], alunos: [] }))
  rede.responderPor('/v1/atividades-aplicadas', ok({ itens: [] }))
  rede.responderPor('/v1/time', ok(montarTime(new Set())))
  rede.responderPor('/v1/materiais', ok({ itens: [] }))
  rede.responderPor(`/v1/turmas/${TURMA}/acesso`, ok({ expiraEm: null }))
  rede.responderPor(`/v1/turmas/${TURMA}/reivindicacoes`, ok({ itens: [] }))
}

function montar(busca = '') {
  const localizacao = memoryLocation({ path: `/turmas/${TURMA}`, searchPath: busca, record: true })
  const tela = render(
    <QueryClientProvider client={criarClienteDeConsultas()}>
      <Router hook={localizacao.hook} searchHook={localizacao.searchHook}>
        <Turma turmaId={TURMA} />
      </Router>
    </QueryClientProvider>,
  )
  return { localizacao, ...tela }
}

const semConsulta = (caminho: string) => caminho.split('?')[0] ?? caminho
const caminhosDe = (rede: RedeFalsa) => rede.chamadas.map((chamada) => semConsulta(chamada.caminho))
const vezesQue = (rede: RedeFalsa, caminho: string) => caminhosDe(rede).filter((chamado) => chamado === caminho).length
const abaSelecionada = () => screen.getByRole('tab', { selected: true }).textContent

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
  vi.stubGlobal('matchMedia', (consulta: string) => ({ matches: consulta === '(min-width: 768px)', media: consulta, addEventListener: () => undefined, removeEventListener: () => undefined }))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  )
})

afterEach(() => {
  vi.useRealTimers()
  focusManager.setFocused(undefined)
})

describe('a turma aberta: a aba pelo endereço', () => {
  it('são três abas, Hoje, Atividades e Alunos, nessa ordem; o `h1` e o "Voltar para Turmas" ficam', async () => {
    const rede = redeFalsa()
    instalar(rede)
    montar()
    await screen.findByRole('tab', { name: 'Hoje' })
    expect(screen.getAllByRole('tab').map((aba) => aba.textContent)).toEqual(['Hoje', 'Atividades', 'Alunos'])
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Turma 7º A')
    expect(screen.getByRole('link', { name: 'Voltar para Turmas' })).toBeTruthy()
  })

  it('sem aba, a turma abre em Hoje; `?aba=visao-geral`, o endereço de antes, e um valor que não existe, também', async () => {
    for (const busca of ['', 'aba=visao-geral', 'aba=qualquer-coisa', 'aba=']) {
      const rede = redeFalsa()
      instalar(rede)
      const { unmount } = montar(busca)
      await screen.findByRole('region', { name: 'Sinais da turma' })
      expect(abaSelecionada(), busca).toBe('Hoje')
      unmount()
    }
  })

  it('`?aba=alunos` abre Alunos, e `?aba=atividades`, Atividades: cada uma com o conteúdo dela e só as leituras dela', async () => {
    const redeAlunos = redeFalsa()
    instalar(redeAlunos)
    const { unmount } = montar('aba=alunos')
    expect(await screen.findByRole('heading', { name: 'Acesso dos alunos' })).toBeTruthy()
    expect(abaSelecionada()).toBe('Alunos')
    expect(caminhosDe(redeAlunos)).not.toContain('/v1/sinais')
    unmount()

    const redeAtividades = redeFalsa()
    instalar(redeAtividades)
    montar('aba=atividades')
    expect(await screen.findByText('Nenhuma atividade aplicada a esta turma')).toBeTruthy()
    expect(abaSelecionada()).toBe('Atividades')
    expect(caminhosDe(redeAtividades)).not.toContain('/v1/sinais')
    expect(caminhosDe(redeAtividades)).not.toContain(`/v1/turmas/${TURMA}/acesso`)
  })

  it('trocar de aba troca o endereço com `replace`: a aba nova no endereço, o histórico com o mesmo tamanho, e o Voltar não passa por ela', async () => {
    const usuario = userEvent.setup()
    const rede = redeFalsa()
    instalar(rede)
    const { localizacao } = montar()
    await screen.findByRole('region', { name: 'Sinais da turma' })
    const antes = localizacao.history.length
    await usuario.click(screen.getByRole('tab', { name: 'Alunos' }))
    await screen.findByRole('heading', { name: 'Acesso dos alunos' })
    expect(localizacao.history.length).toBe(antes)
    expect(localizacao.history.at(-1)).toBe(`/turmas/${TURMA}?aba=alunos`)
    expect(abaSelecionada()).toBe('Alunos')
    await usuario.click(screen.getByRole('tab', { name: 'Atividades' }))
    await screen.findByText('Nenhuma atividade aplicada a esta turma')
    expect(localizacao.history.length).toBe(antes)
    expect(localizacao.history.at(-1)).toBe(`/turmas/${TURMA}?aba=atividades`)
  })

  it('o painel do Tutor pedido no endereço só abre em Hoje: em Alunos o parâmetro não abre nada, e voltar a Hoje não o reabre', async () => {
    const usuario = userEvent.setup()
    const rede = redeFalsa()
    instalar(rede)
    const { localizacao } = montar('aba=alunos&ver=tutor')
    await screen.findByRole('heading', { name: 'Acesso dos alunos' })
    expect(screen.queryByRole('dialog', { name: 'O que o Tutor viu' })).toBeNull()
    expect(caminhosDe(rede)).not.toContain('/v1/tutor/uso')

    await usuario.click(screen.getByRole('tab', { name: 'Hoje' }))
    await screen.findByRole('region', { name: 'Sinais da turma' })
    expect(localizacao.history.at(-1)).toBe(`/turmas/${TURMA}?aba=hoje`)
    expect(screen.queryByRole('dialog', { name: 'O que o Tutor viu' })).toBeNull()
    expect(caminhosDe(rede)).not.toContain('/v1/tutor/uso')
  })

  it('o painel do Tutor pedido em Hoje abre, com Hoje por baixo', async () => {
    const rede = redeFalsa()
    instalar(rede)
    montar('aba=hoje&ver=tutor')
    expect(await screen.findByRole('dialog', { name: 'O que o Tutor viu' })).toBeTruthy()
    expect(abaSelecionada()).toBe('Hoje')
    await waitFor(() => expect(vezesQue(rede, '/v1/tutor/uso')).toBe(1))
  })
})

describe('Hoje só lê os sinais com Hoje à vista', () => {
  async function avancar(ms: number): Promise<void> {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }

  it('com Atividades ou Alunos aberta, nenhuma leitura de sinais aos 15 s; o controle: com Hoje aberta, a leitura sai', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const rede = redeFalsa()
    instalar(rede)
    montar()
    await screen.findByRole('region', { name: 'Sinais da turma' })
    await waitFor(() => expect(vezesQue(rede, '/v1/sinais')).toBe(1))

    // O controle: Hoje à vista relê aos 15 s.
    await avancar(16_000)
    await waitFor(() => expect(vezesQue(rede, '/v1/sinais')).toBe(2))

    for (const aba of ['Atividades', 'Alunos']) {
      await usuario.click(screen.getByRole('tab', { name: aba }))
      await waitFor(() => expect(abaSelecionada()).toBe(aba))
      // Só com o pedaço da aba carregado a Hoje saiu: enquanto a aba nova suspende, o React guarda a anterior escondida, ainda montada.
      if (aba === 'Atividades') await screen.findByText('Nenhuma atividade aplicada a esta turma')
      else await screen.findByRole('heading', { name: 'Acesso dos alunos' })
      const antes = vezesQue(rede, '/v1/sinais')
      await avancar(46_000)
      expect(vezesQue(rede, '/v1/sinais'), aba).toBe(antes)
    }
  })
})
