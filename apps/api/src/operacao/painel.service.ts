import { contextoAtual, ErroDeDominio, executarNoContexto, exigirOperadorDoContexto, type Banco } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaRespostaCriadoNoPainel,
  esquemaRespostaRedesDoPainel,
  type PedidoCriarEscola,
  type PedidoCriarRede,
  type RespostaCriadoNoPainel,
  type RespostaRedesDoPainel,
} from '@educa/shared'
import { Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { criarEscola, criarRede } from '../ops/escola.js'
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

/**
 * O painel da operação (A0b, D76): o operador cria rede e escola pelos mesmos casos de uso do `ops:escola`, com o id
 * sorteado pela web (o clique duplo devolve o mesmo id, sem criar outra), e lê as redes.
 *
 * - A auditoria (`rede.criada`, `escola.criada`) leva o apelido do operador da sessão, conferido na transação.
 * - O log leva só o evento e os ids do contexto (`operacao.rede.criada`, `operacao.escola.criada`, com a escola): nunca
 *   nome nem endereço. O pedido repetido não loga de novo, como não audita de novo.
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
    if (criada.nova) {
      executarNoContexto({ ...(contextoAtual() ?? { requisicaoId: randomUUID() }), escolaId: criada.id }, () => this.#logger.log('operacao.escola.criada'))
    }
    return esquemaRespostaCriadoNoPainel.parse({ id: criada.id })
  }
}
