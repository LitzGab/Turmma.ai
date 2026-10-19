// @vitest-environment jsdom
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarClienteDeConsultas } from '../../api/cliente-de-consultas'
import { AUTORIZACAO_DE_TESTE, prepararTela, redeFalsa, type RedeFalsa, type RespostaFalsa } from '../../__fixtures__/tela'
import AlunosDaTurma from './AlunosDaTurma'

/**
 * A aba Alunos da turma aberta (telas do professor, 12.0; RF18, RF21): a lista de nomes em ordem de nome, com os acertos das
 * correções aprovadas, e os pedidos de nome no alto. A rede é falsa e responde **por caminho**; a aba, os pedidos, o acesso, a
 * tabela e o cliente de consultas são os de verdade. O fluxo de decidir um pedido (o diálogo) fica para o e2e.
 */
prepararTela()

const id = (n: number) => `0197a1c0-0000-7000-8000-${String(n).padStart(12, '0')}`
const TURMA = id(100)
const ESCOLA = { id: id(2), nome: 'Escola sintética', slug: 'escola-sintetica' }
const ok = (corpo: unknown): RespostaFalsa => ({ status: 200, corpo })
const erro = (status: number, codigo: string): RespostaFalsa => ({ status, corpo: { erro: { codigo, mensagem: 'x', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } } })

const aluno = (n: number, nome: string) => ({ usuarioId: id(n), nome })
const HABILIDADE = { codigo: 'QUI.EM.04', descricao: 'Estequiometria' }
const desempenhoDe = (n: number, nome: string, acertos: number, total: number) => ({
  alunoId: id(n),
  nome,
  acertos,
  total,
  porHabilidade: total === 0 ? [] : [{ habilidade: HABILIDADE, acertos, total }],
})
const desempenho = (alunos: readonly unknown[], lotesAprovados = 1) => ok({ turmaId: TURMA, lotesAprovados, porHabilidade: [], alunos })

// Em ordem de id, como a API entrega: a ordem de nome é outra (Ana, Bruno, Caio), e a de acerto, outra ainda.
const BRUNO = aluno(1, 'Bruno Sintético')
const CAIO = aluno(2, 'Caio Sintético')
const ANA = aluno(3, 'Ana Sintética')

const SEM_PEDIDOS = ok({ itens: [] })
const MENSAGEM_DO_FIM = 'Todos os alunos da turma estão na lista.'

interface Leituras {
  alunos?: RespostaFalsa | ((caminho: string) => RespostaFalsa | Promise<RespostaFalsa>)
  desempenho?: RespostaFalsa | (() => RespostaFalsa | Promise<RespostaFalsa>)
}

function instalar(rede: RedeFalsa, { alunos = ok({ itens: [BRUNO, CAIO, ANA] }), desempenho: acertos = desempenho([]) }: Leituras = {}): void {
  rede.responderPor(`/v1/turmas/${TURMA}/alunos`, alunos)
  rede.responderPor(`/v1/turmas/${TURMA}/desempenho`, acertos)
  rede.responderPor(`/v1/turmas/${TURMA}/reivindicacoes`, SEM_PEDIDOS)
  rede.responderPor(`/v1/turmas/${TURMA}/acesso`, ok({ expiraEm: null }))
}

function montar(aoPerderATurma: () => void = () => undefined) {
  const cliente = criarClienteDeConsultas()
  const tela = render(
    <QueryClientProvider client={cliente}>
      <AlunosDaTurma turmaId={TURMA} turmaNome="7º A" escola={ESCOLA} aoPerderATurma={aoPerderATurma} />
    </QueryClientProvider>,
  )
  return { cliente, ...tela }
}

/** Os nomes da tabela, na ordem em que a tela os mostra. */
const nomesNaTela = () => screen.getAllByRole('rowheader').map((celula) => celula.textContent)
const linhaDe = (nome: string) => screen.getByRole('rowheader', { name: nome }).closest('tr') as HTMLElement
const doAluno = (nome: string) => within(linhaDe(nome))

const chamadasA = (rede: RedeFalsa, caminho: string) => rede.chamadas.filter((chamada) => chamada.caminho.split('?')[0] === `/v1/turmas/${TURMA}/${caminho}`)

/** Uma resposta que só sai quando o teste manda. */
function segurada(): { resposta: Promise<RespostaFalsa>; liberar: (resposta: RespostaFalsa) => void } {
  let liberar: (resposta: RespostaFalsa) => void = () => undefined
  const resposta = new Promise<RespostaFalsa>((resolver) => (liberar = resolver))
  return { resposta, liberar }
}

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

describe('Alunos: a lista de nomes da turma', () => {
  it('com dado: os alunos em ordem de nome, e não na de id que a API entrega, cada um com os seus acertos', async () => {
    const rede = redeFalsa()
    instalar(rede, { desempenho: desempenho([desempenhoDe(1, BRUNO.nome, 1, 2), desempenhoDe(2, CAIO.nome, 2, 2), desempenhoDe(3, ANA.nome, 0, 2)]) })
    montar()

    expect(await screen.findByRole('region', { name: 'Por aluno' })).toBeTruthy()
    await waitFor(() => expect(doAluno(ANA.nome).getByText('0 de 2')).toBeTruthy())
    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome, CAIO.nome])
    expect(doAluno(BRUNO.nome).getByText('1 de 2')).toBeTruthy()
    expect(doAluno(CAIO.nome).getByText('2 de 2')).toBeTruthy()
    expect(doAluno(CAIO.nome).getByText('QUI.EM.04: 2 de 2')).toBeTruthy()
    expect(screen.getByText('3 alunos, em ordem de nome. Os acertos são os das correções aprovadas.')).toBeTruthy()
    expect(screen.getByText(MENSAGEM_DO_FIM)).toBeTruthy()
    // Com alunos na lista e ninguém que saiu, nem o vazio nem o aviso de quem saiu aparecem.
    expect(screen.queryByText('A lista ainda não chegou')).toBeNull()
    expect(screen.queryByText(/Quem saiu da turma/)).toBeNull()
  })

  it('a web lê a lista de cem em cem, sem `?anoLetivoId` e sem finalidade, e os acertos de lote aprovado: nenhuma outra rota de aluno', async () => {
    const rede = redeFalsa()
    instalar(rede)
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })

    expect(chamadasA(rede, 'alunos')).toEqual([{ caminho: `/v1/turmas/${TURMA}/alunos?limite=100`, metodo: 'GET', autorizacao: AUTORIZACAO_DE_TESTE }])
    expect(rede.chamadas.filter((chamada) => /anoLetivoId|finalidade/.test(chamada.caminho))).toEqual([])
    // Só a lista, os acertos aprovados, os pedidos e o acesso: a aba não lê correção, sinal nem conversa. Correção pendente ou
    // rejeitada nem chega à web, e por isso não entra na conta.
    expect([...new Set(rede.chamadas.map((chamada) => chamada.caminho.split('?')[0]))].sort()).toEqual(
      [`/v1/turmas/${TURMA}/acesso`, `/v1/turmas/${TURMA}/alunos`, `/v1/turmas/${TURMA}/desempenho`, `/v1/turmas/${TURMA}/reivindicacoes`].sort(),
    )
  })

  it('aluno sem correção aprovada: aparece com "Sem correção aprovada", e não some nem vira "0 de 0"', async () => {
    const rede = redeFalsa()
    // Bruno tem total zero no desempenho; Caio nem consta nele; Ana tem um acerto.
    instalar(rede, { desempenho: desempenho([desempenhoDe(1, BRUNO.nome, 0, 0), desempenhoDe(3, ANA.nome, 1, 2)]) })
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })
    await waitFor(() => expect(doAluno(ANA.nome).getByText('1 de 2')).toBeTruthy())

    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome, CAIO.nome])
    expect(doAluno(BRUNO.nome).getByText('Sem correção aprovada')).toBeTruthy()
    expect(doAluno(CAIO.nome).getByText('Sem correção aprovada')).toBeTruthy()
    expect(screen.queryByText('0 de 0')).toBeNull()
  })

  it('turma sem nenhuma correção aprovada: todos aparecem, todos "Sem correção aprovada"', async () => {
    const rede = redeFalsa()
    instalar(rede, { desempenho: desempenho([], 0) })
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })

    await waitFor(() => expect(screen.getAllByText('Sem correção aprovada')).toHaveLength(3))
    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome, CAIO.nome])
  })

  it('aluno transferido ou com o acesso desativado: o desempenho o traz e a lista não, e ele aparece com o estado próprio, sem número', async () => {
    const rede = redeFalsa()
    const dora = aluno(9, 'Dora Sintética')
    instalar(rede, { alunos: ok({ itens: [BRUNO, ANA] }), desempenho: desempenho([desempenhoDe(1, BRUNO.nome, 1, 2), desempenhoDe(3, ANA.nome, 2, 2), desempenhoDe(9, dora.nome, 2, 2)]) })
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })

    await waitFor(() => expect(doAluno(dora.nome).getByText('Saiu da turma')).toBeTruthy())
    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome, dora.nome])
    expect(within(linhaDe(dora.nome)).queryByText(/\d de \d/)).toBeNull()
    expect(screen.getByText('Quem saiu da turma (transferido, ou com o acesso desativado) aparece sem acertos.')).toBeTruthy()
    // Quem está na turma não ganha o estado.
    expect(screen.getAllByText('Saiu da turma')).toHaveLength(1)
  })

  it('com páginas por ler, o aluno que o desempenho traz e a lista ainda não trouxe não é dado como quem saiu da turma', async () => {
    const rede = redeFalsa()
    const dora = aluno(9, 'Dora Sintética')
    instalar(rede, {
      alunos: ok({ itens: [BRUNO, ANA], proxima: ANA.usuarioId }),
      desempenho: desempenho([desempenhoDe(1, BRUNO.nome, 1, 2), desempenhoDe(3, ANA.nome, 2, 2), desempenhoDe(9, dora.nome, 2, 2)]),
    })
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })
    await waitFor(() => expect(doAluno(ANA.nome).getByText('2 de 2')).toBeTruthy())

    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome])
    expect(screen.queryByText('Saiu da turma')).toBeNull()
    expect(screen.queryByText(/Quem saiu da turma/)).toBeNull()
  })

  it('nenhum controle ordena por acerto, nem busca por nome, nem mostra situação, média, selo de adaptação ou a conversa do aluno', async () => {
    const rede = redeFalsa()
    // O aluno de mais acerto é o último do alfabeto, e o de menos, o primeiro: a ordem de acerto seria a inversa da de nome.
    instalar(rede, { desempenho: desempenho([desempenhoDe(1, BRUNO.nome, 1, 2), desempenhoDe(2, CAIO.nome, 2, 2), desempenhoDe(3, ANA.nome, 0, 2)]) })
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })
    await waitFor(() => expect(doAluno(CAIO.nome).getByText('2 de 2')).toBeTruthy())

    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome, CAIO.nome])
    const secao = screen.getByRole('region', { name: 'Por aluno' })
    expect(within(secao).queryAllByRole('button').map((botao) => botao.textContent)).toEqual([])
    expect(within(secao).queryAllByRole('columnheader').map((cabecalho) => cabecalho.querySelector('button'))).toEqual([null, null, null])
    expect(screen.queryByRole('searchbox')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    const texto = document.body.textContent ?? ''
    expect(texto).not.toMatch(/\bnotas?\b|\bconceitos?\b|pontua|m[ée]dia|ranking|p[óo]dio|posi[çc]|atenção:|adaptação|abrir a conversa|em dia/i)
  })

  it('o vazio diz "A lista ainda não chegou" e o caminho: a coordenação monta a lista; e não aparece com acertos ainda por ler', async () => {
    const rede = redeFalsa()
    const acertos = segurada()
    instalar(rede, { alunos: ok({ itens: [] }), desempenho: () => acertos.resposta })
    const { cliente } = montar()

    // A lista veio vazia, mas os acertos ainda não: o vazio espera, porque o desempenho pode trazer quem a lista não traz.
    await waitFor(() => expect(cliente.getQueryState(['alunos-da-turma', TURMA])?.status).toBe('success'))
    await waitFor(() => expect(chamadasA(rede, 'desempenho')).toHaveLength(1))
    expect(screen.queryByText('A lista ainda não chegou')).toBeNull()
    acertos.liberar(desempenho([], 0))

    expect(await screen.findByText('A lista ainda não chegou')).toBeTruthy()
    expect(screen.getByText(/peça a ela/)).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Por aluno' })).toBeNull()
    expect(screen.queryByRole('table')).toBeNull()
  })
})

describe('Alunos: os estados da leitura', () => {
  it('carregando: a lista diz que carrega, e os acertos de cada aluno dizem que carregam; nada afirma "Sem correção aprovada" antes da hora', async () => {
    const rede = redeFalsa()
    const lista = segurada()
    const acertos = segurada()
    instalar(rede, { alunos: () => lista.resposta, desempenho: () => acertos.resposta })
    montar()

    expect(await screen.findByText('Carregando os alunos da turma…')).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Por aluno' })).toBeNull()
    lista.liberar(ok({ itens: [BRUNO, ANA] }))
    await screen.findByRole('region', { name: 'Por aluno' })
    expect(screen.queryByText('Carregando os alunos da turma…')).toBeNull()
    expect(screen.getAllByText('Carregando os acertos…')).toHaveLength(2)
    expect(screen.queryByText('Sem correção aprovada')).toBeNull()
    acertos.liberar(desempenho([desempenhoDe(1, BRUNO.nome, 1, 2)]))
    await waitFor(() => expect(screen.queryByText('Carregando os acertos…')).toBeNull())
    expect(doAluno(BRUNO.nome).getByText('1 de 2')).toBeTruthy()
    expect(doAluno(ANA.nome).getByText('Sem correção aprovada')).toBeTruthy()
  })

  it('a lista ainda carrega e os acertos já chegaram: nada de "A lista ainda não chegou" antes da hora', async () => {
    const rede = redeFalsa()
    const lista = segurada()
    instalar(rede, { alunos: () => lista.resposta, desempenho: desempenho([], 0) })
    const { cliente } = montar()

    expect(await screen.findByText('Carregando os alunos da turma…')).toBeTruthy()
    await waitFor(() => expect(cliente.getQueryState(['desempenho', TURMA])?.status).toBe('success'))
    expect(screen.getByText('Carregando os alunos da turma…')).toBeTruthy()
    expect(screen.queryByText('A lista ainda não chegou')).toBeNull()
    lista.liberar(ok({ itens: [] }))
    expect(await screen.findByText('A lista ainda não chegou')).toBeTruthy()
  })

  it('erro da lista: a mensagem e "Tentar de novo", e a tabela não aparece; tentar de novo lê outra vez e mostra os alunos', async () => {
    const rede = redeFalsa()
    let falhar = true
    instalar(rede, { alunos: () => (falhar ? erro(500, 'ERRO_INTERNO') : ok({ itens: [BRUNO, ANA] })) })
    const usuario = userEvent.setup()
    montar()

    // O erro de rede tem uma nova tentativa automática, um segundo depois.
    const botao = await screen.findByRole('button', { name: 'Tentar de novo' }, { timeout: 4000 })
    expect(screen.queryByRole('region', { name: 'Por aluno' })).toBeNull()
    expect(screen.queryByText('A lista ainda não chegou')).toBeNull()
    falhar = false
    await usuario.click(botao)

    expect(await screen.findByRole('region', { name: 'Por aluno' })).toBeTruthy()
    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome])
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  }, 10_000)

  it('erro dos acertos: os nomes continuam na tela, com "Acertos não lidos" e o próprio "Tentar de novo", que lê só os acertos', async () => {
    const rede = redeFalsa()
    let falhar = true
    instalar(rede, { desempenho: () => (falhar ? erro(500, 'ERRO_INTERNO') : desempenho([desempenhoDe(1, BRUNO.nome, 1, 2)])) })
    const usuario = userEvent.setup()
    montar()

    const botao = await screen.findByRole('button', { name: 'Tentar de novo' }, { timeout: 4000 })
    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome, CAIO.nome])
    expect(screen.getAllByText('Acertos não lidos')).toHaveLength(3)
    expect(screen.queryByText('Sem correção aprovada')).toBeNull()
    const listaAntes = chamadasA(rede, 'alunos').length
    falhar = false
    await usuario.click(botao)

    await waitFor(() => expect(doAluno(BRUNO.nome).getByText('1 de 2')).toBeTruthy())
    expect(screen.queryByText('Acertos não lidos')).toBeNull()
    expect(chamadasA(rede, 'alunos')).toHaveLength(listaAntes)
  }, 10_000)

  it('a releitura dos acertos que falha com o dado já na tela não tira os acertos nem põe o erro no lugar', async () => {
    const rede = redeFalsa()
    let falhar = false
    instalar(rede, { desempenho: () => (falhar ? erro(500, 'ERRO_INTERNO') : desempenho([desempenhoDe(1, BRUNO.nome, 1, 2)])) })
    const { cliente } = montar()
    await screen.findByRole('region', { name: 'Por aluno' })
    await waitFor(() => expect(doAluno(BRUNO.nome).getByText('1 de 2')).toBeTruthy())

    falhar = true
    await cliente.refetchQueries({ queryKey: ['desempenho', TURMA] })
    await waitFor(() => expect(cliente.getQueryState(['desempenho', TURMA])?.status).toBe('error'))
    expect(doAluno(BRUNO.nome).getByText('1 de 2')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
    expect(screen.queryByText('Acertos não lidos')).toBeNull()
  }, 10_000)

  it('mais de uma página: "Ver mais" lê a seguinte com a `pagina` da anterior, e os nomes das duas voltam juntos em ordem de nome', async () => {
    const rede = redeFalsa()
    const dora = aluno(4, 'Dora Sintética')
    const aninha = aluno(5, 'Aninha Sintética')
    instalar(rede, { alunos: (caminho) => (caminho.includes('pagina=') ? ok({ itens: [dora, aninha] }) : ok({ itens: [BRUNO, CAIO, ANA], proxima: ANA.usuarioId })) })
    const usuario = userEvent.setup()
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })

    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome, CAIO.nome])
    expect(screen.getByText('3 alunos até aqui, em ordem de nome. Os acertos são os das correções aprovadas.')).toBeTruthy()
    expect(screen.queryByText(MENSAGEM_DO_FIM)).toBeNull()

    await usuario.click(screen.getByRole('button', { name: 'Ver mais' }))
    await waitFor(() => expect(nomesNaTela()).toHaveLength(5))
    // "Aninha" da segunda página fica entre "Ana" e "Bruno" da primeira: reordena tudo o que já foi lido.
    expect(nomesNaTela()).toEqual([ANA.nome, aninha.nome, BRUNO.nome, CAIO.nome, dora.nome])
    expect(chamadasA(rede, 'alunos').map((chamada) => chamada.caminho)).toEqual([`/v1/turmas/${TURMA}/alunos?limite=100`, `/v1/turmas/${TURMA}/alunos?limite=100&pagina=${ANA.usuarioId}`])
    expect(screen.queryByRole('button', { name: 'Ver mais' })).toBeNull()
    expect(screen.getByText('5 alunos, em ordem de nome. Os acertos são os das correções aprovadas.')).toBeTruthy()
  })

  it('dois cliques no mesmo instante em "Ver mais" pedem a página seguinte uma vez só', async () => {
    const rede = redeFalsa()
    const segunda = segurada()
    instalar(rede, { alunos: (caminho) => (caminho.includes('pagina=') ? segunda.resposta : ok({ itens: [BRUNO, ANA], proxima: ANA.usuarioId })) })
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })

    const botao = screen.getByRole('button', { name: 'Ver mais' })
    botao.click()
    botao.click()
    await waitFor(() => expect(chamadasA(rede, 'alunos')).toHaveLength(2))
    // Enquanto a página não chega, o botão diz que carrega e não aceita outro toque.
    const carregando = await screen.findByRole('button', { name: 'Carregando…' })
    expect((carregando as HTMLButtonElement).disabled).toBe(true)
    segunda.liberar(ok({ itens: [CAIO] }))
    await waitFor(() => expect(nomesNaTela()).toHaveLength(3))
    expect(chamadasA(rede, 'alunos')).toHaveLength(2)
  })

  it('o foco depois de "Ver mais": fica no botão enquanto há mais, e vai à frase do fim quando o botão sai da tela', async () => {
    const rede = redeFalsa()
    instalar(rede, {
      alunos: (caminho) => {
        if (caminho.includes(`pagina=${CAIO.usuarioId}`)) return ok({ itens: [ANA] })
        if (caminho.includes(`pagina=${BRUNO.usuarioId}`)) return ok({ itens: [CAIO], proxima: CAIO.usuarioId })
        return ok({ itens: [BRUNO], proxima: BRUNO.usuarioId })
      },
    })
    const usuario = userEvent.setup()
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })
    // Abrir a aba não leva o foco a lugar nenhum: ele só se mexe depois de "Ver mais".
    expect(document.activeElement).toBe(document.body)

    await usuario.click(screen.getByRole('button', { name: 'Ver mais' }))
    await waitFor(() => expect(nomesNaTela()).toHaveLength(2))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Ver mais' }))

    await usuario.click(screen.getByRole('button', { name: 'Ver mais' }))
    await waitFor(() => expect(nomesNaTela()).toHaveLength(3))
    expect(screen.queryByRole('button', { name: 'Ver mais' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByText(MENSAGEM_DO_FIM))
  })

  it('o foco que a professora levou a outro lugar enquanto a página chega não é tomado de volta', async () => {
    const rede = redeFalsa()
    const segunda = segurada()
    instalar(rede, { alunos: (caminho) => (caminho.includes('pagina=') ? segunda.resposta : ok({ itens: [BRUNO], proxima: BRUNO.usuarioId })) })
    const usuario = userEvent.setup()
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })

    await usuario.click(screen.getByRole('button', { name: 'Ver mais' }))
    await waitFor(() => expect(chamadasA(rede, 'alunos')).toHaveLength(2))
    const outro = screen.getByRole('button', { name: 'Ver o acesso dos alunos' })
    outro.focus()
    segunda.liberar(ok({ itens: [CAIO] }))
    await waitFor(() => expect(nomesNaTela()).toHaveLength(2))
    expect(document.activeElement).toBe(outro)
  })

  it('a falha de "Ver mais" mantém os nomes já lidos e oferece tentar de novo, que lê a mesma página', async () => {
    const rede = redeFalsa()
    let falhar = true
    instalar(rede, { alunos: (caminho) => (caminho.includes('pagina=') ? (falhar ? erro(500, 'ERRO_INTERNO') : ok({ itens: [CAIO] })) : ok({ itens: [BRUNO, ANA], proxima: ANA.usuarioId })) })
    const usuario = userEvent.setup()
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })

    await usuario.click(screen.getByRole('button', { name: 'Ver mais' }))
    const tentar = await screen.findByRole('button', { name: 'Tentar de novo' }, { timeout: 4000 })
    expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome])
    falhar = false
    await usuario.click(tentar)

    await waitFor(() => expect(nomesNaTela()).toEqual([ANA.nome, BRUNO.nome, CAIO.nome]))
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  }, 10_000)
})

describe('Alunos: a turma, o cache e os pedidos de nome', () => {
  it('a lista não fica no cache: ao sair da aba e voltar, ela é lida de novo; os nomes não ficam em localStorage, sessionStorage nem no endereço', async () => {
    const rede = redeFalsa()
    instalar(rede)
    const primeira = montar()
    await screen.findByRole('region', { name: 'Por aluno' })
    expect(chamadasA(rede, 'alunos')).toHaveLength(1)

    primeira.unmount()
    await waitFor(() => expect(primeira.cliente.getQueryCache().findAll({ queryKey: ['alunos-da-turma'] })).toHaveLength(0))
    expect(JSON.stringify(primeira.cliente.getQueryCache().getAll().map((consulta) => consulta.state.data))).not.toContain('Sintético')

    montar()
    await screen.findByRole('region', { name: 'Por aluno' })
    expect(chamadasA(rede, 'alunos')).toHaveLength(2)
    for (const guardado of [window.localStorage, window.sessionStorage]) expect(JSON.stringify(Object.entries(guardado))).not.toMatch(/Sintético|Ana|Bruno|Caio/)
    expect(`${window.location.href}${window.location.search}${window.location.hash}`).not.toMatch(/Sintético|Ana|Bruno|Caio|%C3%A9/)
  })

  it('a turma que a API deixou de achar tira a página: a lista que responde `NAO_ENCONTRADO` avisa quem desenha a turma, uma vez', async () => {
    const rede = redeFalsa()
    instalar(rede, { alunos: erro(404, 'NAO_ENCONTRADO') })
    const aoPerder = vi.fn()
    montar(aoPerder)

    await waitFor(() => expect(aoPerder).toHaveBeenCalledTimes(1))
    // O 404 da turma não se repete sozinho (não vale a pena tentar de novo), e a tela não mostra a tabela nem o vazio.
    expect(screen.queryByRole('region', { name: 'Por aluno' })).toBeNull()
    expect(screen.queryByText('A lista ainda não chegou')).toBeNull()
  })

  it('outro erro da lista não tira a turma da página', async () => {
    const rede = redeFalsa()
    instalar(rede, { alunos: erro(400, 'ENTRADA_INVALIDA') })
    const aoPerder = vi.fn()
    montar(aoPerder)

    await screen.findByRole('button', { name: 'Tentar de novo' })
    expect(aoPerder).not.toHaveBeenCalled()
  })

  it('os pedidos de nome ficam no alto da aba, antes dos alunos, com as regras de hoje: a seção e o vazio com o caminho para o acesso', async () => {
    const rede = redeFalsa()
    instalar(rede)
    montar()
    await screen.findByRole('region', { name: 'Por aluno' })

    const pedidos = await screen.findByRole('region', { name: 'Pedidos de nome' })
    const porAluno = screen.getByRole('region', { name: 'Por aluno' })
    // Ordem no documento: o acesso, os pedidos, os alunos.
    expect(pedidos.compareDocumentPosition(porAluno) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(pedidos).getByText('Nenhum pedido esperando')).toBeTruthy()
    expect(within(pedidos).getByRole('button', { name: 'Ver o acesso dos alunos' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Acesso dos alunos' })).toBeTruthy()
  })
})
