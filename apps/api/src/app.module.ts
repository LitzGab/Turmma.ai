import {
  ConfiguracaoOperacional,
  Drenagem,
  GuardaDeAutenticacao,
  GuardaDeLimite,
  LimitadorDeRequisicoes,
  ProxiesConfiaveis,
  type LimitesDeRequisicao,
} from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'
import { BancoModule } from './banco.module.js'
import type { ConfiguracaoApi } from './config.js'
import { LIMITES_DA_ESCOLA, LimiteModule } from './limite.module.js'
import { ProntidaoController } from './sistema/prontidao.controller.js'
import { SistemaModule } from './sistema/sistema.module.js'

@Module({})
export class AppModule {
  static com(config: ConfiguracaoApi): DynamicModule {
    return {
      module: AppModule,
      imports: [BancoModule.com(config.banco), LimiteModule.com(config.limite), SistemaModule.com({ rotasSinteticas: config.rotasSinteticas })],
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
        {
          // Depois da autenticação (as guardas globais rodam na ordem de registro): a rota
          // autenticada é limitada pelo usuário e pela escola que o token gravou no contexto, com os
          // limites da configuração dessa escola.
          provide: APP_GUARD,
          useFactory: (reflector: Reflector, limitador: LimitadorDeRequisicoes, proxies: ProxiesConfiaveis, limites: ConfiguracaoOperacional<LimitesDeRequisicao>) =>
            new GuardaDeLimite(reflector, limitador, proxies, limites),
          inject: [Reflector, LimitadorDeRequisicoes, ProxiesConfiaveis, LIMITES_DA_ESCOLA],
        },
      ],
    }
  }
}
