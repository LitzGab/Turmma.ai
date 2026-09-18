import { anoLetivo, exigirAnoEmCurso, exigirEscolaDoContexto, serie, turma, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type { ConsultaPaginada, Turma, Turno } from '@educa/shared'
import { and, asc, eq, gt } from 'drizzle-orm'

export interface NovaTurma {
  readonly serieId: string
  readonly nome: string
  readonly turno: Turno | null
}

/** A turma gravada, sem a série, que o service junta. */
export type TurmaGravada = Omit<Turma, 'serie'>

const colunas = { id: turma.id, anoLetivoId: turma.anoLetivoId, nome: turma.nome, turno: turma.turno }

/**
 * As turmas da escola do contexto no ano letivo em curso dela, e só delas: escola e ano vêm do contexto que a
 * `GuardaDeSessao` gravou, nunca de argumento (regra 10, itens 2 e 3). Sem ano em curso, `exigirAnoEmCurso` falha
 * fechado com `NAO_ENCONTRADO` antes de qualquer consulta.
 *
 * As FKs compostas `(escola_id, serie_id)` e `(escola_id, ano_letivo_id)` são a segunda camada: mesmo que a série de
 * outra escola passasse por aqui, o banco recusaria a turma.
 */
export class TurmaRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /**
   * Confirma que o ano do contexto ainda está em curso e o trava em `FOR SHARE` até o fim da transação. O `update` do
   * encerramento espera a turma nascer, e a turma que chega depois do encerramento relê o ano já `encerrado` e não
   * nasce: o ano encerrado nunca ganha turma nova, nem na corrida (regra 80, item 7).
   */
  async travarAnoEmCurso(): Promise<boolean> {
    const [linha] = await this.banco
      .select({ id: anoLetivo.id })
      .from(anoLetivo)
      .where(and(eq(anoLetivo.escolaId, exigirEscolaDoContexto()), eq(anoLetivo.id, exigirAnoEmCurso()), eq(anoLetivo.situacao, 'em_curso')))
      .for('share')
    return linha !== undefined
  }

  async criar(nova: NovaTurma): Promise<TurmaGravada> {
    const [criada] = await this.banco
      .insert(turma)
      .values({ escolaId: exigirEscolaDoContexto(), anoLetivoId: exigirAnoEmCurso(), serieId: nova.serieId, nome: nova.nome, turno: nova.turno })
      .returning(colunas)
    if (criada === undefined) throw new Error('turma não criada')
    return criada
  }

  /** Uma página das turmas do ano em curso, com a série, em ordem de criação e uma linha a mais que diz se há próxima. */
  async listar({ pagina, limite }: ConsultaPaginada): Promise<Turma[]> {
    const escolaId = exigirEscolaDoContexto()
    const linhas = await this.banco
      .select({ ...colunas, serieId: serie.id, etapa: serie.etapa, ano: serie.ano })
      .from(turma)
      .innerJoin(serie, and(eq(serie.escolaId, turma.escolaId), eq(serie.id, turma.serieId)))
      .where(and(eq(turma.escolaId, escolaId), eq(turma.anoLetivoId, exigirAnoEmCurso()), pagina === undefined ? undefined : gt(turma.id, pagina)))
      .orderBy(asc(turma.id))
      .limit(limite + 1)
    return linhas.map(({ serieId, etapa, ano, ...resto }) => ({ ...resto, serie: { id: serieId, etapa, ano } }))
  }
}
