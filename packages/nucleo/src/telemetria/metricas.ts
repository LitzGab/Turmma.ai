import type { Meter } from '@opentelemetry/api'
import type { Redis } from 'ioredis'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { monitorEventLoopDelay } from 'node:perf_hooks'
import type { PoolBanco } from '../db/pool.js'

/**
 * Nome de toda métrica do sistema (Tech Spec, seção 5, "Observação local"). O painel
 * (`infra/grafana/paineis/`) e os alertas (13.0) leem estes nomes, já traduzidos pelo Prometheus:
 * ponto vira sublinhado, contador ganha `_total`, e unidade em segundos ganha `_seconds`.
 *
 * Métrica só leva id e rótulo de estrutura (regra 20, item 9). Nenhuma leva usuário, e só as de job e a espera pelo
 * hash de senha levam escola (`METRICAS_COM_ESCOLA`).
 */
export const METRICAS = {
  /** Histograma, em segundos, por rota template, método e status. */
  duracaoHttp: 'http.server.request.duration',
  /** Há quantos segundos o job mais antigo que ainda não começou espera, por fila e escola. Sem unidade declarada: o nome já a traz. */
  esperaMaisAntiga: 'job.espera_mais_antiga_s',
  /** Quantos jobs ainda não começaram, por fila e escola, com teto na contagem. */
  pendentes: 'job.pendentes',
  /** Quantas vezes um job chegou ao worker sem vaga e voltou a esperar, por fila e escola. */
  aguardandoVaga: 'job.aguardando_vaga',
  /** Vagas tomadas agora, por fila e escola. */
  vagasEmUso: 'fila.vagas_em_uso',
  /** Jobs que o BullMQ devolveu à espera por lock vencido (worker morto ou event loop travado), por fila. */
  jobsStalled: 'fila.jobs_stalled',
  /** Conexões abertas nesta instância do realtime. */
  conexoesRealtime: 'realtime.conexoes',
  /** Conexões do pool emprestadas agora. */
  poolEmUso: 'db.pool.em_uso',
  /** Conexões que o pool jogou fora: erro de conexão, sessão suja, conexão ociosa derrubada. */
  conexoesDescartadas: 'db.pool.conexoes_descartadas',
  /** 1 se o cliente do Redis está pronto, 0 se não, por instância de Redis (`fila`, `cache`). */
  redisDisponivel: 'redis.disponivel',
  /** Proporção das requisições limitadas pelo seguro em memória na janela recente, de 0 a 1. */
  seguroAtivo: 'limite.seguro_ativo',
  /** Tentativas de login respondidas com `CONTA_SEGURADA` (senha errada repetida), sem rótulo: a conta é global. */
  contaSegurada: 'login.conta_segurada',
  /**
   * Retornos do login pela conta Google ou Microsoft da escola, por `resultado`: `entrou`, `recusado` (domínio, tenant
   * ou ligação que não valem, a mesma recusa para todos) e `provedor` (erro, prazo ou cookie do início ausente). Sem
   * escola e sem motivo mais fino: o motivo fino diria, a quem lê o painel, qual conta existe.
   */
  loginExterno: 'login.externo',
  /**
   * Histograma, em segundos, de cada login por e-mail ou matrícula, do pedido à resposta, por `metodo` (`email`,
   * `matricula`). Conta toda resposta: entrou, senha errada, conta segurada e o 503 do semáforo do hash.
   */
  duracaoDoLogin: 'login.duracao',
  /**
   * Histograma, em segundos, de quanto o login esperou a vez no semáforo do hash de senha, por `escola_id`: a escola do
   * endereço (matrícula), `equipe` (todo login por e-mail) ou `desconhecida` (endereço que não existe). Nunca usuário,
   * matrícula nem IP.
   */
  esperaPeloHash: 'login.hash_espera',
  /** Logins que esperaram mais que o prazo pela vez no semáforo do hash e saíram com 503, sem rótulo. */
  hashRecusado: 'login.hash_recusado',
  /**
   * Renovações de sessão pelo cookie, por `resultado`: `ok`, `ja_renovado` (409 de duas abas), `resposta_perdida`
   * (o anterior voltou sem o atual ter sido usado), `reuso` (família encerrada) e `recusada` (cookie que não vale).
   */
  renovacaoDeSessao: 'sessao.renovacao',
  /** Gravações de atividade que falharam depois de a resposta sair: a sessão só vence pela tolerância. */
  atividadeFalha: 'sessao.atividade_falha',
  /** Histograma, em segundos, da leitura de sessão da `GuardaDeSessao`, uma por requisição autenticada. */
  leituraDeSessao: 'sessao.leitura.duracao',
  /** p99 do atraso do event loop no intervalo, em segundos. */
  atrasoEventLoop: 'nodejs.eventloop.delay.p99',
} as const

/**
 * As únicas métricas que levam `escola_id`: as de job e, fora de job, as de login da Tech Spec da identidade (seção 7c),
 * com cardinalidade de uma série por escola. Hoje só a espera pelo hash; `login.falhas` e `login.prioridade_rebaixada`
 * entram aqui quando nascerem (tarefa 15.3). Nenhuma outra pode levar escola, e nenhuma leva usuário.
 */
export const METRICAS_COM_ESCOLA: readonly string[] = [METRICAS.esperaMaisAntiga, METRICAS.pendentes, METRICAS.aguardandoVaga, METRICAS.vagasEmUso, METRICAS.esperaPeloHash]

/** O rótulo da escola nas métricas de job. Rotina do sistema, sem escola, aparece como `sistema`, como na chave da vaga. */
export const ROTULO_ESCOLA = 'escola_id'

/** `http.route` de requisição que não casou com rota nenhuma. Nunca o caminho: ele traria id e explodiria a cardinalidade. */
export const ROTA_NAO_ENCONTRADA = 'nao_encontrada'

const METODOS_HTTP = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])

/** Limites do histograma de duração HTTP, os recomendados pela convenção do OpenTelemetry, em segundos. */
export const LIMITES_DO_HISTOGRAMA_HTTP_S = [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10]

/** O que o Express grava na requisição ao casar a rota. */
interface RequisicaoComRota extends IncomingMessage {
  route?: { path?: unknown }
  baseUrl?: string
}

/**
 * A rota template da requisição (`/v1/sistema/jobs-sinteticos/:id`), como o roteador a casou. Sem rota
 * casada, `ROTA_NAO_ENCONTRADA`: o caminho de verdade (com o id, ou o que alguém digitou) nunca vira rótulo.
 */
export function rotaDaRequisicao(requisicao: RequisicaoComRota): string {
  const caminho = requisicao.route?.path
  if (typeof caminho !== 'string') return ROTA_NAO_ENCONTRADA
  return `${requisicao.baseUrl ?? ''}${caminho}`
}

/**
 * Middleware que mede `http.server.request.duration` de toda requisição HTTP, com a rota template,
 * o método e o status. Mede no `close` da resposta: aí o roteador já casou a rota, e a requisição
 * recusada pela guarda (401, 429) e a que não casou (404) também contam.
 */
export function middlewareDeMetricasHttp(medidor: Meter): (requisicao: IncomingMessage, resposta: ServerResponse, proximo: () => void) => void {
  const duracao = medidor.createHistogram(METRICAS.duracaoHttp, {
    unit: 's',
    description: 'Duração da requisição HTTP, por rota template',
    advice: { explicitBucketBoundaries: LIMITES_DO_HISTOGRAMA_HTTP_S },
  })
  return (requisicao, resposta, proximo) => {
    const inicio = performance.now()
    resposta.once('close', () => {
      const metodo = requisicao.method ?? ''
      duracao.record((performance.now() - inicio) / 1_000, {
        'http.request.method': METODOS_HTTP.has(metodo) ? metodo : '_OTHER',
        'http.route': rotaDaRequisicao(requisicao),
        'http.response.status_code': resposta.statusCode,
      })
    })
    proximo()
  }
}

/** Uso do pool do banco: conexões emprestadas agora e conexões descartadas desde o boot. */
export function observarPoolDoBanco(medidor: Meter, pool: PoolBanco): void {
  medidor
    .createObservableGauge(METRICAS.poolEmUso, { description: 'Conexões do pool emprestadas agora' })
    .addCallback((observador) => observador.observe(pool.totalCount - pool.idleCount))
  const descartadas = medidor.createCounter(METRICAS.conexoesDescartadas, { description: 'Conexões que o pool descartou' })
  // O pool devolve a conexão com erro para descartá-la (pool.ts: erro de conexão, sessão suja).
  pool.on('release', (erro: Error | undefined) => {
    if (erro !== undefined) descartadas.add(1)
  })
  // Conexão ociosa que o Postgres derrubou: o pool a remove.
  pool.on('error', () => descartadas.add(1))
}

/** Instância de Redis que o processo usa: o de fila (BullMQ, vagas, uso, realtime) ou o de cache (rate limit). */
export type InstanciaRedis = 'fila' | 'cache'

/**
 * `redis.disponivel{instancia}`: 1 só se todos os clientes do processo para aquela instância estão
 * prontos. Lê o estado do cliente, sem mandar comando: com o Redis fora, a coleta não espera nada.
 */
export function observarRedis(medidor: Meter, clientes: Partial<Record<InstanciaRedis, readonly Redis[]>>): void {
  medidor.createObservableGauge(METRICAS.redisDisponivel, { description: '1 se o Redis responde a este processo' }).addCallback((observador) => {
    for (const [instancia, daInstancia] of Object.entries(clientes)) {
      if (daInstancia === undefined || daInstancia.length === 0) continue
      observador.observe(daInstancia.every((cliente) => cliente.status === 'ready') ? 1 : 0, { instancia })
    }
  })
}

/**
 * `limite.seguro_ativo`: a proporção das requisições limitadas pelo seguro em memória na janela recente. Com mais de
 * uma fonte (o rate limit no Redis de cache e o contador de tentativas de login no Redis de fila), vale a maior: o
 * alerta `seguro-limite-ativo` dispara quando qualquer um dos dois conta sozinho em memória.
 */
export function observarSeguroDoLimite(medidor: Meter, ...fontes: ReadonlyArray<{ readonly proporcaoDoSeguro: number }>): void {
  medidor
    .createObservableGauge(METRICAS.seguroAtivo, { description: 'Proporção das requisições limitadas pelo seguro em memória, de 0 a 1' })
    .addCallback((observador) => observador.observe(Math.max(0, ...fontes.map((fonte) => fonte.proporcaoDoSeguro))))
}

/** `realtime.conexoes`: conexões abertas nesta instância, sem rótulo de escola nem de sala. */
export function observarConexoesRealtime(medidor: Meter, conexoesAbertas: () => number): void {
  medidor
    .createObservableGauge(METRICAS.conexoesRealtime, { description: 'Conexões abertas nesta instância do realtime' })
    .addCallback((observador) => observador.observe(conexoesAbertas()))
}

/** p99 do atraso do event loop entre duas coletas: job de CPU no event loop, GC longo, travamento. */
export function observarEventLoop(medidor: Meter): void {
  const monitor = monitorEventLoopDelay({ resolution: 20 })
  monitor.enable()
  medidor.createObservableGauge(METRICAS.atrasoEventLoop, { unit: 's', description: 'p99 do atraso do event loop' }).addCallback((observador) => {
    // O histograma registra em nanossegundos. Zerado a cada coleta: o valor é o do intervalo, não desde o boot.
    observador.observe(monitor.percentile(99) / 1e9)
    monitor.reset()
  })
}
