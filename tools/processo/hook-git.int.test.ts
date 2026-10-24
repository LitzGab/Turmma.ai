// O git hook nativo contra um git de verdade (RF14, `cenarios.md` B). Cada caso monta um repositório temporário com a pasta
// `tools/processo/` desta árvore e o `core.hooksPath` que o `prepare` do `package.json` grava, e roda `git commit` e `git push`
// de verdade, com `CLAUDE_CODE_AGENT` no ambiente do processo. Não sobe o compose: é o projeto `processo` do Vitest.
//
// O que se confere em cada recusa é o motivo que o hook escreve, e não só o código de saída: um commit que falha por outra
// razão (repositório mal montado, `node` fora do caminho sem querer) não pode passar por recusa do hook.
import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { conteudoDoIndice } from './hook-git.ts'
import { gravarCarimbo, registrar } from './revisoes.ts'

const PROCESSO = import.meta.dirname
const RAIZ = join(PROCESSO, '..', '..')
const PAPEL = 'implementador'
const GIT = execFileSync('which', ['git'], { encoding: 'utf8' }).trim()
const DOCUMENTO = 'tasks/prd-exemplo/9_task.md'

const TAREFA = `# Tarefa 9.0 — Exemplo

**Funcionalidade:** exemplo · **Depende de:** 7.0
**Subagentes obrigatórios:** \`infra-guardian\`, \`test-engineer\`

## Critério de conclusão

- [ ] Revisão aprovada
`

const temporarios: string[] = []
afterAll(() => {
  for (const pasta of temporarios) rmSync(pasta, { recursive: true, force: true })
})

const pastaTemporaria = (prefixo: string): string => {
  const pasta = mkdtempSync(join(tmpdir(), prefixo))
  temporarios.push(pasta)
  return pasta
}

/** O ambiente de um processo: sem o `GIT_*` de quem roda o teste e sem a configuração global do git, com o papel que o caso pede. */
function ambiente(papel: string | undefined, extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const herdado = Object.entries(process.env).filter(([nome]) => !nome.startsWith('GIT_') && nome !== 'CLAUDE_CODE_AGENT')
  return {
    ...Object.fromEntries(herdado),
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0',
    ...(papel === undefined ? {} : { CLAUDE_CODE_AGENT: papel }),
    ...extra,
  }
}

/** Uma pasta cujo `PATH` tem o git e nada mais: sem `node`. */
function caminhoSemNode(): string {
  const pasta = pastaTemporaria('sem-node-')
  symlinkSync(GIT, join(pasta, 'git'))
  return pasta
}

const git = (cwd: string, ...argumentos: string[]): string => execFileSync(GIT, argumentos, { cwd, encoding: 'utf8', env: ambiente(undefined), stdio: ['ignore', 'pipe', 'pipe'] }).trim()

const aoMeioDia = (data: string): Date => new Date(`2026-09-13T${data}`)

let escritas = 0

/**
 * O código em `apps/codigo.ts`, com um horário de antes de qualquer rodada (o hook compara a hora do arquivo com a da rodada).
 * O horário anda um segundo a cada escrita: o git só relê o arquivo se o tamanho ou a hora mudou, e `a = 1` e `a = 2` têm o
 * mesmo tamanho, de modo que a hora fixa fazia o `git add` não ver a alteração.
 */
function escreverCodigo(raiz: string, conteudo: string): void {
  writeFileSync(join(raiz, 'apps/codigo.ts'), conteudo)
  const hora = new Date(aoMeioDia('09:00:00').getTime() + ++escritas * 1000)
  utimesSync(join(raiz, 'apps/codigo.ts'), hora, hora)
}

/**
 * Um repositório com a `tools/processo/` desta árvore (sem os testes), o `core.hooksPath` gravado pelo comando que o `prepare`
 * do `package.json` tem, e um commit inicial que o hook ainda não vê (nasce antes do `prepare`). O que se copia é versionado no
 * commit inicial: o worktree que o git cria depois também o tem, como o checkout de uma linha.
 */
function repositorio(): string {
  const raiz = pastaTemporaria('hook-git-')
  git(raiz, 'init', '-q', '-b', 'main')
  git(raiz, 'config', 'user.name', 'Teste')
  git(raiz, 'config', 'user.email', 'teste@exemplo.invalid')
  git(raiz, 'config', 'commit.gpgsign', 'false')
  cpSync(PROCESSO, join(raiz, 'tools/processo'), {
    recursive: true,
    filter: (origem) => !/(^|\/)(harness|__fixtures__)(\/|$)|\.test\.tsx?$/.test(relative(PROCESSO, origem)),
  })
  for (const pasta of ['tasks/prd-exemplo', 'apps', 'docs']) mkdirSync(join(raiz, pasta), { recursive: true })
  writeFileSync(join(raiz, DOCUMENTO), TAREFA)
  writeFileSync(join(raiz, '.gitignore'), '.processo/\n')
  writeFileSync(join(raiz, 'docs/nota.md'), 'uma nota\n')
  writeFileSync(join(raiz, 'skills-lock.json'), '{}\n')
  escreverCodigo(raiz, 'export const a = 1\n')
  git(raiz, 'add', '-A')
  git(raiz, 'commit', '-q', '-m', 'Estado inicial')
  const { scripts } = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
  execFileSync('sh', ['-c', scripts['prepare'] ?? 'false'], { cwd: raiz, env: ambiente(undefined) })
  return raiz
}

interface Saida {
  status: number | null
  stderr: string
  /** O commit foi criado: o HEAD do repositório observado andou. */
  criou: boolean
}

interface Opcoes {
  papel?: string | undefined
  cwd?: string
  /** O repositório cujo HEAD diz se o commit saiu; o padrão é o do `cwd`. */
  observar?: string
  path?: string
}

const SEM_PAPEL = { papel: undefined }

/** Roda o comando e diz se ele passou e se criou commit. `papel` ausente das opções é o papel `implementador`; `undefined` explícito é sem papel. */
function rodar(raiz: string, comando: string, argumentos: string[], opcoes: Opcoes = {}): Saida {
  const papel = 'papel' in opcoes ? opcoes.papel : PAPEL
  const observado = opcoes.observar ?? opcoes.cwd ?? raiz
  const antes = git(observado, 'rev-parse', 'HEAD')
  const resultado = spawnSync(comando, argumentos, {
    cwd: opcoes.cwd ?? raiz,
    encoding: 'utf8',
    env: ambiente(papel, opcoes.path === undefined ? {} : { PATH: opcoes.path }),
  })
  return { status: resultado.status, stderr: resultado.stderr, criou: git(observado, 'rev-parse', 'HEAD') !== antes }
}

const commitar = (raiz: string, mensagem: string, opcoes: Opcoes = {}): Saida => rodar(raiz, GIT, ['commit', '-q', '-m', mensagem], opcoes)

/** Código novo no índice, sem marca na mensagem: o que o hook recusa em sessão de papel. */
function prepararCodigo(raiz: string, conteudo = 'export const a = 2\n'): void {
  escreverCodigo(raiz, conteudo)
  git(raiz, 'add', 'apps/codigo.ts')
}

function prepararDocumento(raiz: string): void {
  writeFileSync(join(raiz, 'docs/nota.md'), `${readFileSync(join(raiz, 'docs/nota.md'), 'utf8')}mais uma linha\n`)
  git(raiz, 'add', 'docs/nota.md')
}

const REVISORES_DA_TAREFA = ['infra-guardian', 'tenancy-guardian', 'privacy-guardian', 'conformidade-reviewer', 'test-engineer', 'revisor-geral']
const SUITES = ['typecheck', 'lint', 'segredo', 'dependencias', 'test']
const pastaDosTranscripts = pastaTemporaria('transcripts-')

/** A rodada de um revisor, registrada pelo mesmo `registrar` que o `SubagentStop` chama, às 10:05. */
function registrarRodada(raiz: string, revisor: string, veredito = 'APROVADO'): void {
  const transcript = join(pastaDosTranscripts, `${revisor}-${Math.random().toString(36).slice(2)}.jsonl`)
  const prompt = `Audite a tarefa.\nTarefa: ${DOCUMENTO}`
  writeFileSync(transcript, JSON.stringify({ type: 'user', timestamp: aoMeioDia('10:00:00').toISOString(), message: { content: prompt } }))
  const final = veredito === 'APROVADO' ? 'VEREDITO: APROVADO' : `VEREDITO: ${veredito}\nBloqueantes:\n- apps/codigo.ts:1 sem escopo`
  registrar({ agent_type: revisor, agent_id: `a-${revisor}`, agent_transcript_path: transcript, last_assistant_message: final }, raiz, aoMeioDia('10:05:00'))
}

const carimbar = (raiz: string): void => gravarCarimbo(raiz, { inicio: aoMeioDia('10:06:00').toISOString(), suites: SUITES })

/** Tudo o que o commit de tarefa exige: as rodadas aprovadas, o carimbo, e o documento com as rodadas no índice. */
function prepararTarefaAprovada(raiz: string): void {
  for (const revisor of REVISORES_DA_TAREFA) registrarRodada(raiz, revisor)
  carimbar(raiz)
  git(raiz, 'add', 'tasks')
}

const COM_MARCA = ['commit', '-q', '-m', 'Implementa x (tarefa 9.0)', '-m', 'Revisões: infra-guardian APROVADO (1ª rodada)']

describe('RF14: o commit de papel, por qualquer caminho, contra um git de verdade', () => {
  it('git pelo caminho absoluto com código e sem marca é recusado pelo commit-msg', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    // O caminho que o `which` achou, e não `/usr/bin/git`: onde o git mora muda de máquina, e o que se prova é o caminho absoluto,
    // que não passa pelo PATH nem por nenhum alias do `git` que um papel pudesse esquivar.
    expect(GIT.startsWith('/')).toBe(true)
    const saida = rodar(raiz, GIT, ['commit', '-q', '-m', 'Ajusta x'])
    expect(saida.criou).toBe(false)
    expect(saida.status).not.toBe(0)
    expect(saida.stderr).toMatch(/Commit bloqueado: ele leva código \(apps\/codigo\.ts\) sem "\(tarefa N\.0\)"/)
  })

  it('o arquivo de tools/ sem marca é recusado pelo commit-msg do papel (RF16), e passa sem papel', () => {
    const raiz = repositorio()
    mkdirSync(join(raiz, 'tools'), { recursive: true })
    writeFileSync(join(raiz, 'tools/outro.ts'), 'export const a = 1\n')
    git(raiz, 'add', 'tools/outro.ts')
    const recusado = rodar(raiz, GIT, ['commit', '-q', '-m', 'Ajusta x'])
    expect(recusado.criou).toBe(false)
    expect(recusado.stderr).toMatch(/Commit bloqueado: ele leva código \(tools\/outro\.ts\) sem "\(tarefa N\.0\)"/)
    const livre = rodar(raiz, GIT, ['commit', '-q', '-m', 'Ajusta x'], SEM_PAPEL)
    expect(livre.stderr).toBe('')
    expect(livre.criou).toBe(true)
  })

  it.each([
    ['env git commit', 'env', (git: string) => [git, 'commit', '-q', '-m', 'Ajusta x']],
    ['command git commit', 'sh', (git: string) => ['-c', `command ${git} commit -q -m "Ajusta x"`]],
    ['sh -c "git commit …"', 'sh', (git: string) => ['-c', `${git} commit -q -m "Ajusta x"`]],
  ])('%s com código e sem marca é recusado', (_forma, comando, argumentos) => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    const saida = rodar(raiz, comando, argumentos(GIT))
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/Commit bloqueado: ele leva código/)
  })

  it('o script .sh que commita é recusado', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    const script = join(pastaTemporaria('script-'), 'commitar.sh')
    writeFileSync(script, `#!/bin/sh\n${GIT} commit -q -m "Ajusta x"\n`)
    const saida = rodar(raiz, 'sh', [script])
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/Commit bloqueado: ele leva código/)
  })

  it('git -C <outro checkout> commit é recusado: o hook é do repositório, e não da pasta de onde o comando roda', () => {
    const daqui = repositorio()
    const outro = repositorio()
    prepararCodigo(outro)
    const saida = rodar(daqui, GIT, ['-C', outro, 'commit', '-q', '-m', 'Ajusta x'], { observar: outro })
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/Commit bloqueado: ele leva código/)
  })

  it('git worktree add e commit no worktree novo são recusados: o core.hooksPath é do repositório', () => {
    const raiz = repositorio()
    const worktree = join(pastaTemporaria('worktree-'), 'outra-linha')
    git(raiz, 'worktree', 'add', '-q', '-b', 'outra', worktree)
    prepararCodigo(worktree)
    const saida = commitar(worktree, 'Ajusta x')
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/Commit bloqueado: ele leva código/)
  })

  it('o documento ruim no índice e bom no disco é recusado: vale o índice', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    for (const revisor of REVISORES_DA_TAREFA.filter((nome) => nome !== 'revisor-geral')) registrarRodada(raiz, revisor)
    git(raiz, 'add', 'tasks')
    // A rodada que falta chega depois do `git add`: o disco tem as três, e o índice, que é o que vai para o commit, duas.
    registrarRodada(raiz, 'revisor-geral')
    carimbar(raiz)
    expect(readFileSync(join(raiz, DOCUMENTO), 'utf8')).toMatch(/revisor-geral/)
    const saida = rodar(raiz, GIT, COM_MARCA)
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/revisor-geral: nenhuma rodada registrada/)
  })

  it('o guardião que o caminho pede e ninguém marcou é cobrado pelo git hook (RF15): sem a rodada, recusa; com ela, passa', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    // O documento marca `infra-guardian` e `test-engineer`: o `tenancy-guardian` só é pedido porque `apps/codigo.ts` é código.
    for (const revisor of REVISORES_DA_TAREFA.filter((nome) => nome !== 'tenancy-guardian')) registrarRodada(raiz, revisor)
    carimbar(raiz)
    git(raiz, 'add', 'tasks')
    const sem = rodar(raiz, GIT, COM_MARCA)
    expect(sem.criou).toBe(false)
    expect(sem.stderr).toMatch(/tenancy-guardian: nenhuma rodada registrada/)
    expect(sem.stderr).not.toMatch(/privacy-guardian: nenhuma|conformidade-reviewer: nenhuma|infra-guardian: nenhuma/)

    registrarRodada(raiz, 'tenancy-guardian')
    git(raiz, 'add', 'tasks')
    const com = rodar(raiz, GIT, COM_MARCA)
    expect(com.stderr).toBe('')
    expect(com.criou).toBe(true)
  })

  it('o arquivo movido do padrão para uma exceção ainda pede os quatro: o caminho de origem conta (RF15)', () => {
    const raiz = repositorio()
    mkdirSync(join(raiz, 'apps/web'), { recursive: true })
    // `apps/codigo.ts` (os quatro) vira `apps/web/vite.config.ts` (só I, e fora de `apps/*/src`, que o RF17 cobra): só o caminho de origem pede os outros três.
    git(raiz, 'mv', 'apps/codigo.ts', 'apps/web/vite.config.ts')
    for (const revisor of REVISORES_DA_TAREFA.filter((nome) => nome !== 'tenancy-guardian')) registrarRodada(raiz, revisor)
    carimbar(raiz)
    git(raiz, 'add', 'tasks')
    const sem = rodar(raiz, GIT, COM_MARCA)
    expect(sem.criou).toBe(false)
    expect(sem.stderr).toMatch(/tenancy-guardian: nenhuma rodada registrada/)

    registrarRodada(raiz, 'tenancy-guardian')
    git(raiz, 'add', 'tasks')
    const com = rodar(raiz, GIT, COM_MARCA)
    expect(com.stderr).toBe('')
    expect(com.criou).toBe(true)
  })

  it('o conteúdo do índice e o do HEAD vêm de onde o nome diz', () => {
    const raiz = repositorio()
    escreverCodigo(raiz, '// regra 20\n')
    git(raiz, 'add', 'apps/codigo.ts')
    git(raiz, 'commit', '-q', '-m', 'base')
    escreverCodigo(raiz, 'export const a = 3\n')
    git(raiz, 'add', 'apps/codigo.ts')
    escreverCodigo(raiz, 'export const a = 4\n')
    const leitura = conteudoDoIndice(raiz)
    expect(leitura('apps/codigo.ts', 'head')).toBe('// regra 20\n')
    expect(leitura('apps/codigo.ts', 'indice')).toBe('export const a = 3\n')
    expect(leitura('apps/novo.ts', 'head')).toBeNull()
    expect(leitura('apps/novo.ts', 'indice')).toBeNull()
    // Arquivo maior que o padrão do Node (1 MB) é lido inteiro do índice.
    const grande = 'x'.repeat(2_000_000)
    writeFileSync(join(raiz, 'apps/grande.txt'), grande)
    git(raiz, 'add', 'apps/grande.txt')
    expect(leitura('apps/grande.txt', 'indice')).toBe(grande)
  })

  it('o documento bom no índice e ruim no disco passa: vale o índice', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    prepararTarefaAprovada(raiz)
    // Depois do `git add`, uma rodada que reprova chega ao disco; o índice, que é o que vai para o commit, continua aprovado.
    registrarRodada(raiz, 'infra-guardian', 'REPROVADO')
    expect(readFileSync(join(raiz, DOCUMENTO), 'utf8')).toMatch(/REPROVADO/)
    const saida = rodar(raiz, GIT, COM_MARCA)
    expect(saida.stderr).toBe('')
    expect(saida.criou).toBe(true)
  })

  it('mensagem com a linha Fora do processo: é recusada, mesmo num commit que passaria', () => {
    const raiz = repositorio()
    prepararDocumento(raiz)
    const saida = commitar(raiz, 'Ajusta a nota\n\nFora do processo: ajuste do Joaquim')
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/a mensagem traz "Fora do processo:"/)
  })

  it('o papel intruso no CLAUDE_CODE_AGENT é recusado, mesmo num commit que passaria', () => {
    const raiz = repositorio()
    prepararDocumento(raiz)
    const saida = commitar(raiz, 'Ajusta a nota', { papel: 'intruso' })
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/`CLAUDE_CODE_AGENT` é `intruso`, e papel do time é um destes: arquiteto, implementador, mesa-de-revisao, validador/)
  })

  it('o PATH sem node recusa o commit de papel: o hook fecha na falha', () => {
    const raiz = repositorio()
    prepararDocumento(raiz)
    const saida = commitar(raiz, 'Ajusta a nota', { path: caminhoSemNode() })
    expect(saida.criou).toBe(false)
    expect(saida.status).not.toBe(0)
    expect(saida.stderr).toMatch(/node/)
  })

  it('o commit de papel é recusado quando o hook-git.ts não existe', () => {
    const raiz = repositorio()
    unlinkSync(join(raiz, 'tools/processo/hook-git.ts'))
    prepararDocumento(raiz)
    const saida = commitar(raiz, 'Ajusta a nota')
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/hook-git\.ts/)
  })

  it.each(['tasks/prd-exemplo/notas.md', 'docs/nota.md', 'skills-lock.json'])('o commit só de documento (%s) passa em sessão de papel', (arquivo) => {
    const raiz = repositorio()
    writeFileSync(join(raiz, arquivo), `${arquivo} mudou\n`)
    git(raiz, 'add', arquivo)
    const saida = commitar(raiz, 'Ajusta um documento')
    expect(saida.stderr).toBe('')
    expect(saida.criou).toBe(true)
  })

  it('o commit com (tarefa N.0), as revisões válidas e o carimbo passa', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    prepararTarefaAprovada(raiz)
    const saida = rodar(raiz, GIT, COM_MARCA)
    expect(saida.stderr).toBe('')
    expect(saida.criou).toBe(true)
  })

  it('mover o código para um documento é recusado: o rename conta o arquivo que sai', () => {
    const raiz = repositorio()
    git(raiz, 'mv', 'apps/codigo.ts', 'docs/codigo.md')
    const saida = commitar(raiz, 'Move o arquivo')
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/Commit bloqueado: ele leva código \(apps\/codigo\.ts\)/)
  })

  it('o código com acento e espaço no nome é recusado pelo nome inteiro', () => {
    const raiz = repositorio()
    writeFileSync(join(raiz, 'apps/código novo.ts'), 'export const c = 1\n')
    git(raiz, 'add', 'apps')
    const saida = commitar(raiz, 'Ajusta x')
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/Commit bloqueado: ele leva código \(apps\/código novo\.ts\)/)
  })

  it('a marca com o documento fora do índice é recusada: não há revisão a conferir', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    prepararTarefaAprovada(raiz)
    git(raiz, 'rm', '-q', '--cached', DOCUMENTO)
    const saida = rodar(raiz, GIT, COM_MARCA)
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(new RegExp(`Commit bloqueado: não achei ${DOCUMENTO} para conferir as revisões`))
  })

  describe('a conferência das mutações (RF17)', () => {
    const producao = (raiz: string): void => {
      mkdirSync(join(raiz, 'apps/api/src'), { recursive: true })
      writeFileSync(join(raiz, 'apps/api/src/pedidos.ts'), 'export const p = 1\n')
      utimesSync(join(raiz, 'apps/api/src/pedidos.ts'), aoMeioDia('09:00:00'), aoMeioDia('09:00:00'))
      git(raiz, 'add', 'apps/api')
    }

    it('produção sem bloco de mutação nem a linha "Sem mutação" é recusada, com as rodadas e o carimbo em ordem', () => {
      const raiz = repositorio()
      producao(raiz)
      prepararTarefaAprovada(raiz)
      const saida = rodar(raiz, GIT, COM_MARCA)
      expect(saida.criou).toBe(false)
      expect(saida.stderr).toMatch(/portão local: a árvore altera código de produto \(apps\/api\/src\/pedidos\.ts\)/)
    })

    it('com a linha "Sem mutação" e o carimbo do portão deste documento, passa', () => {
      const raiz = repositorio()
      producao(raiz)
      writeFileSync(join(raiz, DOCUMENTO), `${TAREFA}\n**Sem mutação:** só o valor de uma constante\n`)
      git(raiz, 'add', DOCUMENTO)
      for (const revisor of REVISORES_DA_TAREFA) registrarRodada(raiz, revisor)
      gravarCarimbo(raiz, { inicio: aoMeioDia('10:06:00').toISOString(), suites: SUITES, documento: DOCUMENTO })
      git(raiz, 'add', 'tasks')
      const saida = rodar(raiz, GIT, COM_MARCA)
      expect(saida.stderr).toBe('')
      expect(saida.criou).toBe(true)
    })
  })

  it('o commit com a marca mas sem o carimbo do portão é recusado', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    for (const revisor of REVISORES_DA_TAREFA) registrarRodada(raiz, revisor)
    git(raiz, 'add', 'tasks')
    const saida = rodar(raiz, GIT, COM_MARCA)
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/portão local: nunca passou nesta árvore/)
  })
})

describe('RF14: o merge de papel', () => {
  /** Duas linhas que alteram a mesma linha de `apps/codigo.ts`: o merge para em conflito, e o `git commit` o conclui. */
  function mergeComConflito(): string {
    const raiz = repositorio()
    git(raiz, 'checkout', '-q', '-b', 'outra')
    escreverCodigo(raiz, 'export const a = 2\n')
    git(raiz, 'commit', '-q', '-am', 'Outra linha')
    git(raiz, 'checkout', '-q', 'main')
    escreverCodigo(raiz, 'export const a = 3\n')
    git(raiz, 'commit', '-q', '-am', 'Esta linha')
    const merge = spawnSync(GIT, ['merge', 'outra'], { cwd: raiz, encoding: 'utf8', env: ambiente(PAPEL) })
    expect(merge.status).not.toBe(0)
    return raiz
  }

  it('o conflito resolvido por papel, sem marca, é recusado', () => {
    const raiz = mergeComConflito()
    prepararCodigo(raiz, 'export const a = 4\n')
    const saida = commitar(raiz, 'Resolve o encontro')
    expect(saida.criou).toBe(false)
    expect(saida.stderr).toMatch(/Commit bloqueado: ele leva código \(apps\/codigo\.ts\)/)
  })

  it('o conflito resolvido por papel, com marca, revisões e carimbo, passa e fecha o merge', () => {
    const raiz = mergeComConflito()
    prepararCodigo(raiz, 'export const a = 4\n')
    prepararTarefaAprovada(raiz)
    const saida = rodar(raiz, GIT, ['commit', '-q', '-m', 'Resolve o encontro (tarefa 9.0)', '-m', 'Revisões: infra-guardian APROVADO (1ª rodada)'])
    expect(saida.stderr).toBe('')
    expect(saida.criou).toBe(true)
    expect(git(raiz, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ')).toHaveLength(3)
  })

  it('o merge limpo de outra linha, sem marca, passa: o que veio do outro lado sem mudar já foi revisado lá', () => {
    const raiz = repositorio()
    git(raiz, 'checkout', '-q', '-b', 'outra')
    writeFileSync(join(raiz, 'apps/outro.ts'), 'export const b = 1\n')
    git(raiz, 'add', 'apps/outro.ts')
    git(raiz, 'commit', '-q', '-m', 'Outra linha')
    git(raiz, 'checkout', '-q', 'main')
    prepararDocumento(raiz)
    git(raiz, 'commit', '-q', '-m', 'Esta linha')
    const antes = git(raiz, 'rev-parse', 'HEAD')
    const merge = spawnSync(GIT, ['merge', '--no-edit', 'outra'], { cwd: raiz, encoding: 'utf8', env: ambiente(PAPEL) })
    expect(merge.stderr).toBe('')
    expect(git(raiz, 'rev-parse', 'HEAD')).not.toBe(antes)
    expect(git(raiz, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ')).toHaveLength(3)
  })
})

describe('RF14: o push de papel', () => {
  /** Um remoto vazio, com a `main` já enviada pelo Joaquim (sem papel), e um commit a mais na árvore para haver o que enviar. */
  function comRemoto(): { raiz: string; remoto: string } {
    const raiz = repositorio()
    const remoto = pastaTemporaria('remoto-')
    git(remoto, 'init', '-q', '--bare', '-b', 'main')
    git(raiz, 'remote', 'add', 'origin', remoto)
    git(raiz, 'push', '-q', 'origin', 'main')
    prepararDocumento(raiz)
    git(raiz, 'commit', '-q', '-m', 'Mais um commit')
    return { raiz, remoto }
  }
  const existeNoRemoto = (remoto: string, branch: string): boolean => spawnSync(GIT, ['rev-parse', '--verify', '-q', `refs/heads/${branch}`], { cwd: remoto }).status === 0
  const empurrar = (raiz: string, argumentos: string[], opcoes: Opcoes = {}): Saida => rodar(raiz, GIT, ['push', '-q', 'origin', ...argumentos], opcoes)

  it.each([['HEAD:develop', 'develop'], ['HEAD:refs/heads/release', 'release'], ['HEAD:main', 'main']])('git push origin %s é recusado pelo pre-push', (destino, branch) => {
    const { raiz, remoto } = comRemoto()
    const mainAntes = git(remoto, 'rev-parse', 'main')
    const saida = empurrar(raiz, [destino])
    expect(saida.status).not.toBe(0)
    expect(saida.stderr).toMatch(new RegExp(`Push bloqueado: este push alcança \`${branch}\``))
    // Nada chegou ao remoto: a `main` continua onde estava, e a `develop` e a `release` não nasceram.
    expect(git(remoto, 'rev-parse', 'main')).toBe(mainAntes)
    expect(existeNoRemoto(remoto, branch)).toBe(branch === 'main')
  })

  it('git push com dois destinos protegidos diz os dois, na ordem das branches protegidas', () => {
    const { raiz } = comRemoto()
    expect(empurrar(raiz, ['HEAD:release', 'HEAD:develop']).stderr).toMatch(/Push bloqueado: este push alcança `develop`, `release`, e as branches/)
  })

  it('git push origin :main, que apaga a branch, é recusado: o destino é a ref remota, e a local é "(delete)"', () => {
    const { raiz, remoto } = comRemoto()
    const saida = empurrar(raiz, [':main'])
    expect(saida.stderr).toMatch(/Push bloqueado: este push alcança `main`/)
    expect(existeNoRemoto(remoto, 'main')).toBe(true)
  })

  it('git push --all, que leva a main, é recusado', () => {
    const { raiz } = comRemoto()
    expect(empurrar(raiz, ['--all']).stderr).toMatch(/Push bloqueado: este push alcança `main`/)
  })

  it('git push da branch do andar (spec/x) passa', () => {
    const { raiz, remoto } = comRemoto()
    const saida = empurrar(raiz, ['HEAD:spec/x'])
    expect(saida.stderr).toBe('')
    expect(existeNoRemoto(remoto, 'spec/x')).toBe(true)
  })

  it('o push com papel intruso é recusado, mesmo para a branch do andar', () => {
    const { raiz, remoto } = comRemoto()
    const saida = empurrar(raiz, ['HEAD:spec/x'], { papel: 'intruso' })
    expect(saida.stderr).toMatch(/Push bloqueado: `CLAUDE_CODE_AGENT` é `intruso`/)
    expect(existeNoRemoto(remoto, 'spec/x')).toBe(false)
  })

  it('o push de papel com o PATH sem node é recusado', () => {
    const { raiz, remoto } = comRemoto()
    const saida = empurrar(raiz, ['HEAD:spec/x'], { path: caminhoSemNode() })
    expect(saida.status).not.toBe(0)
    expect(saida.stderr).toMatch(/node/)
    expect(existeNoRemoto(remoto, 'spec/x')).toBe(false)
  })
})

describe('RF14: fora de sessão de papel, e o que a máquina não alcança', () => {
  it('sem papel passa: código sem marca', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    const saida = commitar(raiz, 'Ajusta x', SEM_PAPEL)
    expect(saida.stderr).toBe('')
    expect(saida.criou).toBe(true)
  })

  it('sem papel passa: o PATH sem node, porque o script sai antes dele', () => {
    const raiz = repositorio()
    prepararDocumento(raiz)
    const saida = commitar(raiz, 'Ajusta a nota', { ...SEM_PAPEL, path: caminhoSemNode() })
    expect(saida.stderr).toBe('')
    expect(saida.criou).toBe(true)
  })

  it('sem papel passa: o merge do encontro', () => {
    const raiz = repositorio()
    git(raiz, 'checkout', '-q', '-b', 'outra')
    escreverCodigo(raiz, 'export const a = 2\n')
    git(raiz, 'commit', '-q', '-am', 'Outra linha')
    git(raiz, 'checkout', '-q', 'main')
    escreverCodigo(raiz, 'export const a = 3\n')
    git(raiz, 'commit', '-q', '-am', 'Esta linha')
    spawnSync(GIT, ['merge', 'outra'], { cwd: raiz, env: ambiente(undefined) })
    prepararCodigo(raiz, 'export const a = 4\n')
    const saida = commitar(raiz, 'Resolve o encontro', SEM_PAPEL)
    expect(saida.stderr).toBe('')
    expect(saida.criou).toBe(true)
  })

  it('sem papel passa: git push origin HEAD:develop, também com o PATH sem node', () => {
    const raiz = repositorio()
    const remoto = pastaTemporaria('remoto-')
    git(remoto, 'init', '-q', '--bare', '-b', 'main')
    git(raiz, 'remote', 'add', 'origin', remoto)
    const saida = rodar(raiz, GIT, ['push', '-q', 'origin', 'HEAD:develop'], { ...SEM_PAPEL, path: caminhoSemNode() })
    expect(saida.stderr).toBe('')
    expect(git(remoto, 'rev-parse', 'develop')).toBe(git(raiz, 'rev-parse', 'HEAD'))
  })

  it('env -u CLAUDE_CODE_AGENT git commit passa no hook, e a terceira camada acusa (limite declarado)', () => {
    const raiz = repositorio()
    prepararCodigo(raiz)
    const saida = rodar(raiz, 'env', ['-u', 'CLAUDE_CODE_AGENT', GIT, 'commit', '-q', '-m', 'Ajusta x'])
    expect(saida.stderr).toBe('')
    expect(saida.criou).toBe(true)
  })

  it('commit-tree e rebase passam no hook: o git não roda o commit-msg neles (limite declarado)', () => {
    const raiz = repositorio()
    const arvore = git(raiz, 'rev-parse', 'HEAD^{tree}')
    const commitTree = rodar(raiz, GIT, ['commit-tree', arvore, '-p', 'HEAD', '-m', 'Ajusta x'])
    expect(commitTree.status).toBe(0)
    git(raiz, 'checkout', '-q', '-b', 'outra')
    prepararCodigo(raiz)
    git(raiz, 'commit', '-q', '-m', 'Código sem marca')
    git(raiz, 'checkout', '-q', 'main')
    prepararDocumento(raiz)
    git(raiz, 'commit', '-q', '-m', 'Documento')
    git(raiz, 'checkout', '-q', 'outra')
    const rebase = rodar(raiz, GIT, ['rebase', 'main'])
    expect(rebase.status).toBe(0)
    expect(rebase.criou).toBe(true)
    expect(git(raiz, 'log', '-1', '--format=%s')).toBe('Código sem marca')
  })
})

describe('o hook-git.ts chamado direto', () => {
  const hook = (raiz: string, argumentos: string[], papel: string | undefined) =>
    spawnSync('node', [join(raiz, 'tools/processo/hook-git.ts'), ...argumentos], { cwd: raiz, encoding: 'utf8', env: ambiente(papel), input: '' })

  it('sem papel não julga nada, mesmo com o modo errado', () => {
    const raiz = repositorio()
    expect(hook(raiz, ['modo-que-nao-existe'], undefined).status).toBe(0)
  })

  it('papel vazio não julga nada: a variável existe, mas não é de sessão de papel', () => {
    const raiz = repositorio()
    expect(hook(raiz, ['modo-que-nao-existe'], '').status).toBe(0)
  })

  it('o modo desconhecido, e o commit-msg sem o arquivo da mensagem, são recusados', () => {
    const raiz = repositorio()
    const mensagem = join(raiz, 'mensagem.txt')
    writeFileSync(mensagem, 'Ajusta a nota\n')
    // Com um arquivo de mensagem no lugar certo, o modo errado continua errado: quem decide é o modo, e não a presença do arquivo.
    expect(hook(raiz, ['outro-modo', mensagem], PAPEL).stderr).toMatch(/Git hook bloqueado: uso desconhecido \(outro-modo .*mensagem\.txt\)/)
    expect(hook(raiz, ['modo-que-nao-existe'], PAPEL).stderr).toMatch(/Git hook bloqueado: uso desconhecido \(modo-que-nao-existe\)/)
    expect(hook(raiz, ['commit-msg'], PAPEL).stderr).toMatch(/Git hook bloqueado: uso desconhecido \(commit-msg\)/)
  })

  it.each(['portao.ts', 'comando-git.ts', 'mutacoes.ts'])('o módulo %s que não carrega recusa o commit de papel: quem fecha é a saída 1 do node', (modulo) => {
    // Um merge pela metade pode deixar um módulo quebrado: o `import` estático falha antes de o `catch` do hook existir.
    const raiz = repositorio()
    unlinkSync(join(raiz, 'tools/processo', modulo))
    prepararDocumento(raiz)
    const saida = commitar(raiz, 'Ajusta a nota')
    expect(saida.criou).toBe(false)
    expect(saida.status).not.toBe(0)
    expect(saida.stderr).toMatch(new RegExp(`${modulo.replace('.', '\\.')}|ERR_MODULE_NOT_FOUND`))
  })

  it('o erro de carga recusa: a mensagem que não existe derruba o julgamento, e o hook diz que falhou', () => {
    const raiz = repositorio()
    const saida = hook(raiz, ['commit-msg', join(raiz, 'nao-existe.txt')], PAPEL)
    expect(saida.status).toBe(1)
    expect(saida.stderr).toMatch(/Git hook bloqueado: ele falhou ao carregar ou ao julgar/)
  })
})
