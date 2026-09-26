import { ErroDeDominio, Permite } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoCriarDisciplina, esquemaPedidoRenomearDisciplina, type RespostaDisciplina, type RespostaListaDeDisciplinas } from '@educa/shared'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { DisciplinaService } from './disciplina.service.js'
import { idDoCaminho, lerConsultaPaginada, lerEntrada } from './entrada.js'

/**
 * `/v1/disciplinas`: a coordenação cria, lista, renomeia e exclui as disciplinas da escola da sessão. Id fora do
 * formato, de outra escola ou inexistente: o mesmo `NAO_ENCONTRADO`.
 */
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

  @Patch(':id')
  @Permite('disciplina', 'renomear')
  renomear(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaDisciplina> {
    const alvo = idDoCaminho(id)
    return this.disciplinas.renomear(alvo, lerEntrada(esquemaPedidoRenomearDisciplina, corpo))
  }

  @Delete(':id')
  @Permite('disciplina', 'excluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  excluir(@Param('id') id: string): Promise<void> {
    return this.disciplinas.excluir(idDoCaminho(id))
  }

  @Get()
  @Permite('disciplina', 'ler')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeDisciplinas> {
    return this.disciplinas.listar(lerConsultaPaginada(consulta))
  }
}
