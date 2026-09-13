import type { CodigoDeErro } from '@educa/shared'

/** Status HTTP padrão de cada código. Quem lança só muda quando o caso pede outro. */
export const STATUS_HTTP_DO_CODIGO: Readonly<Record<CodigoDeErro, number>> = {
  ERRO_INTERNO: 500,
  ENTRADA_INVALIDA: 400,
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
    this.status = status ?? STATUS_HTTP_DO_CODIGO[codigo]
  }
}
