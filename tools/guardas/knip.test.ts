import { spawnSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { ARGUMENTOS_DO_KNIP } from '../ci/etapas-de-guarda.ts'
import { raizRepositorio } from '../ci/executar.ts'

// A trava de dependência (X5, 24.0; RF13): o knip com `--include dependencies,unlisted,binaries,unresolved`, que a etapa
// de `tools/ci/etapas-de-guarda.ts` e o `guarda:dependencias` rodam. Uma fixture por categoria, em
// `__fixtures__/knip/`, copiada para uma pasta temporária (o knip lê o `package.json` mais próximo, e ali não há nenhum
// do repositório). Os argumentos vêm da própria etapa: categoria tirada dela deixa a fixture da categoria verde.

const KNIP = join(raizRepositorio, 'node_modules/.bin/knip')
const PASTAS: string[] = []

interface Achados {
  issues: Record<string, unknown>[]
}

interface Execucao {
  codigo: number | null
  /** `categoria: nome` de cada achado, ordenado. */
  achados: string[]
}

const CATEGORIAS = ['dependencies', 'devDependencies', 'unlisted', 'binaries', 'unresolved'] as const

function rodarKnip(pasta: string): Execucao {
  const resultado = spawnSync(KNIP, [...ARGUMENTOS_DO_KNIP, '--reporter', 'json'], { cwd: pasta, encoding: 'utf8' })
  expect(resultado.stderr, 'o knip não deve falhar na configuração').toBe('')
  const { issues } = JSON.parse(resultado.stdout) as Achados
  const achados = issues.flatMap((arquivo) =>
    CATEGORIAS.flatMap((categoria) => ((arquivo[categoria] as { name: string }[] | undefined) ?? []).map((achado) => `${categoria}: ${achado.name}`)),
  )
  return { codigo: resultado.status, achados: achados.sort() }
}

function rodarNaFixture(nome: string): Execucao {
  const pasta = mkdtempSync(join(tmpdir(), 'knip-'))
  PASTAS.push(pasta)
  cpSync(join(raizRepositorio, 'tools/guardas/__fixtures__/knip', nome), pasta, { recursive: true })
  return rodarKnip(pasta)
}

afterAll(() => {
  for (const pasta of PASTAS) rmSync(pasta, { recursive: true, force: true })
})

describe('knip: a trava de dependência declarada onde é usada, sem sobra', () => {
  it('o repositório inteiro, com o knip.json da raiz, sai limpo', () => {
    // O comando é o do `guarda:dependencias` e da etapa, sem o relatório em JSON; o código de saída é o que a esteira vê.
    const resultado = spawnSync(KNIP, [...ARGUMENTOS_DO_KNIP], { cwd: raizRepositorio, encoding: 'utf8' })
    expect(resultado.stdout + resultado.stderr).toBe('')
    expect(resultado.status).toBe(0)
  }, 60_000)

  it('a fixture sem violação sai limpa: pacote declarado e usado, binário do node, módulo embutido', () => {
    expect(rodarNaFixture('limpo')).toEqual({ codigo: 0, achados: [] })
  }, 30_000)

  it('import de pacote que o package.json não declara reprova como `unlisted`', () => {
    expect(rodarNaFixture('nao-declarado')).toEqual({ codigo: 1, achados: ['unlisted: pino'] })
  }, 30_000)

  it('pacote declarado e que nada importa reprova como `dependencies`', () => {
    expect(rodarNaFixture('declarado-e-sem-uso')).toEqual({ codigo: 1, achados: ['dependencies: pino'] })
  }, 30_000)

  it('binário chamado em script e não declarado reprova como `binaries`', () => {
    expect(rodarNaFixture('binario-nao-declarado')).toEqual({ codigo: 1, achados: ['binaries: tsc'] })
  }, 30_000)

  it('import que não resolve reprova como `unresolved`', () => {
    expect(rodarNaFixture('import-que-nao-resolve')).toEqual({ codigo: 1, achados: ['unresolved: ./nao-existe.ts'] })
  }, 30_000)

  it('o `guarda:dependencias` do package.json roda o npm audit e depois o knip, com os mesmos argumentos da etapa', () => {
    const { scripts } = JSON.parse(readFileSync(join(raizRepositorio, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    expect(scripts['guarda:dependencias']).toBe(`npm audit --audit-level=high --omit=dev && knip ${ARGUMENTOS_DO_KNIP.join(' ')}`)
  })

  it('o `ignore` do knip.json é só as fixtures de violação, e as exceções de nome são as de fora do npm', () => {
    const configuracao = JSON.parse(readFileSync(join(raizRepositorio, 'knip.json'), 'utf8')) as Record<string, unknown> & {
      workspaces: Record<string, Record<string, unknown>>
    }
    // Lista de chaves permitidas, e não de proibidas: o schema do knip tem muitas portas para calar um achado (`rules`,
    // `exclude`, `ignoreUnresolved`, `ignoreFiles`, `ignoreIssues`, `ignoreWorkspaces`…), e uma nova não pode passar calada.
    expect(Object.keys(configuracao).sort()).toEqual(['$schema', 'ignore', 'workspaces'])
    expect(configuracao['ignore']).toEqual(['tools/guardas/__fixtures__/**', 'tools/ci/fixtures/**'])
    // Cada workspace só diz o que olhar (`entry`, `project`); só a raiz tem exceção de nome, e é de fora do npm: `k6` é o
    // módulo do executor do k6 (`import http from 'k6/http'`); `flock` e `maestri` são comandos do sistema.
    for (const [nome, workspace] of Object.entries(configuracao.workspaces)) {
      const permitidas = nome === '.' ? ['entry', 'ignoreBinaries', 'ignoreDependencies', 'project'] : ['entry', 'project']
      expect(Object.keys(workspace).sort(), `workspace ${nome}`).toEqual(permitidas)
    }
    expect(configuracao.workspaces['.']?.['ignoreDependencies']).toEqual(['k6'])
    expect(configuracao.workspaces['.']?.['ignoreBinaries']).toEqual(['flock', 'maestri'])
  })
})
