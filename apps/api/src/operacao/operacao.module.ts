import { medidorGlobal, type Banco, type ConfiguracaoIdentidade, type Meter } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import type { ConfiguracaoLogin } from '../sessao/configuracao-de-login.js'
import { ContadorDeTentativas } from '../sessao/contador-de-tentativas.js'
import { HashDeSenha } from '../sessao/hash-de-senha.js'
import { SemaforoDeHash } from '../sessao/senha/semaforo-de-hash.js'
import { ConviteDeOperadorController } from './convite-operador.controller.js'
import { ConviteDeOperadorService } from './convite-operador.service.js'
import { EmissorDeDesafioDeOperador } from './desafio-de-operador.js'
import { cookieDeDispositivoDeOperador } from './dispositivo-de-operador.js'
import { EntradaDoOperadorController } from './entrada.controller.js'
import { EntradaDoOperadorService } from './entrada.service.js'
import { EuDoOperadorController } from './eu.controller.js'
import { EuDoOperadorService } from './eu.service.js'
import { provedoresDaGuardaDeOperador } from './guarda-de-operador.js'
import { OperadorRepository } from './operador.repository.js'

/** O que a área da operação lê da configuração, além da identidade. */
export interface OpcoesDoModuloDaOperacao {
  /** A chave e a versão do cookie de dispositivo do F1, de que sai a chave própria do operador. */
  readonly dispositivo: ConfiguracaoLogin['dispositivo']
  /** O medidor da telemetria; sem ele, o global. */
  readonly medidor?: Meter
}

/**
 * A área da operação na API (Tech Spec da A0): as rotas `/v1/operacao/*`, com a `GuardaDeOperador`, e as de entrada: o
 * convite (5.0) e a entrada por e-mail (6.0); o segundo fator e a sessão chegam nas tarefas 7.0 e 8.0. O semáforo, o
 * hash de senha e o contador de tentativas vêm do `SessaoModule`, que os exporta como global: a mesma instância do
 * login.
 */
@Module({})
export class OperacaoModule {
  static com(identidade: ConfiguracaoIdentidade, opcoes: OpcoesDoModuloDaOperacao): DynamicModule {
    return {
      module: OperacaoModule,
      controllers: [EuDoOperadorController, ConviteDeOperadorController, EntradaDoOperadorController],
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
        { provide: EuDoOperadorService, useFactory: (banco: Banco) => new EuDoOperadorService(new OperadorRepository(banco)), inject: [BANCO] },
      ],
    }
  }
}
