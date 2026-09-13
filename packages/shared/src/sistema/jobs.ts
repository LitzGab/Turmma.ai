/**
 * Filas de trabalho, da mais urgente para a menos urgente. A prioridade de um job vem da fila
 * dele: interativa (alguém esperando na tela), normal, e lote (ingestão, correção em massa,
 * rotina noturna). Regra 80, item 2.
 */
export const FILAS = ['interativa', 'normal', 'lote'] as const
export type Fila = (typeof FILAS)[number]

/**
 * Ciclo de um job registrado em `job_registro`. Toda troca é condicional à origem, então uma
 * escrita tardia nunca leva um job de volta: `concluido` e `falhou` são finais.
 */
export const ESTADOS_DE_JOB = ['aguardando', 'reservado', 'publicado', 'ativo', 'concluido', 'falhou'] as const
export type EstadoDeJob = (typeof ESTADOS_DE_JOB)[number]

/**
 * Motivo tipado de um job que falhou de vez. É o que fica em `job_registro.codigo_falha`: texto
 * fixo, nunca a mensagem da exceção, que poderia carregar valor de campo.
 */
export const CodigoDeFalhaDeJob = {
  /** O job sintético pediu para falhar (`falhar: true`). */
  FALHA_SINTETICA: 'FALHA_SINTETICA',
  /** Nenhum processador conhece o tipo do job. */
  TIPO_DESCONHECIDO: 'TIPO_DESCONHECIDO',
  /** Os dados do job não passaram na validação do processador. */
  DADOS_INVALIDOS: 'DADOS_INVALIDOS',
  /** Exceção não prevista, esgotadas as tentativas. */
  ERRO_INTERNO: 'ERRO_INTERNO',
} as const

export type CodigoDeFalhaDeJob = (typeof CodigoDeFalhaDeJob)[keyof typeof CodigoDeFalhaDeJob]

export const CODIGOS_DE_FALHA_DE_JOB = Object.values(CodigoDeFalhaDeJob) as [CodigoDeFalhaDeJob, ...CodigoDeFalhaDeJob[]]
