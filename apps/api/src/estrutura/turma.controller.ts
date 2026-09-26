import { ErroDeDominio, Permite } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaConsultaAlunosDaTurma,
  esquemaConsultaTurma,
  esquemaPedidoCriarTurma,
  esquemaPedidoRenomearTurma,
  type RespostaAlunosDaTurma,
  type RespostaListaDeTurmas,
  type RespostaTurma,
  type RespostaTurmaAberta,
} from '@educa/shared'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { idDoCaminho, lerConsultaPaginada, lerEntrada } from './entrada.js'
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
  criar(@Body() corpo: unknown): Promise<RespostaTurma> {
    const pedido = esquemaPedidoCriarTurma.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.turmas.criar(pedido.data)
  }

  @Get()
  @Permite('turma', 'listar')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeTurmas> {
    return this.turmas.listar(lerConsultaPaginada(consulta))
  }

  @Get(':id')
  @Permite('turma', 'ler')
  abrir(@Param('id') id: string, @Query() consulta: unknown): Promise<RespostaTurmaAberta> {
    const alvo = idDoCaminho(id)
    return this.turmas.abrir(alvo, lerEntrada(esquemaConsultaTurma, consulta))
  }

  @Patch(':id')
  @Permite('turma', 'renomear')
  renomear(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaTurma> {
    const alvo = idDoCaminho(id)
    return this.turmas.renomear(alvo, lerEntrada(esquemaPedidoRenomearTurma, corpo))
  }

  @Delete(':id')
  @Permite('turma', 'excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  excluir(@Param('id') id: string): Promise<void> {
    return this.turmas.excluir(idDoCaminho(id))
  }

  @Get(':id/alunos')
  @Permite('aluno_da_turma', 'ler')
  alunos(@Param('id') id: string, @Query() consulta: unknown): Promise<RespostaAlunosDaTurma> {
    const alvo = idDoCaminho(id)
    return this.turmas.alunos(alvo, lerEntrada(esquemaConsultaAlunosDaTurma, consulta))
  }
}
