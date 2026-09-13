import { Drenagem, GuardaDeAutenticacao } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'
import { BancoModule } from './banco.module.js'
import type { ConfiguracaoApi } from './config.js'
import { ProntidaoController } from './sistema/prontidao.controller.js'
import { SistemaModule } from './sistema/sistema.module.js'

@Module({})
export class AppModule {
  static com(config: ConfiguracaoApi): DynamicModule {
    return {
      module: AppModule,
      imports: [BancoModule.com(config.banco), SistemaModule],
      // A prontidão é da instância, e a drenagem fica no módulo raiz: o Nest encerra o módulo raiz
      // por último, e o prazo da drenagem só é desarmado depois de o pool do banco fechar.
      controllers: [ProntidaoController],
      providers: [
        { provide: Drenagem, useValue: new Drenagem(config.drenagem) },
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
