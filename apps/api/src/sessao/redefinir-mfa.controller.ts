import { ErroDeDominio, Permite } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoRedefinirMfa } from '@educa/shared'
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { z } from 'zod'
import { RedefinicaoDeMfa } from './redefinicao-de-mfa.js'

const esquemaId = z.uuid()

/**
 * `POST /v1/usuarios/:id/mfa/redefinir`: a coordenação apaga o segundo fator de outro coordenador da escola, com a
 * finalidade. Responde 202 sem corpo, sempre: quem chama não fica sabendo se o id existe, se é de outra escola, nem se
 * a conta dele trabalha em outra escola (regra 10, item 6). Id fora do formato também: nenhum id existe assim.
 */
@Controller('v1/usuarios')
export class RedefinirMfaController {
  constructor(private readonly redefinicao: RedefinicaoDeMfa) {}

  @Post(':id/mfa/redefinir')
  @Permite('usuario_mfa', 'redefinir')
  @HttpCode(HttpStatus.ACCEPTED)
  async redefinir(@Param('id') id: string, @Body() corpo: unknown): Promise<void> {
    const pedido = esquemaPedidoRedefinirMfa.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    const alvo = esquemaId.safeParse(id)
    if (!alvo.success) return
    await this.redefinicao.pelaCoordenacao(alvo.data.toLowerCase(), pedido.data.finalidade)
  }
}
