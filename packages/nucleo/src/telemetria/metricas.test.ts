import type { Redis } from 'ioredis'
import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MedidorDeTeste } from '../../../../tools/testes/metricas.ts'
import type { PoolBanco } from '../db/pool.js'
import { lerConfiguracaoTelemetria } from './iniciar.js'
import { METRICAS, METRICAS_COM_ESCOLA, middlewareDeMetricasHttp, observarPoolDoBanco, observarRedis, observarSeguroDoLimite, ROTA_NAO_ENCONTRADA, rotaDaRequisicao } from './metricas.js'

const ID = '0190f5a0-0000-7000-8000-0000000000c1'

let medidor: MedidorDeTeste

beforeEach(() => {
  medidor = new MedidorDeTeste()
})

afterEach(async () => {
  await medidor.encerrar()
})

/** Uma requisição que termina: o roteador casou (ou não) a rota, e a resposta fecha com o status. */
function atender(requisicao: Partial<IncomingMessage> & { route?: { path?: unknown }; baseUrl?: string }, status: number): void {
  const resposta = Object.assign(new EventEmitter(), { statusCode: status }) as unknown as ServerResponse
  middlewareDeMetricasHttp(medidor.medidor)(requisicao as IncomingMessage, resposta, () => undefined)
  ;(resposta as unknown as EventEmitter).emit('close')
}

describe('http.server.request.duration', () => {
  it('rota template: registra `/v1/sistema/jobs-sinteticos/:id`, e o id do caminho nunca vira rótulo', async () => {
    atender({ method: 'GET', url: `/v1/sistema/jobs-sinteticos/${ID}`, route: { path: '/v1/sistema/jobs-sinteticos/:id' } }, 200)
    atender({ method: 'GET', url: `/v1/sistema/jobs-sinteticos/${ID}`, route: { path: '/v1/sistema/jobs-sinteticos/:id' } }, 404)

    const pontos = await medidor.pontos(METRICAS.duracaoHttp)
    expect(pontos.map((ponto) => ponto.atributos)).toEqual([
      { 'http.request.method': 'GET', 'http.route': '/v1/sistema/jobs-sinteticos/:id', 'http.response.status_code': 200 },
      { 'http.request.method': 'GET', 'http.route': '/v1/sistema/jobs-sinteticos/:id', 'http.response.status_code': 404 },
    ])
    expect(JSON.stringify(pontos)).not.toContain(ID)
  })

  it('borda: caminho que não casou rota nenhuma vira `nao_encontrada`, e não o que o cliente digitou', async () => {
    atender({ method: 'GET', url: `/qualquer/${ID}?nome=Enzo` }, 404)
    atender({ method: 'BREW', url: '/cafe' }, 404)

    const pontos = await medidor.pontos(METRICAS.duracaoHttp)
    expect(pontos.map((ponto) => ponto.atributos)).toEqual([
      { 'http.request.method': 'GET', 'http.route': ROTA_NAO_ENCONTRADA, 'http.response.status_code': 404 },
      // Método fora da lista não abre série nova por texto do cliente.
      { 'http.request.method': '_OTHER', 'http.route': ROTA_NAO_ENCONTRADA, 'http.response.status_code': 404 },
    ])
    expect(JSON.stringify(pontos)).not.toContain('Enzo')
  })

  it('a rota montada num prefixo leva o prefixo, e só em template', () => {
    expect(rotaDaRequisicao({ baseUrl: '/v1', route: { path: '/turmas/:turmaId' } } as never)).toBe('/v1/turmas/:turmaId')
    expect(rotaDaRequisicao({ route: { path: /regex/ } } as never)).toBe(ROTA_NAO_ENCONTRADA)
  })

  it('mede a duração em segundos, quando a resposta fecha', async () => {
    const resposta = Object.assign(new EventEmitter(), { statusCode: 200 }) as unknown as ServerResponse
    middlewareDeMetricasHttp(medidor.medidor)({ method: 'GET', route: { path: '/saude' } } as never, resposta, () => undefined)
    expect(await medidor.pontos(METRICAS.duracaoHttp)).toEqual([])
    await new Promise((resolver) => setTimeout(resolver, 30))
    ;(resposta as unknown as EventEmitter).emit('close')
    const [ponto] = await medidor.pontos(METRICAS.duracaoHttp)
    const valor = ponto?.valor as { contagem: number; soma: number }
    expect(valor.contagem).toBe(1)
    expect(valor.soma).toBeGreaterThanOrEqual(0.02)
    expect(valor.soma).toBeLessThan(1)
  })
})

describe('pool do banco', () => {
  function poolFalso(total: number, ocioso: number): PoolBanco & EventEmitter {
    return Object.assign(new EventEmitter(), { totalCount: total, idleCount: ocioso }) as unknown as PoolBanco & EventEmitter
  }

  it('em uso é o total menos as ociosas; descartada conta a devolução com erro e a ociosa derrubada, e não a devolução limpa', async () => {
    const pool = poolFalso(7, 3)
    observarPoolDoBanco(medidor.medidor, pool)
    pool.emit('release', undefined, {})
    pool.emit('release', undefined, {})
    pool.emit('release', new Error('sessão com transação pendente'), {})
    pool.emit('error', new Error('conexão ociosa derrubada'), {})

    expect((await medidor.pontos(METRICAS.poolEmUso)).map((ponto) => ponto.valor)).toEqual([4])
    expect((await medidor.pontos(METRICAS.conexoesDescartadas)).map((ponto) => ponto.valor)).toEqual([2])
  })
})

describe('redis.disponivel', () => {
  const cliente = (status: string) => ({ status }) as unknown as Redis

  it('1 só com todo cliente da instância pronto; o de cache e o de fila em séries separadas, sem outro rótulo', async () => {
    const pronto = cliente('ready')
    const reconectando = cliente('reconnecting')
    observarRedis(medidor.medidor, { fila: [pronto, reconectando], cache: [cliente('ready')] })

    const pontos = await medidor.pontos(METRICAS.redisDisponivel)
    expect(pontos).toEqual([
      { atributos: { instancia: 'fila' }, valor: 0 },
      { atributos: { instancia: 'cache' }, valor: 1 },
    ])
  })
})

describe('limite.seguro_ativo', () => {
  it('com o rate limit e o contador de login, vale o maior: qualquer um contando só em memória acende a métrica', async () => {
    const limite = { proporcaoDoSeguro: 0 }
    const login = { proporcaoDoSeguro: 0 }
    observarSeguroDoLimite(medidor.medidor, limite, login)
    expect((await medidor.pontos(METRICAS.seguroAtivo)).map((ponto) => ponto.valor)).toEqual([0])
    login.proporcaoDoSeguro = 1
    expect((await medidor.pontos(METRICAS.seguroAtivo)).map((ponto) => ponto.valor)).toEqual([1])
    login.proporcaoDoSeguro = 0
    limite.proporcaoDoSeguro = 0.5
    expect((await medidor.pontos(METRICAS.seguroAtivo)).map((ponto) => ponto.valor)).toEqual([0.5])
  })
})

describe('configuração da telemetria', () => {
  it('lê o destino sem barra no fim e o intervalo, e não sobe sem eles ou com intervalo abaixo de 1 s', () => {
    expect(lerConfiguracaoTelemetria({ TELEMETRIA_OTLP_URL: 'http://observabilidade:4318/', TELEMETRIA_INTERVALO_MS: '5000' })).toEqual({
      otlpUrl: 'http://observabilidade:4318',
      intervaloMs: 5000,
    })
    expect(() => lerConfiguracaoTelemetria({ TELEMETRIA_INTERVALO_MS: '5000' })).toThrow('TELEMETRIA_OTLP_URL')
    expect(() => lerConfiguracaoTelemetria({ TELEMETRIA_OTLP_URL: 'redis://x:1', TELEMETRIA_INTERVALO_MS: '5000' })).toThrow('TELEMETRIA_OTLP_URL')
    expect(() => lerConfiguracaoTelemetria({ TELEMETRIA_OTLP_URL: 'http://observabilidade:4318', TELEMETRIA_INTERVALO_MS: '100' })).toThrow('TELEMETRIA_INTERVALO_MS')
  })
})

describe('métricas com escola', () => {
  it('lista fechada: `escola_id` só nas quatro de job e, fora de job, na espera pelo hash de login (Tech Spec da identidade, 7c)', () => {
    // Uma métrica nova com escola precisa entrar aqui de propósito: o rótulo multiplica as séries por escola, e fora
    // desta lista o teste de cardinalidade da observabilidade (infra/test/metricas.int.test.ts) a reprova.
    expect([...METRICAS_COM_ESCOLA].sort()).toEqual(
      [METRICAS.esperaMaisAntiga, METRICAS.pendentes, METRICAS.aguardandoVaga, METRICAS.vagasEmUso, METRICAS.esperaPeloHash, METRICAS.falhasDeLogin, METRICAS.prioridadeRebaixada].sort(),
    )
    expect(METRICAS_COM_ESCOLA).not.toContain(METRICAS.limiteEmailIp)
    expect(METRICAS_COM_ESCOLA).not.toContain(METRICAS.rebaixadoPorIp)
    expect(METRICAS_COM_ESCOLA).not.toContain(METRICAS.duracaoDoLogin)
    expect(METRICAS_COM_ESCOLA).not.toContain(METRICAS.hashRecusado)
  })
})
