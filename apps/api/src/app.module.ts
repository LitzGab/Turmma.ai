import { Module, type DynamicModule } from '@nestjs/common'
import { BancoModule } from './banco.module.js'
import type { ConfiguracaoApi } from './config.js'
import { SistemaModule } from './sistema/sistema.module.js'

@Module({})
export class AppModule {
  static com(config: ConfiguracaoApi): DynamicModule {
    return {
      module: AppModule,
      imports: [BancoModule.com(config.banco), SistemaModule],
    }
  }
}
