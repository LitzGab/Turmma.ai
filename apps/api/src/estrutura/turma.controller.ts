import { IdPipe, Permite, ZodValidationPipe } from '@educa/nucleo'
import {
  esquemaConsultaAlunosDaTurma,
  esquemaConsultaPaginada,
  esquemaConsultaTurma,
  esquemaPedidoCriarTurma,
  esquemaPedidoRenomearTurma,
  type ConsultaAlunosDaTurma,
  type ConsultaPaginada,
  type ConsultaTurma,
  type PedidoCriarTurma,
  type PedidoRenomearTurma,
  type RespostaAlunosDaTurma,
  type RespostaListaDeTurmas,
  type RespostaTurma,
  type RespostaTurmaAberta,
} from '@educa/shared'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { TurmaService } from './turma.service.js'

/**
 * `/v1/turmas`: a coordenação cria, lista, renomeia e exclui as turmas do ano letivo em curso da escola da sessão (A1,
 * 1.0); a coordenação e o professor com vínculo confirmado abrem uma turma e a lista de alunos dela, do ano em curso ou,
 * com `?anoLetivoId`, de um ano encerrado da escola, só em leitura (10.0, RF16).
 */
@Controller('v1/turmas')
export class TurmaController {
  constructor(private readonly turmas: TurmaService) {}

  @Post()
  @Permite('turma', 'criar')
  criar(@Body(new ZodValidationPipe(esquemaPedidoCriarTurma)) pedido: PedidoCriarTurma): Promise<RespostaTurma> {
    return this.turmas.criar(pedido)
  }

  @Get()
  @Permite('turma', 'listar')
  listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaListaDeTurmas> {
    return this.turmas.listar(consulta)
  }

  @Get(':id')
  @Permite('turma', 'ler')
  abrir(@Param('id', IdPipe) id: string, @Query(new ZodValidationPipe(esquemaConsultaTurma)) consulta: ConsultaTurma): Promise<RespostaTurmaAberta> {
    return this.turmas.abrir(id, consulta)
  }

  @Patch(':id')
  @Permite('turma', 'renomear')
  renomear(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearTurma)) pedido: PedidoRenomearTurma): Promise<RespostaTurma> {
    return this.turmas.renomear(id, pedido)
  }

  @Delete(':id')
  @Permite('turma', 'excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  excluir(@Param('id', IdPipe) id: string): Promise<void> {
    return this.turmas.excluir(id)
  }

  @Get(':id/alunos')
  @Permite('aluno_da_turma', 'ler')
  alunos(@Param('id', IdPipe) id: string, @Query(new ZodValidationPipe(esquemaConsultaAlunosDaTurma)) consulta: ConsultaAlunosDaTurma): Promise<RespostaAlunosDaTurma> {
    return this.turmas.alunos(id, consulta)
  }
}
