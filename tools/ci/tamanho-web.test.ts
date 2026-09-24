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
// Dois tetos (Tech Spec da A0, seção 9, "Orçamento"): 150 kB na entrada (`index-*.js`, o chunk que o Vite gera para o
// `index.html`), e não na soma de todo o JS do build; e 60 kB no chunk da área do operador (`operacao-*.js`), que só se
// baixa por `import()` e não pesa no primeiro carregamento do Chromebook. Os nomes são garantidos por
// `apps/web/nome-dos-chunks.ts`, com o teste dele sobre o build de verdade.

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
  it('declara 150 kB em brotli sobre o chunk de entrada e 60 kB sobre o chunk da operação', () => {
    const verificacoes = JSON.parse(readFileSync(join(raizRepositorio, '.size-limit.json'), 'utf8')) as Verificacao[]
    expect(verificacoes).toHaveLength(2)
    expect(verificacoes[0]).toMatchObject({ path: 'apps/web/dist/assets/index-*.js', limit: '150 kB', brotli: true })
    expect(verificacoes[1]).toMatchObject({ path: 'apps/web/dist/assets/operacao-*.js', limit: '60 kB', brotli: true })
  })

  it('entrada e operação pequenas passam: o controle que mostra que as reprovações abaixo vêm do tamanho', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-pequeno.js': jsIncompressivel(1_000), 'operacao-pequeno.js': jsIncompressivel(1_000) }))
    expect(saida).toContain('150 kB')
    expect(saida).toContain('60 kB')
    expect(codigo).toBe(0)
  })

  it('entrada acima de 150 kB em brotli reprova', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-grande.js': jsIncompressivel(200_000), 'operacao-pequeno.js': jsIncompressivel(1_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('B1: o chunk da operação acima de 60 kB em brotli reprova, com a entrada folgada', () => {
    // 70 kB incompressíveis: abaixo do teto da entrada, acima do da operação. Só o teto próprio do chunk reprova isto.
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-pequeno.js': jsIncompressivel(1_000), 'operacao-grande.js': jsIncompressivel(70_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('a soma dos chunks acima de 150 kB, com cada um abaixo do seu teto, não reprova: o chunk por import() não conta na entrada', () => {
    // 110 kB + 50 kB passam dos 150 kB juntos. Com o teto da entrada sobre `*.js`, como era até a tarefa 2.0 da A0, este
    // build reprovava; com o teto sobre a entrada, o chunk do operador só responde ao teto dele.
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-a.js': jsIncompressivel(110_000), 'operacao-b.js': jsIncompressivel(50_000) }))
    expect(saida).toContain('150 kB')
    expect(codigo).toBe(0)
  })

  it('a entrada que passa sozinha reprova quando ela mesma cresce, com o outro chunk do mesmo tamanho', () => {
    // O par do caso acima: o mesmo chunk da operação, e a entrada acima do teto. Prova que o caso acima passa porque a
    // operação não é somada na entrada, e não porque o teto deixou de medir alguma coisa.
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-a.js': jsIncompressivel(200_000), 'operacao-b.js': jsIncompressivel(50_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('sem o chunk de entrada no build, reprova em vez de passar sem medir nada', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'operacao-b.js': jsIncompressivel(1_000) }))
    expect(saida).toMatch(/can.t find files/i)
    expect(codigo).not.toBe(0)
  })

  it('sem o chunk operacao-*.js no build, reprova: o chunk que perdeu o nome não escapa do teto', () => {
    // Se a área do operador saísse com outro nome (`parte-rotas-*.js`), o teto de 60 kB não mediria nada.
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-a.js': jsIncompressivel(1_000), 'parte-rotas-b.js': jsIncompressivel(1_000) }))
    expect(saida).toMatch(/can.t find files/i)
    expect(codigo).not.toBe(0)
  })
})
