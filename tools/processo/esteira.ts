// A esteira da branch, lida sem esperar por ela. Desde 11/10/2026 a esteira roda em todo push de `spec/**` e de
// `correcao/**` (D79): é o portão completo de cada commit de tarefa, rodando no GitHub enquanto a linha segue. Este
// script responde às duas perguntas que o Orquestrador faz, sem que ele precise montar `gh` e `git` à mão.
//
//   node tools/processo/esteira.ts                 ao fechar uma tarefa: a esteira de algum commit desta branch ficou vermelha?
//   node tools/processo/esteira.ts --fechamento    no fim da spec: a esteira está verde no último commit que alterou código?
//
// Sai com 0 quando dá para seguir (verde, rodando ou ainda sem execução, na pergunta da tarefa; verde, no fechamento)
// e com 1 quando não dá, dizendo o commit, a execução e os jobs que caíram.
import { execFileSync } from 'node:child_process'
import { DOCUMENTO_QUE_UMA_SUITE_LE } from './caducidade.ts'

export type EstadoDaExecucao = 'verde' | 'vermelha' | 'rodando'

export interface Execucao {
  id: number
  sha: string
  estado: EstadoDaExecucao
  criadaEm: string
}

/** Um commit da branch, do mais novo para o mais antigo. `soDocumento`: nada nele roda em suíte nenhuma. */
export interface Commit {
  sha: string
  assunto: string
  soDocumento: boolean
}

export type Situacao =
  | { tipo: 'verde'; commit: Commit; execucao: Execucao }
  | { tipo: 'vermelha'; commit: Commit; execucao: Execucao; rodandoDepois?: Commit }
  | { tipo: 'rodando'; commit: Commit; execucao: Execucao }
  | { tipo: 'sem-execucao'; commit: Commit | null }

/** Arquivo que nenhuma suíte lê: documento, menos o runbook, que a guarda `alerta-tem-runbook` confere. */
export function ehSoDocumento(arquivos: readonly string[]): boolean {
  return arquivos.every((arquivo) => arquivo.endsWith('.md') && arquivo !== DOCUMENTO_QUE_UMA_SUITE_LE)
}

/** A execução que vale para um commit é a mais nova dele: reexecutar um vermelho intermitente troca o veredito. */
export function execucaoDe(sha: string, execucoes: readonly Execucao[]): Execucao | undefined {
  return execucoes.filter((execucao) => execucao.sha === sha).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm))[0]
}

/**
 * A pergunta de quem fecha uma tarefa. O que decide é a execução terminada mais nova: vermelha, a linha para e
 * corrige antes da tarefa seguinte; verde, segue. Execução ainda rodando não segura ninguém, e é por isso que a
 * esteira por push não custa espera: o veredito dela chega uma tarefa depois, no máximo.
 */
export function situacaoDaTarefa(commits: readonly Commit[], execucoes: readonly Execucao[]): Situacao {
  let rodando: Extract<Situacao, { tipo: 'rodando' }> | null = null
  for (const commit of commits) {
    const execucao = execucaoDe(commit.sha, execucoes)
    if (!execucao) continue
    if (execucao.estado === 'rodando') {
      rodando ??= { tipo: 'rodando', commit, execucao }
      continue
    }
    // Com uma execução mais nova no ar, o vermelho pode já ter correção commitada: quem lê decide, e o relatório diz.
    if (execucao.estado === 'vermelha') return { tipo: 'vermelha', commit, execucao, ...(rodando ? { rodandoDepois: rodando.commit } : {}) }
    return rodando ?? { tipo: 'verde', commit, execucao }
  }
  return rodando ?? { tipo: 'sem-execucao', commit: commits[0] ?? null }
}

/**
 * A pergunta do fim da spec. O commit que precisa da esteira verde é o último que alterou código; os commits só de
 * documento que vieram depois dele (o estado antes da validação, o fechamento) não mudam o que as suítes rodam, e o
 * verde de qualquer um deles vale igual. Vermelho num commit mais antigo não conta: o código já é outro.
 */
export function situacaoDoFechamento(commits: readonly Commit[], execucoes: readonly Execucao[]): Situacao {
  const ateOCodigo = commits.findIndex((commit) => !commit.soDocumento)
  const candidatos = ateOCodigo === -1 ? commits : commits.slice(0, ateOCodigo + 1)
  const comExecucao = candidatos.flatMap((commit) => {
    const execucao = execucaoDe(commit.sha, execucoes)
    return execucao ? [{ commit, execucao }] : []
  })
  for (const estado of ['verde', 'rodando', 'vermelha'] as const) {
    const achado = comExecucao.find(({ execucao }) => execucao.estado === estado)
    if (achado) return { tipo: estado, ...achado }
  }
  return { tipo: 'sem-execucao', commit: candidatos.at(-1) ?? null }
}

function curto(sha: string): string {
  return sha.slice(0, 7)
}

/** O que o Orquestrador lê. Uma linha quando dá para seguir; o que fazer, quando não dá. */
export function relatorioDaEsteira(situacao: Situacao, branch: string, noFechamento: boolean, jobsVermelhos: readonly string[] = []): string {
  if (situacao.tipo === 'sem-execucao') {
    const onde = situacao.commit ? ` para ${curto(situacao.commit.sha)}` : ''
    return noFechamento
      ? `esteira de ${branch}: nenhuma execução${onde}. Confira o push; se ele foi feito, dispare: gh workflow run esteira --ref ${branch}`
      : `esteira de ${branch}: nenhuma execução ainda${onde}. Siga.`
  }
  const { commit, execucao } = situacao
  const alvo = `${curto(commit.sha)} (${commit.assunto}), execução ${String(execucao.id)}`
  if (situacao.tipo === 'verde') return `esteira de ${branch}: verde em ${alvo}.${noFechamento ? ' De lá à ponta só mudou documento.' : ' Siga.'}`
  if (situacao.tipo === 'rodando') {
    return noFechamento
      ? `esteira de ${branch}: ainda rodando em ${alvo}. Espere: gh run watch ${String(execucao.id)} --exit-status`
      : `esteira de ${branch}: rodando em ${alvo}. Siga; o veredito se lê ao fechar a próxima tarefa.`
  }
  const jobs = jobsVermelhos.length > 0 ? `\nJobs que caíram: ${jobsVermelhos.join('; ')}` : ''
  const depois =
    situacao.tipo === 'vermelha' && situacao.rodandoDepois
      ? `\nHá execução mais nova rodando, em ${curto(situacao.rodandoDepois.sha)} (${situacao.rodandoDepois.assunto}): se esse commit já é a correção deste vermelho, siga e leia de novo ao fechar a próxima tarefa.`
      : ''
  return (
    `esteira de ${branch}: VERMELHA em ${alvo}.${jobs}${depois}\n` +
    `É correção na branch, antes da tarefa seguinte; o documento dela diz de qual tarefa foi. Detalhe: gh run view ${String(execucao.id)} --log-failed`
  )
}

function executar(comando: string, argumentos: string[], raiz: string): string {
  return execFileSync(comando, argumentos, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function lerCommits(raiz: string, quantos: number): Commit[] {
  return executar('git', ['log', `-${String(quantos)}`, '--format=%H%x09%s'], raiz)
    .split('\n')
    .filter((linha) => linha !== '')
    .map((linha) => {
      const [sha = '', assunto = ''] = linha.split('\t')
      // Contra o primeiro pai: o merge da `develop` na branch traz código, e `diff-tree` de merge não lista nada.
      const temPai = executar('git', ['rev-list', '--parents', '-n', '1', sha], raiz).trim().split(' ').length > 1
      const arquivos = temPai ? executar('git', ['diff', '--name-only', `${sha}^1`, sha], raiz).split('\n').filter((arquivo) => arquivo !== '') : ['raiz']
      return { sha, assunto, soDocumento: ehSoDocumento(arquivos) }
    })
}

interface ExecucaoDoGh {
  databaseId: number
  headSha: string
  status: string
  conclusion: string | null
  createdAt: string
}

export function estadoDaExecucao(execucao: Pick<ExecucaoDoGh, 'status' | 'conclusion'>): EstadoDaExecucao {
  if (execucao.status !== 'completed') return 'rodando'
  return execucao.conclusion === 'success' ? 'verde' : 'vermelha'
}

function lerExecucoes(raiz: string, branch: string): Execucao[] {
  const saida = executar('gh', ['run', 'list', '--workflow', 'esteira', '--branch', branch, '--limit', '30', '--json', 'databaseId,headSha,status,conclusion,createdAt'], raiz)
  return (JSON.parse(saida) as ExecucaoDoGh[]).map((execucao) => ({
    id: execucao.databaseId,
    sha: execucao.headSha,
    estado: estadoDaExecucao(execucao),
    criadaEm: execucao.createdAt,
  }))
}

function lerJobsVermelhos(raiz: string, id: number): string[] {
  const saida = executar('gh', ['run', 'view', String(id), '--json', 'jobs'], raiz)
  return (JSON.parse(saida) as { jobs: { name: string; conclusion: string | null }[] }).jobs
    .filter((job) => job.conclusion !== 'success' && job.conclusion !== 'skipped')
    .map((job) => job.name)
}

if (import.meta.filename === process.argv[1]) {
  const raiz = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()
  const noFechamento = process.argv.includes('--fechamento')
  try {
    const branch = executar('git', ['rev-parse', '--abbrev-ref', 'HEAD'], raiz).trim()
    const commits = lerCommits(raiz, 30)
    const execucoes = lerExecucoes(raiz, branch)
    const situacao = noFechamento ? situacaoDoFechamento(commits, execucoes) : situacaoDaTarefa(commits, execucoes)
    const jobs = situacao.tipo === 'vermelha' ? lerJobsVermelhos(raiz, situacao.execucao.id) : []
    process.stdout.write(`${relatorioDaEsteira(situacao, branch, noFechamento, jobs)}\n`)
    const segue = noFechamento ? situacao.tipo === 'verde' : situacao.tipo !== 'vermelha'
    process.exit(segue ? 0 : 1)
  } catch (erro) {
    // Sem GitHub não há veredito, e isso não é verde. Quem decide o que fazer é quem chamou: no fechamento, o portão
    // completo local (`node tools/processo/portao-local.ts --e2e --infra`) vale no lugar.
    process.stdout.write(`esteira: não consegui ler o GitHub (${erro instanceof Error ? (erro.message.split('\n')[0] ?? '') : String(erro)}).\n`)
    process.exit(2)
  }
}
