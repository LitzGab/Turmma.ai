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
      // A checagem de `CLAUDE_CODE_AGENT` vem antes da expressão: vale para a forma pura e para a embrulhada.
      for (const prompt of ['/seguir RELATÓRIO de Implementador', '<pasted_content id="cf73">\n\n/seguir RELATÓRIO de Implementador']) {
        const saida = rodar(pastaVazia(), entrada(prompt), papel)
        expect(saida.status, `${papel} ${JSON.stringify(prompt)}`).toBe(0)
        expect(saida.stdout, `${papel} ${JSON.stringify(prompt)}`).toBe('')
      }
    }
  })

  it('mensagem colada de verdade: o `<pasted_content id="…">` e a quebra de linha (às vezes com linha em branco) antes do `/seguir `', () => {
    // A forma tirada das transcrições do Orquestrador: 611 mensagens coladas, 504 delas com `\n\n` antes do `/seguir`.
    const corpo = '/seguir RELATÓRIO de Implementador\nTarefa: tasks/prd-x/1_task.md'
    const formas = [
      `<pasted_content id="cf73">\n${corpo}`,
      `<pasted_content id="cf73">\n\n${corpo}`,
      `<pasted_content id="a1-B_2">\r\n${corpo}`,
      `<pasted_content id="cf73">${corpo}`,
      `\n<pasted_content id="cf73">\n\n${corpo}`,
      `  ${corpo}`,
    ]
    for (const prompt of formas) {
      const saida = rodar(pastaVazia(), entrada(prompt))
      expect(saida.status, JSON.stringify(prompt)).toBe(0)
      expect(saida.stdout, JSON.stringify(prompt)).toContain('.claude/skills/seguir/SKILL.md')
      expect(saida.stdout, JSON.stringify(prompt)).toContain('siga com esta entrada')
    }
  })

  it('mensagem colada que não começa pelo `/seguir `: nada, inclusive o texto que só o cita no meio, dentro ou fora do embrulho', () => {
    const prompts = [
      'PEDIDO de Orquestrador\nTarefa: x',
      'rode o /seguir agora',
      '/seguirdepois algo',
      '/seguir',
      '',
      'RELATÓRIO\n/seguir x',
      '<pasted_content id="cf73">\nPEDIDO de Orquestrador\n/seguir x',
      '<pasted_content id="cf73">\nrode o /seguir agora',
      '<pasted_content id="cf73">\n/seguirdepois algo',
      '<pasted_content id="cf73">\n/seguir',
      '<pasted_content id="cf73">',
      '<pasted_content id="">\n/seguir x',
      '<pasted_content id="a b">\n/seguir x',
      '<pasted_content id="a">\nRELATÓRIO\n</pasted_content id="a">\n<pasted_content id="b">\n/seguir x',
      'veja:\n<pasted_content id="cf73">\n/seguir x',
      '<outro_embrulho id="cf73">\n/seguir x',
    ]
    for (const prompt of prompts) {
      const saida = rodar(pastaVazia(), entrada(prompt))
      expect(saida.status, JSON.stringify(prompt)).toBe(0)
      expect(saida.stdout, JSON.stringify(prompt)).toBe('')
    }
  })

  it('entrada que não é JSON, vazia ou sem `prompt`: sai 0 e calada, nunca bloqueia o prompt', () => {
    for (const stdin of ['', 'isto não é json', '{}', '{"prompt":42}', '{"prompt":null}', '{"prompt":["/seguir x"]}', '{"prompt":{"toString":"/seguir x"}}']) {
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
    // A forma pura e a embrulhada, que é o caminho que a correção do C1 abre.
    for (const prompt of ['/seguir RELATÓRIO de Implementador SEGREDO-DA-MENSAGEM', '<pasted_content id="cf73">\n\n/seguir RELATÓRIO de Implementador SEGREDO-DA-MENSAGEM']) {
      const casa = pastaVazia()
      const antes = tudoEm(raiz)
      const saida = rodar(casa, entrada(prompt), undefined, raiz)
      expect(saida.stdout, JSON.stringify(prompt)).not.toBe('')
      expect(saida.stdout, JSON.stringify(prompt)).not.toContain('SEGREDO-DA-MENSAGEM')
      expect(tudoEm(raiz), JSON.stringify(prompt)).toEqual(antes)
      expect(tudoEm(casa), JSON.stringify(prompt)).toEqual([])
    }
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
