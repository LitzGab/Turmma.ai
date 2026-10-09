import { LimiteDaBuscaDeTitulares, Permite } from '@educa/nucleo'
import {
  esquemaBuscaDeTitulares,
  esquemaCorrecaoDeNome,
  esquemaPedidoSemCorpo,
  esquemaRegistroDePedido,
  type RespostaBuscaDeTitulares,
  type RespostaIncidentes,
  type RespostaPedidos,
  type RespostaPreviaDoTitular,
  type RespostaRetencao,
  type RespostaSuboperadores,
  type PedidoDoTitular,
} from '@educa/shared'
import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common'
import { idDoCaminho, lerConsultaPaginada, lerEntrada } from '../estrutura/entrada.js'
import { PrivacidadeService } from './privacidade.service.js'

/**
 * `/v1/privacidade` (F3; Tech Spec do F3, seção 4): **só da coordenação**, que chega aqui só depois do segundo fator.
 * Professor e aluno recebem da guarda a resposta do inexistente; a rede, que ainda não tem usuário (F14), tem `nunca`
 * na matriz. O escopo é a escola do token.
 */
@Controller('v1/privacidade')
export class PrivacidadeController {
  constructor(private readonly privacidade: PrivacidadeService) {}

  /** Por quanto tempo a escola guarda cada dado: as categorias, com o prazo que vale e de onde vem, e os prazos fixos. */
  @Get('retencao')
  @Permite('privacidade_retencao', 'ler')
  @Header('Cache-Control', 'no-store')
  retencao(): Promise<RespostaRetencao> {
    return this.privacidade.retencao()
  }

  /** As empresas que recebem dado da escola: vigentes e passadas, com o que fazem, onde processam e o que recebem. */
  @Get('suboperadores')
  @Permite('privacidade_suboperadores', 'ler')
  @Header('Cache-Control', 'no-store')
  suboperadores(): Promise<RespostaSuboperadores> {
    return this.privacidade.suboperadores()
  }

  /** Os incidentes de segurança que afetaram a escola, só a seção dela: os sem confirmação primeiro, com o prazo legal dela em texto fixo. */
  @Get('incidentes')
  @Permite('privacidade_incidentes', 'ler')
  @Header('Cache-Control', 'no-store')
  incidentes(): Promise<RespostaIncidentes> {
    return this.privacidade.incidentes()
  }

  /**
   * A coordenação confirma que recebeu o aviso. Quem e quando ficam na seção da escola; confirmar de novo não muda nada e responde
   * igual. O id de outra escola, o inexistente e o que nem é um id respondem o mesmo `NAO_ENCONTRADO` (regra 10, item 6).
   */
  @Post('incidentes/:id/confirmar')
  @Permite('privacidade_incidentes', 'confirmar')
  @HttpCode(HttpStatus.NO_CONTENT)
  confirmarIncidente(@Param('id') id: string, @Body() corpo: unknown): Promise<void> {
    lerEntrada(esquemaPedidoSemCorpo, corpo)
    return this.privacidade.confirmarIncidente(idDoCaminho(id))
  }

  /**
   * A coordenação acha o titular antes de registrar o pedido (F3, RF10): até 20 resultados com nome, papel, matrícula,
   * turmas e disciplinas. O termo vai no corpo e nunca a log nem à auditoria; o limite próprio `rl:busca-titular` é
   * 30 por minuto por usuário, além do limite do F0 (`@LimiteDaBuscaDeTitulares`). Só quem é `usuario` da escola é
   * achado: o aluno que só está na lista de nomes é atendido pela lista da turma (A1).
   */
  @Post('titulares/busca')
  @Permite('privacidade_titulares', 'buscar')
  @LimiteDaBuscaDeTitulares()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  buscarTitulares(@Body() corpo: unknown): Promise<RespostaBuscaDeTitulares> {
    return this.privacidade.buscaDeTitulares(lerEntrada(esquemaBuscaDeTitulares, corpo).termo)
  }

  /**
   * A prévia do titular, antes de o pedido existir (F3, RF10 e RF11; D64): o aluno traz a contagem por categoria; o
   * professor, só as categorias de cadastro e vínculo, sem contagem e sem período. Auditada, e igual para quem usou e
   * para quem não usou a IA. O titular de outra escola, o de quem pediu e o inexistente respondem como o id de ninguém.
   */
  @Get('titulares/:id/previa')
  @Permite('privacidade_titulares', 'previa')
  @Header('Cache-Control', 'no-store')
  previaDoTitular(@Param('id') id: string): Promise<RespostaPreviaDoTitular> {
    return this.privacidade.previaDoTitular(idDoCaminho(id))
  }

  /**
   * O registro do pedido do titular (F3, RF10). A chave de envio decide primeiro: a mesma chave, com o mesmo conteúdo
   * e da mesma coordenação, devolve sempre o mesmo pedido, e só quem gravou registra o passo. O pedido sobre a própria
   * pessoa (mesma `conta_id` de quem pediu) responde como inexistente.
   */
  @Post('pedidos')
  @Permite('privacidade_pedidos', 'registrar')
  @Header('Cache-Control', 'no-store')
  registrarPedido(@Body() corpo: unknown): Promise<PedidoDoTitular> {
    return this.privacidade.registrarPedido(lerEntrada(esquemaRegistroDePedido, corpo))
  }

  /** A página de pedidos da escola, com nome e turma enquanto o titular existe e "Titular eliminado" depois. */
  @Get('pedidos')
  @Permite('privacidade_pedidos', 'listar')
  @Header('Cache-Control', 'no-store')
  pedidos(@Query() consulta: unknown): Promise<RespostaPedidos> {
    return this.privacidade.pedidos(lerConsultaPaginada(consulta))
  }

  /** O detalhe do pedido, com a foto do compartilhamento, `nomeTrocado` e `homonimo`. */
  @Get('pedidos/:id')
  @Permite('privacidade_pedidos', 'ler')
  @Header('Cache-Control', 'no-store')
  pedido(@Param('id') id: string): Promise<PedidoDoTitular> {
    return this.privacidade.pedido(idDoCaminho(id))
  }

  /** O fim do atendimento do pedido de acesso, portabilidade, compartilhamento ou correção. O clique duplo decide no banco. */
  @Post('pedidos/:id/concluir')
  @Permite('privacidade_pedidos', 'concluir')
  @HttpCode(HttpStatus.NO_CONTENT)
  concluirPedido(@Param('id') id: string, @Body() corpo: unknown): Promise<void> {
    lerEntrada(esquemaPedidoSemCorpo, corpo)
    return this.privacidade.concluirPedido(idDoCaminho(id))
  }

  /** A correção do nome do titular, só em pedido de correção aberto, auditada sem o nome. */
  @Post('pedidos/:id/corrigir-nome')
  @Permite('privacidade_pedidos', 'corrigir_nome')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Header('Cache-Control', 'no-store')
  corrigirNome(@Param('id') id: string, @Body() corpo: unknown): Promise<void> {
    return this.privacidade.corrigirNomeDoPedido(idDoCaminho(id), lerEntrada(esquemaCorrecaoDeNome, corpo).nome)
  }
}
