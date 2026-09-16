import 'reflect-metadata'
import {
  criarPool,
  Drenagem,
  FiltroGlobalDeErro,
  LoggerDoNest,
  medidorGlobal,
  middlewareDeContexto,
  middlewareDeMetricasHttp,
  observarConexoesRealtime,
  observarPoolDoBanco,
  observarRedis,
  resumirErro,
  type LoggerBase,
  type Meter,
} from '@educa/nucleo'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AdaptadorSocketIoComRedis, criarClienteRedisDoRealtime } from './adaptador-redis.js'
import { AppModule } from './app.module.js'
import type { ConfiguracaoRealtime } from './config.js'

/**
 * Monta uma instância do realtime: Redis de fila conectado, pool do Postgres para o handshake ler a
 * sessão, socket.io com o adaptador de streams, contexto de requisição, log JSON, erro tipado e métricas
 * (duração por rota, conexões abertas, Redis, pool do banco). O boot e os testes de integração passam por
 * aqui, para provar a mesma ligação que sobe no container.
 */
export async function criarAplicacaoRealtime(config: ConfiguracaoRealtime, logger: LoggerBase, medidor: Meter = medidorGlobal()): Promise<NestExpressApplication> {
  const cliente = criarClienteRedisDoRealtime(config.redis.url, (erro) =>
    logger.warn({ evento: 'realtime.redis_indisponivel', erro: resumirErro(erro) }),
  )
  await cliente.connect()
  const pool = criarPool(config.banco, () => logger.warn({ evento: 'realtime.conexao_ociosa_perdida' }))
  const app = await NestFactory.create<NestExpressApplication>(AppModule.com(config, cliente, pool, logger), { bufferLogs: true })
  app.use(middlewareDeContexto)
  app.use(middlewareDeMetricasHttp(medidor))
  app.useLogger(new LoggerDoNest(logger))
  app.useGlobalFilters(new FiltroGlobalDeErro(logger))
  const adaptador = new AdaptadorSocketIoComRedis(app, cliente, config.redis.tamanhoMaximoDoStream)
  app.useWebSocketAdapter(adaptador)
  observarConexoesRealtime(medidor, () => adaptador.conexoesAbertas())
  observarRedis(medidor, { fila: [cliente] })
  observarPoolDoBanco(medidor, pool)
  app.disable('x-powered-by')
  app.get(Drenagem).prepararServidor(app.getHttpServer())
  return app
}
