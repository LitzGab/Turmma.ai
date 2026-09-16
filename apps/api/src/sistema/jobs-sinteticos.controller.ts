import { ErroDeDominio, Permite } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaPedidoJobSintetico,
  type RespostaEstadoDeJob,
  type RespostaJobAceito,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { z } from 'zod'
import { JobsSinteticosService } from './jobs-sinteticos.service.js'

const esquemaId = z.uuid()

/**
 * Cria job sintético, para teste e cenário de carga. Só é registrado com `ROTAS_SINTETICAS=true`
 * (sistema.module.ts) e exige token, como toda rota sem `@RotaAnonima()`.
 */
@Controller('v1/sistema/jobs-sinteticos')
export class JobsSinteticosController {
  constructor(private readonly jobs: JobsSinteticosService) {}

  @Post()
  @Permite('sistema_job_sintetico', 'criar')
  @HttpCode(HttpStatus.ACCEPTED)
  @Header('Cache-Control', 'no-store')
  criar(@Body() corpo: unknown): Promise<RespostaJobAceito> {
    const pedido = esquemaPedidoJobSintetico.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.jobs.enfileirar(pedido.data)
  }
}

/** Consulta o estado de um job da escola do token, lido de `job_registro`. */
@Controller('v1/sistema/jobs-sinteticos')
export class JobsSinteticosConsultaController {
  constructor(private readonly jobs: JobsSinteticosService) {}

  @Get(':id')
  @Permite('sistema_job_sintetico', 'ler')
  @Header('Cache-Control', 'no-store')
  consultar(@Param('id') id: string): Promise<RespostaEstadoDeJob> {
    // Id fora do formato responde como id inexistente: nem o formato confirma nada.
    if (!esquemaId.safeParse(id).success) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return this.jobs.consultar(id.toLowerCase())
  }
}
