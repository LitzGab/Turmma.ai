import { Permite, ZodValidationPipe } from '@educa/nucleo'
import { esquemaPedidoEscolaSessao, type PedidoEscolaSessao, type RespostaEscolaSessao } from '@educa/shared'
import { Body, Controller, Put } from '@nestjs/common'
import { EscolaSessaoService } from './escola-sessao.service.js'

/** `PUT /v1/escola/sessao`: a coordenação muda a inatividade do aluno e da equipe, entre 5 e 480 minutos. */
@Controller('v1/escola')
export class EscolaSessaoController {
  constructor(private readonly escolaSessao: EscolaSessaoService) {}

  @Put('sessao')
  @Permite('escola_configuracao', 'alterar')
  alterar(@Body(new ZodValidationPipe(esquemaPedidoEscolaSessao)) pedido: PedidoEscolaSessao): Promise<RespostaEscolaSessao> {
    return this.escolaSessao.alterar(pedido)
  }
}
