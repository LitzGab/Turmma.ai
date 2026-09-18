import { ErroDeDominio, Permite } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaConsultaAlunosDaTurma,
  esquemaPedidoCriarTurma,
  type RespostaAlunosDaTurma,
  type RespostaListaDeTurmas,
  type RespostaTurma,
  type RespostaTurmaAberta,
} from '@educa/shared'
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { idDoCaminho, lerConsultaPaginada, lerEntrada } from './entrada.js'
import { TurmaService } from './turma.service.js'

/**
 * `/v1/turmas`: a coordenação cria e lista as turmas do ano letivo em curso da escola da sessão; a coordenação e o
 * professor com vínculo confirmado abrem uma turma e a lista de alunos dela.
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
  abrir(@Param('id') id: string): Promise<RespostaTurmaAberta> {
    return this.turmas.abrir(idDoCaminho(id))
  }

  @Get(':id/alunos')
  @Permite('aluno_da_turma', 'ler')
  alunos(@Param('id') id: string, @Query() consulta: unknown): Promise<RespostaAlunosDaTurma> {
    const alvo = idDoCaminho(id)
    return this.turmas.alunos(alvo, lerEntrada(esquemaConsultaAlunosDaTurma, consulta))
  }
}
