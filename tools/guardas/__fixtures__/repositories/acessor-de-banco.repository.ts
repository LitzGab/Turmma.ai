import { type Banco } from '@educa/nucleo'
import { aluno } from './tabelas.js'

// O banco devolvido por um acessor (ou por um método) também é o banco: `this.conexao` é a porta de entrada.
export class AcessorDeBancoRepository {
  get conexao(): Banco {
    return criarBanco()
  }

  async usar() { // reprova: sem-prova-de-escopo
    return this.conexao.select().from(aluno)
  }
}
