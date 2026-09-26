import type { Banco } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { AcessoDaTurmaController } from './acesso-da-turma.controller.js'
import { AcessoDaTurmaService } from './acesso-da-turma.service.js'
import { sortearCodigoDaTurma, type SorteioDoCodigo } from './codigo-da-sala.js'
import type { ConfiguracaoSala } from './configuracao-da-sala.js'

export interface OpcoesDaSala {
  readonly config: ConfiguracaoSala
  /** Só o teste da colisão do código (C6) troca o sorteio; o `main.ts` monta com o de verdade. */
  readonly sortearCodigo?: SorteioDoCodigo
}

/** A entrada do aluno pela turma (A1): nesta tarefa (4.0), o acesso da turma que o professor gera e revoga. */
@Module({})
export class SalaModule {
  static com({ config, sortearCodigo = sortearCodigoDaTurma }: OpcoesDaSala): DynamicModule {
    return {
      module: SalaModule,
      controllers: [AcessoDaTurmaController],
      providers: [{ provide: AcessoDaTurmaService, useFactory: (banco: Banco) => new AcessoDaTurmaService(banco, config.chaveCodigo, sortearCodigo), inject: [BANCO] }],
    }
  }
}
