import { escola, exigirEscolaDoContexto, provedorEscola, type Banco, type ProvedorExterno } from '@educa/nucleo'
import { and, eq, isNull } from 'drizzle-orm'

/**
 * O que a tela `/e/:slug` mostra antes do login, lido na escola do contexto aberto pelo slug (regra 10, item 3): o
 * nome da escola e os tipos de provedor de conta que ela liberou (13.0), nunca o domínio nem o tenant.
 */
export class AcessoDaEscolaRepository {
  constructor(private readonly banco: Banco) {}

  async nome(): Promise<string | undefined> {
    const [linha] = await this.banco.select({ nome: escola.nome }).from(escola).where(eq(escola.id, exigirEscolaDoContexto())).limit(1)
    return linha?.nome
  }

  /** Os provedores com pelo menos um domínio ou tenant liberado na escola do contexto, sem repetição. */
  async provedoresLiberados(): Promise<ProvedorExterno[]> {
    const linhas = await this.banco
      .selectDistinct({ provedor: provedorEscola.provedor })
      .from(provedorEscola)
      .where(and(eq(provedorEscola.escolaId, exigirEscolaDoContexto()), isNull(provedorEscola.removidoEm)))
    return linhas.map((linha) => linha.provedor)
  }
}
