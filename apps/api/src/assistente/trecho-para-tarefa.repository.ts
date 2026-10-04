import { exigirEscolaDoContexto, material, trecho, type Banco, type TransacaoBanco } from '@educa/nucleo'
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm'

export interface TrechoAchado {
  readonly materialId: string
  readonly titulo: string
  readonly pagina: number
  readonly texto: string
}

/**
 * A leitura de `trecho` para as tarefas de IA (MVP, seção 4, item 2): busca por texto completo do Postgres, em
 * português, na coluna gerada `busca`, pelo índice GIN `(escola_id, disciplina_id, busca)`, que começa pelo escopo
 * (regra 80, item 8).
 *
 * A escola vem do contexto, em toda consulta (regra 10, item 3). Só entra trecho de material `pronto` e não excluído:
 * o que está processando, o que falhou e o que a coordenação excluiu não viram citação.
 */
export class TrechoParaTarefaRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /**
   * Os `limite` trechos da disciplina que mais têm a ver com a consulta (`websearch_to_tsquery`, já montada por quem
   * chama), do mais ao menos relevante; no empate, pelo material e pela página.
   */
  buscar(disciplinaId: string, consulta: string, limite: number): Promise<TrechoAchado[]> {
    const procurado = sql`websearch_to_tsquery('portuguese', ${consulta})`
    return this.banco
      .select({ materialId: trecho.materialId, titulo: material.titulo, pagina: trecho.pagina, texto: trecho.texto })
      .from(trecho)
      .innerJoin(material, and(eq(material.escolaId, trecho.escolaId), eq(material.disciplinaId, trecho.disciplinaId), eq(material.id, trecho.materialId)))
      .where(
        and(
          eq(trecho.escolaId, exigirEscolaDoContexto()),
          eq(trecho.disciplinaId, disciplinaId),
          eq(material.estado, 'pronto'),
          isNull(material.excluidoEm),
          sql`${trecho.busca} @@ ${procurado}`,
        ),
      )
      .orderBy(desc(sql`ts_rank(${trecho.busca}, ${procurado})`), asc(trecho.materialId), asc(trecho.pagina))
      .limit(limite)
  }

  /**
   * O título dos materiais citados, para a linha "Fonte" do PDF. Inclui o material excluído: a linha dele fica
   * justamente porque artefatos já o citam. Só os da escola do contexto: id de outra escola não acha nada.
   */
  async titulosDosMateriais(ids: readonly string[]): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map()
    const linhas = await this.banco
      .select({ id: material.id, titulo: material.titulo })
      .from(material)
      .where(and(eq(material.escolaId, exigirEscolaDoContexto()), inArray(material.id, [...ids])))
    return new Map(linhas.map((linha) => [linha.id, linha.titulo]))
  }
}
