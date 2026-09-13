import { Batimento, type LoggerBase } from '@educa/nucleo'
import { Module, type DynamicModule, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common'
import type { ConfiguracaoDespachante } from './config.js'
import { montarDespachante, type DespachanteMontado } from './montagem.js'

/** Liga o laço ao ciclo do Nest: começa depois do boot, e no SIGTERM termina a rodada antes de sair. */
class CicloDoDespachante implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(private readonly montado: DespachanteMontado) {}

  onApplicationBootstrap(): void {
    this.montado.despachante.iniciar()
  }

  onApplicationShutdown(): Promise<void> {
    return this.montado.encerrar()
  }
}

@Module({})
export class AppModule {
  static com(config: ConfiguracaoDespachante, logger: LoggerBase): DynamicModule {
    return {
      module: AppModule,
      providers: [{ provide: CicloDoDespachante, useValue: new CicloDoDespachante(montarDespachante(config, logger, { batimento: new Batimento() })) }],
    }
  }
}
