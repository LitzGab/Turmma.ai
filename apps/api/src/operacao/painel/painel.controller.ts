import { IdPipe, ZodValidationPipe } from '@educa/nucleo'
import {
  esquemaConsultaDoPainel,
  esquemaPedidoConviteDaCoordenacao,
  esquemaPedidoCriarEscola,
  esquemaPedidoCriarRede,
  esquemaPedidoSemCorpoDeOperador,
  type ConsultaDoPainel,
  type PedidoConviteDaCoordenacao,
  type PedidoCriarEscola,
  type PedidoCriarRede,
  type PedidoSemCorpoDeOperador,
  type RespostaConviteDaCoordenacao,
  type RespostaCriadoNoPainel,
  type RespostaEscolasDoPainel,
  type RespostaRedesDoPainel,
  type RespostaUsoDoPainel,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Inject, Param, Post, Query } from '@nestjs/common'
import { RotaDeOperacao } from '../marcadores.js'
import { PainelService } from './painel.service.js'

/** Refazer e revogar não têm campo: sem corpo (o Express 5 deixa `req.body` indefinido), ou `{}`. Qualquer campo é `ENTRADA_INVALIDA`. */
const esquemaSemCorpo = esquemaPedidoSemCorpoDeOperador.default({})

/**
 * O painel da operação na API (Tech Spec da A0b, seção 4), as oito rotas: `GET /v1/operacao/redes`, `POST /v1/operacao/redes`,
 * `GET /v1/operacao/escolas`, `POST /v1/operacao/escolas`, `GET /v1/operacao/uso`,
 * `POST /v1/operacao/escolas/:id/convite-coordenacao`, `POST /v1/operacao/convites/:id/refazer` e
 * `POST /v1/operacao/convites/:id/revogar`.
 * Todas `@RotaDeOperacao` (a `GuardaDeOperador` e o limite `rl:op:{sub}`), com `no-store`, e o corpo pelo contrato estrito
 * de `packages/shared`: campo a mais, como `autor`, é `ENTRADA_INVALIDA` antes de qualquer leitura ou escrita; na lista e
 * no uso, a consulta (`pagina`, `ordem`) também é estrita. O `:id` fora do formato de UUID responde como o inexistente
 * (`NAO_ENCONTRADO`). A entrada passa pelo `ZodValidationPipe` e pelo `IdPipe` no parâmetro (16.0).
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

  @Get('escolas')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  escolas(@Query(new ZodValidationPipe(esquemaConsultaDoPainel)) consulta: ConsultaDoPainel): Promise<RespostaEscolasDoPainel> {
    return this.painel.escolas(consulta)
  }

  @Get('uso')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  uso(@Query(new ZodValidationPipe(esquemaConsultaDoPainel)) consulta: ConsultaDoPainel): Promise<RespostaUsoDoPainel> {
    return this.painel.uso(consulta)
  }

  @Post('redes')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  criarRede(@Body(new ZodValidationPipe(esquemaPedidoCriarRede)) pedido: PedidoCriarRede): Promise<RespostaCriadoNoPainel> {
    return this.painel.criarRede(pedido)
  }

  @Post('escolas')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  criarEscola(@Body(new ZodValidationPipe(esquemaPedidoCriarEscola)) pedido: PedidoCriarEscola): Promise<RespostaCriadoNoPainel> {
    return this.painel.criarEscola(pedido)
  }

  @Post('escolas/:id/convite-coordenacao')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  gerarConvite(
    @Param('id', IdPipe) escolaId: string,
    @Body(new ZodValidationPipe(esquemaPedidoConviteDaCoordenacao)) pedido: PedidoConviteDaCoordenacao,
  ): Promise<RespostaConviteDaCoordenacao> {
    return this.painel.gerarConvite(escolaId, pedido)
  }

  @Post('convites/:id/refazer')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  refazerConvite(@Param('id', IdPipe) conviteId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador): Promise<RespostaConviteDaCoordenacao> {
    return this.painel.refazerConvite(conviteId)
  }

  @Post('convites/:id/revogar')
  @RotaDeOperacao()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  revogarConvite(@Param('id', IdPipe) conviteId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador): Promise<void> {
    return this.painel.revogarConvite(conviteId)
  }
}
