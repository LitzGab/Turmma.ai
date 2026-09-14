import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { raizRepositorio } from './executar.ts'

// O `.size-limit.json` real, com o mesmo teto e o mesmo caminho, aplicado a um build de mentira. Prova
// que o portão reprova bundle acima do teto, e não só que o comando existe.

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
  it('declara 150 kB em brotli sobre todo o JS do build da web', () => {
    const verificacoes = JSON.parse(readFileSync(join(raizRepositorio, '.size-limit.json'), 'utf8')) as Verificacao[]
    expect(verificacoes).toHaveLength(1)
    expect(verificacoes[0]).toMatchObject({ path: 'apps/web/dist/assets/*.js', limit: '150 kB', brotli: true })
  })

  it('bundle pequeno passa: o controle que mostra que a reprovação abaixo vem do tamanho', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-pequeno.js': jsIncompressivel(1_000) }))
    expect(saida).toContain('150 kB')
    expect(codigo).toBe(0)
  })

  it('bundle de fixture acima de 150 kB em brotli reprova', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ 'index-grande.js': jsIncompressivel(200_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('o teto vale para a soma: dois arquivos que cabem sozinhos, mas não juntos, reprovam', () => {
    const { codigo } = sizeLimit(
      buildDeMentira({ 'index-a.js': jsIncompressivel(90_000), 'vendor-b.js': jsIncompressivel(90_000) }),
    )
    expect(codigo).not.toBe(0)
  })

  it('sem build da web, reprova em vez de passar sem medir nada', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({}))
    expect(saida).toMatch(/can.t find files/i)
    expect(codigo).not.toBe(0)
  })
})
