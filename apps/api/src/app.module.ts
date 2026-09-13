import { GuardaDeAutenticacao } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'
import { BancoModule } from './banco.module.js'
import type { ConfiguracaoApi } from './config.js'
import { SistemaModule } from './sistema/sistema.module.js'

@Module({})
export class AppModule {
  static com(config: ConfiguracaoApi): DynamicModule {
    return {
      module: AppModule,
      imports: [BancoModule.com(config.banco), SistemaModule],
      providers: [
        {
          // Global: toda rota exige token, salvo as marcadas com `@RotaAnonima()`.
          provide: APP_GUARD,
          useFactory: (reflector: Reflector) => new GuardaDeAutenticacao(reflector, config.identidade),
          inject: [Reflector],
        },
      ],
    }
  }
}
