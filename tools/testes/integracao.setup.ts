import { spawnSync } from 'node:child_process'
import { criarLogger } from '../../packages/nucleo/src/log/logger.ts'
import { migrar } from '../../packages/nucleo/src/db/migrar.ts'
import { ARGUMENTOS_COMPOSE, lerAmbienteDeTeste, SERVICOS_INFRA, valorObrigatorio } from '../ci/compose.ts'
import { raizRepositorio } from '../ci/executar.ts'

/** URL do Postgres do compose de teste, vista da máquina. */
export function urlDoBancoDeTeste(): string {
  const ambiente = lerAmbienteDeTeste()
  const usuario = valorObrigatorio(ambiente, 'POSTGRES_USUARIO')
  const senha = valorObrigatorio(ambiente, 'POSTGRES_SENHA')
  const banco = valorObrigatorio(ambiente, 'POSTGRES_BANCO')
  return `postgres://${usuario}:${senha}@127.0.0.1:${valorObrigatorio(ambiente, 'POSTGRES_PORTA_HOST')}/${banco}`
}

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
