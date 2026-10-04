import { Permite } from '@educa/nucleo'
import { esquemaConsultaSinais, type RespostaSinais } from '@educa/shared'
import { Controller, Get, Header, Query } from '@nestjs/common'
import { lerEntrada } from '../estrutura/entrada.js'
import { SupervisaoDoTutorService } from './supervisao.service.js'

/**
 * `GET /v1/sinais?turmaId=` (MVP, A4; D34, D36, D57): os sinais do Tutor para o professor da turma. A célula é
 * `turma_vinculada`, só do professor: o aluno e a coordenação recebem da guarda a resposta do inexistente. A consulta é
 * estrita: não aceita aluno, tipo nem ordenação.
 */
@Controller('v1/sinais')
export class SinaisController {
  constructor(private readonly supervisao: SupervisaoDoTutorService) {}

  @Get()
  @Permite('sinal', 'ler')
  @Header('Cache-Control', 'no-store')
  listar(@Query() consulta: unknown): Promise<RespostaSinais> {
    return this.supervisao.sinais(lerEntrada(esquemaConsultaSinais, consulta))
  }
}
