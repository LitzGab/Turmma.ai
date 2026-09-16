import { Permite, sessaoDaRequisicao } from '@educa/nucleo'
import { esquemaRespostaContexto, type RespostaContexto } from '@educa/shared'
import { Controller, Get, Header } from '@nestjs/common'

@Controller('v1/sistema/contexto')
export class ContextoController {
  /**
   * A escola, o usuário, o papel e a sessão da sessão conferida, e o ano letivo em curso da escola. Nada que o
   * cliente mande entra nesta resposta.
   */
  @Get()
  @Permite('sistema_contexto', 'ler')
  @Header('Cache-Control', 'no-store')
  obter(): RespostaContexto {
    return esquemaRespostaContexto.parse(sessaoDaRequisicao())
  }
}
