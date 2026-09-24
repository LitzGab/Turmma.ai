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
  /**
   * O cookie de renovação acabou de ser trocado por outra aba ou requisição (409): a sessão continua, e a web espera
   * a renovação em andamento e tenta uma vez com o cookie atual.
   */
  JA_RENOVADO: 'JA_RENOVADO',
  /**
   * A conta Google ou Microsoft não entra nesta escola (13.0): não é de um domínio ou tenant que ela liberou, ou não
   * está ligada a ninguém dela. Uma resposta só para todos os casos. Chega à web como `?falha=conta_externa_nao_ligada`.
   */
  CONTA_EXTERNA_NAO_LIGADA: 'CONTA_EXTERNA_NAO_LIGADA',
  /**
   * Área da operação (A0): o acesso de 10 min do operador venceu, e a sessão dele continua viva (401). A web renova e
   * repete, sem mandar a pessoa entrar de novo.
   */
  ACESSO_VENCIDO: 'ACESSO_VENCIDO',
  /**
   * Área da operação (A0): a sessão do operador terminou — 30 min sem uso, 8 h, saída ou operador desativado (401). A
   * web leva à entrada dizendo que a sessão terminou, sem confundir com "não encontrado".
   */
  SESSAO_ENCERRADA: 'SESSAO_ENCERRADA',
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
