import { spawnSync } from 'node:child_process'
import { ARGUMENTOS_COMPOSE, SERVICOS_INFRA } from '../ci/compose.ts'
import { raizRepositorio } from '../ci/executar.ts'

/** Garante Postgres, Redis e storage de pé antes da integração. Idempotente se já estiverem. */
export default function subirInfra(): void {
  const resultado = spawnSync('docker', [...ARGUMENTOS_COMPOSE, 'up', '--detach', '--wait', ...SERVICOS_INFRA], {
    cwd: raizRepositorio,
    stdio: 'inherit',
  })
  if (resultado.status !== 0) {
    throw new Error('Não foi possível subir a infraestrutura de teste com docker compose.')
  }
}
