import { ErroDeDominio, Permite } from '@educa/nucleo'
import { CodigoDeErro, esquemaPedidoEscolaSessao, type RespostaEscolaSessao } from '@educa/shared'
import { Body, Controller, Put } from '@nestjs/common'
import { EscolaSessaoService } from './escola-sessao.service.js'

/** `PUT /v1/escola/sessao`: a coordenação muda a inatividade do aluno e da equipe, entre 5 e 480 minutos. */
@Controller('v1/escola')
export class EscolaSessaoController {
  constructor(private readonly escolaSessao: EscolaSessaoService) {}

  @Put('sessao')
  @Permite('escola_configuracao', 'alterar')
  alterar(@Body() corpo: unknown): Promise<RespostaEscolaSessao> {
    const pedido = esquemaPedidoEscolaSessao.safeParse(corpo)
    if (!pedido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.escolaSessao.alterar(pedido.data)
  }
}
