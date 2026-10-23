import { IdPipe, Permite, ZodValidationPipe } from '@educa/nucleo'
import {
  esquemaConsultaPedidosDaTurma,
  esquemaPedidoDecidirReivindicacoes,
  type ConsultaPedidosDaTurma,
  type PedidoDecidirReivindicacoes,
  type RespostaDecisao,
  type RespostaPedidosDaTurma,
} from '@educa/shared'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { DecisaoService } from './decisao.service.js'

/**
 * Os pedidos de reivindicação (A1, tarefa 8.0, RF12): o professor com vínculo confirmado na turma e a coordenação leem os
 * pendentes da turma e decidem os selecionados. A consulta e o corpo passam pelo contrato estrito de `packages/shared`
 * (campo a mais, como `escolaId`, é `ENTRADA_INVALIDA`); o id do caminho fora do formato de UUID responde como o
 * inexistente.
 */
@Controller('v1')
export class PedidosController {
  constructor(private readonly decisoes: DecisaoService) {}

  @Get('turmas/:id/reivindicacoes')
  @Permite('reivindicacao', 'ler')
  pedidos(@Param('id', IdPipe) turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaPedidosDaTurma)) consulta: ConsultaPedidosDaTurma): Promise<RespostaPedidosDaTurma> {
    return this.decisoes.pedidos(turmaId, consulta)
  }

  @Post('reivindicacoes/decidir')
  @Permite('reivindicacao', 'decidir')
  @HttpCode(HttpStatus.OK)
  decidir(@Body(new ZodValidationPipe(esquemaPedidoDecidirReivindicacoes)) pedido: PedidoDecidirReivindicacoes): Promise<RespostaDecisao> {
    return this.decisoes.decidir(pedido)
  }
}
