// O hook do portão que não carrega bloqueia o Bash (N7). O comando é LIDO de .claude/settings.json e rodado com
// `sh -c`, como o Claude Code o roda, sobre uma cópia de tools/processo/ que o teste estraga de três jeitos.
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

interface Gancho {
  matcher: string
  hooks: { type: string; command: string }[]
}

const REPOSITORIO = join(import.meta.dirname, '../..')
const MENSAGEM = 'hook de revisões não carregou: nenhum Bash roda até consertar tools/processo/. Avise o Joaquim.'

function ganchos(evento: 'PreToolUse' | 'SubagentStop'): Gancho[] {
  const configuracao = JSON.parse(readFileSync(join(REPOSITORIO, '.claude/settings.json'), 'utf8')) as { hooks: Record<string, Gancho[]> }
  return configuracao.hooks[evento] ?? []
}

function comandoDe(evento: 'PreToolUse' | 'SubagentStop', modo: 'portao' | 'registrar'): string {
  const comandos = ganchos(evento).flatMap((gancho) => gancho.hooks.map((hook) => hook.command))
  const achados = comandos.filter((comando) => comando.includes(`hook-revisoes.ts" ${modo}`))
  const [achado] = achados
  // Erro explícito, e chamado de dentro de cada caso: o comando que sumiu do settings.json derruba o caso, com o nome dele.
  if (achados.length !== 1 || achado === undefined) {
    throw new Error(`.claude/settings.json deveria ter um só comando "hook-revisoes.ts ${modo}" em ${evento}, e tem ${String(achados.length)}`)
  }
  return achado
}

const pastas: string[] = []
afterAll(() => {
  for (const pasta of pastas) rmSync(pasta, { recursive: true, force: true })
})

/**
 * Uma cópia de tools/processo/ (sem os testes), pronta para o hook rodar nela. Copia só os `.ts` dessa pasta, que é
 * tudo o que o hook importa hoje: se ele passar a importar arquivo de outra pasta, ou que não seja `.ts`, os casos
 * do hook são saem 2 por falta de módulo, e o conserto é aqui, na cópia, não no hook.
 */
function copia(estragar?: (processo: string) => void): string {
  const raiz = mkdtempSync(join(tmpdir(), 'hook-portao-'))
  pastas.push(raiz)
  const processo = join(raiz, 'tools/processo')
  mkdirSync(processo, { recursive: true })
  for (const arquivo of readdirSync(join(REPOSITORIO, 'tools/processo'))) {
    if (arquivo.endsWith('.ts') && !arquivo.endsWith('.test.ts')) cpSync(join(REPOSITORIO, 'tools/processo', arquivo), join(processo, arquivo))
  }
  estragar?.(processo)
  return raiz
}

function acrescentar(processo: string, arquivo: string, texto: string): void {
  const caminho = join(processo, arquivo)
  writeFileSync(caminho, `${readFileSync(caminho, 'utf8')}\n${texto}\n`)
}

function rodar(comando: string, raiz: string, bash: string, papel?: string) {
  const env: NodeJS.ProcessEnv = { ...process.env, CLAUDE_PROJECT_DIR: raiz }
  delete env['CLAUDE_CODE_AGENT']
  if (papel) env['CLAUDE_CODE_AGENT'] = papel
  const resultado = spawnSync('sh', ['-c', comando], {
    cwd: raiz,
    env,
    encoding: 'utf8',
    input: JSON.stringify({ cwd: raiz, tool_name: 'Bash', tool_input: { command: bash } }),
  })
  return { status: resultado.status, stdout: resultado.stdout, stderr: resultado.stderr }
}

describe('o hook do portão que não carrega bloqueia o Bash', () => {
  const portao = () => comandoDe('PreToolUse', 'portao')

  it('import de módulo que não existe: sai 2 e diz o que fazer', () => {
    const raiz = copia((processo) => acrescentar(processo, 'hook-revisoes.ts', "import './modulo-que-nao-existe.ts'"))
    const saida = rodar(portao(), raiz, 'ls')
    expect(saida.status).toBe(2)
    expect(saida.stderr).toContain(MENSAGEM)
  })

  it('erro de sintaxe em revisoes.ts: sai 2', () => {
    const raiz = copia((processo) => acrescentar(processo, 'revisoes.ts', 'export const quebrado = {{{'))
    const saida = rodar(portao(), raiz, 'ls')
    expect(saida.status).toBe(2)
    expect(saida.stderr).toContain(MENSAGEM)
  })

  it('módulo que lança ao carregar: sai 2', () => {
    const raiz = copia((processo) => acrescentar(processo, 'mutacoes.ts', "throw new Error('lançou na carga')"))
    const saida = rodar(portao(), raiz, 'ls')
    expect(saida.status).toBe(2)
    expect(saida.stderr).toContain(MENSAGEM)
  })

  it('hook são, Bash comum: sai 0 e não diz nada no stdout', () => {
    const saida = rodar(portao(), copia(), 'ls')
    expect(saida.status).toBe(0)
    expect(saida.stdout).toBe('')
    // A mensagem de falha de carga só aparece na falha de carga.
    expect(saida.stderr).not.toContain(MENSAGEM)
  })

  it('hook são, push do time para a develop: sai 0 e o deny da regra passa intacto no stdout', () => {
    const saida = rodar(portao(), copia(), 'git push origin develop', 'implementador')
    expect(saida.status).toBe(0)
    const resposta = JSON.parse(saida.stdout) as { hookSpecificOutput: { permissionDecision: string; permissionDecisionReason: string } }
    expect(resposta.hookSpecificOutput.permissionDecision).toBe('deny')
    // O deny é o da regra, não o do `catch` do hook (que diria "o portão de revisões falhou").
    expect(resposta.hookSpecificOutput.permissionDecisionReason).toContain('Push bloqueado')
    expect(resposta.hookSpecificOutput.permissionDecisionReason).not.toContain('o portão de revisões falhou')
  })
})

describe('o registrar (SubagentStop) fica como está', () => {
  it('não ganha o exit 2: ele impediria o revisor de terminar', () => {
    const registrar = comandoDe('SubagentStop', 'registrar')
    expect(registrar).not.toContain('exit 2')
    expect(registrar).not.toContain('||')
  })

  it('o exit 2 está só no comando do portão', () => {
    const comandos = [...ganchos('PreToolUse'), ...ganchos('SubagentStop')].flatMap((gancho) => gancho.hooks.map((hook) => hook.command))
    expect(comandos.filter((comando) => comando.includes('exit 2'))).toEqual([comandoDe('PreToolUse', 'portao')])
  })
})
