import { Permite } from '@educa/nucleo'
import { esquemaConsultaAnalistaNominal, esquemaPedidoGerarResumoDoAnalista, type RespostaAnalistaNominal, type RespostaExecucaoAceita, type RespostaResumoDoAnalista } from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { lerEntrada } from '../estrutura/entrada.js'
import { AnalistaService } from './analista.service.js'

/**
 * `/v1/analista` (MVP, A5): o Analista de desempenho escolar, **só da coordenação**. O resumo é agregado por série e
 * disciplina; o nominal exige a turma e a finalidade (`ENTRADA_INVALIDA` sem uma delas, antes de procurar a turma) e
 * grava auditoria a cada leitura. As respostas não ficam em cache: o nominal nomeia professores.
 */
@Controller('v1/analista')
export class AnalistaController {
  constructor(private readonly analista: AnalistaService) {}

  @Get('resumo')
  @Permite('analista', 'ler_resumo')
  @Header('Cache-Control', 'no-store')
  resumo(): Promise<RespostaResumoDoAnalista> {
    return this.analista.resumo()
  }

  @Post('gerar')
  @Permite('analista', 'gerar')
  @HttpCode(HttpStatus.ACCEPTED)
  gerar(@Body() corpo: unknown): Promise<RespostaExecucaoAceita> {
    return this.analista.gerar(lerEntrada(esquemaPedidoGerarResumoDoAnalista, corpo))
  }

  @Get('nominal')
  @Permite('analista', 'ler_nominal')
  @Header('Cache-Control', 'no-store')
  nominal(@Query() consulta: unknown): Promise<RespostaAnalistaNominal> {
    return this.analista.nominal(lerEntrada(esquemaConsultaAnalistaNominal, consulta))
  }
}
