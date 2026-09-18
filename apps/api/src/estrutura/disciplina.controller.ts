import { ErroDeDominio, Permite } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoCriarDisciplina, type RespostaDisciplina, type RespostaListaDeDisciplinas } from '@educa/shared'
import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { DisciplinaService } from './disciplina.service.js'
import { lerConsultaPaginada } from './entrada.js'

/** `/v1/disciplinas`: a coordenação cria e lista as disciplinas da escola da sessão. */
@Controller('v1/disciplinas')
export class DisciplinaController {
  constructor(private readonly disciplinas: DisciplinaService) {}

  @Post()
  @Permite('disciplina', 'criar')
  criar(@Body() corpo: unknown): Promise<RespostaDisciplina> {
    const pedido = esquemaPedidoCriarDisciplina.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.disciplinas.criar(pedido.data)
  }

  @Get()
  @Permite('disciplina', 'ler')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeDisciplinas> {
    return this.disciplinas.listar(lerConsultaPaginada(consulta))
  }
}
