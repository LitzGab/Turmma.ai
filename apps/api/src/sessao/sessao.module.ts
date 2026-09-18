import {
  avisoEspacado,
  criarClienteRedisDaApi,
  EmissorDeToken,
  medidorGlobal,
  type Banco,
  type ConfiguracaoIdentidade,
  type Meter,
} from '@educa/nucleo'
import { Inject, Logger, Module, type DynamicModule, type OnApplicationShutdown } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { BANCO } from '../banco.module.js'
import type { ConfiguracaoLogin } from './configuracao-de-login.js'
import { ContadorDeTentativas } from './contador-de-tentativas.js'
import { CookieDeDispositivo } from './cookie-dispositivo.js'
import { EmissorDeDesafio } from './desafio.js'
import { EuController } from './eu.controller.js'
import { EuRepository } from './eu.repository.js'
import { EuService } from './eu.service.js'
import { HashDeSenha } from './hash-de-senha.js'
import { LoginEmailController } from './login-email.controller.js'
import { LoginService } from './login.service.js'
import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

/** Cliente do Redis de fila do login: contador de tentativas e desafio usado, que não podem ser expulsos. */
export const CLIENTE_REDIS_LOGIN = Symbol('CLIENTE_REDIS_LOGIN')

export interface OpcoesDoModuloDeSessao {
  readonly identidade: ConfiguracaoIdentidade
  readonly login: ConfiguracaoLogin
  readonly redisFilaUrl: string
  /** O medidor da telemetria; sem ele, o global (que o `main.ts` liga antes de montar a aplicação). */
  readonly medidor?: Meter
}

/**
 * O módulo de sessão: login, renovação, MFA, troca de escola e saída (tarefas 4.0 em diante). É o único que tem a
 * `ResolucaoDeTenantRepository`, e não a exporta: a fronteira da resolução de tenant fica dentro dele (Tech Spec,
 * seção 6).
 *
 * O contador de tentativas usa o Redis de fila, com o cliente da API (sem fila offline, 100 ms por comando): fora do
 * ar ou travado, o contador segue em memória, e o login não para.
 */
@Module({})
export class SessaoModule implements OnApplicationShutdown {
  private static readonly logger = new Logger('login')

  static com(opcoes: OpcoesDoModuloDeSessao): DynamicModule {
    const avisar = avisoEspacado(() => SessaoModule.logger.warn('login.redis_indisponivel'))
    return {
      module: SessaoModule,
      controllers: [LoginEmailController, EuController],
      providers: [
        { provide: CLIENTE_REDIS_LOGIN, useFactory: () => criarClienteRedisDaApi(opcoes.redisFilaUrl, 'api-login', avisar) },
        { provide: ResolucaoDeTenantRepository, useFactory: (banco: Banco) => new ResolucaoDeTenantRepository(banco), inject: [BANCO] },
        { provide: HashDeSenha, useFactory: () => HashDeSenha.criar(opcoes.login.hash) },
        { provide: ContadorDeTentativas, useFactory: (cliente: Redis) => new ContadorDeTentativas(cliente, opcoes.login.chaveContador), inject: [CLIENTE_REDIS_LOGIN] },
        { provide: EuRepository, useFactory: (banco: Banco) => new EuRepository(banco), inject: [BANCO] },
        { provide: EuService, useFactory: (eu: EuRepository) => new EuService(eu), inject: [EuRepository] },
        {
          provide: LoginService,
          useFactory: (banco: Banco, resolucao: ResolucaoDeTenantRepository, hash: HashDeSenha, contador: ContadorDeTentativas) =>
            new LoginService({
              banco,
              resolucao,
              hash,
              contador,
              dispositivo: new CookieDeDispositivo(opcoes.login.dispositivo.versao, opcoes.login.dispositivo.chave),
              emissorDeToken: new EmissorDeToken(opcoes.identidade.chaveAssinatura),
              emissorDeDesafio: new EmissorDeDesafio(opcoes.identidade.chaveAssinatura),
              ambiente: opcoes.identidade.ambiente,
              medidor: opcoes.medidor ?? medidorGlobal(),
            }),
          inject: [BANCO, ResolucaoDeTenantRepository, HashDeSenha, ContadorDeTentativas],
        },
      ],
      exports: [CLIENTE_REDIS_LOGIN, ContadorDeTentativas],
    }
  }

  constructor(@Inject(CLIENTE_REDIS_LOGIN) private readonly cliente: Redis) {}

  /** Depois de o servidor fechar: o login que termina durante a drenagem ainda conta a tentativa. */
  onApplicationShutdown(): void {
    this.cliente.disconnect()
  }
}
