import { spawnSync } from 'node:child_process'
import { randomInt } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { argumentosGitleaks, argumentosGitleaksDaPasta } from '../ci/etapas-de-guarda.ts'
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

const ARQUIVO_DO_CONVITE = 'apps/api/test/convite.int.test.ts'

/**
 * A linha que o `.gitleaks.toml` perdoa no teste do convite, lida do arquivo real. Escrita aqui como
 * texto, ela seria um achado neste arquivo, que não tem exceção. Se ela sair do teste do convite, a
 * exceção ficou velha, e este teste avisa.
 */
function linhaPerdoadaDoConvite(): string {
  const linha = readFileSync(join(raizRepositorio, ARQUIVO_DO_CONVITE), 'utf8')
    .split('\n')
    .find((texto) => texto.includes('aceitar(deB.token'))
  if (linha === undefined) throw new Error(`a linha perdoada saiu de ${ARQUIVO_DO_CONVITE}: a exceção do .gitleaks.toml ficou velha`)
  return linha
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
    const caminhos = ['tasks/prd-fundacao-tecnica/techspec.md', '.claude/skills/playwright-best-practices/advanced/authentication-flows.md', 'apps/api/test/convite.int.test.ts']
    const arquivos = Object.fromEntries(caminhos.map((caminho) => [caminho, `token de exemplo: ${tokenFalso()}\n`]))
    const { codigo, saida } = varrer(repositorioCom(arquivos))
    expect(codigo).toBe(1)
    for (const caminho of caminhos) expect(saida).toContain(`File:        ${caminho}`)
  })

  it('reprova a linha perdoada quando ela aparece em outro arquivo: a exceção é do arquivo e da linha juntos', () => {
    const { codigo, saida } = varrer(repositorioCom({ 'apps/api/test/outro.int.test.ts': `${linhaPerdoadaDoConvite()}\n` }))
    expect(codigo).toBe(1)
    expect(saida).toContain('File:        apps/api/test/outro.int.test.ts')
  })

  it('reprova o segredo colado antes da linha perdoada, na mesma linha: a exceção é da linha inteira, do começo ao fim', () => {
    const colada = `${tokenFalso()} ${linhaPerdoadaDoConvite().trimStart()}\n`
    const { codigo, saida } = varrer(repositorioCom({ [ARQUIVO_DO_CONVITE]: colada }))
    expect(codigo).toBe(1)
    expect(saida).toContain(`File:        ${ARQUIVO_DO_CONVITE}`)
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

  // A linha da tarefa 5.0 do F3 que reprovou a branch da spec em 09/10/2026, e o documento em que ela está.
  const TAREFA_COM_PLANO = 'tasks/prd-lgpd-e-titular/5_task.md'
  // Montada em pedaços: escrita inteira aqui, este arquivo de teste seria reprovado pela própria guarda.
  const COLUNA_DO_PLANO = ['expurgo_execucao_1', 'em'].join('.')
  const linhaDeChave = (rotulo: string, colunas: string) => `${rotulo} ${'Key'}${':'} ${colunas}`
  const LINHA_DO_PLANO = `${' '.repeat(23)}${linhaDeChave('Sort', COLUNA_DO_PLANO)}`

  it('deixa passar as linhas de chave de um plano do Postgres colado no documento de tarefa', () => {
    const plano = [' Sort (actual time=0.750..0.972 rows=4488.00 loops=1)', LINHA_DO_PLANO, `         ${linhaDeChave('Sort', 'desativado_em, id')}`, `   ${linhaDeChave('Group', 'escola_id, tentativa_atividade.aluno_id DESC')}`, ''].join('\n')
    const { codigo, saida } = varrer(repositorioCom({ [TAREFA_COM_PLANO]: plano }))
    expect(codigo, saida).toBe(0)
  })

  it('a exceção do plano é do documento de tarefa e do nome de coluna: fora dele, ou com uma chave no lugar, reprova', () => {
    // A mesma linha em arquivo que não é documento de tarefa.
    const fora = varrer(repositorioCom({ 'docs/plano.md': `${LINHA_DO_PLANO}\n` }))
    expect(fora.codigo, fora.saida).toBe(1)
    expect(fora.saida).toContain('File:        docs/plano.md')
    // Uma chave de verdade no lugar do nome de coluna, no documento de tarefa.
    const chave = aleatorio(40)
    const comChave = varrer(repositorioCom({ [TAREFA_COM_PLANO]: `   ${linhaDeChave('Sort', chave)}\n` }))
    expect(comChave.codigo, comChave.saida).toBe(1)
    expect(comChave.saida).not.toContain(chave)
    // Em minúsculas, mas comprida demais para nome de coluna: também não passa.
    const comprida = varrer(repositorioCom({ [TAREFA_COM_PLANO]: `   ${linhaDeChave('Sort', aleatorio(40).toLowerCase())}\n` }))
    expect(comprida.codigo, comprida.saida).toBe(1)
    // Um segredo em outra linha do mesmo documento: a exceção é da linha, não do arquivo.
    const outraLinha = varrer(repositorioCom({ [TAREFA_COM_PLANO]: `${LINHA_DO_PLANO}\ntoken de exemplo: ${tokenFalso()}\n` }))
    expect(outraLinha.codigo, outraLinha.saida).toBe(1)
    expect(outraLinha.saida).toMatch(/RuleID:\s+github-pat/)
  })

  /** A varredura que o portão local faz nos arquivos ainda sem commit: uma pasta, e não o histórico. */
  function varrerPasta(arquivos: Record<string, string>): Varredura {
    const pasta = mkdtempSync(join(tmpdir(), 'educa-gitleaks-pasta-'))
    diretorios.push(pasta)
    for (const [caminho, conteudo] of Object.entries(arquivos)) {
      mkdirSync(dirname(join(pasta, caminho)), { recursive: true })
      writeFileSync(join(pasta, caminho), conteudo)
    }
    spawnSync('chmod', ['-R', 'a+rX', pasta])
    const resultado = spawnSync('docker', [...argumentosGitleaksDaPasta(pasta, join(raizRepositorio, '.gitleaks.toml')), '--verbose'], { encoding: 'utf8' })
    return { codigo: resultado.status, saida: `${resultado.stdout}${resultado.stderr}` }
  }

  it('reprova o segredo em arquivo ainda sem commit, com o caminho relativo, e as exceções por caminho continuam valendo', () => {
    const token = tokenFalso()
    const comSegredo = varrerPasta({ 'apps/api/src/config.ts': `export const token = '${token}'\n`, [TAREFA_COM_PLANO]: `${LINHA_DO_PLANO}\n` })
    expect(comSegredo.codigo, comSegredo.saida).toBe(1)
    expect(comSegredo.saida).toContain('File:        apps/api/src/config.ts')
    expect(comSegredo.saida).not.toContain(TAREFA_COM_PLANO)
    expect(comSegredo.saida).not.toContain(token)
    // Só o plano no documento de tarefa: nada a reprovar. E a mesma linha fora dele reprova, como no histórico.
    const soPlano = varrerPasta({ [TAREFA_COM_PLANO]: `${LINHA_DO_PLANO}\n` })
    expect(soPlano.codigo, soPlano.saida).toBe(0)
    expect(varrerPasta({ 'docs/plano.md': `${LINHA_DO_PLANO}\n` }).codigo).toBe(1)
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
