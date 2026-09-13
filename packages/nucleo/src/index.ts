export {
  CABECALHO_REQUISICAO_ID,
  contextoAtual,
  definirIdentidadeNoContexto,
  executarNoContexto,
  middlewareDeContexto,
  resolverRequisicaoId,
} from './contexto/contexto.js'
export type { ContextoDaRequisicao } from './contexto/contexto.js'
export {
  AMBIENTES,
  ConfiguracaoInvalida,
  EMISSOR_TOKEN_SINTETICO,
  lerConfiguracaoIdentidade,
  MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO,
  TAMANHO_MINIMO_CHAVE_ASSINATURA,
  validarAmbiente,
} from './config/validar-config.js'
export type { Ambiente, ConfiguracaoIdentidade } from './config/validar-config.js'
export { bancoResponde, criarPool, ehErroDeConexao } from './db/pool.js'
export type { ConfiguracaoBanco, PoolBanco } from './db/pool.js'
export { ErroDeDominio, STATUS_HTTP_DO_CODIGO } from './erro/erro-de-dominio.js'
export { FiltroGlobalDeErro } from './erro/filtro-global.js'
export { mapearErroPostgres } from './erro/mapear-erro-postgres.js'
export { ehErroDoPostgres, resumirErro } from './erro/resumir-erro.js'
export type { ErroDoPostgres, ResumoDeErro } from './erro/resumir-erro.js'
export {
  GuardaDeAutenticacao,
  identidadeDaRequisicao,
  RotaAnonima,
} from './identidade/guarda-autenticacao.js'
export { ALGORITMO_TOKEN, TIPO_TOKEN, VALIDADE_MAXIMA_TOKEN_SEGUNDOS, verificarToken } from './identidade/verificar-token.js'
export type { Identidade } from './identidade/verificar-token.js'
export { CAMINHOS_REDACT, CHAVES_PESSOAIS, criarLogger, registrarErrosDoProcesso, TEXTO_REMOVIDO } from './log/logger.js'
export { LoggerDoNest, TEXTO_MENSAGEM_OMITIDA } from './log/logger-do-nest.js'
export type { LoggerBase, OpcoesDoLogger } from './log/logger.js'
