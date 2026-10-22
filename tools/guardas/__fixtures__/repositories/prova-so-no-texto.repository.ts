import { exigirEscolaDoContexto } from '@educa/nucleo'
import { type Banco } from '@educa/nucleo'
import { aluno } from './tabelas.js'

// A função está importada, mas a chamada só aparece em comentário e em texto: não é prova.
export class ProvaSoNoTextoRepository {
  constructor(private readonly banco: Banco) {}

  async emComentario() { // reprova: sem-prova-de-escopo
    // exigirEscolaDoContexto()
    /* exigirEscolaDoContexto() */
    return this.banco.select().from(aluno)
  }

  async emTexto() { // reprova: sem-prova-de-escopo
    const aviso = 'exigirEscolaDoContexto()'
    const modelo = `${aviso} exigirEscolaDoContexto()`
    return this.banco.select().from(aluno).where(modelo)
  }
}
void exigirEscolaDoContexto
