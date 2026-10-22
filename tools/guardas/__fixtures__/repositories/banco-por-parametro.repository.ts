import { exigirEscolaDoContexto, type TransacaoBanco } from '@educa/nucleo'
import { aluno } from './tabelas.js'

// O banco também chega por parâmetro (`tx: TransacaoBanco`).
export class BancoPorParametroRepository {
  async listar(tx: TransacaoBanco) { // reprova: sem-prova-de-escopo
    return tx.select().from(aluno)
  }

  async listarNaEscola(tx: TransacaoBanco) {
    return tx.select().from(aluno).where(exigirEscolaDoContexto())
  }
}
