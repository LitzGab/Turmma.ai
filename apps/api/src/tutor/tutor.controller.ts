import { Permite } from '@educa/nucleo'
import {
  esquemaConsultaConversaDoTutor,
  esquemaConsultaUsoDoTutor,
  esquemaPedidoMensagemAoTutor,
  type RespostaConversaDoTutor,
  type RespostaExecucaoAceita,
  type RespostaMemoriaDoTutor,
  type RespostaUsoDoTutor,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Post, Query } from '@nestjs/common'
import { lerEntrada } from '../estrutura/entrada.js'
import { SupervisaoDoTutorService } from './supervisao.service.js'
import { TutorService } from './tutor.service.js'

/**
 * `/v1/tutor` (MVP, A4; D8, D47). As três células do aluno são `próprio`: professor e coordenação recebem da guarda a
 * resposta do inexistente, e não existe rota que entregue a conversa ou a memória de um aluno a outra pessoa. `uso` é
 * só do professor (`turma_vinculada`): o aluno e a coordenação não leem. O corpo e a consulta passam pelo contrato
 * estrito: `escolaId`, `alunoId`, `turmaId` no envio ou qualquer campo a mais é `ENTRADA_INVALIDA`. Tudo com `no-store`.
 */
@Controller('v1/tutor')
export class TutorController {
  constructor(
    private readonly tutor: TutorService,
    private readonly supervisao: SupervisaoDoTutorService,
  ) {}

  @Post('mensagens')
  @Permite('tutor', 'enviar_mensagem')
  @HttpCode(HttpStatus.ACCEPTED)
  enviar(@Body() corpo: unknown): Promise<RespostaExecucaoAceita> {
    return this.tutor.enviar(lerEntrada(esquemaPedidoMensagemAoTutor, corpo))
  }

  @Get('conversa')
  @Permite('tutor', 'ler_conversa')
  @Header('Cache-Control', 'no-store')
  conversa(@Query() consulta: unknown): Promise<RespostaConversaDoTutor> {
    return this.tutor.conversa(lerEntrada(esquemaConsultaConversaDoTutor, consulta))
  }

  @Get('memoria')
  @Permite('tutor', 'ler_memoria')
  @Header('Cache-Control', 'no-store')
  memoria(): Promise<RespostaMemoriaDoTutor> {
    return this.tutor.memoria()
  }

  @Get('uso')
  @Permite('uso_do_tutor', 'ler')
  @Header('Cache-Control', 'no-store')
  uso(@Query() consulta: unknown): Promise<RespostaUsoDoTutor> {
    return this.supervisao.uso(lerEntrada(esquemaConsultaUsoDoTutor, consulta))
  }
}
