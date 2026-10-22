import { extrairTokenBearer, ipDaRequisicao, ProxiesConfiaveis, RotaAnonima, ZodValidationPipe } from '@educa/nucleo'
import {
  esquemaPedidoAtivarMfa,
  esquemaPedidoMfa,
  esquemaRespostaAtivarMfa,
  esquemaRespostaConfigurarMfa,
  esquemaRespostaLogin,
  type PedidoAtivarMfa,
  type PedidoMfa,
  type RespostaAtivarMfa,
  type RespostaConfigurarMfa,
  type RespostaLogin,
} from '@educa/shared'
import { Body, Controller, Header, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { MfaService } from './mfa.service.js'

/**
 * `POST /v1/conta/mfa/configurar` e `/ativar`: o coordenador sem MFA configura o app autenticador. Anônimas para a
 * guarda de acesso: quem autoriza é o desafio `configurar_mfa`, no `Authorization`, e o token de acesso não vale
 * aqui. As duas respostas levam o segredo ou os códigos de recuperação, e por isso saem com `no-store`.
 * O token é lido no handler, da requisição (`extrairTokenBearer`), e não no pipe: o corpo fora do esquema dá o 400 antes
 * do 401 do token que falta, sem gastar tentativa (16.0, `onda-1a.md` T1).
 */
@RotaAnonima()
@Controller('v1/conta/mfa')
export class ContaMfaController {
  constructor(private readonly mfa: MfaService) {}

  @Post('configurar')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async configurar(@Req() requisicao: IncomingMessage): Promise<RespostaConfigurarMfa> {
    return esquemaRespostaConfigurarMfa.parse(await this.mfa.configurar(extrairTokenBearer(requisicao.headers.authorization)))
  }

  @Post('ativar')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async ativar(@Body(new ZodValidationPipe(esquemaPedidoAtivarMfa)) pedido: PedidoAtivarMfa, @Req() requisicao: IncomingMessage): Promise<RespostaAtivarMfa> {
    const desafio = extrairTokenBearer(requisicao.headers.authorization)
    return esquemaRespostaAtivarMfa.parse(await this.mfa.ativar(desafio, pedido.codigo))
  }
}

/**
 * `POST /v1/sessao/mfa`: o coordenador informa o código do app autenticador, ou um de recuperação, com o desafio
 * `mfa` no `Authorization`. Anônima para a guarda de acesso, e por isso limitada pelo IP da rota anônima; o que segura
 * o código errado é o contador por conta, no service. Como em `ContaMfaController`, o token é lido no handler e o corpo
 * fora do esquema dá o 400 antes do 401, sem gastar tentativa (16.0, `onda-1a.md` T1).
 */
@RotaAnonima()
@Controller('v1/sessao')
export class SessaoMfaController {
  constructor(
    private readonly mfa: MfaService,
    private readonly proxies: ProxiesConfiaveis,
  ) {}

  @Post('mfa')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async entrar(
    @Body(new ZodValidationPipe(esquemaPedidoMfa)) pedido: PedidoMfa,
    @Req() requisicao: IncomingMessage,
    @Res({ passthrough: true }) resposta: ServerResponse,
  ): Promise<RespostaLogin> {
    const desafio = extrairTokenBearer(requisicao.headers.authorization)
    const { resposta: corpoDaResposta, cookies } = await this.mfa.entrar(desafio, pedido, {
      ip: await ipDaRequisicao(requisicao, this.proxies),
      cabecalhoCookie: requisicao.headers.cookie,
    })
    resposta.setHeader('Set-Cookie', [...cookies])
    return esquemaRespostaLogin.parse(corpoDaResposta)
  }
}
