import { ErroDeDominio, Permite } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoProvedoresDaEscola, type RespostaProvedoresDaEscola } from '@educa/shared'
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
  alterar(@Body() corpo: unknown): Promise<RespostaProvedoresDaEscola> {
    const pedido = esquemaPedidoProvedoresDaEscola.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.provedores.alterar(pedido.data)
  }
}
