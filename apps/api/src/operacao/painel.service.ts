import { contextoAtual, ErroDeDominio, executarNoContexto, exigirOperadorDoContexto, type Banco } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaRespostaConviteDaCoordenacao,
  esquemaRespostaCriadoNoPainel,
  esquemaRespostaRedesDoPainel,
  type PedidoConviteDaCoordenacao,
  type PedidoCriarEscola,
  type PedidoCriarRede,
  type RespostaConviteDaCoordenacao,
  type RespostaCriadoNoPainel,
  type RespostaRedesDoPainel,
} from '@educa/shared'
import { Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { criarEscola, criarRede } from '../ops/escola.js'
import { criarConviteDeCoordenador, revogarConvitePeloOperador } from '../sessao/convite.service.js'
import { OperadorRepository, type ConferenciaDoAutor } from './operador.repository.js'
import { PainelRepository } from './painel.repository.js'

/**
 * O autor das escritas do painel: o operador da sessão, conferido dentro da transação da escrita (Tech Spec da A0b,
 * seção 7c, "Autor ativo"). Desativado entre a guarda e aqui, ou enquanto a escrita esperava a linha dele: a sessão
 * acabou de terminar, e nada é gravado. O corpo do pedido nunca chega aqui.
 */
function autorDaSessao(operadorId: string): ConferenciaDoAutor {
  return async (tx) => {
    const apelido = await OperadorRepository.autorAtivoNaTransacao(tx, { operadorId })
    if (apelido === undefined) throw new ErroDeDominio(CodigoDeErro.SESSAO_ENCERRADA)
    return apelido
  }
}

/** Roda `logar` com a escola no contexto, além dos ids da requisição: a linha de log leva só ids (regra 20, item 9). */
function naEscola(escolaId: string, logar: () => void): void {
  executarNoContexto({ ...(contextoAtual() ?? { requisicaoId: randomUUID() }), escolaId }, logar)
}

/**
 * O painel da operação (A0b, D76): o operador cria rede e escola pelos mesmos casos de uso do `ops:escola`, com o id
 * sorteado pela web (o clique duplo devolve o mesmo id, sem criar outra), lê as redes, e gera e revoga o convite da
 * coordenação pelos mesmos casos de uso do `ops:convite-coordenador` e do `ops:revogar-convite`.
 *
 * - A auditoria (`rede.criada`, `escola.criada`, `convite.criado`, `convite.revogado`) leva o apelido do operador da
 *   sessão, conferido na transação.
 * - O log leva só o evento e os ids do contexto (`operacao.rede.criada`, `operacao.escola.criada`,
 *   `operacao.convite.gerado` e `operacao.convite.revogado`, com a escola): nunca nome, e-mail, endereço nem token. O
 *   pedido repetido não loga de novo, como não audita de novo.
 * - A escola do `:id` do caminho (que o controller só confere como UUID) vai só ao caso de uso do gerar, que abre o
 *   contexto dela depois de conferir o autor (Tech Spec da A0b, seção 6).
 */
export class PainelService {
  readonly #logger = new Logger('operacao')

  constructor(private readonly banco: Banco) {}

  async redes(): Promise<RespostaRedesDoPainel> {
    return esquemaRespostaRedesDoPainel.parse({ itens: await new PainelRepository(this.banco).redes() })
  }

  async criarRede(pedido: PedidoCriarRede): Promise<RespostaCriadoNoPainel> {
    const autor = autorDaSessao(exigirOperadorDoContexto())
    const criada = await criarRede(this.banco, autor, { id: pedido.id.toLowerCase(), nome: pedido.nome, tipo: pedido.tipo })
    if (criada.nova) this.#logger.log('operacao.rede.criada')
    return esquemaRespostaCriadoNoPainel.parse({ id: criada.id })
  }

  async criarEscola(pedido: PedidoCriarEscola): Promise<RespostaCriadoNoPainel> {
    const autor = autorDaSessao(exigirOperadorDoContexto())
    const criada = await criarEscola(this.banco, autor, { id: pedido.id.toLowerCase(), redeId: pedido.redeId.toLowerCase(), nome: pedido.nome, slug: pedido.slug })
    if (criada.nova) naEscola(criada.id, () => this.#logger.log('operacao.escola.criada'))
    return esquemaRespostaCriadoNoPainel.parse({ id: criada.id })
  }

  /** Gera o convite da primeira coordenação da escola do `:id`, pela matriz da seção 5. O token sai só nesta resposta. */
  async gerarConvite(escolaId: string, pedido: PedidoConviteDaCoordenacao): Promise<RespostaConviteDaCoordenacao> {
    const autor = autorDaSessao(exigirOperadorDoContexto())
    const gerado = await criarConviteDeCoordenador(this.banco, autor, { escolaId, email: pedido.email, nome: pedido.nome })
    naEscola(escolaId, () => this.#logger.log('operacao.convite.gerado'))
    return esquemaRespostaConviteDaCoordenacao.parse(gerado)
  }

  /** Revoga o convite da coordenação pelo id, pela matriz da seção 5; a escola vem do convite. */
  async revogarConvite(conviteId: string): Promise<void> {
    const autor = autorDaSessao(exigirOperadorDoContexto())
    const { escolaId } = await revogarConvitePeloOperador(this.banco, autor, conviteId)
    naEscola(escolaId, () => this.#logger.log('operacao.convite.revogado'))
  }
}
