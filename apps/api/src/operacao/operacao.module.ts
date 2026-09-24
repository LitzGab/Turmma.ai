import type { Banco, ConfiguracaoIdentidade } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { EuDoOperadorController } from './eu.controller.js'
import { EuDoOperadorService } from './eu.service.js'
import { provedoresDaGuardaDeOperador } from './guarda-de-operador.js'
import { OperadorRepository } from './operador.repository.js'

/**
 * A área da operação na API (Tech Spec da A0): as rotas `/v1/operacao/*`, com a `GuardaDeOperador`. As rotas de entrada
 * (convite, sessão e segundo fator) chegam nas tarefas 5.0 a 8.0.
 */
@Module({})
export class OperacaoModule {
  static com(identidade: ConfiguracaoIdentidade): DynamicModule {
    return {
      module: OperacaoModule,
      controllers: [EuDoOperadorController],
      providers: [
        ...provedoresDaGuardaDeOperador(identidade),
        { provide: EuDoOperadorService, useFactory: (banco: Banco) => new EuDoOperadorService(new OperadorRepository(banco)), inject: [BANCO] },
      ],
    }
  }
}
