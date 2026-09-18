import { ErroDeDominio, Permite } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoCriarSerie, type RespostaListaDeSeries, type RespostaSerie } from '@educa/shared'
import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { lerConsultaPaginada } from './entrada.js'
import { SerieService } from './serie.service.js'

/** `/v1/series`: a coordenação cria e lista as séries da escola da sessão. */
@Controller('v1/series')
export class SerieController {
  constructor(private readonly series: SerieService) {}

  @Post()
  @Permite('serie', 'criar')
  criar(@Body() corpo: unknown): Promise<RespostaSerie> {
    const pedido = esquemaPedidoCriarSerie.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.series.criar(pedido.data)
  }

  @Get()
  @Permite('serie', 'ler')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeSeries> {
    return this.series.listar(lerConsultaPaginada(consulta))
  }
}
