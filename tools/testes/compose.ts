import { spawn, spawnSync } from 'node:child_process'
import { ARGUMENTOS_COMPOSE } from '../ci/compose.ts'
import { raizRepositorio } from '../ci/executar.ts'

/**
 * Os processos da fila no compose: dois despachantes, duas réplicas do worker interativo (filas
 * interativa e normal) e duas do worker de lote. Teste que usa despachante e worker no próprio processo
 * para estes antes, para nenhum deles disputar as linhas.
 */
export const PROCESSOS_DA_FILA = ['despachante-1', 'despachante-2', 'worker-interativo-1', 'worker-interativo-2', 'worker-lote-1', 'worker-lote-2'] as const

export interface ResultadoComando {
  codigo: number
  saida: string
}

export function compose(...argumentos: string[]): ResultadoComando {
  const resultado = spawnSync('docker', [...ARGUMENTOS_COMPOSE, ...argumentos], {
    cwd: raizRepositorio,
    encoding: 'utf8',
  })
  return { codigo: resultado.status ?? 1, saida: `${resultado.stdout}${resultado.stderr}` }
}

/**
 * Como `compose`, sem bloquear o event loop: o teste segue disparando requisição enquanto o
 * compose reinicia ou para um serviço.
 */
export function composeAssincrono(...argumentos: string[]): Promise<ResultadoComando> {
  return new Promise((resolver) => {
    const processo = spawn('docker', [...ARGUMENTOS_COMPOSE, ...argumentos], { cwd: raizRepositorio })
    let saida = ''
    processo.stdout.on('data', (parte: Buffer) => (saida += parte.toString()))
    processo.stderr.on('data', (parte: Buffer) => (saida += parte.toString()))
    processo.on('error', () => resolver({ codigo: 127, saida }))
    processo.on('close', (codigo) => resolver({ codigo: codigo ?? 1, saida }))
  })
}

export async function composeAssincronoOuFalha(...argumentos: string[]): Promise<string> {
  const resultado = await composeAssincrono(...argumentos)
  if (resultado.codigo !== 0) {
    throw new Error(`docker compose ${argumentos.join(' ')} falhou:\n${resultado.saida}`)
  }
  return resultado.saida
}

export function composeOuFalha(...argumentos: string[]): string {
  const resultado = compose(...argumentos)
  if (resultado.codigo !== 0) {
    throw new Error(`docker compose ${argumentos.join(' ')} falhou:\n${resultado.saida}`)
  }
  return resultado.saida
}

/**
 * Espera o healthcheck do serviço voltar a `healthy`. `up --wait` não serve depois de um
 * `pause`: ele desiste na hora se o último estado registrado for `unhealthy`.
 */
export async function aguardarSaudavel(servico: string, limiteMs = 60_000): Promise<void> {
  const prazo = Date.now() + limiteMs
  while (Date.now() < prazo) {
    const { codigo, saida } = compose('ps', '--all', '--format', '{{.Health}}', servico)
    if (codigo === 0 && saida.trim() === 'healthy') return
    await new Promise((resolver) => setTimeout(resolver, 500))
  }
  // Estado e fim do log junto do erro: na esteira, o log do fim da execução só guarda as últimas linhas de
  // cada serviço, e o trecho da falha já saiu dele.
  const estado = compose('ps', '--all', '--format', '{{.State}} {{.Status}} {{.Health}}', servico).saida.trim()
  const log = compose('logs', '--no-color', '--timestamps', '--tail', '40', servico).saida
  throw new Error(`${servico} não voltou a healthy em ${limiteMs} ms (${estado})\n${log}`)
}
