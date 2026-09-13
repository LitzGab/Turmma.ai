import { criarClienteRedisDaApi, LimitadorDeRequisicoes, ProxiesConfiaveis, type ConfiguracaoLimite } from '@educa/nucleo'
import { Global, Inject, Logger, Module, type DynamicModule, type OnApplicationShutdown } from '@nestjs/common'
import type { Redis } from 'ioredis'

export const CLIENTE_REDIS_CACHE = Symbol('CLIENTE_REDIS_CACHE')

/**
 * Rate limit da API: o cliente do Redis de cache, o limitador e os proxies confiáveis. A guarda
 * fica no módulo raiz, logo depois da autenticação, porque a ordem das guardas globais é a ordem
 * de registro.
 */
@Global()
@Module({})
export class LimiteModule implements OnApplicationShutdown {
  private static readonly logger = new Logger('limite')

  static com(config: ConfiguracaoLimite): DynamicModule {
    let ultimoErroRegistradoEm = Number.NEGATIVE_INFINITY
    return {
      module: LimiteModule,
      providers: [
        {
          provide: CLIENTE_REDIS_CACHE,
          useFactory: () =>
            criarClienteRedisDaApi(config.redisCacheUrl, 'api-limite', () => {
              // Com o Redis fora, o ioredis erra a cada tentativa de reconexão: uma linha a cada 30 s basta.
              if (performance.now() - ultimoErroRegistradoEm < 30_000) return
              ultimoErroRegistradoEm = performance.now()
              LimiteModule.logger.warn('limite.redis_indisponivel')
            }),
        },
        {
          provide: LimitadorDeRequisicoes,
          useFactory: (cliente: Redis) => new LimitadorDeRequisicoes(cliente, config),
          inject: [CLIENTE_REDIS_CACHE],
        },
        { provide: ProxiesConfiaveis, useValue: new ProxiesConfiaveis(config.proxiesConfiaveis) },
      ],
      exports: [LimitadorDeRequisicoes, ProxiesConfiaveis],
    }
  }

  constructor(@Inject(CLIENTE_REDIS_CACHE) private readonly cliente: Redis) {}

  /** Depois de o servidor fechar: requisição em andamento durante a drenagem ainda passa pelo limite. */
  onApplicationShutdown(): void {
    this.cliente.disconnect()
  }
}
