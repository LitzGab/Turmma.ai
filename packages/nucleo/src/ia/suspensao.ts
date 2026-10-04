import type { ChaveDeFuncao } from '@educa/shared'
import { ErroDeIa } from './erros.js'

/**
 * A escola pode suspender **uma função** de IA sem desligar as outras (D60): suspende a correção automática e o chat
 * do professor continua. A suspensão vale no servidor, e é esta porta que responde, a cada execução, se a função
 * está suspensa naquela escola agora. A implementação em Postgres lê `suspensao_de_funcao`, com `escola_id` na cláusula.
 */
export interface SuspensaoDeFuncao {
  estaSuspensa(escolaId: string, funcao: ChaveDeFuncao): Promise<boolean>
}

/**
 * A conferência, num ponto só. O `LLMProvider` a faz antes de qualquer chamada de modelo; o domínio a chama onde a
 * função roda **sem** modelo — a correção de objetiva é uma conta, e é função suspensível como as outras.
 *
 * Sem conseguir consultar, não executa: a falha da consulta fecha a porta (`IA_INDISPONIVEL`), não abre.
 */
export async function exigirFuncaoAtiva(suspensao: SuspensaoDeFuncao, escolaId: string, funcao: ChaveDeFuncao): Promise<void> {
  let suspensa: boolean
  try {
    suspensa = await suspensao.estaSuspensa(escolaId, funcao)
  } catch {
    throw new ErroDeIa('IA_INDISPONIVEL')
  }
  if (suspensa) throw new ErroDeIa('FUNCAO_SUSPENSA')
}

/** Suspensões em memória, para teste. */
export class SuspensoesEmMemoria implements SuspensaoDeFuncao {
  private readonly suspensas = new Set<string>()

  suspender(escolaId: string, funcao: ChaveDeFuncao): void {
    this.suspensas.add(`${escolaId}:${funcao}`)
  }

  retomar(escolaId: string, funcao: ChaveDeFuncao): void {
    this.suspensas.delete(`${escolaId}:${funcao}`)
  }

  async estaSuspensa(escolaId: string, funcao: ChaveDeFuncao): Promise<boolean> {
    return this.suspensas.has(`${escolaId}:${funcao}`)
  }
}
