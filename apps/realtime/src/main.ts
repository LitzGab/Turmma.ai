import 'reflect-metadata'
import { criarLogger, iniciarTelemetria, registrarErrosDoProcesso } from '@educa/nucleo'
import { lerConfiguracao } from './config.js'
import { criarAplicacaoRealtime } from './configurar-app.js'

const config = lerConfiguracao(process.env)
const logger = criarLogger({ servico: 'realtime' })
registrarErrosDoProcesso(logger)
// Antes da aplicação: toda métrica nasce do medidor que exporta.
const { medidor } = iniciarTelemetria('realtime', config.telemetria)
const app = await criarAplicacaoRealtime(config, logger, medidor)
// SIGTERM drena antes de sair (Drenagem, em @educa/nucleo): a borda tira a instância, e só então o
// socket.io fecha e os clientes reconectam na outra. `useProcessExit`: o Node é o PID 1 do container.
app.enableShutdownHooks(['SIGTERM', 'SIGINT'], { useProcessExit: true })
await app.listen(config.porta, '0.0.0.0')
