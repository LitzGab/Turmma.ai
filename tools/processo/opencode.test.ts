// O Implementador pode rodar no opencode, no modo econômico (D78, revista em 09/10/2026), que não lê `.claude/settings.json`. O que este
// arquivo prova: a trava do commit e do push continua valendo lá, pelo plugin, e o papel é o mesmo nas duas ferramentas.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import plugin, { executarComNode, vetoDoPortao, type ChamadaDeFerramenta, type PedidoAoPortao } from '../../.opencode/plugins/portao-de-revisoes.ts'

const RAIZ = join(import.meta.dirname, '..', '..')
/** O portão deste repositório, avaliando um repositório temporário. */
const portaoDeVerdade = executarComNode(join(RAIZ, 'tools', 'processo', 'hook-revisoes.ts'))

function repositorio(branch = 'spec/exemplo') {
  // O caminho real: o git devolve a raiz sem os atalhos da pasta temporária.
  const raiz = realpathSync(mkdtempSync(join(tmpdir(), 'opencode-')))
  const git = (...args: string[]) => execFileSync('git', ['-c', 'user.name=teste', '-c', 'user.email=teste@exemplo.invalid', ...args], { cwd: raiz, stdio: 'pipe' })
  git('init', '-q', '-b', branch)
  writeFileSync(join(raiz, 'LEIAME.md'), 'exemplo\n')
  git('add', 'LEIAME.md')
  git('commit', '-q', '-m', 'inicio')
  return { raiz, git }
}

function escrever(raiz: string, caminho: string, conteudo = 'export const x = 1\n') {
  mkdirSync(dirname(join(raiz, caminho)), { recursive: true })
  writeFileSync(join(raiz, caminho), conteudo)
}

const shell = (command: string, extra: Partial<ChamadaDeFerramenta> & { workdir?: string } = {}): ChamadaDeFerramenta => {
  const { workdir, ...chamada } = extra
  return { tool: 'shell', agent: 'implementador', input: workdir === undefined ? { command } : { command, workdir }, ...chamada }
}

describe('a trava do commit no opencode', () => {
  it('veta o commit que leva código sem marca de tarefa nem de correção, com o motivo do portão', () => {
    const { raiz } = repositorio()
    escrever(raiz, 'apps/api/src/x.ts')
    const motivo = vetoDoPortao(shell('git add apps/api/src/x.ts && git commit -m "Implementa x"'), raiz, portaoDeVerdade)
    expect(motivo).toContain('Commit bloqueado')
    expect(motivo).toContain('apps/api/src/x.ts')
  })

  it('deixa passar o commit que só leva documento', () => {
    const { raiz } = repositorio()
    escrever(raiz, 'docs/nota.md', 'nota\n')
    expect(vetoDoPortao(shell('git add docs/nota.md && git commit -m "Registra a nota"'), raiz, portaoDeVerdade)).toBeNull()
  })

  it('avalia a árvore do `workdir` da chamada, e não a da sessão', () => {
    // A sessão está num checkout limpo e o comando roda no andar, que tem código: avaliado contra a sessão, passaria.
    const { raiz: terreo, git } = repositorio('develop')
    const andar = join(realpathSync(mkdtempSync(join(tmpdir(), 'opencode-andar-'))), 'spec')
    git('worktree', 'add', '-q', '-b', 'spec/exemplo', andar)
    escrever(andar, 'apps/api/src/x.ts')
    const comando = 'git add apps/api/src/x.ts && git commit -m "Implementa x"'
    expect(vetoDoPortao(shell(comando), terreo, portaoDeVerdade)).toBeNull()
    expect(vetoDoPortao(shell(comando, { workdir: andar }), terreo, portaoDeVerdade)).toContain('Commit bloqueado')
  })

  it('resolve o `workdir` relativo a partir da pasta da sessão', () => {
    const pedidos: PedidoAoPortao[] = []
    const { raiz } = repositorio()
    mkdirSync(join(raiz, 'apps'))
    vetoDoPortao(shell('git commit -m x', { workdir: 'apps' }), raiz, (pedido) => {
      pedidos.push(pedido)
      return { saida: '' }
    })
    expect(pedidos).toEqual([{ raiz, cwd: join(raiz, 'apps'), comando: 'git commit -m x', papel: 'implementador' }])
  })
})

describe('a trava do push no opencode', () => {
  it('veta o push do Implementador na develop, e não o de uma sessão sem papel do time', () => {
    const { raiz } = repositorio('develop')
    const comando = 'git push origin develop'
    expect(vetoDoPortao(shell(comando), raiz, portaoDeVerdade)).toContain('Push bloqueado')
    expect(vetoDoPortao(shell(comando, { agent: 'build' }), raiz, portaoDeVerdade)).toBeNull()
    expect(vetoDoPortao({ tool: 'shell', input: { command: comando } }, raiz, portaoDeVerdade)).toBeNull()
  })

  it('deixa o Implementador empurrar a branch do andar', () => {
    const { raiz } = repositorio('spec/exemplo')
    expect(vetoDoPortao(shell('git push -u origin HEAD'), raiz, portaoDeVerdade)).toBeNull()
  })
})

describe('o que não é commit nem push', () => {
  it('não consulta o portão em comando que não é do git, nem em outra ferramenta', () => {
    const { raiz } = repositorio()
    const nuncaChamado = () => {
      throw new Error('o portão não devia ter sido consultado')
    }
    expect(vetoDoPortao(shell('npx vitest run --project unidade'), raiz, nuncaChamado)).toBeNull()
    expect(vetoDoPortao(shell('git status --short'), raiz, nuncaChamado)).toBeNull()
    expect(vetoDoPortao({ tool: 'edit', agent: 'implementador', input: { command: 'git commit -m x' } }, raiz, nuncaChamado)).toBeNull()
  })
})

describe('quando o próprio portão falha', () => {
  it('veta o commit em vez de deixá-lo passar sem conferência', () => {
    const { raiz } = repositorio()
    const comando = 'git commit -m x'
    expect(vetoDoPortao(shell(comando), raiz, () => ({ falha: 'spawnSync node ENOENT' }))).toContain('não pôde ser consultado (spawnSync node ENOENT)')
    expect(vetoDoPortao(shell(comando), raiz, () => ({ saida: 'Segmentation fault' }))).toContain('não pôde ser consultado')
    expect(vetoDoPortao(shell(comando), raiz, () => ({ saida: '{"hookSpecificOutput":{}}' }))).toContain('não pôde ser consultado')
    expect(vetoDoPortao(shell(comando), raiz, executarComNode(join(raiz, 'nao-existe.ts')))).toContain('não existe')
  })
})

describe('o plugin, como o opencode o carrega', () => {
  it('registra o gancho da ferramenta e cancela a chamada lançando o motivo', async () => {
    const { raiz } = repositorio()
    escrever(raiz, 'apps/api/src/x.ts')
    // O plugin procura o portão na raiz da sessão: o repositório temporário recebe o deste.
    for (const arquivo of ['hook-revisoes.ts', 'revisoes.ts']) {
      escrever(raiz, join('tools', 'processo', arquivo), readFileSync(join(RAIZ, 'tools', 'processo', arquivo), 'utf8'))
    }
    const ganchos: Array<(chamada: ChamadaDeFerramenta) => void> = []
    await plugin.setup({
      location: { directory: raiz },
      tool: {
        hook: (nome, gancho) => {
          expect(nome).toBe('execute.before')
          ganchos.push(gancho)
          return Promise.resolve(undefined)
        },
      },
    })
    const [gancho] = ganchos
    if (!gancho) throw new Error('o plugin não registrou gancho nenhum')
    expect(() => gancho(shell('git add apps/api/src/x.ts && git commit -m "Implementa x"'))).toThrow('Commit bloqueado')
    expect(() => gancho(shell('git status --short'))).not.toThrow()
  })
})

describe('o papel do Implementador nas duas ferramentas', () => {
  const corpo = (caminho: string) => {
    const [, , ...resto] = readFileSync(join(RAIZ, caminho), 'utf8').split('---\n')
    return resto.join('---\n')
  }
  const SECAO = '## Nesta ferramenta'

  it('tem o mesmo texto no opencode e no Claude Code, fora da seção de cada ferramenta', () => {
    const noOpencode = corpo('.opencode/agents/implementador.md')
    const noClaude = corpo('.claude/agents/implementador.md')
    expect(noOpencode).toContain(SECAO)
    expect(noClaude).toContain(SECAO)
    expect(noOpencode.split(SECAO)[0]).toBe(noClaude.split(SECAO)[0])
  })

  it('não cria subagente em nenhuma das duas: quem chama os revisores é a Mesa', () => {
    const opencode = readFileSync(join(RAIZ, '.opencode/agents/implementador.md'), 'utf8').split('---\n')[1] ?? ''
    const claude = readFileSync(join(RAIZ, '.claude/agents/implementador.md'), 'utf8').split('---\n')[1] ?? ''
    expect(opencode).toMatch(/- action: subagent\n\s+resource: "\*"\n\s+effect: deny/)
    expect(claude).toMatch(/^disallowedTools: .*\bAgent\b/m)
  })

  it('é o agente com que toda sessão do opencode nasce neste repositório, e ele existe', () => {
    const configuracao = readFileSync(join(RAIZ, '.opencode/opencode.jsonc'), 'utf8')
    const agente = /"default_agent":\s*"([^"]+)"/.exec(configuracao)?.[1]
    expect(agente).toBe('implementador')
    expect(existsSync(join(RAIZ, '.opencode', 'agents', `${agente}.md`))).toBe(true)
  })
})
