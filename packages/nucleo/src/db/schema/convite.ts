import { VALIDADE_DO_CONVITE_HORAS } from '@educa/shared'
import { sql } from 'drizzle-orm'
import { check, foreignKey, index, pgTable, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { escola } from './escola.js'
import { usuario } from './usuario.js'

export const TIPOS_DE_CONVITE = ['coordenador'] as const
export type TipoDeConvite = (typeof TIPOS_DE_CONVITE)[number]

/** Validade do convite, contada da criação (Tech Spec, seção 3). Mora em `@educa/shared`, que o painel também lê. */
export { VALIDADE_DO_CONVITE_HORAS }

/**
 * O convite do primeiro coordenador (tarefa 7.0; Tech Spec, seções 3 e 5, "Convite"). Nasce só pelo operador: o
 * `ops:convite-coordenador` ou o painel da operação (A0b), nunca por rota de escola (RF1, D2).
 *
 * - Guarda só o SHA-256 do token (`token_hash`, 64 caracteres hexadecimais), nunca o token: quem lê o banco não tem o
 *   link (regra 20, item 8).
 * - Uso único, expiração e revogação são colunas, e o aceite é um `update … where usado_em is null and revogado_em is
 *   null and expira_em > now()`: dois aceites ao mesmo tempo passam uma vez (regra 80, item 7).
 * - `(escola_id, usuario_id)` é FK composta para `usuario (escola_id, id)`: o convite nunca aponta para usuário de
 *   outra escola. Sai com o usuário (`on delete cascade`), que é de quem ele é.
 * - O índice `(escola_id, usuario_id)` serve à ativação no login.
 * - No máximo um convite em aberto (nem usado, nem revogado) por usuário na escola (`convite_pendente_unico`, A0b): a
 *   rede de segurança da trava da escola (Tech Spec da A0b, seção 7c), que deixa um só em aberto por escola. O 23505
 *   dele vira `CONFLITO` (`ConviteRepository.criarConvite`).
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
    uniqueIndex('convite_pendente_unico').on(tabela.escolaId, tabela.usuarioId).where(sql`${tabela.usadoEm} is null and ${tabela.revogadoEm} is null`),
    check('convite_tipo_valido', sql`${tabela.tipo} in ('coordenador')`),
    check('convite_token_hash_formato', sql`${tabela.tokenHash} ~ '^[0-9a-f]{64}$'`),
  ],
)
