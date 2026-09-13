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
export { criarBanco, lerConfiguracaoBanco, schema } from './db/banco.js'
export type { Banco, Schema, TransacaoBanco } from './db/banco.js'
export { LOCK_TIMEOUT_MIGRACAO_MS, migrar, MigracaoFalhou, PASTA_MIGRACOES, TENTATIVAS_MIGRACAO } from './db/migrar.js'
export type { ConfiguracaoMigracao } from './db/migrar.js'
export { jobRegistro } from './db/schema/job-registro.js'
export { justificativaSemEscopo, SemEscopo } from './db/sem-escopo.decorator.js'
export { DespachoRepository, RESERVA_SEGUNDOS } from './fila/despacho.repository.js'
export type { JobReservado } from './fila/despacho.repository.js'
export { Enfileirador, PRIORIDADE_DA_FILA } from './fila/enfileirador.js'
export type { PedidoDeJob } from './fila/enfileirador.js'
export { CANAL_NOTIFICACAO_JOB, JobRegistroRepository, PREFIXO_TIPO_SISTEMA } from './fila/job-registro.repository.js'
export type { EstadoRegistrado, ResultadoDoInicio } from './fila/job-registro.repository.js'
export { OuvinteDeJobs } from './fila/ouvinte-de-jobs.js'
export {
  esquemaDadosDoJobNaFila,
  JITTER_DO_RECUO,
  NOME_DA_FILA_DE_JOBS,
  OPCOES_DE_JOB_PUBLICADO,
  RECUO_INICIAL_JOB_MS,
  RETENCAO_JOB_CONCLUIDO_SEGUNDOS,
  RETENCAO_JOB_FALHO_SEGUNDOS,
  TENTATIVAS_DE_JOB,
} from './fila/publicacao.js'
export type { DadosDoJobNaFila } from './fila/publicacao.js'
export { ErroDeDominio, STATUS_HTTP_DO_CODIGO, TENTE_DE_NOVO_PADRAO_SEGUNDOS } from './erro/erro-de-dominio.js'
export { FiltroGlobalDeErro } from './erro/filtro-global.js'
export { mapearErroPostgres } from './erro/mapear-erro-postgres.js'
export { ehErroDoPostgres, erroDoPostgresEm, resumirErro } from './erro/resumir-erro.js'
export type { ErroDoPostgres, ResumoDeErro } from './erro/resumir-erro.js'
export { GuardaDeAutenticacao, identidadeDaRequisicao } from './identidade/guarda-autenticacao.js'
export { ALGORITMO_TOKEN, TIPO_TOKEN, VALIDADE_MAXIMA_TOKEN_SEGUNDOS, verificarToken } from './identidade/verificar-token.js'
export type { Identidade } from './identidade/verificar-token.js'
export { CAMINHOS_REDACT, CHAVES_PESSOAIS, criarLogger, registrarErrosDoProcesso, TEXTO_REMOVIDO } from './log/logger.js'
export { avisoEspacado } from './log/aviso-espacado.js'
export { LoggerDoNest, TEXTO_MENSAGEM_OMITIDA } from './log/logger-do-nest.js'
export type { LoggerBase, OpcoesDoLogger } from './log/logger.js'
export { ARQUIVO_BATIMENTO, Batimento, COMANDO_HEALTHCHECK_BATIMENTO, IDADE_MAXIMA_BATIMENTO_MS } from './instancia/batimento.js'
export { Drenagem, lerConfiguracaoDrenagem, OCIOSIDADE_HTTP_MS } from './instancia/drenagem.js'
export type { ConfiguracaoDrenagem, RespostaDeProntidao } from './instancia/drenagem.js'
export {
  IP_DESCONHECIDO,
  ipDoCliente,
  JANELA_LIMITE_SEGUNDOS,
  limiteDoSeguro,
  PREFIXO_LIMITE_ESCOLA,
  PREFIXO_LIMITE_IP,
  PREFIXO_LIMITE_USUARIO,
} from './limite/chaves.js'
export { GuardaDeLimite } from './limite/guarda-limite.js'
export { LimitadorDeRequisicoes, lerConfiguracaoLimite } from './limite/limitador.js'
export type { ConfiguracaoLimite, ResultadoDoLimite } from './limite/limitador.js'
export { ProxiesConfiaveis } from './limite/proxies-confiaveis.js'
export { RotaAnonima, SemLimite } from './limite/rota-anonima.decorator.js'
export { criarClienteRedisDaApi, TIMEOUT_COMANDO_REDIS_API_MS } from './redis/clientes.js'
