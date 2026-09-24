import { ErroDeDominio, LimiteQueRebaixa } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaPedidoConfigurarSegundoFatorDeOperador,
  esquemaPedidoSegundoFatorDeOperador,
  esquemaRespostaConfigurarSegundoFatorDeOperador,
  esquemaRespostaSegundoFatorDeOperador,
  type RespostaConfigurarSegundoFatorDeOperador,
  type RespostaSegundoFatorDeOperador,
} from '@educa/shared'
import { Body, Controller, Header, HttpCode, HttpStatus, Inject, Post, Req, Res } from '@nestjs/common'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { EntradaDeOperacao } from './marcadores.js'
import { SegundoFatorDoOperadorService } from './segundo-fator.service.js'

/**
 * `POST /v1/operacao/sessao/mfa/configurar` e `POST /v1/operacao/sessao/mfa` (Tech Spec da A0, seção 4): o operador que
 * passou pela senha configura o app autenticador e entra com o código. Rotas de entrada, sem sessão: o desafio vem no
 * corpo, e quem o confere é o service. As duas saem com `no-store` (segredo, códigos, desafio e acesso), e o contrato
 * estrito recusa campo a mais na entrada e não deixa sair campo a mais (C39).
 *
 * Limite (seção 5, "Limite"):
 * - `mfa/configurar`: o limite anônimo por IP (`rl:ip`), que recusa com 429 (C32).
 * - `mfa`: quem recusa é o contador pelo `operador.id`, no service (C34), e nunca o IP: a equipe inteira pode sair por
 *   um IP só. Por isso leva `@LimiteQueRebaixa`, que conta no balde do login e nunca responde 429; sem hash aqui, o
 *   rebaixamento não tem efeito, e cada tentativa já exige um desafio novo, que só a senha dá.
 */
@Controller('v1/operacao/sessao')
export class SegundoFatorDoOperadorController {
  constructor(@Inject(SegundoFatorDoOperadorService) private readonly segundoFator: SegundoFatorDoOperadorService) {}

  @Post('mfa/configurar')
  @EntradaDeOperacao()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async configurar(@Body() corpo: unknown): Promise<RespostaConfigurarSegundoFatorDeOperador> {
    const pedido = esquemaPedidoConfigurarSegundoFatorDeOperador.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return esquemaRespostaConfigurarSegundoFatorDeOperador.parse(await this.segundoFator.configurar(pedido.data))
  }

  @Post('mfa')
  @EntradaDeOperacao()
  @LimiteQueRebaixa()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async entrar(@Body() corpo: unknown, @Req() requisicao: IncomingMessage, @Res({ passthrough: true }) resposta: ServerResponse): Promise<RespostaSegundoFatorDeOperador> {
    const pedido = esquemaPedidoSegundoFatorDeOperador.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    const aberta = await this.segundoFator.entrar(pedido.data, { cabecalhoCookie: requisicao.headers.cookie })
    const corpoDaResposta = esquemaRespostaSegundoFatorDeOperador.parse(aberta.resposta)
    resposta.setHeader('Set-Cookie', [...aberta.cookies])
    return corpoDaResposta
  }
}
