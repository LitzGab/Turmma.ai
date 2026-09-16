import type { PapelDeUsuario } from '@educa/shared'
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * O que identifica a requisição em toda linha de log e em todo erro. Só ids: nada aqui pode
 * ser nome, matrícula ou qualquer outro dado de pessoa (regra 20, item 9).
 *
 * Na API, `escolaId`, `usuarioId`, `papel`, `sessaoId` e `anoLetivoId` vêm da sessão gravada, lida pela
 * `GuardaDeSessao` (identidade/guarda-sessao.ts) com o token verificado. Nunca do corpo, da query ou de
 * cabeçalho enviado pelo cliente (regra 10).
 */
export interface ContextoDaRequisicao {
  readonly requisicaoId: string
  readonly escolaId?: string
  readonly usuarioId?: string
  /** O papel do usuário na escola da sessão. */
  readonly papel?: PapelDeUsuario
  readonly sessaoId?: string
  /** O ano letivo `em_curso` da escola, lido junto com a sessão; `null` quando a escola não tem ano em curso. */
  readonly anoLetivoId?: string | null
  /**
   * Rotina nossa, sem escola: job `sistema.*` no worker ou no agendador. Nunca nasce de requisição
   * HTTP (o middleware não o preenche), então um contexto sem escola de uma rota anônima não
   * alcança nem os jobs de sistema.
   */
  readonly rotinaDoSistema?: true
}

type ContextoGravavel = { -readonly [Campo in keyof ContextoDaRequisicao]: ContextoDaRequisicao[Campo] }

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

function contextoAindaSemIdentidade(): ContextoGravavel {
  const contexto = armazenamento.getStore() as ContextoGravavel | undefined
  if (contexto === undefined) throw new Error('contexto da requisição ausente')
  if (contexto.escolaId !== undefined || contexto.usuarioId !== undefined || contexto.sessaoId !== undefined) {
    throw new Error('identidade do contexto já definida')
  }
  return contexto
}

/**
 * Grava a escola e o usuário do token no contexto, sem sessão. Só o handshake do realtime ainda usa, até a
 * tarefa 3.0 passar a ler a sessão também lá; a API grava pela `definirSessaoNoContexto`. Só vale uma vez, e
 * sem contexto falha fechada.
 */
export function definirIdentidadeNoContexto(identidade: { escolaId: string; usuarioId: string }): void {
  const contexto = contextoAindaSemIdentidade()
  contexto.escolaId = identidade.escolaId
  contexto.usuarioId = identidade.usuarioId
}

/** A sessão válida que a `GuardaDeSessao` leu do banco. */
export interface SessaoDaRequisicao {
  readonly escolaId: string
  readonly usuarioId: string
  readonly papel: PapelDeUsuario
  readonly sessaoId: string
  readonly anoLetivoId: string | null
}

/**
 * Grava a sessão lida do banco no contexto da requisição em andamento: escola, usuário, papel, sessão e ano letivo
 * em curso. É o único jeito de escrevê-los depois que o contexto existe, e só vale uma vez: nenhum código que rode
 * depois da guarda consegue trocar o escopo. Sem contexto, ou com identidade já gravada, falha fechada.
 */
export function definirSessaoNoContexto(sessao: SessaoDaRequisicao): void {
  const contexto = contextoAindaSemIdentidade()
  contexto.escolaId = sessao.escolaId
  contexto.usuarioId = sessao.usuarioId
  contexto.papel = sessao.papel
  contexto.sessaoId = sessao.sessaoId
  contexto.anoLetivoId = sessao.anoLetivoId
}

