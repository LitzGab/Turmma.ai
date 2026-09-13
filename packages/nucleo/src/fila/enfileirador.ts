import type { Fila } from '@educa/shared'
import type { TransacaoBanco } from '../db/banco.js'
import type { JobRegistroRepository } from './job-registro.repository.js'

/** A prioridade vem só da fila: 1 é a mais urgente. */
export const PRIORIDADE_DA_FILA: Readonly<Record<Fila, number>> = { interativa: 1, normal: 2, lote: 3 }

export interface PedidoDeJob {
  tipo: string
  fila: Fila
  /** Só id e parâmetro técnico. Nome, resposta ou conteúdo de aluno nunca entram num job (regra 20). */
  dados: Record<string, unknown>
  naoUrgente: boolean
}

/**
 * Porta de entrada de todo trabalho demorado (regra 00, item 4). Grava na transação de quem pede,
 * então o job existe se, e somente se, o que o originou foi gravado. A escola e o `requisicaoId`
 * vêm do contexto, nunca do pedido.
 *
 * Nada vai ao Redis aqui: quem publica é o despachante. Com o Redis de fila fora, o pedido continua
 * sendo aceito.
 */
export class Enfileirador {
  constructor(private readonly repositorio: JobRegistroRepository) {}

  enfileirar(tx: TransacaoBanco, pedido: PedidoDeJob): Promise<string> {
    return this.repositorio.inserir(tx, { ...pedido, prioridade: PRIORIDADE_DA_FILA[pedido.fila] })
  }
}
