import 'reflect-metadata'
import {
  Drenagem,
  FiltroGlobalDeErro,
  LoggerDoNest,
  medidorGlobal,
  middlewareDeContexto,
  middlewareDeMetricasHttp,
  observarConexoesRealtime,
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
 * Monta uma instância do realtime: Redis de fila conectado, socket.io com o adaptador de streams,
 * contexto de requisição, log JSON, erro tipado e métricas (duração por rota, conexões abertas, Redis). O
 * boot e os testes de integração passam por aqui, para provar a mesma ligação que sobe no container.
 */
export async function criarAplicacaoRealtime(config: ConfiguracaoRealtime, logger: LoggerBase, medidor: Meter = medidorGlobal()): Promise<NestExpressApplication> {
  const cliente = criarClienteRedisDoRealtime(config.redis.url, (erro) =>
    logger.warn({ evento: 'realtime.redis_indisponivel', erro: resumirErro(erro) }),
  )
  await cliente.connect()
  const app = await NestFactory.create<NestExpressApplication>(AppModule.com(config, cliente, logger), { bufferLogs: true })
  app.use(middlewareDeContexto)
  app.use(middlewareDeMetricasHttp(medidor))
  app.useLogger(new LoggerDoNest(logger))
  app.useGlobalFilters(new FiltroGlobalDeErro(logger))
  const adaptador = new AdaptadorSocketIoComRedis(app, cliente, config.redis.tamanhoMaximoDoStream)
  app.useWebSocketAdapter(adaptador)
  observarConexoesRealtime(medidor, () => adaptador.conexoesAbertas())
  observarRedis(medidor, { fila: [cliente] })
  app.disable('x-powered-by')
  app.get(Drenagem).prepararServidor(app.getHttpServer())
  return app
}
