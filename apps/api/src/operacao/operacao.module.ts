import { EmissorDeTokenDeOperador, medidorGlobal, type Banco, type ConfiguracaoIdentidade, type Meter } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { BANCO } from '../banco.module.js'
import { CifraDoSegredo } from '../sessao/cifra-do-segredo.js'
import type { ConfiguracaoLogin } from '../sessao/configuracao-de-login.js'
import { ContadorDeTentativas } from '../sessao/contador-de-tentativas.js'
import { HashDeSenha } from '../sessao/hash-de-senha.js'
import { SemaforoDeHash } from '../sessao/senha/semaforo-de-hash.js'
import { CLIENTE_REDIS_LOGIN } from '../sessao/sessao.module.js'
import { ConviteDeOperadorController } from './convite-operador.controller.js'
import { ConviteDeOperadorService } from './convite-operador.service.js'
import { ConsumoDeDesafioDeOperador, EmissorDeDesafioDeOperador } from './desafio-de-operador.js'
import { cookieDeDispositivoDeOperador } from './dispositivo-de-operador.js'
import { EntradaDoOperadorController } from './entrada.controller.js'
import { EntradaDoOperadorService } from './entrada.service.js'
import { EuDoOperadorController } from './eu.controller.js'
import { EuDoOperadorService } from './eu.service.js'
import { provedoresDaGuardaDeOperador } from './guarda-de-operador.js'
import { OperadorRepository } from './operador.repository.js'
import { SegundoFatorDoOperadorController } from './segundo-fator.controller.js'
import { SegundoFatorDoOperadorService } from './segundo-fator.service.js'

/** O que a área da operação lê da configuração, além da identidade. */
export interface OpcoesDoModuloDaOperacao {
  /** A chave e a versão do cookie de dispositivo do F1, de que sai a chave própria do operador. */
  readonly dispositivo: ConfiguracaoLogin['dispositivo']
  /** As chaves de cifra do segredo e a do HMAC dos códigos de recuperação, as do F1 (o AAD da cifra é o `operador.id`). */
  readonly mfa: ConfiguracaoLogin['mfa']
  /** O medidor da telemetria; sem ele, o global. */
  readonly medidor?: Meter
}

/**
 * A área da operação na API (Tech Spec da A0): as rotas `/v1/operacao/*`, com a `GuardaDeOperador`, e as de entrada: o
 * convite (5.0), a entrada por e-mail (6.0) e o segundo fator (7.0); renovar e sair chegam na 8.0. O semáforo, o hash de
 * senha, o contador de tentativas e o cliente do Redis de fila do login vêm do `SessaoModule`, que os exporta como
 * global: a mesma instância do login.
 */
@Module({})
export class OperacaoModule {
  static com(identidade: ConfiguracaoIdentidade, opcoes: OpcoesDoModuloDaOperacao): DynamicModule {
    return {
      module: OperacaoModule,
      controllers: [EuDoOperadorController, ConviteDeOperadorController, EntradaDoOperadorController, SegundoFatorDoOperadorController],
      providers: [
        ...provedoresDaGuardaDeOperador(identidade),
        {
          provide: ConviteDeOperadorService,
          useFactory: (banco: Banco, hash: HashDeSenha, semaforo: SemaforoDeHash) =>
            new ConviteDeOperadorService({ banco, hash, semaforo, emissorDeDesafio: new EmissorDeDesafioDeOperador(identidade.chaveAssinatura) }),
          inject: [BANCO, HashDeSenha, SemaforoDeHash],
        },
        {
          provide: EntradaDoOperadorService,
          useFactory: (banco: Banco, hash: HashDeSenha, semaforo: SemaforoDeHash, contador: ContadorDeTentativas) =>
            new EntradaDoOperadorService({
              banco,
              hash,
              semaforo,
              contador,
              dispositivo: cookieDeDispositivoDeOperador(opcoes.dispositivo),
              emissorDeDesafio: new EmissorDeDesafioDeOperador(identidade.chaveAssinatura),
              medidor: opcoes.medidor ?? medidorGlobal(),
            }),
          inject: [BANCO, HashDeSenha, SemaforoDeHash, ContadorDeTentativas],
        },
        // O `jti` do desafio do operador no Redis de fila do login, que não expulsa chave, com prefixo próprio.
        { provide: ConsumoDeDesafioDeOperador, useFactory: (cliente: Redis) => new ConsumoDeDesafioDeOperador(cliente), inject: [CLIENTE_REDIS_LOGIN] },
        {
          provide: SegundoFatorDoOperadorService,
          useFactory: (banco: Banco, contador: ContadorDeTentativas, consumo: ConsumoDeDesafioDeOperador) =>
            new SegundoFatorDoOperadorService({
              banco,
              cifra: new CifraDoSegredo(opcoes.mfa.versaoCifra, opcoes.mfa.chavesCifra),
              chaveRecuperacao: opcoes.mfa.chaveRecuperacao,
              chaveAssinatura: identidade.chaveAssinatura,
              consumo,
              contador,
              dispositivo: cookieDeDispositivoDeOperador(opcoes.dispositivo),
              emissorDeDesafio: new EmissorDeDesafioDeOperador(identidade.chaveAssinatura),
              emissorDeToken: new EmissorDeTokenDeOperador(identidade.chaveAssinatura),
              ambiente: identidade.ambiente,
            }),
          inject: [BANCO, ContadorDeTentativas, ConsumoDeDesafioDeOperador],
        },
        { provide: EuDoOperadorService, useFactory: (banco: Banco) => new EuDoOperadorService(new OperadorRepository(banco)), inject: [BANCO] },
      ],
    }
  }
}
