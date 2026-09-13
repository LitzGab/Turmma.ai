/**
 * Erro devolvido pelo servidor Postgres. Identificado pela forma, e não por `instanceof`, para
 * não depender de haver uma única cópia de `pg-protocol` instalada.
 */
export interface ErroDoPostgres extends Error {
  code: string
  severity: string
  constraint?: string | undefined
}

const FORMATO_SQLSTATE = /^[0-9A-Z]{5}$/

export function ehErroDoPostgres(erro: unknown): erro is ErroDoPostgres {
  if (!(erro instanceof Error)) return false
  const { code, severity } = erro as Partial<ErroDoPostgres>
  // `severity` separa o SQLSTATE do servidor de código de sistema do Node com cinco letras (EPIPE).
  return typeof code === 'string' && FORMATO_SQLSTATE.test(code) && typeof severity === 'string'
}

/** O que um erro pode deixar no log. Nenhum campo carrega texto montado com dado. */
export interface ResumoDeErro {
  tipo: string
  sqlstate?: string
  constraint?: string
  pilha?: string[]
}

const LINHA_DE_PILHA = /^\s+at\s/

/**
 * Reduz um erro ao que é seguro logar.
 *
 * A mensagem nunca entra. No Postgres, `message` e `detail` trazem valor de linha
 * ("Key (nome)=(Enzo Martins) already exists", "invalid input syntax for type uuid: ..."). Fora
 * dele também: o `SyntaxError` de um corpo JSON inválido cita o trecho recebido. A pilha fica,
 * sem a primeira linha, que repete a mensagem.
 */
export function resumirErro(erro: unknown): ResumoDeErro {
  if (ehErroDoPostgres(erro)) {
    return {
      tipo: 'ErroDoPostgres',
      sqlstate: erro.code,
      ...(erro.constraint === undefined ? {} : { constraint: erro.constraint }),
    }
  }
  if (erro instanceof Error) {
    const pilha = (erro.stack ?? '')
      .split('\n')
      .filter((linha) => LINHA_DE_PILHA.test(linha))
      .map((linha) => linha.trim())
    return { tipo: erro.name, ...(pilha.length > 0 ? { pilha } : {}) }
  }
  return { tipo: typeof erro }
}
