import { ErroDeDominio, Permite } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoCriarTurma, type RespostaListaDeTurmas, type RespostaTurma } from '@educa/shared'
import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { lerConsultaPaginada } from './entrada.js'
import { TurmaService } from './turma.service.js'

/** `/v1/turmas`: a coordenação cria e lista as turmas do ano letivo em curso da escola da sessão. */
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
}
