import { IdPipe, Permite, ZodValidationPipe } from '@educa/nucleo'
import {
  esquemaConsultaListaDaTurma,
  esquemaPedidoNomeAvulso,
  esquemaPedidoTextoDaLista,
  type ConsultaListaDaTurma,
  type NomeDaLista,
  type PedidoNomeAvulso,
  type PedidoTextoDaLista,
  type RespostaGravacaoDaLista,
  type RespostaListaDaTurma,
  type RespostaPreviaDaLista,
} from '@educa/shared'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { ListaService } from './lista.service.js'

/**
 * A lista de nomes da turma (A1, tarefa 2.0, RF4 e RF5), só da coordenação, na turma do ano em curso da escola da
 * sessão: a prévia e a gravação do texto, o nome avulso, a retirada do nome livre e a leitura, com finalidade. O corpo e
 * a consulta passam pelo contrato estrito de `packages/shared` (campo a mais, como `escolaId`, é `ENTRADA_INVALIDA`); o
 * id fora do formato de UUID responde como o inexistente.
 */
@Controller('v1')
export class ListaController {
  constructor(private readonly lista: ListaService) {}

  @Post('turmas/:id/lista/previa')
  @Permite('lista_nome', 'previa')
  @HttpCode(HttpStatus.OK)
  previa(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoTextoDaLista)) pedido: PedidoTextoDaLista): Promise<RespostaPreviaDaLista> {
    return this.lista.previa(turmaId, pedido)
  }

  @Post('turmas/:id/lista')
  @Permite('lista_nome', 'gravar')
  gravar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoTextoDaLista)) pedido: PedidoTextoDaLista): Promise<RespostaGravacaoDaLista> {
    return this.lista.gravar(turmaId, pedido)
  }

  @Post('turmas/:id/lista/nome')
  @Permite('lista_nome', 'acrescentar')
  acrescentar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoNomeAvulso)) pedido: PedidoNomeAvulso): Promise<NomeDaLista> {
    return this.lista.acrescentar(turmaId, pedido)
  }

  @Get('turmas/:id/lista')
  @Permite('lista_nome', 'ler')
  ler(@Param('id', IdPipe) turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaListaDaTurma)) consulta: ConsultaListaDaTurma): Promise<RespostaListaDaTurma> {
    return this.lista.ler(turmaId, consulta)
  }

  @Delete('lista-nomes/:id')
  @Permite('lista_nome', 'retirar')
  @HttpCode(HttpStatus.NO_CONTENT)
  retirar(@Param('id', IdPipe) id: string): Promise<void> {
    return this.lista.retirar(id)
  }
}
