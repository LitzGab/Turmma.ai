import pg from 'pg'

export interface ConfiguracaoBanco {
  url: string
  maximoConexoes: number
  timeoutConexaoMs: number
  timeoutConsultaMs: number
}

export type PoolBanco = pg.Pool

/**
 * Pool único por processo. Os timeouts existem para que um Postgres travado vire resposta
 * rápida de indisponível, e não requisição pendurada ocupando o event loop na hora da aula.
 */
export function criarPool(config: ConfiguracaoBanco, aoPerderConexaoOciosa: () => void): PoolBanco {
  const pool = new pg.Pool({
    connectionString: config.url,
    max: config.maximoConexoes,
    connectionTimeoutMillis: config.timeoutConexaoMs,
    // O servidor cancela primeiro (57014) e libera o Postgres; o timeout do cliente é o seguro
    // para Postgres travado, que nem consegue cancelar. Nos dois casos `pool.query` descarta a
    // conexão (release com erro) e o pool abre outra na próxima consulta.
    statement_timeout: config.timeoutConsultaMs,
    query_timeout: config.timeoutConsultaMs + config.timeoutConexaoMs,
    // Sem keepalive, conexão ociosa derrubada em silêncio por NAT só aparece no timeout da próxima consulta.
    keepAlive: true,
  })
  // Sem ouvinte, o 'error' de uma conexão ociosa que o Postgres derrubou encerra o processo.
  pool.on('error', aoPerderConexaoOciosa)
  return pool
}

/** Consulta real ao banco: `true` só se o Postgres respondeu dentro do timeout. */
export async function bancoResponde(pool: PoolBanco): Promise<boolean> {
  try {
    await pool.query('select 1')
    return true
  } catch {
    return false
  }
}
