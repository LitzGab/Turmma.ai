import { acimaDoLimiteDoIp, ErroDeDominio, ipDaRequisicao, LimiteQueRebaixa, ProxiesConfiaveis } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaPedidoAceitarConviteDeOperador,
  esquemaPedidoConsultarConviteDeOperador,
  esquemaRespostaAceitarConviteDeOperador,
  esquemaRespostaConsultarConviteDeOperador,
  type RespostaAceitarConviteDeOperador,
  type RespostaConsultarConviteDeOperador,
} from '@educa/shared'
import { Body, Controller, Header, HttpCode, HttpStatus, Inject, Post, Req } from '@nestjs/common'
import type { IncomingMessage } from 'node:http'
import { ConviteDeOperadorService } from './convite-operador.service.js'
import { EntradaDeOperacao } from './marcadores.js'

/**
 * `POST /v1/operacao/convite/consultar` e `/aceitar` (Tech Spec da A0, seção 4): quem recebeu o convite do
 * `ops:operador` abre o link. Rotas de entrada, sem sessão: as guardas da escola não leem credencial nenhuma aqui, e o
 * único que abre alguma coisa é o token do convite, no corpo, conferido pelo service contra o hash no banco.
 *
 * - `consultar`: limite anônimo por IP (`rl:ip`), que recusa com 429.
 * - `aceitar`: `@LimiteQueRebaixa`, como o login por senha: acima do limite por IP, o aceite vai para o fim do balde
 *   no semáforo do hash, nunca 429 (Tech Spec da A0, seção 5, "Limite").
 *
 * As duas saem com `no-store`, e o contrato estrito recusa campo a mais na entrada e não deixa sair campo a mais (C39).
 * Nenhuma rota cria convite nem operador: eles nascem só pelo `ops:operador`.
 */
@Controller('v1/operacao/convite')
export class ConviteDeOperadorController {
  constructor(
    @Inject(ConviteDeOperadorService) private readonly convites: ConviteDeOperadorService,
    @Inject(ProxiesConfiaveis) private readonly proxies: ProxiesConfiaveis,
  ) {}

  @Post('consultar')
  @EntradaDeOperacao()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async consultar(@Body() corpo: unknown): Promise<RespostaConsultarConviteDeOperador> {
    const pedido = esquemaPedidoConsultarConviteDeOperador.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return esquemaRespostaConsultarConviteDeOperador.parse(await this.convites.consultar(pedido.data.token))
  }

  @Post('aceitar')
  @EntradaDeOperacao()
  @LimiteQueRebaixa()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async aceitar(@Body() corpo: unknown, @Req() requisicao: IncomingMessage): Promise<RespostaAceitarConviteDeOperador> {
    const pedido = esquemaPedidoAceitarConviteDeOperador.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    const origem = { ip: await ipDaRequisicao(requisicao, this.proxies), acimaDoLimiteDoIp: acimaDoLimiteDoIp(requisicao) }
    return esquemaRespostaAceitarConviteDeOperador.parse(await this.convites.aceitar(pedido.data, origem))
  }
}
