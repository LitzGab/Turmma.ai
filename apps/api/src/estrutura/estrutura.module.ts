import type { Banco } from '@educa/nucleo'
import { Module } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { AnoLetivoController } from './ano-letivo.controller.js'
import { AnoLetivoService } from './ano-letivo.service.js'
import { DisciplinaController } from './disciplina.controller.js'
import { DisciplinaService } from './disciplina.service.js'
import { EscolaSessaoController } from './escola-sessao.controller.js'
import { EscolaSessaoService } from './escola-sessao.service.js'
import { SerieController } from './serie.controller.js'
import { SerieService } from './serie.service.js'
import { TurmaController } from './turma.controller.js'
import { TurmaService } from './turma.service.js'
import { MeusVinculosController, VinculoController } from './vinculo.controller.js'
import { VinculoService } from './vinculo.service.js'

/**
 * A estrutura da escola que a coordenação configura pela API: a inatividade da sessão (5.0), e o ano letivo, as
 * séries, as disciplinas e as turmas (8.0), e o vínculo, com a turma e os alunos que ele abre (9.0).
 */
@Module({
  controllers: [EscolaSessaoController, AnoLetivoController, SerieController, DisciplinaController, TurmaController, VinculoController, MeusVinculosController],
  providers: [
    { provide: EscolaSessaoService, useFactory: (banco: Banco) => new EscolaSessaoService(banco), inject: [BANCO] },
    { provide: AnoLetivoService, useFactory: (banco: Banco) => new AnoLetivoService(banco), inject: [BANCO] },
    { provide: SerieService, useFactory: (banco: Banco) => new SerieService(banco), inject: [BANCO] },
    { provide: DisciplinaService, useFactory: (banco: Banco) => new DisciplinaService(banco), inject: [BANCO] },
    { provide: TurmaService, useFactory: (banco: Banco) => new TurmaService(banco), inject: [BANCO] },
    { provide: VinculoService, useFactory: (banco: Banco) => new VinculoService(banco), inject: [BANCO] },
  ],
})
export class EstruturaModule {}
