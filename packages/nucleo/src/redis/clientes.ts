import { Redis } from 'ioredis'

/**
 * Tempo máximo de um comando no Redis da API. Passou disso, o comando falha e quem chamou segue
 * sem o Redis (no rate limit, pelo seguro em memória). Um Redis travado não pode segurar a
 * requisição do aluno.
 */
export const TIMEOUT_COMANDO_REDIS_API_MS = 100

/**
 * Cliente do Redis de cache para a API:
 *
 * - `enableOfflineQueue: false`: com o Redis fora, o comando falha na hora, em vez de esperar numa
 *   fila a reconexão com a requisição pendurada;
 * - `commandTimeout`: com o Redis travado (conectado, mas sem responder), o comando falha em
 *   `TIMEOUT_COMANDO_REDIS_API_MS`;
 * - sem `lazyConnect`: a API sobe mesmo com o Redis fora, e o ioredis reconecta sozinho quando ele
 *   volta.
 *
 * O ouvinte de erro é obrigatório: sem ele, o ioredis escreve cada tentativa de reconexão no
 * console, fora do log JSON.
 */
export function criarClienteRedisDaApi(url: string, nome: string, aoErrar: (erro: Error) => void): Redis {
  const cliente = new Redis(url, {
    connectionName: nome,
    enableOfflineQueue: false,
    commandTimeout: TIMEOUT_COMANDO_REDIS_API_MS,
    // Sem fila offline, a tentativa por comando não se aplica; fica explícito que nada é repetido.
    maxRetriesPerRequest: 0,
    // Reconexão com recuo curto e teto de 2 s: o Redis que volta é usado de novo em segundos.
    retryStrategy: (tentativa) => Math.min(tentativa * 100, 2_000),
  })
  cliente.on('error', aoErrar)
  return cliente
}
