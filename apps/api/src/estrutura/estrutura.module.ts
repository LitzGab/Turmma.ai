import type { Banco } from '@educa/nucleo'
import { Module } from '@nestjs/common'
import { BANCO } from '../banco.module.js'
import { EscolaSessaoController } from './escola-sessao.controller.js'
import { EscolaSessaoService } from './escola-sessao.service.js'

/**
 * A estrutura da escola que a coordenação configura pela API: por ora, a inatividade da sessão (5.0). Ano letivo,
 * série, disciplina, turma e vínculo entram nas tarefas 8.0 e 9.0.
 */
@Module({
  controllers: [EscolaSessaoController],
  providers: [{ provide: EscolaSessaoService, useFactory: (banco: Banco) => new EscolaSessaoService(banco), inject: [BANCO] }],
})
export class EstruturaModule {}
