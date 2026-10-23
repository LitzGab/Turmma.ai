import { IdPipe, Permite, ZodValidationPipe } from '@educa/nucleo'
import {
  esquemaConsultaAtividadesAplicadas,
  esquemaPedidoAplicarAtividade,
  esquemaPedidoSemCorpoOuAusente,
  type ConsultaAtividadesAplicadas,
  type PedidoAplicarAtividade,
  type PedidoSemCorpo,
  type RespostaAtividadeAplicada,
  type RespostaAtividadeEncerrada,
  type RespostaCorrecaoDoLote,
  type RespostaDestaqueAberto,
  type RespostaListaDeAtividadesAplicadas,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { AtividadeAplicadaService } from './atividade-aplicada.service.js'
import { CorrecaoService } from '../correcao/correcao.service.js'

/**
 * `/v1/atividades-aplicadas`, o lado da professora (MVP, A3): aplicar, listar, encerrar, ler a correção do lote e abrir
 * destaque. Todas as células são `turma_vinculada`, só do professor: coordenação e aluno são recusados pela guarda. O
 * corpo e a consulta passam pelo contrato estrito (escola, ano ou pessoa no corpo é `ENTRADA_INVALIDA`), e o id fora do
 * formato responde como o inexistente. A correção nomeia alunos e tem o gabarito: toda leitura sai com `no-store`. A
 * entrada passa pelo `ZodValidationPipe` e pelo `IdPipe` no parâmetro (17.0).
 */
@Controller('v1/atividades-aplicadas')
export class AtividadeAplicadaController {
  constructor(
    private readonly atividades: AtividadeAplicadaService,
    private readonly correcoes: CorrecaoService,
  ) {}

  @Post()
  @Permite('atividade_aplicada', 'aplicar')
  aplicar(@Body(new ZodValidationPipe(esquemaPedidoAplicarAtividade)) pedido: PedidoAplicarAtividade): Promise<RespostaAtividadeAplicada> {
    return this.atividades.aplicar(pedido)
  }

  @Get()
  @Permite('atividade_aplicada', 'listar')
  @Header('Cache-Control', 'no-store')
  listar(@Query(new ZodValidationPipe(esquemaConsultaAtividadesAplicadas)) consulta: ConsultaAtividadesAplicadas): Promise<RespostaListaDeAtividadesAplicadas> {
    return this.atividades.listar(consulta)
  }

  @Post(':id/encerrar')
  @Permite('atividade_aplicada', 'encerrar')
  @HttpCode(HttpStatus.OK)
  encerrar(@Param('id', IdPipe) atividadeAplicadaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEncerrada> {
    return this.atividades.encerrar(atividadeAplicadaId)
  }

  @Get(':id/correcao')
  @Permite('correcao', 'ler')
  @Header('Cache-Control', 'no-store')
  correcao(@Param('id', IdPipe) atividadeAplicadaId: string): Promise<RespostaCorrecaoDoLote> {
    return this.correcoes.ler(atividadeAplicadaId)
  }

  @Post(':id/correcao/destaques/:alunoId/abrir')
  @Permite('correcao', 'abrir_destaque')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  abrirDestaque(
    @Param('id', IdPipe) atividadeAplicadaId: string,
    @Param('alunoId', IdPipe) aluno: string,
    @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo,
  ): Promise<RespostaDestaqueAberto> {
    return this.correcoes.abrirDestaque(atividadeAplicadaId, aluno)
  }
}
