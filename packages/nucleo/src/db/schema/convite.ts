import { sql } from 'drizzle-orm'
import { check, foreignKey, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import { escola } from './escola.js'
import { usuario } from './usuario.js'

export const TIPOS_DE_CONVITE = ['coordenador'] as const
export type TipoDeConvite = (typeof TIPOS_DE_CONVITE)[number]

/** Validade do convite, contada da criação (Tech Spec, seção 3). */
export const VALIDADE_DO_CONVITE_HORAS = 72

/**
 * O convite do primeiro coordenador (tarefa 7.0; Tech Spec, seções 3 e 5, "Convite"). Nasce só pelo
 * `ops:convite-coordenador`, nunca por rota (RF1, D2).
 *
 * - Guarda só o SHA-256 do token (`token_hash`, 64 caracteres hexadecimais), nunca o token: quem lê o banco não tem o
 *   link (regra 20, item 8).
 * - Uso único, expiração e revogação são colunas, e o aceite é um `update … where usado_em is null and revogado_em is
 *   null and expira_em > now()`: dois aceites ao mesmo tempo passam uma vez (regra 80, item 7).
 * - `(escola_id, usuario_id)` é FK composta para `usuario (escola_id, id)`: o convite nunca aponta para usuário de
 *   outra escola. Sai com o usuário (`on delete cascade`), que é de quem ele é.
 * - O índice `(escola_id, usuario_id)` serve à revogação dos convites anteriores de um usuário e à ativação no login.
 * - Sem nome e sem e-mail: esses ficam no `usuario` e na `conta` (`docs/lgpd.md`, "Convite de coordenador").
 */
export const convite = pgTable(
  'convite',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    escolaId: uuid()
      .notNull()
      .references(() => escola.id),
    tokenHash: text().notNull().unique('convite_token_hash_unico'),
    tipo: text().$type<TipoDeConvite>().notNull(),
    usuarioId: uuid().notNull(),
    expiraEm: timestamp({ withTimezone: true }).notNull(),
    usadoEm: timestamp({ withTimezone: true }),
    revogadoEm: timestamp({ withTimezone: true }),
  },
  (tabela) => [
    unique('convite_escola_id_unico').on(tabela.escolaId, tabela.id),
    foreignKey({ name: 'convite_usuario_da_escola_fk', columns: [tabela.escolaId, tabela.usuarioId], foreignColumns: [usuario.escolaId, usuario.id] }).onDelete('cascade'),
    index('convite_escola_usuario_idx').on(tabela.escolaId, tabela.usuarioId),
    check('convite_tipo_valido', sql`${tabela.tipo} in ('coordenador')`),
    check('convite_token_hash_formato', sql`${tabela.tokenHash} ~ '^[0-9a-f]{64}$'`),
  ],
)
