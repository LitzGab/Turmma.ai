import 'reflect-metadata'
import { contextoAtual, criarLogger, EMISSOR_TOKEN_SINTETICO, RotaAnonima } from '@educa/nucleo'
import { CodigoDeErro, MENSAGENS_DE_ERRO } from '@educa/shared'
import { Controller, Get, Module, type INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { SignJWT } from 'jose'
import { spawnSync } from 'node:child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste } from '../../../tools/ci/compose.ts'
import { raizRepositorio } from '../../../tools/ci/executar.ts'
import { AppModule } from '../src/app.module.js'
import { configurarAplicacao } from '../src/configurar-app.js'
import { emitirTokenSintetico } from '../src/ops/token-sintetico.js'
import { configuracaoDeTeste } from './configuracao-de-teste.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
const ESCOLA_B = '0190f5a0-0000-7000-8000-00000000000b'
const USUARIO_A = '0190f5a0-0000-7000-8000-0000000000a1'
const USUARIO_B = '0190f5a0-0000-7000-8000-0000000000b1'

const ambienteDeTeste = lerAmbienteDeTeste()

const linhasDeLog: string[] = []
const registrador = criarLogger({ servico: 'api-teste', destino: { write: (linha: string) => linhasDeLog.push(linha) } })
const registros = () => linhasDeLog.map((linha) => JSON.parse(linha) as Record<string, unknown>)

/** Sem `@RotaAnonima()`: prova que rota nova nasce exigindo token. */
@Controller('teste-protegido')
class ControladorSemMarcacao {
  @Get('eco')
  eco(): { escolaId: string | undefined } {
    registrador.info({ evento: 'teste.protegido' })
    return { escolaId: contextoAtual()?.escolaId }
  }
}

/** Rota anônima que mostra o contexto: prova que ele não herda escola de requisição anterior. */
@RotaAnonima()
@Controller('teste-anonimo')
class ControladorAnonimo {
  @Get('contexto')
  contexto(): { escolaId: string | null; usuarioId: string | null } {
    return { escolaId: contextoAtual()?.escolaId ?? null, usuarioId: contextoAtual()?.usuarioId ?? null }
  }
}

async function subirApi(ambiente: Record<string, string> = {}): Promise<INestApplication> {
  @Module({ imports: [AppModule.com(configuracaoDeTeste({ ambiente }))], controllers: [ControladorSemMarcacao, ControladorAnonimo] })
  class ModuloDeTeste {}

  const app = await NestFactory.create(ModuloDeTeste, { logger: false })
  configurarAplicacao(app, registrador)
  await app.listen(0, '127.0.0.1')
  return app
}

/** O token pelo comando que o desenvolvedor e o cenário de carga usam, e não por atalho do teste. */
function tokenPeloComando(escolaId: string, usuarioId: string): string {
  const resultado = spawnSync('npm', ['run', '-s', 'ops:token-sintetico', '--', '--escola', escolaId, '--usuario', usuarioId], {
    cwd: raizRepositorio,
    encoding: 'utf8',
  })
  if (resultado.status !== 0) throw new Error(`ops:token-sintetico falhou (código ${String(resultado.status)})`)
  return resultado.stdout.trim()
}

function tokenAssinadoComAChaveDoAmbiente(claims: Record<string, unknown>): Promise<string> {
  const agora = Math.floor(Date.now() / 1000)
  return new SignJWT({ iss: EMISSOR_TOKEN_SINTETICO, iat: agora, exp: agora + 600, ...claims })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(new TextEncoder().encode(ambienteDeTeste['IDENTIDADE_CHAVE_ASSINATURA']))
}

function esperarNaoAutenticado(resposta: request.Response): void {
  expect(resposta.status).toBe(401)
  expect(resposta.body).toEqual({
    erro: {
      codigo: CodigoDeErro.NAO_AUTENTICADO,
      mensagem: MENSAGENS_DE_ERRO.NAO_AUTENTICADO,
      requisicaoId: expect.stringMatching(UUID),
    },
  })
}

describe('identidade pelo token e GET /v1/sistema/contexto', () => {
  let app: INestApplication
  let tokenA: string
  let tokenB: string

  beforeAll(async () => {
    tokenA = tokenPeloComando(ESCOLA_A, USUARIO_A)
    tokenB = tokenPeloComando(ESCOLA_B, USUARIO_B)
    app = await subirApi()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    linhasDeLog.length = 0
  })

  it('o token de ops:token-sintetico chega ao contexto: /contexto devolve a escola e o usuário dele', async () => {
    const resposta = await request(app.getHttpServer()).get('/v1/sistema/contexto').set('Authorization', `Bearer ${tokenA}`)

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ escolaId: ESCOLA_A, usuarioId: USUARIO_A })
    expect(resposta.headers['cache-control']).toBe('no-store')
  })

  it('sem token, /contexto responde 401 NAO_AUTENTICADO', async () => {
    esperarNaoAutenticado(await request(app.getHttpServer()).get('/v1/sistema/contexto'))
  })

  it('rota sem @RotaAnonima exige token, e com ele o log da requisição leva a escola do token', async () => {
    esperarNaoAutenticado(await request(app.getHttpServer()).get('/teste-protegido/eco'))
    expect(registros().some((registro) => registro.evento === 'teste.protegido')).toBe(false)

    const autenticada = await request(app.getHttpServer()).get('/teste-protegido/eco').set('Authorization', `Bearer ${tokenB}`)
    expect(autenticada.body).toEqual({ escolaId: ESCOLA_B })
    expect(registros().find((registro) => registro.evento === 'teste.protegido')).toMatchObject({
      escolaId: ESCOLA_B,
      usuarioId: USUARIO_B,
    })
  })

  it('assinatura errada, token vencido e token sem esc dão o mesmo 401, sem dizer o que falhou', async () => {
    const [cabecalho, corpo] = tokenA.split('.')
    const tokens = {
      assinaturaErrada: await emitirTokenSintetico({ escolaId: ESCOLA_A, usuarioId: USUARIO_A, validadeSegundos: 600 }, {
        AMBIENTE: 'local',
        IDENTIDADE_CHAVE_ASSINATURA: 'outra_chave_sintetica_com_32_caracteres',
      }),
      vencido: await emitirTokenSintetico(
        { escolaId: ESCOLA_A, usuarioId: USUARIO_A, validadeSegundos: 60 },
        ambienteDeTeste,
        new Date(Date.now() - 61_000),
      ),
      semEsc: await tokenAssinadoComAChaveDoAmbiente({ sub: USUARIO_A }),
      corpoTrocado: `${cabecalho}.${corpo}.${tokenB.split('.')[2]}`,
    }

    // Também na rota sem a segunda checagem do /contexto: a guarda sozinha precisa recusar.
    const respostas = await Promise.all(
      ['/v1/sistema/contexto', '/teste-protegido/eco'].flatMap((rota) =>
        Object.values(tokens).map((token) => request(app.getHttpServer()).get(rota).set('Authorization', `Bearer ${token}`)),
      ),
    )
    expect(registros().some((registro) => registro.evento === 'teste.protegido')).toBe(false)
    for (const resposta of respostas) esperarNaoAutenticado(resposta)
    const semRequisicaoId = respostas.map((resposta) => ({ ...resposta.body.erro, requisicaoId: undefined, cabecalhos: resposta.headers['www-authenticate'] }))
    expect(new Set(semRequisicaoId.map((corpoSemId) => JSON.stringify(corpoSemId))).size).toBe(1)
  })

  it('isolamento: token da escola A com x-escola-id e ?escolaId= apontando para B devolve A', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/v1/sistema/contexto?escolaId=${ESCOLA_B}&usuarioId=${USUARIO_B}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Escola-Id', ESCOLA_B)
      .set('X-Usuario-Id', USUARIO_B)

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ escolaId: ESCOLA_A, usuarioId: USUARIO_A })
  })

  it('isolamento: sem token, escola mandada pelo cliente não autentica ninguém', async () => {
    const resposta = await request(app.getHttpServer())
      .get(`/teste-protegido/eco?escolaId=${ESCOLA_B}`)
      .set('X-Escola-Id', ESCOLA_B)
    esperarNaoAutenticado(resposta)
    expect(linhasDeLog.join('')).not.toContain(ESCOLA_B)
  })

  it('token fora do cabeçalho Authorization não autentica: nada sensível vem pela URL', async () => {
    for (const parametro of ['access_token', 'token']) {
      esperarNaoAutenticado(await request(app.getHttpServer()).get(`/v1/sistema/contexto?${parametro}=${tokenA}`))
    }
    esperarNaoAutenticado(await request(app.getHttpServer()).get('/v1/sistema/contexto').set('Cookie', `token=${tokenA}`))
  })

  it('rota anônima logo depois de uma autenticada não herda escola nem usuário no contexto', async () => {
    const servidor = app.getHttpServer()
    for (let rodada = 0; rodada < 5; rodada++) {
      expect((await request(servidor).get('/v1/sistema/contexto').set('Authorization', `Bearer ${tokenA}`)).status).toBe(200)
      expect((await request(servidor).get('/teste-anonimo/contexto')).body).toEqual({ escolaId: null, usuarioId: null })
    }
  })

  it('isolamento: 40 requisições intercaladas das escolas A e B recebem cada uma a própria escola', async () => {
    const pedidos = Array.from({ length: 40 }, (_, indice) => (indice % 2 === 0 ? 'A' : 'B'))
    const respostas = await Promise.all(
      pedidos.map((escola) =>
        request(app.getHttpServer())
          .get('/v1/sistema/contexto')
          .set('Authorization', `Bearer ${escola === 'A' ? tokenA : tokenB}`),
      ),
    )
    respostas.forEach((resposta, indice) => {
      const esperado = pedidos[indice] === 'A' ? { escolaId: ESCOLA_A, usuarioId: USUARIO_A } : { escolaId: ESCOLA_B, usuarioId: USUARIO_B }
      expect(resposta.body).toEqual(esperado)
    })
  })

  it('o token não vai para o log, nem quando é recusado', async () => {
    await request(app.getHttpServer()).get('/v1/sistema/contexto').set('Authorization', `Bearer ${tokenA}x`)
    await request(app.getHttpServer()).get('/teste-protegido/eco').set('Authorization', `Bearer ${tokenA}`)
    const bruto = linhasDeLog.join('')
    expect(linhasDeLog.length).toBeGreaterThan(0)
    for (const parte of tokenA.split('.')) expect(bruto).not.toContain(parte)
  })
})

describe('com ACEITAR_TOKEN_SINTETICO=false', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await subirApi({ ACEITAR_TOKEN_SINTETICO: 'false' })
  })

  afterAll(async () => {
    await app.close()
  })

  it('um token sintético válido dá 401, e a rota anônima segue respondendo', async () => {
    const token = await emitirTokenSintetico({ escolaId: ESCOLA_A, usuarioId: USUARIO_A, validadeSegundos: 600 }, ambienteDeTeste)

    esperarNaoAutenticado(await request(app.getHttpServer()).get('/v1/sistema/contexto').set('Authorization', `Bearer ${token}`))
    expect((await request(app.getHttpServer()).get('/saude')).status).toBe(200)
  })
})
