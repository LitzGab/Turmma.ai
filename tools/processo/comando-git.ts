// Ler do comando do Bash o `git commit` e o `git push`: o commit, os arquivos que ele leva, a árvore em que roda (`-C`, `cd`),
// e o push do time.
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

// `git commit` em posição de comando: início, ou depois de ; & | ( ou quebra de linha. Texto
// dentro de string (echo, grep no log) não é commit.
export function ehCommit(comando: string): boolean {
  return GIT_COMMIT.test(comando)
}

const semAspas = (token: string) => token.replace(/^["']|["']$/g, '')

// Os arquivos que o commit vai levar, pelo que o próprio comando prepara: `git add <caminhos>`,
// `git add -A`, `git commit -a`. O que já estava no índice entra por `preparados`.
export function arquivosDoCommit(comando: string, raiz: string, alterados: string[], preparados: string[]): string[] {
  const levados = new Set(preparados)
  for (const achado of comando.matchAll(/git(?:\s+-[Cc]\s+\S+)*\s+add\b([^;&|\n]*)/g)) levarOsDoAdd(achado[1] ?? '', raiz, alterados, levados)
  for (const achado of comando.matchAll(/git(?:\s+-[Cc]\s+\S+)*\s+commit\b([^;&|\n]*)/g)) levarTodosSeCommitA(achado[1] ?? '', alterados, levados)
  return [...levados]
}

/** Os caminhos de um `git add`: `-A`, `.` e afins levam tudo; uma pasta leva o que há debaixo dela. */
function levarOsDoAdd(argumentos: string, raiz: string, alterados: string[], levados: Set<string>): void {
  for (const bruto of argumentos.trim().split(/\s+/).filter(Boolean)) {
    const token = semAspas(bruto)
    if (['-A', '--all', '.', ':/', '-u', '--update'].includes(token)) alterados.forEach((arquivo) => levados.add(arquivo))
    if (token.startsWith('-')) continue
    const relativo = token.startsWith(`${raiz}/`) ? token.slice(raiz.length + 1) : token.replace(/^\.\//, '')
    const pasta = relativo.replace(/\/$/, '')
    alterados.filter((arquivo) => arquivo === pasta || arquivo.startsWith(`${pasta}/`)).forEach((arquivo) => levados.add(arquivo))
  }
}

/** As opções de um `git commit`, até a mensagem: `-a` e `--all` levam tudo o que está alterado. */
function levarTodosSeCommitA(argumentos: string, alterados: string[], levados: Set<string>): void {
  for (const token of argumentos.trim().split(/\s+/)) {
    if (!token.startsWith('-')) break
    if (token === '--all' || (/^-[a-zA-Z]+$/.test(token) && token.includes('a'))) alterados.forEach((arquivo) => levados.add(arquivo))
    if (/^-[a-zA-Z]*[mF]$/.test(token) || token === '--message' || token === '--file' || token.startsWith('--message=')) break
  }
}

export function documentoDoCommit(comando: string, raiz: string, arquivos: string[]): { caminho: string } | { erro: string } | null {
  if (!ehCommit(comando)) return null
  const correcao = /\(correção ([a-z0-9-]+)\)/.exec(comando)?.[1]
  if (correcao) {
    const caminho = join('tasks', 'correcoes', `${correcao}.md`)
    return existsSync(join(raiz, caminho)) ? { caminho } : { erro: `A correção ${correcao} não tem ${caminho}. Crie o documento com /corrigir.` }
  }
  const numero = /\(tarefa (\d+)\.0\)/.exec(comando)?.[1]
  if (!numero) return null
  const pastaTasks = join(raiz, 'tasks')
  const candidatas = existsSync(pastaTasks)
    ? readdirSync(pastaTasks).filter((pasta) => pasta.startsWith('prd-') && existsSync(join(pastaTasks, pasta, `${numero}_task.md`)))
    : []
  const escolher = (filtro: (pasta: string) => boolean) => candidatas.filter(filtro)
  const escolhidas = [
    escolher((pasta) => comando.includes(`tasks/${pasta}/`)),
    candidatas,
    escolher((pasta) => arquivos.some((arquivo) => arquivo.startsWith(`tasks/${pasta}/`))),
  ].find((lista) => lista.length === 1)
  if (!escolhidas?.[0]) return { erro: `Não sei a qual funcionalidade pertence a tarefa ${numero}.0. Cite tasks/prd-<funcionalidade>/ no comando.` }
  return { caminho: join('tasks', escolhidas[0], `${numero}_task.md`) }
}

/**
 * O resumo do marcador `(mvp: <resumo>)`, ou `null` quando o comando não o traz. Marcador sem resumo não vale: é ele
 * que diz, no `git log`, o que o commit fez, já que não existe documento de tarefa para onde olhar.
 */
export function marcadorDoMvp(comando: string): string | null {
  const resumo = /\(mvp:([^()\n]*)\)/.exec(comando)?.[1]?.trim()
  return resumo ? resumo : null
}

/** A branch em que a árvore está. Funciona em repositório sem commit; com o HEAD solto, devolve vazio. */
export function branchAtual(raiz: string): string {
  try {
    return execFileSync('git', ['symbolic-ref', '--short', '-q', 'HEAD'], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

export function arquivosPreparados(raiz: string): string[] {
  return execFileSync('git', ['diff', '--cached', '--name-only', '-z'], { cwd: raiz, encoding: 'utf8' }).split('\0').filter(Boolean)
}

const CAMINHO = String.raw`(?:"[^"]+"|'[^']+'|[^\s;&|()]+)`
const ATRIBUICOES = String.raw`(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)*`
/** `git commit` em posição de comando, com as opções `-C`/`-c` que vêm antes dele no grupo 1. */
const GIT_COMMIT = new RegExp(String.raw`(?:^|[;&|(\n])\s*${ATRIBUICOES}git((?:\s+-[Cc]\s+${CAMINHO})*)\s+commit\b`)

/** O git que pode vir antes do commit no mesmo comando: o que prepara (inclusive a deleção, com `rm`) ou só lê, e não traz conteúdo novo para a árvore. */
const GIT_QUE_SO_PREPARA = ['add', 'rm', 'status', 'diff', 'log', 'show', 'rev-parse', 'fetch', 'branch']

/** Os comandos do shell que vêm antes do `git commit`, um por trecho, e as opções do próprio commit. */
function trechosAntesDoCommit(comando: string, padrao: RegExp = GIT_COMMIT): { trechos: string[]; opcoes: string } | null {
  const commit = padrao.exec(comando)
  if (!commit) return null
  const trechos = comando
    .slice(0, commit.index)
    .replace(/[;&|(\s]+$/, '')
    .split(/&&|\|\||;|\n/)
    .map((trecho) => trecho.trim().replace(/^\(+\s*/, ''))
    .filter((trecho) => trecho !== '' && !trecho.startsWith('#'))
  return { trechos, opcoes: commit[1] ?? '' }
}

/**
 * O trecho do comando que faz outra coisa antes do `git commit`, ou `null` quando ele só muda de pasta, guarda um
 * caminho numa variável e prepara.
 *
 * O hook roda ANTES do comando: lê a árvore como ela está, e é contra ela que confere a marca, as rodadas e o
 * carimbo. Arquivo criado ou alterado no mesmo comando do commit entra no commit sem ter sido visto. Na prova de
 * 08/10/2026, `echo … > apps/x && git add apps/x && git commit` levou código para a branch sem marca nenhuma, e o
 * mesmo vale para o commit marcado: o que o comando altera depois da última rodada não caduca ninguém. Por isso o
 * comando do commit não faz mais nada antes dele.
 */
export function antesDoCommit(comando: string): string | null {
  const antes = trechosAntesDoCommit(comando)
  if (!antes) return null
  const atribuicao = /^[A-Za-z_][A-Za-z0-9_]*=(?:"[^"$`]*"|'[^']*'|[^\s`$()<>|"']*)$/
  const cd = new RegExp(`^cd\\s+${CAMINHO}$`)
  // No resto do comando do git, `$VAR` passa e `$(…)` não: substituição de comando roda qualquer coisa.
  const git = new RegExp(String.raw`^${ATRIBUICOES}git(?:\s+--no-pager)?(?:\s+-[Cc]\s+${CAMINHO})*\s+([a-z-]+)\b(?:[^<>|$\x60]|\$(?!\())*$`)
  for (const trecho of antes.trechos) {
    if (atribuicao.test(trecho) || cd.test(trecho)) continue
    const subcomando = git.exec(trecho)?.[1]
    if (subcomando && GIT_QUE_SO_PREPARA.includes(subcomando)) continue
    return trecho.length > 90 ? `${trecho.slice(0, 87)}…` : trecho
  }
  return null
}

/** O caminho como o shell o entregaria: sem aspas, com `~` e as variáveis atribuídas no próprio comando. `null` quando depende de algo que o hook não sabe. */
function expandirCaminho(bruto: string, variaveis: Map<string, string>): string | null {
  const texto = semAspas(bruto)
    .replace(/^~(?=\/|$)/, homedir())
    .replace(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g, (tudo, nome: string) => variaveis.get(nome) ?? tudo)
  return /[$`]/.test(texto) ? null : texto
}

/** O que os trechos antes do commit atribuem a variáveis (`F=/x`) e os caminhos dos `cd`, na ordem em que aparecem. */
function variaveisECaminhosDosTrechos(trechos: string[]): { variaveis: Map<string, string>; caminhos: string[] } {
  const variaveis = new Map<string, string>()
  const caminhos: string[] = []
  for (const trecho of trechos) {
    const atribuicao = /^([A-Za-z_][A-Za-z0-9_]*)=(\S*)$/.exec(trecho)
    if (atribuicao?.[1]) variaveis.set(atribuicao[1], semAspas(atribuicao[2] ?? ''))
    const cd = new RegExp(`^cd\\s+(${CAMINHO})$`).exec(trecho)
    if (cd?.[1]) caminhos.push(cd[1])
  }
  return { variaveis, caminhos }
}

/**
 * A pasta em que o `git commit` roda: o diretório do comando, mais cada `cd` antes dele, mais o `-C` do próprio commit.
 * `indeterminado` quando um desses caminhos depende de variável que o comando não atribui: aí o hook não sabe em que
 * árvore o commit acontece, e avaliar a da sessão seria o furo que `arvoreDoCommit` fecha.
 */
export function pastaDoCommit(comando: string, raiz: string, cwd?: string, padrao: RegExp = GIT_COMMIT): { pasta: string } | { indeterminado: string } | null {
  const antes = trechosAntesDoCommit(comando, padrao)
  if (!antes) return null
  let pasta = cwd && existsSync(cwd) ? cwd : raiz
  const { variaveis, caminhos } = variaveisECaminhosDosTrechos(antes.trechos)
  for (const opcao of antes.opcoes.matchAll(new RegExp(String.raw`-C\s+(${CAMINHO})`, 'g'))) caminhos.push(opcao[1] ?? '')
  for (const bruto of caminhos) {
    const caminho = expandirCaminho(bruto, variaveis)
    if (caminho === null) return { indeterminado: bruto }
    pasta = resolve(pasta, caminho)
  }
  return { pasta }
}

function pastaDoGit(pasta: string, argumento: string): string | null {
  try {
    const saida = execFileSync('git', ['rev-parse', '--path-format=absolute', argumento], { cwd: pasta, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    return saida || null
  } catch {
    return null
  }
}

/**
 * A árvore em que o commit vai acontecer, que nem sempre é a da sessão. O Orquestrador roda no térreo e fecha a spec
 * no andar dela, com `git -C <andar> commit` (D78); um agente pode ter dado `cd` para outro checkout. Avaliar esses
 * comandos contra a árvore da sessão deixaria passar código sem marca, sem revisor e sem carimbo: a sessão está limpa,
 * e é só ela que o hook veria (revisão de coerência de 08/10/2026).
 *
 * Só troca para outra árvore **do mesmo repositório**: commit em repositório alheio não é assunto deste portão.
 */
export function arvoreDoCommit(comando: string, raiz: string, cwd?: string): string {
  const onde = pastaDoCommit(comando, raiz, cwd)
  if (!onde || 'indeterminado' in onde || !existsSync(onde.pasta)) return raiz
  const arvore = pastaDoGit(onde.pasta, '--show-toplevel')
  if (!arvore || arvore === raiz) return raiz
  const repositorio = pastaDoGit(raiz, '--git-common-dir')
  return repositorio !== null && pastaDoGit(arvore, '--git-common-dir') === repositorio ? arvore : raiz
}

/** As branches que só recebem por pouso ou por merge do Joaquim (D23, D78). */
export const BRANCHES_PROTEGIDAS = ['develop', 'release', 'main']
/** Os papéis de terminal do time (`.claude/agents/`). O Orquestrador não tem papel: é o terminal Maestro do térreo. */
export const PAPEIS_DO_TIME = ['arquiteto', 'implementador', 'mesa-de-revisao', 'validador']
/** `git push` em posição de comando: as opções `-C` no grupo 1, e o resto do comando no grupo 2. */
const GIT_PUSH = new RegExp(String.raw`(?:^|[;&|(\n])\s*${ATRIBUICOES}git((?:\s+-[Cc]\s+${CAMINHO})*)\s+push\b([^;&|\n]*)`)

/**
 * A branch protegida que o `git push` do comando alcançaria, ou `null`. Sem branch escrita (`git push`, `git push origin`,
 * `HEAD`), o destino é a branch da árvore em que o push roda; `null` aí quer dizer que o hook não sabe qual é, e conta
 * como protegida: na dúvida, quem empurra é o Orquestrador.
 */
export function destinoProtegidoDoPush(comando: string, branchDaArvore: string | null): string | null {
  for (const push of comando.matchAll(new RegExp(GIT_PUSH.source, 'g'))) {
    const argumentos = [...(push[2] ?? '').matchAll(/"[^"]*"|'[^']*'|\S+/g)].map((achado) => semAspas(achado[0]))
    if (argumentos.some((argumento) => argumento === '--all' || argumento === '--mirror')) return 'todas as branches'
    const destinos = argumentos
      .filter((argumento) => !argumento.startsWith('-'))
      .slice(1)
      .map((referencia) => referencia.replace(/^\+/, '').split(':').pop() ?? '')
    for (const destino of destinos.length > 0 ? destinos : ['HEAD']) {
      const branch = destino === 'HEAD' || destino === '@' ? branchDaArvore : destino.replace(/^refs\/heads\//, '')
      if (branch === null) return 'uma branch que o hook não sabe qual é'
      if (BRANCHES_PROTEGIDAS.includes(branch)) return `\`${branch}\``
    }
  }
  return null
}

/**
 * O bloqueio do push de um agente do time numa branch protegida. A `develop` só recebe por pouso, com a palavra do
 * Joaquim, e quem executa é o Orquestrador (D78). Até 08/10/2026 isso era só regra escrita, e o time roda sozinho à
 * noite, sem pedir permissão para comando nenhum: a regra virou trava.
 *
 * O papel vem de `CLAUDE_CODE_AGENT`, que o Claude Code põe no ambiente da sessão iniciada com `--agent <papel>` e os
 * subagentes dela herdam. O Orquestrador e a sessão de uma pessoa não têm essa variável, e passam. Pousar e apagar
 * andar não entram aqui: o próprio Maestri recusa esses comandos a quem não é o terminal Maestro.
 */
export function pushDoTime(comando: string, raiz: string, cwd: string | undefined, papel: string | undefined): string | null {
  if (!papel || !PAPEIS_DO_TIME.includes(papel) || !GIT_PUSH.test(comando)) return null
  const onde = pastaDoCommit(comando, raiz, cwd, GIT_PUSH)
  const pasta = onde && 'pasta' in onde && existsSync(onde.pasta) ? onde.pasta : null
  const destino = destinoProtegidoDoPush(comando, pasta ? branchAtual(pasta) || null : null)
  if (destino === null) return null
  return (
    `Push bloqueado: este comando empurra ${destino}, e as branches ${BRANCHES_PROTEGIDAS.join(', ')} só recebem por pouso, com a palavra do Joaquim ` +
    `(D78). Quem faz isso é o Orquestrador, não o papel \`${papel}\`. O seu push é o da branch do andar: \`git push -u origin HEAD\`, dentro do ` +
    'checkout do andar. Commit feito no térreo, na `develop`, fica sem push: o Orquestrador o leva.'
  )
}
