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
