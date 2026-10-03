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
// Um teto por grupo (Tech Spec da A0, seção 9, "Orçamento"; Tech Spec da A1, seção 9, "Fronteira"): 150 kB no primeiro
// carregamento da escola — a entrada (`index-*.js`, o chunk que o Vite gera para o `index.html`) e os pedaços `parte-*.js`
// que ela importa junto —, e não na soma de todo o JS do build; 60 kB no chunk da área do operador (`operacao-*.js`); e
// um teto próprio para a área de cada papel (`coordenacao-*.js`, `professor-*.js`, `aluno-*.js`). A operação e as áreas
// só se baixam por `import()` e não pesam no primeiro carregamento do Chromebook. Os nomes são garantidos por
// `apps/web/nome-dos-chunks.ts`, com o teste dele sobre o build de verdade.

interface Verificacao {
  name: string
  path: string | string[]
  limit: string
  brotli: boolean
}

/** Um build pequeno com todos os grupos: cada caso muda só o arquivo que quer provar. */
const BUILD_PEQUENO: Record<string, string> = {
  'index-pequeno.js': jsIncompressivel(1_000),
  'operacao-pequeno.js': jsIncompressivel(1_000),
  'coordenacao-pequeno.js': jsIncompressivel(1_000),
  'professor-pequeno.js': jsIncompressivel(1_000),
  'aluno-pequeno.js': jsIncompressivel(1_000),
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
  it('declara 150 kB em brotli sobre a entrada, sozinha e com os pedaços parte-*, 60 kB sobre a operação e um teto por área da escola', () => {
    const verificacoes = JSON.parse(readFileSync(join(raizRepositorio, '.size-limit.json'), 'utf8')) as Verificacao[]
    expect(verificacoes.map(({ path, limit, brotli }) => ({ path, limit, brotli }))).toEqual([
      { path: 'apps/web/dist/assets/index-*.js', limit: '150 kB', brotli: true },
      { path: ['apps/web/dist/assets/index-*.js', 'apps/web/dist/assets/parte-*.js'], limit: '150 kB', brotli: true },
      { path: 'apps/web/dist/assets/operacao-*.js', limit: '60 kB', brotli: true },
      { path: 'apps/web/dist/assets/coordenacao-*.js', limit: '16 kB', brotli: true },
      { path: 'apps/web/dist/assets/professor-*.js', limit: '8 kB', brotli: true },
      { path: 'apps/web/dist/assets/aluno-*.js', limit: '5 kB', brotli: true },
    ])
  })

  it('todos os grupos pequenos passam: o controle que mostra que as reprovações abaixo vêm do tamanho', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira(BUILD_PEQUENO))
    for (const teto of ['150 kB', '60 kB', '16 kB', '8 kB', '5 kB']) expect(saida).toContain(teto)
    expect(codigo).toBe(0)
  })

  it('o pedaço parte-* que a entrada importa junto conta no teto do primeiro carregamento', () => {
    // 100 kB + 60 kB incompressíveis: cada um abaixo de 150 kB, os dois juntos acima. Com o teto só sobre `index-*.js`,
    // como era até a A1, o React que o Rolldown separa num `parte-*` compartilhado ficaria fora da conta.
    const { codigo, saida } = sizeLimit(buildDeMentira({ ...BUILD_PEQUENO, 'index-pequeno.js': jsIncompressivel(100_000), 'parte-comum.js': jsIncompressivel(60_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('sem nenhum pedaço parte-* no build, o teto da entrada continua medindo a entrada', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ ...BUILD_PEQUENO, 'index-pequeno.js': jsIncompressivel(200_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  for (const [area, teto, acima] of [
    // Entre 16 e 20 kB em brotli: reprova só com o teto da 16.0, e passaria com o da 13.0.
    ['coordenacao', '16 kB', 18_000],
    // Entre 8 e 10 kB em brotli: reprova só com o teto da 16.0, e passaria com o da 15.0.
    ['professor', '8 kB', 9_000],
    ['aluno', '5 kB', 8_000],
  ] as const) {
    it(`o chunk ${area}-* acima de ${teto} em brotli reprova, com os outros folgados`, () => {
      const { codigo, saida } = sizeLimit(buildDeMentira({ ...BUILD_PEQUENO, [`${area}-pequeno.js`]: jsIncompressivel(acima) }))
      expect(saida).toMatch(/exceeded/i)
      expect(codigo).not.toBe(0)
    })

    it(`sem o chunk ${area}-*.js no build, reprova: a área que perdeu o nome não escapa do teto`, () => {
      const { [`${area}-pequeno.js`]: _semArea, ...resto } = BUILD_PEQUENO
      const { codigo, saida } = sizeLimit(buildDeMentira({ ...resto, [`parte-rotas-${area}.js`]: jsIncompressivel(1_000) }))
      expect(saida).toMatch(/can.t find files/i)
      expect(codigo).not.toBe(0)
    })
  }

  it('entrada acima de 150 kB em brotli reprova', () => {
    const { codigo, saida } = sizeLimit(buildDeMentira({ ...BUILD_PEQUENO, 'index-pequeno.js': jsIncompressivel(200_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('B1: o chunk da operação acima de 60 kB em brotli reprova, com a entrada folgada', () => {
    // 70 kB incompressíveis: abaixo do teto da entrada, acima do da operação. Só o teto próprio do chunk reprova isto.
    const { codigo, saida } = sizeLimit(buildDeMentira({ ...BUILD_PEQUENO, 'operacao-pequeno.js': jsIncompressivel(70_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('a soma dos chunks acima de 150 kB, com cada um abaixo do seu teto, não reprova: o chunk por import() não conta na entrada', () => {
    // 110 kB + 50 kB passam dos 150 kB juntos. Com o teto da entrada sobre `*.js`, como era até a tarefa 2.0 da A0, este
    // build reprovava; com o teto sobre a entrada, o chunk do operador só responde ao teto dele.
    const { codigo, saida } = sizeLimit(buildDeMentira({ ...BUILD_PEQUENO, 'index-pequeno.js': jsIncompressivel(110_000), 'operacao-pequeno.js': jsIncompressivel(50_000) }))
    expect(saida).toContain('150 kB')
    expect(codigo).toBe(0)
  })

  it('a entrada que passa sozinha reprova quando ela mesma cresce, com o outro chunk do mesmo tamanho', () => {
    // O par do caso acima: o mesmo chunk da operação, e a entrada acima do teto. Prova que o caso acima passa porque a
    // operação não é somada na entrada, e não porque o teto deixou de medir alguma coisa.
    const { codigo, saida } = sizeLimit(buildDeMentira({ ...BUILD_PEQUENO, 'index-pequeno.js': jsIncompressivel(200_000), 'operacao-pequeno.js': jsIncompressivel(50_000) }))
    expect(saida).toMatch(/exceeded/i)
    expect(codigo).not.toBe(0)
  })

  it('sem o chunk de entrada no build, reprova em vez de passar sem medir nada, também com um parte-* no lugar dela', () => {
    // O teto do primeiro carregamento soma `index-*` e `parte-*`, e acharia o `parte-*` sozinho: é o teto só da entrada
    // que reprova o build que perdeu a entrada.
    const { 'index-pequeno.js': _semEntrada, ...resto } = BUILD_PEQUENO
    const { codigo, saida } = sizeLimit(buildDeMentira({ ...resto, 'parte-comum.js': jsIncompressivel(1_000) }))
    expect(saida).toMatch(/can.t find files/i)
    expect(codigo).not.toBe(0)
  })

  it('sem o chunk operacao-*.js no build, reprova: o chunk que perdeu o nome não escapa do teto', () => {
    // Se a área do operador saísse com outro nome (`parte-rotas-*.js`), o teto de 60 kB não mediria nada.
    const { 'operacao-pequeno.js': _semOperacao, ...resto } = BUILD_PEQUENO
    const { codigo, saida } = sizeLimit(buildDeMentira({ ...resto, 'parte-rotas-b.js': jsIncompressivel(1_000) }))
    expect(saida).toMatch(/can.t find files/i)
    expect(codigo).not.toBe(0)
  })
})
