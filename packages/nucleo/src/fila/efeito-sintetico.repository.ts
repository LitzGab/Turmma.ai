import { sql } from 'drizzle-orm'
import { contextoAtual } from '../contexto/contexto.js'
import type { Banco } from '../db/banco.js'

/**
 * A tabela do efeito do job sintético. Não tem migration nem schema do Drizzle: só o teste de integração a
 * cria (`apps/worker/test/reexecucao.int.test.ts`), com esta forma:
 *
 * ```sql
 * create table efeito_sintetico (
 *   escola_id uuid not null,
 *   chave_idempotencia uuid not null,
 *   tentativa integer not null,
 *   primary key (escola_id, chave_idempotencia)
 * )
 * ```
 */
export const TABELA_DO_EFEITO_SINTETICO = 'efeito_sintetico'

/** O que identifica a execução que grava o efeito. */
export interface EfeitoDaExecucao {
  /** O id do job em `job_registro`: igual em toda tentativa, stalled e republicação. */
  chaveIdempotencia: string
  tentativa: number
}

/**
 * O efeito do job sintético, no escopo da escola do contexto (regra 10, item 3): a escola é a do job, que o
 * worker restaura antes de chamar o processador, e nunca vem de argumento.
 *
 * É o exemplo de referência para os processadores do F4 em diante (D49): o efeito tem restrição única que
 * começa pela escola e termina na chave de idempotência, e a gravação é `on conflict do nothing`. A
 * reexecução, em sequência ou ao mesmo tempo que a primeira, cai no conflito e não grava outra linha: a
 * concorrência se resolve no banco, e não com "verifica e depois grava" (regra 80, item 7).
 */
export class EfeitoSinteticoRepository {
  constructor(private readonly banco: Banco) {}

  /** Grava o efeito da execução. Devolve `false` quando outra execução do mesmo job já o gravou. */
  async gravar({ chaveIdempotencia, tentativa }: EfeitoDaExecucao): Promise<boolean> {
    const escolaId = contextoAtual()?.escolaId
    if (escolaId === undefined) throw new Error('efeito sintético sem escola no contexto')
    const resultado = await this.banco.execute(sql`
      insert into ${sql.identifier(TABELA_DO_EFEITO_SINTETICO)} (escola_id, chave_idempotencia, tentativa)
      values (${escolaId}, ${chaveIdempotencia}, ${tentativa})
      on conflict (escola_id, chave_idempotencia) do nothing
      returning chave_idempotencia
    `)
    return resultado.rows.length === 1
  }
}
