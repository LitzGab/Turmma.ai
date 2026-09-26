import { Permite } from '@educa/nucleo'
import {
  esquemaConsultaListaDaTurma,
  esquemaPedidoNomeAvulso,
  esquemaPedidoTextoDaLista,
  type NomeDaLista,
  type RespostaGravacaoDaLista,
  type RespostaListaDaTurma,
  type RespostaPreviaDaLista,
} from '@educa/shared'
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from './entrada.js'
import { ListaService } from './lista.service.js'

/**
 * A lista de nomes da turma (A1, tarefa 2.0, RF4 e RF5), só da coordenação, na turma do ano em curso da escola da
 * sessão: a prévia e a gravação do texto, o nome avulso, a retirada do nome livre e a leitura, com finalidade. O corpo e
 * a consulta passam pelo contrato estrito de `packages/shared` (campo a mais, como `escolaId`, é `ENTRADA_INVALIDA`); o
 * id fora do formato de UUID responde como o inexistente.
 */
@Controller('v1')
export class ListaController {
  constructor(private readonly lista: ListaService) {}

  @Post('turmas/:id/lista/previa')
  @Permite('lista_nome', 'previa')
  @HttpCode(HttpStatus.OK)
  previa(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaPreviaDaLista> {
    const turmaId = idDoCaminho(id)
    return this.lista.previa(turmaId, lerEntrada(esquemaPedidoTextoDaLista, corpo))
  }

  @Post('turmas/:id/lista')
  @Permite('lista_nome', 'gravar')
  gravar(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaGravacaoDaLista> {
    const turmaId = idDoCaminho(id)
    return this.lista.gravar(turmaId, lerEntrada(esquemaPedidoTextoDaLista, corpo))
  }

  @Post('turmas/:id/lista/nome')
  @Permite('lista_nome', 'acrescentar')
  acrescentar(@Param('id') id: string, @Body() corpo: unknown): Promise<NomeDaLista> {
    const turmaId = idDoCaminho(id)
    return this.lista.acrescentar(turmaId, lerEntrada(esquemaPedidoNomeAvulso, corpo))
  }

  @Get('turmas/:id/lista')
  @Permite('lista_nome', 'ler')
  ler(@Param('id') id: string, @Query() consulta: unknown): Promise<RespostaListaDaTurma> {
    const turmaId = idDoCaminho(id)
    return this.lista.ler(turmaId, lerEntrada(esquemaConsultaListaDaTurma, consulta))
  }

  @Delete('lista-nomes/:id')
  @Permite('lista_nome', 'retirar')
  @HttpCode(HttpStatus.NO_CONTENT)
  retirar(@Param('id') id: string): Promise<void> {
    return this.lista.retirar(idDoCaminho(id))
  }
}
