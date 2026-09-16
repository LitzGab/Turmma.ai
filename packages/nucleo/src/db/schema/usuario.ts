import { sql } from 'drizzle-orm'
import { check, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'
import type { PapelDeUsuario } from '@educa/shared'
import { conta } from './conta.js'
import { escola } from './escola.js'

/**
 * A pessoa numa escola, com o papel dela ali (Tech Spec, seção 3). É o `sub` do token: toda autorização parte
 * deste id e da escola dele.
 *
 * - `conta_id` só é nulo para aluno, que não tem e-mail (regra 20, item 2); o check garante no banco.
 * - `unique (escola_id, id)` é o alvo das FKs compostas (sessão, vínculo, auditoria): nenhuma referência chega
 *   ao usuário de outra escola.
 * - `unique (escola_id, conta_id, papel)`: a mesma conta não é duas vezes professora na mesma escola.
 * - O índice por `conta_id` serve à resolução de tenant (os usuários ativos de uma conta, depois da senha), que
 *   por definição atravessa escolas.
 * - `nome` é dado pessoal (`docs/lgpd.md`): nunca em log nem em auditoria.
 */
export const usuario = pgTable(
  'usuario',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    escolaId: uuid()
      .notNull()
      .references(() => escola.id),
    contaId: uuid().references(() => conta.id),
    papel: text().$type<PapelDeUsuario>().notNull(),
    nome: text().notNull(),
    desativadoEm: timestamp({ withTimezone: true }),
  },
  (tabela) => [
    unique('usuario_escola_id_unico').on(tabela.escolaId, tabela.id),
    unique('usuario_escola_conta_papel_unico').on(tabela.escolaId, tabela.contaId, tabela.papel),
    index('usuario_conta_idx').on(tabela.contaId).where(sql`conta_id is not null`),
    check('usuario_papel_valido', sql`${tabela.papel} in ('coordenador', 'professor', 'aluno')`),
    check('usuario_conta_so_falta_para_aluno', sql`${tabela.contaId} is not null or ${tabela.papel} = 'aluno'`),
    check('usuario_nome_preenchido', sql`char_length(btrim(${tabela.nome})) between 1 and 200`),
  ],
)
