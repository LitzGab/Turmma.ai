import { type TransacaoBanco } from '@educa/nucleo'
import { sql } from 'drizzle-orm'

// SQL cru pela transação também toca o banco.
export class SqlCruRepository {
  constructor(private readonly tx: TransacaoBanco) {}

  async contar() { // reprova: sem-prova-de-escopo
    return this.tx.execute(sql`select count(*) from aluno`)
  }
}
