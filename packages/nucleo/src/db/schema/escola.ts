import { sql } from 'drizzle-orm'
import { check, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core'
import { rede } from './rede.js'

/** Minutos sem uso até a sessão do aluno vencer, quando a escola não configurou outro (RF13). */
export const INATIVIDADE_ALUNO_PADRAO_MIN = 30
/** Minutos sem uso até a sessão de professor e coordenador vencer, quando a escola não configurou outro. */
export const INATIVIDADE_EQUIPE_PADRAO_MIN = 120

/** Endereço da escola: letras minúsculas e dígitos, com hífen só entre eles (`colegio-horizonte`). */
export const FORMATO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const TAMANHO_MAXIMO_SLUG = 63

/**
 * A unidade, e o tenant: todo dado de domínio pertence a uma escola e nunca cruza para outra (regra 10).
 * Nasce só por `ops:escola`, nunca por rota (RF1, D2).
 *
 * - `slug` é o endereço público da escola (`/e/:slug`), único no sistema inteiro, e o banco confere o
 *   formato: o endereço é público de qualquer jeito (Tech Spec, seção 5).
 * - A chave primária é o `unique (id)` que as FKs das tarefas seguintes referenciam.
 * - Sem dado de pessoa.
 */
export const escola = pgTable(
  'escola',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    redeId: uuid()
      .notNull()
      .references(() => rede.id),
    nome: text().notNull(),
    slug: text().notNull().unique(),
    inatividadeAlunoMin: integer().notNull().default(INATIVIDADE_ALUNO_PADRAO_MIN),
    inatividadeEquipeMin: integer().notNull().default(INATIVIDADE_EQUIPE_PADRAO_MIN),
  },
  (tabela) => [
    check('escola_slug_formato', sql`${tabela.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(${tabela.slug}) <= 63`),
    check('escola_nome_preenchido', sql`char_length(btrim(${tabela.nome})) between 1 and 200`),
    check('escola_inatividade_aluno_positiva', sql`${tabela.inatividadeAlunoMin} > 0`),
    check('escola_inatividade_equipe_positiva', sql`${tabela.inatividadeEquipeMin} > 0`),
  ],
)
