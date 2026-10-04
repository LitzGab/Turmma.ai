import { disciplina, exigirAnoEmCurso, exigirEscolaDoContexto, serie, sessaoDaRequisicao, turma, vinculo, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type { Etapa } from '@educa/shared'
import { and, eq, exists, type AnyColumn, type SQL } from 'drizzle-orm'

/** As colunas de uma linha que dizem de que turma ela é: a escola, o ano letivo e a turma. */
export interface ColunasDaTurma {
  readonly escolaId: AnyColumn
  readonly anoLetivoId: AnyColumn
  readonly turmaId: AnyColumn
}

/**
 * O `turma_vinculada` da `MATRIZ`, num lugar só: existe vínculo `confirmado` de professor do **usuário do contexto** na
 * turma da linha, na escola e no ano da própria linha. É `exists`, e não `join`: quem dá duas disciplinas na mesma turma
 * tem dois vínculos, e o `join` repetiria a linha.
 *
 * O usuário vem da sessão, nunca de argumento (regra 10, item 3). Vínculo pendente, contestado ou encerrado não dá
 * alcance: o professor que saiu em março não lê a turma em outubro (regra 20, item 18).
 *
 * `disciplinaId` restringe ao vínculo naquela disciplina: é o que o gerar e a conversa pedem, porque o material é da
 * disciplina. Sem ele, basta o vínculo na turma, em qualquer disciplina (artefato e entrega, que são da turma).
 */
export function comVinculoConfirmadoDoProfessor(banco: Banco | TransacaoBanco, colunas: ColunasDaTurma, disciplinaId?: string): SQL {
  const { usuarioId } = sessaoDaRequisicao()
  return exists(
    banco
      .select({ um: vinculo.id })
      .from(vinculo)
      .where(
        and(
          eq(vinculo.escolaId, colunas.escolaId),
          eq(vinculo.anoLetivoId, colunas.anoLetivoId),
          eq(vinculo.turmaId, colunas.turmaId),
          eq(vinculo.usuarioId, usuarioId),
          eq(vinculo.papel, 'professor'),
          eq(vinculo.estado, 'confirmado'),
          disciplinaId === undefined ? undefined : eq(vinculo.disciplinaId, disciplinaId),
        ),
      ),
  )
}

/** A turma e a disciplina de um pedido, como a tarefa de IA as recebe: a série e o nome da disciplina, sem nome de turma nem de pessoa. */
export interface TurmaComDisciplina {
  readonly serie: { readonly etapa: Etapa; readonly ano: number }
  readonly disciplina: string
}

/**
 * A turma e a disciplina em que o professor do contexto pode pedir IA: turma do ano em curso da escola do contexto, com
 * vínculo `confirmado` dele **naquela disciplina**. Escola, ano e pessoa vêm da sessão (regra 10, item 3).
 */
export class TurmaDoProfessorRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /**
   * A série da turma e o nome da disciplina, se o professor do contexto tem vínculo confirmado nas duas. Turma ou
   * disciplina de outra escola, de outro ano, de outro professor ou inexistente: `undefined`, e quem chama responde
   * `NAO_ENCONTRADO`, igual para todas (regra 10, item 6).
   */
  async turmaComDisciplina(turmaId: string, disciplinaId: string): Promise<TurmaComDisciplina | undefined> {
    const escolaId = exigirEscolaDoContexto()
    const [linha] = await this.banco
      .select({ etapa: serie.etapa, ano: serie.ano, disciplina: disciplina.nome })
      .from(turma)
      .innerJoin(serie, and(eq(serie.escolaId, turma.escolaId), eq(serie.id, turma.serieId)))
      .innerJoin(disciplina, and(eq(disciplina.escolaId, turma.escolaId), eq(disciplina.id, disciplinaId)))
      .where(and(eq(turma.escolaId, escolaId), eq(turma.anoLetivoId, exigirAnoEmCurso()), eq(turma.id, turmaId), comVinculoConfirmadoDoProfessor(this.banco, { escolaId: turma.escolaId, anoLetivoId: turma.anoLetivoId, turmaId: turma.id }, disciplinaId)))
    return linha === undefined ? undefined : { serie: { etapa: linha.etapa, ano: linha.ano }, disciplina: linha.disciplina }
  }
}
