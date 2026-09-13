import { spawnSync } from 'node:child_process'
import { ARGUMENTOS_COMPOSE } from '../ci/compose.ts'
import { raizRepositorio } from '../ci/executar.ts'

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
  throw new Error(`${servico} não voltou a healthy em ${limiteMs} ms`)
}
