import { MAXIMA_PAGINA_DO_PAINEL } from '@educa/shared'
import { QueryClient } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A API do painel na web: a página e a ordem da barra, o `GET` da lista com elas, e as criações com o id do pedido. A rede
 * é falsa; a regra sob teste é a da web. O módulo é recarregado em cada teste, como uma aba recém-aberta.
 */
const importar = async () => ({ sessao: await import('./sessao'), painel: await import('./painel') })
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

const ESCOLA = {
  id: '5b1d7a3e-2c4f-4a8b-9d6e-1f0a2b3c4d5e',
  nome: 'Colégio sintético',
  slug: 'colegio-sintetico',
  rede: { id: '3f2a8c1e-6b7d-4e9a-8c21-5d4f0e9b7a61', nome: 'Rede sintética' },
  estado: 'sem_convite',
  turmas: 0,
  professores: 0,
  alunos: 0,
}

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
      const resposta = fila.shift()
      if (resposta === undefined) throw new Error(`chamada sem resposta preparada: ${caminho}`)
      return new Response(resposta.corpo === undefined ? null : JSON.stringify(resposta.corpo), { status: resposta.status })
    }),
  )
  m = await importar()
  // A sessão aberta pelo cookie, como a aba faz ao chegar a `/operacao`: o token fica em memória.
  fila.push({ status: 200, corpo: { token: 'token-de-acesso', expiraEm: new Date(Date.now() + 600_000).toISOString() } })
  await m.sessao.abrirSessaoDeOperadorPeloCookie()
  chamadas.length = 0
})

afterEach(() => {
  vi.unstubAllGlobals()
  expect(fila, 'resposta preparada que nenhuma chamada consumiu').toHaveLength(0)
})

describe('a página e a ordem da barra de endereço (Tech Spec da A0b, seção 9)', () => {
  it('lê a página e a ordem da query string, e a busca escrita volta à mesma consulta', () => {
    expect(m.painel.lerConsultaDaTela('pagina=3&ordem=uso')).toEqual({ pagina: 3, ordem: 'uso' })
    expect(m.painel.lerConsultaDaTela('?ordem=nome&pagina=2')).toEqual({ pagina: 2, ordem: 'nome' })
    expect(m.painel.buscaDaConsulta({ pagina: 3, ordem: 'uso' })).toBe('pagina=3&ordem=uso')
    expect(m.painel.lerConsultaDaTela(m.painel.buscaDaConsulta({ pagina: 7, ordem: 'uso' }))).toEqual({ pagina: 7, ordem: 'uso' })
  })

  it('o que não é página nem ordem do contrato volta ao padrão daquele campo, sem levar o resto junto', () => {
    expect(m.painel.lerConsultaDaTela('')).toEqual({ pagina: 1, ordem: 'nome' })
    for (const pagina of ['0', '-1', '2.5', 'abc', '1e3', ' 2', '02', String(MAXIMA_PAGINA_DO_PAINEL + 1)]) {
      expect(m.painel.lerConsultaDaTela(`pagina=${encodeURIComponent(pagina)}&ordem=uso`)).toEqual({ pagina: 1, ordem: 'uso' })
    }
    expect(m.painel.lerConsultaDaTela(`pagina=${String(MAXIMA_PAGINA_DO_PAINEL)}`)).toEqual({ pagina: MAXIMA_PAGINA_DO_PAINEL, ordem: 'nome' })
    expect(m.painel.lerConsultaDaTela('pagina=4&ordem=USO')).toEqual({ pagina: 4, ordem: 'nome' })
    expect(m.painel.lerConsultaDaTela('pagina=4&ordem=alunos')).toEqual({ pagina: 4, ordem: 'nome' })
  })

  it('o GET da lista leva a página e a ordem da tela, com o token da sessão, e cada consulta tem a sua chave de cache', async () => {
    const resposta = { itens: [ESCOLA], pagina: 2, total: 26 }
    fila.push({ status: 200, corpo: resposta })
    const cliente = new QueryClient()
    const opcoes = m.painel.consultaDasEscolas({ pagina: 2, ordem: 'uso' })
    expect(await cliente.fetchQuery(opcoes)).toEqual(resposta)
    expect(chamadas).toEqual([{ caminho: '/v1/operacao/escolas?pagina=2&ordem=uso', metodo: 'GET', corpo: undefined, autorizacao: 'Bearer token-de-acesso' }])
    expect(opcoes.queryKey).not.toEqual(m.painel.consultaDasEscolas({ pagina: 2, ordem: 'nome' }).queryKey)
    expect(opcoes.queryKey).not.toEqual(m.painel.consultaDasEscolas({ pagina: 1, ordem: 'uso' }).queryKey)
    // A criação invalida todas as páginas das duas ordens pelo prefixo.
    expect(opcoes.queryKey.slice(0, m.painel.CHAVE_DAS_ESCOLAS.length)).toEqual([...m.painel.CHAVE_DAS_ESCOLAS])
  })

  it('a resposta fora do contrato (um campo de pessoa a mais) não chega à tela', async () => {
    fila.push({ status: 200, corpo: { itens: [{ ...ESCOLA, coordenadora: 'Nome de pessoa' }], pagina: 1, total: 1 } })
    await expect(new QueryClient().fetchQuery(m.painel.consultaDasEscolas({ pagina: 1, ordem: 'nome' }))).rejects.toMatchObject({ codigo: 'ERRO_INTERNO' })
  })
})

describe('as criações com o id do pedido', () => {
  it('criar rede e criar escola mandam o pedido inteiro, com o id que veio do diálogo', async () => {
    const rede = { id: '9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d', nome: 'Rede sintética', tipo: 'grupo' as const }
    const escola = { id: '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f', redeId: rede.id, nome: 'Colégio sintético', slug: 'colegio-sintetico' }
    fila.push({ status: 200, corpo: { id: rede.id } }, { status: 200, corpo: { id: escola.id } })
    expect(await m.painel.criarRedeNoPainel(rede)).toEqual({ id: rede.id })
    expect(await m.painel.criarEscolaNoPainel(escola)).toEqual({ id: escola.id })
    expect(chamadas).toEqual([
      { caminho: '/v1/operacao/redes', metodo: 'POST', corpo: rede, autorizacao: 'Bearer token-de-acesso' },
      { caminho: '/v1/operacao/escolas', metodo: 'POST', corpo: escola, autorizacao: 'Bearer token-de-acesso' },
    ])
  })

  it('o CONFLITO do endereço e o 429 com o Retry-After sobem como erro tipado, sem a tela ler texto da API', async () => {
    const escola = { id: '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f', redeId: '9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d', nome: 'Colégio', slug: 'colegio' }
    const envelope = (codigo: string) => ({ erro: { codigo, mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } })
    fila.push({ status: 409, corpo: envelope('CONFLITO') })
    await expect(m.painel.criarEscolaNoPainel(escola)).rejects.toMatchObject({ codigo: 'CONFLITO' })
    vi.mocked(fetch).mockImplementationOnce(async () => new Response(JSON.stringify(envelope('LIMITE_EXCEDIDO')), { status: 429, headers: { 'Retry-After': '12' } }))
    await expect(m.painel.criarEscolaNoPainel(escola)).rejects.toMatchObject({ codigo: 'LIMITE_EXCEDIDO', esperaSegundos: 12 })
  })
})
