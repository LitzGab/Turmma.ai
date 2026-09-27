import type { Banco } from '@educa/nucleo'
import { Module, type DynamicModule } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { AcessoDaSala } from '../sessao/acesso-da-sala.js'
import { AcessoDaTurmaController } from './acesso-da-turma.controller.js'
import { AcessoDaTurmaService } from './acesso-da-turma.service.js'
import { sortearCodigoDaTurma, type SorteioDoCodigo } from './codigo-da-sala.js'
import type { ConfiguracaoSala } from './configuracao-da-sala.js'
import { SalasController } from './salas.controller.js'
import { SalasService } from './salas.service.js'

export interface OpcoesDaSala {
  readonly config: ConfiguracaoSala
  /** Só o teste da colisão do código (C6) troca o sorteio; o `main.ts` monta com o de verdade. */
  readonly sortearCodigo?: SorteioDoCodigo
}

/**
 * A entrada do aluno pela turma (A1): o acesso da turma que o professor gera e revoga (4.0) e a página pública da sala,
 * que o aluno abre pelo link ou pelo código (5.0). O `AcessoDaSala` vem do `SessaoModule`, global.
 */
@Module({})
export class SalaModule {
  static com({ config, sortearCodigo = sortearCodigoDaTurma }: OpcoesDaSala): DynamicModule {
    return {
      module: SalaModule,
      controllers: [AcessoDaTurmaController, SalasController],
      providers: [
        { provide: AcessoDaTurmaService, useFactory: (banco: Banco) => new AcessoDaTurmaService(banco, config.chaveCodigo, sortearCodigo), inject: [BANCO] },
        { provide: SalasService, useFactory: (banco: Banco, acessoDaSala: AcessoDaSala) => new SalasService(banco, acessoDaSala, config.chaveCodigo), inject: [BANCO, AcessoDaSala] },
      ],
    }
  }
}
