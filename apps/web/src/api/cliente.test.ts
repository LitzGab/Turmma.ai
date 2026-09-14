import { CodigoDeErro, esquemaRespostaAvisos, MENSAGENS_DE_ERRO } from '@educa/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { deveTentarDeNovo } from './cliente-de-consultas'
import { buscarDaApi, ErroDaApi, mensagemDoErro } from './cliente'

function responder(status: number, corpo: unknown): void {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(typeof corpo === 'string' ? corpo : JSON.stringify(corpo), { status }))))
}

async function erroDe(promessa: Promise<unknown>): Promise<ErroDaApi> {
  const erro = await promessa.then(
    () => undefined,
    (motivo: unknown) => motivo,
  )
  expect(erro).toBeInstanceOf(ErroDaApi)
  return erro as ErroDaApi
}

const envelope = (codigo: string) => ({ erro: { codigo, mensagem: 'texto da API', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buscarDaApi', () => {
  it('devolve o corpo validado pelo contrato de packages/shared', async () => {
    responder(200, { itens: [] })
    await expect(buscarDaApi('/v1/sistema/avisos', esquemaRespostaAvisos)).resolves.toEqual({ itens: [] })
  })

  it('o código vem do envelope, não do status: 500 com LIMITE_EXCEDIDO é limite excedido', async () => {
    responder(500, envelope('LIMITE_EXCEDIDO'))
    expect((await erroDe(buscarDaApi('/x', esquemaRespostaAvisos))).codigo).toBe(CodigoDeErro.LIMITE_EXCEDIDO)
  })

  it('sem envelope reconhecível, deduz pelo status só o que o status diz, e o resto é erro interno', async () => {
    const casos: [number, unknown, CodigoDeErro][] = [
      [502, '<html>Bad Gateway</html>', CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO],
      [503, {}, CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO],
      [429, '', CodigoDeErro.LIMITE_EXCEDIDO],
      [500, envelope('CODIGO_QUE_NAO_EXISTE'), CodigoDeErro.ERRO_INTERNO],
      [404, envelope('toString'), CodigoDeErro.ERRO_INTERNO],
    ]
    for (const [status, corpo, esperado] of casos) {
      responder(status, corpo)
      expect((await erroDe(buscarDaApi('/x', esquemaRespostaAvisos))).codigo, `${status}`).toBe(esperado)
    }
  })

  it('sem rede, é indisponível: a tela diz para tentar de novo em instantes', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))
    expect((await erroDe(buscarDaApi('/x', esquemaRespostaAvisos))).codigo).toBe(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
  })

  it('busca cancelada pelo TanStack Query sai como cancelamento, e não vira erro de indisponível na tela', async () => {
    const controle = new AbortController()
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new DOMException('abortada', 'AbortError'))))
    controle.abort()
    const erro = await buscarDaApi('/x', esquemaRespostaAvisos, controle.signal).catch((motivo: unknown) => motivo)
    expect(erro).not.toBeInstanceOf(ErroDaApi)
    expect(erro).toMatchObject({ name: 'AbortError' })
  })

  it('200 fora do contrato vira erro interno, e não dado quebrado na tela', async () => {
    responder(200, { itens: [{ id: 'x', texto: 'sem data' }] })
    expect((await erroDe(buscarDaApi('/x', esquemaRespostaAvisos))).codigo).toBe(CodigoDeErro.ERRO_INTERNO)
  })
})

describe('mensagemDoErro', () => {
  it('usa o catálogo pt-BR pelo código, e erro desconhecido cai na mensagem de erro interno', () => {
    expect(mensagemDoErro(new ErroDaApi(CodigoDeErro.LIMITE_EXCEDIDO))).toBe(MENSAGENS_DE_ERRO.LIMITE_EXCEDIDO)
    expect(mensagemDoErro(new Error('HTTP 500'))).toBe(MENSAGENS_DE_ERRO.ERRO_INTERNO)
    expect(mensagemDoErro(new Error('HTTP 500'))).not.toContain('500')
  })
})

describe('deveTentarDeNovo', () => {
  it('repete uma vez o que o tempo resolve, e nunca o limite excedido nem a entrada inválida', () => {
    expect(deveTentarDeNovo(0, new ErroDaApi(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO))).toBe(true)
    expect(deveTentarDeNovo(1, new ErroDaApi(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO))).toBe(false)
    expect(deveTentarDeNovo(0, new ErroDaApi(CodigoDeErro.LIMITE_EXCEDIDO))).toBe(false)
    expect(deveTentarDeNovo(0, new ErroDaApi(CodigoDeErro.ENTRADA_INVALIDA))).toBe(false)
    expect(deveTentarDeNovo(0, new ErroDaApi(CodigoDeErro.NAO_AUTENTICADO))).toBe(false)
    expect(deveTentarDeNovo(0, new ErroDaApi(CodigoDeErro.TEMPO_ESGOTADO))).toBe(true)
    expect(deveTentarDeNovo(0, new ErroDaApi(CodigoDeErro.ERRO_INTERNO))).toBe(true)
    expect(deveTentarDeNovo(0, new TypeError('falha fora do cliente'))).toBe(true)
  })
})
