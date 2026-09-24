import { ErroDeDominio } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaPedidoConviteDaCoordenacao,
  esquemaPedidoCriarEscola,
  esquemaPedidoCriarRede,
  esquemaPedidoSemCorpoDeOperador,
  type RespostaConviteDaCoordenacao,
  type RespostaCriadoNoPainel,
  type RespostaRedesDoPainel,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Inject, Param, Post } from '@nestjs/common'
import { idDoCaminho } from '../estrutura/entrada.js'
import { RotaDeOperacao } from './marcadores.js'
import { PainelService } from './painel.service.js'

/**
 * O painel da operação na API (Tech Spec da A0b, seção 4): `GET /v1/operacao/redes`, `POST /v1/operacao/redes`,
 * `POST /v1/operacao/escolas`, `POST /v1/operacao/escolas/:id/convite-coordenacao` e `POST /v1/operacao/convites/:id/revogar`.
 * Todas `@RotaDeOperacao` (a `GuardaDeOperador` e o limite `rl:op:{sub}`), com `no-store`, e o corpo pelo contrato estrito
 * de `packages/shared`: campo a mais, como `autor`, é `ENTRADA_INVALIDA` antes de qualquer leitura ou escrita. O `:id` fora
 * do formato de UUID responde como o inexistente (`NAO_ENCONTRADO`).
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

  @Post('escolas/:id/convite-coordenacao')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  gerarConvite(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaConviteDaCoordenacao> {
    const pedido = esquemaPedidoConviteDaCoordenacao.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.painel.gerarConvite(idDoCaminho(id), pedido.data)
  }

  @Post('convites/:id/revogar')
  @RotaDeOperacao()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  revogarConvite(@Param('id') id: string, @Body() corpo: unknown): Promise<void> {
    if (!esquemaPedidoSemCorpoDeOperador.safeParse(corpo ?? {}).success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.painel.revogarConvite(idDoCaminho(id))
  }
}
