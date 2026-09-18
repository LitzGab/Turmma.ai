import { escola, exigirEscolaDoContexto, type Banco } from '@educa/nucleo'
import { eq } from 'drizzle-orm'

/**
 * O que a tela `/e/:slug` mostra antes do login, lido na escola do contexto aberto pelo slug (regra 10, item 3): só o
 * nome da escola. Os provedores de conta entram na 13.0, com `provedor_escola`, pela mesma escola do contexto.
 */
export class AcessoDaEscolaRepository {
  constructor(private readonly banco: Banco) {}

  async nome(): Promise<string | undefined> {
    const [linha] = await this.banco.select({ nome: escola.nome }).from(escola).where(eq(escola.id, exigirEscolaDoContexto())).limit(1)
    return linha?.nome
  }
}
