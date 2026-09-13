import { Drenagem, GuardaDeAutenticacao, type LoggerBase } from '@educa/nucleo'
import { Inject, Module, type DynamicModule, type OnApplicationShutdown } from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'
import type { Redis } from 'ioredis'
import type { ConfiguracaoRealtime } from './config.js'
import { ProntidaoController } from './prontidao.controller.js'
import { CONFIGURACAO_IDENTIDADE, LOGGER_REALTIME, SistemaGateway } from './sistema.gateway.js'

export const CLIENTE_REDIS_REALTIME = Symbol('CLIENTE_REDIS_REALTIME')

@Module({})
export class AppModule implements OnApplicationShutdown {
  static com(config: ConfiguracaoRealtime, cliente: Redis, logger: LoggerBase): DynamicModule {
    return {
      module: AppModule,
      controllers: [ProntidaoController],
      providers: [
        SistemaGateway,
        { provide: CONFIGURACAO_IDENTIDADE, useValue: config.identidade },
        { provide: LOGGER_REALTIME, useValue: logger },
        { provide: CLIENTE_REDIS_REALTIME, useValue: cliente },
        { provide: Drenagem, useValue: new Drenagem(config.drenagem) },
        {
          // Toda rota HTTP exige token, salvo `@RotaAnonima()`: rota nova nasce fechada.
          provide: APP_GUARD,
          useFactory: (reflector: Reflector) => new GuardaDeAutenticacao(reflector, config.identidade),
          inject: [Reflector],
        },
      ],
    }
  }

  constructor(@Inject(CLIENTE_REDIS_REALTIME) private readonly cliente: Redis) {}

  /**
   * O socket.io já fechou quando o Nest chega aqui (o adaptador parou de ler o stream e desligou
   * as cópias do cliente). Só então sai o cliente que publica.
   */
  async onApplicationShutdown(): Promise<void> {
    if (this.cliente.status === 'end') return
    await this.cliente.quit().catch(() => this.cliente.disconnect())
  }
}
