import { Drenagem, FiltroGlobalDeErro, LoggerDoNest, medidorGlobal, middlewareDeContexto, middlewareDeMetricasHttp, type LoggerBase, type Meter } from '@educa/nucleo'
import type { INestApplication } from '@nestjs/common'

/**
 * Tudo que toda instância da API precisa antes de atender: contexto da requisição, log JSON,
 * erro tipado, duração por rota e servidor HTTP pronto para a drenagem. Os testes de integração montam a aplicação
 * por aqui, para provar a mesma ligação que sobe em produção.
 */
export function configurarAplicacao(app: INestApplication, logger: LoggerBase, medidor: Meter = medidorGlobal()): void {
  // Primeiro middleware: o contexto precisa existir antes do body parser, cujo erro também
  // chega ao filtro com o `requisicaoId`.
  app.use(middlewareDeContexto)
  // Logo depois: toda requisição é medida, inclusive a recusada pela guarda e a que não casou rota.
  app.use(middlewareDeMetricasHttp(medidor))
  app.useLogger(new LoggerDoNest(logger))
  app.useGlobalFilters(new FiltroGlobalDeErro(logger))
  // Atrás da borda, e com o fechamento dentro do prazo da drenagem.
  app.get(Drenagem).prepararServidor(app.getHttpServer())
}
