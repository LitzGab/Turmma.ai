import { exigirEscolaDoContexto as escolaDaVez, identidadeDaRequisicao as quemPede, type Banco } from '@educa/nucleo'
import { aluno } from './tabelas.js'

// O alias conta: o que vale é o nome exportado.
export class ImportComAliasRepository {
  constructor(private readonly banco: Banco) {}

  async daEscola() {
    return this.banco.select().from(aluno).where(escolaDaVez())
  }

  async doUsuario() {
    return this.banco.select().from(aluno).where(quemPede().usuarioId)
  }
}
