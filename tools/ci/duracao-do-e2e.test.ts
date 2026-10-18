import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  alteracoesDoArquivo,
  casosAlterados,
  casosLentos,
  casosMedidos,
  LIMITE_DO_CASO_DE_E2E_MS,
  linhasDoDiff,
  motivoDaDuracaoDoE2e,
  relatoriosDoPlaywright,
  type CasoMedido,
  type RelatorioDoPlaywright,
} from './duracao-do-e2e.ts'
import { raizRepositorio } from './executar.ts'

const caso = (linha: number, duracaoMs: number, projeto = 'chromebook', arquivo = 'e2e/material.spec.ts'): CasoMedido => ({
  arquivo,
  linha,
  titulo: `caso da linha ${String(linha)}`,
  projeto,
  duracaoMs,
})

/** O formato do repórter `json` do Playwright: o arquivo vem sem o `e2e/`, e o `describe` é uma suíte filha. */
function relatorioDe(...casos: { linha: number; titulo: string; projeto: string; duracoes: number[]; status?: string }[]): RelatorioDoPlaywright {
  return {
    suites: [
      {
        title: 'material.spec.ts',
        specs: [],
        suites: [
          {
            title: 'material da coordenação',
            specs: casos.map((c) => ({
              title: c.titulo,
              file: 'material.spec.ts',
              line: c.linha,
              tests: [{ projectName: c.projeto, status: c.status ?? 'expected', results: c.duracoes.map((duration) => ({ duration })) }],
            })),
          },
        ],
      },
    ],
  }
}

describe('casosMedidos: lê o relatório do repórter json do Playwright', () => {
  it('devolve cada caso em cada projeto, com o arquivo no caminho do repositório e o título com o describe', () => {
    const relatorio = relatorioDe(
      { linha: 10, titulo: 'sobe o PDF', projeto: 'chromebook', duracoes: [4_000] },
      { linha: 10, titulo: 'sobe o PDF', projeto: 'celular', duracoes: [6_000] },
    )
    expect(casosMedidos(relatorio)).toEqual([
      { arquivo: 'e2e/material.spec.ts', linha: 10, titulo: 'material da coordenação › sobe o PDF', projeto: 'chromebook', duracaoMs: 4_000 },
      { arquivo: 'e2e/material.spec.ts', linha: 10, titulo: 'material da coordenação › sobe o PDF', projeto: 'celular', duracaoMs: 6_000 },
    ])
  })

  it('soma as tentativas do mesmo caso e deixa de fora o caso pulado', () => {
    const relatorio = relatorioDe(
      { linha: 10, titulo: 'com nova tentativa', projeto: 'chromebook', duracoes: [9_000, 8_000] },
      { linha: 40, titulo: 'pulado', projeto: 'chromebook', duracoes: [0], status: 'skipped' },
    )
    expect(casosMedidos(relatorio).map((medido) => [medido.linha, medido.duracaoMs])).toEqual([[10, 17_000]])
  })
})

describe('casosLentos: passou de 15 s na máquina, o runner leva o dobro e o prazo é 30 s', () => {
  it('o limite é 15 s', () => {
    expect(LIMITE_DO_CASO_DE_E2E_MS).toBe(15_000)
  })

  it('15,001 s é lento e 15 s exatos ainda cabem; o mais lento vem primeiro', () => {
    const lentos = casosLentos([caso(1, 15_000), caso(2, 15_001), caso(3, 22_000), caso(4, 3_000)])
    expect(lentos.map((lento) => lento.linha)).toEqual([3, 2])
  })
})

describe('linhasDoDiff: as linhas do arquivo novo que o diff tocou', () => {
  it('lê o trecho de uma linha, o de várias e a remoção pura, que conta como a linha de cima', () => {
    const diff = ['@@ -5 +5 @@', '-a', '+b', '@@ -20,2 +20,3 @@', '-c', '-d', '+e', '+f', '+g', '@@ -40,2 +42,0 @@', '-x', '-y'].join('\n')
    expect([...linhasDoDiff(diff)].sort((a, b) => a - b)).toEqual([5, 20, 21, 22, 42])
  })
})

describe('casosAlterados: só o caso cujas linhas o diff tocou', () => {
  // Três casos, de 10 a 29, de 30 a 59 e de 60 em diante.
  const casos = [caso(10, 1), caso(30, 1), caso(60, 1)]
  const alterar = (...linhas: number[]) => casosAlterados(casos, () => new Set(linhas)).map((alterado) => alterado.linha)

  it('a linha de dentro do caso o altera, e só ele', () => {
    expect(alterar(35)).toEqual([30])
  })

  it('a primeira e a última linha do intervalo contam; a linha do caso seguinte já é dele', () => {
    expect(alterar(10)).toEqual([10])
    expect(alterar(29)).toEqual([10])
    expect(alterar(30)).toEqual([30])
    expect(alterar(100)).toEqual([60])
  })

  it('linha antes do primeiro caso (importação, ajudante do alto) não é de caso nenhum', () => {
    expect(alterar(3)).toEqual([])
  })

  it('o caso é alterado nos dois projetos', () => {
    const nosDois = [caso(30, 1, 'chromebook'), caso(30, 1, 'celular'), caso(60, 1, 'chromebook')]
    expect(casosAlterados(nosDois, () => new Set([31])).map((alterado) => alterado.projeto)).toEqual(['chromebook', 'celular'])
  })

  it('arquivo novo tem todos os casos alterados', () => {
    expect(casosAlterados(casos, () => 'tudo')).toHaveLength(3)
  })

  it('cada arquivo é conferido pela sua própria alteração', () => {
    const dois = [caso(10, 1, 'chromebook', 'e2e/a.spec.ts'), caso(10, 1, 'chromebook', 'e2e/b.spec.ts')]
    const alterados = casosAlterados(dois, (arquivo) => (arquivo === 'e2e/b.spec.ts' ? new Set([10]) : new Set<number>()))
    expect(alterados.map((alterado) => alterado.arquivo)).toEqual(['e2e/b.spec.ts'])
  })
})

describe('relatoriosDoPlaywright: o json só entra quando o portão pede', () => {
  it('sem o arquivo, a lista de sempre: list, e o github na esteira', () => {
    expect(relatoriosDoPlaywright(false, undefined)).toEqual([['list']])
    expect(relatoriosDoPlaywright(true, undefined)).toEqual([['list'], ['github']])
  })

  it('com o arquivo, acrescenta o json que grava nele, sem tirar os de sempre', () => {
    expect(relatoriosDoPlaywright(false, '/tmp/x.json')).toEqual([['list'], ['json', { outputFile: '/tmp/x.json' }]])
    expect(relatoriosDoPlaywright(true, '/tmp/x.json')).toEqual([['list'], ['github'], ['json', { outputFile: '/tmp/x.json' }]])
  })
})

describe('no repositório: o diff do git decide qual caso é alterado', () => {
  const pastas: string[] = []
  afterEach(() => {
    for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true })
  })

  const git = (raiz: string, ...argumentos: string[]) => execFileSync('git', argumentos, { cwd: raiz, encoding: 'utf8' })

  /** Um spec de três casos nas linhas 2, 7 e 13, já commitado. */
  function repositorioComSpec(): string {
    const raiz = mkdtempSync(join(tmpdir(), 'duracao-e2e-'))
    pastas.push(raiz)
    git(raiz, 'init', '-q')
    git(raiz, 'config', 'user.email', 'teste@educa.invalid')
    git(raiz, 'config', 'user.name', 'teste')
    // O repositório temporário herda o git global: numa máquina que assina todo commit, o `git commit` do teste falharia.
    git(raiz, 'config', 'commit.gpgsign', 'false')
    mkdirSync(join(raiz, 'e2e'))
    const linhas = [
      "import { test } from '@playwright/test'",
      "test('primeiro', async () => {",
      '  await a()',
      '  await b()',
      '  await c()',
      '})',
      "test('segundo', async () => {",
      '  await a()',
      '  await b()',
      '  await c()',
      '})',
      '',
      "test('terceiro', async () => {",
      '  await a()',
      '})',
      '',
    ]
    writeFileSync(join(raiz, 'e2e/material.spec.ts'), linhas.join('\n'))
    git(raiz, 'add', '.')
    git(raiz, 'commit', '-q', '-m', 'spec')
    return raiz
  }

  function relatorioNo(raiz: string): string {
    const relatorio = relatorioDe(
      { linha: 2, titulo: 'primeiro', projeto: 'chromebook', duracoes: [21_000] },
      { linha: 7, titulo: 'segundo', projeto: 'chromebook', duracoes: [19_000] },
      { linha: 13, titulo: 'terceiro', projeto: 'chromebook', duracoes: [2_000] },
    )
    const caminho = join(raiz, 'relatorio.json')
    writeFileSync(caminho, JSON.stringify(relatorio))
    return caminho
  }

  it('o caso lento que a tarefa não tocou não reprova; o que ela tocou, sim, com arquivo, linha, projeto e segundos', () => {
    const raiz = repositorioComSpec()
    const original = readFileSync(join(raiz, 'e2e/material.spec.ts'), 'utf8')
    writeFileSync(join(raiz, 'e2e/material.spec.ts'), original.replace('  await b()\n  await c()\n})\n\n', '  await b()\n  await d()\n})\n\n'))
    const motivo = motivoDaDuracaoDoE2e(raiz, relatorioNo(raiz))
    expect(motivo).toContain('e2e/material.spec.ts:7 (chromebook) levou 19,0 s')
    expect(motivo).not.toContain('e2e/material.spec.ts:2')
    expect(motivo).toContain('1 caso(s)')
  })

  it('caso alterado dentro dos 15 s passa, mesmo com o arquivo cheio de caso lento que ficou como estava', () => {
    const raiz = repositorioComSpec()
    const original = readFileSync(join(raiz, 'e2e/material.spec.ts'), 'utf8')
    writeFileSync(join(raiz, 'e2e/material.spec.ts'), original.replace("  await a()\n})\n", '  await z()\n})\n'))
    expect(motivoDaDuracaoDoE2e(raiz, relatorioNo(raiz))).toBeNull()
  })

  it('arquivo de e2e novo, ainda fora do git, tem todos os casos alterados', () => {
    const raiz = repositorioComSpec()
    const novo = readFileSync(join(raiz, 'e2e/material.spec.ts'), 'utf8')
    writeFileSync(join(raiz, 'e2e/novo.spec.ts'), novo)
    expect(alteracoesDoArquivo(raiz, 'e2e/novo.spec.ts')).toBe('tudo')
    const relatorio = relatorioDe({ linha: 2, titulo: 'lento e novo', projeto: 'celular', duracoes: [16_000] })
    const caminho = join(raiz, 'novo.json')
    writeFileSync(caminho, JSON.stringify(relatorio).replace(/material\.spec\.ts/g, 'novo.spec.ts'))
    expect(motivoDaDuracaoDoE2e(raiz, caminho)).toContain('e2e/novo.spec.ts:2 (celular) levou 16,0 s')
  })

  it('sem o relatório, ou com ele ilegível, o portão reprova: não mediu nada', () => {
    const raiz = repositorioComSpec()
    expect(motivoDaDuracaoDoE2e(raiz, join(raiz, 'nao-existe.json'))).toContain('não deixou o relatório de duração')
    const quebrado = join(raiz, 'quebrado.json')
    writeFileSync(quebrado, '{ não é json')
    expect(motivoDaDuracaoDoE2e(raiz, quebrado)).toContain('não é um JSON legível')
  })
})

describe('as ligações que nenhuma função sozinha prova', () => {
  const ler = (arquivo: string) => readFileSync(join(raizRepositorio, arquivo), 'utf8')

  it('o playwright.config.ts monta os repórteres por relatoriosDoPlaywright, com a variável do portão', () => {
    const configuracao = ler('playwright.config.ts')
    expect(configuracao).toMatch(/reporter: relatoriosDoPlaywright\(process\.env\['CI'\] === 'true', process\.env\[VARIAVEL_DO_RELATORIO_DO_E2E\]\)/)
  })

  it('o portão da tarefa passa a variável só ao e2e e reprova pela duração antes das mutações', () => {
    const portao = ler('tools/processo/portao-local.ts')
    expect(portao).toMatch(/daTarefa && comando\.includes\('tools\/ci\/e2e\.ts'\) \? \{ \.\.\.ambiente, \[VARIAVEL_DO_RELATORIO_DO_E2E\]: relatorioDoE2e \}/)
    expect(portao).toMatch(/daTarefa && alvos\.e2e\.length > 0 \? motivoDaDuracaoDoE2e\(raiz, relatorioDoE2e\) : null/)
    // É a chamada que entrega a variável ao e2e, e o relatório da corrida anterior que sai antes dela: sem um dos dois o portão lê relatório velho.
    expect(portao).toContain('rodar(comando, ambienteDoComando(comando, suite))')
    expect(portao).toMatch(/if \(daTarefa\) \{\n {2}rmSync\(relatorioDoE2e, \{ force: true \}\)/)
    expect(portao.indexOf('motivoDaDuracaoDoE2e(raiz, relatorioDoE2e)')).toBeLessThan(portao.indexOf('const documento = daTarefa ? documentoDasMutacoes()'))
  })
})
