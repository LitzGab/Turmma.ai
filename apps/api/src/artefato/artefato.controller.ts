import { Permite } from '@educa/nucleo'
import {
  esquemaConsultaArtefatos,
  esquemaPedidoAdaptarArtefato,
  esquemaPedidoRenomearArtefato,
  type RespostaArtefato,
  type RespostaExecucaoAceita,
  type RespostaListaDeArtefatos,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Patch, Post, Query, StreamableFile } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from '../estrutura/entrada.js'
import { ArtefatoService } from './artefato.service.js'

/**
 * `/v1/artefatos` (MVP, A2): o que as ferramentas do Assistente produziram. Todas as células são `turma_vinculada`, só
 * do professor; coordenação e aluno são recusados pela guarda. O corpo e a consulta passam pelo contrato estrito
 * (campo a mais é `ENTRADA_INVALIDA`: a Adaptação não tem onde receber texto), e o `:id` fora do formato responde como
 * o inexistente. O artefato tem o gabarito: toda leitura sai com `no-store`.
 */
@Controller('v1/artefatos')
export class ArtefatoController {
  constructor(private readonly artefatos: ArtefatoService) {}

  @Get()
  @Permite('artefato', 'listar')
  @Header('Cache-Control', 'no-store')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeArtefatos> {
    return this.artefatos.listar(lerEntrada(esquemaConsultaArtefatos, consulta))
  }

  @Get(':id')
  @Permite('artefato', 'ler')
  @Header('Cache-Control', 'no-store')
  ler(@Param('id') id: string): Promise<RespostaArtefato> {
    return this.artefatos.ler(idDoCaminho(id))
  }

  @Patch(':id')
  @Permite('artefato', 'renomear')
  @Header('Cache-Control', 'no-store')
  renomear(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaArtefato> {
    const artefatoId = idDoCaminho(id)
    return this.artefatos.renomear(artefatoId, lerEntrada(esquemaPedidoRenomearArtefato, corpo))
  }

  @Get(':id/pdf')
  @Permite('artefato', 'exportar')
  @Header('Cache-Control', 'no-store')
  async pdf(@Param('id') id: string): Promise<StreamableFile> {
    const { nome, bytes } = await this.artefatos.pdf(idDoCaminho(id))
    return new StreamableFile(bytes, { type: 'application/pdf', disposition: `attachment; filename="${nome}"`, length: bytes.length })
  }

  @Post(':id/adaptar')
  @Permite('artefato', 'adaptar')
  @HttpCode(HttpStatus.ACCEPTED)
  adaptar(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaExecucaoAceita> {
    const artefatoId = idDoCaminho(id)
    return this.artefatos.adaptar(artefatoId, lerEntrada(esquemaPedidoAdaptarArtefato, corpo))
  }
}
