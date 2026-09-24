import { describe, expect, it } from 'vitest'
import {
  esquemaPedidoConviteDaCoordenacao,
  esquemaPedidoCriarEscola,
  esquemaPedidoCriarRede,
  esquemaRespostaConviteDaCoordenacao,
  esquemaRespostaCriadoNoPainel,
  esquemaRespostaRedesDoPainel,
  MAXIMO_DE_REDES_DO_PAINEL,
} from './painel.js'

const V4 = '3f1c8a52-6b0e-4d7a-9c21-5e8f0a1b2c3d'
const V7 = '0192a4c0-5b1e-7c3d-8e4f-a0b1c2d3e4f5'
const REDE = '0192a4c0-5b1e-7c3d-8e4f-a0b1c2d3e4f6'

const rede = { id: V4, nome: 'Rede Sintética', tipo: 'grupo' }
const escola = { id: V7, redeId: REDE, nome: 'Colégio Sintético', slug: 'colegio-sintetico' }

describe('contratos do painel da operação (Tech Spec da A0b, seção 4)', () => {
  it('o id do pedido é UUID v4 ou v7: sorteado, nunca escolhido à mão (regra 10, item 7)', () => {
    expect(esquemaPedidoCriarRede.safeParse(rede).success).toBe(true)
    expect(esquemaPedidoCriarRede.safeParse({ ...rede, id: V7 }).success).toBe(true)
    for (const id of ['00000000-0000-0000-0000-000000000000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8', '1', 'rede-1']) {
      expect(esquemaPedidoCriarRede.safeParse({ ...rede, id }).success, id).toBe(false)
      expect(esquemaPedidoCriarEscola.safeParse({ ...escola, id }).success, id).toBe(false)
    }
  })

  it('E12 (contrato): campo a mais, como autor, é recusado nos dois corpos', () => {
    expect(esquemaPedidoCriarRede.safeParse({ ...rede, autor: 'outra-pessoa' }).success).toBe(false)
    expect(esquemaPedidoCriarEscola.safeParse({ ...escola, autor: 'outra-pessoa' }).success).toBe(false)
    expect(esquemaPedidoCriarEscola.safeParse({ ...escola, escolaId: V4 }).success).toBe(false)
  })

  it('o tipo da rede é um dos três, e o slug tem o formato e o tamanho do check do banco', () => {
    expect(esquemaPedidoCriarRede.safeParse({ ...rede, tipo: 'estado' }).success).toBe(false)
    for (const slug of ['Colegio', 'colegio--x', '-colegio', 'colegio-', 'colégio', `a${'b'.repeat(63)}`, '']) {
      expect(esquemaPedidoCriarEscola.safeParse({ ...escola, slug }).success, slug).toBe(false)
    }
    expect(esquemaPedidoCriarEscola.safeParse({ ...escola, slug: `a${'b'.repeat(62)}` }).success).toBe(true)
  })

  it('o nome é de uma linha, sem espaço nas pontas e até 200', () => {
    expect(esquemaPedidoCriarRede.parse({ ...rede, nome: '  Rede Sintética  ' }).nome).toBe('Rede Sintética')
    for (const nome of ['', '   ', 'Rede\nSintética', 'x'.repeat(201)]) expect(esquemaPedidoCriarRede.safeParse({ ...rede, nome }).success, nome).toBe(false)
  })

  it('as respostas são estritas: só o id, e a rede só com id, nome e tipo, até 200', () => {
    expect(esquemaRespostaCriadoNoPainel.safeParse({ id: V4, slug: 'x' }).success).toBe(false)
    expect(esquemaRespostaRedesDoPainel.safeParse({ itens: [{ ...rede, ipsSaida: [] }] }).success).toBe(false)
    const muitas = Array.from({ length: MAXIMO_DE_REDES_DO_PAINEL + 1 }, () => rede)
    expect(esquemaRespostaRedesDoPainel.safeParse({ itens: muitas }).success).toBe(false)
    expect(esquemaRespostaRedesDoPainel.safeParse({ itens: muitas.slice(1) }).success).toBe(true)
  })

  it('o pedido do convite da coordenação é estrito: só nome e e-mail, e o e-mail sai sem espaço e em minúsculas', () => {
    const pedido = { nome: 'Coordenação Sintética', email: '  Coordenacao@Escola.Invalid ' }
    expect(esquemaPedidoConviteDaCoordenacao.parse(pedido)).toStrictEqual({ nome: 'Coordenação Sintética', email: 'coordenacao@escola.invalid' })
    for (const aMais of [{ autor: 'outra-pessoa' }, { escolaId: V4 }, { token: 'x' }]) expect(esquemaPedidoConviteDaCoordenacao.safeParse({ ...pedido, ...aMais }).success).toBe(false)
    for (const email of ['', 'sem-arroba', '@escola.invalid', `${'a'.repeat(250)}@x.io`]) expect(esquemaPedidoConviteDaCoordenacao.safeParse({ ...pedido, email }).success, email).toBe(false)
    for (const nome of ['', 'Linha\nDupla', 'x'.repeat(201)]) expect(esquemaPedidoConviteDaCoordenacao.safeParse({ ...pedido, nome }).success, nome).toBe(false)
  })

  it('a resposta do convite é estrita: o id e o token de 32 bytes em base64url, e nada da pessoa', () => {
    const token = 'A'.repeat(42) + '_'
    expect(esquemaRespostaConviteDaCoordenacao.safeParse({ conviteId: V7, token }).success).toBe(true)
    expect(esquemaRespostaConviteDaCoordenacao.safeParse({ conviteId: V7, token, email: 'coordenacao@escola.invalid' }).success).toBe(false)
    for (const invalido of ['A'.repeat(42), 'A'.repeat(44), `${'A'.repeat(42)}=`, `${'A'.repeat(42)}+`]) {
      expect(esquemaRespostaConviteDaCoordenacao.safeParse({ conviteId: V7, token: invalido }).success, invalido).toBe(false)
    }
  })
})
