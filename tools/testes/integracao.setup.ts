import { spawnSync } from 'node:child_process'
import { criarLogger } from '../../packages/nucleo/src/log/logger.ts'
import { migrar } from '../../packages/nucleo/src/db/migrar.ts'
import { ARGUMENTOS_COMPOSE, SERVICOS_INFRA, urlDoBancoDeTeste } from '../ci/compose.ts'
import { raizRepositorio } from '../ci/executar.ts'

// A URL do banco de teste mora em `tools/ci/compose.ts` desde a 18.0: o seed do e2e também precisa dela, e o
// Playwright não carrega este arquivo, que sobe o compose.
export { urlDoBancoDeTeste }

/**
 * Garante Postgres, Redis e storage de pé antes da integração, e o banco com as migrations
 * aplicadas pelo mesmo `migrar` do serviço do compose. Idempotente se já estiverem.
 */
export default async function subirInfra(): Promise<void> {
  const resultado = spawnSync('docker', [...ARGUMENTOS_COMPOSE, 'up', '--detach', '--wait', ...SERVICOS_INFRA], {
    cwd: raizRepositorio,
    stdio: 'inherit',
  })
  if (resultado.status !== 0) {
    throw new Error('Não foi possível subir a infraestrutura de teste com docker compose.')
  }
  await migrar({ url: urlDoBancoDeTeste(), timeoutConexaoMs: 5_000, timeoutConsultaMs: 60_000 }, criarLogger({ servico: 'migrar-teste', nivel: 'warn' }))
}
