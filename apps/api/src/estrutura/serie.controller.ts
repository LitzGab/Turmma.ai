import { Permite, ZodValidationPipe } from '@educa/nucleo'
import { esquemaConsultaPaginada, esquemaPedidoCriarSerie, type ConsultaPaginada, type PedidoCriarSerie, type RespostaListaDeSeries, type RespostaSerie } from '@educa/shared'
import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { SerieService } from './serie.service.js'

/** `/v1/series`: a coordenação cria e lista as séries da escola da sessão. */
@Controller('v1/series')
export class SerieController {
  constructor(private readonly series: SerieService) {}

  @Post()
  @Permite('serie', 'criar')
  criar(@Body(new ZodValidationPipe(esquemaPedidoCriarSerie)) pedido: PedidoCriarSerie): Promise<RespostaSerie> {
    return this.series.criar(pedido)
  }

  @Get()
  @Permite('serie', 'ler')
  listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaListaDeSeries> {
    return this.series.listar(consulta)
  }
}
