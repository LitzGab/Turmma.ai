import { exigirAnoEmCurso, exigirEscolaDoContexto, listaNome, turma, type Banco } from '@educa/nucleo'
import { MAXIMO_DE_NOMES_NA_SALA } from '@educa/shared'
import { and, asc, eq } from 'drizzle-orm'

/** Um nome livre como a página da sala o mostra: o id e o nome, nunca a matrícula. */
export interface NomeLivre {
  readonly id: string
  readonly nome: string | null
}

/**
 * O que a página pública da sala mostra (A1, tarefa 5.0), na escola e no ano do contexto que o `AcessoDaSala` abriu com
 * a linha do acesso vigente (regra 10, item 3): o nome da turma e os nomes livres da lista dela. Escola e ano vêm do
 * contexto, nunca de argumento; a turma também é a da linha do acesso, e aqui é só filtro.
 *
 * Lido a cada abertura, sem cache: o nome avulso que a coordenação acrescentou aparece no link já vigente (E26), e o
 * nome que alguém reivindicou some. A matrícula não sai daqui, e nada daqui vai a log.
 */
export class ListaLivreRepository {
  constructor(private readonly banco: Banco) {}

  /** O nome da turma, ou `undefined` quando ela não está na escola e no ano do contexto. */
  async nomeDaTurma(turmaId: string): Promise<string | undefined> {
    const [linha] = await this.banco
      .select({ nome: turma.nome })
      .from(turma)
      .where(and(eq(turma.escolaId, exigirEscolaDoContexto()), eq(turma.anoLetivoId, exigirAnoEmCurso()), eq(turma.id, turmaId)))
      .limit(1)
    return linha?.nome
  }

  /**
   * Os nomes `livre` da lista da turma, em ordem de nome, até `MAXIMO_DE_NOMES_NA_SALA`, pelo índice `(escola_id, ano_letivo_id,
   * turma_id, estado)`. O reivindicado e o aprovado não aparecem.
   */
  async nomesLivres(turmaId: string): Promise<NomeLivre[]> {
    return this.banco
      .select({ id: listaNome.id, nome: listaNome.nome })
      .from(listaNome)
      .where(
        and(eq(listaNome.escolaId, exigirEscolaDoContexto()), eq(listaNome.anoLetivoId, exigirAnoEmCurso()), eq(listaNome.turmaId, turmaId), eq(listaNome.estado, 'livre')),
      )
      .orderBy(asc(listaNome.nome))
      .limit(MAXIMO_DE_NOMES_NA_SALA)
  }
}
