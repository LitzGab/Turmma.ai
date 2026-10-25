import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IMAGEM_GITLEAKS } from './etapas-de-guarda.ts'
import { etapasDoSegredo } from './etapas-do-segredo.ts'
import { raizRepositorio } from './executar.ts'

// A ligação do `guarda:segredo` (`tools/ci/segredo.ts`) com a varredura dos arquivos alterados: o que o script manda o
// gitleaks varrer. Sem docker: o que se confere são os argumentos e a pasta que eles apontam. O gitleaks de verdade sobre essa
// pasta é de `tools/guardas/gitleaks.int.test.ts`.

const diretorios: string[] = []

afterEach(() => {
  vi.unstubAllEnvs()
  for (const diretorio of diretorios.splice(0)) rmSync(diretorio, { recursive: true, force: true })
})

function pastaTemporaria(): string {
  const pasta = mkdtempSync(join(tmpdir(), 'educa-etapas-segredo-'))
  diretorios.push(pasta)
  return pasta
}

/** Um clone comum (git init) com o `.gitleaks.toml` do projeto e os arquivos dados, sem nenhum commit: o estado de quem ainda vai commitar. */
function repositorioDeTrabalho(arquivos: Record<string, string>, comConfiguracao = true): string {
  const raiz = pastaTemporaria()
  execFileSync('git', ['init', '--quiet'], { cwd: raiz })
  if (comConfiguracao) copyFileSync(join(raizRepositorio, '.gitleaks.toml'), join(raiz, '.gitleaks.toml'))
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(raiz, caminho)), { recursive: true })
    writeFileSync(join(raiz, caminho), conteudo)
  }
  return raiz
}

const git = (pasta: string, ...argumentos: string[]) => execFileSync('git', argumentos, { cwd: pasta, encoding: 'utf8' }).trim()

describe('etapasDoSegredo: o que o portão local manda o gitleaks varrer', () => {
  it('com a árvore limpa, só o histórico, e nenhuma pasta temporária', () => {
    const raiz = repositorioDeTrabalho({})
    const { etapas, pastaTemporaria: copia } = etapasDoSegredo(raiz, [])
    expect(etapas).toHaveLength(1)
    expect(etapas[0]?.argumentos).toContain(`${raiz}:/repo:ro`)
    expect(copia).toBeNull()
  })

  it('com arquivo alterado, a segunda varredura é do modo git sobre uma pasta que é repositório de um commit só, e não do modo dir', () => {
    const raiz = repositorioDeTrabalho({ 'tasks/prd-x/1_task.md': 'texto\n', 'docs/outro.md': 'outro\n' })
    const { etapas, pastaTemporaria: copia } = etapasDoSegredo(raiz, ['tasks/prd-x/1_task.md', 'arquivo/que/nao/existe.md'])
    if (copia !== null) diretorios.push(copia)
    expect(etapas).toHaveLength(2)
    const argumentos = etapas[1]?.argumentos ?? []
    // O `dir` do gitleaks pula o arquivo cujo caminho casa com uma exceção do `.gitleaks.toml`: a varredura tem de ser a do histórico.
    expect(argumentos[argumentos.indexOf(IMAGEM_GITLEAKS) + 1]).toBe('git')
    expect(argumentos).not.toContain('dir')
    expect(copia).not.toBeNull()
    expect(argumentos).toContain(`${copia}:/repo:ro`)
    // A pasta tem o arquivo alterado e a configuração, e mais nada, num commit só.
    expect(git(copia as string, 'ls-files').split('\n').sort()).toEqual(['.gitleaks.toml', 'tasks/prd-x/1_task.md'])
    expect(git(copia as string, 'rev-list', '--count', 'HEAD')).toBe('1')
  })

  it('se montar o repositório da pasta falhar, a exceção sobe e a pasta temporária com o conteúdo dos arquivos não fica no disco', () => {
    // Sem o `.gitleaks.toml` na raiz, `pastaComoRepositorio` falha depois de a cópia dos arquivos já estar feita.
    const raiz = repositorioDeTrabalho({ 'tasks/prd-x/1_task.md': 'texto\n' }, false)
    const base = pastaTemporaria()
    vi.stubEnv('TMPDIR', base)
    expect(() => etapasDoSegredo(raiz, ['tasks/prd-x/1_task.md'])).toThrow()
    expect(existsSync(base)).toBe(true)
    expect(readdirSync(base)).toEqual([])
  })

  it('fora de um repositório, a exceção do git rev-parse sobe antes de qualquer cópia, e a pasta temporária não chega a existir', () => {
    // Uma pasta comum, sem `git init`, com a configuração e o arquivo alterado. A cópia daria certo (`pastaComoRepositorio` faz o
    // próprio `git init` nela); quem falha é o `rev-parse` sobre a raiz, e ele tem de rodar antes da cópia.
    const raiz = pastaTemporaria()
    copyFileSync(join(raizRepositorio, '.gitleaks.toml'), join(raiz, '.gitleaks.toml'))
    mkdirSync(join(raiz, 'tasks/prd-x'), { recursive: true })
    writeFileSync(join(raiz, 'tasks/prd-x/1_task.md'), 'texto\n')
    // O git não sobe acima da pasta-mãe da raiz: o caso não depende de a pasta temporária da máquina estar dentro de um repositório.
    vi.stubEnv('GIT_CEILING_DIRECTORIES', dirname(raiz))
    const base = pastaTemporaria()
    vi.stubEnv('TMPDIR', base)
    expect(() => etapasDoSegredo(raiz, ['tasks/prd-x/1_task.md'])).toThrow()
    expect(readdirSync(base)).toEqual([])
  })
})
