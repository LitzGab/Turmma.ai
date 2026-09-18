import { contextoAtual, escola, type TransacaoBanco } from '@educa/nucleo'
import { eq } from 'drizzle-orm'

export interface InatividadeDaEscola {
  readonly inatividadeAlunoMin: number
  readonly inatividadeEquipeMin: number
}

/** A escola do contexto, ou falha fechada: a configuração é sempre da escola da sessão (regra 10, item 3). */
function escolaDoContexto(): string {
  const escolaId = contextoAtual()?.escolaId
  if (escolaId === undefined) throw new Error('configuração de sessão sem escola no contexto')
  return escolaId
}

/**
 * Os minutos sem uso até a sessão vencer, da escola do contexto e só dela: o método não recebe escola nenhuma. A
 * escola é o tenant, e por isso a cláusula é `escola.id`.
 */
export class EscolaSessaoRepository {
  constructor(private readonly tx: TransacaoBanco) {}

  /**
   * Os valores atuais, com a linha travada até o fim da transação: duas alterações juntas não perdem o `antes`. A trava
   * é `FOR NO KEY UPDATE`, que não conflita com o `FOR KEY SHARE` das FKs: o login e a renovação da escola, que gravam
   * sessão, registro de acesso e auditoria com FK para ela, não esperam por esta transação.
   */
  async lerParaAlterar(): Promise<InatividadeDaEscola | undefined> {
    const [linha] = await this.tx
      .select({ inatividadeAlunoMin: escola.inatividadeAlunoMin, inatividadeEquipeMin: escola.inatividadeEquipeMin })
      .from(escola)
      .where(eq(escola.id, escolaDoContexto()))
      .for('no key update')
    return linha
  }

  async alterar(valores: InatividadeDaEscola): Promise<InatividadeDaEscola | undefined> {
    const [linha] = await this.tx
      .update(escola)
      .set({ inatividadeAlunoMin: valores.inatividadeAlunoMin, inatividadeEquipeMin: valores.inatividadeEquipeMin })
      .where(eq(escola.id, escolaDoContexto()))
      .returning({ inatividadeAlunoMin: escola.inatividadeAlunoMin, inatividadeEquipeMin: escola.inatividadeEquipeMin })
    return linha
  }
}
