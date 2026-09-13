import 'reflect-metadata'
import { contextoAtual, criarLogger, ErroDeDominio, type PoolBanco } from '@educa/nucleo'
import { CodigoDeErro, MENSAGENS_DE_ERRO } from '@educa/shared'
import { Body, Controller, Get, Headers, Inject, Module, Post, Query, type INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { randomUUID } from 'node:crypto'
import { setTimeout as esperar } from 'node:timers/promises'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../tools/ci/compose.ts'
import { AppModule } from '../src/app.module.js'
import { POOL_BANCO } from '../src/banco.module.js'
import { configurarAplicacao } from '../src/configurar-app.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const TABELA = `teste_erro_${Date.now()}`
const NOME_SINTETICO = 'Enzo Martins'

// Escolas sintéticas. A escola vem de cabeçalho só neste controlador de teste: o token chega na 4.0.
const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
const ESCOLA_B = '0190f5a0-0000-7000-8000-00000000000b'

const linhasDeLog: string[] = []
const registrador = criarLogger({ servico: 'api-teste', destino: { write: (linha: string) => linhasDeLog.push(linha) } })
const registros = () => linhasDeLog.map((linha) => JSON.parse(linha) as Record<string, unknown>)

@Controller('teste')
class ControladorDeTeste {
  constructor(@Inject(POOL_BANCO) private readonly pool: PoolBanco) {}

  @Get('excecao')
  lancar(): never {
    throw new Error(`falhou ao gravar ${NOME_SINTETICO} com select * from aluno where nome = '${NOME_SINTETICO}'`)
  }

  @Get('dominio/limite')
  limite(): never {
    throw new ErroDeDominio(CodigoDeErro.LIMITE_EXCEDIDO)
  }

  @Get('dominio/conflito-422')
  conflitoComStatus(): never {
    throw new ErroDeDominio(CodigoDeErro.CONFLITO, 422)
  }

  @Post('aluno')
  async inserir(@Body() corpo: { nome: string }): Promise<{ ok: true }> {
    await this.pool.query(`insert into ${TABELA} (nome) values ($1)`, [corpo.nome])
    return { ok: true }
  }

  @Get('lenta')
  async lenta(): Promise<never> {
    await this.pool.query('select pg_sleep(2)')
    throw new Error('não deveria chegar aqui')
  }

  @Get('eco')
  async eco(@Headers('x-escola-teste') escolaId: string, @Query('indice') indice: string): Promise<{ requisicaoId: string }> {
    const contexto = contextoAtual()
    if (contexto === undefined) throw new Error('sem contexto')
    contexto.escolaId = escolaId
    // Esperas desencontradas e fixas por índice: sem isolamento real do contexto, as linhas
    // trocariam de requisição, e sempre do mesmo jeito.
    const posicao = Number(indice)
    await esperar((posicao * 7) % 13)
    registrador.info({ evento: 'teste.eco', etapa: 1 })
    await this.pool.query('select 1')
    await esperar((posicao * 5) % 11)
    registrador.info({ evento: 'teste.eco', etapa: 2 })
    return { requisicaoId: contextoAtual()?.requisicaoId ?? '' }
  }
}

function configuracaoDeTeste() {
  const ambiente = lerAmbienteDeTeste()
  const usuario = valorObrigatorio(ambiente, 'POSTGRES_USUARIO')
  const senha = valorObrigatorio(ambiente, 'POSTGRES_SENHA')
  const banco = valorObrigatorio(ambiente, 'POSTGRES_BANCO')
  const porta = valorObrigatorio(ambiente, 'POSTGRES_PORTA_HOST')
  return {
    porta: 0,
    banco: {
      url: `postgres://${usuario}:${senha}@127.0.0.1:${porta}/${banco}`,
      maximoConexoes: 10,
      timeoutConexaoMs: 1_000,
      timeoutConsultaMs: 300,
    },
  }
}

function esperarEnvelopeSemVazamento(corpo: unknown, codigo: CodigoDeErro): string {
  expect(corpo).toEqual({
    erro: { codigo, mensagem: MENSAGENS_DE_ERRO[codigo], requisicaoId: expect.stringMatching(UUID) },
  })
  return (corpo as { erro: { requisicaoId: string } }).erro.requisicaoId
}

describe('erro tipado e log sem dado pessoal', () => {
  let app: INestApplication

  beforeAll(async () => {
    @Module({ imports: [AppModule.com(configuracaoDeTeste())], controllers: [ControladorDeTeste] })
    class ModuloDeTeste {}

    app = await NestFactory.create(ModuloDeTeste, { logger: false })
    configurarAplicacao(app, registrador)
    // Um servidor só, já ouvindo: sem isso o supertest abre uma porta por requisição, e 50 em
    // paralelo esbarram no backlog do sistema (ECONNRESET) em vez de testar o contexto.
    await app.listen(0, '127.0.0.1')
    const pool = app.get<PoolBanco>(POOL_BANCO)
    await pool.query(`create table ${TABELA} (id uuid primary key default gen_random_uuid(), nome text not null constraint ${TABELA}_nome_key unique)`)
  })

  afterAll(async () => {
    await app.get<PoolBanco>(POOL_BANCO).query(`drop table if exists ${TABELA}`)
    await app.close()
  })

  beforeEach(() => {
    linhasDeLog.length = 0
  })

  it('exceção não tratada vira ERRO_INTERNO 500 com requisicaoId, sem stack, consulta nem valor', async () => {
    const resposta = await request(app.getHttpServer()).get('/teste/excecao')

    expect(resposta.status).toBe(500)
    const requisicaoId = esperarEnvelopeSemVazamento(resposta.body, CodigoDeErro.ERRO_INTERNO)
    for (const proibido of [NOME_SINTETICO, 'select', 'at ', '.ts:', 'Error']) {
      expect(resposta.text).not.toContain(proibido)
    }

    const [linha] = registros().filter((registro) => registro.evento === 'http.erro')
    expect(linha).toMatchObject({ requisicaoId, status: 500, codigo: CodigoDeErro.ERRO_INTERNO, erro: { tipo: 'Error' } })
    expect(linhasDeLog.join('')).not.toContain(NOME_SINTETICO)
    expect(linhasDeLog.join('')).not.toContain('select * from')
  })

  it('ErroDeDominio lançado pelo código sai com o próprio código e status, e o status informado vale', async () => {
    const limite = await request(app.getHttpServer()).get('/teste/dominio/limite')
    expect(limite.status).toBe(429)
    esperarEnvelopeSemVazamento(limite.body, CodigoDeErro.LIMITE_EXCEDIDO)

    const conflito = await request(app.getHttpServer()).get('/teste/dominio/conflito-422')
    expect(conflito.status).toBe(422)
    esperarEnvelopeSemVazamento(conflito.body, CodigoDeErro.CONFLITO)
  })

  it('violação de unicidade com "Enzo Martins" no detail vira CONFLITO 409, sem o valor na resposta nem no log', async () => {
    const primeira = await request(app.getHttpServer()).post('/teste/aluno').send({ nome: NOME_SINTETICO })
    expect(primeira.status).toBe(201)

    const repetida = await request(app.getHttpServer()).post('/teste/aluno').send({ nome: NOME_SINTETICO })

    expect(repetida.status).toBe(409)
    const requisicaoId = esperarEnvelopeSemVazamento(repetida.body, CodigoDeErro.CONFLITO)
    expect(repetida.text).not.toContain(NOME_SINTETICO)
    expect(repetida.text).not.toContain(TABELA)

    const [linha] = registros().filter((registro) => registro.evento === 'http.erro')
    expect(linha).toMatchObject({
      requisicaoId,
      status: 409,
      codigo: CodigoDeErro.CONFLITO,
      erro: { tipo: 'ErroDoPostgres', sqlstate: '23505', constraint: `${TABELA}_nome_key` },
    })
    const bruto = linhasDeLog.join('')
    expect(bruto).not.toContain(NOME_SINTETICO)
    expect(bruto).not.toContain('already exists')
    expect(bruto).not.toContain('duplicate key')
  })

  it('consulta cortada pelo statement_timeout vira TEMPO_ESGOTADO 503', async () => {
    const resposta = await request(app.getHttpServer()).get('/teste/lenta')

    expect(resposta.status).toBe(503)
    esperarEnvelopeSemVazamento(resposta.body, CodigoDeErro.TEMPO_ESGOTADO)
    expect(registros().find((registro) => registro.evento === 'http.erro')).toMatchObject({ erro: { sqlstate: '57014' } })
  })

  it('rota inexistente e corpo JSON inválido também saem no envelope, sem ecoar o que o cliente mandou', async () => {
    const inexistente = await request(app.getHttpServer()).get(`/teste/${encodeURIComponent(NOME_SINTETICO)}`)
    expect(inexistente.status).toBe(404)
    esperarEnvelopeSemVazamento(inexistente.body, CodigoDeErro.NAO_ENCONTRADO)
    expect(inexistente.text).not.toContain('Enzo')
    const logDo404 = registros().find((registro) => registro.evento === 'http.erro' && registro.status === 404)
    expect(logDo404).toMatchObject({ codigo: CodigoDeErro.NAO_ENCONTRADO, erro: { tipo: 'NotFoundException' } })
    expect(logDo404).not.toHaveProperty('erro.pilha')

    const corpoInvalido = await request(app.getHttpServer())
      .post('/teste/aluno')
      .set('Content-Type', 'application/json')
      .send(`{"nome": "${NOME_SINTETICO}"`)
    expect(corpoInvalido.status).toBe(400)
    esperarEnvelopeSemVazamento(corpoInvalido.body, CodigoDeErro.ENTRADA_INVALIDA)
    expect(corpoInvalido.text).not.toContain(NOME_SINTETICO)
    expect(linhasDeLog.join('')).not.toContain(NOME_SINTETICO)
  })

  it('50 requisições das escolas A e B em paralelo: cada linha de log tem o próprio requisicaoId e a própria escola', async () => {
    const enviadas = Array.from({ length: 50 }, (_, indice) => ({
      requisicaoId: randomUUID(),
      escolaId: indice % 2 === 0 ? ESCOLA_A : ESCOLA_B,
    }))

    const respostas = await Promise.all(
      enviadas.map(({ requisicaoId, escolaId }, indice) =>
        request(app.getHttpServer())
          .get(`/teste/eco?indice=${indice}`)
          .set('X-Requisicao-Id', requisicaoId)
          .set('X-Escola-Teste', escolaId),
      ),
    )

    const escolaDaRequisicao = new Map<string, string>(enviadas.map(({ requisicaoId, escolaId }) => [requisicaoId, escolaId]))
    respostas.forEach((resposta, indice) => {
      expect(resposta.status).toBe(200)
      expect(resposta.body).toEqual({ requisicaoId: enviadas[indice]?.requisicaoId })
    })

    const linhas = registros().filter((registro) => registro.evento === 'teste.eco')
    expect(linhas).toHaveLength(100)
    const linhasPorRequisicao = new Map<unknown, number>()
    for (const linha of linhas) {
      const escolaEsperada = escolaDaRequisicao.get(String(linha.requisicaoId))
      expect(escolaEsperada).toBeDefined()
      expect(linha.escolaId).toBe(escolaEsperada)
      linhasPorRequisicao.set(linha.requisicaoId, (linhasPorRequisicao.get(linha.requisicaoId) ?? 0) + 1)
    }
    expect(linhasPorRequisicao.size).toBe(50)
    expect([...linhasPorRequisicao.values()].every((total) => total === 2)).toBe(true)
  })

  it('X-Requisicao-Id fora do formato UUID é substituído, e o texto enviado não chega ao log nem à resposta', async () => {
    const injetado = `${randomUUID()}","escolaId":"${ESCOLA_B}`

    const resposta = await request(app.getHttpServer()).get('/teste/excecao').set('X-Requisicao-Id', injetado)

    const requisicaoId = esperarEnvelopeSemVazamento(resposta.body, CodigoDeErro.ERRO_INTERNO)
    expect(requisicaoId).not.toBe(injetado)
    expect(injetado).not.toContain(requisicaoId)
    const bruto = linhasDeLog.join('')
    expect(bruto).not.toContain(injetado)
    expect(bruto).not.toContain(ESCOLA_B)
    expect(registros().find((registro) => registro.evento === 'http.erro')).toMatchObject({ requisicaoId })
  })
})
