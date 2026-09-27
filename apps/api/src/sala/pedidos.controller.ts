import { Permite } from '@educa/nucleo'
import { esquemaConsultaPedidosDaTurma, esquemaPedidoDecidirReivindicacoes, type RespostaDecisao, type RespostaPedidosDaTurma } from '@educa/shared'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from '../estrutura/entrada.js'
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
  pedidos(@Param('id') id: string, @Query() consulta: unknown): Promise<RespostaPedidosDaTurma> {
    const turmaId = idDoCaminho(id)
    return this.decisoes.pedidos(turmaId, lerEntrada(esquemaConsultaPedidosDaTurma, consulta))
  }

  @Post('reivindicacoes/decidir')
  @Permite('reivindicacao', 'decidir')
  @HttpCode(HttpStatus.OK)
  decidir(@Body() corpo: unknown): Promise<RespostaDecisao> {
    return this.decisoes.decidir(lerEntrada(esquemaPedidoDecidirReivindicacoes, corpo))
  }
}
