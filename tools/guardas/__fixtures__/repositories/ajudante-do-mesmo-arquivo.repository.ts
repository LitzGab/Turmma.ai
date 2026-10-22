import { exigirEscolaDoContexto, type Banco } from '@educa/nucleo'
import { aluno } from './tabelas.js'

function escopoDoArquivo(): string {
  return exigirEscolaDoContexto()
}

const escopoDeSeta = () => exigirEscolaDoContexto()
const escopoDeExpressao = function () {
  return exigirEscolaDoContexto()
}

function ajudanteComThis(this: AjudanteDoMesmoArquivoRepository) {
  return this.viaSeta()
}

// A prova pode estar num ajudante do mesmo arquivo: método privado, função de topo, ou os dois encadeados.
export class AjudanteDoMesmoArquivoRepository {
  constructor(private readonly banco: Banco) {}

  async viaMetodoPrivado() {
    return this.#lerNaEscola()
  }

  async viaFuncaoDeTopo() {
    return this.banco.select().from(aluno).where(escopoDoArquivo())
  }

  async viaOsDoisEncadeados() {
    return this.#intermediario()
  }

  async viaSeta() {
    return this.banco.select().from(aluno).where(escopoDeSeta())
  }

  async viaExpressao() {
    return this.banco.select().from(aluno).where(escopoDeExpressao())
  }

  async viaFuncaoComThis() {
    return ajudanteComThis()
  }

  async viaCicloDeAjudantes() {
    return this.#cicloA()
  }

  async viaOutroObjeto(outro: { viaMetodoPrivado(): Promise<unknown> }) { // reprova: sem-prova-de-escopo
    await outro.viaMetodoPrivado()
    return this.banco.select().from(aluno)
  }

  async viaAjudanteSemProva() { // reprova: sem-prova-de-escopo
    return this.#lerSemEscola()
  }

  #cicloA(): unknown {
    return this.#cicloB()
  }

  #cicloB(): unknown {
    this.#cicloA()
    return this.banco.select().from(aluno).where(exigirEscolaDoContexto())
  }

  #lerNaEscola() {
    return this.banco.select().from(aluno).where(this.#escola())
  }

  #intermediario() {
    return this.#lerNaEscola()
  }

  #escola(): string {
    return exigirEscolaDoContexto()
  }

  #lerSemEscola() {
    return this.banco.select().from(aluno)
  }
}
