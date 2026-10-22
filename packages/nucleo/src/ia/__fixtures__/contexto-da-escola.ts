import { contextoAtual, executarNoContexto } from '../../contexto/contexto.js'
import type { LLMProvider, PedidoDeGeracao, ResultadoDaGeracao } from '../porta.js'

/**
 * O provedor rodando no contexto da escola do pedido, como a requisição ou a execução em segundo plano o dão em
 * produção (a `GuardaDeSessao`, o `executarNoContexto` do agendador). É para o teste de unidade que não trata de
 * isolamento: as portas de suspensão, orçamento e consumo leem a escola do contexto e, sem ela, recusam (8.0).
 *
 * Contexto que já traz escola é respeitado, sem trocá-lo: o teste que põe a escola A no contexto e pede em nome da B
 * continua provando a recusa do provedor. O teste do que acontece **sem** contexto usa o provedor sem este envelope.
 *
 * **Não use em teste que prova escopo ou isolamento** (regra 10, item 5): o envelope monta o contexto a partir de
 * `pedido.escolaId`, que é justamente o que esse teste precisa deixar de dar por certo. Ali, o contexto é explícito
 * (`executarNoContexto`) ou ausente (`semContexto`).
 */
export function comContextoDaEscolaDoPedido<Provedor extends LLMProvider>(ia: Provedor): Provedor {
  const envolvido = Object.create(ia) as Provedor
  envolvido.gerar = <Entrada, Saida>(pedido: PedidoDeGeracao<Entrada, Saida>): Promise<ResultadoDaGeracao<Saida>> =>
    contextoAtual()?.escolaId === undefined ? executarNoContexto({ requisicaoId: 'teste-de-unidade', escolaId: pedido.escolaId }, () => ia.gerar(pedido)) : ia.gerar(pedido)
  return envolvido
}
