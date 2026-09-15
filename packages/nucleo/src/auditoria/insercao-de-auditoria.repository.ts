import { contextoAtual } from '../contexto/contexto.js'
import { auditoria } from '../db/schema/auditoria.js'
import { AuditoriaRecusada } from './auditoria-recusada.js'
import type { ExecutorDeAuditoria } from './auditoria.repository.js'

/** O que o registro já conferiu e manda gravar. Escola e requisição vêm do contexto, aqui dentro. */
export interface LinhaNovaDeAuditoria {
  acao: string
  entidade: string
  entidadeId: string
  autorUsuarioId: string | null
  autorOperador: string | null
  antes: Record<string, unknown> | null
  depois: Record<string, unknown> | null
  finalidade: string | null
}

/**
 * O único `insert` em `auditoria` do sistema, e ele não confere nada: quem confere é o
 * `RegistroDeAuditoria`, o único que importa este módulo. Fica fora do `index.ts` do pacote de propósito,
 * e um teste varre o código atrás de outra escrita na tabela.
 *
 * Grava na escola do contexto, com o `requisicaoId` dele. Sem escola no contexto, a linha sai com escola
 * nula, e o check `auditoria_escola_ou_rede_pelo_operador` só a aceita para a rede criada pelo operador.
 */
export async function inserirAuditoria(executor: ExecutorDeAuditoria, linha: LinhaNovaDeAuditoria): Promise<void> {
  const contexto = contextoAtual()
  if (contexto === undefined) throw new AuditoriaRecusada('sem_contexto')
  await executor.insert(auditoria).values({ ...linha, escolaId: contexto.escolaId ?? null, requisicaoId: contexto.requisicaoId })
}
