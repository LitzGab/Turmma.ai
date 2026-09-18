export {
  CABECALHO_REQUISICAO_ID,
  contextoAtual,
  definirSessaoNoContexto,
  executarNoContexto,
  middlewareDeContexto,
  resolverRequisicaoId,
} from './contexto/contexto.js'
export type { ContextoDaRequisicao, SessaoDaRequisicao } from './contexto/contexto.js'
export { exigirAnoEmCurso } from './contexto/ano-em-curso.js'
export {
  AMBIENTES,
  ConfiguracaoInvalida,
  EMISSOR_TOKEN,
  lerConfiguracaoIdentidade,
  lerVagasPorEscolaDesligadas,
  MOTIVO_VAGAS_DESLIGADAS_EM_PRODUCAO,
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
export { justificativaSemEscopo, SemEscopo, TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO } from './db/sem-escopo.decorator.js'
export {
  ConfiguracaoOperacional,
  lerJanelaPadrao,
  lerVagasPadrao,
  NOVA_TENTATIVA_DA_CONFIGURACAO_MS,
  resolverJanela,
  resolverLimites,
  resolverVagas,
  resolverVagasDaEscola,
  VAGAS_SEM_LIMITE,
  VALIDADE_DA_CONFIGURACAO_MS,
} from './configuracao/configuracao-operacional.js'
export type { CampoDaJanelaDescartado, LimitesDeRequisicao, OpcoesDaConfiguracaoOperacional, VagasPorFila } from './configuracao/configuracao-operacional.js'
export { estaNaJanela, fusoValido, msDoHorario, proximaAbertura } from './fila/janela-letiva.js'
export type { JanelaLetiva } from './fila/janela-letiva.js'
export { relogioDoSistema } from './relogio.js'
export type { Relogio } from './relogio.js'
export { ConfiguracaoOperacionalRepository } from './configuracao/configuracao-operacional.repository.js'
export type { LinhaOperacional } from './configuracao/configuracao-operacional.repository.js'
export { configuracaoOperacionalEscola } from './db/schema/configuracao-operacional-escola.js'
export type { VagasConfiguradas } from './db/schema/configuracao-operacional-escola.js'
export { DespachoRepository, IDADE_PARA_RECONCILIAR_SEGUNDOS, RESERVA_SEGUNDOS, TETO_DA_CONTAGEM_DE_PENDENTES } from './fila/despacho.repository.js'
export type { CursorDaReconciliacao, EscolaComPendentes, JobParaReconciliar, JobReservado, MedicaoDePendentes } from './fila/despacho.repository.js'
export { FILAS_POR_PRIORIDADE, nomeDaFilaBullMQ, OPCOES_DO_POOL_POR_FILA } from './fila/filas.js'
export type { OpcoesDoPool } from './fila/filas.js'
export { DONO_DAS_VAGAS_DO_SISTEMA, INTERVALO_RENOVACAO_DA_VAGA_MS, VagasPorEscola, VALIDADE_DA_VAGA_MS } from './fila/vagas-por-escola.js'
export { Enfileirador, PRIORIDADE_DA_FILA } from './fila/enfileirador.js'
export type { PedidoDeJob } from './fila/enfileirador.js'
export { CANAL_NOTIFICACAO_JOB, JobRegistroRepository, PREFIXO_TIPO_SISTEMA } from './fila/job-registro.repository.js'
export type { EstadoRegistrado, JobParaExecutar, ResultadoDoInicio } from './fila/job-registro.repository.js'
export { EfeitoSinteticoRepository, TABELA_DO_EFEITO_SINTETICO } from './fila/efeito-sintetico.repository.js'
export type { EfeitoDaExecucao } from './fila/efeito-sintetico.repository.js'
export { OuvinteDeJobs } from './fila/ouvinte-de-jobs.js'
export {
  esquemaDadosDoJobNaFila,
  JITTER_DO_RECUO,
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
export { GuardaDeAutenticacao, identidadeDaRequisicao, sessaoDaRequisicao } from './identidade/guarda-autenticacao.js'
export { ALGORITMO_TOKEN, extrairTokenBearer, TIPO_TOKEN, VALIDADE_MAXIMA_TOKEN_SEGUNDOS, verificarToken } from './identidade/verificar-token.js'
export type { Identidade, TokenVerificado } from './identidade/verificar-token.js'
export { EmissorDeToken, VALIDADE_TOKEN_ACESSO_SEGUNDOS } from './identidade/emissor-de-token.js'
export type { PedidoDeTokenDeAcesso, TokenDeAcesso } from './identidade/emissor-de-token.js'
export { avaliarSessao, inatividadeDoPapel, sessaoAindaVale, tokenDaUltimaRenovacao, TOLERANCIA_DE_INATIVIDADE_MIN } from './identidade/avaliar-sessao.js'
export type { EstadoDaSessao } from './identidade/avaliar-sessao.js'
export { GuardaDeSessao } from './identidade/guarda-sessao.js'
export type { LeituraDeSessao } from './identidade/guarda-sessao.js'
export { SessaoRepository } from './identidade/sessao.repository.js'
export type { LinhaDaSessao } from './identidade/sessao.repository.js'
export { ConferenciaDasPermissoes, rotasSemPermissao } from './permissao/conferencia-das-permissoes.js'
export { GuardaDePermissao } from './permissao/guarda-permissao.js'
export { METADADO_PERMITE, Permite } from './permissao/permite.decorator.js'
export type { CelulaPermitida } from './permissao/permite.decorator.js'
export { CAMINHOS_REDACT, CHAVES_DE_CREDENCIAL, CHAVES_DE_IDENTIDADE, CHAVES_PESSOAIS, criarLogger, registrarErrosDoProcesso, TEXTO_REMOVIDO } from './log/logger.js'
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
export { GuardaDeLimite, ipDaRequisicao } from './limite/guarda-limite.js'
export { LimitadorDeRequisicoes, lerConfiguracaoLimite } from './limite/limitador.js'
export type { ConfiguracaoLimite, ResultadoDoLimite } from './limite/limitador.js'
export { ProxiesConfiaveis } from './limite/proxies-confiaveis.js'
export { RotaAnonima, SemLimite } from './limite/rota-anonima.decorator.js'
export { criarClienteRedisDaApi, criarClienteRedisDaFila, TIMEOUT_COMANDO_REDIS_API_MS, TIMEOUT_COMANDO_REDIS_FILA_MS } from './redis/clientes.js'
export { usoInfraDiario } from './db/schema/uso-infra-diario.js'
export { diaAnterior, diaDeUso, diaValido, FORMATO_DIA, FORMATO_MES, FUSO_DO_USO, limitesDoMes } from './uso/dia-de-uso.js'
export { CHAVES_POR_LEITURA, ContadorDeUso, VALIDADE_DO_CONTADOR_SEGUNDOS } from './uso/contador-uso.js'
export type { ContagemDoDia, MetricaDeUso, OpcoesDoContadorDeUso } from './uso/contador-uso.js'
export { InterceptorDeUso } from './uso/interceptor-de-uso.js'
export { UsoRepository } from './uso/uso.repository.js'
export type { UsoDoPeriodo } from './uso/uso.repository.js'
export { iniciarTelemetria, lerConfiguracaoTelemetria, medidorGlobal, NOME_DO_MEDIDOR, PRAZO_DA_EXPORTACAO_MS } from './telemetria/iniciar.js'
export { temporalidadeDasMetricas } from './telemetria/temporalidade.js'
export type { ConfiguracaoTelemetria, ServicoInstrumentado, Telemetria } from './telemetria/iniciar.js'
export {
  LIMITES_DO_HISTOGRAMA_HTTP_S,
  METRICAS,
  METRICAS_COM_ESCOLA,
  middlewareDeMetricasHttp,
  observarConexoesRealtime,
  observarEventLoop,
  observarPoolDoBanco,
  observarRedis,
  observarSeguroDoLimite,
  ROTA_NAO_ENCONTRADA,
  rotaDaRequisicao,
  ROTULO_ESCOLA,
} from './telemetria/metricas.js'
export type { InstanciaRedis } from './telemetria/metricas.js'
export type { Meter } from '@opentelemetry/api'
export { FATIAS_DA_PROPORCAO_DO_SEGURO, JANELA_DA_PROPORCAO_DO_SEGURO_MS, ProporcaoEmJanela } from './limite/proporcao-em-janela.js'
export { ExpurgoDeJobsRepository, instrucaoDoLoteVencido, LOTE_DO_EXPURGO, RETENCAO_JOB_REGISTRO_DIAS } from './retencao/expurgo-de-jobs.repository.js'
export { rede, TIPOS_DE_REDE } from './db/schema/rede.js'
export type { TipoDeRede } from './db/schema/rede.js'
export { escola, FORMATO_SLUG, INATIVIDADE_ALUNO_PADRAO_MIN, INATIVIDADE_EQUIPE_PADRAO_MIN, TAMANHO_MAXIMO_SLUG } from './db/schema/escola.js'
export { FORMATO_OPERADOR } from './db/schema/auditoria.js'
export { anoLetivo, SITUACOES_DE_ANO_LETIVO } from './db/schema/ano-letivo.js'
export type { SituacaoDeAnoLetivo } from './db/schema/ano-letivo.js'
export { conta } from './db/schema/conta.js'
export { codigoRecuperacao } from './db/schema/codigo-recuperacao.js'
export { usuario } from './db/schema/usuario.js'
export { DURACAO_DA_SESSAO_HORAS, METODOS_DE_SESSAO, MOTIVOS_DE_ENCERRAMENTO, sessao } from './db/schema/sessao.js'
export type { MetodoDeSessao, MotivoDeEncerramento } from './db/schema/sessao.js'
export { EVENTOS_DE_ACESSO, registroAcesso } from './db/schema/registro-acesso.js'
export type { EventoDeAcesso } from './db/schema/registro-acesso.js'
export { ACOES_DE_AUDITORIA, CAMPOS_PROIBIDOS_NA_AUDITORIA, problemasDoMapaDeAcoes } from './auditoria/acoes.js'
export type { AcaoDeAuditoria, DefinicaoDeAcao, EstadosDaAcao } from './auditoria/acoes.js'
export { AuditoriaRecusada, MOTIVOS_DE_RECUSA_DA_AUDITORIA } from './auditoria/auditoria-recusada.js'
export type { MotivoDeRecusaDaAuditoria } from './auditoria/auditoria-recusada.js'
export { RegistroDeAuditoria } from './auditoria/registro-de-auditoria.js'
export type { DadosDaAuditoria } from './auditoria/registro-de-auditoria.js'
// Só leitura: a escrita em `auditoria` tem uma porta só, o RegistroDeAuditoria (a tabela e o insert ficam fora do pacote).
export { AuditoriaRepository, LIMITE_MAXIMO_DA_LISTAGEM, LIMITE_PADRAO_DA_LISTAGEM } from './auditoria/auditoria.repository.js'
export type { ExecutorDeAuditoria, RegistroAuditado } from './auditoria/auditoria.repository.js'
