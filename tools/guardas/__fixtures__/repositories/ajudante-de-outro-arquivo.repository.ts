import { type Banco } from '@educa/nucleo'
import { escopoDaConsulta } from './escopo.js'
import { aluno } from './tabelas.js'

// O ajudante de outro arquivo pode até chamar `exigirEscolaDoContexto`, mas a guarda não o segue.
export class AjudanteDeOutroArquivoRepository {
  constructor(private readonly banco: Banco) {}

  async listar() { // reprova: sem-prova-de-escopo
    return this.banco.select().from(aluno).where(escopoDaConsulta())
  }
}
