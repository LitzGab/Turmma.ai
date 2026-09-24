import { ErroDeDominio } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoCriarEscola, esquemaPedidoCriarRede, type RespostaCriadoNoPainel, type RespostaRedesDoPainel } from '@educa/shared'
import { Body, Controller, Get, Header, Inject, Post } from '@nestjs/common'
import { RotaDeOperacao } from './marcadores.js'
import { PainelService } from './painel.service.js'

/**
 * O painel da operação na API (Tech Spec da A0b, seção 4): `GET /v1/operacao/redes`, `POST /v1/operacao/redes` e
 * `POST /v1/operacao/escolas`. Todas `@RotaDeOperacao` (a `GuardaDeOperador` e o limite `rl:op:{sub}`), com `no-store`,
 * e o corpo pelo contrato estrito de `packages/shared`: campo a mais, como `autor`, é `ENTRADA_INVALIDA` antes de
 * qualquer leitura ou escrita.
 */
@Controller('v1/operacao')
export class PainelController {
  constructor(@Inject(PainelService) private readonly painel: PainelService) {}

  @Get('redes')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  redes(): Promise<RespostaRedesDoPainel> {
    return this.painel.redes()
  }

  @Post('redes')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  criarRede(@Body() corpo: unknown): Promise<RespostaCriadoNoPainel> {
    const pedido = esquemaPedidoCriarRede.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.painel.criarRede(pedido.data)
  }

  @Post('escolas')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  criarEscola(@Body() corpo: unknown): Promise<RespostaCriadoNoPainel> {
    const pedido = esquemaPedidoCriarEscola.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.painel.criarEscola(pedido.data)
  }
}
