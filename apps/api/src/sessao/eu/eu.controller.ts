import { Permite } from '@educa/nucleo'
import type { RespostaEu } from '@educa/shared'
import { Controller, Get, Header } from '@nestjs/common'
import { EuService } from './eu.service.js'

/** `GET /v1/eu`: quem está na sessão, com o nome e a escola, e os minutos sem uso até ela vencer. */
@Controller('v1/eu')
export class EuController {
  constructor(private readonly eu: EuService) {}

  @Get()
  @Permite('eu', 'ler')
  @Header('Cache-Control', 'no-store')
  obter(): Promise<RespostaEu> {
    return this.eu.obter()
  }
}
