import { type Banco } from '@educa/nucleo'
import { aluno } from './tabelas.js'

// A cópia local de `exigirEscolaDoContexto` não é a função que lê o contexto: só a importada vale.
function exigirEscolaDoContexto(): string {
  return 'qualquer-escola'
}

export class CopiaLocalRepository {
  constructor(private readonly banco: Banco) {}

  async listar() { // reprova: sem-prova-de-escopo
    const escolaId = exigirEscolaDoContexto()
    return this.banco.select().from(aluno).where(escolaId)
  }
}
