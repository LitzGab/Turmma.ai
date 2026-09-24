import { criarBanco, criarPool, estadoDaCoordenacao, executarNoContexto, type Banco, type PoolBanco } from '@educa/nucleo'
import { CodigoDeErro, esquemaRespostaConviteDaCoordenacao, ESTADOS_DA_COORDENACAO, type EstadoDaCoordenacao, type RespostaConviteDaCoordenacao } from '@educa/shared'
import type { INestApplication } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste } from '../../../tools/ci/compose.ts'
import { urlDoBancoDeTeste } from '../../../tools/testes/integracao.setup.ts'
import type { SaidaDoComando } from '../src/ops/comando.js'
import { executarOpsConviteCoordenador } from '../src/ops/convite-coordenador.js'
import { desativarOperador } from '../src/ops/operador.js'
import { executarOpsRevogarConvite } from '../src/ops/revogar-convite.js'
import { CHAVE_DA_TRAVA_DO_CONVITE_DA_ESCOLA, ConviteRepository } from '../src/sessao/convite.repository.js'
import { criarConviteDeCoordenador } from '../src/sessao/convite.service.js'
import { aguardar, esperarNaTrava, GatilhoDeParada } from './gatilho-de-parada.js'
import { ESPERA_DO_AUTOR, esperarErro, pedir, PRAZO_DAS_CONSULTAS_MS, segurarODesativar, subirApiDoPainel, type Resposta } from './painel-de-teste.js'
import { BancadaDeOperadores } from './sessao-de-operador.js'
import { autorDaBancada, BancadaDeSessoes } from './sessao-de-teste.js'

/**
 * O convite da primeira coordenação pelo painel da operação (A0b, tarefa 2.0): `POST /v1/operacao/escolas/:id/convite-
 * coordenacao` e `POST /v1/operacao/convites/:id/revogar`, e os `ops:*` de convite pelo mesmo caso de uso. Cenários de
 * `tasks/prd-apresentacao-painel/cenarios.md`: E6 (gerar e revogar), E7, E8 (sem refazer), E10, E11 e E13 (convite),
 * E12 (as duas rotas), I7, A2 e A3 (gerar e revogar). As partes de login da E6 são da 4.0, e o refazer, da 3.0. Postgres
 * e Redis reais do compose de teste.
 */

const HORA_MS = 60 * 60 * 1_000
const SENHA = 'senha-nova-do-convite-1'
/** Quanto, no máximo, a escola B pode levar com a trava da escola A segura (E10): a gravação leva milissegundos. */
const PRAZO_DA_OUTRA_ESCOLA_MS = 5_000

/** O que gerar e revogar fazem em cada estado (Tech Spec da A0b, seção 5, a matriz). */
const GERAR: Readonly<Record<EstadoDaCoordenacao, 201 | 409>> = {
  sem_convite: 201,
  pendente: 409,
  vencido: 409,
  revogado: 201,
  aceito: 201,
  sem_coordenacao: 201,
  ativa: 409,
}
/** `sem_convite` não tem convite a passar: o id é inexistente, e a resposta é a do inexistente. */
const REVOGAR: Readonly<Record<EstadoDaCoordenacao, 204 | 404 | 409>> = {
  sem_convite: 404,
  pendente: 204,
  vencido: 204,
  revogado: 404,
  aceito: 204,
  sem_coordenacao: 409,
  ativa: 409,
}
const CODIGO: Readonly<Record<404 | 409, CodigoDeErro>> = { 404: CodigoDeErro.NAO_ENCONTRADO, 409: CodigoDeErro.CONFLITO }

interface Pessoa {
  readonly nome: string
  readonly email: string
}

interface EscolaPreparada {
  readonly escolaId: string
  /** Quem foi convidada no preparo. */
  readonly quem: Pessoa
  /** O último convite de coordenação da escola; nenhum em `sem_convite`. */
  readonly conviteId: string | undefined
}

describe('painel da operação: o convite da coordenação, gerar e revogar (tarefa 2.0)', () => {
  const operadores = new BancadaDeOperadores()
  const escolas = new BancadaDeSessoes()
  const linhasDeLog: string[] = []
  const pasta = mkdtempSync(join(tmpdir(), 'painel-convite-int-'))
  let app: INestApplication
  let url: string
  let pool: PoolBanco
  let banco: Banco

  const pessoa = (): Pessoa => ({ nome: `Coordenação Sintética ${randomUUID().slice(0, 8)}`, email: `coordenacao-${randomUUID()}@escola.invalid` })
  const gerar = (token: string, escolaId: string, corpo: unknown = pessoa()) => pedir(url, 'POST', `/v1/operacao/escolas/${escolaId}/convite-coordenacao`, token, corpo)
  const revogar = (token: string, conviteId: string, corpo?: unknown) => pedir(url, 'POST', `/v1/operacao/convites/${conviteId}/revogar`, token, corpo)
  const aceitar = (token: string, senha?: string) => pedir(url, 'POST', '/v1/convites/aceitar', undefined, senha === undefined ? { token } : { token, senha })
  const gerado = (resposta: Resposta): RespostaConviteDaCoordenacao => esquemaRespostaConviteDaCoordenacao.parse(resposta.corpo)

  /** O estado da coordenação da escola, pela mesma função e pela mesma leitura da escrita. */
  const estadoDe = (escolaId: string) =>
    executarNoContexto({ requisicaoId: randomUUID(), escolaId }, async () => {
      const dados = await new ConviteRepository(banco).dadosDaCoordenacao()
      if (dados === undefined) throw new Error('escola de teste não encontrada')
      return estadoDaCoordenacao(dados)
    })

  const abertos = async (escolaId: string) =>
    (await pool.query<{ total: number }>('select count(*)::int as total from convite where escola_id = $1 and usado_em is null and revogado_em is null', [escolaId])).rows[0]?.total
  const auditoriaDe = async (escolaId: string, acao: string) =>
    (
      await pool.query<{ entidade_id: string; autor_operador: string | null; autor_usuario_id: string | null; antes: unknown; depois: unknown }>(
        'select entidade_id, autor_operador, autor_usuario_id, antes, depois from auditoria where escola_id = $1 and acao = $2 order by em, id',
        [escolaId, acao],
      )
    ).rows
  const linhasComEvento = (evento: string) => linhasDeLog.map((linha) => JSON.parse(linha) as Record<string, unknown>).filter((linha) => linha['msg'] === evento)

  /** Tudo o que gerar e revogar podem gravar na escola, e a conta do e-mail: o que não é permitido não muda nada disto. */
  async function retrato(escolaId: string, email: string) {
    const [convites, usuarios, auditoria, contas] = await Promise.all([
      pool.query('select id, usuario_id, expira_em, usado_em, revogado_em from convite where escola_id = $1 order by id', [escolaId]),
      pool.query('select id, conta_id, desativado_em from usuario where escola_id = $1 order by id', [escolaId]),
      pool.query('select id from auditoria where escola_id = $1 order by id', [escolaId]),
      pool.query('select id from conta where email = $1', [email]),
    ])
    return { convites: convites.rows, usuarios: usuarios.rows, auditoria: auditoria.rows, contas: contas.rows }
  }

  /**
   * Uma escola nova no estado pedido: o gerar e o revogar do painel e o aceite da rota do convite (conta nova define a
   * senha e ativa; conta com senha espera o login) pelos caminhos de verdade; a coordenação desativada, por `update` no
   * banco (a desativação pela escola não é desta funcionalidade); o vencido, pelo caso de uso com o relógio 73 h atrás.
   */
  async function escolaEm(estado: EstadoDaCoordenacao, token: string): Promise<EscolaPreparada> {
    const escolaId = await escolas.escola()
    const quem = pessoa()
    if (estado === 'sem_convite') return { escolaId, quem, conviteId: undefined }
    if (estado === 'vencido') {
      const { conviteId } = await criarConviteDeCoordenador(banco, autorDaBancada, { escolaId, ...quem }, { agora: () => new Date(Date.now() - 73 * HORA_MS) })
      expect(await estadoDe(escolaId)).toBe('vencido')
      return { escolaId, quem, conviteId }
    }
    // A pessoa que já trabalha em outra escola cliente: o aceite não troca a senha dela e espera o login.
    if (estado === 'aceito') await pool.query("insert into conta (email, senha_hash) values ($1, 'hash-sintetico')", [quem.email])
    const resposta = await gerar(token, escolaId, quem)
    expect(resposta.status).toBe(201)
    const { conviteId, token: link } = gerado(resposta)
    if (estado === 'revogado') expect((await revogar(token, conviteId)).status).toBe(204)
    if (estado === 'aceito') expect((await aceitar(link)).corpo).toEqual({ etapa: 'entrar', bilhete: expect.any(String) })
    if (estado === 'ativa' || estado === 'sem_coordenacao') expect((await aceitar(link, SENHA)).corpo).toEqual({ etapa: 'configurar_mfa', desafio: expect.any(String) })
    if (estado === 'sem_coordenacao') await pool.query("update usuario set desativado_em = now() where escola_id = $1 and papel = 'coordenador'", [escolaId])
    expect(await estadoDe(escolaId)).toBe(estado)
    return { escolaId, quem, conviteId }
  }

  /** Segura a trava do convite da escola por fora, numa conexão do teste; `soltar` pode ser chamado mais de uma vez. */
  async function segurarTravaDaEscola(escolaId: string): Promise<() => Promise<void>> {
    const conexao = await pool.connect()
    await conexao.query('select pg_advisory_lock($1, hashtext($2::uuid::text))', [CHAVE_DA_TRAVA_DO_CONVITE_DA_ESCOLA, escolaId])
    let solta = false
    return async () => {
      if (solta) return
      solta = true
      try {
        await conexao.query('select pg_advisory_unlock($1, hashtext($2::uuid::text))', [CHAVE_DA_TRAVA_DO_CONVITE_DA_ESCOLA, escolaId])
      } finally {
        conexao.release()
      }
    }
  }

  /** Espera `quantas` transações paradas na trava do convite desta escola, com `wait_event = 'advisory'`. */
  async function esperarNaTravaDaEscola(escolaId: string, quantas: number): Promise<void> {
    await aguardar(async () => {
      const { rows } = await pool.query<{ total: number }>(
        `select count(*)::int as total from pg_locks l join pg_stat_activity a on a.pid = l.pid
          where l.locktype = 'advisory' and l.classid = $1 and l.objid = hashtext($2::uuid::text)::oid and l.objsubid = 2
            and not l.granted and a.wait_event = 'advisory'`,
        [CHAVE_DA_TRAVA_DO_CONVITE_DA_ESCOLA, escolaId],
      )
      return (rows[0]?.total ?? 0) >= quantas
    }, `${quantas} na trava do convite da escola`)
  }

  /** Dispara as chamadas com a trava da escola segura pelo teste, confere que todas esperam nela, e só então solta. */
  async function naFilaDaTrava(escolaId: string, chamadas: () => Promise<Resposta>[]): Promise<Resposta[]> {
    const soltar = await segurarTravaDaEscola(escolaId)
    try {
      const emAndamento = chamadas()
      await esperarNaTravaDaEscola(escolaId, emAndamento.length)
      await soltar()
      return await Promise.all(emAndamento)
    } finally {
      await soltar()
    }
  }

  beforeAll(async () => {
    pool = criarPool({ url: urlDoBancoDeTeste(), maximoConexoes: 6, timeoutConexaoMs: 5_000, timeoutConsultaMs: PRAZO_DAS_CONSULTAS_MS }, () => undefined)
    banco = criarBanco(pool)
    ;({ app, url } = await subirApiDoPainel(linhasDeLog))
  })

  afterAll(async () => {
    await app.close()
    await pool.end()
    await escolas.fechar()
    await operadores.fechar()
    rmSync(pasta, { recursive: true, force: true })
  })

  describe('E6: gerar, em cada estado, dá o resultado da matriz, e o que não é permitido não grava nada', () => {
    it.each(ESTADOS_DA_COORDENACAO)('gerar em %s', async (estado) => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm(estado, sessao.token)
      const outra = pessoa()
      const antes = await retrato(escola.escolaId, outra.email)
      const revogadosAntes = await auditoriaDe(escola.escolaId, 'convite.revogado')
      const resposta = await gerar(sessao.token, escola.escolaId, outra)
      expect(resposta.cacheControl).toBe('no-store')

      const esperado = GERAR[estado]
      if (esperado === 409) {
        esperarErro(resposta, 409, CodigoDeErro.CONFLITO)
        expect(await retrato(escola.escolaId, outra.email)).toEqual(antes)
        expect(await estadoDe(escola.escolaId)).toBe(estado)
        return
      }
      expect(resposta.status).toBe(201)
      const { conviteId, token } = gerado(resposta)
      const { rows } = await pool.query<{ escola_id: string; email: string }>('select c.escola_id, co.email from convite c join usuario u on u.id = c.usuario_id join conta co on co.id = u.conta_id where c.id = $1', [conviteId])
      expect(rows).toEqual([{ escola_id: escola.escolaId, email: outra.email }])
      expect(await abertos(escola.escolaId)).toBe(1)
      expect(await estadoDe(escola.escolaId)).toBe('pendente')
      expect(await auditoriaDe(escola.escolaId, 'convite.criado')).toEqual(expect.arrayContaining([expect.objectContaining({ entidade_id: conviteId, autor_operador: sessao.apelido, autor_usuario_id: null })]))

      const revogados = await auditoriaDe(escola.escolaId, 'convite.revogado')
      if (estado === 'aceito' || estado === 'sem_coordenacao') {
        // O último convite (no `aceito`, o do aceite que esperava o login; no `sem_coordenacao`, o já usado) é revogado
        // na mesma transação, com a auditoria dele e o apelido conferido, sem nome, e-mail nem token.
        expect((await pool.query('select revogado_em is not null as revogado from convite where id = $1', [escola.conviteId])).rows).toEqual([{ revogado: true }])
        expect(revogados).toEqual([...revogadosAntes, { entidade_id: escola.conviteId, autor_operador: sessao.apelido, autor_usuario_id: null, antes: null, depois: null }])
        const texto = JSON.stringify(revogados)
        for (const proibido of [escola.quem.nome, escola.quem.email, outra.nome, outra.email, token]) expect(texto).not.toContain(proibido)
      } else {
        expect(revogados).toEqual(revogadosAntes)
      }
    })

    it.each(['aceito', 'sem_coordenacao'] as const)('gerar em %s com o mesmo e-mail reaproveita o usuário, que fica esperando só o convite novo', async (estado) => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm(estado, sessao.token)
      const { rows: anterior } = await pool.query<{ usuario_id: string }>('select usuario_id from convite where id = $1', [escola.conviteId])
      const resposta = await gerar(sessao.token, escola.escolaId, escola.quem)
      expect(resposta.status).toBe(201)
      const { conviteId } = gerado(resposta)
      const { rows } = await pool.query<{ id: string; usuario_id: string; aberto: boolean; ativo: boolean }>(
        `select c.id, c.usuario_id, c.usado_em is null and c.revogado_em is null as aberto, u.desativado_em is null as ativo
           from convite c join usuario u on u.id = c.usuario_id where c.escola_id = $1 order by c.id`,
        [escola.escolaId],
      )
      expect(rows.map((linha) => linha.usuario_id)).toEqual([anterior[0]?.usuario_id, anterior[0]?.usuario_id])
      expect(rows.filter((linha) => linha.aberto).map((linha) => linha.id)).toEqual([conviteId])
      // Inativo até o convite novo ser aceito; uma conta só para o e-mail.
      expect(rows.every((linha) => !linha.ativo)).toBe(true)
      expect((await pool.query('select id from conta where email = $1', [escola.quem.email])).rows).toHaveLength(1)
    })
  })

  describe('E6: o nome se corrige revogando e gerando com o mesmo e-mail (Tech Spec da A0b, seção 5)', () => {
    it.each(['revogado', 'aceito', 'sem_coordenacao'] as const)('em %s, gerar com o mesmo e-mail e outro nome grava o nome novo no mesmo usuário', async (estado) => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm(estado, sessao.token)
      const { rows: anterior } = await pool.query<{ usuario_id: string }>('select usuario_id from convite where id = $1', [escola.conviteId])
      const corrigido = { nome: `${escola.quem.nome} Corrigido`, email: escola.quem.email }
      const resposta = await gerar(sessao.token, escola.escolaId, corrigido)
      expect(resposta.status).toBe(201)
      const { rows } = await pool.query<{ id: string; nome: string }>('select u.id, u.nome from convite c join usuario u on u.id = c.usuario_id where c.id = $1', [gerado(resposta).conviteId])
      expect(rows).toEqual([{ id: anterior[0]?.usuario_id, nome: corrigido.nome }])
    })
  })

  describe('E6: revogar, em cada estado, dá o resultado da matriz, e o que não é permitido não grava nada', () => {
    it.each(ESTADOS_DA_COORDENACAO)('revogar o último convite em %s', async (estado) => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm(estado, sessao.token)
      const alvo = escola.conviteId ?? randomUUID()
      const antes = await retrato(escola.escolaId, escola.quem.email)
      const revogadosAntes = await auditoriaDe(escola.escolaId, 'convite.revogado')
      const resposta = await revogar(sessao.token, alvo)
      expect(resposta.cacheControl).toBe('no-store')

      const esperado = REVOGAR[estado]
      if (esperado !== 204) {
        esperarErro(resposta, esperado, CODIGO[esperado])
        expect(await retrato(escola.escolaId, escola.quem.email)).toEqual(antes)
        return
      }
      expect(resposta.status).toBe(204)
      expect(resposta.texto).toBe('')
      expect((await pool.query('select revogado_em is not null as revogado from convite where id = $1', [alvo])).rows).toEqual([{ revogado: true }])
      expect(await auditoriaDe(escola.escolaId, 'convite.revogado')).toEqual([
        ...revogadosAntes,
        { entidade_id: alvo, autor_operador: sessao.apelido, autor_usuario_id: null, antes: null, depois: null },
      ])
      expect(await estadoDe(escola.escolaId)).toBe('revogado')
      expect(await abertos(escola.escolaId)).toBe(0)
    })

    it('o convite anterior que o gerar já revogou responde NAO_ENCONTRADO; um em aberto que não é o último (de antes da trava) responde CONFLITO', async () => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm('aceito', sessao.token)
      expect((await gerar(sessao.token, escola.escolaId)).status).toBe(201)
      esperarErro(await revogar(sessao.token, escola.conviteId ?? ''), 404, CodigoDeErro.NAO_ENCONTRADO)

      // Um convite em aberto de outro usuário, que vence antes do último: só dado de antes da trava chega a isso.
      const outraConta = pessoa()
      const { rows: contas } = await pool.query<{ id: string }>('insert into conta (email) values ($1) returning id', [outraConta.email])
      const { rows: antigos } = await pool.query<{ id: string }>(
        "insert into usuario (escola_id, conta_id, papel, nome, desativado_em) values ($1, $2, 'coordenador', 'Pessoa sintética', now()) returning id",
        [escola.escolaId, contas[0]?.id],
      )
      const { rows: convites } = await pool.query<{ id: string }>(
        "insert into convite (escola_id, token_hash, tipo, usuario_id, expira_em) values ($1, $2, 'coordenador', $3, now() + interval '1 hour') returning id",
        [escola.escolaId, createHash('sha256').update(randomUUID()).digest('hex'), antigos[0]?.id],
      )
      const antigo = convites[0]?.id ?? ''
      const antes = await retrato(escola.escolaId, outraConta.email)
      esperarErro(await revogar(sessao.token, antigo), 409, CodigoDeErro.CONFLITO)
      expect(await retrato(escola.escolaId, outraConta.email)).toEqual(antes)
    })
  })

  describe('E7: escola inexistente', () => {
    it('gerar numa escola que não existe é NAO_ENCONTRADO, sem conta, usuário nem convite; o id fora do formato também', async () => {
      const sessao = await operadores.operadorComSessao()
      const quem = pessoa()
      const escolaId = randomUUID()
      esperarErro(await gerar(sessao.token, escolaId, quem), 404, CodigoDeErro.NAO_ENCONTRADO)
      esperarErro(await gerar(sessao.token, 'nao-e-uuid', quem), 404, CodigoDeErro.NAO_ENCONTRADO)
      expect((await pool.query('select id from conta where email = $1', [quem.email])).rows).toEqual([])
      expect((await pool.query('select id from usuario where escola_id = $1', [escolaId])).rows).toEqual([])
      expect((await pool.query('select id from auditoria where escola_id = $1', [escolaId])).rows).toEqual([])
      esperarErro(await revogar(sessao.token, 'nao-e-uuid'), 404, CodigoDeErro.NAO_ENCONTRADO)
    })
  })

  describe('E12: o corpo não escolhe o autor nem a escola', () => {
    it('gerar com autor, escolaId ou qualquer campo a mais, e revogar com corpo, são 400 ENTRADA_INVALIDA, sem gravar nada', async () => {
      const sessao = await operadores.operadorComSessao()
      // Sem convite, o gerar criaria; com o convite pendente, o revogar revogaria: só o corpo os segura.
      const livre = await escolas.escola()
      const escola = await escolaEm('pendente', sessao.token)
      const quem = pessoa()
      const [livreAntes, antes] = [await retrato(livre, quem.email), await retrato(escola.escolaId, quem.email)]
      for (const aMais of [{ autor: 'outra-pessoa' }, { autorOperador: 'outra-pessoa' }, { escolaId: escola.escolaId }]) {
        esperarErro(await gerar(sessao.token, livre, { ...quem, ...aMais }), 400, CodigoDeErro.ENTRADA_INVALIDA)
      }
      for (const corpo of [{ autor: 'outra-pessoa' }, { conviteId: escola.conviteId }]) esperarErro(await revogar(sessao.token, escola.conviteId ?? '', corpo), 400, CodigoDeErro.ENTRADA_INVALIDA)
      expect(await retrato(livre, quem.email)).toEqual(livreAntes)
      expect(await retrato(escola.escolaId, quem.email)).toEqual(antes)
      expect((await pool.query('select id from conta where email = $1', [quem.email])).rows).toEqual([])
      expect((await pool.query(`select 1 from auditoria where autor_operador = 'outra-pessoa'`)).rows).toEqual([])
    })
  })

  describe('E8: em paralelo na mesma escola, com a ordem forçada pela trava, no fim há no máximo um convite em aberto', () => {
    it('dois gerar com e-mails diferentes: um cria, o outro recebe CONFLITO', async () => {
      const sessao = await operadores.operadorComSessao()
      const escolaId = await escolas.escola()
      const respostas = await naFilaDaTrava(escolaId, () => [gerar(sessao.token, escolaId), gerar(sessao.token, escolaId)])
      expect(respostas.map((resposta) => resposta.status).sort()).toEqual([201, 409])
      esperarErro(respostas.find((resposta) => resposta.status === 409) as Resposta, 409, CodigoDeErro.CONFLITO)
      expect(await abertos(escolaId)).toBe(1)
      expect(await auditoriaDe(escolaId, 'convite.criado')).toHaveLength(1)
    })

    it('dois gerar com o mesmo e-mail: uma conta, um usuário e um convite; o outro recebe CONFLITO', async () => {
      const sessao = await operadores.operadorComSessao()
      const escolaId = await escolas.escola()
      const quem = pessoa()
      const respostas = await naFilaDaTrava(escolaId, () => [gerar(sessao.token, escolaId, quem), gerar(sessao.token, escolaId, quem)])
      expect(respostas.map((resposta) => resposta.status).sort()).toEqual([201, 409])
      esperarErro(respostas.find((resposta) => resposta.status === 409) as Resposta, 409, CodigoDeErro.CONFLITO)
      expect((await pool.query('select id from conta where email = $1', [quem.email])).rows).toHaveLength(1)
      expect((await pool.query('select id from usuario where escola_id = $1', [escolaId])).rows).toHaveLength(1)
      expect((await pool.query('select id from convite where escola_id = $1', [escolaId])).rows).toHaveLength(1)
    })

    it('gerar e revogar em aceito: o gerar cria; o revogar revoga (antes) ou responde NAO_ENCONTRADO (depois); o anterior sai revogado uma vez', async () => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm('aceito', sessao.token)
      const [doGerar, doRevogar] = await naFilaDaTrava(escola.escolaId, () => [gerar(sessao.token, escola.escolaId), revogar(sessao.token, escola.conviteId ?? '')])
      expect(doGerar?.status).toBe(201)
      // O revogar que perde para o gerar acha o convite já revogado por ele: NAO_ENCONTRADO, como no F1.
      if (doRevogar?.status === 204) expect(doRevogar.texto).toBe('')
      else esperarErro(doRevogar as Resposta, 404, CodigoDeErro.NAO_ENCONTRADO)
      expect(await abertos(escola.escolaId)).toBe(1)
      expect((await auditoriaDe(escola.escolaId, 'convite.revogado')).filter((linha) => linha.entidade_id === escola.conviteId)).toHaveLength(1)
    })

    it('dois revogar: um 204 e um NAO_ENCONTRADO, com uma auditoria', async () => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm('pendente', sessao.token)
      const respostas = await naFilaDaTrava(escola.escolaId, () => [revogar(sessao.token, escola.conviteId ?? ''), revogar(sessao.token, escola.conviteId ?? '')])
      expect(respostas.map((resposta) => resposta.status).sort()).toEqual([204, 404])
      esperarErro(respostas.find((resposta) => resposta.status === 404) as Resposta, 404, CodigoDeErro.NAO_ENCONTRADO)
      expect(await auditoriaDe(escola.escolaId, 'convite.revogado')).toHaveLength(1)
      expect(await abertos(escola.escolaId)).toBe(0)
    })
  })

  describe('E10: a trava e o contexto são por escola', () => {
    it('o mesmo e-mail em duas escolas: com a trava de A segura, B termina; cada convite na sua escola, e nada da outra na resposta', async () => {
      const sessao = await operadores.operadorComSessao()
      const [escolaA, escolaB] = [await escolas.escola(), await escolas.escola()]
      const quem = pessoa()
      const soltar = await segurarTravaDaEscola(escolaA)
      let emA: Promise<Resposta> | undefined
      let respostaB: Resposta
      try {
        // Com a trava de outra chave que não a da escola (uma global, por exemplo), A não esperaria aqui; com a chave de
        // A para as duas, B esperaria A e estouraria o prazo abaixo.
        emA = gerar(sessao.token, escolaA, quem)
        await esperarNaTravaDaEscola(escolaA, 1)
        let prazo: NodeJS.Timeout | undefined
        respostaB = await Promise.race([
          gerar(sessao.token, escolaB, quem),
          new Promise<never>((_, recusar) => {
            prazo = setTimeout(() => recusar(new Error('a escola B esperou a trava da escola A')), PRAZO_DA_OUTRA_ESCOLA_MS)
          }),
        ]).finally(() => clearTimeout(prazo))
        await esperarNaTravaDaEscola(escolaA, 1)
      } finally {
        await soltar()
      }
      const respostaA = await emA
      expect([respostaA.status, respostaB.status]).toEqual([201, 201])
      const [deA, deB] = [gerado(respostaA), gerado(respostaB)]
      const { rows } = await pool.query<{ id: string; escola_id: string; conta_id: string }>(
        'select c.id, c.escola_id, u.conta_id from convite c join usuario u on u.id = c.usuario_id where c.id = any($1::uuid[]) order by c.escola_id = $2 desc',
        [[deA.conviteId, deB.conviteId], escolaA],
      )
      expect(rows.map((linha) => [linha.id, linha.escola_id])).toEqual([
        [deA.conviteId, escolaA],
        [deB.conviteId, escolaB],
      ])
      expect(new Set(rows.map((linha) => linha.conta_id)).size).toBe(1)
      expect(respostaA.texto).not.toContain(deB.conviteId)
      expect(respostaB.texto).not.toContain(deA.conviteId)
      for (const texto of [respostaA.texto, respostaB.texto]) for (const outraEscola of [escolaA, escolaB]) expect(texto).not.toContain(outraEscola)
    })
  })

  describe('E11: o autor desativado no meio do gerar e do revogar', () => {
    it('gerar, com o desativar segurando a linha: espera o for share e responde 401 SESSAO_ENCERRADA sem gravar nada', async () => {
      const sessao = await operadores.operadorComSessao()
      const escolaId = await escolas.escola()
      const quem = pessoa()
      const antes = await retrato(escolaId, quem.email)
      const desativar = await segurarODesativar(pool, sessao.operadorId)
      try {
        const escrita = gerar(sessao.token, escolaId, quem)
        await esperarNaTrava(pool, ESPERA_DO_AUTOR)
        await desativar.confirmar()
        esperarErro(await escrita, 401, CodigoDeErro.SESSAO_ENCERRADA)
      } finally {
        await desativar.desfazer()
      }
      expect(await retrato(escolaId, quem.email)).toEqual(antes)
    })

    it('revogar, com o desativar segurando a linha: o mesmo, e o convite continua em aberto', async () => {
      const [sessao, quemPrepara] = await Promise.all([operadores.operadorComSessao(), operadores.operadorComSessao()])
      const escola = await escolaEm('pendente', quemPrepara.token)
      const antes = await retrato(escola.escolaId, escola.quem.email)
      const desativar = await segurarODesativar(pool, sessao.operadorId)
      try {
        const escrita = revogar(sessao.token, escola.conviteId ?? '')
        await esperarNaTrava(pool, ESPERA_DO_AUTOR)
        await desativar.confirmar()
        esperarErro(await escrita, 401, CodigoDeErro.SESSAO_ENCERRADA)
      } finally {
        await desativar.desfazer()
      }
      expect(await retrato(escola.escolaId, escola.quem.email)).toEqual(antes)
      expect(await abertos(escola.escolaId)).toBe(1)
    })

    it.each([
      ['gerar', 'insert'],
      ['revogar', 'update'],
    ] as const)('%s segurando o for share (parado no %s de convite): o desativar espera, e a escrita entra com a auditoria', async (acao, evento) => {
      const [sessao, quemDesativa] = await Promise.all([operadores.operadorComSessao(), operadores.operador()])
      const escola = acao === 'gerar' ? { escolaId: await escolas.escola(), conviteId: undefined } : await escolaEm('pendente', (await operadores.operadorComSessao()).token)
      const gatilho = new GatilhoDeParada(pool, { tabela: 'convite', evento, quando: `new.escola_id = '${escola.escolaId}'::uuid` })
      await gatilho.armar()
      try {
        const escrita = acao === 'gerar' ? gerar(sessao.token, escola.escolaId) : revogar(sessao.token, escola.conviteId ?? '')
        await gatilho.esperarParadas()
        const desativacao = desativarOperador(banco, quemDesativa.apelido, sessao.apelido)
        await esperarNaTrava(pool, '%from "operador"%for update%')
        await gatilho.soltar()
        expect((await escrita).status).toBe(acao === 'gerar' ? 201 : 204)
        await desativacao
        const registrada = await auditoriaDe(escola.escolaId, acao === 'gerar' ? 'convite.criado' : 'convite.revogado')
        expect(registrada).toEqual([expect.objectContaining({ autor_operador: sessao.apelido, autor_usuario_id: null })])
        expect((await pool.query('select desativado_em is not null as desativado from operador where id = $1', [sessao.operadorId])).rows).toEqual([{ desativado: true }])
      } finally {
        await gatilho.desarmar()
      }
    })
  })

  describe('E13 e o revogar pelo comando: os ops:* de convite passam pela mesma matriz do painel', () => {
    const rodar = async (comando: typeof executarOpsConviteCoordenador, argumentos: string[], operador: string) => {
      let saida = ''
      let erro = ''
      const terminal: SaidaDoComando = { saida: (texto) => (saida += texto), erro: (texto) => (erro += texto) }
      const codigo = await comando(argumentos, { ...lerAmbienteDeTeste(), OPERADOR: operador, BANCO_TIMEOUT_CONSULTA_MS: String(PRAZO_DAS_CONSULTAS_MS) }, terminal)
      return { codigo, saida, erro }
    }

    it('ops:convite-coordenador numa escola com convite em aberto: código 1, CONFLITO, nada gravado e nenhum arquivo', async () => {
      const [sessao, quemRoda] = await Promise.all([operadores.operadorComSessao(), operadores.operador()])
      const escola = await escolaEm('pendente', sessao.token)
      const outra = pessoa()
      const arquivo = join(pasta, `token-${randomUUID()}.txt`)
      const antes = await retrato(escola.escolaId, outra.email)
      const execucao = await rodar(executarOpsConviteCoordenador, ['--escola', await escolas.slugDe(escola.escolaId), '--email', outra.email, '--nome', outra.nome, '--saida', arquivo], quemRoda.apelido)
      expect(execucao).toEqual({ codigo: 1, saida: '', erro: 'CONFLITO: a escola já tem coordenação ativa ou convite em aberto; revogue o convite antes de gerar outro\n' })
      expect(await retrato(escola.escolaId, outra.email)).toEqual(antes)
      expect(existsSync(arquivo)).toBe(false)
    })

    it('ops:revogar-convite: numa escola com coordenação ativa, CONFLITO sem gravar nada; num convite pendente, revoga com o OPERADOR na auditoria', async () => {
      const [sessao, quemRoda] = await Promise.all([operadores.operadorComSessao(), operadores.operador()])
      const ativa = await escolaEm('ativa', sessao.token)
      const antes = await retrato(ativa.escolaId, ativa.quem.email)
      expect(await rodar(executarOpsRevogarConvite, ['--convite', ativa.conviteId ?? ''], quemRoda.apelido)).toEqual({ codigo: 1, saida: '', erro: 'CONFLITO\n' })
      expect(await retrato(ativa.escolaId, ativa.quem.email)).toEqual(antes)

      const pendente = await escolaEm('pendente', sessao.token)
      expect(await rodar(executarOpsRevogarConvite, ['--convite', pendente.conviteId ?? ''], quemRoda.apelido)).toEqual({ codigo: 0, saida: 'ok\n', erro: '' })
      expect(await auditoriaDe(pendente.escolaId, 'convite.revogado')).toEqual([{ entidade_id: pendente.conviteId, autor_operador: quemRoda.apelido, autor_usuario_id: null, antes: null, depois: null }])
      expect(await estadoDe(pendente.escolaId)).toBe('revogado')
    })
  })

  describe('I7: escola ativa, e o alarme do tipo', () => {
    it('revogar pelo id do convite de uma escola ativa não grava nada', async () => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm('ativa', sessao.token)
      const antes = await retrato(escola.escolaId, escola.quem.email)
      esperarErro(await revogar(sessao.token, escola.conviteId ?? ''), 409, CodigoDeErro.CONFLITO)
      expect(await retrato(escola.escolaId, escola.quem.email)).toEqual(antes)
    })

    it('alarme: convite de outro tipo não entra (23514). Quando a A1 afrouxar o check, este teste quebra e pede o de "outro tipo responde NAO_ENCONTRADO"', async () => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm('revogado', sessao.token)
      const { rows } = await pool.query<{ usuario_id: string }>('select usuario_id from convite where id = $1', [escola.conviteId])
      await expect(
        pool.query("insert into convite (escola_id, token_hash, tipo, usuario_id, expira_em) values ($1, $2, 'professor', $3, now() + interval '1 hour')", [
          escola.escolaId,
          createHash('sha256').update(randomUUID()).digest('hex'),
          rows[0]?.usuario_id,
        ]),
      ).rejects.toMatchObject({ code: '23514', constraint: 'convite_tipo_valido' })
    })
  })

  describe('A2 e A3: o token só na resposta, e o log só com ids', () => {
    it('depois de gerar, o token não está em coluna de convite nem na auditoria, e o token_hash é o SHA-256 dele', async () => {
      const sessao = await operadores.operadorComSessao()
      const escola = await escolaEm('aceito', sessao.token)
      const resposta = await gerar(sessao.token, escola.escolaId)
      const { conviteId, token } = gerado(resposta)
      const { rows: convites } = await pool.query<{ linha: string; token_hash: string }>('select to_jsonb(c)::text as linha, token_hash from convite c where c.escola_id = $1', [escola.escolaId])
      expect(convites.length).toBeGreaterThanOrEqual(2)
      for (const { linha } of convites) expect(linha).not.toContain(token)
      expect((await pool.query('select token_hash from convite where id = $1', [conviteId])).rows).toEqual([{ token_hash: createHash('sha256').update(token).digest('hex') }])
      const { rows: auditoria } = await pool.query<{ linha: string }>('select to_jsonb(a)::text as linha from auditoria a where a.escola_id = $1', [escola.escolaId])
      expect(auditoria.length).toBeGreaterThanOrEqual(3)
      for (const { linha } of auditoria) expect(linha).not.toContain(token)
    })

    it('as linhas de log do gerar e do revogar, e das recusas, levam só ids: nada de nome, e-mail, endereço nem token', async () => {
      const sessao = await operadores.operadorComSessao()
      const escolaId = await escolas.escola()
      const slug = await escolas.slugDe(escolaId)
      const quem = { nome: `Coordenadora Sentinela ${randomUUID().slice(0, 8)}`, email: `sentinela-${randomUUID()}@escola.invalid` }
      linhasDeLog.length = 0
      const resposta = await gerar(sessao.token, escolaId, quem)
      const { conviteId, token } = gerado(resposta)
      esperarErro(await gerar(sessao.token, escolaId, quem), 409, CodigoDeErro.CONFLITO)
      expect((await revogar(sessao.token, conviteId)).status).toBe(204)
      esperarErro(await revogar(sessao.token, conviteId), 404, CodigoDeErro.NAO_ENCONTRADO)

      expect(linhasComEvento('operacao.convite.gerado')).toEqual([expect.objectContaining({ escolaId })])
      expect(linhasComEvento('operacao.convite.revogado')).toEqual([expect.objectContaining({ escolaId })])
      const todoOLog = linhasDeLog.join('\n')
      for (const sentinela of [quem.nome, quem.email, slug, token, sessao.nome]) expect(todoOLog).not.toContain(sentinela)
    })
  })
})
