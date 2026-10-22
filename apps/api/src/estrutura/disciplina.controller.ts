import { IdPipe, Permite, ZodValidationPipe } from '@educa/nucleo'
import {
  esquemaConsultaPaginada,
  esquemaPedidoCriarDisciplina,
  esquemaPedidoRenomearDisciplina,
  type ConsultaPaginada,
  type PedidoCriarDisciplina,
  type PedidoRenomearDisciplina,
  type RespostaDisciplina,
  type RespostaListaDeDisciplinas,
} from '@educa/shared'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { DisciplinaService } from './disciplina.service.js'

/**
 * `/v1/disciplinas`: a coordenação cria, lista, renomeia e exclui as disciplinas da escola da sessão. Id fora do
 * formato, de outra escola ou inexistente: o mesmo `NAO_ENCONTRADO`.
 */
@Controller('v1/disciplinas')
export class DisciplinaController {
  constructor(private readonly disciplinas: DisciplinaService) {}

  @Post()
  @Permite('disciplina', 'criar')
  criar(@Body(new ZodValidationPipe(esquemaPedidoCriarDisciplina)) pedido: PedidoCriarDisciplina): Promise<RespostaDisciplina> {
    return this.disciplinas.criar(pedido)
  }

  @Patch(':id')
  @Permite('disciplina', 'renomear')
  renomear(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearDisciplina)) pedido: PedidoRenomearDisciplina): Promise<RespostaDisciplina> {
    return this.disciplinas.renomear(id, pedido)
  }

  @Delete(':id')
  @Permite('disciplina', 'excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  excluir(@Param('id', IdPipe) id: string): Promise<void> {
    return this.disciplinas.excluir(id)
  }

  @Get()
  @Permite('disciplina', 'ler')
  listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaListaDeDisciplinas> {
    return this.disciplinas.listar(consulta)
  }
}
