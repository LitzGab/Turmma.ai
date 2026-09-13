import { CodigoDeErro } from '@educa/shared'
import { ErroDeDominio } from './erro-de-dominio.js'
import { ehErroDoPostgres } from './resumir-erro.js'

/** SQLSTATE que viram erro que o usuário entende. Todo o resto é `ERRO_INTERNO`. */
const CODIGO_DO_SQLSTATE: Readonly<Record<string, CodigoDeErro>> = {
  // unique_violation: "Enzo Martins já existe"; o valor vem no `detail`, que nunca sai daqui.
  '23505': CodigoDeErro.CONFLITO,
  // query_canceled: o statement_timeout do servidor cortou a consulta.
  '57014': CodigoDeErro.TEMPO_ESGOTADO,
}

/**
 * Traduz um erro do Postgres em `ErroDeDominio`. O erro traduzido não carrega nada do original:
 * nem `message`, nem `detail`, nem `where`. Devolve `undefined` se não for erro do Postgres.
 */
export function mapearErroPostgres(erro: unknown): ErroDeDominio | undefined {
  if (!ehErroDoPostgres(erro)) return undefined
  return new ErroDeDominio(CODIGO_DO_SQLSTATE[erro.code] ?? CodigoDeErro.ERRO_INTERNO)
}
