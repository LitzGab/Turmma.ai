import type { Banco, ConfiguracaoIdentidade } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { HashDeSenha } from '../sessao/hash-de-senha.js'
import { SemaforoDeHash } from '../sessao/senha/semaforo-de-hash.js'
import { ConviteDeOperadorController } from './convite-operador.controller.js'
import { ConviteDeOperadorService } from './convite-operador.service.js'
import { EmissorDeDesafioDeOperador } from './desafio-de-operador.js'
import { EuDoOperadorController } from './eu.controller.js'
import { EuDoOperadorService } from './eu.service.js'
import { provedoresDaGuardaDeOperador } from './guarda-de-operador.js'
import { OperadorRepository } from './operador.repository.js'

/**
 * A área da operação na API (Tech Spec da A0): as rotas `/v1/operacao/*`, com a `GuardaDeOperador`, e as de entrada: o
 * convite (5.0); a sessão e o segundo fator chegam nas tarefas 6.0 a 8.0. O semáforo e o hash de senha vêm do
 * `SessaoModule`, que os exporta como global: a mesma instância do login.
 */
@Module({})
export class OperacaoModule {
  static com(identidade: ConfiguracaoIdentidade): DynamicModule {
    return {
      module: OperacaoModule,
      controllers: [EuDoOperadorController, ConviteDeOperadorController],
      providers: [
        ...provedoresDaGuardaDeOperador(identidade),
        {
          provide: ConviteDeOperadorService,
          useFactory: (banco: Banco, hash: HashDeSenha, semaforo: SemaforoDeHash) =>
            new ConviteDeOperadorService({ banco, hash, semaforo, emissorDeDesafio: new EmissorDeDesafioDeOperador(identidade.chaveAssinatura) }),
          inject: [BANCO, HashDeSenha, SemaforoDeHash],
        },
        { provide: EuDoOperadorService, useFactory: (banco: Banco) => new EuDoOperadorService(new OperadorRepository(banco)), inject: [BANCO] },
      ],
    }
  }
}
