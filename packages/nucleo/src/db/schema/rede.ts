import { sql } from 'drizzle-orm'
import { check, inet, pgTable, text, uuid } from 'drizzle-orm/pg-core'

// Sem import relativo: o drizzle-kit carrega este arquivo com o próprio carregador para gerar a migration.

/** Os tipos de rede: prefeitura ou estado, grupo educacional, ou a escola independente como rede de uma unidade. */
export const TIPOS_DE_REDE = ['prefeitura', 'grupo', 'independente'] as const
export type TipoDeRede = (typeof TIPOS_DE_REDE)[number]

/**
 * A camada acima da escola (glossário, "Rede"). A escola particular independente é uma rede de uma
 * unidade só, para não existirem dois fluxos no código. Nasce só por `ops:escola`, nunca por rota (RF1).
 *
 * - Não tem `escola_id`: é a raiz acima do tenant, e nenhum dado de pessoa mora aqui.
 * - `ips_saida` é o IP público de saída da rede (não é dado de pessoa), usado só pelo limite por IP da
 *   rota de e-mail (tarefa 15.0).
 */
export const rede = pgTable(
  'rede',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    nome: text().notNull(),
    tipo: text().$type<TipoDeRede>().notNull(),
    ipsSaida: inet().array().notNull().default(sql`'{}'::inet[]`),
  },
  (tabela) => [
    check('rede_tipo_valido', sql`${tabela.tipo} in ('prefeitura', 'grupo', 'independente')`),
    check('rede_nome_preenchido', sql`char_length(btrim(${tabela.nome})) between 1 and 200`),
  ],
)
