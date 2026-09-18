import 'reflect-metadata'
import { criarLogger, iniciarTelemetria, LimitadorDeRequisicoes, observarPoolDoBanco, observarRedis, observarSeguroDoLimite, registrarErrosDoProcesso } from '@educa/nucleo'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module.js'
import { POOL_BANCO } from './banco.module.js'
import { lerConfiguracao } from './config.js'
import { configurarAplicacao } from './configurar-app.js'
import { CLIENTE_REDIS_CACHE } from './limite.module.js'
import { ContadorDeTentativas } from './sessao/contador-de-tentativas.js'
import { CLIENTE_REDIS_LOGIN } from './sessao/sessao.module.js'
import { CLIENTE_REDIS_USO } from './uso.module.js'

const config = lerConfiguracao(process.env)
const logger = criarLogger({ servico: 'api' })
registrarErrosDoProcesso(logger)
// Antes da aplicação: toda métrica nasce do medidor que exporta.
const { medidor } = iniciarTelemetria('api', config.telemetria)
// `bufferLogs` segura o log do boot até o logger JSON estar ligado.
const app = await NestFactory.create<NestExpressApplication>(AppModule.com(config), { bufferLogs: true })
configurarAplicacao(app, logger, medidor)
observarPoolDoBanco(medidor, app.get(POOL_BANCO))
observarRedis(medidor, { cache: [app.get(CLIENTE_REDIS_CACHE)], fila: [app.get(CLIENTE_REDIS_USO), app.get(CLIENTE_REDIS_LOGIN)] })
// O rate limit no Redis de cache e o contador de tentativas de login no Redis de fila: vale o que estiver no seguro.
observarSeguroDoLimite(medidor, app.get(LimitadorDeRequisicoes), app.get(ContadorDeTentativas))
app.disable('x-powered-by')
// SIGTERM drena antes de sair (Drenagem, em @educa/nucleo). `useProcessExit`: o Node é o PID 1 do
// container e ignoraria o sinal que o Nest reenvia a si mesmo no fim.
app.enableShutdownHooks(['SIGTERM', 'SIGINT'], { useProcessExit: true })
await app.listen(config.porta, '0.0.0.0')
