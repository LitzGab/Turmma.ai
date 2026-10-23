// O hook do portão que não carrega bloqueia o Bash (N7). O comando é LIDO de .claude/settings.json e rodado com
// `sh -c`, como o Claude Code o roda, sobre uma cópia de tools/processo/ que o teste estraga de três jeitos.
import { execFileSync, spawnSync } from 'node:child_process'
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

  it('portão que lança com o hook de pé: nega num Bash que não é commit, sai 0 e não diz "Commit bloqueado"', () => {
    const raiz = copia((processo) => {
      const caminho = join(processo, 'comando-git.ts')
      const origem = 'export function desvioDoHook(comando: string): string | null {'
      const texto = readFileSync(caminho, 'utf8')
      expect(texto).toContain(origem)
      writeFileSync(caminho, texto.replace(origem, `${origem}\n  throw new Error('lançou ao ler o comando')`))
    })
    const saida = rodar(portao(), raiz, 'ls', 'implementador')
    expect(saida.status).toBe(0)
    const razao = (JSON.parse(saida.stdout) as { hookSpecificOutput: { permissionDecisionReason: string } }).hookSpecificOutput.permissionDecisionReason
    expect(razao).toContain('Comando bloqueado: o portão de revisões falhou (lançou ao ler o comando)')
    expect(razao).not.toContain('Commit bloqueado')
  })
})

describe('o hook nega o desvio do git hook e a linha Fora do processo (RF14)', () => {
  const portao = () => comandoDe('PreToolUse', 'portao')

  /** A cópia do hook num repositório git: o commit que passa pelo desvio precisa de árvore para a decisão ler. */
  function copiaComGit(): string {
    const raiz = copia()
    execFileSync('git', ['init', '-q'], { cwd: raiz })
    writeFileSync(join(raiz, 'msg.txt'), 'Corrige x\n\nFora do processo: ajuste do Joaquim\n')
    writeFileSync(join(raiz, 'msg-com-desvio.txt'), 'Explica o que o hook nega: --no-verify e CLAUDE_CODE_AGENT=\n')
    return raiz
  }

  /** A decisão que o hook escreveu no stdout, ou `null` quando ele não disse nada. */
  function decisao(saida: { stdout: string }) {
    if (saida.stdout === '') return null
    return (JSON.parse(saida.stdout) as { hookSpecificOutput: { permissionDecision: string; permissionDecisionReason: string } }).hookSpecificOutput
  }

  const negados = [
    { etiqueta: 'no-verify', comando: 'git commit --no-verify -m "x"', motivo: /--no-verify/ },
    { etiqueta: 'no-verify abreviado em verif', comando: 'git commit --no-verif -m "x"', motivo: /--no-verify/ },
    { etiqueta: 'no-verify abreviado em ver', comando: 'git commit --no-ver -m "x"', motivo: /--no-verify/ },
    { etiqueta: 'n no commit', comando: 'git commit -n -m "x"', motivo: /-n, que é --no-verify/ },
    { etiqueta: 'n junto do m', comando: 'git commit -nm "x"', motivo: /-n, que é --no-verify/ },
    { etiqueta: 'n no meio do bloco', comando: 'git commit -anm "x"', motivo: /-n, que é --no-verify/ },
    { etiqueta: 'hookspath por c', comando: 'git -c core.hooksPath=/dev/null commit -m "x"', motivo: /core\.hooksPath/ },
    { etiqueta: 'hookspath em maiúsculas', comando: 'git -c core.HOOKSPATH=x commit -m "x"', motivo: /core\.hooksPath/ },
    { etiqueta: 'hookspath por config', comando: 'git config core.hookspath /tmp/x', motivo: /core\.hooksPath/ },
    { etiqueta: 'variável do papel vazia', comando: 'CLAUDE_CODE_AGENT= git commit -m "x"', motivo: /mexe em CLAUDE_CODE_AGENT/ },
    { etiqueta: 'unset do papel', comando: 'unset CLAUDE_CODE_AGENT', motivo: /mexe em CLAUDE_CODE_AGENT/ },
    { etiqueta: 'env que tira o papel', comando: 'env -u CLAUDE_CODE_AGENT git commit -m "x"', motivo: /mexe em CLAUDE_CODE_AGENT/ },
    { etiqueta: 'GIT_CONFIG_COUNT', comando: 'GIT_CONFIG_COUNT=1 git commit -m "x"', motivo: /mexe em GIT_CONFIG_COUNT/ },
  ]

  it.each(negados)('com papel, o deny sai no stdout e o hook sai 0: $etiqueta', ({ comando, motivo }) => {
    const saida = rodar(portao(), copiaComGit(), comando, 'implementador')
    expect(saida.status).toBe(0)
    const razao = decisao(saida)?.permissionDecisionReason ?? ''
    expect(decisao(saida)?.permissionDecision).toBe('deny')
    expect(razao).toContain('Comando bloqueado')
    expect(razao).toMatch(motivo)
    // O deny é o da regra, não o do `catch` do hook.
    expect(razao).not.toContain('o portão de revisões falhou')
  })

  it.each(negados)('sem papel, passa calado: $etiqueta', ({ comando }) => {
    const saida = rodar(portao(), copiaComGit(), comando)
    expect(saida.status).toBe(0)
    expect(saida.stdout).toBe('')
    // Um papel que não é do time também passa: o orquestrador e o subagente de fora do time não têm hook a pular.
    expect(rodar(portao(), copiaComGit(), comando, 'general-purpose').stdout).toBe('')
  })

  it.each([
    { etiqueta: 'git log com n', comando: 'git log -n 3' },
    { etiqueta: 'git diff com no-ext-diff', comando: 'git diff --no-ext-diff' },
    { etiqueta: 'git com c de outra chave', comando: 'git -c user.name=x commit -m "x"' },
    { etiqueta: 'git com atribuição de outra variável', comando: 'GIT_AUTHOR_DATE=x git commit -m "x"' },
    { etiqueta: 'grep na variável do papel', comando: 'grep CLAUDE_CODE_AGENT .claude/settings.json' },
    { etiqueta: 'printenv da variável do papel', comando: 'printenv CLAUDE_CODE_AGENT' },
    { etiqueta: 'mensagem em arquivo com o desvio dentro', comando: 'git commit -F msg-com-desvio.txt' },
  ])('com papel, passa calado: $etiqueta', ({ comando }) => {
    const saida = rodar(portao(), copiaComGit(), comando, 'implementador')
    expect(saida.status).toBe(0)
    expect(saida.stdout).toBe('')
  })

  it.each([
    { etiqueta: 'no -m', comando: 'git commit -m "x\n\nFora do processo: ajuste"', dica: true },
    { etiqueta: 'em F separado', comando: 'git commit -F msg.txt', dica: false },
    { etiqueta: 'em F colado', comando: 'git commit -Fmsg.txt', dica: false },
    { etiqueta: 'em file com igual', comando: 'git commit --file=msg.txt', dica: false },
  ])('Fora do processo: negado com e sem papel: $etiqueta', ({ comando, dica }) => {
    for (const papel of [undefined, 'implementador']) {
      const saida = rodar(portao(), copiaComGit(), comando, papel)
      expect(saida.status).toBe(0)
      const razao = decisao(saida)?.permissionDecisionReason ?? ''
      expect(decisao(saida)?.permissionDecision).toBe('deny')
      expect(razao).toContain('Fora do processo:')
      expect(razao).not.toContain('o portão de revisões falhou')
      // Só o termo dentro do -m traz a dica do -F.
      expect(razao.includes('git commit -F <arquivo>')).toBe(dica)
    }
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
