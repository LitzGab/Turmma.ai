import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Os pedidos de nome na web (A1, 16.0): a leitura de cada papel, a decisão e o que a lista faz depois dela. A rede é
 * falsa; a regra sob teste é a da web. O módulo é recarregado em cada teste, como uma aba recém-aberta.
 */
const importar = async () => ({ sessao: await import('./sessao'), pedidos: await import('./pedidos') })
type Modulos = Awaited<ReturnType<typeof importar>>

interface Chamada {
  readonly caminho: string
  readonly metodo: string
  readonly corpo: unknown
  readonly autorizacao: string | undefined
}

const chamadas: Chamada[] = []
let fila: { status: number; corpo?: unknown }[] = []
let m: Modulos

const TURMA = '0192a4c0-5b1e-7c3d-8e4f-a0b1c2d3e4f5'
const pedido = (final: string, nome: string) => ({ id: `0192a4c0-5b1e-7c3d-8e4f-0000000000${final}`, nome, solicitadaEm: '2026-10-02T13:00:00.000Z', teveMatriculaErrada: false })
const ANA = pedido('01', 'Ana sintética')
const BRUNO = pedido('02', 'Bruno sintético')
const CAIO = pedido('03', 'Caio sintético')
const INDISPONIVEL = { status: 503, corpo: { erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'x', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } } }

/** Um cliente como o da tela, sem a nova tentativa automática: o teste diz cada resposta. */
const clienteDeTeste = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

beforeEach(async () => {
  chamadas.length = 0
  fila = []
  vi.resetModules()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string, opcoes?: RequestInit) => {
      const cabecalhos = new Headers(opcoes?.headers)
      chamadas.push({
        caminho,
        metodo: opcoes?.method ?? 'GET',
        corpo: typeof opcoes?.body === 'string' ? (JSON.parse(opcoes.body) as unknown) : undefined,
        autorizacao: cabecalhos.get('Authorization') ?? undefined,
      })
      const preparada = fila.shift()
      if (preparada === undefined) throw new Error(`chamada sem resposta preparada: ${caminho}`)
      return new Response(preparada.corpo === undefined ? null : JSON.stringify(preparada.corpo), { status: preparada.status })
    }),
  )
  m = await importar()
  // A sessão aberta pelo cookie, como a aba faz ao chegar à área: o token fica em memória.
  fila.push({ status: 200, corpo: { token: 'token-de-acesso', expiraEm: new Date(Date.now() + 600_000).toISOString() } })
  await m.sessao.abrirSessaoPeloCookie()
  chamadas.length = 0
})

afterEach(() => {
  vi.unstubAllGlobals()
  expect(fila, 'resposta preparada que nenhuma chamada consumiu').toHaveLength(0)
})

describe('a leitura dos pedidos, por quem decide (A1, 16.0)', () => {
  it('o professor lê sem finalidade; a coordenação manda a finalidade de conferência de cadastro; os dois pedem a página inteira, com a sessão', async () => {
    fila.push({ status: 200, corpo: { itens: [ANA] } }, { status: 200, corpo: { itens: [ANA, BRUNO] } })
    const cliente = clienteDeTeste()
    expect(await cliente.fetchQuery(m.pedidos.consultaPedidosDaTurma(TURMA, 'professor'))).toEqual({ itens: [ANA] })
    expect(await cliente.fetchQuery(m.pedidos.consultaPedidosDaTurma(TURMA, 'coordenacao'))).toEqual({ itens: [ANA, BRUNO] })
    expect(chamadas).toEqual([
      { caminho: `/v1/turmas/${TURMA}/reivindicacoes?limite=100`, metodo: 'GET', corpo: undefined, autorizacao: 'Bearer token-de-acesso' },
      { caminho: `/v1/turmas/${TURMA}/reivindicacoes?limite=100&finalidade=conferencia_de_cadastro`, metodo: 'GET', corpo: undefined, autorizacao: 'Bearer token-de-acesso' },
    ])
  })

  it('a lista que o professor leu não é a da coordenação: cada papel e cada turma têm a chave deles no cache', () => {
    const { consultaPedidosDaTurma } = m.pedidos
    expect(consultaPedidosDaTurma(TURMA, 'professor').queryKey).toEqual(['pedidos-da-turma', TURMA, 'professor'])
    expect(consultaPedidosDaTurma(TURMA, 'coordenacao').queryKey).not.toEqual(consultaPedidosDaTurma(TURMA, 'professor').queryKey)
    expect(consultaPedidosDaTurma('outra', 'professor').queryKey).not.toEqual(consultaPedidosDaTurma(TURMA, 'professor').queryKey)
  })

  it('a tela do professor lê ao abrir; a da coordenação não lê nada sozinha, nem quando a sessão volta a valer, e só lê quando ela pede', async () => {
    const cliente = clienteDeTeste()
    cliente.mount()
    fila.push({ status: 200, corpo: { itens: [ANA] } })
    const doProfessor = new QueryObserver(cliente, m.pedidos.consultaPedidosDaTurma(TURMA, 'professor'))
    const largarProfessor = doProfessor.subscribe(() => undefined)
    await vi.waitFor(() => expect(doProfessor.getCurrentResult().data).toEqual({ itens: [ANA] }))
    largarProfessor()
    chamadas.length = 0

    const daCoordenacao = new QueryObserver(cliente, m.pedidos.consultaPedidosDaTurma(TURMA, 'coordenacao'))
    const largarCoordenacao = daCoordenacao.subscribe(() => undefined)
    // O que o `main.tsx` faz quando a sessão volta a valer e quando ela troca: nenhum dos dois lê pela coordenação.
    await cliente.invalidateQueries()
    await cliente.resetQueries({ queryKey: m.pedidos.consultaPedidosDaTurma(TURMA, 'coordenacao').queryKey })
    expect(chamadas).toEqual([])
    expect(daCoordenacao.getCurrentResult().data).toBeUndefined()

    fila.push({ status: 200, corpo: { itens: [BRUNO] } })
    await daCoordenacao.refetch()
    expect(daCoordenacao.getCurrentResult().data).toEqual({ itens: [BRUNO] })
    expect(chamadas).toHaveLength(1)
    largarCoordenacao()
    cliente.unmount()
  })

  it('a lista não fica guardada depois de a tela sair, nem a da coordenação nem a do professor', async () => {
    const cliente = clienteDeTeste()
    fila.push({ status: 200, corpo: { itens: [ANA] } }, { status: 200, corpo: { itens: [ANA] } })
    for (const quem of ['professor', 'coordenacao'] as const) {
      const observador = new QueryObserver(cliente, { ...m.pedidos.consultaPedidosDaTurma(TURMA, quem), enabled: false })
      const largar = observador.subscribe(() => undefined)
      await observador.refetch()
      largar()
    }
    // O coletor do cache roda num `setTimeout` de `gcTime`; com 0, na próxima volta do laço.
    await new Promise((resolver) => setTimeout(resolver, 5))
    expect(cliente.getQueryData(m.pedidos.consultaPedidosDaTurma(TURMA, 'coordenacao').queryKey)).toBeUndefined()
    expect(cliente.getQueryData(m.pedidos.consultaPedidosDaTurma(TURMA, 'professor').queryKey)).toBeUndefined()
  })

  it('a resposta fora do contrato não chega à tela: o pedido com matrícula, ou com campo a mais', async () => {
    const cliente = clienteDeTeste()
    fila.push({ status: 200, corpo: { itens: [{ ...ANA, matricula: '2026001' }] } })
    await expect(cliente.fetchQuery(m.pedidos.consultaPedidosDaTurma(TURMA, 'professor'))).rejects.toMatchObject({ codigo: 'ERRO_INTERNO' })
  })
})

describe('a decisão e a lista depois dela (A1, 16.0)', () => {
  it('decidir manda os ids e a decisão, e nada de escola nem de turma', async () => {
    const resposta = { resultados: [{ id: ANA.id, resultado: 'decidida' }] }
    fila.push({ status: 200, corpo: resposta })
    expect(await m.pedidos.decidirPedidos({ ids: [ANA.id], decisao: 'aprovar' })).toEqual(resposta)
    expect(chamadas).toEqual([{ caminho: '/v1/reivindicacoes/decidir', metodo: 'POST', corpo: { ids: [ANA.id], decisao: 'aprovar' }, autorizacao: 'Bearer token-de-acesso' }])
  })

  it('todo id da resposta sai da lista na hora, qualquer que seja o resultado, sem leitura nova da coordenação', async () => {
    const cliente = clienteDeTeste()
    cliente.mount()
    const { queryKey } = m.pedidos.consultaPedidosDaTurma(TURMA, 'coordenacao')
    // A tela da coordenação montada, com a lista que ela pediu no "Atualizar".
    const daCoordenacao = new QueryObserver(cliente, m.pedidos.consultaPedidosDaTurma(TURMA, 'coordenacao'))
    const largar = daCoordenacao.subscribe(() => undefined)
    fila.push({ status: 200, corpo: { itens: [ANA, BRUNO, CAIO, pedido('04', 'Dani sintética')] } })
    await daCoordenacao.refetch()
    chamadas.length = 0
    await m.pedidos.aplicarDecisao(cliente, TURMA, 'coordenacao', {
      resultados: [
        { id: ANA.id, resultado: 'decidida' },
        { id: BRUNO.id, resultado: 'ja_decidida' },
        { id: CAIO.id, resultado: 'nao_encontrada' },
      ],
    })
    expect(daCoordenacao.getCurrentResult().data).toEqual({ itens: [pedido('04', 'Dani sintética')] })
    // Tempo para uma releitura sair, se saísse: nenhuma sai.
    await new Promise((resolver) => setTimeout(resolver, 20))
    expect(chamadas).toEqual([])
    expect(cliente.getQueryData(queryKey)).toEqual({ itens: [pedido('04', 'Dani sintética')] })
    largar()
    cliente.unmount()
  })

  it('resposta atrasada: a leitura que estava no ar antes da decisão não traz de volta o pedido decidido', async () => {
    const cliente = clienteDeTeste()
    const { queryKey } = m.pedidos.consultaPedidosDaTurma(TURMA, 'coordenacao')
    cliente.setQueryData(queryKey, { itens: [ANA, BRUNO] })
    // A leitura sai antes da decisão e fica no ar: o servidor a respondeu com os dois pedidos ainda pendentes.
    let responder: (resposta: Response) => void = () => undefined
    const leituraSaiu = new Promise<void>((saiu) => {
      vi.mocked(fetch).mockImplementationOnce(() => {
        saiu()
        return new Promise<Response>((resolver) => (responder = resolver))
      })
    })
    const noAr = cliente.fetchQuery({ ...m.pedidos.consultaPedidosDaTurma(TURMA, 'coordenacao'), staleTime: 0 }).catch(() => undefined)
    await leituraSaiu

    await m.pedidos.aplicarDecisao(cliente, TURMA, 'coordenacao', { resultados: [{ id: ANA.id, resultado: 'decidida' }] })
    responder(new Response(JSON.stringify({ itens: [ANA, BRUNO] }), { status: 200 }))
    await noAr
    expect(cliente.getQueryData(queryKey)).toEqual({ itens: [BRUNO] })
  })

  it('para o professor a lista ainda é relida depois da decisão; se a releitura cai, o pedido decidido continua fora dela', async () => {
    const cliente = clienteDeTeste()
    cliente.mount()
    const { queryKey } = m.pedidos.consultaPedidosDaTurma(TURMA, 'professor')
    fila.push({ status: 200, corpo: { itens: [ANA, BRUNO] } })
    const observador = new QueryObserver(cliente, m.pedidos.consultaPedidosDaTurma(TURMA, 'professor'))
    const largar = observador.subscribe(() => undefined)
    await vi.waitFor(() => expect(observador.getCurrentResult().data).toEqual({ itens: [ANA, BRUNO] }))
    chamadas.length = 0

    fila.push(INDISPONIVEL)
    await m.pedidos.aplicarDecisao(cliente, TURMA, 'professor', { resultados: [{ id: ANA.id, resultado: 'decidida' }] })
    await vi.waitFor(() => expect(observador.getCurrentResult().isError).toBe(true))
    expect(chamadas.map(({ caminho }) => caminho)).toEqual([`/v1/turmas/${TURMA}/reivindicacoes?limite=100`])
    expect(cliente.getQueryData(queryKey)).toEqual({ itens: [BRUNO] })
    largar()
    cliente.unmount()
  })

  it('depois da decisão que falha, a lista do professor é relida, e a da coordenação sai da tela sem leitura nenhuma', async () => {
    const cliente = clienteDeTeste()
    cliente.mount()
    fila.push({ status: 200, corpo: { itens: [ANA, BRUNO] } })
    const doProfessor = new QueryObserver(cliente, m.pedidos.consultaPedidosDaTurma(TURMA, 'professor'))
    const largarProfessor = doProfessor.subscribe(() => undefined)
    await vi.waitFor(() => expect(doProfessor.getCurrentResult().data).toEqual({ itens: [ANA, BRUNO] }))
    // Um erro no meio do lote: o primeiro pedido já foi decidido no servidor, e a releitura mostra só o que continua.
    // Enquanto ela não volta, a lista de antes fica na tela, e o diálogo aberto continua com os nomes.
    let responder: (resposta: Response) => void = () => undefined
    const releituraSaiu = new Promise<void>((saiu) => {
      vi.mocked(fetch).mockImplementationOnce(() => {
        saiu()
        return new Promise<Response>((resolver) => (responder = resolver))
      })
    })
    const descartada = m.pedidos.descartarListaDepoisDaFalha(cliente, TURMA, 'professor')
    await releituraSaiu
    expect(doProfessor.getCurrentResult().data).toEqual({ itens: [ANA, BRUNO] })
    responder(new Response(JSON.stringify({ itens: [BRUNO] }), { status: 200 }))
    await descartada
    expect(doProfessor.getCurrentResult().data).toEqual({ itens: [BRUNO] })
    largarProfessor()
    chamadas.length = 0

    const daCoordenacao = new QueryObserver(cliente, m.pedidos.consultaPedidosDaTurma(TURMA, 'coordenacao'))
    const largarCoordenacao = daCoordenacao.subscribe(() => undefined)
    fila.push({ status: 200, corpo: { itens: [ANA, BRUNO] } })
    await daCoordenacao.refetch()
    chamadas.length = 0
    await m.pedidos.descartarListaDepoisDaFalha(cliente, TURMA, 'coordenacao')
    expect(daCoordenacao.getCurrentResult().data).toBeUndefined()
    expect(daCoordenacao.getCurrentResult().isError).toBe(false)
    expect(chamadas).toEqual([])
    largarCoordenacao()
    cliente.unmount()
  })
})
