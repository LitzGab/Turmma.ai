// O `revisoes.ts` só reexporta, e o `estado.ts` e o `esteira.ts` não o importam (RF13).
//
// O `revisoes.ts` de 1.263 linhas virou quatro módulos, um por responsabilidade (`documento-de-revisao.ts`,
// `caducidade.ts`, `comando-git.ts`, `portao.ts`). Quem importa do `revisoes.ts` volta a depender do conjunto inteiro e
// da ordem em que ele carrega, e as tarefas 9.0 a 14.0 mudam a decisão do commit num módulo só: o `estado.ts` e o
// `esteira.ts` precisam ficar de fora dessa mudança. Aqui os dois arquivos são lidos como texto e a árvore deles diz o
// que importam; um import novo do `revisoes.ts`, em qualquer forma, deixa a conferência vermelha.
//
// Lê pelo compilador, e não por expressão regular: comentário e texto que citam `./revisoes.ts` não são import, e
// `import {\n a,\n} from\n './revisoes.ts'` é. Limite declarado: o caminho montado por concatenação (`'./revi' + 'soes.ts'`)
// não é visto; o caminho escrito por extenso em qualquer posição (numa variável, num argumento) é.
//
// O outro lado da partição também é conferido: o `revisoes.ts` só tem `export * from './<módulo>.ts'`, um por módulo. Função,
// constante ou reexportação nomeada colada nele de volta desfaz a divisão em que as tarefas 9.0 a 14.0 se apoiam.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, posix } from 'node:path'
import ts from 'typescript'
import { afterEach, describe, expect, it } from 'vitest'

const RAIZ = join(import.meta.dirname, '..', '..', '..')

const ESTADO = 'tools/processo/estado.ts'
const ESTEIRA = 'tools/processo/esteira.ts'
const ALVOS = [ESTADO, ESTEIRA] as const

/** O módulo que os alvos não podem importar, sem a extensão. */
const PROIBIDO = 'tools/processo/revisoes'

/**
 * Quantos imports a conferência acha em cada alvo, no mínimo: os de hoje são 5 e 2. Parser que lê zero (arquivo vazio,
 * sintaxe que ele não entende) deixaria a conferência verde sem olhar nada.
 */
const MINIMO_DE_IMPORTS: Record<(typeof ALVOS)[number], number> = { [ESTADO]: 3, [ESTEIRA]: 1 }

interface Conferencia {
  falhas: string[]
  /** Os imports (de qualquer forma) que a conferência leu, por alvo. */
  importsLidos: Record<string, number>
}

const ler = (raiz: string, alvo: string): string | null => {
  try {
    return readFileSync(join(raiz, alvo), 'utf8')
  } catch {
    return null
  }
}

const textoDe = (no: ts.Node | undefined): string | null =>
  no !== undefined && (ts.isStringLiteral(no) || ts.isNoSubstitutionTemplateLiteral(no)) ? no.text : null

/** `require('x')` e `import('x')`: a chamada que carrega um módulo. */
const ehChamadaQueCarrega = (no: ts.CallExpression): boolean =>
  no.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(no.expression) && no.expression.text === 'require')

/** As formas de import que o TypeScript conhece: declaração, reexportação com origem, `import =`, tipo de `import()` e chamada. */
function ehImport(no: ts.Node): boolean {
  if (ts.isImportDeclaration(no) || ts.isImportTypeNode(no)) return true
  if (ts.isExportDeclaration(no)) return no.moduleSpecifier !== undefined
  if (ts.isImportEqualsDeclaration(no)) return ts.isExternalModuleReference(no.moduleReference)
  return ts.isCallExpression(no) && ehChamadaQueCarrega(no)
}

/**
 * O que o arquivo importa, em qualquer forma que o TypeScript conhece, e os caminhos relativos escritos como texto.
 * `importados` conta as formas de import; `caminhos` é todo texto que começa com `.`, que é o que se compara.
 */
function lerCaminhos(alvo: string, texto: string): { importados: number; caminhos: string[] } {
  const fonte = ts.createSourceFile(alvo, texto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let importados = 0
  const caminhos: string[] = []
  const visitar = (no: ts.Node): void => {
    if (ehImport(no)) importados += 1
    const valor = textoDe(no)
    if (valor !== null && valor.startsWith('.')) caminhos.push(valor)
    ts.forEachChild(no, visitar)
  }
  visitar(fonte)
  return { importados, caminhos }
}

/** O caminho como o Node o resolveria a partir do alvo, sem a extensão: `./revisoes.ts` e `../processo/revisoes` dão o mesmo. */
const resolvido = (alvo: string, caminho: string): string => posix.normalize(posix.join(posix.dirname(alvo), caminho)).replace(/\.[cm]?[tj]s$/, '')

/** Confere os dois alvos sob `raiz`. Cada falha diz o arquivo e o caminho que ele escreve. */
function conferir(raiz: string): Conferencia {
  const falhas: string[] = []
  const importsLidos: Record<string, number> = {}
  for (const alvo of ALVOS) {
    const texto = ler(raiz, alvo)
    if (texto === null) {
      falhas.push(`alvo ausente: ${alvo}`)
      continue
    }
    const { importados, caminhos } = lerCaminhos(alvo, texto)
    importsLidos[alvo] = importados
    if (importados < MINIMO_DE_IMPORTS[alvo]) falhas.push(`${alvo}: a conferência leu ${String(importados)} imports, e espera ao menos ${String(MINIMO_DE_IMPORTS[alvo])}`)
    for (const caminho of caminhos.filter((achado) => resolvido(alvo, achado) === PROIBIDO)) {
      falhas.push(`${alvo} importa ${JSON.stringify(caminho)}: importe do módulo de cada coisa (documento-de-revisao, caducidade, comando-git ou portao)`)
    }
  }
  return { falhas, importsLidos }
}

const REVISOES = 'tools/processo/revisoes.ts'

/** Os módulos que o `revisoes.ts` reexporta, um `export * from` para cada. */
const REEXPORTADOS = ['./caducidade.ts', './comando-git.ts', './documento-de-revisao.ts', './portao.ts']

/** `export * from './x.ts'`, e só ela: sem lista de nomes (`export { a } from`), sem `as` e sem `export type`. */
const ehReexportacaoDeTudo = (comando: ts.Statement): comando is ts.ExportDeclaration =>
  ts.isExportDeclaration(comando) && comando.exportClause === undefined && !comando.isTypeOnly

/** O que o `revisoes.ts` tem além de `export * from` dos quatro módulos, e qual deles falta. */
function conferirReexportacao(raiz: string): string[] {
  const texto = ler(raiz, REVISOES)
  if (texto === null) return [`alvo ausente: ${REVISOES}`]
  const fonte = ts.createSourceFile(REVISOES, texto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const falhas: string[] = []
  const reexportados: string[] = []
  for (const comando of fonte.statements) {
    if (ehReexportacaoDeTudo(comando)) reexportados.push(textoDe(comando.moduleSpecifier) ?? '')
    else falhas.push(`${REVISOES} tem ${ts.SyntaxKind[comando.kind]} na linha ${String(fonte.getLineAndCharacterOfPosition(comando.getStart(fonte)).line + 1)}: ele só reexporta`)
  }
  for (const modulo of REEXPORTADOS.filter((achado) => !reexportados.includes(achado))) falhas.push(`${REVISOES} não reexporta ${modulo}`)
  return falhas
}

const pastas: string[] = []
afterEach(() => {
  for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true })
})

/** Uma cópia dos dois alvos e do `revisoes.ts` em pasta temporária, que o teste estraga sem tocar o original. */
function copiaDosAlvos(): string {
  const raiz = mkdtempSync(join(tmpdir(), 'particao-'))
  pastas.push(raiz)
  for (const alvo of [...ALVOS, REVISOES]) {
    mkdirSync(join(raiz, dirname(alvo)), { recursive: true })
    cpSync(join(RAIZ, alvo), join(raiz, alvo))
  }
  return raiz
}

/** Acrescenta texto ao fim do alvo da cópia. */
function acrescentar(raiz: string, alvo: string, texto: string): void {
  writeFileSync(join(raiz, alvo), `${ler(raiz, alvo) ?? ''}\n${texto}\n`)
}

describe('o estado.ts e o esteira.ts não importam o revisoes.ts', () => {
  it('os arquivos de hoje passam, e a conferência lê os imports que espera', () => {
    const { falhas, importsLidos } = conferir(RAIZ)
    expect(falhas).toEqual([])
    for (const alvo of ALVOS) expect(importsLidos[alvo]).toBeGreaterThanOrEqual(MINIMO_DE_IMPORTS[alvo])
  })

  // Uma linha por forma de escrever o mesmo import. O caminho do primeiro grupo é `./revisoes.ts`; os outros trocam o
  // caminho (sem a extensão, por outra pasta) ou a forma do import.
  const FORMAS: [string, string][] = [
    ['import nomeado', "import { lerRevisoes } from './revisoes.ts'"],
    ['import de tipo', "import type { Revisao } from './revisoes.ts'"],
    ['import * as', "import * as revisoes from './revisoes.ts'"],
    ['import só pelo efeito', "import './revisoes.ts'"],
    ['import em várias linhas', "import {\n  lerRevisoes,\n  arquivosAlterados,\n} from\n  './revisoes.ts'"],
    ['aspas duplas', 'import { lerRevisoes } from "./revisoes.ts"'],
    ['sem a extensão', "import { lerRevisoes } from './revisoes'"],
    ['por outra pasta', "import { lerRevisoes } from '../processo/revisoes.ts'"],
    ['reexportação nomeada', "export { lerRevisoes } from './revisoes.ts'"],
    ['reexportação de tudo', "export * from './revisoes.ts'"],
    ['import()', "const modulo = await import('./revisoes.ts')"],
    ['import() com texto de template', 'const modulo = await import(`./revisoes.ts`)'],
    ['tipo de import()', "export type Revisoes = typeof import('./revisoes.ts')"],
    ['require()', "const modulo = require('./revisoes.ts')"],
    ['require() por createRequire com outro nome', "const carregar = createRequire(import.meta.url)\nconst modulo = carregar('./revisoes.ts')"],
    ['import = require', "import revisoes = require('./revisoes.ts')"],
    ['o caminho numa variável', "const caminho = './revisoes.ts'\nconst modulo = await import(caminho)"],
  ]

  it.each(ALVOS.flatMap((alvo) => FORMAS.map(([forma, linha]) => [`${alvo}: ${forma}`, alvo, linha] as const)))('quem contorna é acusado: %s', (_nome, alvo, linha) => {
    const raiz = copiaDosAlvos()
    acrescentar(raiz, alvo, linha)
    const { falhas } = conferir(raiz)
    expect(falhas.filter((falha) => falha.startsWith(`${alvo} importa `))).toHaveLength(1)
    expect(falhas.filter((falha) => !falha.startsWith(`${alvo} importa `))).toEqual([])
  })

  // A contagem mínima só vale se cada forma conta como import: sem esta tabela, o ramo de `ehImport` de uma forma que o
  // `estado.ts` não usa (reexportação, `import =`, `require`) some sem que nada fique vermelho. O `createRequire` com outro
  // nome não é import para o compilador (é uma chamada qualquer), e quem o pega é o caminho como texto.
  it.each(FORMAS.map(([forma, linha]) => [forma, linha, forma.startsWith('require() por createRequire') ? 0 : 1] as const))('cada forma de import conta: %s', (_forma, linha, esperado) => {
    expect(lerCaminhos(ESTADO, linha).importados).toBe(esperado)
  })

  it('o que não é import do revisoes.ts passa: comentário, texto que o cita e os módulos novos', () => {
    const raiz = copiaDosAlvos()
    acrescentar(
      raiz,
      ESTADO,
      [
        "// import { lerRevisoes } from './revisoes.ts'",
        "/* const modulo = await import('./revisoes.ts') */",
        "export const AVISO = \"o hook lê o import { x } from './revisoes.ts' do estado\"",
        "export const OUTRO = import('./revisoes-do-mvp.ts')",
        "export type Documento = typeof import('./documento-de-revisao.ts')",
        "export { chaveDaRodada } from './caducidade.ts'",
      ].join('\n'),
    )
    expect(conferir(raiz).falhas).toEqual([])
  })

  it('o alvo que não existe: vermelho, e não verde por não ter o que ler', () => {
    const raiz = copiaDosAlvos()
    rmSync(join(raiz, ESTADO))
    expect(conferir(raiz).falhas).toContain(`alvo ausente: ${ESTADO}`)
  })

  it('o alvo que a conferência lê como vazio: vermelho, pela contagem mínima de imports', () => {
    const raiz = copiaDosAlvos()
    writeFileSync(join(raiz, ESTEIRA), '// sem import nenhum\nexport const X = 1\n')
    expect(conferir(raiz).falhas).toEqual([`${ESTEIRA}: a conferência leu 0 imports, e espera ao menos ${String(MINIMO_DE_IMPORTS[ESTEIRA])}`])
  })
})

describe('o revisoes.ts só reexporta', () => {
  it('o arquivo de hoje passa: um export * from para cada um dos quatro módulos, e mais nada', () => {
    expect(conferirReexportacao(RAIZ)).toEqual([])
  })

  // Uma coisa colada no `revisoes.ts` de volta, uma por forma. Cada uma é uma falha só, e diz o tipo do comando e a linha.
  const INTRUSOS: [string, string, string][] = [
    ['função', 'export function lerRevisoes(): string[] {\n  return []\n}', 'FunctionDeclaration'],
    ['constante exportada', "export const REVISORES_COM_VETO = ['revisor-geral']", 'FirstStatement'],
    ['constante local', "const REVISORES = new Set(['revisor-geral'])", 'FirstStatement'],
    ['interface', 'export interface Revisao {\n  revisor: string\n}', 'InterfaceDeclaration'],
    ['import', "import { join } from 'node:path'", 'ImportDeclaration'],
    ['reexportação nomeada', "export { portao } from './portao.ts'", 'ExportDeclaration'],
    ['reexportação com nome', "export * as portao from './portao.ts'", 'ExportDeclaration'],
    ['reexportação só de tipo', "export type * from './portao.ts'", 'ExportDeclaration'],
    ['export default', 'export default {}', 'ExportAssignment'],
    ['chamada solta', "console.log('carregou')", 'ExpressionStatement'],
  ]

  it.each(INTRUSOS)('o que é colado no revisoes.ts é acusado: %s', (_forma, codigo, tipo) => {
    const raiz = copiaDosAlvos()
    acrescentar(raiz, REVISOES, codigo)
    const linha = (ler(raiz, REVISOES) ?? '').split('\n').indexOf(codigo.split('\n')[0] ?? '') + 1
    expect(linha).toBeGreaterThan(1)
    expect(conferirReexportacao(raiz)).toEqual([`${REVISOES} tem ${tipo} na linha ${String(linha)}: ele só reexporta`])
  })

  it('o export * from de um módulo que sumiu: vermelho, dizendo qual', () => {
    const raiz = copiaDosAlvos()
    const texto = ler(raiz, REVISOES) ?? ''
    expect(texto).toContain("export * from './caducidade.ts'\n")
    writeFileSync(join(raiz, REVISOES), texto.replace("export * from './caducidade.ts'\n", ''))
    expect(conferirReexportacao(raiz)).toEqual([`${REVISOES} não reexporta ./caducidade.ts`])
  })

  it('o arquivo que não existe: vermelho, e não verde por não ter o que ler', () => {
    const raiz = copiaDosAlvos()
    rmSync(join(raiz, REVISOES))
    expect(conferirReexportacao(raiz)).toEqual([`alvo ausente: ${REVISOES}`])
  })
})
