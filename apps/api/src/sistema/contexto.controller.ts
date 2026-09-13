import { identidadeDaRequisicao } from '@educa/nucleo'
import { esquemaRespostaContexto, type RespostaContexto } from '@educa/shared'
import { Controller, Get, Header } from '@nestjs/common'

@Controller('v1/sistema/contexto')
export class ContextoController {
  /** A escola e o usuário do token verificado. Nada que o cliente mande entra nesta resposta. */
  @Get()
  @Header('Cache-Control', 'no-store')
  obter(): RespostaContexto {
    return esquemaRespostaContexto.parse(identidadeDaRequisicao())
  }
}
