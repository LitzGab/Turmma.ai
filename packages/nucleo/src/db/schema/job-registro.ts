import { sql } from 'drizzle-orm'
import { boolean, check, index, jsonb, pgTable, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// Sem import relativo: o drizzle-kit carrega este arquivo com o próprio carregador para gerar a migration.

/**
 * Todo job nasce aqui, na transação de quem o pediu, e só depois o despachante o publica na fila
 * (Tech Spec, seção 5). É a fonte da verdade do estado: o Redis de fila pode perder o job, esta
 * tabela não.
 *
 * - `escola_id` só é nulo em rotina do sistema (`tipo` `sistema.*`), e o check garante isso no banco.
 * - `dados` leva só id e parâmetro técnico, nunca dado de pessoa (regra 20).
 * - `requisicao_id` é o da requisição que pediu o job, para a trilha seguir de API a despachante e
 *   worker (RF9).
 * - Sem FK para `escola`: a tabela de escola nasce no F1, que acrescenta a FK expandindo.
 */
export const jobRegistro = pgTable(
  'job_registro',
  {
    // UUIDv7 gerado pelo Postgres 18: ordenado no tempo, sem entregar volume como um sequencial.
    id: uuid().primaryKey().default(sql`uuidv7()`),
    escolaId: uuid(),
    fila: text().notNull(),
    prioridade: smallint().notNull(),
    tipo: text().notNull(),
    dados: jsonb().$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    naoUrgente: boolean().notNull().default(false),
    estado: text().notNull().default('aguardando'),
    requisicaoId: uuid(),
    reservadoAte: timestamp({ withTimezone: true }),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    iniciadoEm: timestamp({ withTimezone: true }),
    concluidoEm: timestamp({ withTimezone: true }),
    codigoFalha: text(),
  },
  (tabela) => [
    // O despachante procura só entre os não finalizados, por fila e escola, do mais antigo.
    index('job_registro_pendentes_idx')
      .on(tabela.fila, tabela.escolaId, tabela.criadoEm)
      .where(sql`estado not in ('concluido', 'falhou')`),
    // O expurgo (11.0) apaga os finalizados antigos sem varrer os pendentes.
    index('job_registro_finalizados_idx').on(tabela.concluidoEm).where(sql`estado in ('concluido', 'falhou')`),
    check('job_registro_escola_ou_sistema', sql`escola_id is not null or tipo like 'sistema.%'`),
    check('job_registro_estado_valido', sql`estado in ('aguardando', 'reservado', 'publicado', 'ativo', 'concluido', 'falhou')`),
    check('job_registro_fila_valida', sql`fila in ('interativa', 'normal', 'lote')`),
  ],
)
