import 'reflect-metadata'
import { criarLogger, registrarErrosDoProcesso } from '@educa/nucleo'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module.js'
import { lerConfiguracao } from './config.js'
import { configurarAplicacao } from './configurar-app.js'

const config = lerConfiguracao(process.env)
const logger = criarLogger({ servico: 'api' })
registrarErrosDoProcesso(logger)
// `bufferLogs` segura o log do boot até o logger JSON estar ligado.
const app = await NestFactory.create<NestExpressApplication>(AppModule.com(config), { bufferLogs: true })
configurarAplicacao(app, logger)
app.disable('x-powered-by')
app.enableShutdownHooks()
await app.listen(config.porta, '0.0.0.0')
