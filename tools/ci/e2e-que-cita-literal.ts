// O e2e que cita um texto que o diff tirou de `apps/web/src` (retrospectiva da X2, `TODO.md`, "(X1, retrospectiva) Código de
// processo", letra (d)).
//
// O portão da tarefa roda os e2e que a árvore **alterou** (`alvosDoPortao`, em `tools/processo/revisoes.ts`). A tarefa que troca
// um título, um rótulo ou um aviso da tela e não mexe no `e2e/` que o procura passava no portão e quebrava na esteira: na X2, o
// W12 da casca (a 3.0 trocou "Governança"; `casca.spec.ts`, vermelho em cinco execuções) e o sino da 6.0 ("Refazer o convite de";
// `sino-da-coordenacao.spec.ts`). O único elo entre a tela e o e2e é o texto, e é por ele que este módulo acha o spec.
//
// Como funciona: do `git diff -U0 HEAD -- apps/web/src` saem os literais das linhas **removidas** (aspas, template, texto de JSX)
// que o diff não recolocou e que o arquivo já não tem. Cada `e2e/**/*.spec.ts` que cita algum deles, sem diferenciar maiúscula (o
// e2e procura por `/…/i`), entra nos alvos do portão da tarefa. Entra para rodar, e não para ser cobrado: os casos lentos que já
// estavam lá não são de quem trocou o texto (`tools/ci/duracao-do-e2e.ts` só cobra o caso que o diff tocou).
//
// Limites: o literal citado só num ajudante de `e2e/__fixtures__/` não puxa os specs que o importam; literal montado em tempo de
// execução vale pelas partes fixas; e o literal curto e comum ("Salvar") puxa todo spec que o cita, o que só custa minutos.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Menos que isto não é texto de tela: é `id`, `ok`, `sm`. */
const TAMANHO_MINIMO = 4

/** O texto que vale buscar: tem letra, tamanho, e não é palavra solta em minúscula (`button`) nem caminho relativo (`./x`). */
function ehLiteralUtil(texto: string): boolean {
  return texto.length >= TAMANHO_MINIMO && /\p{L}/u.test(texto) && !/^\p{Ll}+$/u.test(texto) && !/^\.{1,2}\//.test(texto) && !/^\S+,$/.test(texto)
}

/** Os trechos fixos de um literal: o `${…}` de um template divide o texto, e cada lado é um trecho. */
function trechosDe(texto: string): string[] {
  return texto
    .replace(/\\(['"`\\])/g, '$1')
    .split(/\$\{[^}]*\}/)
    .map((trecho) => trecho.trim())
}

/**
 * Os literais de uma linha de código da web: o que está entre aspas ou crase, o texto de JSX entre as marcas da mesma linha
 * e a linha própria de texto que começa em maiúscula. Comentário, `import` e `export … from` não têm nenhum.
 */
export function literaisDaLinha(linha: string): string[] {
  const texto = linha.trim()
  if (texto === '' || /^(\/\/|\/\*|\*)/.test(texto)) return []
  if (/^(import|export)\b[^'"`]*\bfrom\b/.test(texto) || /^import\s+['"`]/.test(texto)) return []
  const trechos: string[] = []
  for (const achado of texto.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
    trechos.push(...trechosDe(achado[1] ?? achado[2] ?? achado[3] ?? ''))
  }
  for (const achado of texto.matchAll(/(?:^|>)([^<>{}=;]+)(?=<)/g)) trechos.push(...trechosDe(achado[1] ?? ''))
  // Linha própria de texto de JSX: sem pontuação de código, a expressão `{…}` só divide o texto.
  const semExpressoes = texto.replace(/\{[^{}]*\}/g, '\uE000')
  if (/^\p{Lu}/u.test(semExpressoes) && !/[=;()<>[\]"'`\\/*+&]|=>/.test(semExpressoes.replace(/\uE000/g, ''))) {
    trechos.push(...semExpressoes.split('\uE000').flatMap(trechosDe))
  }
  return [...new Set(trechos.filter(ehLiteralUtil))]
}

const EH_TESTE_DA_WEB = /\.test\.tsx?$/

/**
 * Os literais que o diff tirou de vez: os das linhas removidas que nenhuma linha acrescentada do diff recoloca e que o arquivo
 * atual já não tem. `conteudoAtual` devolve o arquivo como está na árvore, ou `null` se foi apagado.
 */
export function literaisRemovidos(diff: string, conteudoAtual: (arquivo: string) => string | null): string[] {
  const removidosPorArquivo = new Map<string, string[]>()
  const acrescentados = new Set<string>()
  let arquivo: string | null = null
  let noCabecalho = false
  for (const linha of diff.split('\n')) {
    const cabecalho = /^diff --git a\/.+ b\/(.+)$/.exec(linha)
    if (cabecalho) {
      arquivo = EH_TESTE_DA_WEB.test(cabecalho[1] ?? '') ? null : (cabecalho[1] ?? null)
      noCabecalho = true
      continue
    }
    if (noCabecalho) {
      if (linha.startsWith('@@')) noCabecalho = false
      continue
    }
    if (arquivo === null) continue
    if (linha.startsWith('-')) removidosPorArquivo.set(arquivo, [...(removidosPorArquivo.get(arquivo) ?? []), ...literaisDaLinha(linha.slice(1))])
    else if (linha.startsWith('+')) for (const literal of literaisDaLinha(linha.slice(1))) acrescentados.add(literal)
  }
  const saidos: string[] = []
  for (const [nome, removidos] of removidosPorArquivo) {
    const atual = conteudoAtual(nome)
    const ficaram = new Set(atual === null ? [] : atual.split('\n').flatMap(literaisDaLinha))
    for (const literal of removidos) if (!acrescentados.has(literal) && !ficaram.has(literal) && !saidos.includes(literal)) saidos.push(literal)
  }
  return saidos
}

export interface E2eQueCita {
  /** Como o repositório o chama: `e2e/<arquivo>.spec.ts`. */
  arquivo: string
  /** Os literais, dos que foram dados, que o spec cita. */
  literais: string[]
}

function specsDoE2e(raiz: string): string[] {
  const pasta = join(raiz, 'e2e')
  if (!existsSync(pasta)) return []
  return readdirSync(pasta, { recursive: true, encoding: 'utf8' })
    .filter((caminho) => caminho.endsWith('.spec.ts'))
    .map((caminho) => `e2e/${caminho}`)
}

/** Os specs do `e2e/` que citam algum dos literais, sem diferenciar maiúscula. */
export function e2eQueCitam(raiz: string, literais: readonly string[]): E2eQueCita[] {
  const citados: E2eQueCita[] = []
  for (const arquivo of specsDoE2e(raiz)) {
    const texto = readFileSync(join(raiz, arquivo), 'utf8').toLowerCase()
    const achados = literais.filter((literal) => texto.includes(literal.toLowerCase()))
    if (achados.length > 0) citados.push({ arquivo, literais: achados })
  }
  return citados
}

/** Os specs que citam o que a árvore tirou de `apps/web/src` em relação ao HEAD. */
export function e2eDosLiteraisRemovidos(raiz: string): E2eQueCita[] {
  const diff = execFileSync('git', ['diff', '-U0', 'HEAD', '--', 'apps/web/src'], { cwd: raiz, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  const lerAtual = (arquivo: string) => (existsSync(join(raiz, arquivo)) ? readFileSync(join(raiz, arquivo), 'utf8') : null)
  return e2eQueCitam(raiz, literaisRemovidos(diff, lerAtual))
}
