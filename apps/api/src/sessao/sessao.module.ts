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
import { AcessoDaEscolaController } from './acesso-da-escola.controller.js'
import { AcessoDaEscolaService } from './acesso-da-escola.service.js'
import { AtividadeController } from './atividade.controller.js'
import { RegistroDeAtividade } from './atividade.service.js'
import { ContadorDeTentativas } from './contador-de-tentativas.js'
import { CookieDeDispositivo } from './cookie-dispositivo.js'
import { CifraDoSegredo } from './cifra-do-segredo.js'
import { ConclusaoDeLogin } from './conclusao-de-login.js'
import { BilheteDeConvite } from './bilhete-de-convite.js'
import { ConviteController } from './convite.controller.js'
import { AtivacaoPorConvite, ConviteService } from './convite.service.js'
import { ConsumoDeDesafio, EmissorDeDesafio } from './desafio.js'
import { EuController } from './eu.controller.js'
import { EuRepository } from './eu.repository.js'
import { EuService } from './eu.service.js'
import { HashDeSenha } from './hash-de-senha.js'
import { LoginEmailController } from './login-email.controller.js'
import { LoginService } from './login.service.js'
import { LoginMatriculaController } from './matricula.controller.js'
import { LoginPorMatricula } from './matricula.service.js'
import { ContaMfaController, SessaoMfaController } from './mfa.controller.js'
import { MfaService } from './mfa.service.js'
import { RedefinicaoDeMfa } from './redefinicao-de-mfa.js'
import { RedefinirMfaController } from './redefinir-mfa.controller.js'
import { RenovacaoController } from './renovacao.controller.js'
import { RenovacaoService } from './renovacao.service.js'
import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'
import { SaidaController } from './saida.controller.js'
import { SaidaService } from './saida.service.js'
import { TrocaDeEscolaController } from './troca-de-escola.controller.js'
import { TrocaDeEscolaService } from './troca-de-escola.service.js'

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
 * O módulo de sessão: login (por e-mail e, na 11.0, do aluno por matrícula no endereço da escola), renovação, MFA (com a redefinição pela coordenação), convite do coordenador, troca de
 * escola e saída (tarefas 4.0 em diante). É o único que tem a
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
      controllers: [
        LoginEmailController,
        LoginMatriculaController,
        AcessoDaEscolaController,
        SessaoMfaController,
        ContaMfaController,
        RedefinirMfaController,
        EuController,
        RenovacaoController,
        AtividadeController,
        SaidaController,
        ConviteController,
        TrocaDeEscolaController,
      ],
      providers: [
        { provide: CLIENTE_REDIS_LOGIN, useFactory: () => criarClienteRedisDaApi(opcoes.redisFilaUrl, 'api-login', avisar) },
        { provide: ResolucaoDeTenantRepository, useFactory: (banco: Banco) => new ResolucaoDeTenantRepository(banco), inject: [BANCO] },
        { provide: HashDeSenha, useFactory: () => HashDeSenha.criar(opcoes.login.hash) },
        { provide: ContadorDeTentativas, useFactory: (cliente: Redis) => new ContadorDeTentativas(cliente, opcoes.login.chaveContador), inject: [CLIENTE_REDIS_LOGIN] },
        { provide: EuRepository, useFactory: (banco: Banco) => new EuRepository(banco), inject: [BANCO] },
        { provide: EuService, useFactory: (eu: EuRepository, resolucao: ResolucaoDeTenantRepository) => new EuService(eu, resolucao), inject: [EuRepository, ResolucaoDeTenantRepository] },
        { provide: CookieDeDispositivo, useFactory: () => new CookieDeDispositivo(opcoes.login.dispositivo.versao, opcoes.login.dispositivo.chave) },
        {
          provide: ConclusaoDeLogin,
          useFactory: (banco: Banco, dispositivo: CookieDeDispositivo) =>
            new ConclusaoDeLogin({
              banco,
              dispositivo,
              emissorDeToken: new EmissorDeToken(opcoes.identidade.chaveAssinatura),
              emissorDeDesafio: new EmissorDeDesafio(opcoes.identidade.chaveAssinatura),
              ambiente: opcoes.identidade.ambiente,
            }),
          inject: [BANCO, CookieDeDispositivo],
        },
        { provide: BilheteDeConvite, useFactory: () => new BilheteDeConvite(opcoes.identidade.chaveAssinatura) },
        { provide: AtivacaoPorConvite, useFactory: (banco: Banco, bilhetes: BilheteDeConvite) => new AtivacaoPorConvite(banco, bilhetes), inject: [BANCO, BilheteDeConvite] },
        {
          provide: LoginService,
          useFactory: (
            resolucao: ResolucaoDeTenantRepository,
            hash: HashDeSenha,
            contador: ContadorDeTentativas,
            dispositivo: CookieDeDispositivo,
            conclusao: ConclusaoDeLogin,
            ativacao: AtivacaoPorConvite,
          ) => new LoginService({ resolucao, hash, contador, dispositivo, conclusao, ativacao, medidor: opcoes.medidor ?? medidorGlobal() }),
          inject: [ResolucaoDeTenantRepository, HashDeSenha, ContadorDeTentativas, CookieDeDispositivo, ConclusaoDeLogin, AtivacaoPorConvite],
        },
        {
          provide: LoginPorMatricula,
          useFactory: (
            banco: Banco,
            resolucao: ResolucaoDeTenantRepository,
            hash: HashDeSenha,
            contador: ContadorDeTentativas,
            dispositivo: CookieDeDispositivo,
            conclusao: ConclusaoDeLogin,
          ) => new LoginPorMatricula({ banco, resolucao, hash, contador, dispositivo, conclusao, medidor: opcoes.medidor ?? medidorGlobal() }),
          inject: [BANCO, ResolucaoDeTenantRepository, HashDeSenha, ContadorDeTentativas, CookieDeDispositivo, ConclusaoDeLogin],
        },
        {
          provide: AcessoDaEscolaService,
          useFactory: (banco: Banco, resolucao: ResolucaoDeTenantRepository) => new AcessoDaEscolaService(banco, resolucao),
          inject: [BANCO, ResolucaoDeTenantRepository],
        },
        {
          provide: ConviteService,
          useFactory: (banco: Banco, resolucao: ResolucaoDeTenantRepository, hash: HashDeSenha, bilhetes: BilheteDeConvite) =>
            new ConviteService({ banco, resolucao, hash, bilhetes, emissorDeDesafio: new EmissorDeDesafio(opcoes.identidade.chaveAssinatura) }),
          inject: [BANCO, ResolucaoDeTenantRepository, HashDeSenha, BilheteDeConvite],
        },
        {
          provide: MfaService,
          useFactory: (
            banco: Banco,
            resolucao: ResolucaoDeTenantRepository,
            contador: ContadorDeTentativas,
            dispositivo: CookieDeDispositivo,
            conclusao: ConclusaoDeLogin,
            cliente: Redis,
            ativacao: AtivacaoPorConvite,
          ) =>
            new MfaService({
              banco,
              resolucao,
              contador,
              dispositivo,
              conclusao,
              ativacao,
              cifra: new CifraDoSegredo(opcoes.login.mfa.versaoCifra, opcoes.login.mfa.chavesCifra),
              consumo: new ConsumoDeDesafio(cliente),
              chaveAssinatura: opcoes.identidade.chaveAssinatura,
              chaveRecuperacao: opcoes.login.mfa.chaveRecuperacao,
              medidor: opcoes.medidor ?? medidorGlobal(),
            }),
          inject: [BANCO, ResolucaoDeTenantRepository, ContadorDeTentativas, CookieDeDispositivo, ConclusaoDeLogin, CLIENTE_REDIS_LOGIN, AtivacaoPorConvite],
        },
        {
          provide: TrocaDeEscolaService,
          useFactory: (banco: Banco, resolucao: ResolucaoDeTenantRepository, conclusao: ConclusaoDeLogin, cliente: Redis) =>
            new TrocaDeEscolaService({
              banco,
              resolucao,
              conclusao,
              consumo: new ConsumoDeDesafio(cliente),
              emissorDeDesafio: new EmissorDeDesafio(opcoes.identidade.chaveAssinatura),
              chaveAssinatura: opcoes.identidade.chaveAssinatura,
            }),
          inject: [BANCO, ResolucaoDeTenantRepository, ConclusaoDeLogin, CLIENTE_REDIS_LOGIN],
        },
        { provide: RedefinicaoDeMfa, useFactory: (banco: Banco) => new RedefinicaoDeMfa(banco), inject: [BANCO] },
        {
          provide: RenovacaoService,
          useFactory: (banco: Banco) =>
            new RenovacaoService({
              banco,
              emissorDeToken: new EmissorDeToken(opcoes.identidade.chaveAssinatura),
              ambiente: opcoes.identidade.ambiente,
              medidor: opcoes.medidor ?? medidorGlobal(),
            }),
          inject: [BANCO],
        },
        { provide: RegistroDeAtividade, useFactory: (banco: Banco) => new RegistroDeAtividade(banco, opcoes.medidor ?? medidorGlobal()), inject: [BANCO] },
        { provide: SaidaService, useFactory: (banco: Banco) => new SaidaService(banco, opcoes.identidade.ambiente), inject: [BANCO] },
      ],
      // `RegistroDeAtividade` é o contrato para o F6: a gravação de resposta de avaliação também conta como uso.
      exports: [CLIENTE_REDIS_LOGIN, ContadorDeTentativas, RegistroDeAtividade],
    }
  }

  constructor(@Inject(CLIENTE_REDIS_LOGIN) private readonly cliente: Redis) {}

  /** Depois de o servidor fechar: o login que termina durante a drenagem ainda conta a tentativa. */
  onApplicationShutdown(): void {
    this.cliente.disconnect()
  }
}
