export { CodigoDeErro } from './erros/codigo-de-erro.js'
export type { RespostaDeErro } from './erros/codigo-de-erro.js'
export { MENSAGENS_DE_ERRO } from './erros/mensagens.js'
export { ALCANCES, ALCANCES_INDIVIDUAIS, alcanceDe, MATRIZ, PAPEIS, PAPEIS_DE_USUARIO, RECURSOS } from './permissao/matriz.js'
export type { AcaoDe, Alcance, Papel, PapelDeUsuario, Recurso } from './permissao/matriz.js'
export type { RespostaSaude } from './sistema/saude.js'
export { esquemaRespostaContexto } from './sistema/contexto.js'
export type { RespostaContexto } from './sistema/contexto.js'
export type { RespostaProntidao } from './sistema/prontidao.js'
export { AMBIENTES_DO_SISTEMA, COMPONENTES_DO_SISTEMA, esquemaRespostaEstado, SITUACOES_DE_COMPONENTE } from './sistema/estado.js'
export type { ComponenteDoSistema, RespostaEstado } from './sistema/estado.js'
export { esquemaAviso, esquemaRespostaAvisos, MAXIMO_DE_AVISOS } from './sistema/avisos.js'
export type { Aviso, RespostaAvisos } from './sistema/avisos.js'
export { CODIGOS_DE_FALHA_DE_JOB, CodigoDeFalhaDeJob, ESTADOS_DE_JOB, FILAS } from './sistema/jobs.js'
export type { EstadoDeJob, Fila } from './sistema/jobs.js'
export {
  CPU_MS_MAXIMO_SINTETICO,
  esquemaDadosJobSintetico,
  esquemaPedidoJobSintetico,
  esquemaRespostaEstadoDeJob,
  esquemaRespostaJobAceito,
} from './sistema/jobs-sinteticos.js'
export type { DadosJobSintetico, PedidoJobSintetico, RespostaEstadoDeJob, RespostaJobAceito } from './sistema/jobs-sinteticos.js'
export {
  CAMINHO_REALTIME,
  NAMESPACE_REALTIME_SISTEMA,
  opcoesDoClienteRealtime,
  RECONEXAO_REALTIME,
} from './sistema/realtime.js'
export type { AutenticacaoRealtime, OpcoesDoClienteRealtime } from './sistema/realtime.js'
export {
  esquemaPedidoLoginEmail,
  esquemaRespostaLogin,
  ETAPAS_COM_DESAFIO,
  ETAPAS_DE_LOGIN,
  TAMANHO_MAXIMO_EMAIL,
  TAMANHO_MAXIMO_SENHA,
} from './sessao/login.js'
export type { EtapaComDesafio, EtapaDeLogin, PedidoLoginEmail, RespostaLogin } from './sessao/login.js'
export {
  esquemaPedidoAceitarConvite,
  esquemaPedidoConsultarConvite,
  esquemaRespostaAceitarConvite,
  esquemaRespostaConsultarConvite,
  TAMANHO_MAXIMO_TOKEN_DE_CONVITE,
  TAMANHO_MINIMO_SENHA_NOVA,
} from './sessao/convite.js'
export type { PedidoAceitarConvite, PedidoConsultarConvite, RespostaAceitarConvite, RespostaConsultarConvite } from './sessao/convite.js'
export { esquemaRespostaEu } from './sessao/eu.js'
export type { RespostaEu } from './sessao/eu.js'
export { esquemaRespostaRenovacao } from './sessao/renovacao.js'
export type { RespostaRenovacao } from './sessao/renovacao.js'
export { esquemaPedidoEscolaSessao, esquemaRespostaEscolaSessao, INATIVIDADE_MAXIMA_MIN, INATIVIDADE_MINIMA_MIN } from './sessao/escola-sessao.js'
export type { PedidoEscolaSessao, RespostaEscolaSessao } from './sessao/escola-sessao.js'
export {
  ALFABETO_DO_CODIGO_DE_RECUPERACAO,
  DIGITOS_DO_CODIGO_MFA,
  esquemaPedidoAtivarMfa,
  esquemaPedidoMfa,
  esquemaPedidoRedefinirMfa,
  esquemaRespostaAtivarMfa,
  esquemaRespostaConfigurarMfa,
  FINALIDADE_DA_REDEFINICAO_PELO_OPERADOR,
  FINALIDADES_DA_REDEFINICAO_DE_MFA,
  QUANTIDADE_DE_CODIGOS_DE_RECUPERACAO,
  TAMANHO_DO_CODIGO_DE_RECUPERACAO,
} from './sessao/mfa.js'
export type { FinalidadeDaRedefinicaoDeMfa, PedidoAtivarMfa, PedidoMfa, PedidoRedefinirMfa, RespostaAtivarMfa, RespostaConfigurarMfa } from './sessao/mfa.js'
export { esquemaConsultaPaginada, esquemaDePagina, TAMANHO_MAXIMO_DA_PAGINA, TAMANHO_PADRAO_DA_PAGINA } from './estrutura/paginacao.js'
export type { ConsultaPaginada } from './estrutura/paginacao.js'
export {
  esquemaAnoLetivo,
  esquemaPedidoCriarAnoLetivo,
  esquemaRespostaAnoLetivo,
  esquemaRespostaListaDeAnosLetivos,
  MAIOR_ANO_LETIVO,
  MENOR_ANO_LETIVO,
  SITUACOES_DO_ANO_LETIVO,
} from './estrutura/ano-letivo.js'
export type { AnoLetivo, PedidoCriarAnoLetivo, RespostaAnoLetivo, RespostaListaDeAnosLetivos, SituacaoDoAnoLetivo } from './estrutura/ano-letivo.js'
export { ANOS_DA_ETAPA, esquemaPedidoCriarSerie, esquemaRespostaListaDeSeries, esquemaRespostaSerie, esquemaSerie, ETAPAS } from './estrutura/serie.js'
export type { Etapa, PedidoCriarSerie, RespostaListaDeSeries, RespostaSerie, Serie } from './estrutura/serie.js'
export {
  AREAS_DO_CONHECIMENTO,
  esquemaDisciplina,
  esquemaPedidoCriarDisciplina,
  esquemaRespostaDisciplina,
  esquemaRespostaListaDeDisciplinas,
  TAMANHO_MAXIMO_NOME_DISCIPLINA,
} from './estrutura/disciplina.js'
export type { AreaDoConhecimento, Disciplina, PedidoCriarDisciplina, RespostaDisciplina, RespostaListaDeDisciplinas } from './estrutura/disciplina.js'
export {
  esquemaAlunoDaTurma,
  esquemaConsultaAlunosDaTurma,
  esquemaPedidoCriarTurma,
  esquemaRespostaAlunosDaTurma,
  esquemaRespostaListaDeTurmas,
  esquemaRespostaTurma,
  esquemaRespostaTurmaAberta,
  esquemaTurma,
  FINALIDADES_DA_LEITURA_DE_ALUNOS,
  TAMANHO_MAXIMO_NOME_TURMA,
  TURNOS,
} from './estrutura/turma.js'
export type {
  AlunoDaTurma,
  ConsultaAlunosDaTurma,
  FinalidadeDaLeituraDeAlunos,
  PedidoCriarTurma,
  RespostaAlunosDaTurma,
  RespostaListaDeTurmas,
  RespostaTurma,
  RespostaTurmaAberta,
  Turma,
  Turno,
} from './estrutura/turma.js'
export {
  CONTESTACOES_DE_VINCULO,
  ESTADOS_DE_VINCULO,
  ESTADOS_EM_DECISAO,
  esquemaConsultaVinculos,
  esquemaPedidoContestarVinculo,
  esquemaPedidoCriarVinculo,
  esquemaPedidoEncerrarVinculo,
  esquemaRespostaListaDeVinculos,
  esquemaRespostaMeusVinculos,
  esquemaRespostaVinculo,
  esquemaRespostaVinculoDaCoordenacao,
  esquemaVinculo,
  esquemaVinculoDaCoordenacao,
  MOTIVOS_DE_ENCERRAMENTO_DE_VINCULO,
  MOTIVOS_DE_ENCERRAMENTO_PELA_COORDENACAO,
  PAPEIS_DE_VINCULO,
  PAPEIS_DE_VINCULO_PELA_COORDENACAO,
  TAMANHO_MAXIMO_DO_COMPLEMENTO,
} from './estrutura/vinculo.js'
export type {
  ConsultaVinculos,
  ContestacaoDeVinculo,
  EstadoDeVinculo,
  MotivoDeEncerramentoDeVinculo,
  PapelDeVinculo,
  PedidoContestarVinculo,
  PedidoCriarVinculo,
  PedidoEncerrarVinculo,
  RespostaListaDeVinculos,
  RespostaMeusVinculos,
  RespostaVinculo,
  RespostaVinculoDaCoordenacao,
  Vinculo,
  VinculoDaCoordenacao,
} from './estrutura/vinculo.js'
