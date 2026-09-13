import { spawnSync } from 'node:child_process'
import { randomInt } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { argumentosGitleaks } from '../ci/etapas-de-guarda.ts'
import { raizRepositorio } from '../ci/executar.ts'

// O gitleaks de verdade, na mesma imagem e com os mesmos argumentos da esteira, sobre um
// repositório temporário com o `.gitleaks.toml` do projeto. Prova que o segredo falso reprova
// onde quer que seja commitado, inclusive nos arquivos que têm uma linha na allowlist.

// Sem vogal: nenhuma sequência aleatória forma uma das palavras que o gitleaks descarta como falso positivo.
const CARACTERES = 'BCDFGHJKLMNPQRSTVWXZbcdfghjklmnpqrstvwxz0123456789'
const CAMINHO_DA_FIXTURE = 'tools/guardas/__fixtures__/segredo-falso.ts'

const diretorios: string[] = []

afterEach(() => {
  for (const diretorio of diretorios.splice(0)) rmSync(diretorio, { recursive: true, force: true })
})

function aleatorio(tamanho: number): string {
  return Array.from({ length: tamanho }, () => CARACTERES[randomInt(CARACTERES.length)]).join('')
}

/** Token no formato de um PAT do GitHub, aleatório a cada execução e nunca gravado no repositório. */
function tokenFalso(): string {
  return `ghp_${aleatorio(36)}`
}

function git(repositorio: string, ...argumentos: string[]): void {
  const resultado = spawnSync(
    'git',
    ['-c', 'user.name=Guardas', '-c', 'user.email=guardas@exemplo.test', '-c', 'commit.gpgsign=false', ...argumentos],
    { cwd: repositorio, encoding: 'utf8' },
  )
  expect(resultado.status, resultado.stderr).toBe(0)
}

/**
 * Repositório temporário com o `.gitleaks.toml` do projeto e um commit por item de `commits`,
 * cada um gravando os arquivos dados (conteúdo `null` apaga o arquivo).
 */
function repositorioCom(...commits: Record<string, string | null>[]): string {
  const repositorio = mkdtempSync(join(tmpdir(), 'educa-gitleaks-'))
  diretorios.push(repositorio)
  git(repositorio, 'init', '--quiet')
  copyFileSync(join(raizRepositorio, '.gitleaks.toml'), join(repositorio, '.gitleaks.toml'))
  commits.forEach((arquivos, indice) => {
    for (const [caminho, conteudo] of Object.entries(arquivos)) {
      if (conteudo === null) {
        rmSync(join(repositorio, caminho))
        continue
      }
      mkdirSync(dirname(join(repositorio, caminho)), { recursive: true })
      writeFileSync(join(repositorio, caminho), conteudo)
    }
    git(repositorio, 'add', '--all')
    git(repositorio, 'commit', '--quiet', '--message', `fixture ${indice + 1}`)
  })
  return repositorio
}

interface Varredura {
  codigo: number | null
  saida: string
}

function varrer(repositorio: string): Varredura {
  const resultado = spawnSync('docker', [...argumentosGitleaks(repositorio), '--verbose'], { encoding: 'utf8' })
  return { codigo: resultado.status, saida: `${resultado.stdout}${resultado.stderr}` }
}

describe('gitleaks com o .gitleaks.toml do projeto', () => {
  it('reprova a fixture de segredo falso, sem mostrar o segredo no log', () => {
    const token = tokenFalso()
    const conteudo = readFileSync(join(raizRepositorio, CAMINHO_DA_FIXTURE), 'utf8').replace('__SEGREDO_FALSO__', token)
    const { codigo, saida } = varrer(repositorioCom({ [CAMINHO_DA_FIXTURE]: conteudo }))
    expect(codigo).toBe(1)
    expect(saida).toMatch(/RuleID:\s+github-pat/)
    expect(saida).toContain(`File:        ${CAMINHO_DA_FIXTURE}`)
    expect(saida).not.toContain(token)
  })

  it('reprova o segredo nos arquivos que têm linha na allowlist: a exceção é da linha, não do arquivo', () => {
    const caminhos = ['tasks/prd-fundacao-tecnica/techspec.md', '.claude/skills/playwright-best-practices/advanced/authentication-flows.md']
    const arquivos = Object.fromEntries(caminhos.map((caminho) => [caminho, `token de exemplo: ${tokenFalso()}\n`]))
    const { codigo, saida } = varrer(repositorioCom(arquivos))
    expect(codigo).toBe(1)
    for (const caminho of caminhos) expect(saida).toContain(`File:        ${caminho}`)
  })

  it('reprova o segredo que foi commitado e apagado no commit seguinte: a varredura é do histórico', () => {
    const caminho = 'apps/api/src/config.ts'
    const repositorio = repositorioCom({ [caminho]: `export const token = '${tokenFalso()}'\n` }, { [caminho]: null })
    const { codigo, saida } = varrer(repositorio)
    expect(codigo).toBe(1)
    expect(saida).toContain(`File:        ${caminho}`)
  })

  it('reprova chave genérica de alta entropia: a allowlist não desliga a regra generic-api-key inteira', () => {
    const chave = aleatorio(40)
    const { codigo, saida } = varrer(repositorioCom({ 'apps/api/src/cliente.ts': `const apiKey = '${chave}'\n` }))
    expect(codigo).toBe(1)
    expect(saida).toMatch(/RuleID:\s+generic-api-key/)
    expect(saida).not.toContain(chave)
  })

  it('deixa passar um repositório sem segredo, para a falha acima ser do segredo e não da execução', () => {
    const conteudo = readFileSync(join(raizRepositorio, CAMINHO_DA_FIXTURE), 'utf8')
    const { codigo, saida } = varrer(repositorioCom({ [CAMINHO_DA_FIXTURE]: conteudo }))
    expect(codigo, saida).toBe(0)
  })

  it('o histórico do próprio repositório passa', () => {
    const { codigo, saida } = varrer(raizRepositorio)
    expect(codigo, saida).toBe(0)
  })
})
