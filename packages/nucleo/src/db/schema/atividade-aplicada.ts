import { sql } from 'drizzle-orm'
import { boolean, check, foreignKey, index, pgTable, text, timestamp, unique, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import type { EstadoDeAtividadeAplicada } from '@educa/shared'
import { artefato } from './artefato.js'
import { escola } from './escola.js'
import { turma } from './turma.js'

/**
 * A atividade que o professor aplicou a uma turma (MVP, A3). É a "Avaliação" do modelo definitivo, fina: só o modo online
 * objetiva, sem item nem peso próprios, porque as questões são as do artefato, que não muda depois de gravado.
 *
 * - **Aplicar é a aprovação registrada que leva a saída da IA ao aluno** (regra 70, item 3): `aplicada_por` e
 *   `aplicada_em` são obrigatórios. O autor é conferido na gravação pelo gatilho `atividade_aplicada_aplicada_por_da_escola`
 *   (a função `exigir_usuario_da_escola`, da 0013), e não por FK: a eliminação do professor não apaga quem liberou a
 *   atividade nem a atividade (como na auditoria).
 * - Gatilho `atividade_aplicada_so_do_que_pode_ir_ao_aluno` (escrito à mão na 0022): só atividade objetiva se aplica, e a
 *   **versão adaptada só com a entrega dela `aprovada`**. É o que impede, por estrutura, a versão pendente ou rejeitada
 *   de chegar à turma, mesmo por fora da API. A recusa sai como 23514, com o nome da regra.
 * - `avaliativa`: enquanto a avaliativa está `aberta`, o Tutor da turma fica travado (regra 30, item 10).
 * - Índice único parcial `(escola_id, turma_id, artefato_id)` entre as abertas: o clique duplo em "aplicar" não cria duas
 *   (regra 80, item 7), e é por ele que o Tutor acha a avaliativa aberta da turma.
 * - A turma por FK composta com a escola e o ano; o artefato, com a escola. A turma do artefato não precisa ser a da
 *   aplicação: o professor aplica a mesma atividade a outra turma dele (a tarefa confere o vínculo nas duas).
 * - `unique (escola_id, ano_letivo_id, id)` é o alvo da tentativa, que carrega o ano da aplicação.
 * - Índice `(escola_id, turma_id, id)`: as atividades da turma, para o professor e para o aluno, paginadas.
 * - Sem dado de pessoa além de quem aplicou.
 */
export const atividadeAplicada = pgTable(
  'atividade_aplicada',
  {
    id: uuid().primaryKey().default(sql`uuidv7()`),
    escolaId: uuid()
      .notNull()
      .references(() => escola.id),
    anoLetivoId: uuid().notNull(),
    turmaId: uuid().notNull(),
    artefatoId: uuid().notNull(),
    avaliativa: boolean().notNull(),
    estado: text().$type<EstadoDeAtividadeAplicada>().notNull().default('aberta'),
    aplicadaPor: uuid().notNull(),
    aplicadaEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    encerradaEm: timestamp({ withTimezone: true }),
  },
  (tabela) => [
    unique('atividade_aplicada_escola_id_unico').on(tabela.escolaId, tabela.id),
    unique('atividade_aplicada_escola_ano_id_unico').on(tabela.escolaId, tabela.anoLetivoId, tabela.id),
    foreignKey({
      name: 'atividade_aplicada_turma_do_ano_da_escola_fk',
      columns: [tabela.escolaId, tabela.anoLetivoId, tabela.turmaId],
      foreignColumns: [turma.escolaId, turma.anoLetivoId, turma.id],
    }),
    foreignKey({ name: 'atividade_aplicada_artefato_da_escola_fk', columns: [tabela.escolaId, tabela.artefatoId], foreignColumns: [artefato.escolaId, artefato.id] }),
    uniqueIndex('atividade_aplicada_aberta_unica').on(tabela.escolaId, tabela.turmaId, tabela.artefatoId).where(sql`${tabela.estado} = 'aberta'`),
    index('atividade_aplicada_turma_idx').on(tabela.escolaId, tabela.turmaId, tabela.id),
    check('atividade_aplicada_estado_valido', sql`${tabela.estado} in ('aberta', 'encerrada')`),
    check('atividade_aplicada_encerrada_tem_data', sql`(${tabela.estado} = 'encerrada') = (${tabela.encerradaEm} is not null)`),
  ],
)
