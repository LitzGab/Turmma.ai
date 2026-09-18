import { ErroDeDominio, Permite } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoCriarAnoLetivo, type RespostaAnoLetivo, type RespostaListaDeAnosLetivos } from '@educa/shared'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { AnoLetivoService } from './ano-letivo.service.js'
import { idDoCaminho, lerConsultaPaginada } from './entrada.js'

/** `/v1/anos-letivos`: a coordenação cria, lista, abre e encerra o ano letivo da escola da sessão. */
@Controller('v1/anos-letivos')
export class AnoLetivoController {
  constructor(private readonly anos: AnoLetivoService) {}

  @Post()
  @Permite('ano_letivo', 'criar')
  criar(@Body() corpo: unknown): Promise<RespostaAnoLetivo> {
    const pedido = esquemaPedidoCriarAnoLetivo.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.anos.criar(pedido.data)
  }

  @Get()
  @Permite('ano_letivo', 'ler')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeAnosLetivos> {
    return this.anos.listar(lerConsultaPaginada(consulta))
  }

  @Post(':id/abrir')
  @Permite('ano_letivo', 'abrir')
  @HttpCode(HttpStatus.OK)
  abrir(@Param('id') id: string): Promise<RespostaAnoLetivo> {
    return this.anos.abrir(idDoCaminho(id))
  }

  @Post(':id/encerrar')
  @Permite('ano_letivo', 'encerrar')
  @HttpCode(HttpStatus.OK)
  encerrar(@Param('id') id: string): Promise<RespostaAnoLetivo> {
    return this.anos.encerrar(idDoCaminho(id))
  }
}
