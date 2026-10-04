import { Permite } from '@educa/nucleo'
import {
  esquemaConsultaAtividadesAplicadas,
  esquemaPedidoAplicarAtividade,
  esquemaPedidoSemCorpo,
  type RespostaAtividadeAplicada,
  type RespostaAtividadeEncerrada,
  type RespostaCorrecaoDoLote,
  type RespostaDestaqueAberto,
  type RespostaListaDeAtividadesAplicadas,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { idDoCaminho, lerEntrada } from '../estrutura/entrada.js'
import { AtividadeAplicadaService } from './atividade-aplicada.service.js'
import { CorrecaoService } from './correcao.service.js'

/**
 * `/v1/atividades-aplicadas`, o lado da professora (MVP, A3): aplicar, listar, encerrar, ler a correção do lote e abrir
 * destaque. Todas as células são `turma_vinculada`, só do professor: coordenação e aluno são recusados pela guarda. O
 * corpo e a consulta passam pelo contrato estrito (escola, ano ou pessoa no corpo é `ENTRADA_INVALIDA`), e o id fora do
 * formato responde como o inexistente. A correção nomeia alunos e tem o gabarito: toda leitura sai com `no-store`.
 */
@Controller('v1/atividades-aplicadas')
export class AtividadeAplicadaController {
  constructor(
    private readonly atividades: AtividadeAplicadaService,
    private readonly correcoes: CorrecaoService,
  ) {}

  @Post()
  @Permite('atividade_aplicada', 'aplicar')
  aplicar(@Body() corpo: unknown): Promise<RespostaAtividadeAplicada> {
    return this.atividades.aplicar(lerEntrada(esquemaPedidoAplicarAtividade, corpo))
  }

  @Get()
  @Permite('atividade_aplicada', 'listar')
  @Header('Cache-Control', 'no-store')
  listar(@Query() consulta: unknown): Promise<RespostaListaDeAtividadesAplicadas> {
    return this.atividades.listar(lerEntrada(esquemaConsultaAtividadesAplicadas, consulta))
  }

  @Post(':id/encerrar')
  @Permite('atividade_aplicada', 'encerrar')
  @HttpCode(HttpStatus.OK)
  encerrar(@Param('id') id: string, @Body() corpo: unknown): Promise<RespostaAtividadeEncerrada> {
    const atividadeAplicadaId = idDoCaminho(id)
    lerEntrada(esquemaPedidoSemCorpo, corpo ?? {})
    return this.atividades.encerrar(atividadeAplicadaId)
  }

  @Get(':id/correcao')
  @Permite('correcao', 'ler')
  @Header('Cache-Control', 'no-store')
  correcao(@Param('id') id: string): Promise<RespostaCorrecaoDoLote> {
    return this.correcoes.ler(idDoCaminho(id))
  }

  @Post(':id/correcao/destaques/:alunoId/abrir')
  @Permite('correcao', 'abrir_destaque')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  abrirDestaque(@Param('id') id: string, @Param('alunoId') alunoId: string, @Body() corpo: unknown): Promise<RespostaDestaqueAberto> {
    const atividadeAplicadaId = idDoCaminho(id)
    const aluno = idDoCaminho(alunoId)
    lerEntrada(esquemaPedidoSemCorpo, corpo ?? {})
    return this.correcoes.abrirDestaque(atividadeAplicadaId, aluno)
  }
}
