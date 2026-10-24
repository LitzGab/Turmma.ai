// A terceira camada do RF14 contra um git de verdade (`cenarios.md` B, "RF14, terceira camada"). Cada caso monta um
// repositório temporário com a `develop` e uma branch de trabalho, grava a `origin/develop` à mão e chama o script como processo,
// como o job `verificar` o chama. Não sobe o compose.
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { ehCodigoParaAEsteira } from '../processo/portao.ts'
import { CODIGO_PARA_A_ESTEIRA, DOCUMENTO_PARA_A_ESTEIRA } from './caminhos-da-esteira.ts'

const SCRIPT = join(import.meta.dirname, 'conferir-entregas.ts')
const HOOKS_DO_PROCESSO = join(import.meta.dirname, '..', 'processo', 'git-hooks')
const REVISOES = '\n\nRevisões: test-engineer APROVADO (1ª rodada), revisor-geral APROVADO (1ª rodada)'

const temporarios: string[] = []
afterAll(() => {
  for (const pasta of temporarios) rmSync(pasta, { recursive: true, force: true })
})

/** Sem o `GIT_*` de quem roda o teste e sem a configuração global do git. */
const ambiente = (extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
  ...Object.fromEntries(Object.entries(process.env).filter(([nome]) => !nome.startsWith('GIT_') && nome !== 'CLAUDE_CODE_AGENT')),
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  ...extra,
})

const TASKS = ['# Tarefas', '', '- [ ] **1.0 — a base**', '- [ ] **2.0 — a tela**', '', 'fim', ''].join('\n')

/**
 * Um repositório com a `develop` (e a `origin/develop` no mesmo commit), `apps/a.ts` e `tasks/prd-x/tasks.md` de partida, e a
 * branch de trabalho `branch` já em uso. `semOrigin` deixa a `origin/develop` de fora: o checkout raso.
 */
function repositorio(branch: string, opcoes: { semOrigin?: boolean } = {}) {
  const raiz = mkdtempSync(join(tmpdir(), 'entregas-'))
  temporarios.push(raiz)
  const git = (...argumentos: string[]): string => execFileSync('git', argumentos, { cwd: raiz, encoding: 'utf8', stdio: 'pipe', env: ambiente() }).trim()
  const escrever = (arquivo: string, conteudo: string): void => {
    mkdirSync(dirname(join(raiz, arquivo)), { recursive: true })
    writeFileSync(join(raiz, arquivo), conteudo)
  }
  const commit = (arquivos: Record<string, string>, mensagem: string): string => {
    for (const [arquivo, conteudo] of Object.entries(arquivos)) escrever(arquivo, conteudo)
    git('add', '-A')
    git('commit', '-q', '-m', mensagem)
    return git('rev-parse', 'HEAD')
  }
  git('init', '-q', '-b', 'develop')
  git('config', 'user.name', 'teste')
  git('config', 'user.email', 'teste@exemplo.invalid')
  commit({ 'README.md': 'exemplo\n', 'apps/a.ts': 'a\n', 'tasks/prd-x/tasks.md': TASKS }, 'Abre o exemplo')
  if (!(opcoes.semOrigin ?? false)) git('update-ref', 'refs/remotes/origin/develop', 'HEAD')
  if (branch !== 'develop') git('checkout', '-q', '-b', branch)
  const conferir = (): { status: number | null; saida: string } => {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: ambiente() })
    return { status: r.status, saida: `${r.stdout}${r.stderr}` }
  }
  return { raiz, git, escrever, commit, conferir }
}

describe('ci:conferir-entregas, a terceira camada do RF14', () => {
  it('histórico real de spec: vários commits de tarefa com Revisões, o último com código, e o documento no meio sem marca', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'tasks/prd-x/1_task.md': 'doc\n' }, 'Escreve a tarefa 1.0')
    r.commit({ 'apps/a.ts': 'um\n' }, `Entrega a base (tarefa 1.0)${REVISOES}`)
    r.commit({ 'tasks/prd-x/estado.md': 'estado\n' }, 'Registra o estado')
    r.commit({ 'apps/b.ts': 'dois\n' }, `Entrega a tela (tarefa 2.0)${REVISOES}`)
    const { status, saida } = r.conferir()
    expect({ status, saida }).toMatchObject({ status: 0 })
    expect(saida).toContain('Conferidos 4 commit(s)')
  })

  it('o intervalo vazio sai 0', () => {
    const r = repositorio('spec/exemplo')
    const { status, saida } = r.conferir()
    expect(status).toBe(0)
    expect(saida).toContain('Nenhum commit novo')
  })

  it('correcao/x com a marca de correção e Revisões sai 0', () => {
    const r = repositorio('correcao/x')
    r.commit({ 'apps/a.ts': 'corrigido\n' }, `Corrige o teste que oscila (correção x)${REVISOES}`)
    expect(r.conferir().status).toBe(0)
  })

  it('commits de documento sem marca, e um commit só de skills-lock.json, saem 0', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'docs/guia.md': 'guia\n', 'tasks/prd-x/prd.md': 'prd\n', 'README.md': 'outro\n' }, 'Escreve os documentos')
    r.commit({ 'skills-lock.json': '{}\n' }, 'Atualiza as skills')
    r.commit({ '.claude/skills/x/SKILL.md': 'skill\n', '.claude/rules/40-testes.md': 'regra\n' }, 'Ajusta a skill e a regra')
    expect(r.conferir().status).toBe(0)
  })

  it('o commit de código com "Fora do processo: ajuste" sai 0, e a linha vale em qualquer caixa', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'apps/a.ts': 'ajuste\n' }, 'Ajusta o que o Joaquim pediu\n\nFora do processo: ajuste')
    r.commit({ 'tools/guardas/x.mjs': 'x\n' }, 'Ajusta a guarda\n\nFORA DO PROCESSO: guarda')
    expect(r.conferir().status).toBe(0)
  })

  it('o merge do encontro, limpo, com o tasks.md resolvido à mão, sai 0: o código que ele trouxe está nos commits do outro lado', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'apps/a.ts': 'da spec\n', 'tasks/prd-x/tasks.md': TASKS.replace('- [ ] **1.0', '- [x] **1.0') }, `Entrega a base (tarefa 1.0)${REVISOES}`)
    r.git('checkout', '-q', '-b', 'linha', 'develop')
    r.commit({ 'apps/b.ts': 'da linha\n', 'tasks/prd-x/tasks.md': TASKS.replace('- [ ] **1.0', '- [~] **1.0') }, `Entrega a tela (tarefa 2.0)${REVISOES}`)
    r.git('checkout', '-q', 'spec/exemplo')
    expect(() => r.git('merge', '--no-edit', 'linha')).toThrow()
    r.escrever('tasks/prd-x/tasks.md', TASKS.replace('- [ ] **1.0', '- [x] **1.0'))
    r.git('add', '-A')
    r.git('commit', '-q', '-m', 'Junta as linhas')
    const { status, saida } = r.conferir()
    expect({ status, saida }).toMatchObject({ status: 0 })
  })

  it('o merge da develop sai 0 mesmo trazendo código sem marca, que a develop já tinha', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'apps/b.ts': 'da spec\n' }, `Entrega a base (tarefa 1.0)${REVISOES}`)
    r.git('checkout', '-q', 'develop')
    r.commit({ 'apps/c.ts': 'da develop\n', 'tools/ci/y.ts': 'y\n' }, 'Pousa outra spec')
    r.git('update-ref', 'refs/remotes/origin/develop', 'develop')
    r.git('checkout', '-q', 'spec/exemplo')
    r.git('merge', '--no-edit', 'develop')
    const { status, saida } = r.conferir()
    expect({ status, saida }).toMatchObject({ status: 0 })
    expect(saida).toContain('Conferidos 2 commit(s)')
  })

  it('código sem marca sai 1, citando o hash do commit e só dele', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'apps/b.ts': 'um\n' }, `Entrega a base (tarefa 1.0)${REVISOES}`)
    const solto = r.commit({ 'apps/c.ts': 'solto\n' }, 'Conserta sem marca')
    const { status, saida } = r.conferir()
    expect(status).toBe(1)
    expect(saida).toContain(solto)
    expect(saida).toContain('leva código sem (tarefa N.0) nem (correção <slug>) no título')
    expect(saida).toContain('1 commit(s)')
  })

  it('a marca sem a linha Revisões sai 1', () => {
    const r = repositorio('spec/exemplo')
    const sem = r.commit({ 'apps/b.ts': 'um\n' }, 'Entrega a base (tarefa 1.0)')
    const { status, saida } = r.conferir()
    expect(status).toBe(1)
    expect(saida).toContain(sem)
    expect(saida).toContain('não a linha "Revisões:"')
  })

  it('a linha Revisões sem texto, ou só no título, não vale', () => {
    const vazia = repositorio('spec/exemplo')
    vazia.commit({ 'apps/b.ts': 'um\n' }, 'Entrega a base (tarefa 1.0)\n\nRevisões:')
    expect(vazia.conferir().status).toBe(1)
    const noTitulo = repositorio('spec/exemplo')
    noTitulo.commit({ 'apps/b.ts': 'um\n' }, 'Revisões: ok (tarefa 1.0)')
    expect(noTitulo.conferir().status).toBe(1)
  })

  it('a marca só no corpo não vale: ela é do título', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'apps/b.ts': 'um\n' }, `Conserta a base\n\nvem da (tarefa 1.0)${REVISOES}`)
    expect(r.conferir().status).toBe(1)
  })

  it('o merge com conflito resolvido em código, sem marca, sai 1, citando o merge', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'apps/a.ts': 'da spec\n' }, `Entrega a base (tarefa 1.0)${REVISOES}`)
    r.git('checkout', '-q', '-b', 'linha', 'develop')
    r.commit({ 'apps/a.ts': 'da linha\n' }, `Entrega a tela (tarefa 2.0)${REVISOES}`)
    r.git('checkout', '-q', 'spec/exemplo')
    expect(() => r.git('merge', '--no-edit', 'linha')).toThrow()
    r.escrever('apps/a.ts', 'resolvido\n')
    r.git('add', '-A')
    r.git('commit', '-q', '-m', 'Junta as telas')
    const merge = r.git('rev-parse', 'HEAD')
    const { status, saida } = r.conferir()
    expect(status).toBe(1)
    expect(saida).toContain(merge)
  })

  it('o merge que resolve o conflito ficando com um lado sai 1: descartou o código do outro', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'apps/a.ts': 'da spec\n' }, `Entrega a base (tarefa 1.0)${REVISOES}`)
    r.git('checkout', '-q', '-b', 'linha', 'develop')
    r.commit({ 'apps/a.ts': 'da linha\n' }, `Entrega a tela (tarefa 2.0)${REVISOES}`)
    r.git('checkout', '-q', 'spec/exemplo')
    expect(() => r.git('merge', '--no-edit', 'linha')).toThrow()
    r.git('checkout', '--ours', 'apps/a.ts')
    r.git('add', '-A')
    r.git('commit', '-q', '-m', 'Junta as telas')
    const merge = r.git('rev-parse', 'HEAD')
    const { status, saida } = r.conferir()
    expect(status).toBe(1)
    expect(saida).toContain(merge)
  })

  it('só tools/guardas/x.mjs sem marca sai 1, e só .github/workflows/ci.yml sem marca também', () => {
    for (const arquivo of ['tools/guardas/x.mjs', '.github/workflows/ci.yml']) {
      const r = repositorio('spec/exemplo')
      const sha = r.commit({ [arquivo]: 'x\n' }, 'Mexe na guarda')
      const { status, saida } = r.conferir()
      expect({ arquivo, status }).toEqual({ arquivo, status: 1 })
      expect(saida).toContain(sha)
      expect(saida).toContain(arquivo)
    }
  })

  it('"Fora do processo:" sem motivo sai 1, e a menção no meio de uma linha não vale', () => {
    const vazio = repositorio('spec/exemplo')
    const semMotivo = vazio.commit({ 'apps/b.ts': 'um\n' }, 'Ajusta\n\nFora do processo:   ')
    const { status, saida } = vazio.conferir()
    expect(status).toBe(1)
    expect(saida).toContain(semMotivo)
    expect(saida).toContain('está sem motivo')
    const mencao = repositorio('spec/exemplo')
    mencao.commit({ 'apps/b.ts': 'um\n' }, 'Ajusta, sem Fora do processo: nenhum')
    expect(mencao.conferir().status).toBe(1)
  })

  it('código com acento e espaço no nome, sem marca, sai 1: vale o nome inteiro', () => {
    const r = repositorio('spec/exemplo')
    const sha = r.commit({ 'apps/ação nova.ts': 'x\n' }, 'Cria a ação')
    const { status, saida } = r.conferir()
    expect(status).toBe(1)
    expect(saida).toContain(sha)
    expect(saida).toContain('apps/ação nova.ts')
  })

  it('mover código para um documento, sem marca, sai 1: o rename conta o arquivo que sai', () => {
    const r = repositorio('spec/exemplo')
    mkdirSync(join(r.raiz, 'docs'))
    r.git('mv', 'apps/a.ts', 'docs/a.md')
    r.git('commit', '-q', '-m', 'Move para o documento')
    const { status, saida } = r.conferir()
    expect(status).toBe(1)
    expect(saida).toContain('apps/a.ts')
  })

  it('o commit de commit-tree, que o git hook não vê, sai 1 sem marca, e o motivo vazio com espaços também', () => {
    // O `commit-tree` grava a mensagem como veio, sem a limpeza do `git commit`: o espaço depois do termo chega à esteira.
    const semMarca = repositorio('spec/exemplo')
    semMarca.escrever('apps/b.ts', 'um\n')
    semMarca.git('add', '-A')
    const solto = semMarca.git('commit-tree', semMarca.git('write-tree'), '-p', 'HEAD', '-m', 'Escapa do hook')
    semMarca.git('update-ref', 'HEAD', solto)
    const { status, saida } = semMarca.conferir()
    expect(status).toBe(1)
    expect(saida).toContain(solto)

    const vazio = repositorio('spec/exemplo')
    vazio.escrever('apps/b.ts', 'um\n')
    vazio.git('add', '-A')
    vazio.git('update-ref', 'HEAD', vazio.git('commit-tree', vazio.git('write-tree'), '-p', 'HEAD', '-m', 'Escapa do hook\n\nFora do processo:   '))
    const semMotivo = vazio.conferir()
    expect(semMotivo.status).toBe(1)
    expect(semMotivo.saida).toContain('está sem motivo')
  })

  it('a lista de arquivos de código mostra três e reticências', () => {
    const r = repositorio('spec/exemplo')
    r.commit({ 'apps/1.ts': '1\n', 'apps/2.ts': '2\n', 'apps/3.ts': '3\n', 'apps/4.ts': '4\n' }, 'Cria quatro')
    const { saida } = r.conferir()
    expect(saida).toContain('(apps/1.ts, apps/2.ts, apps/3.ts, …)')
    expect(saida).not.toContain('apps/4.ts')
  })

  it('sem a origin/develop (o checkout raso) sai 2, e não 0', () => {
    const r = repositorio('spec/exemplo', { semOrigin: true })
    r.commit({ 'apps/b.ts': 'solto\n' }, 'Conserta sem marca')
    const { status, saida } = r.conferir()
    expect(status).toBe(2)
    expect(saida).toContain('fetch-depth: 0')
  })

  it('limite conhecido: o commit de papel feito com env -u CLAUDE_CODE_AGENT e "Fora do processo: x" sai 0', () => {
    const r = repositorio('spec/exemplo')
    r.git('config', 'core.hooksPath', HOOKS_DO_PROCESSO)
    r.escrever('apps/b.ts', 'escapou\n')
    r.git('add', '-A')
    // A sessão é de papel, mas o commit tira a variável: o git hook sai antes do node e a esteira não sabe quem escreveu a linha.
    // Aqui só se afirma o limite. A prova de que o hook, com a variável presente, recusaria este mesmo commit está na 11.0
    // (`tools/processo/hook-git.int.test.ts`, "mensagem com a linha Fora do processo é recusada").
    execFileSync('env', ['-u', 'CLAUDE_CODE_AGENT', 'git', 'commit', '-q', '-m', 'Escapa do hook\n\nFora do processo: x'], {
      cwd: r.raiz,
      stdio: 'pipe',
      env: ambiente({ CLAUDE_CODE_AGENT: 'implementador' }),
    })
    const { status, saida } = r.conferir()
    expect({ status, saida }).toMatchObject({ status: 0 })
  })
})

describe('a classificação de código da esteira', () => {
  it.each(CODIGO_PARA_A_ESTEIRA)('código para a esteira: %s', (arquivo) => {
    expect(ehCodigoParaAEsteira(arquivo)).toBe(true)
  })

  it.each(DOCUMENTO_PARA_A_ESTEIRA)('documento para a esteira: %s', (arquivo) => {
    expect(ehCodigoParaAEsteira(arquivo)).toBe(false)
  })
})
