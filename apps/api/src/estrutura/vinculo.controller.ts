import { Permite } from '@educa/nucleo'
import {
  esquemaConsultaPaginada,
  esquemaConsultaVinculos,
  esquemaPedidoContestarVinculo,
  esquemaPedidoCriarVinculo,
  esquemaPedidoEncerrarVinculo,
  type RespostaListaDeVinculos,
  type RespostaMeusVinculos,
  type RespostaVinculo,
  type RespostaVinculoDaCoordenacao,
} from '@educa/shared'
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from './entrada.js'
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
  criar(@Body() corpo: unknown): Promise<RespostaVinculoDaCoordenacao> {
    return this.vinculos.criar(lerEntrada(esquemaPedidoCriarVinculo, corpo))
  }

  @Get()
  @Permite('vinculo', 'ler')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeVinculos> {
    return this.vinculos.listar(lerEntrada(esquemaConsultaVinculos, consulta))
  }

  @Post(':id/encerrar')
  @Permite('vinculo', 'encerrar')
  @HttpCode(HttpStatus.OK)
  encerrar(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaVinculoDaCoordenacao> {
    const alvo = idDoCaminho(id)
    return this.vinculos.encerrar(alvo, lerEntrada(esquemaPedidoEncerrarVinculo, corpo))
  }

  @Post(':id/confirmar')
  @Permite('vinculo', 'confirmar')
  @HttpCode(HttpStatus.OK)
  confirmar(@Param('id') id: string): Promise<RespostaVinculo> {
    return this.vinculos.confirmar(idDoCaminho(id))
  }

  @Post(':id/contestar')
  @Permite('vinculo', 'contestar')
  @HttpCode(HttpStatus.OK)
  contestar(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaVinculo> {
    const alvo = idDoCaminho(id)
    return this.vinculos.contestar(alvo, lerEntrada(esquemaPedidoContestarVinculo, corpo))
  }
}

/** `GET /v1/meus-vinculos`: os vínculos do professor da sessão no ano em curso, para confirmar ou contestar. */
@Controller('v1/meus-vinculos')
export class MeusVinculosController {
  constructor(private readonly vinculos: VinculoService) {}

  @Get()
  @Permite('vinculo', 'ler_proprios')
  listar(@Query() consulta: unknown): Promise<RespostaMeusVinculos> {
    return this.vinculos.meus(lerEntrada(esquemaConsultaPaginada, consulta))
  }
}
