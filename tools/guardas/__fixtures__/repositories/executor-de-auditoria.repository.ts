import { type ExecutorDeAuditoria } from '@educa/nucleo'
import { aluno } from './tabelas.js'

// O banco ou a transação de quem chama, pelo tipo do executor de auditoria.
export class ExecutorDeAuditoriaRepository {
  constructor(private readonly executor: ExecutorDeAuditoria) {}

  async listar() { // reprova: sem-prova-de-escopo
    return this.executor.select().from(aluno)
  }
}
