import { ErroDeDominio } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaConsultaDoPainel,
  esquemaPedidoConviteDaCoordenacao,
  esquemaPedidoCriarEscola,
  esquemaPedidoCriarRede,
  esquemaPedidoSemCorpoDeOperador,
  type RespostaConviteDaCoordenacao,
  type RespostaCriadoNoPainel,
  type RespostaEscolasDoPainel,
  type RespostaRedesDoPainel,
  type RespostaUsoDoPainel,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Inject, Param, Post, Query } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from '../estrutura/entrada.js'
import { RotaDeOperacao } from './marcadores.js'
import { PainelService } from './painel.service.js'

/**
 * O painel da operação na API (Tech Spec da A0b, seção 4), as oito rotas: `GET /v1/operacao/redes`, `POST /v1/operacao/redes`,
 * `GET /v1/operacao/escolas`, `POST /v1/operacao/escolas`, `GET /v1/operacao/uso`,
 * `POST /v1/operacao/escolas/:id/convite-coordenacao`, `POST /v1/operacao/convites/:id/refazer` e
 * `POST /v1/operacao/convites/:id/revogar`.
 * Todas `@RotaDeOperacao` (a `GuardaDeOperador` e o limite `rl:op:{sub}`), com `no-store`, e o corpo pelo contrato estrito
 * de `packages/shared`: campo a mais, como `autor`, é `ENTRADA_INVALIDA` antes de qualquer leitura ou escrita; na lista e
 * no uso, a consulta (`pagina`, `ordem`) também é estrita. O `:id` fora do formato de UUID responde como o inexistente
 * (`NAO_ENCONTRADO`).
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
  escolas(@Query() consulta: unknown): Promise<RespostaEscolasDoPainel> {
    return this.painel.escolas(lerEntrada(esquemaConsultaDoPainel, consulta))
  }

  @Get('uso')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  uso(@Query() consulta: unknown): Promise<RespostaUsoDoPainel> {
    return this.painel.uso(lerEntrada(esquemaConsultaDoPainel, consulta))
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

  @Post('convites/:id/refazer')
  @RotaDeOperacao()
  @Header('Cache-Control', 'no-store')
  refazerConvite(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaConviteDaCoordenacao> {
    if (!esquemaPedidoSemCorpoDeOperador.safeParse(corpo ?? {}).success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.painel.refazerConvite(idDoCaminho(id))
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
