import { Permite } from '@educa/nucleo'
import { esquemaConsultaConversaDoAssistente, esquemaPedidoMensagemAoAssistente, type RespostaConversaDoAssistente, type RespostaExecucaoAceita } from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { lerEntrada } from '../estrutura/entrada.js'
import { AssistenteService } from './assistente.service.js'

/**
 * `/v1/assistente` (MVP, A2; D18): a conversa do professor com o Assistente de ensino. As duas células são `próprio`,
 * só do professor: coordenação e aluno recebem `SEM_PERMISSAO` da guarda, e não existe rota que leia a conversa de
 * outra pessoa (regra 70, item 8). O corpo e a consulta passam pelo contrato estrito: `escolaId`, `usuarioId` ou
 * qualquer campo a mais é `ENTRADA_INVALIDA`. A conversa sai com `no-store`.
 */
@Controller('v1/assistente')
export class AssistenteController {
  constructor(private readonly assistente: AssistenteService) {}

  @Get('conversa')
  @Permite('assistente', 'ler_conversa')
  @Header('Cache-Control', 'no-store')
  conversa(@Query() consulta: unknown): Promise<RespostaConversaDoAssistente> {
    return this.assistente.conversa(lerEntrada(esquemaConsultaConversaDoAssistente, consulta))
  }

  @Post('mensagens')
  @Permite('assistente', 'enviar_mensagem')
  @HttpCode(HttpStatus.ACCEPTED)
  enviar(@Body() corpo: unknown): Promise<RespostaExecucaoAceita> {
    return this.assistente.enviar(lerEntrada(esquemaPedidoMensagemAoAssistente, corpo))
  }
}
