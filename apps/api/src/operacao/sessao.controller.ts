import { ErroDeDominio, ipDaRequisicao, ProxiesConfiaveis } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoSemCorpoDeOperador, esquemaRespostaRenovacaoDeOperador, type RespostaRenovacaoDeOperador } from '@educa/shared'
import { Body, Controller, Header, HttpCode, HttpStatus, Inject, Post, Req, Res } from '@nestjs/common'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { EntradaDeOperacao } from './marcadores.js'
import { RenovacaoDeOperadorRecusada, SessaoDoOperadorService } from './sessao.service.js'

/** O corpo das duas rotas é vazio: sem corpo, ou `{}`. Qualquer campo é `ENTRADA_INVALIDA`. */
function exigirCorpoVazio(corpo: unknown): void {
  if (!esquemaPedidoSemCorpoDeOperador.safeParse(corpo ?? {}).success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
}

/**
 * `POST /v1/operacao/sessao/renovar` e `POST /v1/operacao/sessao/sair` (Tech Spec da A0, seção 4): as duas últimas das
 * sete rotas de entrada. Sem token de acesso (ele pode ter vencido): a credencial é o cookie `turmma_operacao`, que só
 * vai a `/v1/operacao/sessao`, e quem o confere é o service.
 *
 * Limite (seção 5, "Limite"): as duas usam o limite anônimo por IP (`rl:ip`), que recusa com 429 (C32), como as rotas
 * iguais do F1. Saem com `no-store`, e o contrato estrito recusa corpo com campo e não deixa sair campo a mais (C39).
 */
@Controller('v1/operacao/sessao')
export class SessaoDoOperadorController {
  constructor(
    @Inject(SessaoDoOperadorService) private readonly sessoes: SessaoDoOperadorService,
    @Inject(ProxiesConfiaveis) private readonly proxies: ProxiesConfiaveis,
  ) {}

  @Post('renovar')
  @EntradaDeOperacao()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async renovar(@Body() corpo: unknown, @Req() requisicao: IncomingMessage, @Res({ passthrough: true }) resposta: ServerResponse): Promise<RespostaRenovacaoDeOperador> {
    exigirCorpoVazio(corpo)
    try {
      const renovada = await this.sessoes.renovar({ cabecalhoCookie: requisicao.headers.cookie })
      const corpoDaResposta = esquemaRespostaRenovacaoDeOperador.parse(renovada.resposta)
      if (renovada.cookies.length > 0) resposta.setHeader('Set-Cookie', [...renovada.cookies])
      return corpoDaResposta
    } catch (erro) {
      // O cookie que não vale mais sai do navegador junto com o 401.
      if (erro instanceof RenovacaoDeOperadorRecusada) resposta.setHeader('Set-Cookie', [...erro.cookies])
      throw erro
    }
  }

  @Post('sair')
  @EntradaDeOperacao()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  async sair(@Body() corpo: unknown, @Req() requisicao: IncomingMessage, @Res({ passthrough: true }) resposta: ServerResponse): Promise<void> {
    exigirCorpoVazio(corpo)
    const cookies = await this.sessoes.sair({ cabecalhoCookie: requisicao.headers.cookie, ip: await ipDaRequisicao(requisicao, this.proxies) })
    resposta.setHeader('Set-Cookie', [...cookies])
  }
}
