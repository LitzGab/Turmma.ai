import { criarPool, type ConfiguracaoBanco, type PoolBanco } from '@educa/nucleo'
import { Global, Inject, Logger, Module, type DynamicModule, type OnApplicationShutdown } from '@nestjs/common'

export const POOL_BANCO = Symbol('POOL_BANCO')

@Global()
@Module({})
export class BancoModule implements OnApplicationShutdown {
  private static readonly logger = new Logger('banco')

  static com(config: ConfiguracaoBanco): DynamicModule {
    return {
      module: BancoModule,
      providers: [
        {
          provide: POOL_BANCO,
          useFactory: () => criarPool(config, () => BancoModule.logger.warn('banco.conexao_ociosa_perdida')),
        },
      ],
      exports: [POOL_BANCO],
    }
  }

  constructor(@Inject(POOL_BANCO) private readonly pool: PoolBanco) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end()
  }
}
