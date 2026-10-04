import { ErroDeDominio, Permite } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaChaveDeFuncao,
  esquemaConsultaConsumo,
  esquemaConsultaResumoDaGovernanca,
  esquemaPedidoSemCorpo,
  esquemaPedidoSuspenderFuncao,
  type ChaveDeFuncao,
  type RespostaConsumo,
  type RespostaFuncaoDaGovernanca,
  type RespostaFuncoesDaGovernanca,
  type RespostaResumoDaGovernanca,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { lerEntrada } from '../estrutura/entrada.js'
import { GovernancaService } from './governanca.service.js'

/** A `:chave` da rota. Fora do catálogo, nenhuma função existe assim: responde como o inexistente (regra 10, item 6). */
function chaveDoCaminho(chave: string): ChaveDeFuncao {
  const lida = esquemaChaveDeFuncao.safeParse(chave)
  if (!lida.success) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  return lida.data
}

/**
 * `/v1/governanca` (MVP, A5): a governança de IA, **só da coordenação**. Professor, aluno e rede recebem da guarda a
 * resposta do inexistente. As consultas são estritas: não existe filtro, ordenação nem agrupamento por professor, por
 * turma ou por pessoa (D45, D64), e mandar um é `ENTRADA_INVALIDA`.
 */
@Controller('v1/governanca')
export class GovernancaController {
  constructor(private readonly governanca: GovernancaService) {}

  @Get('resumo')
  @Permite('governanca', 'ler_resumo')
  @Header('Cache-Control', 'no-store')
  resumo(@Query() consulta: unknown): Promise<RespostaResumoDaGovernanca> {
    return this.governanca.resumo(lerEntrada(esquemaConsultaResumoDaGovernanca, consulta))
  }

  @Get('funcoes')
  @Permite('governanca', 'ler_funcoes')
  @Header('Cache-Control', 'no-store')
  funcoes(): Promise<RespostaFuncoesDaGovernanca> {
    return this.governanca.funcoes()
  }

  @Post('funcoes/:chave/suspender')
  @Permite('governanca', 'suspender_funcao')
  @HttpCode(HttpStatus.OK)
  suspender(@Param('chave') chave: string, @Body() corpo: unknown): Promise<RespostaFuncaoDaGovernanca> {
    return this.governanca.suspender(chaveDoCaminho(chave), lerEntrada(esquemaPedidoSuspenderFuncao, corpo))
  }

  @Post('funcoes/:chave/retomar')
  @Permite('governanca', 'retomar_funcao')
  @HttpCode(HttpStatus.OK)
  retomar(@Param('chave') chave: string, @Body() corpo: unknown): Promise<RespostaFuncaoDaGovernanca> {
    const funcao = chaveDoCaminho(chave)
    lerEntrada(esquemaPedidoSemCorpo, corpo)
    return this.governanca.retomar(funcao)
  }

  @Get('consumo')
  @Permite('governanca', 'ler_consumo')
  @Header('Cache-Control', 'no-store')
  consumo(@Query() consulta: unknown): Promise<RespostaConsumo> {
    return this.governanca.consumo(lerEntrada(esquemaConsultaConsumo, consulta))
  }
}
