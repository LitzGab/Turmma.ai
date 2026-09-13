import { Enfileirador, JobRegistroRepository, type Banco } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { ContextoController } from './contexto.controller.js'
import { JobsSinteticosConsultaController, JobsSinteticosController } from './jobs-sinteticos.controller.js'
import { JobsSinteticosService } from './jobs-sinteticos.service.js'
import { SaudeController } from './saude.controller.js'
import { SaudeService } from './saude.service.js'

@Module({})
export class SistemaModule {
  /**
   * Com `rotasSinteticas` desligado, o `POST` de job sintético nem é registrado: a rota responde o
   * mesmo 404 de qualquer rota inexistente, com ou sem token.
   */
  static com(opcoes: { rotasSinteticas: boolean }): DynamicModule {
    return {
      module: SistemaModule,
      controllers: [
        SaudeController,
        ContextoController,
        JobsSinteticosConsultaController,
        ...(opcoes.rotasSinteticas ? [JobsSinteticosController] : []),
      ],
      providers: [
        SaudeService,
        JobsSinteticosService,
        { provide: JobRegistroRepository, useFactory: (banco: Banco) => new JobRegistroRepository(banco), inject: [BANCO] },
        { provide: Enfileirador, useFactory: (repositorio: JobRegistroRepository) => new Enfileirador(repositorio), inject: [JobRegistroRepository] },
      ],
    }
  }
}
