import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { raizRepositorio } from './executar.ts'

// As dependências que o knip achou faltando (X5, 24.0; RF13): cada uma declarada no pacote que a usa, na versão do
// `package-lock.json` e sem faixa, e o knip como `devDependency` da raiz, exato. A lista de quem falta saiu do knip e não
// da leitura à mão: além das nove do plano, a raiz também precisava de `drizzle-orm` e `zod` (os testes de `tools/guardas/`).

interface PacoteJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface Lock {
  packages: Record<string, PacoteJson & { version?: string }>
}

const ler = <T>(caminho: string): T => JSON.parse(readFileSync(join(raizRepositorio, caminho), 'utf8')) as T

const LOCK = ler<Lock>('package-lock.json')
const EXATA = /^\d+\.\d+\.\d+$/

const DA_RAIZ = ['pg', 'ioredis', '@node-rs/argon2', 'otpauth', 'bullmq', 'socket.io-client', '@opentelemetry/sdk-metrics', 'drizzle-orm', 'zod']

const DECLARADAS: [pacote: string, caminho: string, dependencia: string][] = [
  ...DA_RAIZ.map((dependencia): [string, string, string] => ['raiz', 'package.json', dependencia]),
  ['apps/realtime', 'apps/realtime/package.json', 'jose'],
  ['apps/worker', 'apps/worker/package.json', 'drizzle-orm'],
]

describe('dependências declaradas onde são usadas', () => {
  it.each(DECLARADAS)('%s: %s declara %s como devDependency, na versão do lock, sem faixa', (pacote, caminho, dependencia) => {
    const declarada = ler<PacoteJson>(caminho).devDependencies?.[dependencia]
    expect(declarada, `${caminho} não declara ${dependencia} como devDependency, em versão exata: todas só aparecem em test/, tools/, e2e/ ou infra/, e o que vai à imagem (npm ci --omit=dev) não as leva; se alguma passou a ser importada em src/, a declaração é dependency`).toMatch(EXATA)
    expect(declarada).toBe(LOCK.packages[`node_modules/${dependencia}`]?.version)
    // O lock repete a declaração do pacote: sem isso o `npm ci` recusa o lock.
    const entradaDoLock = LOCK.packages[pacote === 'raiz' ? '' : pacote]
    expect(entradaDoLock?.devDependencies?.[dependencia]).toBe(declarada)
  })

  it('o knip é devDependency da raiz e exato em 6.42.1', () => {
    expect(ler<PacoteJson>('package.json').devDependencies?.['knip']).toBe('6.42.1')
    expect(LOCK.packages['']?.devDependencies?.['knip']).toBe('6.42.1')
    expect(LOCK.packages['node_modules/knip']?.version).toBe('6.42.1')
    expect(ler<PacoteJson>('package.json').dependencies?.['knip']).toBeUndefined()
  })

  it.each(['apps/worker/package.json', 'apps/despachante/package.json'])('%s não declara o pino, que ninguém ali importa', (caminho) => {
    const pacote = ler<PacoteJson>(caminho)
    expect({ ...pacote.dependencies, ...pacote.devDependencies }['pino']).toBeUndefined()
    expect(LOCK.packages[caminho.replace('/package.json', '')]?.dependencies?.['pino']).toBeUndefined()
  })
})
