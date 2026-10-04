import { randomUUID } from 'node:crypto'
import type { Page, Route } from '@playwright/test'
import type { Entrega, MensagemDaConversa, RespostaArtefato, RespostaExecucao, ResultadoDaExecucao } from '../../packages/shared/src/index.ts'
import type { ChaveDeFuncao } from '../../packages/shared/src/time/funcoes.ts'
import { montarTime } from '../../packages/shared/src/time/time.ts'

/**
 * A API das telas do Assistente (A2), **simulada na página** (`page.route`): time, conversa, ferramentas, artefatos,
 * entregas e execuções. As rotas de verdade são do pacote P, que nasce em paralelo; o contrato já existe
 * (`docs/mvp-contratos.md`), e é contra ele que estas respostas são escritas. O que é da A1 (a sessão, o `/v1/eu`, os
 * vínculos) continua vindo da API de verdade.
 *
 * O e2e do fluxo inteiro, contra a API real, é outro arquivo, da rodada em que o pacote P for integrado.
 */

export interface PedidoRegistrado {
  readonly metodo: string
  readonly caminho: string
  readonly corpo: unknown
}

interface Resposta {
  readonly status: number
  readonly corpo?: unknown
  /** O PDF do artefato: binário, com `Content-Disposition: attachment`. */
  readonly pdf?: string
}

type Rota = 'time' | 'conversa' | 'mensagens' | 'execucao' | 'gerar' | 'artefatos' | 'artefato' | 'renomear' | 'pdf' | 'adaptar' | 'entregas' | 'decidir' | 'materiais'

const ROTAS: readonly { readonly rota: Rota; readonly metodo: string; readonly caminho: RegExp }[] = [
  { rota: 'time', metodo: 'GET', caminho: /^\/v1\/time$/ },
  { rota: 'conversa', metodo: 'GET', caminho: /^\/v1\/assistente\/conversa$/ },
  { rota: 'mensagens', metodo: 'POST', caminho: /^\/v1\/assistente\/mensagens$/ },
  { rota: 'execucao', metodo: 'GET', caminho: /^\/v1\/execucoes\/([^/]+)$/ },
  { rota: 'gerar', metodo: 'POST', caminho: /^\/v1\/ferramentas\/([^/]+)\/gerar$/ },
  { rota: 'artefatos', metodo: 'GET', caminho: /^\/v1\/artefatos$/ },
  { rota: 'pdf', metodo: 'GET', caminho: /^\/v1\/artefatos\/([^/]+)\/pdf$/ },
  { rota: 'adaptar', metodo: 'POST', caminho: /^\/v1\/artefatos\/([^/]+)\/adaptar$/ },
  { rota: 'artefato', metodo: 'GET', caminho: /^\/v1\/artefatos\/([^/]+)$/ },
  { rota: 'renomear', metodo: 'PATCH', caminho: /^\/v1\/artefatos\/([^/]+)$/ },
  { rota: 'entregas', metodo: 'GET', caminho: /^\/v1\/entregas$/ },
  { rota: 'decidir', metodo: 'POST', caminho: /^\/v1\/entregas\/([^/]+)\/decidir$/ },
  { rota: 'materiais', metodo: 'GET', caminho: /^\/v1\/materiais$/ },
]

export function erroDaApi(status: number, codigo: string): Resposta {
  return { status, corpo: { erro: { codigo, mensagem: 'x', requisicaoId: randomUUID() } } }
}

/** Uma porta que segura a resposta até o teste abrir: é como o teste vê o estado "carregando" e o clique duplo. */
export function portao(): { readonly aberta: Promise<void>; readonly abrir: () => void } {
  let abrir: () => void = () => undefined
  const aberta = new Promise<void>((resolver) => {
    abrir = resolver
  })
  return { aberta, abrir }
}

export const MATERIAL = randomUUID()
export const TITULO_DO_MATERIAL = 'Química 2, cap. 7 — Estequiometria'
/** A professora que decide, nas respostas simuladas: nome inventado, de ninguém. */
export const QUEM_DECIDE = { id: randomUUID(), nome: 'Camila Souza sintética' }

export class ApiDoAssistente {
  conversa: MensagemDaConversa[] = []
  entregas: Entrega[] = []
  artefatos: RespostaArtefato[] = []
  suspensas = new Set<ChaveDeFuncao>()
  readonly execucoes = new Map<string, RespostaExecucao>()
  /** Todo `POST` e `PATCH` que a tela mandou, na ordem. */
  readonly pedidos: PedidoRegistrado[] = []
  /** Quantas vezes a tela consultou cada execução. */
  readonly consultasDeExecucao: string[] = []
  private readonly trocadas = new Map<Rota, (pedido: { corpo: unknown; url: URL; ids: readonly string[] }) => Resposta | Promise<Resposta>>()

  /** Troca a resposta de uma rota: o erro, a resposta segurada. Sem função, volta a de sempre. */
  trocar(rota: Rota, resposta?: (pedido: { corpo: unknown; url: URL; ids: readonly string[] }) => Resposta | Promise<Resposta>): void {
    if (resposta === undefined) this.trocadas.delete(rota)
    else this.trocadas.set(rota, resposta)
  }

  /** Os pedidos de uma rota, pelo caminho. */
  pedidosEm(caminho: RegExp): PedidoRegistrado[] {
    return this.pedidos.filter((pedido) => caminho.test(pedido.caminho))
  }

  /** A última execução que a tela pediu. */
  ultimaExecucao(): string {
    const id = [...this.execucoes.keys()].at(-1)
    if (id === undefined) throw new Error('a tela ainda não pediu nenhuma execução')
    return id
  }

  concluir(execucaoId: string, resultado: ResultadoDaExecucao): void {
    const atual = this.execucoes.get(execucaoId)
    if (atual === undefined) throw new Error('execução desconhecida')
    this.execucoes.set(execucaoId, { ...atual, estado: 'concluida', resultado, erro: null })
  }

  falhar(execucaoId: string, erro: NonNullable<RespostaExecucao['erro']>): void {
    const atual = this.execucoes.get(execucaoId)
    if (atual === undefined) throw new Error('execução desconhecida')
    this.execucoes.set(execucaoId, { ...atual, estado: 'falhou', resultado: null, erro })
  }

  private aceitar(tarefa: RespostaExecucao['tarefa']): Resposta {
    const id = randomUUID()
    this.execucoes.set(id, { id, tarefa, estado: 'pendente', resultado: null, erro: null })
    return { status: 202, corpo: { execucaoId: id } }
  }

  private deSempre(rota: Rota, { corpo, url, ids }: { corpo: unknown; url: URL; ids: readonly string[] }): Resposta {
    const id = ids[0] ?? ''
    if (rota === 'time') return { status: 200, corpo: montarTime(this.suspensas) }
    if (rota === 'conversa') return { status: 200, corpo: { mensagens: this.conversa } }
    if (rota === 'mensagens') return this.aceitar('propor_ferramenta')
    if (rota === 'gerar') return this.aceitar(id === 'plano_de_aula' ? 'gerar_plano_de_aula' : 'gerar_atividade_objetiva')
    if (rota === 'adaptar') return this.aceitar('adaptar_atividade')
    if (rota === 'execucao') {
      this.consultasDeExecucao.push(id)
      const execucao = this.execucoes.get(id)
      return execucao === undefined ? erroDaApi(404, 'NAO_ENCONTRADO') : { status: 200, corpo: execucao }
    }
    if (rota === 'artefatos')
      return { status: 200, corpo: { itens: this.artefatos.map(({ conteudo: _conteudo, versoesAdaptadas: _versoes, aplicacoes: _aplicacoes, ...resumido }) => resumido) } }
    if (rota === 'artefato' || rota === 'renomear' || rota === 'pdf') {
      const artefato = this.artefatos.find((item) => item.id === id)
      if (artefato === undefined) return erroDaApi(404, 'NAO_ENCONTRADO')
      if (rota === 'pdf') return { status: 200, pdf: 'atividade-sintetica.pdf' }
      if (rota === 'artefato') return { status: 200, corpo: artefato }
      const titulo = typeof corpo === 'object' && corpo !== null && 'titulo' in corpo && typeof corpo.titulo === 'string' ? corpo.titulo : artefato.titulo
      const renomeado = { ...artefato, titulo, conteudo: { ...artefato.conteudo, titulo } }
      this.artefatos = this.artefatos.map((item) => (item.id === id ? renomeado : item))
      return { status: 200, corpo: renomeado }
    }
    if (rota === 'entregas') {
      const estado = url.searchParams.get('estado')
      const turma = url.searchParams.get('turmaId')
      return { status: 200, corpo: { itens: this.entregas.filter((entrega) => (estado === null || entrega.estado === estado) && (turma === null || entrega.turmaId === turma)) } }
    }
    if (rota === 'decidir') {
      const entrega = this.entregas.find((item) => item.id === id)
      if (entrega === undefined) return erroDaApi(404, 'NAO_ENCONTRADO')
      if (entrega.estado !== 'pendente') return erroDaApi(409, 'ENTREGA_JA_DECIDIDA')
      const rejeitar = typeof corpo === 'object' && corpo !== null && 'decisao' in corpo && corpo.decisao === 'rejeitar'
      const justificativa = rejeitar && typeof corpo === 'object' && corpo !== null && 'justificativa' in corpo && typeof corpo.justificativa === 'string' ? corpo.justificativa : null
      const decidida: Entrega = { ...entrega, estado: rejeitar ? 'rejeitada' : 'aprovada', decididaEm: new Date().toISOString(), decididaPor: QUEM_DECIDE, justificativa }
      this.entregas = this.entregas.map((item) => (item.id === id ? decidida : item))
      return { status: 200, corpo: decidida }
    }
    return {
      status: 200,
      corpo: {
        itens: [
          { id: MATERIAL, titulo: TITULO_DO_MATERIAL, disciplinaId: randomUUID(), titularidade: 'escola', licenciante: null, licenca: 'autoria_da_escola', estado: 'pronto', falha: null, paginas: 6, trechos: 6, enviadoEm: '2026-10-01T12:00:00.000Z' },
        ],
      },
    }
  }

  private async atender(route: Route): Promise<void> {
    const pedido = route.request()
    const url = new URL(pedido.url())
    const metodo = pedido.method()
    const achada = ROTAS.map((rota) => ({ ...rota, ids: rota.caminho.exec(url.pathname) })).find((rota) => rota.metodo === metodo && rota.ids !== null)
    if (achada === undefined || achada.ids === null) {
      // Rota destas telas que o teste não conhece: falha alto, em vez de bater numa API que ainda não a tem.
      await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify(erroDaApi(500, 'ERRO_INTERNO').corpo) })
      return
    }
    const corpo: unknown = metodo === 'GET' ? undefined : pedido.postDataJSON()
    if (metodo !== 'GET') this.pedidos.push({ metodo, caminho: url.pathname, corpo })
    const entrada = { corpo, url, ids: achada.ids.slice(1) }
    const resposta = await (this.trocadas.get(achada.rota)?.(entrada) ?? this.deSempre(achada.rota, entrada))
    if (resposta.pdf !== undefined) {
      await route.fulfill({ status: resposta.status, contentType: 'application/pdf', headers: { 'Content-Disposition': `attachment; filename="${resposta.pdf}"` }, body: '%PDF-1.7 sintetico' })
      return
    }
    await route.fulfill({ status: resposta.status, contentType: 'application/json', body: resposta.corpo === undefined ? '' : JSON.stringify(resposta.corpo) })
  }

  /** A resposta de sempre de uma rota, para o teste que troca a rota só por um tempo (segura e depois responde). */
  responder(rota: Rota, pedido: { corpo: unknown; url: URL; ids: readonly string[] }): Resposta {
    return this.deSempre(rota, pedido)
  }

  async ligar(page: Page): Promise<void> {
    await page.route(/\/v1\/(time|assistente|execucoes|ferramentas|artefatos|entregas|materiais)(\/|\?|$)/, (route) => this.atender(route))
  }
}

/** Liga a API simulada na página, antes de a professora entrar: nenhuma tela chega a pedir a rota que ainda não existe. */
export async function simularAssistente(page: Page): Promise<ApiDoAssistente> {
  const api = new ApiDoAssistente()
  await api.ligar(page)
  return api
}

const citacao = (pagina: number, trecho: string) => ({ materialId: MATERIAL, pagina, trecho })

/** Uma atividade objetiva sintética, com a página citada em cada questão. */
export function atividadeSintetica(turmaId: string, disciplinaId: string, campos: Partial<RespostaArtefato> = {}): RespostaArtefato {
  const titulo = campos.titulo ?? 'Atividade de estequiometria'
  return {
    id: randomUUID(),
    tipo: 'atividade_objetiva',
    titulo,
    turmaId,
    disciplinaId,
    origemId: null,
    adaptacao: null,
    entrega: null,
    criadoEm: '2026-10-05T13:00:00.000Z',
    conteudo: {
      tipo: 'atividade_objetiva',
      titulo,
      questoes: [
        {
          enunciado: 'Qual a massa de CO₂ formada na queima completa de 24 g de carbono?',
          alternativas: ['44 g', '88 g', '24 g', '12 g'],
          gabarito: 1,
          habilidade: { codigo: 'QUI.EM.04', descricao: 'Usar a proporção da equação balanceada para calcular massa, volume ou quantidade de matéria.' },
          citacao: citacao(142, 'Na combustão completa, cada mol de carbono forma um mol de dióxido de carbono.'),
          explicacao: '24 g de carbono são 2 mol, que formam 2 mol de CO₂, ou 88 g.',
        },
        {
          enunciado: 'Em uma reação com 2 mol de H₂ e 2 mol de O₂, qual é o reagente limitante?',
          alternativas: ['O oxigênio', 'A água', 'O hidrogênio', 'Nenhum dos dois'],
          gabarito: 2,
          habilidade: { codigo: 'QUI.EM.05', descricao: 'Identificar o reagente limitante e o reagente em excesso.' },
          citacao: citacao(145, 'O reagente limitante é o que acaba primeiro e determina quanto produto se forma.'),
          explicacao: 'São precisos 2 mol de H₂ para cada mol de O₂: o hidrogênio acaba primeiro.',
        },
      ],
    },
    versoesAdaptadas: [],
    aplicacoes: [],
    ...campos,
  }
}

/** A versão adaptada de uma atividade, com a entrega dela no estado dado. */
export function versaoAdaptada(origem: RespostaArtefato, estado: Entrega['estado'] = 'pendente'): { artefato: RespostaArtefato; entrega: Entrega } {
  const decidida = estado !== 'pendente'
  const decididaEm = decidida ? '2026-10-05T13:42:00.000Z' : null
  const entregaId = randomUUID()
  const artefato: RespostaArtefato = {
    ...origem,
    id: randomUUID(),
    titulo: `${origem.titulo} (adaptada)`,
    origemId: origem.id,
    adaptacao: { tipos: ['fonte_ampliada', 'tempo_adicional'], tempoExtraPercentual: 50 },
    entrega: { id: entregaId, estado, decididaEm },
    conteudo: origem.conteudo.tipo === 'atividade_objetiva' ? { ...origem.conteudo, titulo: `${origem.titulo} (adaptada)`, adaptacao: { tipos: ['fonte_ampliada', 'tempo_adicional'], tempoExtraPercentual: 50 } } : origem.conteudo,
    versoesAdaptadas: [],
    aplicacoes: [],
  }
  const entrega: Entrega = {
    id: entregaId,
    tipo: 'versao_adaptada',
    funcao: 'adaptacao',
    estado,
    turmaId: origem.turmaId,
    titulo: origem.titulo,
    artefatoId: artefato.id,
    atividadeAplicadaId: null,
    criadaEm: '2026-10-05T13:40:00.000Z',
    decididaEm,
    decididaPor: decidida ? QUEM_DECIDE : null,
    justificativa: estado === 'rejeitada' ? 'A questão 2 perdeu o enunciado.' : null,
  }
  return { artefato, entrega }
}

/** O resumo de um artefato, como ele aparece na lista de versões da origem. */
export function resumoDoArtefato({ conteudo: _conteudo, versoesAdaptadas: _versoes, aplicacoes: _aplicacoes, ...resumido }: RespostaArtefato): RespostaArtefato['versoesAdaptadas'][number] {
  return resumido
}

/** Uma mensagem da professora e a resposta do Assistente, como a conversa as devolve. */
export function mensagemDela(texto: string, turmaId: string, disciplinaId: string): MensagemDaConversa {
  return { id: randomUUID(), criadaEm: new Date().toISOString(), autor: 'usuario', tipo: 'texto', texto, turmaId, disciplinaId }
}

export function respostaComPagina(texto: string): Extract<MensagemDaConversa, { autor: 'agente'; tipo: 'texto' }> {
  return { id: randomUUID(), criadaEm: new Date().toISOString(), autor: 'agente', tipo: 'texto', texto, citacoes: [citacao(142, 'Na combustão completa, cada mol de carbono forma um mol de dióxido de carbono.')] }
}

export function propostaDeAtividade(turmaId: string, disciplinaId: string): Extract<MensagemDaConversa, { tipo: 'proposta_de_ferramenta' }> {
  return {
    id: randomUUID(),
    criadaEm: new Date().toISOString(),
    autor: 'agente',
    tipo: 'proposta_de_ferramenta',
    texto: 'Posso fazer isso com a ferramenta Atividade objetiva, ou só conversar.',
    proposta: { ferramenta: 'atividade_objetiva', parametros: { turmaId, disciplinaId, tema: 'Estequiometria', quantidade: 10 } },
  }
}
