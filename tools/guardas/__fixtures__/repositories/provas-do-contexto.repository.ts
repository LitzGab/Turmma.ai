import { escopoDoJobNoContexto, identidadeDaRequisicao, type Banco } from '@educa/nucleo'
import { job } from './tabelas.js'

// Cada uma das outras duas provas vale sozinha.
export class ProvasDoContextoRepository {
  constructor(private readonly banco: Banco) {}

  async soIdentidade() {
    const { usuarioId } = identidadeDaRequisicao()
    return this.banco.select().from(job).where(usuarioId)
  }

  async soEscopoDoJob() {
    return this.banco.select().from(job).where(escopoDoJobNoContexto())
  }
}
