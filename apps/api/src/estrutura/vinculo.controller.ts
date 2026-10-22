import { IdPipe, Permite, ZodValidationPipe } from '@educa/nucleo'
import {
  esquemaConsultaPaginada,
  esquemaConsultaVinculos,
  esquemaPedidoContestarVinculo,
  esquemaPedidoCriarVinculo,
  esquemaPedidoEncerrarVinculo,
  type ConsultaPaginada,
  type ConsultaVinculos,
  type PedidoContestarVinculo,
  type PedidoCriarVinculo,
  type PedidoEncerrarVinculo,
  type RespostaListaDeVinculos,
  type RespostaMeusVinculos,
  type RespostaVinculo,
  type RespostaVinculoDaCoordenacao,
} from '@educa/shared'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { VinculoService } from './vinculo.service.js'

/**
 * `/v1/vinculos`: a coordenação cria, lista e encerra; o professor dono confirma ou contesta o próprio (RF3, RF4). Id
 * fora do formato, de outra escola, de outro professor ou inexistente: o mesmo `NAO_ENCONTRADO`.
 */
@Controller('v1/vinculos')
export class VinculoController {
  constructor(private readonly vinculos: VinculoService) {}

  @Post()
  @Permite('vinculo', 'criar')
  criar(@Body(new ZodValidationPipe(esquemaPedidoCriarVinculo)) pedido: PedidoCriarVinculo): Promise<RespostaVinculoDaCoordenacao> {
    return this.vinculos.criar(pedido)
  }

  @Get()
  @Permite('vinculo', 'ler')
  listar(@Query(new ZodValidationPipe(esquemaConsultaVinculos)) consulta: ConsultaVinculos): Promise<RespostaListaDeVinculos> {
    return this.vinculos.listar(consulta)
  }

  @Post(':id/encerrar')
  @Permite('vinculo', 'encerrar')
  @HttpCode(HttpStatus.OK)
  encerrar(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoEncerrarVinculo)) pedido: PedidoEncerrarVinculo): Promise<RespostaVinculoDaCoordenacao> {
    return this.vinculos.encerrar(id, pedido)
  }

  @Post(':id/confirmar')
  @Permite('vinculo', 'confirmar')
  @HttpCode(HttpStatus.OK)
  confirmar(@Param('id', IdPipe) id: string): Promise<RespostaVinculo> {
    return this.vinculos.confirmar(id)
  }

  @Post(':id/contestar')
  @Permite('vinculo', 'contestar')
  @HttpCode(HttpStatus.OK)
  contestar(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoContestarVinculo)) pedido: PedidoContestarVinculo): Promise<RespostaVinculo> {
    return this.vinculos.contestar(id, pedido)
  }
}

/** `GET /v1/meus-vinculos`: os vínculos do professor da sessão no ano em curso, para confirmar ou contestar. */
@Controller('v1/meus-vinculos')
export class MeusVinculosController {
  constructor(private readonly vinculos: VinculoService) {}

  @Get()
  @Permite('vinculo', 'ler_proprios')
  listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaMeusVinculos> {
    return this.vinculos.meus(consulta)
  }
}
