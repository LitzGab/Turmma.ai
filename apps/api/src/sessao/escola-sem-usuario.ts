import { contextoAtual, executarNoContexto } from '@educa/nucleo'
import { randomUUID } from 'node:crypto'

/**
 * Roda `funcao` num contexto que tem só a escola, sem usuário (Tech Spec, seção 1, "Antes do contexto"): a escola que
 * a `ResolucaoDeTenantRepository` achou pelo slug, nunca uma escola vinda do cliente. Os repositories com escopo leem
 * a escola daqui, e a requisição continua com o mesmo `requisicaoId`.
 */
export function naEscolaSemUsuario<T>(escolaId: string, funcao: () => Promise<T>): Promise<T> {
  return executarNoContexto({ requisicaoId: contextoAtual()?.requisicaoId ?? randomUUID(), escolaId }, funcao)
}
