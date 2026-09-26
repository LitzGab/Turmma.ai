import { Permite } from '@educa/nucleo'
import { esquemaPedidoGerarAcesso, esquemaPedidoRevogarAcesso, type RespostaAcessoDaTurma, type RespostaAcessoGerado } from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from '../estrutura/entrada.js'
import { AcessoDaTurmaService } from './acesso-da-turma.service.js'

/**
 * O acesso da turma (A1, tarefa 4.0, RF9), só do professor com vínculo confirmado na turma do ano em curso: gerar o link
 * e o código, revogar, e ler até quando valem. O corpo passa pelo contrato estrito de `packages/shared` (campo a mais,
 * como `escolaId`, é `ENTRADA_INVALIDA`); o id fora do formato de UUID responde como o inexistente. A resposta do gerar,
 * a única com o link e o código, e a leitura saem com `no-store`.
 */
@Controller('v1/turmas/:id/acesso')
export class AcessoDaTurmaController {
  constructor(private readonly acessos: AcessoDaTurmaService) {}

  @Post()
  @Permite('acesso_turma', 'gerar')
  @Header('Cache-Control', 'no-store')
  gerar(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaAcessoGerado> {
    const turmaId = idDoCaminho(id)
    return this.acessos.gerar(turmaId, lerEntrada(esquemaPedidoGerarAcesso, corpo))
  }

  @Get()
  @Permite('acesso_turma', 'ler')
  @Header('Cache-Control', 'no-store')
  ler(@Param('id') id: string): Promise<RespostaAcessoDaTurma> {
    return this.acessos.ler(idDoCaminho(id))
  }

  @Post('revogar')
  @Permite('acesso_turma', 'revogar')
  @HttpCode(HttpStatus.NO_CONTENT)
  revogar(@Param('id') id: string, @Body() corpo: unknown): Promise<void> {
    const turmaId = idDoCaminho(id)
    lerEntrada(esquemaPedidoRevogarAcesso, corpo ?? {})
    return this.acessos.revogar(turmaId)
  }
}
