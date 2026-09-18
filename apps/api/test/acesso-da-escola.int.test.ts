import { executarNoContexto } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MedidorDeTeste } from '../../../tools/testes/metricas.ts'
import { AcessoDaEscolaRepository } from '../src/sessao/acesso-publico.repository.js'
import { subirApi, type ApiDeTeste } from './api-com-sessao.js'
import { BancadaDeSessoes } from './sessao-de-teste.js'

describe('GET /v1/escolas/:slug/acesso: o que a tela /e/:slug mostra antes do login', () => {
  const bancada = new BancadaDeSessoes()
  const medidor = new MedidorDeTeste()
  const linhasDeLog: string[] = []
  let api: ApiDeTeste

  beforeAll(async () => {
    api = await subirApi(medidor.medidor, {}, linhasDeLog)
  })

  afterAll(async () => {
    await api.app.close()
    await bancada.fechar()
    await medidor.encerrar()
  })

  /** Uma escola com nome próprio, para a resposta de uma nunca passar pela da outra. */
  async function escolaComNome(nome: string): Promise<{ escolaId: string; slug: string }> {
    const escolaId = await bancada.escola()
    await bancada.pool.query('update escola set nome = $1 where id = $2', [nome, escolaId])
    return { escolaId, slug: await bancada.slugDe(escolaId) }
  }

  async function acesso(slug: string): Promise<{ status: number; corpo: Record<string, unknown> & { erro?: { codigo?: string } } }> {
    const resposta = await fetch(`${api.url}/v1/escolas/${encodeURIComponent(slug)}/acesso`)
    return { status: resposta.status, corpo: (await resposta.json()) as Record<string, unknown> & { erro?: { codigo?: string } } }
  }

  it('caminho feliz e privacidade: o slug da escola devolve só o nome e a lista de provedores (vazia até a 13.0), sem domínio, tenant nem id', async () => {
    const { slug } = await escolaComNome(`Colégio Sintético ${randomUUID()}`)
    const resposta = await acesso(slug)
    expect(resposta.status).toBe(200)
    expect(Object.keys(resposta.corpo).sort()).toEqual(['nome', 'provedores'])
    expect(resposta.corpo).toEqual({ nome: expect.stringMatching(/^Colégio Sintético /), provedores: [] })
  })

  it('isolamento: o slug de A devolve o nome de A e o de B o de B, e o slug inexistente ou fora do formato responde NAO_ENCONTRADO', async () => {
    const nomeDeA = `Escola A ${randomUUID()}`
    const nomeDeB = `Escola B ${randomUUID()}`
    const a = await escolaComNome(nomeDeA)
    const b = await escolaComNome(nomeDeB)
    expect((await acesso(a.slug)).corpo).toEqual({ nome: nomeDeA, provedores: [] })
    expect((await acesso(b.slug)).corpo).toEqual({ nome: nomeDeB, provedores: [] })
    for (const slug of [`nao-existe-${randomUUID()}`, 'Com_Formato_Errado', 'a'.repeat(64)]) {
      const resposta = await acesso(slug)
      expect(resposta.status, slug).toBe(404)
      expect(resposta.corpo.erro?.codigo, slug).toBe(CodigoDeErro.NAO_ENCONTRADO)
    }
  })

  it('isolamento: o repository lê o nome só da escola do contexto; com a escola de A lê A, e com uma escola que não existe não lê nenhuma', async () => {
    const nomeDeA = `Escola A ${randomUUID()}`
    const a = await escolaComNome(nomeDeA)
    await escolaComNome(`Escola B ${randomUUID()}`)
    const repositorio = new AcessoDaEscolaRepository(bancada.banco)
    expect(await executarNoContexto({ requisicaoId: randomUUID(), escolaId: a.escolaId }, () => repositorio.nome())).toBe(nomeDeA)
    expect(await executarNoContexto({ requisicaoId: randomUUID(), escolaId: randomUUID() }, () => repositorio.nome())).toBeUndefined()
    await expect(executarNoContexto({ requisicaoId: randomUUID() }, () => repositorio.nome())).rejects.toThrow('consulta com escopo sem escola no contexto')
  })

  it('privacidade: o log não traz o slug consultado', async () => {
    const { slug } = await escolaComNome(`Escola ${randomUUID()}`)
    const inexistente = `slug-digitado-${randomUUID()}`
    await acesso(slug)
    await acesso(inexistente)
    const log = linhasDeLog.join('\n')
    expect(log).toContain('http.erro')
    expect(log).not.toContain(slug)
    expect(log).not.toContain(inexistente)
  })
})
