import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { raizRepositorio } from './executar.ts'

// O `.size-limit.json` real, com o mesmo teto e o mesmo caminho, aplicado a um build de mentira. Prova
// que o portão reprova bundle acima do teto, e não só que o comando existe.
//
// O teto mede a entrada (`index-*.js`, o chunk que o Vite gera para o `index.html`), e não a soma de todo o JS do
// build: o chunk que só se baixa por `import()`, como o da área do operador (tarefa 10.0 da A0), não pesa no primeiro
// carregamento do Chromebook e não conta contra os 150 kB (Tech Spec da A0, seção 9).

interface Verificacao {
  name: string
  path: string
  limit: string
  brotli: boolean
}

const diretorios: string[] = []

afterEach(() => {
  for (const diretorio of diretorios.splice(0)) rmSync(diretorio, { recursive: true, force: true })
})

/** Um diretório com a configuração real e os arquivos dados em `apps/web/dist/assets`. */
function buildDeMentira(arquivos: Record<string, string>): string {
  const diretorio = mkdtempSync(join(tmpdir(), 'educa-tamanho-'))
  diretorios.push(diretorio)
  copyFileSync(join(raizRepositorio, '.size-limit.json'), join(diretorio, '.size-limit.json'))
  const assets = join(diretorio, 'apps/web/dist/assets')
  mkdirSync(assets, { recursive: true })
  for (const [nome, conteudo] of Object.entries(arquivos)) writeFileSync(join(assets, nome), conteudo)
  return diretorio
}

/** Roda o size-limit do repositório (os plugins vêm do package.json da raiz) contra a configuração copiada. */
function sizeLimit(diretorio: string): { codigo: number | null; saida: string } {
  const resultado = spawnSync('npx', ['size-limit', '--config', join(diretorio, '.size-limit.json')], {
    cwd: raizRepositorio,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  })
  return { codigo: resultado.status, saida: `${resultado.stdout}${resultado.stderr}` }
}

/** JS que o brotli não consegue comprimir: base64 de bytes aleatórios. */
function jsIncompressivel(bytesAleatorios: number): string {
  return `export const x = '${randomBytes(bytesAleatorios).toString('base64')}'\n`
}

describe('teto do bundle da web (.size-limit.json)', () => {
  it('declara 150 kB em brotli sobre o chunk de entrada da web', () => {
    const verificacoes = JSON.parse(readFileSync(join(raizRepositorio, '.size-limit.json'), 'utf8')) as Verificacao[]
    expect(verificacoes).toHaveLength(1)
    expect(verificacoes[0]).toMatchObject({ path: 'apps/web/dist/assets/index-*.js', limit: '150 kB', brotli: true })
  })

  it('entrada pequena passa: o controle que mostra que a reprovação abaixo vem do tamanho', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-pequeno.js': jsIncompressivel(1_000) }))
    expect(saida).toContain('150 kB')
    expect(codigo).toBe(0)
  })

  it('entrada acima de 150 kB em brotli reprova', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-grande.js': jsIncompressivel(200_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('a soma dos chunks acima de 150 kB, com a entrada abaixo, não reprova: o chunk por import() não conta', () => {
    // 90 kB + 90 kB incompressíveis passam dos 150 kB juntos. Com o teto sobre `*.js`, como era até a tarefa 2.0 da
    // A0, este build reprovava; com o teto sobre a entrada, o chunk do operador fica de fora.
    const { codigo, saida } = sizeLimit(
      buildDeMentira({ 'index-a.js': jsIncompressivel(90_000), 'operacao-b.js': jsIncompressivel(90_000) }),
    )
    expect(saida).toContain('150 kB')
    expect(codigo).toBe(0)
  })

  it('a entrada que passa sozinha reprova quando ela mesma cresce, com o outro chunk do mesmo tamanho', () => {
    // O par do caso acima: o mesmo chunk de fora, e a entrada acima do teto. Prova que o caso acima passa porque o
    // chunk de fora não é medido, e não porque o teto deixou de medir alguma coisa.
    const { codigo, saida } = sizeLimit(
      buildDeMentira({ 'index-a.js': jsIncompressivel(200_000), 'operacao-b.js': jsIncompressivel(90_000) }),
    )
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('sem o chunk de entrada no build, reprova em vez de passar sem medir nada', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'operacao-b.js': jsIncompressivel(1_000) }))
    expect(saida).toMatch(/can.t find files/i)
    expect(codigo).not.toBe(0)
  })
})
