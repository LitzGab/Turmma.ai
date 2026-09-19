import { Redis } from 'ioredis'

/**
 * Trava o Redis por `duracaoMs`, com a conexão dos clientes aberta: `CLIENT PAUSE <ms> ALL`, mandado por uma conexão
 * própria. É o Redis "conectado, sem responder" (Tech Spec da identidade, seção 5; tarefa 15.5), que o `docker compose
 * pause` também faz, mas sem mexer no contêiner, e com fim marcado pelo próprio Redis: a pausa acaba sozinha, mesmo que o
 * teste quebre no meio.
 *
 * Devolve depois de a pausa começar. `fim` resolve quando o Redis volta a responder: o `PING` desta conexão fica na fila
 * da pausa, como os comandos dos outros clientes.
 */
export async function travarRedis(url: string, duracaoMs: number): Promise<{ readonly fim: Promise<void> }> {
  const conexao = new Redis(url, { connectionName: 'teste-redis-travado', maxRetriesPerRequest: null })
  conexao.on('error', () => undefined)
  await conexao.call('CLIENT', 'PAUSE', String(duracaoMs), 'ALL')
  const fim = conexao.ping().then(async () => {
    await conexao.quit()
  })
  return { fim }
}
