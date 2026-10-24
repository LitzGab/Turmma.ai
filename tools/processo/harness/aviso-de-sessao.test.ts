// RF29: a mensagem do time que chega colada ao Orquestrador. Texto colado não executa o /seguir; o hook UserPromptSubmit
// devolve o contexto que manda ler a skill. O hook é lido do `settings.json` e rodado como o Claude Code o roda, com o
// JSON do evento no stdin e `CLAUDE_PROJECT_DIR` numa pasta temporária.
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const REPOSITORIO = join(import.meta.dirname, '../../..')
const HOOK = '.claude/hooks/aviso-de-sessao.sh'

interface Configuracao {
  hooks: Record<string, { hooks: { type: string; command: string }[] }[]>
}

/** O comando do `UserPromptSubmit`, como está no `settings.json`. */
function comandoDoSettings(): string {
  const configuracao = JSON.parse(readFileSync(join(REPOSITORIO, '.claude/settings.json'), 'utf8')) as Configuracao
  const comandos = (configuracao.hooks['UserPromptSubmit'] ?? []).flatMap((grupo) => grupo.hooks.map((hook) => hook.command))
  if (comandos.length !== 1 || comandos[0] === undefined) {
    throw new Error(`.claude/settings.json deveria ter um só comando em UserPromptSubmit, e tem ${String(comandos.length)}`)
  }
  return comandos[0]
}

const pastas: string[] = []
afterAll(() => {
  for (const pasta of pastas) rmSync(pasta, { recursive: true, force: true })
})

/** Uma pasta vazia que faz de checkout e de casa: qualquer arquivo que o hook gravasse apareceria nela. */
function pastaVazia(): string {
  const pasta = mkdtempSync(join(tmpdir(), 'aviso-'))
  pastas.push(pasta)
  return pasta
}

function entrada(prompt: string): string {
  return JSON.stringify({ hook_event_name: 'UserPromptSubmit', cwd: '/x', prompt })
}

/** `raiz` é o `CLAUDE_PROJECT_DIR`: o repositório real, ou uma cópia com só o hook (o caso que prova que ele não grava). */
function rodar(pasta: string, stdin: string, papel?: string, raiz: string = REPOSITORIO) {
  const env: NodeJS.ProcessEnv = { ...process.env, CLAUDE_PROJECT_DIR: raiz, HOME: pasta, TMPDIR: pasta }
  delete env['CLAUDE_CODE_AGENT']
  if (papel !== undefined) env['CLAUDE_CODE_AGENT'] = papel
  const resultado = spawnSync('sh', ['-c', comandoDoSettings()], { cwd: pasta, env, input: stdin, encoding: 'utf8' })
  return { status: resultado.status, stdout: resultado.stdout, stderr: resultado.stderr }
}

describe('o hook de entrada com o prefixo /seguir (RF29)', () => {
  it('entrada com `/seguir ` e sem papel: devolve o contexto que manda ler a skill e seguir com a entrada', () => {
    const saida = rodar(pastaVazia(), entrada('/seguir RELATÓRIO de Implementador\nTarefa: tasks/prd-x/1_task.md'))
    expect(saida.status).toBe(0)
    expect(saida.stdout).toContain('.claude/skills/seguir/SKILL.md')
    expect(saida.stdout).toContain('siga com esta entrada')
  })

  it('com papel (qualquer um do time): nada', () => {
    for (const papel of ['implementador', 'mesa-de-revisao', 'arquiteto', 'validador']) {
      const saida = rodar(pastaVazia(), entrada('/seguir RELATÓRIO de Implementador'), papel)
      expect(saida.status).toBe(0)
      expect(saida.stdout).toBe('')
    }
  })

  it('sem o prefixo `/seguir `: nada, inclusive o texto que só o cita no meio ou cola o nome da skill', () => {
    for (const prompt of ['PEDIDO de Orquestrador\nTarefa: x', 'rode o /seguir agora', '/seguirdepois algo', '/seguir', ' /seguir tarefa', '', 'RELATÓRIO\n/seguir x']) {
      const saida = rodar(pastaVazia(), entrada(prompt))
      expect(saida.status).toBe(0)
      expect(saida.stdout).toBe('')
    }
  })

  it('entrada que não é JSON, vazia ou sem `prompt`: sai 0 e calada, nunca bloqueia o prompt', () => {
    for (const stdin of ['', 'isto não é json', '{}', '{"prompt":42}', '{"prompt":null}']) {
      const saida = rodar(pastaVazia(), stdin)
      expect(saida.status).toBe(0)
      expect(saida.stdout).toBe('')
      expect(saida.stderr).toBe('')
    }
  })

  it('não grava arquivo nenhum: nem o texto da mensagem, nem na raiz do projeto, nem em casa, nem no TMPDIR', () => {
    // Uma cópia só com o hook: o `CLAUDE_PROJECT_DIR` não é o repositório real, onde outros testes escrevem em paralelo.
    const raiz = pastaVazia()
    mkdirSync(join(raiz, '.claude/hooks'), { recursive: true })
    cpSync(join(REPOSITORIO, HOOK), join(raiz, HOOK))
    const tudoEm = (dir: string) => readdirSync(dir, { recursive: true }).map(String).sort()
    const casa = pastaVazia()
    const antes = tudoEm(raiz)
    const saida = rodar(casa, entrada('/seguir RELATÓRIO de Implementador SEGREDO-DA-MENSAGEM'), undefined, raiz)
    expect(saida.stdout).not.toBe('')
    expect(tudoEm(raiz)).toEqual(antes)
    expect(tudoEm(casa)).toEqual([])
  })
})

describe('o comando novo do settings.json (RF30 da 19.0)', () => {
  it('aponta o hook que existe, e que o bash lê sem erro de sintaxe', () => {
    const comando = comandoDoSettings()
    expect(comando).toContain(`$CLAUDE_PROJECT_DIR/${HOOK}`)
    expect(existsSync(join(REPOSITORIO, HOOK))).toBe(true)
    expect(statSync(join(REPOSITORIO, HOOK)).size).toBeGreaterThan(0)
    expect(spawnSync('bash', ['-n', join(REPOSITORIO, HOOK)], { encoding: 'utf8' }).status).toBe(0)
  })
})
