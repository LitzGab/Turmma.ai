import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, type Rolldown } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'
import { nomeDoChunk } from './nome-dos-chunks'

// B1 (o nome que o teto de 60 kB mede) e B2 (a entrada da escola não leva nada de `src/operacao/`), sobre o build de
// verdade do Vite, e não sobre o fonte: é o bundler que decide em que chunk cada módulo cai, e um `import` estático
// esquecido, ou uma configuração de chunk que arraste módulos, só aparece aqui.

const raizDaWeb = dirname(fileURLToPath(import.meta.url))
const diretorios: string[] = []

afterEach(() => {
  for (const diretorio of diretorios.splice(0)) rmSync(diretorio, { recursive: true, force: true })
})

type Chunk = Rolldown.OutputChunk

/** Os chunks de JS de um build feito em memória, sem gravar `dist/`. */
async function chunksDoBuild(opcoes: { raiz: string; configFile: string | false }): Promise<Chunk[]> {
  const saida = await build({
    root: opcoes.raiz,
    configFile: opcoes.configFile,
    logLevel: 'silent',
    build: {
      write: false,
      ...(opcoes.configFile === false ? { rolldownOptions: { output: { chunkFileNames: nomeDoChunk } } } : {}),
    },
  })
  const saidas = Array.isArray(saida) ? saida : [saida]
  return saidas.flatMap((resultado) => ('output' in resultado ? resultado.output : [])).filter((item): item is Chunk => item.type === 'chunk')
}

/** Os módulos de `src/operacao/` que o chunk de entrada leva. Lista vazia é a única resposta certa. */
function operacaoNaEntrada(chunks: readonly Chunk[]): string[] {
  const entrada = chunks.find((chunk) => chunk.isEntry)
  if (entrada === undefined) throw new Error('build sem chunk de entrada')
  return entrada.moduleIds.filter((id) => id.replaceAll('\\', '/').includes('/apps/web/src/operacao/'))
}

/**
 * Um projeto mínimo do Vite, numa pasta que também termina em `apps/web`, para o nome do chunk da operação valer do
 * mesmo jeito que no real. `arquivos` é relativo a `apps/web`.
 */
function projetoDeMentira(arquivos: Record<string, string>): string {
  const raiz = join(mkdtempSync(join(tmpdir(), 'educa-chunks-')), 'apps', 'web')
  diretorios.push(dirname(dirname(raiz)))
  const todos = { 'index.html': '<!doctype html><html><body><script type="module" src="/src/main.ts"></script></body></html>', ...arquivos }
  for (const [caminho, conteudo] of Object.entries(todos)) {
    mkdirSync(dirname(join(raiz, caminho)), { recursive: true })
    writeFileSync(join(raiz, caminho), conteudo)
  }
  return raiz
}

describe('nome dos chunks', () => {
  it('o chunk que sai de src/operacao/ é operacao-*; o resto que não é entrada leva o prefixo parte-', () => {
    expect(nomeDoChunk({ facadeModuleId: '/repo/apps/web/src/operacao/rotas.tsx' })).toBe('assets/operacao-[hash].js')
    expect(nomeDoChunk({ facadeModuleId: 'C:\\repo\\apps\\web\\src\\operacao\\rotas.tsx' })).toBe('assets/operacao-[hash].js')
    expect(nomeDoChunk({ facadeModuleId: '/repo/apps/web/src/paginas/index.tsx' })).toBe('assets/parte-[name]-[hash].js')
    expect(nomeDoChunk({ facadeModuleId: null })).toBe('assets/parte-[name]-[hash].js')
  })
})

describe('o build de verdade da web', () => {
  it('B2: a entrada da escola não leva nenhum módulo de src/operacao/, e a área sai num chunk operacao-* só por import()', async () => {
    const chunks = await chunksDoBuild({ raiz: raizDaWeb, configFile: join(raizDaWeb, 'vite.config.ts') })
    const entrada = chunks.find((chunk) => chunk.isEntry)
    const operacao = chunks.filter((chunk) => /^assets\/operacao-[^/]+\.js$/.test(chunk.fileName))

    expect(entrada?.fileName).toMatch(/^assets\/index-[^/]+\.js$/)
    expect(operacaoNaEntrada(chunks)).toEqual([])
    // A área existe e está no chunk dela: sem isto, a asserção acima passaria com a área apagada do build.
    expect(operacao).toHaveLength(1)
    expect(operacao[0]?.moduleIds.some((id) => id.replaceAll('\\', '/').endsWith('/apps/web/src/operacao/rotas.tsx'))).toBe(true)
    // A entrada só chega a ela por `import()`, nunca por `import` estático, que o navegador baixaria junto.
    expect(entrada?.imports).not.toContain(operacao[0]?.fileName)
    expect(entrada?.dynamicImports).toContain(operacao[0]?.fileName)
    // Nenhum módulo da área cai num terceiro chunk (`parte-*`), que nem este teste nem o teto de 60 kB mediriam.
    const foraDoChunkDaArea = chunks
      .filter((chunk) => chunk !== operacao[0])
      .flatMap((chunk) => chunk.moduleIds.filter((id) => id.replaceAll('\\', '/').includes('/apps/web/src/operacao/')))
    expect(foraDoChunkDaArea).toEqual([])
    // Nenhum outro chunk tem o nome da entrada, que o teto de 150 kB mediria como se fosse ela.
    expect(chunks.filter((chunk) => !chunk.isEntry && /^assets\/index-/.test(chunk.fileName))).toEqual([])
  })

  it('controle do B2: um import estático de src/operacao/ na entrada aparece como módulo da operação no chunk de entrada', async () => {
    const raiz = projetoDeMentira({
      'src/main.ts': "import { area } from './operacao/area'\nconsole.log(area)\n",
      'src/operacao/area.ts': "export const area = 'operação'\n",
    })
    const chunks = await chunksDoBuild({ raiz, configFile: false })
    expect(operacaoNaEntrada(chunks)).toEqual([expect.stringMatching(/\/src\/operacao\/area\.ts$/)])
  })

  it('o mesmo módulo por import() não entra na entrada e sai como operacao-*', async () => {
    const raiz = projetoDeMentira({
      'src/main.ts': "void import('./operacao/area').then((modulo) => console.log(modulo.area))\n",
      'src/operacao/area.ts': "export const area = 'operação'\n",
    })
    const chunks = await chunksDoBuild({ raiz, configFile: false })
    expect(operacaoNaEntrada(chunks)).toEqual([])
    expect(chunks.map((chunk) => chunk.fileName)).toContainEqual(expect.stringMatching(/^assets\/operacao-[^/]+\.js$/))
  })

  it('um chunk por import() de um módulo cujo nome começa por index não cai no glob da entrada', async () => {
    // Recomendação da tarefa 2.0: com o nome padrão, este chunk seria `index-lento-*.js`, e o `index-*.js` do teto de
    // 150 kB o mediria como se fosse a entrada.
    const raiz = projetoDeMentira({
      'src/main.ts': "void import('./index-lento').then((modulo) => console.log(modulo.pagina))\n",
      'src/index-lento.ts': "export const pagina = 'uma página'\n",
    })
    const chunks = await chunksDoBuild({ raiz, configFile: false })
    const noGlobDaEntrada = chunks.filter((chunk) => /^assets\/index-/.test(chunk.fileName))
    expect(noGlobDaEntrada.map((chunk) => chunk.isEntry)).toEqual([true])
    expect(chunks.map((chunk) => chunk.fileName)).toContainEqual(expect.stringMatching(/^assets\/parte-index-lento-[^/]+\.js$/))
  })
})
