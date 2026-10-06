import { Permite } from '@educa/nucleo'
import type { RespostaRetencao } from '@educa/shared'
import { Controller, Get, Header } from '@nestjs/common'
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
}
