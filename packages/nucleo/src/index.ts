export {
  CABECALHO_REQUISICAO_ID,
  contextoAtual,
  executarNoContexto,
  middlewareDeContexto,
  resolverRequisicaoId,
} from './contexto/contexto.js'
export type { ContextoDaRequisicao } from './contexto/contexto.js'
export { bancoResponde, criarPool, ehErroDeConexao } from './db/pool.js'
export type { ConfiguracaoBanco, PoolBanco } from './db/pool.js'
export { ErroDeDominio, STATUS_HTTP_DO_CODIGO } from './erro/erro-de-dominio.js'
export { FiltroGlobalDeErro } from './erro/filtro-global.js'
export { mapearErroPostgres } from './erro/mapear-erro-postgres.js'
export { ehErroDoPostgres, resumirErro } from './erro/resumir-erro.js'
export type { ErroDoPostgres, ResumoDeErro } from './erro/resumir-erro.js'
export { CAMINHOS_REDACT, criarLogger, LoggerDoNest, registrarErrosDoProcesso, TEXTO_REMOVIDO } from './log/logger.js'
export type { LoggerBase, OpcoesDoLogger } from './log/logger.js'
