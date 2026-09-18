import { exigirEscolaDoContexto, sessao, type Banco, type MetodoDeSessao, type TransacaoBanco } from '@educa/nucleo'
import { and, eq, isNull, sql } from 'drizzle-orm'

/** O que a troca de escola precisa saber da sessão de onde parte: o método de entrada e a conta. Nada da pessoa. */
export interface SessaoDeOrigem {
  readonly metodo: MetodoDeSessao
  readonly contaId: string | null
}

/**
 * A sessão de onde a troca de escola parte (tarefa 12.0; Tech Spec, seção 5, "Troca de escola"). Lê e encerra só
 * sessão da escola do contexto: na troca pelo token, a escola que a `GuardaDeSessao` gravou; na conclusão do segundo
 * fator, a escola da origem que veio no desafio assinado, aberta como contexto por quem chama. Nunca uma escola de
 * argumento (regra 10, item 3).
 */
export class SessaoDeOrigemRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /** O método e a conta da sessão `sessaoId`, na escola do contexto; `undefined` se ela não é dessa escola. */
  async metodoEConta(sessaoId: string): Promise<SessaoDeOrigem | undefined> {
    const [linha] = await this.banco
      .select({ metodo: sessao.metodo, contaId: sessao.contaId })
      .from(sessao)
      .where(and(eq(sessao.escolaId, exigirEscolaDoContexto()), eq(sessao.id, sessaoId)))
      .limit(1)
    return linha
  }

  /**
   * Encerra a sessão de origem com motivo `troca_de_escola`, só se ela ainda está aberta, é de e-mail e é da conta que
   * troca. É o `update` condicional que decide a corrida: duas trocas com a mesma sessão esperam uma pela outra na
   * trava da linha, e a segunda, relendo, já a acha encerrada (regra 80, item 7). Devolve se encerrou.
   */
  async encerrarParaTroca(sessaoId: string, contaId: string): Promise<boolean> {
    const encerradas = await this.banco
      .update(sessao)
      .set({ encerradaEm: sql`now()`, motivo: 'troca_de_escola' })
      .where(
        and(
          eq(sessao.escolaId, exigirEscolaDoContexto()),
          eq(sessao.id, sessaoId),
          eq(sessao.contaId, contaId),
          eq(sessao.metodo, 'email'),
          isNull(sessao.encerradaEm),
        ),
      )
      .returning({ id: sessao.id })
    return encerradas.length === 1
  }
}
