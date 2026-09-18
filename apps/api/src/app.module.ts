import {
  ConferenciaDasPermissoes,
  ConfiguracaoOperacional,
  ContadorDeUso,
  Drenagem,
  GuardaDeAutenticacao,
  GuardaDeLimite,
  GuardaDePermissao,
  GuardaDeSessao,
  InterceptorDeUso,
  LimitadorDeRequisicoes,
  medidorGlobal,
  ProxiesConfiaveis,
  SessaoRepository,
  type Banco,
  type LimitesDeRequisicao,
  type Meter,
} from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR, DiscoveryModule, DiscoveryService, Reflector } from '@nestjs/core'
import { BANCO, BancoModule } from './banco.module.js'
import type { ConfiguracaoApi } from './config.js'
import { EstruturaModule } from './estrutura/estrutura.module.js'
import { LIMITES_DA_ESCOLA, LimiteModule } from './limite.module.js'
import { SessaoModule } from './sessao/sessao.module.js'
import { ProntidaoController } from './sistema/prontidao.controller.js'
import { SistemaModule } from './sistema/sistema.module.js'
import { UsoModule } from './uso.module.js'

@Module({})
export class AppModule {
  /** @param opcoes.medidor só o teste passa, para ler as métricas do login e da sessão; sem ele, vale o medidor global. */
  static com(config: ConfiguracaoApi, opcoes: { medidor?: Meter } = {}): DynamicModule {
    return {
      module: AppModule,
      imports: [
        DiscoveryModule,
        BancoModule.com(config.banco),
        LimiteModule.com(config.limite),
        UsoModule.com(config.redisFilaUrl),
        SessaoModule.com({ identidade: config.identidade, login: config.login, redisFilaUrl: config.redisFilaUrl, ...opcoes }),
        EstruturaModule,
        SistemaModule.com({
          rotasSinteticas: config.rotasSinteticas,
          versao: config.versao,
          ambiente: config.identidade.ambiente,
          avisos: config.avisos,
        }),
      ],
      // A prontidão é da instância, e a drenagem fica no módulo raiz: o Nest encerra o módulo raiz
      // por último, e o prazo da drenagem só é desarmado depois de o pool do banco fechar.
      controllers: [ProntidaoController],
      providers: [
        { provide: Drenagem, useValue: new Drenagem(config.drenagem) },
        {
          // No boot: rota sem @Permite e sem @RotaAnonima não sobe (RF17).
          provide: ConferenciaDasPermissoes,
          useFactory: (descoberta: DiscoveryService) => new ConferenciaDasPermissoes(descoberta),
          inject: [DiscoveryService],
        },
        // As guardas globais rodam na ordem de registro (Tech Spec, seção 1): JWT, limite, sessão, permissão.
        {
          // 1. Só o JWT, sem banco nem Redis: toda rota exige token, salvo as marcadas com `@RotaAnonima()`.
          provide: APP_GUARD,
          useFactory: (reflector: Reflector) => new GuardaDeAutenticacao(reflector, config.identidade),
          inject: [Reflector],
        },
        {
          // 2. O limite pelo `sub` e pelo `esc` do token verificado, com os limites da escola: rajada acima do
          // limite é recusada antes de chegar ao Postgres.
          provide: APP_GUARD,
          useFactory: (reflector: Reflector, limitador: LimitadorDeRequisicoes, proxies: ProxiesConfiaveis, limites: ConfiguracaoOperacional<LimitesDeRequisicao>) =>
            new GuardaDeLimite(reflector, limitador, proxies, limites),
          inject: [Reflector, LimitadorDeRequisicoes, ProxiesConfiaveis, LIMITES_DA_ESCOLA],
        },
        { provide: SessaoRepository, useFactory: (banco: Banco) => new SessaoRepository(banco), inject: [BANCO] },
        {
          // 3. A sessão no Postgres, sem cache: grava escola, usuário, papel, sessão e ano letivo no contexto.
          provide: APP_GUARD,
          useFactory: (reflector: Reflector, sessoes: SessaoRepository) => new GuardaDeSessao(reflector, sessoes, opcoes.medidor ?? medidorGlobal()),
          inject: [Reflector, SessaoRepository],
        },
        {
          // 4. O papel da sessão contra a célula da `MATRIZ` que a rota declarou em `@Permite`.
          provide: APP_GUARD,
          useFactory: (reflector: Reflector) => new GuardaDePermissao(reflector),
          inject: [Reflector],
        },
        {
          // Interceptor roda depois das guardas: conta só a requisição autenticada e dentro do limite,
          // na escola da sessão.
          provide: APP_INTERCEPTOR,
          useFactory: (contador: ContadorDeUso) => new InterceptorDeUso(contador),
          inject: [ContadorDeUso],
        },
      ],
    }
  }
}
