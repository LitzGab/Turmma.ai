import { describe, expect, it } from 'vitest'
import {
  ESCOLAS_POR_PAGINA,
  esquemaConsultaDoPainel,
  esquemaPedidoConviteDaCoordenacao,
  esquemaPedidoCriarEscola,
  esquemaPedidoCriarRede,
  esquemaRespostaConviteDaCoordenacao,
  esquemaRespostaCriadoNoPainel,
  esquemaRespostaEscolasDoPainel,
  esquemaRespostaRedesDoPainel,
  esquemaRespostaUsoDoPainel,
  MAXIMA_PAGINA_DO_PAINEL,
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

  it('a consulta da lista e do uso: página de 1 em diante e ordem nome ou uso, com os padrões; estrita, sem escola nem filtro', () => {
    expect(esquemaConsultaDoPainel.parse({})).toStrictEqual({ pagina: 1, ordem: 'nome' })
    expect(esquemaConsultaDoPainel.parse({ pagina: '3', ordem: 'uso' })).toStrictEqual({ pagina: 3, ordem: 'uso' })
    expect(esquemaConsultaDoPainel.parse({ pagina: String(MAXIMA_PAGINA_DO_PAINEL) }).pagina).toBe(MAXIMA_PAGINA_DO_PAINEL)
    for (const pagina of ['0', '-1', '1.5', 'x', '', String(MAXIMA_PAGINA_DO_PAINEL + 1), ['1', '2']]) expect(esquemaConsultaDoPainel.safeParse({ pagina }).success, String(pagina)).toBe(false)
    for (const ordem of ['Nome', 'id', 'requisicoes', ['nome', 'uso']]) expect(esquemaConsultaDoPainel.safeParse({ ordem }).success, String(ordem)).toBe(false)
    for (const aMais of [{ escolaId: V4 }, { redeId: V4 }, { limite: '100' }]) expect(esquemaConsultaDoPainel.safeParse(aMais).success).toBe(false)
  })

  it('a resposta da lista é estrita: só id, nome, endereço, rede, estado, convite e número, até 25 por página', () => {
    const item = { id: V7, nome: 'Colégio Sintético', slug: 'colegio-sintetico', rede: { id: REDE, nome: 'Rede Sintética' }, estado: 'pendente', conviteId: V4, turmas: 2, professores: 3, alunos: 40 }
    const pagina = { itens: [item], pagina: 1, total: 1 }
    expect(esquemaRespostaEscolasDoPainel.safeParse(pagina).success).toBe(true)
    const { conviteId: _semConvite, ...semConvite } = item
    expect(esquemaRespostaEscolasDoPainel.safeParse({ ...pagina, itens: [{ ...semConvite, estado: 'sem_convite' }] }).success).toBe(true)
    for (const aMais of [{ coordenacao: 'Coordenação Sintética' }, { email: 'coordenacao@escola.invalid' }, { alunosNomes: [] }]) {
      expect(esquemaRespostaEscolasDoPainel.safeParse({ ...pagina, itens: [{ ...item, ...aMais }] }).success).toBe(false)
    }
    expect(esquemaRespostaEscolasDoPainel.safeParse({ ...pagina, itens: [{ ...item, rede: { ...item.rede, tipo: 'grupo' } }] }).success).toBe(false)
    expect(esquemaRespostaEscolasDoPainel.safeParse({ ...pagina, itens: [{ ...item, estado: 'ativo' }] }).success).toBe(false)
    expect(esquemaRespostaEscolasDoPainel.safeParse({ ...pagina, itens: [{ ...item, alunos: -1 }] }).success).toBe(false)
    expect(esquemaRespostaEscolasDoPainel.safeParse({ ...pagina, itens: Array.from({ length: ESCOLAS_POR_PAGINA + 1 }, () => item) }).success).toBe(false)
  })

  it('a resposta do uso é estrita: id, nome, dia e mês com as três medidas, e as datas de referência', () => {
    const periodo = { requisicoes: 10, jobs: 2, bytesStorage: 1_048_576 }
    const resposta = { itens: [{ id: V7, nome: 'Colégio Sintético', dia: periodo, mes: periodo }], pagina: 1, total: 1, dia: '2026-09-23', mes: '2026-09' }
    expect(esquemaRespostaUsoDoPainel.safeParse(resposta).success).toBe(true)
    expect(esquemaRespostaUsoDoPainel.safeParse({ ...resposta, itens: [{ ...resposta.itens[0], slug: 'x' }] }).success).toBe(false)
    expect(esquemaRespostaUsoDoPainel.safeParse({ ...resposta, itens: [{ ...resposta.itens[0], dia: { ...periodo, custo: 1 } }] }).success).toBe(false)
    for (const dia of ['2026-02-30', '23/09/2026', '2026-9-23']) expect(esquemaRespostaUsoDoPainel.safeParse({ ...resposta, dia }).success, dia).toBe(false)
    for (const mes of ['2026-13', '2026-9', '2026-09-01']) expect(esquemaRespostaUsoDoPainel.safeParse({ ...resposta, mes }).success, mes).toBe(false)
  })
})
