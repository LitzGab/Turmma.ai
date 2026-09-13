import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module.js'
import { lerConfiguracao } from './config.js'

const config = lerConfiguracao(process.env)
const app = await NestFactory.create<NestExpressApplication>(AppModule.com(config))
app.disable('x-powered-by')
app.enableShutdownHooks()
await app.listen(config.porta, '0.0.0.0')
