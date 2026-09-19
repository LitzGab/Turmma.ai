import { sql } from 'drizzle-orm'
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { escola } from './escola.js'

/** Identificador curto da pessoa da nossa equipe que rodou um comando `ops:*` (`joaquim`, `gabriel-s`). */
export const FORMATO_OPERADOR = /^[a-z][a-z0-9-]{1,31}$/

/**
 * O registro consultável de quem fez o quê, em qual escola e quando (regra 20, item 10; RF19). Não é
 * log: tem autor, data e finalidade, e fica pela retenção legal (vigência + 5 anos, `docs/lgpd.md`).
 *
 * - Só grava por `RegistroDeAuditoria.gravar`, que confere `antes`, `depois` e `finalidade` contra a lista
 *   fechada da ação: ids, estados, códigos e datas, nunca nome, e-mail, matrícula, complemento, hash ou
 *   segredo. O insert fica num módulo fora do `index.ts` do pacote, e um teste procura outra escrita.
 * - `escola_id` só é nulo quando o operador cria a rede, que ainda não tem escola, e o check garante isso
 *   no banco mesmo por fora do código.
 * - Todo registro tem um autor, e só um: a pessoa da escola (`autor_usuario_id`) ou alguém da nossa
 *   equipe (`autor_operador`).
 * - Sem `unique (escola_id, id)`: nenhuma tabela referencia a auditoria, então não há FK composta a apoiar.
 * - O autor é sempre um usuário da própria escola do registro, conferido no banco na gravação pelo gatilho
 *   `auditoria_autor_da_escola_fk` (migration 0013). Até a 17.0 era FK composta para `usuario (escola_id, id)`; virou
 *   gatilho porque a eliminação pedida pela escola apaga o usuário e a auditoria fica pela retenção legal, com o id do
 *   autor (Tech Spec, seção 5, "Ciclo de vida").
 * - O índice começa pela escola (regra 80, item 8): a consulta do F3 é sempre "a escola, num período".
 */
export const auditoria = pgTable(
  'auditoria',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    escolaId: uuid().references(() => escola.id),
    autorUsuarioId: uuid(),
    autorOperador: text(),
    acao: text().notNull(),
    entidade: text().notNull(),
    entidadeId: uuid().notNull(),
    antes: jsonb().$type<Record<string, unknown>>(),
    depois: jsonb().$type<Record<string, unknown>>(),
    finalidade: text(),
    requisicaoId: uuid().notNull(),
    em: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (tabela) => [
    index('auditoria_escola_em_idx').on(tabela.escolaId, tabela.em),
    check('auditoria_escola_ou_rede_pelo_operador', sql`escola_id is not null or (autor_operador is not null and entidade = 'rede')`),
    // Um autor e só um: a pessoa da escola, ou alguém da nossa equipe em rotina de operador.
    check('auditoria_um_autor', sql`(autor_usuario_id is not null) <> (autor_operador is not null)`),
    check('auditoria_operador_formato', sql`autor_operador is null or autor_operador ~ '^[a-z][a-z0-9-]{1,31}$'`),
    check('auditoria_finalidade_curta', sql`finalidade is null or char_length(finalidade) between 1 and 200`),
  ],
)
