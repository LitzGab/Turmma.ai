// O que conta como alteração depois do portão e depois de uma rodada: o conteúdo (não o `mtime`), o comentário, o merge
// em curso. Este módulo não importa nenhum outro `.ts` do repositório, de propósito: `impressaoSemComentarios` roda sozinha
// antes do `npm ci` (o caso de `revisoes.test.ts` o copia para fora do repositório e prova isso).
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type * as TS from 'typescript'

// Quem audita os testes além do código. Para os outros, mudança só em teste não caduca a rodada:
// o que eles aprovaram não mudou, e quem confere o teste corrigido é o test-engineer.
const REVISORES_DE_TESTE = ['test-engineer', 'revisor-geral']

export interface Alteracao {
  arquivo: string
  quando: number
  /** Hash do conteúdo atual. É ele que decide se o arquivo mudou de fato; ver `mudouDeVerdade`. */
  hash: string
  /** Só em `.ts`/`.tsx`: o hash do arquivo sem comentários nem espaço. Ver `impressaoSemComentarios`. */
  semComentarios?: string
}

/**
 * O conteúdo dos arquivos de código no momento de cada referência: o carimbo do portão e cada rodada
 * de revisor. Chave `portao`, ou `<documento>|<revisor>|<rodada>`.
 *
 * Existe porque `mtime` não é evidência de mudança. O `test-engineer` prova as guardas mutando um
 * arquivo e restaurando, que é o trabalho que se pede dele: isso move o `mtime` sem trocar uma linha,
 * e o portão lia como alteração — o revisor invalidava a própria rodada. Na retrospectiva do F1, 63
 * das 200 rodadas das tarefas e 27 das 50 das correções caducaram sem nenhuma reprovação.
 */
export type Instantaneos = Record<string, Record<string, string>>

export const CAMINHO_CONTEUDO = '.processo/conteudo.json'
/** A chave do instantâneo do portão local. */
export const CHAVE_DO_PORTAO = 'portao'

/** O instantâneo que corresponde a estas alterações: arquivo e hash, sem o `mtime`. */
export function instantaneoDe(alteracoes: Alteracao[]): Record<string, string> {
  return Object.fromEntries(alteracoes.map(({ arquivo, hash }) => [arquivo, hash]))
}

/**
 * O par de cada instantâneo, com o hash sem comentários dos `.ts`/`.tsx`. Chave própria, e não um campo a mais no
 * instantâneo de sempre, para o instantâneo gravado antes desta mudança continuar valendo como estava: sem o par, nada
 * conta como mudança só de comentário, e a leitura é a restrita.
 */
export function chaveSemComentarios(chave: string): string {
  return `${chave}|sem-comentarios`
}

export function instantaneoSemComentariosDe(alteracoes: Alteracao[]): Record<string, string> {
  return Object.fromEntries(alteracoes.flatMap(({ arquivo, semComentarios }) => (semComentarios === undefined ? [] : [[arquivo, semComentarios]])))
}

/**
 * Arquivos cujo conteúdo difere entre dois instantâneos, incluindo os que entraram e os que saíram.
 *
 * É como o portão local confere, no fim, que nada mudou enquanto ele rodava: o instantâneo é gravado com o conteúdo
 * do **início**, que é o que as suítes rodaram. Sem essa conferência, arquivo editado no meio da corrida entraria no
 * instantâneo como se tivesse sido testado, e o commit passaria por código que nenhuma suíte viu.
 */
export function arquivosQueMudaram(antes: Record<string, string>, depois: Record<string, string>): string[] {
  return [...new Set([...Object.keys(antes), ...Object.keys(depois)])].filter((arquivo) => antes[arquivo] !== depois[arquivo]).sort()
}

/** Só conta como alteração o arquivo cujo conteúdo difere do que a referência viu. */
export function mudouDeVerdade(alteracao: Alteracao, instantaneo: Record<string, string> | undefined): boolean {
  const anterior = instantaneo?.[alteracao.arquivo]
  return anterior === undefined || anterior !== alteracao.hash
}

/** O arquivo mudou, mas sem comentários e sem espaço é igual ao que a referência viu. */
function mudouSoComentario(alteracao: Alteracao, semComentarios: Record<string, string> | undefined): boolean {
  return alteracao.semComentarios !== undefined && semComentarios?.[alteracao.arquivo] === alteracao.semComentarios
}

/**
 * Comentário que muda o que o compilador, o lint, o teste ou o runtime fazem. Mudança num trecho de trivia que tem um
 * destes conta como código. A lista pedida na retrospectiva da A0b é `@ts-`, `eslint-`, `/// <reference`, `@jsx` e
 * `#!`; `eslint` sem hífen cobre também o comentário de configuração (`/* eslint regra: off *\/`), e `@vitest-` o
 * ambiente do teste (`// @vitest-environment jsdom`).
 *
 * Ficam de fora, de propósito, `@vite-ignore`, `#__PURE__` e `v8 ignore`: mudam o build ou a cobertura, que os revisores
 * não aprovam linha a linha. Quem prova build e suíte é o carimbo, e ele não usa esta exceção (`avaliarCarimbo`).
 */
export const MARCAS_DE_DIRETIVA = ['@ts-', 'eslint', '/// <reference', '@jsx', '#!', '@vitest-'] as const

let typescript: typeof TS | null | undefined
/**
 * Carregado só quando há `.ts` alterado: o hook roda a cada revisor e a cada commit, e o compilador pesa. Sem ele (clone
 * sem `node_modules`, antes do `npm ci` do portão local), `null`: não se afirma nada, e toda mudança conta.
 */
function carregarTypescript(): typeof TS | null {
  if (typescript === undefined) {
    try {
      typescript = createRequire(import.meta.url)('typescript') as typeof TS
    } catch {
      typescript = null
    }
  }
  return typescript
}

const EH_TYPESCRIPT = /\.[cm]?tsx?$/

/**
 * O arquivo sem comentários e sem espaço, para dizer se uma mudança foi só de comentário. `null` quando não se aplica
 * (não é `.ts`/`.tsx`, ou não compila como sintaxe), e aí toda mudança conta.
 *
 * Pelo parser, e não pelo scanner sozinho: o scanner não sabe o contexto, e lê como comentário o `//` de uma
 * expressão regular (`/[//]/`) e o de um texto de JSX (`<a>http://x</a>`) — uma mudança de código passaria por
 * comentário, que é o erro que não pode acontecer. A árvore dá cada token no contexto certo; o texto entre dois
 * tokens é trivia (espaço e comentário), e sai. Sai inteiro, espaço junto: formatar também não muda o que os
 * revisores aprovaram. O tipo de cada nó entra na impressão, para `return x` e `return\nx` (que a inserção automática
 * de ponto e vírgula lê diferente) não saírem iguais.
 *
 * A trivia que tem uma marca de `MARCAS_DE_DIRETIVA` fica na impressão, inteira: aí mudar o comentário muda o hash, e
 * tudo caduca como antes. O JSDoc não vira nó (`JSDocParsingMode.ParseNone`) e fica na trivia, como os outros.
 */
export function impressaoSemComentarios(arquivo: string, conteudo: string): string | null {
  if (!EH_TYPESCRIPT.test(arquivo)) return null
  const ts = carregarTypescript()
  if (!ts) return null
  const fonte = ts.createSourceFile(
    arquivo,
    conteudo,
    { languageVersion: ts.ScriptTarget.Latest, jsDocParsingMode: ts.JSDocParsingMode.ParseNone },
    true,
    arquivo.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  // Com erro de sintaxe a recuperação do parser pode deixar texto fora da árvore: aí não se afirma nada. O campo é
  // interno do compilador; se sumir numa versão nova, o hook quebra alto em vez de passar a aceitar tudo.
  if ((fonte as unknown as { parseDiagnostics: readonly unknown[] }).parseDiagnostics.length > 0) return null
  const partes: string[] = []
  const visitar = (no: TS.Node): void => {
    const filhos = no.getChildren(fonte)
    if (filhos.length > 0) {
      partes.push(`(${String(no.kind)}`)
      filhos.forEach(visitar)
      partes.push(')')
      return
    }
    // O texto de JSX não tem trivia: espaço e `//` dentro dele são conteúdo.
    if (no.kind === ts.SyntaxKind.JsxText) {
      partes.push(`${String(no.kind)}:${conteudo.slice(no.pos, no.end)}`)
      return
    }
    const inicio = no.getStart(fonte)
    const trivia = conteudo.slice(no.pos, inicio)
    if (MARCAS_DE_DIRETIVA.some((marca) => trivia.includes(marca))) partes.push(`trivia:${trivia}`)
    partes.push(`${String(no.kind)}:${conteudo.slice(inicio, no.end)}`)
  }
  visitar(fonte)
  return partes.join('\n')
}

export function lerHora(texto: string): number {
  return new Date(texto.replace(' ', 'T')).getTime()
}

const ehArquivoDeTeste = (arquivo: string) => /\.(test|spec)\.tsx?$/.test(arquivo) || /(^|\/)(test|e2e|__fixtures__)\//.test(arquivo)

// Quem lê o comentário como parte do que aprova: a regra do módulo mora no docblock, e comentário que afirma o que o
// código não faz é achado dele. Para os outros, mudança só de comentário não mexe no que aprovaram.
const REVISOR_DE_COMENTARIO = 'revisor-geral'

// A alteração mais recente, depois do início da rodada, que o revisor ainda não viu e que importa para ele.
export function alteracaoQueCaduca(
  revisor: string,
  inicioDaRodada: string,
  alteracoes: Alteracao[],
  instantaneo?: Record<string, string>,
  semComentarios?: Record<string, string>,
): Alteracao | null {
  const inicio = Math.floor(lerHora(inicioDaRodada) / 1000)
  return alteracoes
    .filter((alteracao) => Math.floor(alteracao.quando / 1000) > inicio)
    .filter((alteracao) => mudouDeVerdade(alteracao, instantaneo))
    .filter((alteracao) => revisor === REVISOR_DE_COMENTARIO || !mudouSoComentario(alteracao, semComentarios))
    .filter((alteracao) => REVISORES_DE_TESTE.includes(revisor) || !ehArquivoDeTeste(alteracao.arquivo))
    .reduce<Alteracao | null>((maisRecente, alteracao) => (!maisRecente || alteracao.quando > maisRecente.quando ? alteracao : maisRecente), null)
}

export function comTrava<T>(caminho: string, acao: () => T): T {
  const trava = `${caminho}.trava`
  const limite = Date.now() + 10_000
  for (;;) {
    try {
      mkdirSync(trava)
      break
    } catch {
      if (existsSync(trava) && Date.now() - statSync(trava).mtimeMs > 30_000) rmdirSync(trava)
      if (Date.now() > limite) throw new Error(`trava presa em ${trava}`)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 50)
    }
  }
  try {
    return acao()
  } finally {
    rmdirSync(trava)
  }
}

/**
 * Com um merge em curso, o que diverge do outro lado: o conflito resolvido e o arquivo que os dois lados tocaram.
 * `null` sem merge em curso.
 */
function diferentesDoOutroLado(raiz: string): Set<string> | null {
  try {
    execFileSync('git', ['rev-parse', '-q', '--verify', 'MERGE_HEAD'], { cwd: raiz, stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
  const saida = execFileSync('git', ['diff', '--name-only', '-z', 'MERGE_HEAD'], { cwd: raiz, encoding: 'utf8' })
  return new Set(saida.split('\0').filter((arquivo) => arquivo !== ''))
}

/**
 * Os arquivos que esta árvore alterou em relação ao HEAD.
 *
 * Com um merge em curso, o que veio do outro lado **sem mudar** não é alteração daqui: já entrou por commit de tarefa
 * na branch de onde veio, com os revisores e o portão de lá. Sobra o que diverge dos dois lados, que é o que ninguém
 * auditou: o conflito resolvido à mão e o arquivo que as duas linhas tocaram. É o que faz o conserto de um encontro
 * (`tools/processo/linhas.ts`) custar a revisão dos arquivos em conflito, e não a da spec inteira.
 */
export function arquivosAlterados(raiz: string): string[] {
  const saida = execFileSync('git', ['status', '--porcelain=v1', '-z', '-uall'], { cwd: raiz, encoding: 'utf8' })
  const partes = saida.split('\0')
  const outroLado = diferentesDoOutroLado(raiz)
  const arquivos: string[] = []
  for (let i = 0; i < partes.length; i++) {
    const item = partes[i] ?? ''
    if (item.length < 4) continue
    const estado = item.slice(0, 2)
    if (estado.startsWith('R') || estado.startsWith('C')) i++ // -z: o nome de origem vem na parte seguinte
    if (estado.includes('D')) continue
    const arquivo = item.slice(3)
    if (outroLado && estado !== '??' && !outroLado.has(arquivo)) continue
    arquivos.push(arquivo)
  }
  return arquivos
}

// Registro em tasks/ não conta como alteração de código: o próprio hook escreve lá.
/**
 * Documento que nenhuma suíte lê não é código: editá-lo não muda o que o portão provou. A exceção é
 * o runbook, que a guarda `alerta-tem-runbook` lê de verdade.
 *
 * Sem isto, uma linha no `TODO.md` custava rodar `test:infra` de novo — uns 16 min — e derrubava as
 * revisões já aprovadas junto.
 */
export const DOCUMENTO_QUE_UMA_SUITE_LE = 'docs/runbook.md'

function ehDocumentoSemSuite(arquivo: string): boolean {
  return arquivo.endsWith('.md') && arquivo !== DOCUMENTO_QUE_UMA_SUITE_LE
}

export function alteracoesDeCodigo(raiz: string, arquivos: string[]): Alteracao[] {
  return arquivos
    .filter((arquivo) => !arquivo.startsWith('tasks/') && !arquivo.startsWith('.processo/'))
    .filter((arquivo) => !ehDocumentoSemSuite(arquivo))
    .filter((arquivo) => existsSync(join(raiz, arquivo)))
    .map((arquivo) => {
      const conteudo = readFileSync(join(raiz, arquivo))
      const impressao = impressaoSemComentarios(arquivo, conteudo.toString('utf8'))
      return {
        arquivo,
        quando: statSync(join(raiz, arquivo)).mtimeMs,
        hash: createHash('sha256').update(conteudo).digest('hex'),
        ...(impressao === null ? {} : { semComentarios: createHash('sha256').update(impressao).digest('hex') }),
      }
    })
}

export function lerInstantaneos(raiz: string): Instantaneos {
  const caminho = join(raiz, CAMINHO_CONTEUDO)
  if (!existsSync(caminho)) return {}
  try {
    return JSON.parse(readFileSync(caminho, 'utf8')) as Instantaneos
  } catch {
    return {}
  }
}

/** Guarda o conteúdo visto por uma referência (o carimbo, ou uma rodada de revisor). */
/**
 * Grava o instantâneo de uma chave, com trava própria no arquivo: ele é de todos os documentos, e o ler-modificar-gravar
 * sem trava perde a chave de quem escreveu junto.
 *
 * Não é hipótese: os guardiões rodam em paralelo com o `revisor-geral`, e medindo com seis revisores em seis documentos
 * da mesma árvore, 4 de 6 execuções perderam o instantâneo de um deles (`test-engineer`). A rodada que fica sem
 * instantâneo cai no `mtime` e volta a bloquear o commit de quem fez teste de mutação — o defeito que esta correção
 * existe para matar (regra 80, item 7). A ordem é documento e depois conteúdo, a mesma do índice, então não há ciclo.
 */
export function gravarInstantaneo(raiz: string, chave: string, alteracoes: Alteracao[]): void {
  const caminho = join(raiz, CAMINHO_CONTEUDO)
  // Antes da trava: ela é um diretório irmão, e precisa da pasta de pé.
  mkdirSync(join(raiz, dirname(CAMINHO_CONTEUDO)), { recursive: true })
  comTrava(caminho, () => {
    const instantaneos = lerInstantaneos(raiz)
    instantaneos[chave] = instantaneoDe(alteracoes)
    // Gravado também na chave do portão, onde ninguém o lê: o carimbo não tem a exceção de comentário
    // (`avaliarCarimbo`). Fica pela simetria de uma gravação só, não porque o carimbo o use.
    instantaneos[chaveSemComentarios(chave)] = instantaneoSemComentariosDe(alteracoes)
    writeFileSync(caminho, `${JSON.stringify(instantaneos, null, 2)}\n`)
  })
}

/** A chave do instantâneo de uma rodada. O documento identifica a tarefa, a spec ou a correção. */
export function chaveDaRodada(documento: string, revisor: string, rodada: number): string {
  return `${documento}|${revisor}|${String(rodada)}`
}
