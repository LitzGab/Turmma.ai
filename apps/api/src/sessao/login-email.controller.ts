import { acimaDoLimiteDoIp, ErroDeDominio, ipDaRequisicao, LimiteQueRebaixa, ProxiesConfiaveis, RotaAnonima } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoLoginEmail, esquemaRespostaLogin, type RespostaLogin } from '@educa/shared'
import { Body, Controller, Header, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { LoginService } from './login.service.js'

/**
 * `POST /v1/sessao/email`: a equipe entra com e-mail e senha. Anônima; o limite por IP dela (`@LimiteQueRebaixa()`, 15.0) nunca
 * recusa, só rebaixa a tentativa no semáforo; o que segura a senha errada é o contador por conta, no service.
 */
@RotaAnonima()
@LimiteQueRebaixa()
@Controller('v1/sessao')
export class LoginEmailController {
  constructor(
    private readonly login: LoginService,
    private readonly proxies: ProxiesConfiaveis,
  ) {}

  @Post('email')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async entrar(@Body() corpo: unknown, @Req() requisicao: IncomingMessage, @Res({ passthrough: true }) resposta: ServerResponse): Promise<RespostaLogin> {
    const pedido = esquemaPedidoLoginEmail.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    const { resposta: corpoDaResposta, cookies } = await this.login.entrarPorEmail(pedido.data, {
      ip: await ipDaRequisicao(requisicao, this.proxies),
      cabecalhoCookie: requisicao.headers.cookie,
      acimaDoLimiteDoIp: acimaDoLimiteDoIp(requisicao),
    })
    resposta.setHeader('Set-Cookie', [...cookies])
    return esquemaRespostaLogin.parse(corpoDaResposta)
  }
}
