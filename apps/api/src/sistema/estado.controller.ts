import { RotaAnonima } from '@educa/nucleo'
import type { RespostaEstado } from '@educa/shared'
import { Controller, Get, Header } from '@nestjs/common'
import { EstadoService } from './estado.service.js'

// A casca busca o estado antes de existir login: rota anônima, limitada por IP (regra 80, item 1).
@RotaAnonima()
@Controller('v1/sistema/estado')
export class EstadoController {
  constructor(private readonly estado: EstadoService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  obter(): Promise<RespostaEstado> {
    return this.estado.obter()
  }
}
