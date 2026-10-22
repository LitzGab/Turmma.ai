import { Marcador, Outro, type Banco } from '@educa/nucleo'
import { aluno } from './tabelas.js'

// Decorator que não é o `@SemEscopo` importado (com ou sem chamada) não prova nada.
export class OutrosDecoratorsRepository {
  constructor(private readonly banco: Banco) {}

  @Marcador
  async semChamada() { // reprova: sem-prova-de-escopo
    return this.banco.select().from(aluno)
  }

  @Outro('um texto de mais de trinta caracteres, mas de outro decorator')
  async comOutro() { // reprova: sem-prova-de-escopo
    return this.banco.select().from(aluno)
  }
}
