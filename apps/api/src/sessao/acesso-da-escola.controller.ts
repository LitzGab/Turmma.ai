import { RotaAnonima } from '@educa/nucleo'
import { esquemaRespostaAcessoDaEscola, type RespostaAcessoDaEscola } from '@educa/shared'
import { Controller, Get, Param } from '@nestjs/common'
import { AcessoDaEscolaService } from './acesso-da-escola.service.js'

/**
 * `GET /v1/escolas/:slug/acesso`: o que a tela `/e/:slug` mostra antes do login. Anônima, com o limite por IP da rota
 * anônima; a saída passa pelo contrato estrito, que só tem o nome e o tipo dos provedores.
 */
@RotaAnonima()
@Controller('v1/escolas')
export class AcessoDaEscolaController {
  constructor(private readonly acesso: AcessoDaEscolaService) {}

  @Get(':slug/acesso')
  async ler(@Param('slug') slug: string): Promise<RespostaAcessoDaEscola> {
    return esquemaRespostaAcessoDaEscola.parse(await this.acesso.ler(slug))
  }
}
