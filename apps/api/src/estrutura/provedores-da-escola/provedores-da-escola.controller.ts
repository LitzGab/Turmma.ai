import { Permite, ZodValidationPipe } from '@educa/nucleo'
import { esquemaPedidoProvedoresDaEscola, type PedidoProvedoresDaEscola, type RespostaProvedoresDaEscola } from '@educa/shared'
import { Body, Controller, Put } from '@nestjs/common'
import { ProvedoresDaEscolaService } from './provedores-da-escola.service.js'

/**
 * `PUT /v1/escola/provedores`: a coordenação define os domínios Google e tenants Microsoft que entram pela conta da
 * escola. Só a coordenação (`escola_configuracao.alterar`); a escola vem da sessão.
 */
@Controller('v1/escola')
export class ProvedoresDaEscolaController {
  constructor(private readonly provedores: ProvedoresDaEscolaService) {}

  @Put('provedores')
  @Permite('escola_configuracao', 'alterar')
  alterar(@Body(new ZodValidationPipe(esquemaPedidoProvedoresDaEscola)) pedido: PedidoProvedoresDaEscola): Promise<RespostaProvedoresDaEscola> {
    return this.provedores.alterar(pedido)
  }
}
