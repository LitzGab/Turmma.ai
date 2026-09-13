import type { CodigoDeErro } from '@educa/shared'

/** Status HTTP padrão de cada código. Quem lança só muda quando o caso pede outro. */
export const STATUS_HTTP_DO_CODIGO: Readonly<Record<CodigoDeErro, number>> = {
  ERRO_INTERNO: 500,
  ENTRADA_INVALIDA: 400,
  NAO_AUTENTICADO: 401,
  NAO_ENCONTRADO: 404,
  CONFLITO: 409,
  TEMPO_ESGOTADO: 503,
  INDISPONIVEL_TENTE_DE_NOVO: 503,
  LIMITE_EXCEDIDO: 429,
}

/**
 * Erro esperado do domínio. Carrega só o código e o status: não existe construtor com texto
 * livre, então um erro de domínio não tem onde levar nome, matrícula ou valor de campo para a
 * resposta ou para o log.
 */
export class ErroDeDominio extends Error {
  readonly status: number

  constructor(
    readonly codigo: CodigoDeErro,
    status?: number,
  ) {
    super(codigo)
    this.name = 'ErroDeDominio'
    // "Não encontrado" nunca sai com outro status: um 403 confirmaria que o objeto existe (regra 10, item 6).
    this.status = codigo === 'NAO_ENCONTRADO' ? STATUS_HTTP_DO_CODIGO.NAO_ENCONTRADO : (status ?? STATUS_HTTP_DO_CODIGO[codigo])
  }
}
