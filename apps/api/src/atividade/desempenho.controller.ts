import { IdPipe, Permite, ZodValidationPipe } from '@educa/nucleo'
import { esquemaConsultaDesempenhoDaTurma, type ConsultaDesempenhoDaTurma, type RespostaDesempenhoDaTurma } from '@educa/shared'
import { Controller, Get, Header, Param, Query } from '@nestjs/common'
import { DesempenhoService } from './desempenho.service.js'

/**
 * `GET /v1/turmas/:id/desempenho` (MVP, A3): a professora da turma lê (`turma_vinculada`); a coordenação lê com
 * finalidade e auditoria (`nominal_auditado`); o aluno é recusado pela guarda. A resposta nomeia alunos: `no-store`. As
 * outras rotas de `/v1/turmas` são do módulo da estrutura.
 */
@Controller('v1/turmas')
export class DesempenhoController {
  constructor(private readonly desempenho: DesempenhoService) {}

  @Get(':id/desempenho')
  @Permite('desempenho_da_turma', 'ler')
  @Header('Cache-Control', 'no-store')
  ler(@Param('id', IdPipe) turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaDesempenhoDaTurma)) consulta: ConsultaDesempenhoDaTurma): Promise<RespostaDesempenhoDaTurma> {
    return this.desempenho.ler(turmaId, consulta)
  }
}
