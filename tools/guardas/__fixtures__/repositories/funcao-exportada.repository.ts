import { exigirEscolaDoContexto, type Banco, type TransacaoBanco } from '@educa/nucleo'
import { aluno } from './tabelas.js'

// A função exportada do módulo é ponto de entrada público, como o método da classe.
export async function gravar(tx: TransacaoBanco) { // reprova: sem-prova-de-escopo
  await tx.insert(aluno).values({})
}

export const gravarComSeta = async (banco: Banco) => { // reprova: sem-prova-de-escopo
  await banco.insert(aluno).values({})
}

export async function gravarNaEscola(tx: TransacaoBanco) {
  await tx.insert(aluno).values({ escolaId: exigirEscolaDoContexto() })
}

export function semBanco(valor: number): number {
  return valor + 1
}

async function internaSemExportar(tx: TransacaoBanco) {
  await tx.insert(aluno).values({})
}
void internaSemExportar

const internaDeSeta = async (banco: Banco) => {
  await banco.insert(aluno).values({})
}
void internaDeSeta
