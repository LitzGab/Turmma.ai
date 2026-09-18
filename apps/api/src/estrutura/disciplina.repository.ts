import { disciplina, exigirEscolaDoContexto, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type { ConsultaPaginada, Disciplina, PedidoCriarDisciplina } from '@educa/shared'
import { and, asc, eq, gt } from 'drizzle-orm'

const colunas = { id: disciplina.id, nome: disciplina.nome, area: disciplina.area }

/**
 * As disciplinas da escola do contexto, e só dela: nenhum método recebe escola (regra 10, item 3). O nome repetido,
 * sem diferenciar maiúscula, é barrado pelo banco (`disciplina_nome_na_escola_unico`).
 */
export class DisciplinaRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  async criar(pedido: PedidoCriarDisciplina): Promise<Disciplina> {
    const [criada] = await this.banco
      .insert(disciplina)
      .values({ escolaId: exigirEscolaDoContexto(), nome: pedido.nome, area: pedido.area ?? null })
      .returning(colunas)
    if (criada === undefined) throw new Error('disciplina não criada')
    return criada
  }

  /** Uma página das disciplinas da escola, em ordem de criação, com uma linha a mais que diz se há próxima. */
  listar({ pagina, limite }: ConsultaPaginada): Promise<Disciplina[]> {
    return this.banco
      .select(colunas)
      .from(disciplina)
      .where(and(eq(disciplina.escolaId, exigirEscolaDoContexto()), pagina === undefined ? undefined : gt(disciplina.id, pagina)))
      .orderBy(asc(disciplina.id))
      .limit(limite + 1)
  }

  /** A disciplina da escola com esse id; a de outra escola não é achada. */
  async porId(id: string): Promise<Disciplina | undefined> {
    const [linha] = await this.banco
      .select(colunas)
      .from(disciplina)
      .where(and(eq(disciplina.escolaId, exigirEscolaDoContexto()), eq(disciplina.id, id)))
    return linha
  }
}
