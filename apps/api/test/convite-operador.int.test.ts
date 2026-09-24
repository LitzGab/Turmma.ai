import 'reflect-metadata'
import { criarLogger, type Banco } from '@educa/nucleo'
import { CodigoDeErro, esquemaRespostaAceitarConviteDeOperador, esquemaRespostaConsultarConviteDeOperador, MENSAGENS_DE_ERRO } from '@educa/shared'
import type { INestApplication, Type } from '@nestjs/common'
import { DiscoveryService, NestFactory } from '@nestjs/core'
import { randomBytes, randomUUID } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import { isDeepStrictEqual } from 'node:util'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { AppModule } from '../src/app.module.js'
import { BANCO } from '../src/banco.module.js'
import { configurarAplicacao } from '../src/configurar-app.js'
import { verificarDesafioDeOperador } from '../src/operacao/desafio-de-operador.js'
import { gerarConviteDeOperador } from '../src/ops/operador.js'
import { criarConviteDeCoordenador } from '../src/sessao/convite.service.js'
import { HashDeSenha } from '../src/sessao/hash-de-senha.js'
import { SemaforoDeHash } from '../src/sessao/senha/semaforo-de-hash.js'
import { cookieDeRenovacao } from './api-com-sessao.js'
import { configuracaoDeTeste, MONTAGEM_DE_TESTE } from './configuracao-de-teste.js'
import { caminhoConcreto, rotasDe } from './rotas-registradas.js'
import { BancadaDeOperadores } from './sessao-de-operador.js'
import { BancadaDeSessoes } from './sessao-de-teste.js'

const SENHA = 'senha-nova-do-operador-1'
const OUTRA_SENHA = 'outra-senha-do-operador-2'
const HORA_MS = 60 * 60 * 1_000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

interface Resposta {
  readonly status: number
  readonly corpo: unknown
  readonly cacheControl: string | null
  readonly retryAfter: string | null
  readonly setCookie: string[]
}

type Cabecalhos = Record<string, string>

async function pedir(url: string, verbo: string, caminho: string, corpo?: unknown, cabecalhos: Cabecalhos = {}): Promise<Resposta> {
  const resposta = await fetch(`${url}${caminho}`, {
    method: verbo,
    headers: { ...(corpo === undefined ? {} : { 'Content-Type': 'application/json' }), ...cabecalhos },
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  })
  const texto = await resposta.text()
  return {
    status: resposta.status,
    corpo: texto === '' ? undefined : (JSON.parse(texto) as unknown),
    cacheControl: resposta.headers.get('cache-control'),
    retryAfter: resposta.headers.get('retry-after'),
    setCookie: resposta.headers.getSetCookie(),
  }
}

/** O corpo sem o `requisicaoId`, que muda a cada requisição: o resto tem de ser igual, byte a byte. */
function semRequisicaoId(corpo: unknown): unknown {
  if (typeof corpo !== 'object' || corpo === null || !('erro' in corpo)) return corpo
  const { requisicaoId: _id, ...erro } = (corpo as { erro: Record<string, unknown> }).erro
  return { erro }
}

function esperarErro(resposta: Resposta, status: number, codigo: CodigoDeErro): void {
  expect(resposta.status).toBe(status)
  expect(resposta.corpo).toEqual({ erro: { codigo, mensagem: MENSAGENS_DE_ERRO[codigo], requisicaoId: expect.stringMatching(UUID) } })
}

/** Status e corpo (sem o `requisicaoId`) de uma resposta, para comparar respostas que precisam ser iguais. */
const forma = (resposta: Resposta) => ({ status: resposta.status, corpo: semRequisicaoId(resposta.corpo) })

/**
 * Um IP sorteado entre 16 milhões, para cada pedido ter o seu balde de limite: os baldes `rl:ip` ficam no Redis entre um
 * teste e outro, e um IP repetido herdaria a contagem.
 */
const ipSorteado = () => `10.${[...randomBytes(3)].join('.')}`

async function subir(config = configuracaoDeTeste()): Promise<{ app: INestApplication; url: string }> {
  const app = await NestFactory.create(AppModule.com(config, MONTAGEM_DE_TESTE), { logger: false })
  configurarAplicacao(app, criarLogger({ servico: 'api-teste', nivel: 'silent' }))
  await app.listen(0, '127.0.0.1')
  return { app, url: `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}` }
}

/** Uma barreira: segura quem chama até `soltar`, e avisa quando `quantos` chegaram. */
function barreira(quantos = 1): { chegaram: Promise<void>; esperar: () => Promise<void>; soltar: () => void } {
  let chegados = 0
  let avisar: () => void = () => undefined
  let liberar: () => void = () => undefined
  const chegaram = new Promise<void>((resolver) => (avisar = resolver))
  const solta = new Promise<void>((resolver) => (liberar = resolver))
  return {
    chegaram,
    esperar: async () => {
      chegados += 1
      if (chegados >= quantos) avisar()
      await solta
    },
    soltar: () => liberar(),
  }
}

describe('convite do operador: consultar e aceitar (tarefa 5.0)', () => {
  const operadores = new BancadaDeOperadores()
  const escolas = new BancadaDeSessoes()
  let app: INestApplication
  let url: string
  let banco: Banco
  let hash: HashDeSenha
  let autor: string

  beforeAll(async () => {
    ;({ app, url } = await subir(configuracaoDeTeste({ ambiente: { LIMITE_PROXIES_CONFIAVEIS: '127.0.0.1' } })))
    banco = app.get<Banco>(BANCO)
    hash = app.get(HashDeSenha)
    // O autor dos `ops:operador convite` dos testes: com um operador ativo, o comando exige um deles.
    autor = (await operadores.operador()).apelido
  })

  afterAll(async () => {
    await app.close()
    await operadores.fechar()
    await escolas.fechar()
  })

  /** Um operador ativo novo e um convite dele, gerado pelo mesmo código do `ops:operador convite`. */
  async function operadorComConvite(relogio?: { agora: () => Date }): Promise<{ operadorId: string; apelido: string; conviteId: string; token: string }> {
    const { operadorId, apelido } = await operadores.operador()
    const { conviteId, token } = await gerarConviteDeOperador(banco, autor, apelido, relogio)
    return { operadorId, apelido, conviteId, token }
  }

  const ip = (valor = ipSorteado()): Cabecalhos => ({ 'X-Forwarded-For': valor })
  const consultar = (token: string, cabecalhos: Cabecalhos = ip()) => pedir(url, 'POST', '/v1/operacao/convite/consultar', { token }, cabecalhos)
  const aceitar = (token: string, senha = SENHA, cabecalhos: Cabecalhos = ip()) => pedir(url, 'POST', '/v1/operacao/convite/aceitar', { token, senha }, cabecalhos)

  async function linhaDoOperador(operadorId: string): Promise<{ senha_hash: string | null; mfa_segredo_cifrado: Buffer | null; mfa_ativado_em: Date | null; mfa_ultimo_passo: string | null; mfa_chave_versao: number | null; codigos: number }> {
    const { rows } = await operadores.pool.query<{ senha_hash: string | null; mfa_segredo_cifrado: Buffer | null; mfa_ativado_em: Date | null; mfa_ultimo_passo: string | null; mfa_chave_versao: number | null; codigos: number }>(
      `select o.senha_hash, o.mfa_segredo_cifrado, o.mfa_ativado_em, o.mfa_ultimo_passo, o.mfa_chave_versao,
              (select count(*)::int from codigo_recuperacao_operador c where c.operador_id = o.id) as codigos
         from operador o where o.id = $1`,
      [operadorId],
    )
    const linha = rows[0]
    if (linha === undefined) throw new Error('operador não encontrado')
    return linha
  }

  async function usadoEm(conviteId: string): Promise<Date | null> {
    const { rows } = await operadores.pool.query<{ usado_em: Date | null }>('select usado_em from convite_operador where id = $1', [conviteId])
    return rows[0]?.usado_em ?? null
  }

  /** Desativa o operador direto no banco, **sem** revogar o convite: isola a cláusula do operador ativo. */
  async function desativarSemRevogar(operadorId: string): Promise<void> {
    await operadores.pool.query(
      `update operador set nome = null, email = null, senha_hash = null, mfa_segredo_cifrado = null, mfa_chave_versao = null,
              mfa_ativado_em = null, mfa_ultimo_passo = null, desativado_em = now() where id = $1`,
      [operadorId],
    )
  }

  /**
   * O aceite com uma mudança no meio: o hash da senha espera numa barreira, a mudança roda, e o aceite segue para a
   * transação. A consulta do convite já passou: quem recusa, se recusar, é a trava do banco.
   */
  async function aceitarMudandoDuranteOHash(token: string, mudar: () => Promise<void>): Promise<Resposta> {
    const gerar = hash.gerar.bind(hash)
    const espera = barreira()
    const espiao = vi.spyOn(hash, 'gerar').mockImplementation(async (senha) => {
      await espera.esperar()
      return gerar(senha)
    })
    try {
      const pendente = aceitar(token)
      await espera.chegaram
      await mudar()
      espera.soltar()
      return await pendente
    } finally {
      espiao.mockRestore()
    }
  }

  describe('o caminho feliz', () => {
    it('consultar diz só que vale; aceitar grava a senha, zera o segundo fator, usa o convite e devolve o desafio configurar_mfa, tudo com no-store', async () => {
      const convite = await operadorComConvite()
      // O operador já tinha senha, segundo fator e códigos: o convite novo é o caminho de recuperar a conta.
      await operadores.pool.query(
        `update operador set senha_hash = 'hash-antigo', mfa_segredo_cifrado = '\\x0102'::bytea, mfa_chave_versao = 1, mfa_ativado_em = now(), mfa_ultimo_passo = 7 where id = $1`,
        [convite.operadorId],
      )
      await operadores.pool.query('insert into codigo_recuperacao_operador (operador_id, hmac) values ($1, $2)', [convite.operadorId, 'h'.repeat(43)])

      const consulta = await consultar(convite.token)
      expect(consulta.status).toBe(200)
      expect(consulta.corpo).toStrictEqual({ valido: true })
      expect(consulta.cacheControl).toBe('no-store')

      const aceite = await aceitar(convite.token)
      expect(aceite.status).toBe(200)
      expect(aceite.cacheControl).toBe('no-store')
      expect(aceite.setCookie).toEqual([])
      const corpo = esquemaRespostaAceitarConviteDeOperador.parse(aceite.corpo)
      expect(Object.keys(aceite.corpo as object).sort()).toEqual(['desafio', 'etapa'])
      expect(corpo.etapa).toBe('configurar_mfa')
      const configuracao = configuracaoDeTeste()
      await expect(verificarDesafioDeOperador(corpo.desafio, configuracao.identidade.chaveAssinatura, 'configurar_mfa')).resolves.toMatchObject({ operadorId: convite.operadorId, etapa: 'configurar_mfa' })

      const linha = await linhaDoOperador(convite.operadorId)
      expect(await hash.verificar(linha.senha_hash, SENHA)).toBe(true)
      expect({ ...linha, senha_hash: undefined }).toEqual({ senha_hash: undefined, mfa_segredo_cifrado: null, mfa_ativado_em: null, mfa_ultimo_passo: null, mfa_chave_versao: null, codigos: 0 })
      expect(await usadoEm(convite.conviteId)).not.toBeNull()
    })
  })

  describe('C9: usado, vencido, revogado e inexistente respondem igual, em consultar e em aceitar', () => {
    it('os quatro dão o mesmo 404 NAO_ENCONTRADO, com o mesmo corpo, e nada é gravado', async () => {
      // Usado: aceito uma vez.
      const usado = await operadorComConvite()
      expect((await aceitar(usado.token)).status).toBe(200)
      const senhaDoUsado = (await linhaDoOperador(usado.operadorId)).senha_hash
      // Vencido: gerado 73 h atrás pelo relógio do comando.
      const vencido = await operadorComConvite({ agora: () => new Date(Date.now() - 73 * HORA_MS) })
      // Revogado: valia até a revogação.
      const revogado = await operadorComConvite()
      expect((await consultar(revogado.token)).status).toBe(200)
      await operadores.pool.query('update convite_operador set revogado_em = now() where id = $1', [revogado.conviteId])
      const inexistente = randomBytes(32).toString('base64url')

      const casos = { usado: usado.token, vencido: vencido.token, revogado: revogado.token, inexistente }
      const esperado = forma(await consultar(inexistente))
      esperarErro(await consultar(inexistente), 404, CodigoDeErro.NAO_ENCONTRADO)
      for (const [caso, token] of Object.entries(casos)) {
        const [consulta, aceite] = [await consultar(token), await aceitar(token, OUTRA_SENHA)]
        esperarErro(consulta, 404, CodigoDeErro.NAO_ENCONTRADO)
        expect(forma(consulta), `consultar ${caso}`).toEqual(esperado)
        expect(forma(aceite), `aceitar ${caso}`).toEqual(esperado)
      }
      // Nada gravado: a senha do usado é a do primeiro aceite, e os outros continuam sem senha e sem uso.
      expect((await linhaDoOperador(usado.operadorId)).senha_hash).toBe(senhaDoUsado)
      for (const convite of [vencido, revogado]) {
        expect((await linhaDoOperador(convite.operadorId)).senha_hash).toBeNull()
        expect(await usadoEm(convite.conviteId)).toBeNull()
      }
    })

    it('borda: com o relógio do comando controlado, o convite vale às 71h50 (a mesma prova das 71h59, com folga entre o relógio do Node e o do Postgres) e responde igual a inexistente às 72h01', async () => {
      const aindaVale = await operadorComConvite({ agora: () => new Date(Date.now() - (71 * HORA_MS + 50 * 60_000)) })
      const venceu = await operadorComConvite({ agora: () => new Date(Date.now() - (72 * HORA_MS + 60_000)) })
      const esperado = forma(await consultar(randomBytes(32).toString('base64url')))
      expect(forma(await consultar(venceu.token))).toEqual(esperado)
      expect(forma(await aceitar(venceu.token))).toEqual(esperado)
      expect(await usadoEm(venceu.conviteId)).toBeNull()
      expect((await consultar(aindaVale.token)).status).toBe(200)
      expect((await aceitar(aindaVale.token)).status).toBe(200)
    })

    it('C7 (parte): depois de outro `ops:operador convite`, o link antigo responde igual a revogado, e o novo vale', async () => {
      const convite = await operadorComConvite()
      expect((await consultar(convite.token)).status).toBe(200)
      const novo = await gerarConviteDeOperador(banco, autor, convite.apelido)
      // A referência: um convite revogado pelo banco.
      const revogado = await operadorComConvite()
      await operadores.pool.query('update convite_operador set revogado_em = now() where id = $1', [revogado.conviteId])
      const comoRevogado = { consultar: forma(await consultar(revogado.token)), aceitar: forma(await aceitar(revogado.token)) }
      esperarErro(await consultar(revogado.token), 404, CodigoDeErro.NAO_ENCONTRADO)
      expect({ consultar: forma(await consultar(convite.token)), aceitar: forma(await aceitar(convite.token)) }).toEqual(comoRevogado)
      expect(await usadoEm(convite.conviteId)).toBeNull()
      expect((await consultar(novo.token)).status).toBe(200)
      expect((await aceitar(novo.token)).status).toBe(200)
    })
  })

  describe('C11: operador desativado com convite pendente não aceita', () => {
    it('desativado antes: consultar e aceitar respondem igual a inexistente, e o convite fica sem uso', async () => {
      const convite = await operadorComConvite()
      expect((await consultar(convite.token)).status).toBe(200)
      await desativarSemRevogar(convite.operadorId)
      const esperado = forma(await consultar(randomBytes(32).toString('base64url')))
      expect(forma(await consultar(convite.token))).toEqual(esperado)
      expect(forma(await aceitar(convite.token))).toEqual(esperado)
      expect(await usadoEm(convite.conviteId)).toBeNull()
      expect((await linhaDoOperador(convite.operadorId)).senha_hash).toBeNull()
    })

    it('desativado durante o hash (depois da consulta do convite, antes da transação): a trava do operador ativo recusa, e nada é gravado', async () => {
      const convite = await operadorComConvite()
      const resposta = await aceitarMudandoDuranteOHash(convite.token, () => desativarSemRevogar(convite.operadorId))
      expect(forma(resposta)).toEqual(forma(await consultar(randomBytes(32).toString('base64url'))))
      expect(await usadoEm(convite.conviteId)).toBeNull()
      expect((await linhaDoOperador(convite.operadorId)).senha_hash).toBeNull()
    })
  })

  describe('a trava do aceite no banco: o que muda entre a consulta do convite e a transação', () => {
    it('revogado pelo `ops:operador convite` durante o hash: recusado igual a revogado, e o convite novo continua valendo', async () => {
      const convite = await operadorComConvite()
      let novo = ''
      const resposta = await aceitarMudandoDuranteOHash(convite.token, async () => {
        novo = (await gerarConviteDeOperador(banco, autor, convite.apelido)).token
      })
      expect(forma(resposta)).toEqual(forma(await consultar(randomBytes(32).toString('base64url'))))
      expect(await usadoEm(convite.conviteId)).toBeNull()
      expect((await linhaDoOperador(convite.operadorId)).senha_hash).toBeNull()
      expect((await consultar(novo)).status).toBe(200)
    })

    it('vencido durante o hash: recusado igual a vencido, e nada é gravado', async () => {
      const convite = await operadorComConvite()
      const resposta = await aceitarMudandoDuranteOHash(convite.token, async () => {
        await operadores.pool.query(`update convite_operador set expira_em = now() - interval '1 second' where id = $1`, [convite.conviteId])
      })
      expect(forma(resposta)).toEqual(forma(await consultar(randomBytes(32).toString('base64url'))))
      expect(await usadoEm(convite.conviteId)).toBeNull()
      expect((await linhaDoOperador(convite.operadorId)).senha_hash).toBeNull()
    })
  })

  describe('a trava do aceite contra o `desativar` concorrente', () => {
    it('o `desativar` que trava o operador primeiro: o aceite espera na linha, vê o operador desativado e responde igual a inexistente, sem deadlock e sem nada gravado', async () => {
      const convite = await operadorComConvite()
      const desativar = await operadores.pool.connect()
      try {
        // A transação do `desativarOperador`, na ordem dele: trava e apaga o operador, e só depois revoga o convite.
        let resposta: Promise<Resposta> | undefined
        const gerar = hash.gerar.bind(hash)
        const espera = barreira()
        const espiao = vi.spyOn(hash, 'gerar').mockImplementation(async (senha) => {
          await espera.esperar()
          return gerar(senha)
        })
        try {
          resposta = aceitar(convite.token)
          await espera.chegaram
          await desativar.query('begin')
          await desativar.query('select id from operador where id = $1 for update', [convite.operadorId])
          await desativar.query(
            `update operador set nome = null, email = null, senha_hash = null, mfa_segredo_cifrado = null, mfa_chave_versao = null,
                    mfa_ativado_em = null, mfa_ultimo_passo = null, desativado_em = now() where id = $1`,
            [convite.operadorId],
          )
          espera.soltar()
          // O aceite chega à transação e fica esperando a linha do operador.
          await expect
            .poll(async () => {
              const { rows } = await operadores.pool.query<{ total: number }>(
                `select count(*)::int as total from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock' and pid <> $1`,
                [(desativar as unknown as { processID: number }).processID],
              )
              return rows[0]?.total
            }, { timeout: 10_000, interval: 50 })
            .toBeGreaterThan(0)
          await desativar.query('update convite_operador set revogado_em = now() where operador_id = $1 and usado_em is null and revogado_em is null', [convite.operadorId])
          await desativar.query('commit')
        } finally {
          espiao.mockRestore()
        }
        expect(forma(await resposta)).toEqual(forma(await consultar(randomBytes(32).toString('base64url'))))
      } finally {
        desativar.release()
      }
      expect(await usadoEm(convite.conviteId)).toBeNull()
      expect((await linhaDoOperador(convite.operadorId)).senha_hash).toBeNull()
    })
  })

  describe('C10: dois aceites juntos', () => {
    it('dois `aceitar` com o mesmo token em Promise.all: uma senha gravada, a de quem recebeu 200, e o outro recusado com NAO_ENCONTRADO', async () => {
      const convite = await operadorComConvite()
      const gerar = hash.gerar.bind(hash)
      // Os dois passam da consulta do convite antes de qualquer transação: só a trava do banco separa um do outro.
      const espera = barreira(2)
      const espiao = vi.spyOn(hash, 'gerar').mockImplementation(async (senha) => {
        const resultado = await gerar(senha)
        await espera.esperar()
        return resultado
      })
      let respostas: Resposta[]
      try {
        const pendentes = Promise.all([aceitar(convite.token, SENHA), aceitar(convite.token, OUTRA_SENHA)])
        await espera.chegaram
        espera.soltar()
        respostas = await pendentes
      } finally {
        espiao.mockRestore()
      }
      expect(respostas.map((resposta) => resposta.status).sort()).toEqual([200, 404])
      const vencedora = respostas[0]?.status === 200 ? SENHA : OUTRA_SENHA
      const perdedora = vencedora === SENHA ? OUTRA_SENHA : SENHA
      const recusada = respostas.find((resposta) => resposta.status === 404)
      if (recusada === undefined) throw new Error('nenhuma recusa')
      esperarErro(recusada, 404, CodigoDeErro.NAO_ENCONTRADO)
      const { senha_hash: senhaHash } = await linhaDoOperador(convite.operadorId)
      expect(await hash.verificar(senhaHash, vencedora)).toBe(true)
      expect(await hash.verificar(senhaHash, perdedora)).toBe(false)
    })
  })

  describe('C21: o desafio do aceite não serve de bearer em rota nenhuma', () => {
    it('em toda rota de operação com sessão e em toda rota de escola com sessão, igual a rota inexistente; nas de desafio da escola, recusado sem sessão', async () => {
      const convite = await operadorComConvite()
      const { desafio } = esquemaRespostaAceitarConviteDeOperador.parse((await aceitar(convite.token)).corpo)
      const cabecalhos = { Authorization: `Bearer ${desafio}` }
      // As rotas que a aplicação montada registrou: a lista não é escrita à mão.
      const rotas = rotasDe(
        app
          .get(DiscoveryService)
          .getControllers()
          .map((embrulho) => embrulho.metatype)
          .filter((metatipo): metatipo is Type => typeof metatipo === 'function'),
      )
      const comSessao = rotas.filter((rota) => rota.marcador === 'rota' || (rota.marcador === undefined && !rota.anonima))
      expect(comSessao.map((rota) => `${rota.verbo} ${rota.caminho}`)).toEqual(expect.arrayContaining(['GET /v1/operacao/eu', 'GET /v1/eu', 'POST /v1/sessao/escola']))
      const diferentes: string[] = []
      for (const rota of comSessao) {
        const prefixo = rota.marcador === 'rota' ? '/v1/operacao' : '/v1'
        const [naRota, naInexistente] = await Promise.all([
          pedir(url, rota.verbo, caminhoConcreto(rota.caminho), undefined, cabecalhos),
          pedir(url, rota.verbo, `${prefixo}/nao-existe-${randomUUID()}`, undefined, cabecalhos),
        ])
        expect(naInexistente.status).toBe(404)
        if (!isDeepStrictEqual(forma(naRota), forma(naInexistente))) diferentes.push(`${rota.verbo} ${rota.caminho}`)
      }
      expect(diferentes).toEqual([])

      // As rotas da escola que recebem desafio no `Authorization` não o aceitam: sem sessão, sem cookie, sem segredo.
      for (const [caminho, corpo] of [
        ['/v1/sessao/mfa', { codigo: '123456' }],
        ['/v1/conta/mfa/configurar', undefined],
      ] as const) {
        const resposta = await pedir(url, 'POST', caminho, corpo, cabecalhos)
        esperarErro(resposta, 401, CodigoDeErro.NAO_AUTENTICADO)
        expect(resposta.setCookie).toEqual([])
      }
      const { rows } = await operadores.pool.query<{ total: number }>('select count(*)::int as total from sessao_operador where operador_id = $1', [convite.operadorId])
      expect(rows[0]?.total).toBe(0)
    })
  })

  describe('permissão: credencial de escola nunca produz desafio de operador', () => {
    it('o token do convite de um coordenador, com a sessão e o cookie de escola, não abre o aceite do operador; e o do operador não abre o da escola', async () => {
      const escolaId = await escolas.escola()
      const coordenador = await escolas.sessao(escolaId, 'coordenador')
      const cookie = await cookieDeRenovacao(escolas, coordenador)
      const daEscola = await criarConviteDeCoordenador(banco, autor, { slug: await escolas.slugDe(escolaId), email: `coord-${randomUUID()}@escola.invalid`, nome: 'Coordenação Sintética' })
      const credenciais = { Authorization: `Bearer ${coordenador.token}`, Cookie: cookie }
      const esperado = forma(await consultar(randomBytes(32).toString('base64url')))

      expect(forma(await consultar(daEscola.token, { ...ip(), ...credenciais }))).toEqual(esperado)
      const aceite = await aceitar(daEscola.token, SENHA, { ...ip(), ...credenciais })
      expect(forma(aceite)).toEqual(esperado)
      // O convite da escola continua valendo na rota dele: a rota do operador nem o procurou.
      expect((await pedir(url, 'POST', '/v1/convites/consultar', { token: daEscola.token })).status).toBe(200)

      // No outro sentido: o token do operador na rota da escola é inexistente lá, e continua valendo aqui.
      const convite = await operadorComConvite()
      esperarErro(await pedir(url, 'POST', '/v1/convites/aceitar', { token: convite.token, senha: SENHA }), 404, CodigoDeErro.NAO_ENCONTRADO)
      expect((await consultar(convite.token)).status).toBe(200)
      expect(await usadoEm(convite.conviteId)).toBeNull()
    })
  })

  describe('C39 (parte): contrato estrito e no-store', () => {
    it('campo a mais ou senha curta na entrada: ENTRADA_INVALIDA, e o convite continua valendo; a saída não deixa passar campo a mais', async () => {
      const convite = await operadorComConvite()
      for (const corpo of [
        { token: convite.token, senha: SENHA, operadorId: convite.operadorId },
        { token: convite.token, senha: 'curta' },
        { token: convite.token },
      ]) {
        const resposta = await pedir(url, 'POST', '/v1/operacao/convite/aceitar', corpo, ip())
        esperarErro(resposta, 400, CodigoDeErro.ENTRADA_INVALIDA)
        expect(resposta.cacheControl).toBe('no-store')
      }
      esperarErro(await pedir(url, 'POST', '/v1/operacao/convite/consultar', { token: convite.token, apelido: convite.apelido }, ip()), 400, CodigoDeErro.ENTRADA_INVALIDA)
      expect(await usadoEm(convite.conviteId)).toBeNull()
      expect((await consultar(convite.token)).status).toBe(200)

      expect(esquemaRespostaAceitarConviteDeOperador.safeParse({ etapa: 'configurar_mfa', desafio: 'x', operadorId: convite.operadorId }).success).toBe(false)
      expect(esquemaRespostaAceitarConviteDeOperador.safeParse({ etapa: 'mfa', desafio: 'x' }).success).toBe(false)
      expect(esquemaRespostaConsultarConviteDeOperador.safeParse({ valido: true, apelido: convite.apelido }).success).toBe(false)
    })
  })
})

describe('convite do operador: o limite por IP (C32 e C33, parte)', () => {
  const LIMITE_POR_IP = 5
  const operadores = new BancadaDeOperadores()
  let app: INestApplication
  let url: string
  let banco: Banco
  let autor: string

  beforeAll(async () => {
    ;({ app, url } = await subir(configuracaoDeTeste({ ambiente: { LIMITE_REQ_IP_ANONIMO_MIN: String(LIMITE_POR_IP), LIMITE_PROXIES_CONFIAVEIS: '127.0.0.1' } })))
    banco = app.get<Banco>(BANCO)
    autor = (await operadores.operador()).apelido
  })

  afterAll(async () => {
    await app.close()
    await operadores.fechar()
  })

  const doIp = (valor: string): Cabecalhos => ({ 'X-Forwarded-For': valor })

  it('C32: `convite/consultar` acima do `rl:ip` responde 429 LIMITE_EXCEDIDO com Retry-After; outro IP segue', async () => {
    const [ip, outro] = [ipSorteado(), ipSorteado()]
    const token = randomBytes(32).toString('base64url')
    for (let vez = 0; vez < LIMITE_POR_IP; vez++) esperarErro(await pedir(url, 'POST', '/v1/operacao/convite/consultar', { token }, doIp(ip)), 404, CodigoDeErro.NAO_ENCONTRADO)
    const recusada = await pedir(url, 'POST', '/v1/operacao/convite/consultar', { token }, doIp(ip))
    esperarErro(recusada, 429, CodigoDeErro.LIMITE_EXCEDIDO)
    expect(Number(recusada.retryAfter)).toBeGreaterThanOrEqual(1)
    esperarErro(await pedir(url, 'POST', '/v1/operacao/convite/consultar', { token }, doIp(outro)), 404, CodigoDeErro.NAO_ENCONTRADO)
  })

  it('C33: `convite/aceitar` acima do limite do IP não responde 429: o aceite vai para o fim do balde no semáforo do hash, e o de outro IP não', async () => {
    const [ip, outro] = [ipSorteado(), ipSorteado()]
    const semaforo = app.get(SemaforoDeHash)
    const vezes = vi.spyOn(semaforo, 'executar')
    try {
      // O dobro do limite, com tokens que não existem: nenhum 429.
      for (let vez = 0; vez < 2 * LIMITE_POR_IP; vez++) {
        esperarErro(await pedir(url, 'POST', '/v1/operacao/convite/aceitar', { token: randomBytes(32).toString('base64url'), senha: SENHA }, doIp(ip)), 404, CodigoDeErro.NAO_ENCONTRADO)
      }
      // O convite que não vale sai antes do hash: não gasta vez no semáforo.
      expect(vezes).not.toHaveBeenCalled()

      const { operadorId: acimaId, apelido: acima } = await operadores.operador()
      const { apelido: dentro } = await operadores.operador()
      const [doAcima, doDentro] = [await gerarConviteDeOperador(banco, autor, acima), await gerarConviteDeOperador(banco, autor, dentro)]
      expect((await pedir(url, 'POST', '/v1/operacao/convite/aceitar', { token: doAcima.token, senha: SENHA }, doIp(ip))).status).toBe(200)
      expect((await pedir(url, 'POST', '/v1/operacao/convite/aceitar', { token: doDentro.token, senha: SENHA }, doIp(outro))).status).toBe(200)
      expect(vezes.mock.calls.map(([balde]) => balde)).toEqual([
        { id: 'equipe', subfila: ip, rotulo: 'equipe', rebaixado: true },
        { id: 'equipe', subfila: outro, rotulo: 'equipe', rebaixado: false },
      ])
      const { rows } = await operadores.pool.query<{ tem_senha: boolean }>('select senha_hash is not null as tem_senha from operador where id = $1', [acimaId])
      expect(rows[0]?.tem_senha).toBe(true)
    } finally {
      vezes.mockRestore()
    }
  })
})
