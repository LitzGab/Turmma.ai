import { Permite, ZodValidationPipe } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaParametroFerramenta,
  esquemaPedidoGerarComFerramenta,
  type ParametroFerramenta,
  type PedidoGerarComFerramenta,
  type RespostaExecucaoAceita,
} from '@educa/shared'
import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { FerramentasService } from './ferramentas.service.js'

/**
 * `POST /v1/ferramentas/:ferramenta/gerar` (MVP, A2; D18): `atividade_objetiva` ou `plano_de_aula`. Ferramenta fora da
 * lista não existe (`NAO_ENCONTRADO`, pelo `errorCode` do pipe, e não `ENTRADA_INVALIDA`: regra 10, item 6); a Adaptação
 * parte de um artefato e tem rota própria. Responde `202` com a execução, que a tela consulta em `GET /v1/execucoes/:id`.
 */
@Controller('v1/ferramentas')
export class FerramentasController {
  constructor(private readonly ferramentas: FerramentasService) {}

  @Post(':ferramenta/gerar')
  @Permite('ferramenta', 'gerar')
  @HttpCode(HttpStatus.ACCEPTED)
  gerar(
    @Param('ferramenta', new ZodValidationPipe(esquemaParametroFerramenta, { errorCode: CodigoDeErro.NAO_ENCONTRADO })) ferramenta: ParametroFerramenta,
    @Body(new ZodValidationPipe(esquemaPedidoGerarComFerramenta)) pedido: PedidoGerarComFerramenta,
  ): Promise<RespostaExecucaoAceita> {
    return this.ferramentas.gerar(ferramenta, pedido)
  }
}
