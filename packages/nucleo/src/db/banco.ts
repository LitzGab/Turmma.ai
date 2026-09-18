import type { ExtractTablesWithRelations } from 'drizzle-orm'
import { drizzle, type NodePgDatabase, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { validarAmbiente } from '../config/validar-config.js'
import type { ConfiguracaoBanco, PoolBanco } from './pool.js'
import { anoLetivo } from './schema/ano-letivo.js'
import { codigoRecuperacao } from './schema/codigo-recuperacao.js'
import { configuracaoOperacionalEscola } from './schema/configuracao-operacional-escola.js'
import { conta } from './schema/conta.js'
import { convite } from './schema/convite.js'
import { disciplina } from './schema/disciplina.js'
import { escola } from './schema/escola.js'
import { jobRegistro } from './schema/job-registro.js'
import { rede } from './schema/rede.js'
import { registroAcesso } from './schema/registro-acesso.js'
import { serie } from './schema/serie.js'
import { sessao } from './schema/sessao.js'
import { turma } from './schema/turma.js'
import { usoInfraDiario } from './schema/uso-infra-diario.js'
import { usuario } from './schema/usuario.js'
import { vinculo } from './schema/vinculo.js'

// Sem `auditoria`: a tabela só é alcançável pelo módulo de inserção e pela leitura da auditoria, nunca
// pelo `schema` que o pacote exporta (a escrita tem uma porta só, o RegistroDeAuditoria).
export const schema = { jobRegistro, configuracaoOperacionalEscola, usoInfraDiario, rede, escola, anoLetivo, conta, codigoRecuperacao, usuario, sessao, registroAcesso, convite, serie, disciplina, turma, vinculo }
export type Schema = typeof schema

export type Banco = NodePgDatabase<Schema>

/** A transação aberta por quem chama. Quem recebe isto grava junto, e desfaz junto. */
export type TransacaoBanco = PgTransaction<NodePgQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>

/** Drizzle sobre o pool do processo, com os nomes do banco em snake_case (Tech Spec, seção 3). */
export function criarBanco(pool: PoolBanco): Banco {
  return drizzle({ client: pool, schema, casing: 'snake_case' })
}

const inteiroPositivo = z.coerce.number().int().positive()

const esquemaAmbienteBanco = z.object({
  BANCO_URL: z.string().regex(/^postgres(ql)?:\/\/[^/]+\/[^/]+$/),
  BANCO_POOL_MAXIMO: inteiroPositivo,
  BANCO_TIMEOUT_CONEXAO_MS: inteiroPositivo,
  BANCO_TIMEOUT_CONSULTA_MS: inteiroPositivo,
})

/**
 * Banco de todo processo que tem pool: API, despachante e worker. Cada um lê o próprio
 * `BANCO_POOL_MAXIMO`, e todos têm `statement_timeout`: nenhum processo fica com consulta sem prazo.
 */
export function lerConfiguracaoBanco(ambiente: Record<string, string | undefined>): ConfiguracaoBanco {
  const valores = validarAmbiente(esquemaAmbienteBanco, ambiente)
  return {
    url: valores.BANCO_URL,
    maximoConexoes: valores.BANCO_POOL_MAXIMO,
    timeoutConexaoMs: valores.BANCO_TIMEOUT_CONEXAO_MS,
    timeoutConsultaMs: valores.BANCO_TIMEOUT_CONSULTA_MS,
  }
}
