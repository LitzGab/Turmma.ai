import 'reflect-metadata'
import { criarLogger, LoggerDoNest, registrarErrosDoProcesso } from '@educa/nucleo'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { lerConfiguracao } from './config.js'

const config = lerConfiguracao(process.env)
const logger = criarLogger({ servico: 'worker' })
registrarErrosDoProcesso(logger)
// Sem HTTP: o healthcheck do compose lê o batimento que o worker grava enquanto o event loop anda.
const app = await NestFactory.createApplicationContext(AppModule.com(config, logger), { bufferLogs: true })
app.useLogger(new LoggerDoNest(logger))
// `useProcessExit`: o Node é o PID 1 do container e ignoraria o sinal que o Nest reenvia a si mesmo.
app.enableShutdownHooks(['SIGTERM', 'SIGINT'], { useProcessExit: true })
logger.info({ evento: 'worker.iniciado' })
