import 'reflect-metadata'
import { LimitadorDeRequisicoes } from '@educa/nucleo'
import { CodigoDeErro, esquemaRespostaRenovacaoDeOperador } from '@educa/shared'
import type { INestApplication } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { createHash, randomBytes } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { lerAmbienteDeTeste } from '../../../tools/ci/compose.ts'
import { aguardarSaudavel, compose, composeOuFalha } from '../../../tools/testes/compose.ts'
import { CLIENTE_REDIS_CACHE } from '../src/limite.module.js'
import { COOKIE_SESSAO_DE_OPERADOR } from '../src/operacao/cookie-de-operador.js'
import { OperadorRepository } from '../src/operacao/operador.repository.js'
import { JANELA_DO_REFRESH_ANTERIOR_SEGUNDOS } from '../src/operacao/prazos-da-sessao.js'
import { executarOpsOperador } from '../src/ops/operador.js'
import { configuracaoDeTeste } from './configuracao-de-teste.js'
import { barreira, doIp, esperarErro, ipSorteado, pedir, subir, valorDoCookie, type Cabecalhos, type Resposta } from './segundo-fator-de-operador.js'
import { BancadaDeOperadores, type SessaoDeOperadorDeTeste } from './sessao-de-operador.js'

const RENOVAR = '/v1/operacao/sessao/renovar'
const SAIR = '/v1/operacao/sessao/sair'
const ambienteDeTeste = lerAmbienteDeTeste()
const hash = (valor: string) => createHash('sha256').update(valor).digest('hex')
const comCookie = (refresh: string, ip = ipSorteado()): Cabecalhos => ({ ...doIp(ip), Cookie: `${COOKIE_SESSAO_DE_OPERADOR}=${refresh}` })

interface LinhaDaSessao {
  readonly refreshHash: string
  readonly refreshHashAnterior: string | null
  readonly encerrada: boolean
  readonly motivo: string | null
  readonly usoHaSegundos: number
}

/**
 * Sessão do operador: renovar, sair e os prazos (tarefa 8.0; Tech Spec da A0, seção 5). O "relógio controlado" é o do
 * banco, que é a régua dos prazos: `avancar` empurra para trás todas as datas da sessão, e para ela é como se o tempo
 * tivesse passado.
 */
describe('sessão do operador: renovar, sair e os prazos (tarefa 8.0)', () => {
  const operadores = new BancadaDeOperadores()
  let app: INestApplication
  let url: string

  beforeAll(async () => {
    ;({ app, url } = await subir())
  })

  afterAll(async () => {
    await app.close()
    await operadores.fechar()
  })

  const renovar = (refresh: string | undefined, ip?: string): Promise<Resposta> => pedir(url, 'POST', RENOVAR, undefined, refresh === undefined ? doIp(ip) : comCookie(refresh, ip))
  const sair = (refresh: string | undefined, ip?: string): Promise<Resposta> => pedir(url, 'POST', SAIR, undefined, refresh === undefined ? doIp(ip) : comCookie(refresh, ip))
  const eu = (token: string) => pedir(url, 'GET', '/v1/operacao/eu', undefined, { Authorization: `Bearer ${token}` })
  /** Um token de acesso desta sessão emitido agora: o prazo de 10 min do token não entra na conta do teste. */
  const euAgora = async (sessao: SessaoDeOperadorDeTeste) => eu(await sessao.tokenEm(new Date()))

  /** Passa `intervalo` no relógio da sessão: todas as datas dela vão para trás. */
  async function avancar(sessaoId: string, intervalo: string): Promise<void> {
    await operadores.pool.query(
      `update sessao_operador set criada_em = criada_em - $2::interval, ultimo_uso_em = ultimo_uso_em - $2::interval, expira_em = expira_em - $2::interval,
              rotacionado_em = rotacionado_em - $2::interval where id = $1`,
      [sessaoId, intervalo],
    )
  }

  async function linha(sessaoId: string): Promise<LinhaDaSessao> {
    const { rows } = await operadores.pool.query<LinhaDaSessao>(
      `select refresh_hash as "refreshHash", refresh_hash_anterior as "refreshHashAnterior", encerrada_em is not null as encerrada, motivo,
              extract(epoch from now() - ultimo_uso_em)::int as "usoHaSegundos"
         from sessao_operador where id = $1`,
      [sessaoId],
    )
    const achada = rows[0]
    if (achada === undefined) throw new Error('sessão não encontrada')
    return achada
  }

  /** A renovação recusada: 401 `SESSAO_ENCERRADA`, no-store, e o cookie apagado no mesmo caminho. */
  function esperarRecusa(resposta: Resposta): void {
    esperarErro(resposta, 401, CodigoDeErro.SESSAO_ENCERRADA)
    expect(resposta.cacheControl).toBe('no-store')
    expect(resposta.setCookie).toEqual([`${COOKIE_SESSAO_DE_OPERADOR}=; Path=/v1/operacao/sessao; HttpOnly; SameSite=Strict; Max-Age=0`])
  }

  describe('C29: acesso vencido com a sessão viva', () => {
    it('dá ACESSO_VENCIDO; renova (token novo, cookie novo com os atributos, o anterior guardado) e a ação seguinte passa', async () => {
      const sessao = await operadores.operadorComSessao()
      esperarErro(await eu(await sessao.tokenEm(new Date(Date.now() - 11 * 60_000))), 401, CodigoDeErro.ACESSO_VENCIDO)

      const renovada = await renovar(sessao.refresh)
      expect(renovada.status).toBe(200)
      expect(renovada.cacheControl).toBe('no-store')
      const corpo = esquemaRespostaRenovacaoDeOperador.parse(renovada.corpo)
      expect(Object.keys(renovada.corpo as object).sort()).toEqual(['expiraEm', 'token'])
      const novo = valorDoCookie(renovada.setCookie, COOKIE_SESSAO_DE_OPERADOR)
      expect(novo).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(renovada.setCookie).toEqual([`${COOKIE_SESSAO_DE_OPERADOR}=${novo ?? ''}; Path=/v1/operacao/sessao; HttpOnly; SameSite=Strict; Max-Age=28800`])
      expect(await linha(sessao.sessaoId)).toMatchObject({ refreshHash: hash(novo ?? ''), refreshHashAnterior: hash(sessao.refresh), encerrada: false })

      const depois = await eu(corpo.token)
      expect(depois.status).toBe(200)
      expect(depois.corpo).toEqual({ apelido: sessao.apelido, nome: sessao.nome })
    })

    it('renovar não é uso: não move `ultimo_uso_em`, e a sessão parada renovando sozinha termina nos 30 min', async () => {
      const sessao = await operadores.operadorComSessao()
      await avancar(sessao.sessaoId, '20 minutes')
      const renovada = await renovar(sessao.refresh)
      expect(renovada.status).toBe(200)
      expect((await linha(sessao.sessaoId)).usoHaSegundos).toBeGreaterThanOrEqual(20 * 60)
      await avancar(sessao.sessaoId, '11 minutes')
      esperarRecusa(await renovar(valorDoCookie(renovada.setCookie, COOKIE_SESSAO_DE_OPERADOR)))
    })
  })

  describe('C26: 30 min parada terminam a sessão', () => {
    it('30 min sem uso dão SESSAO_ENCERRADA; o uso aos 29 min mantém a sessão viva aos 31, e 30 min depois dele ela termina', async () => {
      const parada = await operadores.operadorComSessao()
      await avancar(parada.sessaoId, '30 minutes')
      esperarErro(await euAgora(parada), 401, CodigoDeErro.SESSAO_ENCERRADA)

      const usada = await operadores.operadorComSessao()
      await avancar(usada.sessaoId, '29 minutes')
      expect((await euAgora(usada)).status).toBe(200)
      // Aos 31 min da abertura, 2 min depois do último uso.
      await avancar(usada.sessaoId, '2 minutes')
      expect((await euAgora(usada)).status).toBe(200)
      // O uso aos 31 min também foi gravado: 29 min depois dele ainda vale, 30 min depois termina.
      await avancar(usada.sessaoId, '29 minutes')
      expect((await euAgora(usada)).status).toBe(200)
      await avancar(usada.sessaoId, '30 minutes')
      esperarErro(await euAgora(usada), 401, CodigoDeErro.SESSAO_ENCERRADA)
    })
  })

  describe('C27: 8 h terminam a sessão, com qualquer uso', () => {
    it('usada a cada 29 min, a sessão vale até as 8 h e termina depois delas', async () => {
      const sessao = await operadores.operadorComSessao()
      // 16 × 29 min = 7h44: dentro das 8 h, e nunca 30 min parada.
      for (let vez = 1; vez <= 16; vez++) {
        await avancar(sessao.sessaoId, '29 minutes')
        expect((await euAgora(sessao)).status, `uso ${String(vez)}`).toBe(200)
      }
      // 17 × 29 min = 8h13: o último uso foi há 29 min, mas as 8 h passaram.
      await avancar(sessao.sessaoId, '29 minutes')
      expect((await linha(sessao.sessaoId)).usoHaSegundos).toBeLessThan(30 * 60)
      esperarErro(await euAgora(sessao), 401, CodigoDeErro.SESSAO_ENCERRADA)
      esperarRecusa(await renovar(sessao.refresh))
    })
  })

  describe('C28: /renovar confere as mesmas quatro condições', () => {
    it('recusa depois de 30 min parada, de 8 h, de sair e de desativar; um pouco antes de cada prazo, renova', async () => {
      const [quase30, parada, quase8, oitoHoras, saiu, desativado, quemDesativa] = await Promise.all(Array.from({ length: 7 }, () => operadores.operadorComSessao()))
      if (quase30 === undefined || parada === undefined || quase8 === undefined || oitoHoras === undefined || saiu === undefined || desativado === undefined || quemDesativa === undefined) {
        throw new Error('sessões não criadas')
      }
      await avancar(quase30.sessaoId, '29 minutes 50 seconds')
      await avancar(parada.sessaoId, '30 minutes')
      await operadores.pool.query(`update sessao_operador set expira_em = now() + interval '10 seconds' where id = $1`, [quase8.sessaoId])
      await operadores.pool.query(`update sessao_operador set expira_em = now() - interval '1 second' where id = $1`, [oitoHoras.sessaoId])
      expect((await sair(saiu.refresh)).status).toBe(204)
      let erro = ''
      const codigo = await executarOpsOperador(['desativar', '--apelido', desativado.apelido], { ...ambienteDeTeste, OPERADOR: quemDesativa.apelido }, { saida: () => undefined, erro: (texto) => (erro += texto) })
      expect({ codigo, erro }).toEqual({ codigo: 0, erro: '' })

      for (const sessao of [quase30, quase8]) expect((await renovar(sessao.refresh)).status).toBe(200)
      for (const sessao of [parada, oitoHoras, saiu, desativado]) {
        esperarRecusa(await renovar(sessao.refresh))
        // Recusada, a sessão não rotaciona.
        expect((await linha(sessao.sessaoId)).refreshHash).toBe(hash(sessao.refresh))
      }
    })

    it('sem cookie, cookie fora do formato, cookie que não existe e o cookie da escola com o nome do operador: SESSAO_ENCERRADA, iguais', async () => {
      const desconhecido = randomBytes(32).toString('base64url')
      for (const cabecalhos of [doIp(), { ...doIp(), Cookie: `${COOKIE_SESSAO_DE_OPERADOR}=curto` }, comCookie(desconhecido), { ...doIp(), Cookie: `educa_sessao=${desconhecido}` }]) {
        esperarRecusa(await pedir(url, 'POST', RENOVAR, undefined, cabecalhos))
      }
    })
  })

  describe('C30: duas renovações com o mesmo cookie', () => {
    it('em paralelo: uma rotaciona e só ela manda cookie; a outra vale pelo anterior, sem cookie; os dois acessos entram', async () => {
      const sessao = await operadores.operadorComSessao()
      // As duas leram a sessão pelo refresh atual e param antes da trava; soltas juntas, disputam o mesmo `update`.
      const espera = barreira(2)
      const original = OperadorRepository.prototype.rotacionarSessao
      const trava = vi.spyOn(OperadorRepository.prototype, 'rotacionarSessao').mockImplementation(async function (this: OperadorRepository, dados) {
        await espera.esperar()
        return original.call(this, dados)
      })
      const pendentes = Promise.all([renovar(sessao.refresh), renovar(sessao.refresh)])
      await espera.chegaram
      espera.soltar()
      const respostas = await pendentes
      trava.mockRestore()
      expect(respostas.map((resposta) => resposta.status)).toEqual([200, 200])
      const comCookieNovo = respostas.filter((resposta) => resposta.setCookie.length > 0)
      expect(comCookieNovo).toHaveLength(1)
      const novo = valorDoCookie(comCookieNovo[0]?.setCookie ?? [], COOKIE_SESSAO_DE_OPERADOR) ?? ''
      expect(await linha(sessao.sessaoId)).toMatchObject({ refreshHash: hash(novo), refreshHashAnterior: hash(sessao.refresh), encerrada: false })
      for (const resposta of respostas) expect((await eu(esquemaRespostaRenovacaoDeOperador.parse(resposta.corpo).token)).status).toBe(200)
    })

    it('o anterior vale até 30 s depois da rotação; reusado depois disso, encerra a sessão (a do cookie novo também)', async () => {
      const sessao = await operadores.operadorComSessao()
      const primeira = await renovar(sessao.refresh)
      const novo = valorDoCookie(primeira.setCookie, COOKIE_SESSAO_DE_OPERADOR) ?? ''
      const { token } = esquemaRespostaRenovacaoDeOperador.parse(primeira.corpo)

      await operadores.pool.query(`update sessao_operador set rotacionado_em = now() - make_interval(secs => $2) where id = $1`, [sessao.sessaoId, JANELA_DO_REFRESH_ANTERIOR_SEGUNDOS - 1])
      const naJanela = await renovar(sessao.refresh)
      expect(naJanela.status).toBe(200)
      expect(naJanela.setCookie).toEqual([])
      expect(await linha(sessao.sessaoId)).toMatchObject({ refreshHash: hash(novo), refreshHashAnterior: hash(sessao.refresh), encerrada: false })

      await operadores.pool.query(`update sessao_operador set rotacionado_em = now() - make_interval(secs => $2) where id = $1`, [sessao.sessaoId, JANELA_DO_REFRESH_ANTERIOR_SEGUNDOS + 1])
      esperarRecusa(await renovar(sessao.refresh))
      expect(await linha(sessao.sessaoId)).toMatchObject({ encerrada: true, motivo: 'reuso_de_refresh' })
      esperarRecusa(await renovar(novo))
      esperarErro(await eu(token), 401, CodigoDeErro.SESSAO_ENCERRADA)
    })

    it('o cookie de duas rotações atrás não renova, e não encerra a sessão: só o anterior imediato é conhecido', async () => {
      const sessao = await operadores.operadorComSessao()
      const segundo = valorDoCookie((await renovar(sessao.refresh)).setCookie, COOKIE_SESSAO_DE_OPERADOR) ?? ''
      const terceiro = valorDoCookie((await renovar(segundo)).setCookie, COOKIE_SESSAO_DE_OPERADOR) ?? ''
      esperarRecusa(await renovar(sessao.refresh))
      expect((await linha(sessao.sessaoId)).encerrada).toBe(false)
      expect((await renovar(terceiro)).status).toBe(200)
    })
  })

  describe('sair', () => {
    it('encerra a sessão com motivo `saida`, grava a saída com o IP e apaga o cookie; a sessão não volta nem pelo token nem pelo cookie', async () => {
      const sessao = await operadores.operadorComSessao()
      const ip = ipSorteado()
      const saida = await sair(sessao.refresh, ip)
      expect(saida.status).toBe(204)
      expect(saida.corpo).toBeUndefined()
      expect(saida.cacheControl).toBe('no-store')
      expect(saida.setCookie).toEqual([`${COOKIE_SESSAO_DE_OPERADOR}=; Path=/v1/operacao/sessao; HttpOnly; SameSite=Strict; Max-Age=0`])
      expect(await linha(sessao.sessaoId)).toMatchObject({ encerrada: true, motivo: 'saida' })
      const { rows } = await operadores.pool.query<{ evento: string; ip: string }>('select evento, host(ip) as ip from acesso_operacao where operador_id = $1', [sessao.operadorId])
      expect(rows).toEqual([{ evento: 'saida', ip }])
      esperarErro(await eu(sessao.token), 401, CodigoDeErro.SESSAO_ENCERRADA)
      esperarRecusa(await renovar(sessao.refresh))
    })

    it('concorrência: dois cliques em Sair juntos gravam uma saída só; sair de novo não grava nada', async () => {
      const sessao = await operadores.operadorComSessao()
      const respostas = await Promise.all([sair(sessao.refresh), sair(sessao.refresh)])
      expect(respostas.map((resposta) => resposta.status)).toEqual([204, 204])
      expect((await sair(sessao.refresh)).status).toBe(204)
      const { rows } = await operadores.pool.query<{ total: number }>(`select count(*)::int as total from acesso_operacao where operador_id = $1 and evento = 'saida'`, [sessao.operadorId])
      expect(rows[0]?.total).toBe(1)
    })

    it('sem cookie, ou com o cookie de outra sessão já encerrada, responde igual e não encerra sessão de ninguém', async () => {
      const viva = await operadores.operadorComSessao()
      for (const refresh of [undefined, randomBytes(32).toString('base64url')]) {
        const resposta = await sair(refresh)
        expect(resposta.status).toBe(204)
        expect(resposta.setCookie).toEqual([`${COOKIE_SESSAO_DE_OPERADOR}=; Path=/v1/operacao/sessao; HttpOnly; SameSite=Strict; Max-Age=0`])
      }
      expect((await linha(viva.sessaoId)).encerrada).toBe(false)
    })

    it('pelo cookie anterior, dentro da janela da rotação, também sai', async () => {
      const sessao = await operadores.operadorComSessao()
      expect((await renovar(sessao.refresh)).status).toBe(200)
      expect((await sair(sessao.refresh)).status).toBe(204)
      expect(await linha(sessao.sessaoId)).toMatchObject({ encerrada: true, motivo: 'saida' })
    })
  })

  describe('C39 (renovar e sair): contrato estrito e no-store', () => {
    it('corpo com campo: ENTRADA_INVALIDA com no-store, e a sessão não rotaciona nem encerra; corpo vazio `{}` vale', async () => {
      const sessao = await operadores.operadorComSessao()
      for (const caminho of [RENOVAR, SAIR]) {
        const resposta = await pedir(url, 'POST', caminho, { sessaoId: sessao.sessaoId }, comCookie(sessao.refresh))
        esperarErro(resposta, 400, CodigoDeErro.ENTRADA_INVALIDA)
        expect(resposta.cacheControl).toBe('no-store')
      }
      expect(await linha(sessao.sessaoId)).toMatchObject({ refreshHash: hash(sessao.refresh), encerrada: false })
      expect((await pedir(url, 'POST', RENOVAR, {}, comCookie(sessao.refresh))).status).toBe(200)
    })

    it('o contrato da resposta não deixa sair campo a mais', () => {
      const valido = { token: 'a.b.c', expiraEm: new Date().toISOString() }
      expect(esquemaRespostaRenovacaoDeOperador.safeParse(valido).success).toBe(true)
      expect(esquemaRespostaRenovacaoDeOperador.safeParse({ ...valido, sessaoId: 'x' }).success).toBe(false)
      expect(esquemaRespostaRenovacaoDeOperador.safeParse({ ...valido, operadorId: 'x' }).success).toBe(false)
    })
  })

  describe('C31: banco fora', () => {
    it('na conferência da sessão, no /renovar e no /sair: 503 INDISPONIVEL_TENTE_DE_NOVO com Retry-After, nunca 401 nem 404; a sessão volta intacta', async () => {
      const sessao = await operadores.operadorComSessao()
      expect((await eu(sessao.token)).status).toBe(200)
      composeOuFalha('pause', 'postgres')
      try {
        const respostas = await Promise.all([eu(sessao.token), renovar(sessao.refresh), sair(sessao.refresh)])
        for (const resposta of respostas) {
          esperarErro(resposta, 503, CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
          expect(Number(resposta.retryAfter)).toBeGreaterThanOrEqual(1)
        }
        // O 503 da renovação não apaga o cookie: a queda do banco não desloga ninguém.
        expect(respostas[1]?.setCookie).toEqual([])
      } finally {
        compose('unpause', 'postgres')
        await aguardarSaudavel('postgres')
      }
      await expect.poll(async () => (await renovar(sessao.refresh)).status, { timeout: 30_000, interval: 500 }).toBe(200)
    })
  })
})

describe('sessão do operador: o limite de renovar e sair (C32) e o Redis de cache fora (C36b)', () => {
  const LIMITE_POR_IP = 3
  const operadores = new BancadaDeOperadores()
  let app: INestApplication
  let url: string

  beforeAll(async () => {
    ;({ app, url } = await subir(configuracaoDeTeste({ ambiente: { LIMITE_REQ_IP_ANONIMO_MIN: String(LIMITE_POR_IP), LIMITE_REQ_OPERADOR_MIN: '4', LIMITE_INSTANCIAS_API: '2', LIMITE_PROXIES_CONFIAVEIS: '127.0.0.1' } })))
  })

  afterAll(async () => {
    await app.close()
    await operadores.fechar()
  })

  it('C32: `renovar` e `sair` acima do `rl:ip` respondem 429 LIMITE_EXCEDIDO com Retry-After e no-store; outro IP segue', async () => {
    const sessao = await operadores.operadorComSessao()
    for (const caminho of [RENOVAR, SAIR]) {
      const ip = ipSorteado()
      // Sem cookie: a renovação recusa (401) e a saída não tem o que encerrar (204); as duas contam no IP.
      for (let vez = 0; vez < LIMITE_POR_IP; vez++) expect((await pedir(url, 'POST', caminho, undefined, doIp(ip))).status).not.toBe(429)
      const recusada = await pedir(url, 'POST', caminho, undefined, comCookie(sessao.refresh, ip))
      esperarErro(recusada, 429, CodigoDeErro.LIMITE_EXCEDIDO)
      expect(Number(recusada.retryAfter)).toBeGreaterThanOrEqual(1)
      expect(recusada.cacheControl).toBe('no-store')
    }
    // Recusada pelo limite, a sessão não rotacionou nem encerrou; de outro IP, renova.
    expect((await pedir(url, 'POST', RENOVAR, undefined, comCookie(sessao.refresh))).status).toBe(200)
  })

  it('C36b: com o Redis de cache fora, `rl:ip` (renovar) e `rl:op` (/eu) seguem no seguro em memória (limite ÷ instâncias), sem 5xx', async () => {
    const sessao = await operadores.operadorComSessao()
    const cliente = app.get<Redis>(CLIENTE_REDIS_CACHE)
    const limitador = app.get(LimitadorDeRequisicoes)
    cliente.disconnect()
    const ip = ipSorteado()
    const renovacoes: number[] = []
    for (let vez = 0; vez < 3; vez++) renovacoes.push((await pedir(url, 'POST', RENOVAR, undefined, doIp(ip))).status)
    const usos: number[] = []
    for (let vez = 0; vez < 3; vez++) usos.push((await pedir(url, 'GET', '/v1/operacao/eu', undefined, { Authorization: `Bearer ${sessao.token}` })).status)
    // O seguro de cada instância aceita metade: 3 ÷ 2 → 1 no IP; 4 ÷ 2 → 2 no operador.
    expect(renovacoes).toEqual([401, 429, 429])
    expect(usos).toEqual([200, 200, 429])
    expect(limitador.seguroAtivo).toBe(1)
  })
})
