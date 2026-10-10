import { focusManager, InfiniteQueryObserver, onlineManager, QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A lista dos pedidos de titular na web (F3, 16.0): cada leitura é auditada em nome da coordenação, e por isso nenhuma sai
 * sozinha (foco, rede) e a lista não fica guardada fora da tela. A rede é falsa; a regra sob teste é a da web. O módulo é
 * recarregado em cada teste, como uma aba recém-aberta.
 */
const importar = async () => ({ sessao: await import('./sessao'), privacidade: await import('./privacidade') })
type Modulos = Awaited<ReturnType<typeof importar>>

const chamadas: { readonly caminho: string; readonly metodo: string }[] = []
let fila: { status: number; corpo?: unknown }[] = []
let m: Modulos

const ESPERA_MS = 20

beforeEach(async () => {
  chamadas.length = 0
  fila = []
  vi.resetModules()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string, opcoes?: RequestInit) => {
      chamadas.push({ caminho, metodo: opcoes?.method ?? 'GET' })
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
  focusManager.setFocused(undefined)
  onlineManager.setOnline(true)
  expect(fila, 'resposta preparada que nenhuma chamada consumiu').toHaveLength(0)
})

const esperar = () => new Promise((resolver) => setTimeout(resolver, ESPERA_MS))

describe('a lista dos pedidos de titular na web (F3, 16.0)', () => {
  it('a lista dos pedidos não relê ao voltar o foco nem ao voltar a rede', async () => {
    fila.push({ status: 200, corpo: { itens: [] } })
    const cliente = new QueryClient({ defaultOptions: { queries: { staleTime: 0, retry: false } } })
    cliente.mount()
    const observador = new InfiniteQueryObserver(cliente, m.privacidade.consultaPedidosDoTitular)
    const desinscrever = observador.subscribe(() => undefined)
    await vi.waitFor(() => expect(chamadas).toHaveLength(1))
    // Com a leitura ainda no ar, o foco só pegaria carona nela: a leitura precisa ter chegado para o foco poder pedir outra.
    await vi.waitFor(() => expect(observador.getCurrentResult().isSuccess).toBe(true))

    focusManager.setFocused(false)
    focusManager.setFocused(true)
    onlineManager.setOnline(false)
    onlineManager.setOnline(true)
    await esperar()

    expect(chamadas).toHaveLength(1)
    desinscrever()
    cliente.unmount()
  })

  it('controle: com o foco ligado a mesma consulta relê', async () => {
    fila.push({ status: 200, corpo: { itens: [] } }, { status: 200, corpo: { itens: [] } })
    const cliente = new QueryClient({ defaultOptions: { queries: { staleTime: 0, retry: false } } })
    cliente.mount()
    const observador = new InfiniteQueryObserver(cliente, { ...m.privacidade.consultaPedidosDoTitular, refetchOnWindowFocus: true })
    const desinscrever = observador.subscribe(() => undefined)
    await vi.waitFor(() => expect(chamadas).toHaveLength(1))
    // Com a leitura ainda no ar, o foco só pegaria carona nela: a leitura precisa ter chegado para o foco poder pedir outra.
    await vi.waitFor(() => expect(observador.getCurrentResult().isSuccess).toBe(true))

    focusManager.setFocused(false)
    focusManager.setFocused(true)

    await vi.waitFor(() => expect(chamadas).toHaveLength(2))
    desinscrever()
    cliente.unmount()
  })

  it('a lista dos pedidos não fica no cache depois que a aba sai', async () => {
    fila.push({ status: 200, corpo: { itens: [] } })
    const cliente = new QueryClient({ defaultOptions: { queries: { staleTime: 0, retry: false } } })
    cliente.mount()
    const observador = new InfiniteQueryObserver(cliente, m.privacidade.consultaPedidosDoTitular)
    const desinscrever = observador.subscribe(() => undefined)
    await vi.waitFor(() => expect(chamadas).toHaveLength(1))
    await vi.waitFor(() => expect(observador.getCurrentResult().isSuccess).toBe(true))
    expect(cliente.getQueryCache().find({ queryKey: m.privacidade.consultaPedidosDoTitular.queryKey })).toBeDefined()

    desinscrever()
    await esperar()

    expect(cliente.getQueryCache().find({ queryKey: m.privacidade.consultaPedidosDoTitular.queryKey })).toBeUndefined()
    cliente.unmount()
  })
})
