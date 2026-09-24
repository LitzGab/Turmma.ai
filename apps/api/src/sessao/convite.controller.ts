import { ErroDeDominio, RotaAnonima } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaPedidoAceitarConvite,
  esquemaPedidoConsultarConvite,
  esquemaRespostaAceitarConvite,
  esquemaRespostaConsultarConvite,
  type RespostaAceitarConvite,
  type RespostaConsultarConvite,
} from '@educa/shared'
import { Body, Controller, Header, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ConviteService } from './convite.service.js'

/**
 * `POST /v1/convites/consultar` e `/aceitar`: o coordenador convidado abre o link. Anônimas, e por isso limitadas pelo
 * IP da rota anônima; o token vem sempre no corpo, nunca na URL (regra 20, item 8), e as respostas saem com
 * `no-store`. Nenhuma rota de escola cria convite: ele nasce só pelo operador, no `ops:convite-coordenador` ou no painel
 * da operação (`@RotaDeOperacao`, A0b) (RF1).
 */
@RotaAnonima()
@Controller('v1/convites')
export class ConviteController {
  constructor(private readonly convites: ConviteService) {}

  @Post('consultar')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async consultar(@Body() corpo: unknown): Promise<RespostaConsultarConvite> {
    const pedido = esquemaPedidoConsultarConvite.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return esquemaRespostaConsultarConvite.parse(await this.convites.consultar(pedido.data.token))
  }

  @Post('aceitar')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async aceitar(@Body() corpo: unknown): Promise<RespostaAceitarConvite> {
    const pedido = esquemaPedidoAceitarConvite.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return esquemaRespostaAceitarConvite.parse(await this.convites.aceitar(pedido.data))
  }
}
