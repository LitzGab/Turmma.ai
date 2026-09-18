/**
 * Código tipado de toda resposta de erro da API. O frontend decide o que mostrar pelo código,
 * nunca lendo a mensagem (regra 00, item 9).
 */
export const CodigoDeErro = {
  ERRO_INTERNO: 'ERRO_INTERNO',
  ENTRADA_INVALIDA: 'ENTRADA_INVALIDA',
  NAO_AUTENTICADO: 'NAO_AUTENTICADO',
  NAO_ENCONTRADO: 'NAO_ENCONTRADO',
  CONFLITO: 'CONFLITO',
  TEMPO_ESGOTADO: 'TEMPO_ESGOTADO',
  INDISPONIVEL_TENTE_DE_NOVO: 'INDISPONIVEL_TENTE_DE_NOVO',
  LIMITE_EXCEDIDO: 'LIMITE_EXCEDIDO',
  /** Senha errada repetida segurou a conta por um tempo (429 com `Retry-After`): por conta, nunca por IP. */
  CONTA_SEGURADA: 'CONTA_SEGURADA',
} as const

export type CodigoDeErro = (typeof CodigoDeErro)[keyof typeof CodigoDeErro]

/**
 * Envelope de toda resposta de erro. Não há campo livre: nem stack, nem consulta, nem valor
 * de campo. "Não encontrado" e "sem permissão" chegam aqui iguais (regra 10, item 6).
 */
export interface RespostaDeErro {
  erro: {
    codigo: CodigoDeErro
    mensagem: string
    requisicaoId: string
  }
}
