import { ErroDeDominio, Permite } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaConsultaMinhasAtividades,
  esquemaNumeroDaQuestao,
  esquemaPedidoResponderQuestao,
  esquemaPedidoSemCorpo,
  type RespostaAtividadeEnviada,
  type RespostaMeuDiagnostico,
  type RespostaMinhasAtividades,
  type RespostaProva,
  type RespostaQuestaoSalva,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Put, Query } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from '../estrutura/entrada.js'
import { MinhaAtividadeService } from './minha-atividade.service.js'

/** O número da questão no caminho. Fora do formato ou do intervalo, nenhuma questão existe assim: responde como o inexistente. */
function questaoDoCaminho(questao: string): number {
  const lida = /^\d{1,2}$/.test(questao) ? esquemaNumeroDaQuestao.safeParse(questao) : undefined
  if (lida === undefined || !lida.success) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  return lida.data
}

/**
 * O lado do aluno na atividade (MVP, A3): `GET /v1/minhas-atividades` e, sob `/v1/atividades-aplicadas/:id`, a prova, a
 * resposta de cada questão, o envio e o diagnóstico. Todas as células são `proprio`, só do aluno: professor e
 * coordenação são recusados pela guarda. Tudo sai com `no-store`: é dado do aluno, num computador que a turma divide.
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
  listar(@Query() consulta: unknown): Promise<RespostaMinhasAtividades> {
    return this.atividades.listar(lerEntrada(esquemaConsultaMinhasAtividades, consulta))
  }

  @Get('atividades-aplicadas/:id/prova')
  @Permite('minha_atividade', 'ler_prova')
  @Header('Cache-Control', 'no-store')
  prova(@Param('id') id: string): Promise<RespostaProva> {
    return this.atividades.prova(idDoCaminho(id))
  }

  @Put('atividades-aplicadas/:id/respostas/:questao')
  @Permite('minha_atividade', 'responder')
  @Header('Cache-Control', 'no-store')
  responder(@Param('id') id: string, @Param('questao') questao: string, @Body() corpo: unknown): Promise<RespostaQuestaoSalva> {
    const atividadeAplicadaId = idDoCaminho(id)
    const numero = questaoDoCaminho(questao)
    return this.atividades.responder(atividadeAplicadaId, numero, lerEntrada(esquemaPedidoResponderQuestao, corpo))
  }

  @Post('atividades-aplicadas/:id/enviar')
  @Permite('minha_atividade', 'enviar')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  enviar(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaAtividadeEnviada> {
    const atividadeAplicadaId = idDoCaminho(id)
    lerEntrada(esquemaPedidoSemCorpo, corpo ?? {})
    return this.atividades.enviar(atividadeAplicadaId)
  }

  @Get('atividades-aplicadas/:id/meu-diagnostico')
  @Permite('minha_atividade', 'ler_diagnostico')
  @Header('Cache-Control', 'no-store')
  meuDiagnostico(@Param('id') id: string): Promise<RespostaMeuDiagnostico> {
    return this.atividades.meuDiagnostico(idDoCaminho(id))
  }
}
