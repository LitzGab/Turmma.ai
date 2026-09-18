import { ErroDeDominio, ipDaRequisicao, ProxiesConfiaveis, RotaAnonima } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoLoginMatricula, esquemaRespostaLogin, type RespostaLogin } from '@educa/shared'
import { Body, Controller, Header, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { LoginPorMatricula } from './matricula.service.js'

/**
 * `POST /v1/sessao/matricula`: o aluno entra pelo endereço da escola com matrícula e senha. Anônima, e por isso
 * limitada só pelo IP da rota anônima, com teto de uma escola inteira atrás de um NAT; o que segura a senha errada é o
 * contador por escola e matrícula, no service.
 */
@RotaAnonima()
@Controller('v1/sessao')
export class LoginMatriculaController {
  constructor(
    private readonly login: LoginPorMatricula,
    private readonly proxies: ProxiesConfiaveis,
  ) {}

  @Post('matricula')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async entrar(@Body() corpo: unknown, @Req() requisicao: IncomingMessage, @Res({ passthrough: true }) resposta: ServerResponse): Promise<RespostaLogin> {
    const pedido = esquemaPedidoLoginMatricula.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    const { resposta: corpoDaResposta, cookies } = await this.login.entrar(pedido.data, {
      ip: await ipDaRequisicao(requisicao, this.proxies),
      cabecalhoCookie: requisicao.headers.cookie,
    })
    resposta.setHeader('Set-Cookie', [...cookies])
    return esquemaRespostaLogin.parse(corpoDaResposta)
  }
}
