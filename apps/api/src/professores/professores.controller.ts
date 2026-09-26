import { Permite } from '@educa/nucleo'
import { esquemaPedidoCadastrarProfessor, esquemaPedidoSemCorpoDoConviteDeProfessor, type RespostaConviteDeProfessor, type RespostaListaDeProfessores } from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { idDoCaminho, lerConsultaPaginada, lerEntrada } from '../estrutura/entrada.js'
import { ProfessoresService } from './professores.service.js'

/**
 * `/v1/professores` (A1, tarefa 3.0, RF6), só da coordenação, na escola da sessão: cadastrar o professor (o link do
 * convite sai uma vez), listar, e refazer e revogar o convite dele pelo id do usuário. O corpo passa pelo contrato estrito
 * de `packages/shared` (campo a mais, como `escolaId`, é `ENTRADA_INVALIDA`); o `:usuarioId` fora do formato de UUID
 * responde como o inexistente. As respostas que levam o token saem com `no-store`.
 */
@Controller('v1/professores')
export class ProfessoresController {
  constructor(private readonly professores: ProfessoresService) {}

  @Post()
  @Permite('professor', 'cadastrar')
  @Header('Cache-Control', 'no-store')
  cadastrar(@Body() corpo: unknown): Promise<RespostaConviteDeProfessor> {
    return this.professores.cadastrar(lerEntrada(esquemaPedidoCadastrarProfessor, corpo))
  }

  @Get()
  @Permite('professor', 'listar')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeProfessores> {
    return this.professores.listar(lerConsultaPaginada(consulta))
  }

  @Post(':usuarioId/convite/refazer')
  @Permite('professor', 'refazer_convite')
  @Header('Cache-Control', 'no-store')
  refazerConvite(@Param('usuarioId') usuarioId: string, @Body() corpo: unknown): Promise<RespostaConviteDeProfessor> {
    const alvo = idDoCaminho(usuarioId)
    lerEntrada(esquemaPedidoSemCorpoDoConviteDeProfessor, corpo ?? {})
    return this.professores.refazerConvite(alvo)
  }

  @Post(':usuarioId/convite/revogar')
  @Permite('professor', 'revogar_convite')
  @HttpCode(HttpStatus.NO_CONTENT)
  revogarConvite(@Param('usuarioId') usuarioId: string, @Body() corpo: unknown): Promise<void> {
    const alvo = idDoCaminho(usuarioId)
    lerEntrada(esquemaPedidoSemCorpoDoConviteDeProfessor, corpo ?? {})
    return this.professores.revogarConvite(alvo)
  }
}
