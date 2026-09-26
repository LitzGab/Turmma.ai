import { VALIDADE_DO_CONVITE_HORAS_POR_TIPO } from '@educa/nucleo'
import { CodigoDeErro, esquemaRespostaConviteDeProfessor, esquemaRespostaListaDeProfessores, MENSAGENS_DE_ERRO, type RespostaConviteDeProfessor } from '@educa/shared'
import type { Redis } from 'ioredis'
import { createHash, randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { MedidorDeTeste } from '../../../tools/testes/metricas.ts'
import { criarConviteDeCoordenador } from '../src/sessao/convite.service.js'
import { HashDeSenha } from '../src/sessao/hash-de-senha.js'
import { CLIENTE_REDIS_LOGIN } from '../src/sessao/sessao.module.js'
import { chamar, subirApi, type ApiDeTeste } from './api-com-sessao.js'
import { autorDaBancada, BancadaDeSessoes, type SessaoDeTeste } from './sessao-de-teste.js'
import { emOrdemNaTrava } from './trava-da-escola.js'

/**
 * O professor cadastrado pela coordenação (A1, tarefa 3.0; `tasks/prd-apresentacao-escola/cenarios.md`): E8, E9, E10,
 * E11, R4, C7, a parte da coordenação do I7, o I3 da lista, e o aceite do professor sem segundo fator. As varreduras
 * I3 (por id), P1, A1, A3 e A4 das quatro rotas moram em `escola-montada.int.test.ts`; a parte da operação do I7, em
 * `painel-convite.int.test.ts`. Postgres e Redis reais do compose de teste; nomes e e-mails gerados.
 */

const SENHA_NOVA = 'senha-nova-do-professor-1'
const SENHA_DE_A = 'senha-que-a-conta-ja-tinha-1'
/** O prazo das consultas da API: a trava segura pelo teste no C7 não pode estourar o `statement_timeout`. */
const PRAZO_DAS_CONSULTAS_MS = 15_000

interface Resposta {
  readonly status: number
  readonly corpo: Record<string, unknown> & { erro?: Record<string, unknown> }
  readonly texto: string
  readonly cacheControl: string | null
}

async function lerResposta(resposta: Response): Promise<Resposta> {
  const texto = await resposta.text()
  return { status: resposta.status, corpo: texto === '' ? {} : (JSON.parse(texto) as Resposta['corpo']), texto, cacheControl: resposta.headers.get('cache-control') }
}

/** A resposta sem o `requisicaoId`, que muda a cada chamada: o resto precisa ser idêntico. */
function semRequisicao(resposta: Resposta): unknown {
  const { requisicaoId: _requisicaoId, ...erro } = resposta.corpo.erro ?? {}
  return { status: resposta.status, corpo: { ...resposta.corpo, ...(resposta.corpo.erro === undefined ? {} : { erro }) } }
}

/** Um `token_hash` no formato do banco, sorteado: o único dele é global, e o banco de teste guarda as execuções anteriores. */
const hashSorteado = (): string => createHash('sha256').update(randomUUID()).digest('hex')

const NAO_ENCONTRADO = { status: 404, corpo: { erro: { codigo: CodigoDeErro.NAO_ENCONTRADO, mensagem: MENSAGENS_DE_ERRO.NAO_ENCONTRADO } } }
const CONFLITO = { status: 409, corpo: { erro: { codigo: CodigoDeErro.CONFLITO, mensagem: MENSAGENS_DE_ERRO.CONFLITO } } }

describe('professores (A1, tarefa 3.0): a coordenação cadastra, o professor aceita o convite de 7 dias', () => {
  const bancada = new BancadaDeSessoes()
  const medidor = new MedidorDeTeste()
  let api: ApiDeTeste
  let hash: HashDeSenha

  beforeAll(async () => {
    api = await subirApi(medidor.medidor, { banco: { timeoutConsultaMs: PRAZO_DAS_CONSULTAS_MS } })
    hash = api.app.get(HashDeSenha)
    const cliente = api.app.get<Redis>(CLIENTE_REDIS_LOGIN, { strict: false })
    const prazo = performance.now() + 15_000
    while (cliente.status !== 'ready') {
      if (performance.now() > prazo) throw new Error('o cliente do Redis de fila do login não conectou')
      await new Promise((resolver) => setTimeout(resolver, 20))
    }
  })

  afterAll(async () => {
    await api.app.close()
    await bancada.fechar()
    await medidor.encerrar()
  })

  async function pedir(metodo: string, caminho: string, token?: string, corpo?: unknown): Promise<Resposta> {
    const resposta = await fetch(`${api.url}${caminho}`, {
      method: metodo,
      headers: { ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }), ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
    })
    return lerResposta(resposta)
  }

  const pessoa = () => ({ nome: `Professor Sintético ${randomUUID().slice(0, 8)}`, email: `professor-${randomUUID()}@escola.invalid` })
  const cadastrar = (coordenacao: SessaoDeTeste, corpo: unknown) => pedir('POST', '/v1/professores', coordenacao.token, corpo)
  const listar = (coordenacao: SessaoDeTeste, consulta = '') => pedir('GET', `/v1/professores${consulta}`, coordenacao.token)
  const refazer = (coordenacao: SessaoDeTeste, usuarioId: string) => pedir('POST', `/v1/professores/${usuarioId}/convite/refazer`, coordenacao.token, {})
  const revogar = (coordenacao: SessaoDeTeste, usuarioId: string) => pedir('POST', `/v1/professores/${usuarioId}/convite/revogar`, coordenacao.token, {})
  const consultar = (token: string) => pedir('POST', '/v1/convites/consultar', undefined, { token })
  const aceitar = (token: string, senha?: string) => pedir('POST', '/v1/convites/aceitar', undefined, senha === undefined ? { token } : { token, senha })
  const entrar = (email: string, senha: string, bilhete?: string) => pedir('POST', '/v1/sessao/email', undefined, bilhete === undefined ? { email, senha } : { email, senha, bilhete })

  /** Uma escola com a coordenação que cadastra. */
  async function escolaComCoordenacao(): Promise<{ escolaId: string; coordenacao: SessaoDeTeste }> {
    const escolaId = await bancada.escola()
    return { escolaId, coordenacao: await bancada.sessao(escolaId, 'coordenador') }
  }

  /** Cadastra e devolve o convite gerado, conferindo o 201 e o contrato estrito. */
  async function cadastrado(coordenacao: SessaoDeTeste, quem = pessoa()): Promise<RespostaConviteDeProfessor & { email: string; nome: string }> {
    const resposta = await cadastrar(coordenacao, quem)
    expect(resposta.status).toBe(201)
    return { ...esquemaRespostaConviteDeProfessor.parse(resposta.corpo), ...quem }
  }

  /** Os convites da escola: tipo, usuário e se está em aberto. */
  const convitesDa = async (escolaId: string) =>
    (
      await bancada.pool.query<{ id: string; tipo: string; usuario_id: string; aberto: boolean }>(
        'select id, tipo, usuario_id, usado_em is null and revogado_em is null as aberto from convite where escola_id = $1 order by id',
        [escolaId],
      )
    ).rows

  /** Tudo o que as rotas de professor podem gravar na escola: o que é recusado não muda nada disto. */
  async function retrato(escolaId: string) {
    const [convites, usuarios, auditoria] = await Promise.all([
      bancada.pool.query('select id, tipo, usuario_id, expira_em, usado_em, revogado_em from convite where escola_id = $1 order by id', [escolaId]),
      bancada.pool.query('select id, conta_id, papel, nome, desativado_em from usuario where escola_id = $1 order by id', [escolaId]),
      bancada.pool.query('select id from auditoria where escola_id = $1 order by id', [escolaId]),
    ])
    return { convites: convites.rows, usuarios: usuarios.rows, auditoria: auditoria.rows }
  }

  const auditoriaDe = async (escolaId: string, acao: string) =>
    (
      await bancada.pool.query<{ entidade: string; entidade_id: string; autor_usuario_id: string | null; antes: unknown; depois: Record<string, unknown> | null }>(
        'select entidade, entidade_id, autor_usuario_id, antes, depois from auditoria where escola_id = $1 and acao = $2 order by id',
        [escolaId, acao],
      )
    ).rows

  const estadoNaLista = async (coordenacao: SessaoDeTeste, usuarioId: string) => {
    const lista = esquemaRespostaListaDeProfessores.parse((await listar(coordenacao, '?limite=100')).corpo)
    return lista.itens.find((item) => item.usuarioId === usuarioId)?.estado
  }

  /** Uma conta com senha e um professor ativo nela na escola: a pessoa que já trabalha em outra escola cliente. */
  async function professoraDe(escolaId: string): Promise<{ email: string; contaId: string; usuarioId: string }> {
    const email = `professora-${randomUUID()}@escola.invalid`
    const { rows: contas } = await bancada.pool.query<{ id: string }>('insert into conta (email, senha_hash) values ($1, $2) returning id', [email, await hash.gerar(SENHA_DE_A)])
    const contaId = contas[0]?.id ?? ''
    const { rows } = await bancada.pool.query<{ id: string }>("insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, 'professor', 'Pessoa sintética') returning id", [
      escolaId,
      contaId,
    ])
    return { email, contaId, usuarioId: rows[0]?.id ?? '' }
  }

  it('E8: cadastrar devolve o link uma vez, com no-store; a lista não traz token, link nem e-mail; refazer derruba o anterior; revogar derruba o refeito', async () => {
    const { escolaId, coordenacao } = await escolaComCoordenacao()
    const quem = pessoa()
    const resposta = await cadastrar(coordenacao, quem)
    expect(resposta.status).toBe(201)
    expect(resposta.cacheControl).toBe('no-store')
    const primeiro = esquemaRespostaConviteDeProfessor.parse(resposta.corpo)
    expect((await consultar(primeiro.token)).status).toBe(200)

    const lista = await listar(coordenacao)
    expect(lista.status).toBe(200)
    expect(esquemaRespostaListaDeProfessores.parse(lista.corpo).itens).toEqual([{ usuarioId: primeiro.usuarioId, nome: expect.any(String), estado: 'pendente' }])
    for (const segredo of [primeiro.token, primeiro.conviteId, '@escola.invalid']) expect(lista.texto).not.toContain(segredo)

    // Refazer: o anterior responde como o inexistente, na hora; o novo vale, para o mesmo usuário.
    const refeitoResposta = await refazer(coordenacao, primeiro.usuarioId)
    expect(refeitoResposta.status).toBe(201)
    expect(refeitoResposta.cacheControl).toBe('no-store')
    const refeito = esquemaRespostaConviteDeProfessor.parse(refeitoResposta.corpo)
    expect(refeito.usuarioId).toBe(primeiro.usuarioId)
    expect(refeito.token).not.toBe(primeiro.token)
    const inexistente = await consultar(randomUUID())
    expect(semRequisicao(await consultar(primeiro.token))).toEqual(semRequisicao(inexistente))
    expect((await consultar(refeito.token)).status).toBe(200)
    expect(await auditoriaDe(escolaId, 'convite.refeito')).toEqual([
      { entidade: 'convite', entidade_id: refeito.conviteId, autor_usuario_id: coordenacao.usuarioId, antes: null, depois: { tipo: 'professor', origemId: primeiro.conviteId, usuarioId: primeiro.usuarioId, expiraEm: expect.any(String) } },
    ])

    // Revogar: o refeito também passa a responder como o inexistente.
    const revogado = await revogar(coordenacao, primeiro.usuarioId)
    expect(revogado.status).toBe(204)
    expect(semRequisicao(await consultar(refeito.token))).toEqual(semRequisicao(inexistente))
    expect(await convitesDa(escolaId)).toEqual([
      { id: primeiro.conviteId, tipo: 'professor', usuario_id: primeiro.usuarioId, aberto: false },
      { id: refeito.conviteId, tipo: 'professor', usuario_id: primeiro.usuarioId, aberto: false },
    ])
    expect(await auditoriaDe(escolaId, 'convite.revogado')).toEqual([
      { entidade: 'convite', entidade_id: refeito.conviteId, autor_usuario_id: coordenacao.usuarioId, antes: null, depois: { tipo: 'professor' } },
    ])
    expect(await estadoNaLista(coordenacao, primeiro.usuarioId)).toBe('revogado')

    // Depois de revogado: refazer é CONFLITO, revogar de novo é o inexistente, e nada muda.
    const antes = await retrato(escolaId)
    expect(semRequisicao(await refazer(coordenacao, primeiro.usuarioId))).toEqual(CONFLITO)
    expect(semRequisicao(await revogar(coordenacao, primeiro.usuarioId))).toEqual(NAO_ENCONTRADO)
    expect(await retrato(escolaId)).toEqual(antes)

    // Cadastrar de novo o mesmo e-mail chama o mesmo usuário de volta, com um convite novo.
    const deNovo = await cadastrado(coordenacao, { nome: 'Nome corrigido sintético', email: quem.email })
    expect(deNovo.usuarioId).toBe(primeiro.usuarioId)
    expect((await consultar(deNovo.token)).status).toBe(200)
    expect((await bancada.pool.query('select nome from usuario where id = $1', [primeiro.usuarioId])).rows).toEqual([{ nome: 'Nome corrigido sintético' }])
  })

  it('E8, vencido e aceito: refazer o vencido vale; o aceito não se refaz nem se revoga, e nada muda', async () => {
    const { escolaId, coordenacao } = await escolaComCoordenacao()
    const vencido = await cadastrado(coordenacao)
    await bancada.pool.query("update convite set expira_em = now() - interval '1 second' where id = $1", [vencido.conviteId])
    expect(await estadoNaLista(coordenacao, vencido.usuarioId)).toBe('vencido')
    expect((await consultar(vencido.token)).status).toBe(404)
    const refeito = esquemaRespostaConviteDeProfessor.parse((await refazer(coordenacao, vencido.usuarioId)).corpo)
    expect((await consultar(refeito.token)).status).toBe(200)
    expect(await estadoNaLista(coordenacao, vencido.usuarioId)).toBe('pendente')

    const aceito = await cadastrado(coordenacao)
    expect((await aceitar(aceito.token, SENHA_NOVA)).status).toBe(200)
    expect(await estadoNaLista(coordenacao, aceito.usuarioId)).toBe('aceito')
    const antes = await retrato(escolaId)
    expect(semRequisicao(await refazer(coordenacao, aceito.usuarioId))).toEqual(CONFLITO)
    expect(semRequisicao(await revogar(coordenacao, aceito.usuarioId))).toEqual(CONFLITO)
    // O professor ativo não é cadastrado de novo.
    expect(semRequisicao(await cadastrar(coordenacao, { nome: aceito.nome, email: aceito.email }))).toEqual(CONFLITO)
    expect(await retrato(escolaId)).toEqual(antes)

    // O professor ativo com um convite ainda em aberto (dado gravado no banco, fora do caminho normal): a matriz dá
    // `ativo`, e refazer é CONFLITO; sem ela, o `update` condicional passaria e um convite novo nasceria.
    await bancada.pool.query("insert into convite (escola_id, token_hash, tipo, usuario_id, expira_em) values ($1, $3, 'professor', $2, now() + interval '8 days')", [
      escolaId,
      aceito.usuarioId,
      hashSorteado(),
    ])
    expect(await estadoNaLista(coordenacao, aceito.usuarioId)).toBe('ativo')
    const comAberto = await retrato(escolaId)
    expect(semRequisicao(await refazer(coordenacao, aceito.usuarioId))).toEqual(CONFLITO)
    expect(semRequisicao(await revogar(coordenacao, aceito.usuarioId))).toEqual(CONFLITO)
    expect(await retrato(escolaId)).toEqual(comAberto)
  })

  it('E9: o convite de professor vale 7 dias, e o de coordenador, 72 h: o de professor vale no 6º dia e cai depois de 7; o de coordenador cai depois de 72 h', async () => {
    const { coordenacao } = await escolaComCoordenacao()
    const deProfessor = await cadastrado(coordenacao)
    const deCoordenador = await criarConviteDeCoordenador(bancada.banco, autorDaBancada, { escolaId: await bancada.escola(), email: `coordenacao-${randomUUID()}@escola.invalid`, nome: 'Coordenação sintética' })

    // A validade gravada é a do tipo, contada de agora.
    const { rows } = await bancada.pool.query<{ id: string; horas: number }>('select id, extract(epoch from (expira_em - now())) / 3600 as horas from convite where id = any($1::uuid[])', [
      [deProfessor.conviteId, deCoordenador.conviteId],
    ])
    const horas = Object.fromEntries(rows.map((linha) => [linha.id, Number(linha.horas)]))
    expect(VALIDADE_DO_CONVITE_HORAS_POR_TIPO).toEqual({ coordenador: 72, professor: 168 })
    expect(horas[deProfessor.conviteId]).toBeGreaterThan(168 - 0.1)
    expect(horas[deProfessor.conviteId]).toBeLessThanOrEqual(168)
    expect(horas[deCoordenador.conviteId]).toBeGreaterThan(72 - 0.1)
    expect(horas[deCoordenador.conviteId]).toBeLessThanOrEqual(72)

    // O tempo passa: o convite é o mesmo, com o `expira_em` puxado para trás no banco.
    const passar = (conviteId: string, intervalo: string) => bancada.pool.query(`update convite set expira_em = expira_em - interval '${intervalo}' where id = $1`, [conviteId])
    await passar(deProfessor.conviteId, '6 days')
    expect((await consultar(deProfessor.token)).status).toBe(200)
    await passar(deProfessor.conviteId, '1 day 1 minute')
    expect((await consultar(deProfessor.token)).status).toBe(404)

    await passar(deCoordenador.conviteId, '71 hours')
    expect((await consultar(deCoordenador.token)).status).toBe(200)
    await passar(deCoordenador.conviteId, '1 hour 1 minute')
    expect((await consultar(deCoordenador.token)).status).toBe(404)
  })

  it('segundo fator: o professor com conta nova aceita e entra sem segundo fator; o coordenador, no mesmo fluxo, cai em configurar_mfa', async () => {
    const { escolaId, coordenacao } = await escolaComCoordenacao()
    const professor = await cadastrado(coordenacao)
    const aceite = await aceitar(professor.token, SENHA_NOVA)
    expect(aceite.status).toBe(200)
    expect(aceite.corpo).toEqual({ etapa: 'entrar', bilhete: expect.any(String) })
    const login = await entrar(professor.email, SENHA_NOVA, String(aceite.corpo['bilhete']))
    expect(login.corpo).toEqual({ etapa: 'pronta', token: expect.any(String), expiraEm: expect.any(String) })
    const eu = await chamar(api.url, 'GET', '/v1/eu', String(login.corpo['token']))
    expect(eu.status).toBe(200)
    expect(eu.corpo).toMatchObject({ escola: { id: escolaId }, papel: 'professor' })
    // A entrada seguinte, sem o bilhete, também é direta.
    expect((await entrar(professor.email, SENHA_NOVA)).corpo['etapa']).toBe('pronta')

    const email = `coordenacao-${randomUUID()}@escola.invalid`
    const deCoordenador = await criarConviteDeCoordenador(bancada.banco, autorDaBancada, { escolaId: await bancada.escola(), email, nome: 'Coordenação sintética' })
    expect((await aceitar(deCoordenador.token, SENHA_NOVA)).corpo).toEqual({ etapa: 'configurar_mfa', desafio: expect.any(String) })
    expect((await entrar(email, SENHA_NOVA)).corpo).toEqual({ etapa: 'configurar_mfa', desafio: expect.any(String) })
    expect(await auditoriaDe(escolaId, 'convite.aceito')).toEqual([
      { entidade: 'convite', entidade_id: professor.conviteId, autor_usuario_id: professor.usuarioId, antes: null, depois: { tipo: 'professor', usuarioId: professor.usuarioId, usuarioAtivo: true } },
    ])
  })

  it('E10: o aceite na escola B com a conta que já tem usuário em A não cria conta e cria o usuário de B; o professor confirma um vínculo e contesta outro; o pendente não alcança a turma', async () => {
    const escolaA = await bancada.escola()
    const deA = await professoraDe(escolaA)
    const { escolaId: escolaB, coordenacao } = await escolaComCoordenacao()
    const convite = await cadastrado(coordenacao, { nome: 'Professora em duas escolas', email: deA.email })

    // A conta é a mesma; o usuário de B é outro, inativo até o aceite.
    const contas = await bancada.pool.query<{ id: string }>('select id from conta where email = $1', [deA.email])
    expect(contas.rows).toEqual([{ id: deA.contaId }])
    const { rows: deB } = await bancada.pool.query<{ conta_id: string; papel: string; ativo: boolean }>('select conta_id, papel, desativado_em is null as ativo from usuario where id = $1 and escola_id = $2', [
      convite.usuarioId,
      escolaB,
    ])
    expect(deB).toEqual([{ conta_id: deA.contaId, papel: 'professor', ativo: false }])

    // O aceite com a conta que tem senha: `entrar` com o bilhete; a entrada com a senha de sempre ativa B e escolhe.
    const aceite = await aceitar(convite.token)
    expect(aceite.corpo).toEqual({ etapa: 'entrar', bilhete: expect.any(String) })
    const login = await entrar(deA.email, SENHA_DE_A, String(aceite.corpo['bilhete']))
    expect(login.corpo).toEqual({ etapa: 'escolher', desafio: expect.any(String), acessos: expect.any(Array) })
    const escolhido = await pedir('POST', '/v1/sessao/escola', String(login.corpo['desafio']), { usuarioId: convite.usuarioId })
    expect(escolhido.corpo['etapa']).toBe('pronta')
    const tokenB = String(escolhido.corpo['token'])
    expect((await bancada.pool.query('select count(*)::int as total from conta where email = $1', [deA.email])).rows).toEqual([{ total: 1 }])

    // A estrutura de B, com três vínculos pendentes do professor. A alocação do F1 só aceita o professor ativo
    // (`VinculoRepository.pessoaAtivaComPapel`): ela vem depois da primeira entrada (`3_task.md`, "Divergências resolvidas nesta tarefa").
    const post = (caminho: string, corpo?: unknown) => chamar(api.url, 'POST', caminho, coordenacao.token, corpo)
    const id = async (resposta: Promise<{ status: number; corpo: Record<string, unknown> }>, status = 201) => {
      const lida = await resposta
      expect(lida.status).toBe(status)
      return String(lida.corpo['id'])
    }
    const ano = await id(post('/v1/anos-letivos', { ano: 2026, inicio: '2026-02-01', fim: '2026-12-15' }))
    await id(post(`/v1/anos-letivos/${ano}/abrir`), 200)
    const serie = await id(post('/v1/series', { etapa: 'ef_anos_finais', ano: 7 }))
    const disciplina = await id(post('/v1/disciplinas', { nome: `Ciências ${randomUUID().slice(0, 8)}` }))
    const [t1, t2, t3] = [await id(post('/v1/turmas', { serieId: serie, nome: '7A' })), await id(post('/v1/turmas', { serieId: serie, nome: '7B' })), await id(post('/v1/turmas', { serieId: serie, nome: '7C' }))]
    const vinculos = [
      await id(post('/v1/vinculos', { usuarioId: convite.usuarioId, turmaId: t1, disciplinaId: disciplina, papel: 'professor' })),
      await id(post('/v1/vinculos', { usuarioId: convite.usuarioId, turmaId: t2, disciplinaId: disciplina, papel: 'professor' })),
      await id(post('/v1/vinculos', { usuarioId: convite.usuarioId, turmaId: t3, disciplinaId: disciplina, papel: 'professor' })),
    ]

    // Confirma o de T1, contesta o de T2; o de T3 continua pendente.
    expect((await pedir('POST', `/v1/vinculos/${vinculos[0]}/confirmar`, tokenB)).status).toBe(200)
    expect((await pedir('POST', `/v1/vinculos/${vinculos[1]}/contestar`, tokenB, { contestacao: 'turma_errada' })).status).toBe(200)
    expect((await pedir('GET', `/v1/turmas/${t1}`, tokenB)).status).toBe(200)
    for (const turma of [t2, t3]) expect(semRequisicao(await pedir('GET', `/v1/turmas/${turma}`, tokenB)), turma).toEqual(NAO_ENCONTRADO)
    // A conta em A continua com o usuário dela, intacto.
    expect((await bancada.pool.query('select desativado_em is null as ativo from usuario where id = $1', [deA.usuarioId])).rows).toEqual([{ ativo: true }])
  })

  it('E11: cadastrar um e-mail com conta em outra escola e um sem conta dá a mesma resposta, a mesma lista e a mesma auditoria, também depois do aceite', async () => {
    const deA = await professoraDe(await bancada.escola())
    const { escolaId, coordenacao } = await escolaComCoordenacao()
    const comConta = await cadastrar(coordenacao, { nome: 'Professora com conta', email: deA.email })
    const semConta = await cadastrar(coordenacao, pessoa())
    expect([comConta.status, semConta.status]).toEqual([201, 201])
    expect(Object.keys(comConta.corpo).sort()).toEqual(Object.keys(semConta.corpo).sort())
    const [a, b] = [esquemaRespostaConviteDeProfessor.parse(comConta.corpo), esquemaRespostaConviteDeProfessor.parse(semConta.corpo)]

    const itens = async () => {
      const lista = esquemaRespostaListaDeProfessores.parse((await listar(coordenacao)).corpo).itens
      return [a, b].map((gerado) => lista.find((item) => item.usuarioId === gerado.usuarioId))
    }
    const [itemA, itemB] = await itens()
    expect(Object.keys(itemA ?? {}).sort()).toEqual(Object.keys(itemB ?? {}).sort())
    expect([itemA?.estado, itemB?.estado]).toEqual(['pendente', 'pendente'])

    const cadastrados = await auditoriaDe(escolaId, 'professor.cadastrado')
    expect(cadastrados).toEqual([
      { entidade: 'usuario', entidade_id: a.usuarioId, autor_usuario_id: coordenacao.usuarioId, antes: null, depois: null },
      { entidade: 'usuario', entidade_id: b.usuarioId, autor_usuario_id: coordenacao.usuarioId, antes: null, depois: null },
    ])
    const criados = await auditoriaDe(escolaId, 'convite.criado')
    expect(criados.map((linha) => linha.depois)).toEqual([
      { tipo: 'professor', usuarioId: a.usuarioId, expiraEm: expect.any(String) },
      { tipo: 'professor', usuarioId: b.usuarioId, expiraEm: expect.any(String) },
    ])

    // Depois do aceite, a conta nova já está ativa e a outra espera a primeira entrada: a lista diz `aceito` nas duas.
    expect((await aceitar(a.token)).corpo['etapa']).toBe('entrar')
    expect((await aceitar(b.token, SENHA_NOVA)).corpo['etapa']).toBe('entrar')
    expect((await itens()).map((item) => item?.estado)).toEqual(['aceito', 'aceito'])
  })

  it('R4: o convite de professor usado, vencido, revogado, refeito e inexistente respondem igual em consultar e em aceitar, e nada é gravado', async () => {
    const { escolaId, coordenacao } = await escolaComCoordenacao()
    const usado = await cadastrado(coordenacao)
    expect((await aceitar(usado.token, SENHA_NOVA)).status).toBe(200)
    const vencido = await cadastrado(coordenacao)
    await bancada.pool.query("update convite set expira_em = now() - interval '1 second' where id = $1", [vencido.conviteId])
    const revogado = await cadastrado(coordenacao)
    expect((await revogar(coordenacao, revogado.usuarioId)).status).toBe(204)
    const refeito = await cadastrado(coordenacao)
    expect((await refazer(coordenacao, refeito.usuarioId)).status).toBe(201)

    const antes = await retrato(escolaId)
    const inexistente = randomUUID()
    const esperadoConsultar = semRequisicao(await consultar(inexistente))
    const esperadoAceitar = semRequisicao(await aceitar(inexistente, SENHA_NOVA))
    expect(esperadoConsultar).toEqual(NAO_ENCONTRADO)
    expect(esperadoAceitar).toEqual(NAO_ENCONTRADO)
    for (const [caso, token] of [
      ['usado', usado.token],
      ['vencido', vencido.token],
      ['revogado', revogado.token],
      ['refeito', refeito.token],
    ] as const) {
      expect(semRequisicao(await consultar(token)), caso).toEqual(esperadoConsultar)
      expect(semRequisicao(await aceitar(token, SENHA_NOVA)), caso).toEqual(esperadoAceitar)
      expect(semRequisicao(await aceitar(token)), caso).toEqual(esperadoAceitar)
    }
    expect(await retrato(escolaId)).toEqual(antes)
  })

  it('bordas do cadastro: o e-mail com outra caixa e o de convite vencido em aberto dão CONFLITO; o mesmo nome com e-mails diferentes são dois professores; o coordenador que também dá aula ganha o usuário professor, e o de coordenação fica intacto', async () => {
    const { escolaId, coordenacao } = await escolaComCoordenacao()
    const primeiro = await cadastrado(coordenacao)
    const antes = await retrato(escolaId)
    expect(semRequisicao(await cadastrar(coordenacao, { nome: primeiro.nome, email: primeiro.email.toUpperCase() }))).toEqual(CONFLITO)
    expect(await retrato(escolaId)).toEqual(antes)
    await bancada.pool.query("update convite set expira_em = now() - interval '1 second' where id = $1", [primeiro.conviteId])
    const vencido = await retrato(escolaId)
    expect(semRequisicao(await cadastrar(coordenacao, { nome: primeiro.nome, email: primeiro.email }))).toEqual(CONFLITO)
    expect(await retrato(escolaId)).toEqual(vencido)

    const mesmoNome = [await cadastrado(coordenacao, { nome: 'Nome repetido sintético', email: `a-${randomUUID()}@escola.invalid` }), await cadastrado(coordenacao, { nome: 'Nome repetido sintético', email: `b-${randomUUID()}@escola.invalid` })]
    expect(new Set(mesmoNome.map((gerado) => gerado.usuarioId)).size).toBe(2)

    const email = `coordena-e-leciona-${randomUUID()}@escola.invalid`
    const coordenador = await bancada.equipeComEmail(escolaId, email, 'coordenador')
    const { rows: antesDoCoordenador } = await bancada.pool.query('select papel, nome, desativado_em from usuario where id = $1', [coordenador.usuarioId])
    const comoProfessor = await cadastrado(coordenacao, { nome: 'Coordenação que dá aula', email })
    expect(comoProfessor.usuarioId).not.toBe(coordenador.usuarioId)
    expect((await bancada.pool.query('select conta_id, papel from usuario where id = $1', [comoProfessor.usuarioId])).rows).toEqual([{ conta_id: coordenador.contaId, papel: 'professor' }])
    expect((await bancada.pool.query('select papel, nome, desativado_em from usuario where id = $1', [coordenador.usuarioId])).rows).toEqual(antesDoCoordenador)
  })

  it('refazer e revogar sem corpo nenhum valem como com `{}`', async () => {
    const { coordenacao } = await escolaComCoordenacao()
    const convite = await cadastrado(coordenacao)
    expect((await pedir('POST', `/v1/professores/${convite.usuarioId}/convite/refazer`, coordenacao.token)).status).toBe(201)
    expect((await pedir('POST', `/v1/professores/${convite.usuarioId}/convite/revogar`, coordenacao.token)).status).toBe(204)
  })

  describe('C7: cadastros ao mesmo tempo terminam com um convite em aberto', () => {
    it('dois cadastros do mesmo e-mail em paralelo: um 201, um CONFLITO; um usuário, um convite em aberto, um professor.cadastrado', async () => {
      const { escolaId, coordenacao } = await escolaComCoordenacao()
      const quem = pessoa()
      const respostas = await Promise.all([cadastrar(coordenacao, quem), cadastrar(coordenacao, quem)])
      expect(respostas.map((resposta) => resposta.status).sort()).toEqual([201, 409])
      const convites = await convitesDa(escolaId)
      expect(convites.filter((convite) => convite.aberto)).toHaveLength(1)
      expect(new Set(convites.map((convite) => convite.usuario_id)).size).toBe(1)
      expect(await auditoriaDe(escolaId, 'professor.cadastrado')).toHaveLength(1)
    })

    it('com a ordem forçada na trava da escola: o segundo cadastro espera o primeiro e recebe CONFLITO', async () => {
      const { escolaId, coordenacao } = await escolaComCoordenacao()
      const quem = pessoa()
      const [primeiro, segundo] = await emOrdemNaTrava(
        bancada.pool,
        escolaId,
        () => cadastrar(coordenacao, quem),
        () => cadastrar(coordenacao, quem),
      )
      expect([primeiro.status, semRequisicao(segundo)]).toEqual([201, CONFLITO])
      expect((await convitesDa(escolaId)).filter((convite) => convite.aberto)).toHaveLength(1)
    })

    it('cadastrar × refazer do mesmo professor, em paralelo e nas duas ordens da trava: o refazer vale, o cadastro é CONFLITO, e sobra um convite em aberto', async () => {
      const { escolaId, coordenacao } = await escolaComCoordenacao()
      const emParalelo = await cadastrado(coordenacao)
      const [cadastro, refeito] = await Promise.all([cadastrar(coordenacao, { nome: emParalelo.nome, email: emParalelo.email }), refazer(coordenacao, emParalelo.usuarioId)])
      expect([semRequisicao(cadastro), refeito.status]).toEqual([CONFLITO, 201])

      const cadastroPrimeiro = await cadastrado(coordenacao)
      const [c1, r1] = await emOrdemNaTrava(
        bancada.pool,
        escolaId,
        () => cadastrar(coordenacao, { nome: cadastroPrimeiro.nome, email: cadastroPrimeiro.email }),
        () => refazer(coordenacao, cadastroPrimeiro.usuarioId),
      )
      expect([semRequisicao(c1), r1.status]).toEqual([CONFLITO, 201])

      const refazerPrimeiro = await cadastrado(coordenacao)
      const [r2, c2] = await emOrdemNaTrava(
        bancada.pool,
        escolaId,
        () => refazer(coordenacao, refazerPrimeiro.usuarioId),
        () => cadastrar(coordenacao, { nome: refazerPrimeiro.nome, email: refazerPrimeiro.email }),
      )
      expect([r2.status, semRequisicao(c2)]).toEqual([201, CONFLITO])

      const convites = await convitesDa(escolaId)
      for (const usuarioId of [emParalelo.usuarioId, cadastroPrimeiro.usuarioId, refazerPrimeiro.usuarioId]) {
        expect(convites.filter((convite) => convite.usuario_id === usuarioId && convite.aberto), usuarioId).toHaveLength(1)
      }
    })

    it('dois refazer do mesmo professor em paralelo (o clique duplo): os dois refazem, um depois do outro na trava; só o último link vale, e sobra um convite em aberto', async () => {
      const { escolaId, coordenacao } = await escolaComCoordenacao()
      const convite = await cadastrado(coordenacao)
      const respostas = await Promise.all([refazer(coordenacao, convite.usuarioId), refazer(coordenacao, convite.usuarioId)])
      expect(respostas.map((resposta) => resposta.status)).toEqual([201, 201])
      const abertos = (await convitesDa(escolaId)).filter((linha) => linha.aberto)
      expect(abertos).toHaveLength(1)
      const tokens = respostas.map((resposta) => esquemaRespostaConviteDeProfessor.parse(resposta.corpo))
      const vale = tokens.filter((gerado) => gerado.conviteId === abertos[0]?.id)
      expect(vale).toHaveLength(1)
      const [ultimo] = vale
      const [primeiroLink] = tokens.filter((gerado) => gerado !== ultimo)
      expect((await consultar(ultimo?.token ?? '')).status).toBe(200)
      expect((await consultar(primeiroLink?.token ?? '')).status).toBe(404)
      expect((await consultar(convite.token)).status).toBe(404)
    })

    it('dois refazer do mesmo professor com a ordem forçada na trava: o segundo refaz o convite que o primeiro criou, e só o link do segundo vale', async () => {
      const { escolaId, coordenacao } = await escolaComCoordenacao()
      const convite = await cadastrado(coordenacao)
      const [primeiro, segundo] = await emOrdemNaTrava(
        bancada.pool,
        escolaId,
        () => refazer(coordenacao, convite.usuarioId),
        () => refazer(coordenacao, convite.usuarioId),
      )
      const [doPrimeiro, doSegundo] = [esquemaRespostaConviteDeProfessor.parse(primeiro.corpo), esquemaRespostaConviteDeProfessor.parse(segundo.corpo)]
      expect((await consultar(doSegundo.token)).status).toBe(200)
      expect((await consultar(doPrimeiro.token)).status).toBe(404)
      expect((await auditoriaDe(escolaId, 'convite.refeito')).map((linha) => linha.depois?.['origemId'])).toEqual([convite.conviteId, doPrimeiro.conviteId])
    })

    it('revogar × aceite, nas duas ordens da trava: o aceite primeiro deixa o revogar em CONFLITO, sem gravar; o revogar primeiro deixa o aceite como o convite inexistente', async () => {
      const { escolaId, coordenacao } = await escolaComCoordenacao()
      const aceitoAntes = await cadastrado(coordenacao)
      const [aceite, revogacao] = await emOrdemNaTrava(
        bancada.pool,
        escolaId,
        () => aceitar(aceitoAntes.token, SENHA_NOVA),
        () => revogar(coordenacao, aceitoAntes.usuarioId),
      )
      expect([aceite.status, semRequisicao(revogacao)]).toEqual([200, CONFLITO])
      expect(await auditoriaDe(escolaId, 'convite.revogado')).toEqual([])
      expect(await estadoNaLista(coordenacao, aceitoAntes.usuarioId)).toBe('aceito')

      const revogadoAntes = await cadastrado(coordenacao)
      const [revogado, aceiteDepois] = await emOrdemNaTrava(
        bancada.pool,
        escolaId,
        () => revogar(coordenacao, revogadoAntes.usuarioId),
        () => aceitar(revogadoAntes.token, SENHA_NOVA),
      )
      expect([revogado.status, semRequisicao(aceiteDepois)]).toEqual([204, NAO_ENCONTRADO])
      expect((await bancada.pool.query('select desativado_em is null as ativo from usuario where id = $1', [revogadoAntes.usuarioId])).rows).toEqual([{ ativo: false }])
    })
  })

  describe('I7 (a coordenação): refazer e revogar pelo usuário só alcançam o convite de professor', () => {
    it('o usuário coordenador com o convite de coordenação em aberto: NAO_ENCONTRADO, igual ao inexistente, e nada é gravado', async () => {
      const escolaId = await bancada.escola()
      const deCoordenador = await criarConviteDeCoordenador(bancada.banco, autorDaBancada, { escolaId, email: `coordenacao-${randomUUID()}@escola.invalid`, nome: 'Coordenação sintética' })
      const coordenacao = await bancada.sessao(escolaId, 'coordenador')
      const { rows } = await bancada.pool.query<{ usuario_id: string }>('select usuario_id from convite where id = $1', [deCoordenador.conviteId])
      const coordenadorConvidado = rows[0]?.usuario_id ?? ''
      const antes = await retrato(escolaId)
      for (const resposta of [await refazer(coordenacao, coordenadorConvidado), await revogar(coordenacao, coordenadorConvidado), await refazer(coordenacao, randomUUID())]) {
        expect(semRequisicao(resposta)).toEqual(NAO_ENCONTRADO)
      }
      expect(await retrato(escolaId)).toEqual(antes)
      expect((await consultar(deCoordenador.token)).status).toBe(200)
    })

    it('cada filtro sozinho: o professor cujo convite é de coordenação, e o coordenador cujo convite é de professor, gravados no banco, também não são alcançados', async () => {
      const { escolaId, coordenacao } = await escolaComCoordenacao()
      const professor = await cadastrado(coordenacao)
      const coordenador = await bancada.equipeComEmail(escolaId, `coordenador-${randomUUID()}@escola.invalid`, 'coordenador')
      await bancada.pool.query("update usuario set desativado_em = now() where id = $1", [coordenador.usuarioId])
      // O convite do professor passa a ser `coordenador`; o coordenador ganha um convite `professor`. Só o banco faz isso.
      await bancada.pool.query("update convite set tipo = 'coordenador' where id = $1", [professor.conviteId])
      await bancada.pool.query("insert into convite (escola_id, token_hash, tipo, usuario_id, expira_em) values ($1, $3, 'professor', $2, now() + interval '7 days')", [
        escolaId,
        coordenador.usuarioId,
        hashSorteado(),
      ])
      // Na lista, o professor sem convite de professor está desativado: o convite de coordenação não conta para ele.
      expect(await estadoNaLista(coordenacao, professor.usuarioId)).toBe('desativado')
      const antes = await retrato(escolaId)
      for (const usuarioId of [professor.usuarioId, coordenador.usuarioId]) {
        expect(semRequisicao(await refazer(coordenacao, usuarioId)), usuarioId).toEqual(NAO_ENCONTRADO)
        expect(semRequisicao(await revogar(coordenacao, usuarioId)), usuarioId).toEqual(NAO_ENCONTRADO)
      }
      expect(await retrato(escolaId)).toEqual(antes)
    })
  })

  it('I3 (lista): a lista da coordenação de A traz só os professores de A, e pagina por usuário', async () => {
    const a = await escolaComCoordenacao()
    const b = await escolaComCoordenacao()
    const deA = [await cadastrado(a.coordenacao), await cadastrado(a.coordenacao), await cadastrado(a.coordenacao)]
    const deB = await cadastrado(b.coordenacao)
    const primeira = esquemaRespostaListaDeProfessores.parse((await listar(a.coordenacao, '?limite=2')).corpo)
    expect(primeira.itens).toHaveLength(2)
    expect(primeira.proxima).toBe(primeira.itens[1]?.usuarioId)
    const segunda = esquemaRespostaListaDeProfessores.parse((await listar(a.coordenacao, `?limite=2&pagina=${String(primeira.proxima)}`)).corpo)
    expect(segunda.proxima).toBeUndefined()
    const vistos = [...primeira.itens, ...segunda.itens].map((item) => item.usuarioId)
    expect(vistos).toEqual(deA.map((gerado) => gerado.usuarioId).sort())
    expect(vistos).not.toContain(deB.usuarioId)
  })
})
