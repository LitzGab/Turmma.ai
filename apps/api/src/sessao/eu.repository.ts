import { escola, identidadeDaRequisicao, usuario, type Banco } from '@educa/nucleo'
import type { PapelDeUsuario } from '@educa/shared'
import { and, eq } from 'drizzle-orm'

export interface LinhaDoEu {
  readonly usuarioId: string
  readonly papel: PapelDeUsuario
  readonly nome: string
  readonly escola: { readonly id: string; readonly nome: string; readonly slug: string }
  readonly inatividadeAlunoMin: number
  readonly inatividadeEquipeMin: number
}

/**
 * Quem está na sessão: o usuário e a escola do contexto que a `GuardaDeSessao` gravou, e só eles. Não recebe id:
 * não há como pedir outro usuário nem outra escola (regra 10, item 3).
 */
export class EuRepository {
  constructor(private readonly banco: Banco) {}

  async doContexto(): Promise<LinhaDoEu | undefined> {
    const { escolaId, usuarioId } = identidadeDaRequisicao()
    const [linha] = await this.banco
      .select({
        usuarioId: usuario.id,
        papel: usuario.papel,
        nome: usuario.nome,
        escola: { id: escola.id, nome: escola.nome, slug: escola.slug },
        inatividadeAlunoMin: escola.inatividadeAlunoMin,
        inatividadeEquipeMin: escola.inatividadeEquipeMin,
      })
      .from(usuario)
      .innerJoin(escola, eq(escola.id, usuario.escolaId))
      .where(and(eq(usuario.escolaId, escolaId), eq(usuario.id, usuarioId)))
      .limit(1)
    return linha
  }
}
