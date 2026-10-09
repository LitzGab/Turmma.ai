import { Permite } from '@educa/nucleo'
import { esquemaPedidoSemCorpo, type RespostaIncidentes, type RespostaRetencao, type RespostaSuboperadores } from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from '../estrutura/entrada.js'
import { PrivacidadeService } from './privacidade.service.js'

/**
 * `/v1/privacidade` (F3; Tech Spec do F3, seção 4): **só da coordenação**, que chega aqui só depois do segundo fator.
 * Professor e aluno recebem da guarda a resposta do inexistente; a rede, que ainda não tem usuário (F14), tem `nunca`
 * na matriz. O escopo é a escola do token.
 */
@Controller('v1/privacidade')
export class PrivacidadeController {
  constructor(private readonly privacidade: PrivacidadeService) {}

  /** Por quanto tempo a escola guarda cada dado: as categorias, com o prazo que vale e de onde vem, e os prazos fixos. */
  @Get('retencao')
  @Permite('privacidade_retencao', 'ler')
  @Header('Cache-Control', 'no-store')
  retencao(): Promise<RespostaRetencao> {
    return this.privacidade.retencao()
  }

  /** As empresas que recebem dado da escola: vigentes e passadas, com o que fazem, onde processam e o que recebem. */
  @Get('suboperadores')
  @Permite('privacidade_suboperadores', 'ler')
  @Header('Cache-Control', 'no-store')
  suboperadores(): Promise<RespostaSuboperadores> {
    return this.privacidade.suboperadores()
  }

  /** Os incidentes de segurança que afetaram a escola, só a seção dela: os sem confirmação primeiro, com o prazo legal dela em texto fixo. */
  @Get('incidentes')
  @Permite('privacidade_incidentes', 'ler')
  @Header('Cache-Control', 'no-store')
  incidentes(): Promise<RespostaIncidentes> {
    return this.privacidade.incidentes()
  }

  /**
   * A coordenação confirma que recebeu o aviso. Quem e quando ficam na seção da escola; confirmar de novo não muda nada e responde
   * igual. O id de outra escola, o inexistente e o que nem é um id respondem o mesmo `NAO_ENCONTRADO` (regra 10, item 6).
   */
  @Post('incidentes/:id/confirmar')
  @Permite('privacidade_incidentes', 'confirmar')
  @HttpCode(HttpStatus.NO_CONTENT)
  confirmarIncidente(@Param('id') id: string, @Body() corpo: unknown): Promise<void> {
    lerEntrada(esquemaPedidoSemCorpo, corpo)
    return this.privacidade.confirmarIncidente(idDoCaminho(id))
  }
}
