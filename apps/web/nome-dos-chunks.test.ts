import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build, type Rolldown } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'
import { AREAS_DA_ESCOLA, ehPecaForaDaEntrada, nomeDoChunk, PECAS_FORA_DA_ENTRADA } from './nome-dos-chunks'

// B1 (o nome que o teto de 60 kB mede) e B2 (a entrada da escola não leva nada de `src/operacao/`), e o mesmo para a área
// de cada papel da escola (A1, tarefa 11.0), sobre o build de verdade do Vite, e não sobre o fonte: é o bundler que decide
// em que chunk cada módulo cai, e um `import` estático esquecido, ou uma configuração de chunk que arraste módulos, só
// aparece aqui.

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

  it('o chunk que sai de src/areas/<papel>/ leva o nome da pasta; o que está na raiz de src/areas/, não', () => {
    expect(nomeDoChunk({ facadeModuleId: '/repo/apps/web/src/areas/coordenacao/rotas.tsx' })).toBe('assets/coordenacao-[hash].js')
    expect(nomeDoChunk({ facadeModuleId: '/repo/apps/web/src/areas/professor/rotas.tsx' })).toBe('assets/professor-[hash].js')
    expect(nomeDoChunk({ facadeModuleId: 'C:\\repo\\apps\\web\\src\\areas\\aluno\\rotas.tsx' })).toBe('assets/aluno-[hash].js')
    // A tabela da navegação é da entrada, e uma pasta que só começa com o nome de uma área não é a área.
    expect(nomeDoChunk({ facadeModuleId: '/repo/apps/web/src/areas/navegacao.ts' })).toBe('assets/parte-[name]-[hash].js')
    expect(nomeDoChunk({ facadeModuleId: '/repo/apps/web/src/areas/professores/rotas.tsx' })).toBe('assets/parte-[name]-[hash].js')
  })

  it('o chunk que sai de src/galeria/ é galeria-*, fora do glob do primeiro carregamento', () => {
    expect(nomeDoChunk({ facadeModuleId: '/repo/apps/web/src/galeria/Galeria.tsx' })).toBe('assets/galeria-[hash].js')
    expect(nomeDoChunk({ facadeModuleId: 'C:\\repo\\apps\\web\\src\\galeria\\Galeria.tsx' })).toBe('assets/galeria-[hash].js')
  })

  it('o pedaço sem fachada que só tem peças é pecas-*; com um módulo que não é peça, ou sem nenhum da web, continua parte-*', () => {
    const peca = '/repo/apps/web/src/componentes/ia/CaixaPedido.tsx'
    const geral = '/repo/apps/web/src/componentes/Menu.tsx'
    const deFora = '/repo/node_modules/lucide-react/dist/esm/icons/check.js'
    expect(nomeDoChunk({ facadeModuleId: null, moduleIds: [peca, geral, deFora] })).toBe('assets/pecas-[name]-[hash].js')
    expect(nomeDoChunk({ facadeModuleId: null, moduleIds: ['C:\\repo\\apps\\web\\src\\componentes\\ia\\textos-das-fontes.ts'] })).toBe('assets/pecas-[name]-[hash].js')
    // O `Dialogo` é da entrada: o pedaço que o leva conta no primeiro carregamento, mesmo com uma peça ao lado.
    expect(nomeDoChunk({ facadeModuleId: null, moduleIds: [peca, '/repo/apps/web/src/componentes/Dialogo.tsx'] })).toBe('assets/parte-[name]-[hash].js')
    // Só React, ou só o contrato compartilhado: é o que a entrada baixa, e continua `parte-*`.
    expect(nomeDoChunk({ facadeModuleId: null, moduleIds: [deFora] })).toBe('assets/parte-[name]-[hash].js')
    expect(nomeDoChunk({ facadeModuleId: null, moduleIds: [] })).toBe('assets/parte-[name]-[hash].js')
  })

  it('peça fora da entrada é a pasta componentes/ia/ e a lista das gerais, e nada mais de componentes/', () => {
    expect(ehPecaForaDaEntrada('/repo/apps/web/src/componentes/ia/motor-formulario.ts')).toBe(true)
    expect(ehPecaForaDaEntrada('/repo/apps/web/src/componentes/Abas.tsx')).toBe(true)
    expect(ehPecaForaDaEntrada('/repo/apps/web/src/componentes/teclado-das-abas.ts')).toBe(true)
    expect(ehPecaForaDaEntrada('/repo/apps/web/src/componentes/SeloDeEstado.tsx?v=1')).toBe(true)
    // As que a entrada usa, e as que só têm o nome parecido.
    for (const daEntrada of ['Botao.tsx', 'botao-secundario.ts', 'Dialogo.tsx', 'Campo.tsx', 'estado/EstadoVazio.tsx', 'MenuDaPessoa.tsx', 'seletor.ts', 'pedidos/Menu.tsx'])
      expect(ehPecaForaDaEntrada(`/repo/apps/web/src/componentes/${daEntrada}`), daEntrada).toBe(false)
    expect(ehPecaForaDaEntrada('/repo/apps/web/src/areas/professor/Menu.tsx')).toBe(false)
  })
})

/** Os módulos de `src/areas/<papel>/` que um chunk leva. */
function modulosDeArea(chunk: Chunk): string[] {
  return chunk.moduleIds.filter((id) => AREAS_DA_ESCOLA.some((area) => id.replaceAll('\\', '/').includes(`/apps/web/src/areas/${area}/`)))
}

/** Os chunks que o chunk dado importa estaticamente, e os que eles importam: o que o navegador baixa junto com ele. */
function importadosJunto(chunks: readonly Chunk[], chunk: Chunk): Chunk[] {
  const vistos = new Map<string, Chunk>()
  const pendentes = [...chunk.imports]
  while (pendentes.length > 0) {
    const nome = pendentes.pop() ?? ''
    const importado = chunks.find((outro) => outro.fileName === nome)
    if (importado === undefined || vistos.has(nome)) continue
    vistos.set(nome, importado)
    pendentes.push(...importado.imports)
  }
  return [...vistos.values()]
}

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

  it('as áreas da escola: um chunk por papel, só por import(), fora da entrada, e o primeiro carregamento inteiro no teto', async () => {
    const chunks = await chunksDoBuild({ raiz: raizDaWeb, configFile: join(raizDaWeb, 'vite.config.ts') })
    const entrada = chunks.find((chunk) => chunk.isEntry)
    if (entrada === undefined) throw new Error('build sem chunk de entrada')

    expect(modulosDeArea(entrada)).toEqual([])
    for (const area of AREAS_DA_ESCOLA) {
      const daArea = chunks.filter((chunk) => new RegExp(`^assets/${area}-[^/]+\\.js$`).test(chunk.fileName))
      expect(daArea, `chunk ${area}-*`).toHaveLength(1)
      expect(daArea[0]?.moduleIds.some((id) => id.replaceAll('\\', '/').endsWith(`/apps/web/src/areas/${area}/rotas.tsx`))).toBe(true)
      expect(entrada.imports).not.toContain(daArea[0]?.fileName)
      expect(entrada.dynamicImports).toContain(daArea[0]?.fileName)
      // Nenhum módulo da área cai fora do chunk dela, onde o teto dela não o mediria.
      const foraDaArea = chunks.filter((chunk) => chunk !== daArea[0]).flatMap((chunk) => chunk.moduleIds.filter((id) => id.replaceAll('\\', '/').includes(`/apps/web/src/areas/${area}/`)))
      expect(foraDaArea).toEqual([])
    }
    // O que a entrada baixa junto é primeiro carregamento, e o teto de 150 kB mede `index-*` e `parte-*`: qualquer outro
    // nome aqui (uma área, a operação) ficaria fora da conta, ou entraria no primeiro carregamento sem ninguém ver.
    expect(importadosJunto(chunks, entrada).map((chunk) => chunk.fileName).filter((nome) => !/^assets\/parte-[^/]+\.js$/.test(nome))).toEqual([])
    for (const junto of importadosJunto(chunks, entrada)) expect(modulosDeArea(junto)).toEqual([])
  })

  it('as peças do MVP de apresentação ficam fora do primeiro carregamento, e a galeria sai num chunk galeria-* só por import()', async () => {
    const chunks = await chunksDoBuild({ raiz: raizDaWeb, configFile: join(raizDaWeb, 'vite.config.ts') })
    const entrada = chunks.find((chunk) => chunk.isEntry)
    if (entrada === undefined) throw new Error('build sem chunk de entrada')
    const galeria = chunks.filter((chunk) => /^assets\/galeria-[^/]+\.js$/.test(chunk.fileName))

    expect(galeria).toHaveLength(1)
    expect(galeria[0]?.moduleIds.some((id) => id.replaceAll('\\', '/').endsWith('/apps/web/src/galeria/Galeria.tsx'))).toBe(true)
    expect(entrada.imports).not.toContain(galeria[0]?.fileName)
    expect(entrada.dynamicImports).toContain(galeria[0]?.fileName)

    // Nenhuma peça na entrada nem no que ela baixa junto: é o que mantém o Chromebook das 7h30 sem o peso delas.
    const primeiroCarregamento = [entrada, ...importadosJunto(chunks, entrada)]
    expect(primeiroCarregamento.flatMap((chunk) => chunk.moduleIds.filter(ehPecaForaDaEntrada))).toEqual([])
    // E as peças existem no build, cada arquivo da lista e a pasta de IA: sem isto, a asserção acima passaria com as
    // peças apagadas, ou com a lista apontando para arquivos que mudaram de nome.
    const noBuild = chunks.flatMap((chunk) => chunk.moduleIds.map((id) => id.replaceAll('\\', '/')))
    for (const peca of PECAS_FORA_DA_ENTRADA) expect(noBuild.some((id) => new RegExp(`/apps/web/src/componentes/${peca}\\.tsx?$`).test(id)), peca).toBe(true)
    for (const deIa of ['AssinaturaIA.tsx', 'CaixaPedido.tsx', 'ChipFonte.tsx', 'Escolha.tsx', 'MotorFormulario.tsx'])
      expect(noBuild.some((id) => id.endsWith(`/apps/web/src/componentes/ia/${deIa}`)), deIa).toBe(true)
    // Peça nenhuma cai num `parte-*`, que o teto de 150 kB mediria como primeiro carregamento sem ela estar nele.
    const emParte = chunks.filter((chunk) => /^assets\/parte-/.test(chunk.fileName)).flatMap((chunk) => chunk.moduleIds.filter(ehPecaForaDaEntrada))
    expect(emParte).toEqual([])
  })

  it('a peça que duas telas dividem sai num pedaço pecas-*, e o que elas dividem e não é peça continua parte-*', async () => {
    // Uma função que lê o documento, e não uma constante de texto: a constante seria copiada para dentro de quem a usa, e
    // o módulo sumiria do build.
    const SELO_DE_MENTIRA = 'export function selo(): string {\n  return `IA em ${document.title}`\n}\n'
    const raiz = projetoDeMentira({
      'src/main.ts': "void import('./areas/professor/rotas').then((m) => console.log(m.tela))\nvoid import('./galeria/Galeria').then((m) => console.log(m.tela))\n",
      'src/areas/professor/rotas.ts': "import { selo } from '../../componentes/ia/selo'\nimport { comum } from '../../componentes/comum'\nexport const tela = `professor ${selo()} ${comum()}`\n",
      'src/galeria/Galeria.ts': "import { selo } from '../componentes/ia/selo'\nimport { comum } from '../componentes/comum'\nexport const tela = `galeria ${selo()} ${comum()}`\n",
      'src/componentes/ia/selo.ts': SELO_DE_MENTIRA,
      'src/componentes/comum.ts': "export function comum(): string {\n  return `não é peça em ${document.title}`\n}\n",
    })
    const chunks = await chunksDoBuild({ raiz, configFile: false })
    const comOSelo = chunks.find((chunk) => chunk.moduleIds.some((id) => id.replaceAll('\\', '/').endsWith('/src/componentes/ia/selo.ts')))
    const semFachada = chunks.filter((chunk) => chunk.facadeModuleId === null)
    // O Rolldown junta num pedaço só o que as mesmas telas dividem: a peça e o módulo comum caem juntos, e o pedaço
    // misto conta no primeiro carregamento, que é o lado seguro.
    expect(semFachada.map((chunk) => chunk.fileName)).toEqual([expect.stringMatching(/^assets\/parte-[^/]+\.js$/)])
    expect(comOSelo?.fileName).toMatch(/^assets\/parte-/)
    expect(chunks.map((chunk) => chunk.fileName)).toContainEqual(expect.stringMatching(/^assets\/galeria-[^/]+\.js$/))

    // Sem o módulo que não é peça, o pedaço dividido só tem peças, e sai do glob do primeiro carregamento.
    const soPecas = projetoDeMentira({
      'src/main.ts': "void import('./areas/professor/rotas').then((m) => console.log(m.tela))\nvoid import('./galeria/Galeria').then((m) => console.log(m.tela))\n",
      'src/areas/professor/rotas.ts': "import { selo } from '../../componentes/ia/selo'\nexport const tela = `professor ${selo()}`\n",
      'src/galeria/Galeria.ts': "import { selo } from '../componentes/ia/selo'\nexport const tela = `galeria ${selo()}`\n",
      'src/componentes/ia/selo.ts': SELO_DE_MENTIRA,
    })
    const chunksSoPecas = await chunksDoBuild({ raiz: soPecas, configFile: false })
    const dividido = chunksSoPecas.filter((chunk) => chunk.facadeModuleId === null)
    expect(dividido.map((chunk) => chunk.fileName)).toEqual([expect.stringMatching(/^assets\/pecas-[^/]+\.js$/)])
    expect(dividido[0]?.moduleIds.some((id) => id.replaceAll('\\', '/').endsWith('/src/componentes/ia/selo.ts'))).toBe(true)
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
