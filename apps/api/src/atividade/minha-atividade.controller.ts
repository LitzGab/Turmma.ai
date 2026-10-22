import { IdPipe, Permite, ZodValidationPipe } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaConsultaMinhasAtividades,
  esquemaPedidoResponderQuestao,
  esquemaPedidoSemCorpoOuAusente,
  esquemaQuestaoDoCaminho,
  type ConsultaMinhasAtividades,
  type PedidoResponderQuestao,
  type PedidoSemCorpo,
  type RespostaAtividadeEnviada,
  type RespostaMeuDiagnostico,
  type RespostaMinhasAtividades,
  type RespostaProva,
  type RespostaQuestaoSalva,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common'
import { MinhaAtividadeService } from './minha-atividade.service.js'

/**
 * O lado do aluno na atividade (MVP, A3): `GET /v1/minhas-atividades` e, sob `/v1/atividades-aplicadas/:id`, a prova, a
 * resposta de cada questão, o envio e o diagnóstico. Todas as células são `proprio`, só do aluno: professor e
 * coordenação são recusados pela guarda. Tudo sai com `no-store`: é dado do aluno, num computador que a turma divide.
 * A entrada passa pelo `ZodValidationPipe` e pelo `IdPipe` no parâmetro (17.0); a `questao` do caminho fora do formato ou
 * do intervalo, onde nenhuma questão existe, responde como o inexistente (`NAO_ENCONTRADO`), e não como entrada inválida.
 *
 * O limite é o geral de requisições, por usuário e por escola, nunca por IP (regra 80, item 1): trinta e cinco alunos
 * respondem do mesmo IP.
 */
@Controller('v1')
export class MinhaAtividadeController {
  constructor(private readonly atividades: MinhaAtividadeService) {}

  @Get('minhas-atividades')
  @Permite('minha_atividade', 'listar')
  @Header('Cache-Control', 'no-store')
  listar(@Query(new ZodValidationPipe(esquemaConsultaMinhasAtividades)) consulta: ConsultaMinhasAtividades): Promise<RespostaMinhasAtividades> {
    return this.atividades.listar(consulta)
  }

  @Get('atividades-aplicadas/:id/prova')
  @Permite('minha_atividade', 'ler_prova')
  @Header('Cache-Control', 'no-store')
  prova(@Param('id', IdPipe) atividadeAplicadaId: string): Promise<RespostaProva> {
    return this.atividades.prova(atividadeAplicadaId)
  }

  @Put('atividades-aplicadas/:id/respostas/:questao')
  @Permite('minha_atividade', 'responder')
  @Header('Cache-Control', 'no-store')
  responder(
    @Param('id', IdPipe) atividadeAplicadaId: string,
    @Param('questao', new ZodValidationPipe(esquemaQuestaoDoCaminho, { errorCode: CodigoDeErro.NAO_ENCONTRADO })) numero: number,
    @Body(new ZodValidationPipe(esquemaPedidoResponderQuestao)) pedido: PedidoResponderQuestao,
  ): Promise<RespostaQuestaoSalva> {
    return this.atividades.responder(atividadeAplicadaId, numero, pedido)
  }

  @Post('atividades-aplicadas/:id/enviar')
  @Permite('minha_atividade', 'enviar')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  enviar(@Param('id', IdPipe) atividadeAplicadaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEnviada> {
    return this.atividades.enviar(atividadeAplicadaId)
  }

  @Get('atividades-aplicadas/:id/meu-diagnostico')
  @Permite('minha_atividade', 'ler_diagnostico')
  @Header('Cache-Control', 'no-store')
  meuDiagnostico(@Param('id', IdPipe) atividadeAplicadaId: string): Promise<RespostaMeuDiagnostico> {
    return this.atividades.meuDiagnostico(atividadeAplicadaId)
  }
}
