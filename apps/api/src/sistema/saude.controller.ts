import type { RespostaSaude } from '@educa/shared'
import { Controller, Get, Header, HttpException, HttpStatus } from '@nestjs/common'
import { SaudeService } from './saude.service.js'

@Controller('saude')
export class SaudeController {
  constructor(private readonly saude: SaudeService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async obter(): Promise<RespostaSaude> {
    const resposta = await this.saude.verificar()
    if (!resposta.ok) {
      throw new HttpException(resposta, HttpStatus.SERVICE_UNAVAILABLE)
    }
    return resposta
  }
}
