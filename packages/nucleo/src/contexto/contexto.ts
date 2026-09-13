import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * O que identifica a requisição em toda linha de log e em todo erro. Só ids: nada aqui pode
 * ser nome, matrícula ou qualquer outro dado de pessoa (regra 20, item 9).
 *
 * `escolaId` e `usuarioId` vêm do token verificado, e quem os preenche é a autenticação
 * (tarefa 4.0). Nunca do corpo, da query ou de cabeçalho enviado pelo cliente (regra 10).
 */
export interface ContextoDaRequisicao {
  readonly requisicaoId: string
  escolaId?: string
  usuarioId?: string
}

export const CABECALHO_REQUISICAO_ID = 'x-requisicao-id'

const armazenamento = new AsyncLocalStorage<ContextoDaRequisicao>()

// Qualquer versão de UUID, na forma canônica. Nada além de hexadecimal e hífen chega ao log.
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Aceita o id do cliente só se for UUID, para uma requisição poder ser seguida desde a web.
 * Qualquer outra coisa é trocada por um id novo: texto livre do cliente não entra no log.
 */
export function resolverRequisicaoId(cabecalho: string | string[] | undefined): string {
  if (typeof cabecalho === 'string' && FORMATO_UUID.test(cabecalho)) {
    return cabecalho.toLowerCase()
  }
  return randomUUID()
}

/** Executa `funcao` com o contexto disponível em todo código assíncrono que ela disparar. */
export function executarNoContexto<T>(contexto: ContextoDaRequisicao, funcao: () => T): T {
  return armazenamento.run(contexto, funcao)
}

/** O contexto da requisição em andamento, ou `undefined` fora de uma (boot, rotina interna). */
export function contextoAtual(): ContextoDaRequisicao | undefined {
  return armazenamento.getStore()
}

/**
 * Middleware HTTP que abre o contexto antes de qualquer outro código da requisição. Precisa
 * ser o primeiro registrado, para o log e o filtro de erro sempre encontrarem o `requisicaoId`.
 */
export function middlewareDeContexto(requisicao: IncomingMessage, _resposta: ServerResponse, proximo: () => void): void {
  const contexto: ContextoDaRequisicao = {
    requisicaoId: resolverRequisicaoId(requisicao.headers[CABECALHO_REQUISICAO_ID]),
  }
  executarNoContexto(contexto, proximo)
}
