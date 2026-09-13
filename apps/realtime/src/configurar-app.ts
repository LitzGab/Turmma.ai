import 'reflect-metadata'
import { Drenagem, FiltroGlobalDeErro, LoggerDoNest, middlewareDeContexto, resumirErro, type LoggerBase } from '@educa/nucleo'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AdaptadorSocketIoComRedis, criarClienteRedisDoRealtime } from './adaptador-redis.js'
import { AppModule } from './app.module.js'
import type { ConfiguracaoRealtime } from './config.js'

/**
 * Monta uma instância do realtime: Redis de fila conectado, socket.io com o adaptador de streams,
 * contexto de requisição, log JSON e erro tipado. O boot e os testes de integração passam por aqui,
 * para provar a mesma ligação que sobe no container.
 */
export async function criarAplicacaoRealtime(config: ConfiguracaoRealtime, logger: LoggerBase): Promise<NestExpressApplication> {
  const cliente = criarClienteRedisDoRealtime(config.redis.url, (erro) =>
    logger.warn({ evento: 'realtime.redis_indisponivel', erro: resumirErro(erro) }),
  )
  await cliente.connect()
  const app = await NestFactory.create<NestExpressApplication>(AppModule.com(config, cliente, logger), { bufferLogs: true })
  app.use(middlewareDeContexto)
  app.useLogger(new LoggerDoNest(logger))
  app.useGlobalFilters(new FiltroGlobalDeErro(logger))
  app.useWebSocketAdapter(new AdaptadorSocketIoComRedis(app, cliente, config.redis.tamanhoMaximoDoStream))
  app.disable('x-powered-by')
  app.get(Drenagem).prepararServidor(app.getHttpServer())
  return app
}
