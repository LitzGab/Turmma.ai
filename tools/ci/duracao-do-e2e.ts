// A duração dos casos de e2e que o portão da tarefa roda (retrospectiva da X1, M1; da X2, M1).
//
// O prazo de um caso é 30 s no runner da esteira, que leva perto do dobro da máquina de quem implementa. Um caso que passa
// de 15 s aqui estoura lá. Na X1 os casos que caíram na esteira levavam de 19 a 29 s na máquina; na X2, quatro dos sete casos
// de prazo já passavam de 15 s aqui (`material:180` a 18 s, `areas:316` a 22, `agentes:164` a 22 e `agentes:186` a 21). Cada
// um custou uma correção e uma rodada de validação depois da validação aprovada, porque o portão da tarefa só olhava se o
// caso passava, e nunca em quanto tempo.
//
// Como funciona: o portão da tarefa liga a variável `EDUCA_RELATORIO_DO_E2E` na corrida do e2e; o `playwright.config.ts`
// então acrescenta o repórter `json` (`relatoriosDoPlaywright`), que grava a duração de cada caso em cada projeto. Com a
// corrida verde, o portão lê o relatório (`motivoDaDuracaoDoE2e`) e reprova o caso **alterado** que passou de 15 s.
//
// "Alterado" é o caso cujas linhas o diff tocou, e não todo caso do arquivo: quem altera um caso do `material.spec.ts` não
// herda os casos lentos que já estavam lá (cada um tem a sua correção). O caso vai da linha do `test(` até a linha antes
// do `test(` seguinte; linha alterada antes do primeiro caso (importação, ajudante do alto do arquivo) não é de caso
// nenhum. Arquivo novo, ainda fora do git, tem todos os casos alterados.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReporterDescription } from '@playwright/test'

/** O prazo do caso no runner é 30 s e o runner leva perto do dobro: aqui, o que passa de 15 s fica vermelho. */
export const LIMITE_DO_CASO_DE_E2E_MS = 15_000
/** Quando posta, o Playwright grava o relatório de duração neste arquivo. Só o portão da tarefa a posta. */
export const VARIAVEL_DO_RELATORIO_DO_E2E = 'EDUCA_RELATORIO_DO_E2E'
export const CAMINHO_DO_RELATORIO_DO_E2E = '.processo/e2e-duracao.json'

/**
 * Os repórteres do Playwright: a lista de sempre (a esteira anota as falhas no GitHub) e, só com o arquivo do relatório,
 * o `json` que mede os casos. `reporter` na linha de comando trocaria a lista inteira; por isso é a configuração que o
 * acrescenta.
 */
export function relatoriosDoPlaywright(naEsteira: boolean, arquivoDoRelatorio: string | undefined): ReporterDescription[] {
  return [
    ['list'],
    ...(naEsteira ? [['github'] as ReporterDescription] : []),
    ...(arquivoDoRelatorio ? [['json', { outputFile: arquivoDoRelatorio }] as ReporterDescription] : []),
  ]
}

interface ResultadoDoRelatorio {
  duration?: number
}
interface TesteDoRelatorio {
  projectName?: string
  status?: string
  results?: ResultadoDoRelatorio[]
}
interface CasoDoRelatorio {
  title?: string
  file?: string
  line?: number
  tests?: TesteDoRelatorio[]
}
interface SuiteDoRelatorio {
  title?: string
  specs?: CasoDoRelatorio[]
  suites?: SuiteDoRelatorio[]
}
export interface RelatorioDoPlaywright {
  suites?: SuiteDoRelatorio[]
}

export interface CasoMedido {
  /** Como o repositório o chama: `e2e/<arquivo>.spec.ts`. */
  arquivo: string
  /** A linha do `test(` do caso. */
  linha: number
  titulo: string
  projeto: string
  duracaoMs: number
}

function caminhoDoSpec(arquivo: string): string {
  return arquivo.startsWith('e2e/') ? arquivo : `e2e/${arquivo}`
}

/** Cada caso em cada projeto, com o tempo que levou. Caso pulado não tem tempo e fica de fora. */
export function casosMedidos(relatorio: RelatorioDoPlaywright): CasoMedido[] {
  const casos: CasoMedido[] = []
  const percorrer = (suite: SuiteDoRelatorio, titulos: string[]) => {
    const caminho = suite.title && !suite.title.endsWith('.ts') ? [...titulos, suite.title] : titulos
    for (const caso of suite.specs ?? []) {
      if (caso.file === undefined || caso.line === undefined) continue
      for (const teste of caso.tests ?? []) {
        if (teste.status === 'skipped') continue
        // Soma as tentativas do caso. Com `retries: 0` (`playwright.config.ts`) é uma só; se um dia o retry for ligado, o caso que
        // falhou uma vez e passou na segunda passa a parecer lento, e aqui é preciso medir só a última tentativa.
        const duracaoMs = (teste.results ?? []).reduce((soma, resultado) => soma + (resultado.duration ?? 0), 0)
        casos.push({
          arquivo: caminhoDoSpec(caso.file),
          linha: caso.line,
          titulo: [...caminho, caso.title ?? ''].join(' › '),
          projeto: teste.projectName ?? '',
          duracaoMs,
        })
      }
    }
    for (const filha of suite.suites ?? []) percorrer(filha, caminho)
  }
  for (const suite of relatorio.suites ?? []) percorrer(suite, [])
  return casos
}

/** O que o diff mudou num arquivo: as linhas dele, ou `tudo` quando o arquivo é novo. */
export type Alteracao = 'tudo' | ReadonlySet<number>

/**
 * As linhas do arquivo novo que um `git diff -U0` toca. Remoção pura (`+c,0`) conta como a linha `c`, a que ficou antes
 * dela: a que o caso de cima ainda contém.
 */
export function linhasDoDiff(diff: string): Set<number> {
  const linhas = new Set<number>()
  for (const cabecalho of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const inicio = Number(cabecalho[1])
    const quantas = cabecalho[2] === undefined ? 1 : Number(cabecalho[2])
    if (quantas === 0) linhas.add(Math.max(inicio, 1))
    for (let linha = inicio; linha < inicio + quantas; linha++) linhas.add(linha)
  }
  return linhas
}

/** O que a árvore alterou no arquivo em relação ao HEAD. Fora do git, o arquivo é novo e tudo nele é alteração. */
export function alteracoesDoArquivo(raiz: string, arquivo: string): Alteracao {
  const versionado = execFileSync('git', ['ls-files', '--', arquivo], { cwd: raiz, encoding: 'utf8' }).trim() !== ''
  if (!versionado) return 'tudo'
  return linhasDoDiff(execFileSync('git', ['diff', '-U0', 'HEAD', '--', arquivo], { cwd: raiz, encoding: 'utf8' }))
}

/** Os casos que o diff tocou: do `test(` deles até a linha antes do `test(` seguinte do mesmo arquivo. */
export function casosAlterados(casos: readonly CasoMedido[], alteracaoDe: (arquivo: string) => Alteracao): CasoMedido[] {
  const alteracoes = new Map<string, Alteracao>()
  const linhasDe = new Map<string, number[]>()
  for (const caso of casos) {
    if (!alteracoes.has(caso.arquivo)) alteracoes.set(caso.arquivo, alteracaoDe(caso.arquivo))
    linhasDe.set(caso.arquivo, [...new Set([...(linhasDe.get(caso.arquivo) ?? []), caso.linha])].sort((a, b) => a - b))
  }
  return casos.filter((caso) => {
    const alteracao = alteracoes.get(caso.arquivo)
    if (alteracao === undefined) return false
    if (alteracao === 'tudo') return true
    const seguinte = (linhasDe.get(caso.arquivo) ?? []).find((linha) => linha > caso.linha) ?? Number.POSITIVE_INFINITY
    return [...alteracao].some((linha) => linha >= caso.linha && linha < seguinte)
  })
}

/** Os que passaram do limite, do mais lento para o mais rápido. Exatamente no limite ainda cabe. */
export function casosLentos(casos: readonly CasoMedido[], limiteMs: number = LIMITE_DO_CASO_DE_E2E_MS): CasoMedido[] {
  return casos.filter((caso) => caso.duracaoMs > limiteMs).sort((a, b) => b.duracaoMs - a.duracaoMs)
}

function segundos(ms: number): string {
  return (ms / 1000).toFixed(1).replace('.', ',')
}

export function avisoDosCasosLentos(lentos: readonly CasoMedido[]): string {
  const linhas = lentos.map((caso) => `  ${caso.arquivo}:${String(caso.linha)} (${caso.projeto}) levou ${segundos(caso.duracaoMs)} s — ${caso.titulo}`)
  return (
    `${String(lentos.length)} caso(s) de e2e alterado(s) acima de ${segundos(LIMITE_DO_CASO_DE_E2E_MS)} s nesta máquina; no runner da esteira ` +
    `eles levam perto do dobro, e o prazo é 30 s:\n${linhas.join('\n')}\n` +
    'Encurte o caso (semeie o dado pela API em vez de pela tela, tire a espera que não prova nada) ou divida-o em dois.'
  )
}

/**
 * O motivo de o portão da tarefa reprovar a duração do e2e que rodou, ou `null` se coube. Relatório ausente também
 * reprova: com a corrida verde ele tem de existir, e sem ele o portão não mediu nada.
 */
export function motivoDaDuracaoDoE2e(raiz: string, caminhoDoRelatorio: string): string | null {
  if (!existsSync(caminhoDoRelatorio)) {
    return `o Playwright não deixou o relatório de duração em ${caminhoDoRelatorio}: o portão não mediu os casos de e2e.`
  }
  let relatorio: RelatorioDoPlaywright
  try {
    relatorio = JSON.parse(readFileSync(caminhoDoRelatorio, 'utf8')) as RelatorioDoPlaywright
  } catch {
    return `o relatório de duração ${caminhoDoRelatorio} não é um JSON legível: o portão não mediu os casos de e2e.`
  }
  const lentos = casosLentos(casosAlterados(casosMedidos(relatorio), (arquivo) => alteracoesDoArquivo(raiz, arquivo)))
  return lentos.length === 0 ? null : avisoDosCasosLentos(lentos)
}

/** O arquivo do relatório que o portão passa ao Playwright, dentro da árvore dele. */
export function arquivoDoRelatorioDoE2e(raiz: string): string {
  return join(raiz, CAMINHO_DO_RELATORIO_DO_E2E)
}
