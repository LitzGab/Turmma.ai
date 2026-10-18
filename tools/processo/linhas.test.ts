import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ULTIMO_AMBIENTE_DE_TESTE } from '../ci/compose.ts'
import {
  abrir,
  branchDaLinha,
  CAMINHO_DO_QUADRO,
  conferir,
  distribuir,
  ehDoTronco,
  encontro,
  fechar,
  lerArquivosPrevistos,
  lerPlano,
  lerQuadro,
  marcarTarefaFeita,
  MAXIMO_DE_LINHAS,
  partida,
  porQueNaoJuntas,
  quadro,
  seSobrepoem,
  situacaoDasPendentes,
  textoDoQuadro,
  type TarefaDoPlano,
} from './linhas.ts'
import { arquivosAlterados } from './revisoes.ts'

// Tarefas da mesma spec ao mesmo tempo. O que este arquivo prova é o que custaria caro errado: duas tarefas que se
// tocam correndo juntas, um encontro que leva à spec um commit sem revisão, e um conflito resolvido calado.

const tarefa = (numero: number, campos: Partial<TarefaDoPlano> = {}): TarefaDoPlano => ({
  numero,
  titulo: `tarefa ${String(numero)}`,
  feita: false,
  dependeDe: [],
  paralelaCom: [],
  arquivos: [`apps/web/src/areas/a${String(numero)}/Tela.tsx`],
  ...campos,
})

describe('arquivos previstos', () => {
  it('lê só o que é caminho, entre crases ou solto, e ignora a descrição em prosa', () => {
    const documento = [
      '# Tarefa 3.0',
      '',
      '## Arquivos previstos',
      '',
      '| Arquivo | Novo ou alterado |',
      '|---|---|',
      '| `apps/api/src/pedidos/pedidos.repository.ts` | alterado |',
      '| apps/web/src/areas/coordenacao/pedidos/ | novo |',
      '| casca do aluno, `MenuDaPessoa`, navegação | alterado |',
      '| `e2e/pedidos.spec.ts` e `apps/api/test/pedidos.int.test.ts` | novo |',
      '| e2e | novo |',
      '',
      '## Testes que provam a regra',
      '',
      '| `apps/fora/da-secao.ts` | novo |',
    ].join('\n')
    expect(lerArquivosPrevistos(documento)).toEqual([
      'apps/api/src/pedidos/pedidos.repository.ts',
      'apps/web/src/areas/coordenacao/pedidos/',
      'e2e/pedidos.spec.ts',
      'apps/api/test/pedidos.int.test.ts',
    ])
    expect(lerArquivosPrevistos('# Tarefa sem a seção\n')).toEqual([])
  })

  it('pasta cobre o que está dentro dela, e arquivo de nome parecido não', () => {
    expect(seSobrepoem('apps/web/src/areas/x/', 'apps/web/src/areas/x/Tela.tsx')).toBe(true)
    expect(seSobrepoem('apps/web/src/areas/x/**', 'apps/web/src/areas/x/Tela.tsx')).toBe(true)
    expect(seSobrepoem('apps/web/src/rotas.tsx', 'apps/web/src/rotas.tsx')).toBe(true)
    expect(seSobrepoem('apps/web/src/areas/x/', 'apps/web/src/areas/xis/Tela.tsx')).toBe(false)
    expect(seSobrepoem('apps/web/src/rotas.ts', 'apps/web/src/rotas.tsx')).toBe(false)
  })

  it('migration, schema e contrato compartilhado são do tronco', () => {
    expect(['packages/nucleo/drizzle/0037_x.sql', 'packages/nucleo/src/db/schema/pedidos.ts', 'packages/shared/src/pedidos.ts'].every(ehDoTronco)).toBe(true)
    expect(['apps/api/src/pedidos/pedidos.service.ts', 'apps/web/src/areas/x/Tela.tsx', 'e2e/pedidos.spec.ts'].some(ehDoTronco)).toBe(false)
  })
})

describe('o que corre junto', () => {
  it('só com a autorização do Arquiteto, com caminho declarado nas duas, sem arquivo em comum e sem dois troncos', () => {
    const [a, b] = [tarefa(1, { paralelaCom: [2] }), tarefa(2, { paralelaCom: [1] })]
    expect(porQueNaoJuntas(a, b)).toBeNull()
    expect(porQueNaoJuntas(tarefa(1), tarefa(2))).toMatch(/não autoriza a 1\.0 em paralelo com a 2\.0/)
    expect(porQueNaoJuntas(a, { ...b, arquivos: [] })).toMatch(/a 2\.0 não declara caminho/)
    expect(porQueNaoJuntas({ ...a, arquivos: ['apps/web/src/rotas.tsx', 'apps/web/src/areas/a1/'] }, { ...b, arquivos: ['apps/web/src/rotas.tsx'] })).toMatch(/preveem apps\/web\/src\/rotas\.tsx/)
    expect(porQueNaoJuntas({ ...a, arquivos: ['apps/web/src/areas/a1/'] }, { ...b, arquivos: ['apps/web/src/areas/a1/Tela.tsx'] })).toMatch(/preveem apps\/web\/src\/areas\/a1\//)
    expect(
      porQueNaoJuntas({ ...a, arquivos: ['packages/nucleo/drizzle/0037_a.sql'] }, { ...b, arquivos: ['packages/shared/src/b.ts'] }),
    ).toMatch(/migration, schema ou contrato compartilhado/)
    // Uma do tronco com uma folha corre.
    expect(porQueNaoJuntas({ ...a, arquivos: ['packages/nucleo/drizzle/0037_a.sql'] }, b)).toBeNull()
  })

  it('pendente só é livre com as dependências concluídas e correndo junto com tudo o que está em curso', () => {
    const plano = [
      tarefa(1, { feita: true }),
      tarefa(2, { dependeDe: [1], paralelaCom: [3, 4] }),
      tarefa(3, { dependeDe: [1], paralelaCom: [2] }),
      tarefa(4, { dependeDe: [1], paralelaCom: [2], arquivos: ['apps/web/src/areas/a2/Tela.tsx'] }),
      tarefa(5, { dependeDe: [2] }),
    ]
    const comADoisEmCurso = situacaoDasPendentes(plano, [2])
    expect(comADoisEmCurso.livres.map(({ numero }) => numero)).toEqual([3])
    expect(comADoisEmCurso.presas).toEqual([
      { numero: 4, motivo: 'a 4.0 e a 2.0 preveem apps/web/src/areas/a2/Tela.tsx' },
      { numero: 5, motivo: 'espera 2.0' },
    ])
    // Sem nada em curso, toda pendente com a dependência concluída é livre: correr sozinha não pede autorização.
    expect(situacaoDasPendentes(plano, []).livres.map(({ numero }) => numero)).toEqual([2, 3, 4])
  })

  it('a distribuição não põe juntas duas livres que não correm uma com a outra', () => {
    // A 3.0 e a 4.0 correm com a 2.0, mas não entre si: o Arquiteto não autorizou o par.
    const plano = [tarefa(2, { paralelaCom: [3, 4] }), tarefa(3), tarefa(4)]
    expect(distribuir(plano, [], [1, 2, 3])).toEqual({ partidas: [{ linha: 1, tarefa: 2 }, { linha: 2, tarefa: 3 }], semLinha: [] })
    // Com a 4.0 autorizada com a 3.0 e uma linha ociosa só, as outras ficam sem linha: é o que pede abrir mais.
    const todas = [tarefa(2, { paralelaCom: [3, 4] }), tarefa(3, { paralelaCom: [4] }), tarefa(4)]
    expect(distribuir(todas, [], [2])).toEqual({ partidas: [{ linha: 2, tarefa: 2 }], semLinha: [3, 4] })
    expect(distribuir(todas, [2], [1, 3])).toEqual({ partidas: [{ linha: 1, tarefa: 3 }, { linha: 3, tarefa: 4 }], semLinha: [] })
  })

  it('sem autorização nenhuma, é uma tarefa por vez, como sempre foi', () => {
    const plano = [tarefa(1), tarefa(2), tarefa(3)]
    expect(distribuir(plano, [], [1, 2, 3]).partidas).toEqual([{ linha: 1, tarefa: 1 }])
    expect(distribuir(plano, [1], [2, 3])).toEqual({ partidas: [], semLinha: [] })
  })

  it('o teto de linhas é o de ambientes de teste da máquina', () => {
    expect(MAXIMO_DE_LINHAS).toBe(ULTIMO_AMBIENTE_DE_TESTE)
  })
})

describe('marcar a tarefa na lista', () => {
  it('marca a tarefa e as subtarefas dela, e nenhuma outra', () => {
    const lista = ['- [ ] **1.0 — a**', '  - [ ] 1.1 um', '  - [ ] 1.2 Testes', '', '- [ ] **11.0 — b**', '  - [ ] 11.1 um', '', '- [x] **2.0 — c**', ''].join('\n')
    expect(marcarTarefaFeita(lista, 1)).toBe(
      ['- [x] **1.0 — a**', '  - [x] 1.1 um', '  - [x] 1.2 Testes', '', '- [ ] **11.0 — b**', '  - [ ] 11.1 um', '', '- [x] **2.0 — c**', ''].join('\n'),
    )
  })
})

describe('partida, encontro e fechamento, em repositórios de verdade', () => {
  const pastas: string[] = []
  afterEach(() => {
    for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true })
  })

  const TASKS = [
    '# Tarefas — exemplo',
    '',
    '## Lista',
    '',
    '- [x] **1.0 — a base**',
    '  - [x] 1.1 um',
    '- [ ] **2.0 — a tela A**',
    '  - [ ] 2.1 um',
    '- [ ] **3.0 — a tela B**',
    '  - [ ] 3.1 um',
    '- [ ] **4.0 — o que depende da A**',
    '  - [ ] 4.1 um',
    '',
    '## Dependências e paralelismo',
    '',
    '| Tarefa | Depende de | Pode correr em paralelo com |',
    '|---|---|---|',
    '| 1.0 | nenhuma | — |',
    '| 2.0 | 1.0 | 3.0 |',
    '| 3.0 | 1.0 | — |',
    '| 4.0 | 2.0 | — |',
    '',
  ].join('\n')
  const documento = (numero: number, arquivo: string) => `# Tarefa ${String(numero)}.0\n\n## Arquivos previstos\n\n| Arquivo | Novo ou alterado |\n|---|---|\n| \`${arquivo}\` | novo |\n\n## Testes\n`

  function andares(linhas = [1, 2]) {
    const base = mkdtempSync(join(tmpdir(), 'linhas-'))
    pastas.push(base)
    const spec = join(base, 'spec')
    mkdirSync(spec)
    const git = (raiz: string, ...args: string[]) => execFileSync('git', args, { cwd: raiz, encoding: 'utf8', stdio: 'pipe' }).trim()
    const escrever = (raiz: string, arquivo: string, conteudo: string) => {
      mkdirSync(dirname(join(raiz, arquivo)), { recursive: true })
      writeFileSync(join(raiz, arquivo), conteudo)
    }
    git(spec, 'init', '-q', '-b', 'spec/exemplo')
    git(spec, 'config', 'user.name', 'teste')
    git(spec, 'config', 'user.email', 'teste@exemplo.invalid')
    escrever(spec, '.gitignore', '.processo/\n')
    escrever(spec, 'tasks/prd-exemplo/tasks.md', TASKS)
    escrever(spec, 'tasks/prd-exemplo/estado.md', '# Estado\n')
    escrever(spec, 'tasks/prd-exemplo/2_task.md', documento(2, 'apps/web/a.ts'))
    escrever(spec, 'tasks/prd-exemplo/3_task.md', documento(3, 'apps/web/b.ts'))
    escrever(spec, 'tasks/prd-exemplo/4_task.md', documento(4, 'apps/web/c.ts'))
    escrever(spec, 'apps/web/registro.ts', 'export const telas = [\n  // fim\n]\n')
    git(spec, 'add', '-A')
    git(spec, 'commit', '-q', '-m', 'Abre exemplo')
    const checkouts = new Map<number, string>()
    for (const numero of linhas) {
      const checkout = join(base, `l${String(numero)}`)
      git(spec, 'worktree', 'add', '-q', '-b', branchDaLinha('spec/exemplo', numero), checkout)
      // O que o Maestri copia do andar de origem e não vale na linha.
      escrever(checkout, '.processo/portao.json', '{}')
      escrever(checkout, '.processo/linhas.json', '{}')
      checkouts.set(numero, checkout)
      expect(abrir(spec, numero, checkout, { instalar: false }).codigo).toBe(0)
    }
    /** O que o Implementador entrega: o código, a lista marcada e o commit com a marca e as revisões. */
    const entregar = (numero: number, tarefaFeita: number, arquivos: Record<string, string>, marca = `(tarefa ${String(tarefaFeita)}.0)`) => {
      const checkout = checkouts.get(numero) ?? ''
      for (const [arquivo, conteudo] of Object.entries(arquivos)) escrever(checkout, arquivo, conteudo)
      const lista = join(checkout, 'tasks/prd-exemplo/tasks.md')
      if (marca.startsWith('(tarefa')) writeFileSync(lista, marcarTarefaFeita(readFileSync(lista, 'utf8'), tarefaFeita))
      git(checkout, 'add', '-A')
      git(checkout, 'commit', '-q', '-m', `Entrega ${marca}\n\nRevisões: test-engineer APROVADO (1ª rodada), revisor-geral APROVADO (1ª rodada)`)
    }
    return { spec, checkouts, git, escrever, entregar, lista: (raiz: string) => readFileSync(join(raiz, 'tasks/prd-exemplo/tasks.md'), 'utf8') }
  }

  it('abrir dá à linha o ambiente de teste dela e tira o carimbo e o quadro que vieram copiados', () => {
    const { spec, checkouts } = andares()
    const l2 = checkouts.get(2) ?? ''
    expect(readFileSync(join(l2, '.processo/ambiente'), 'utf8')).toBe('2\n')
    expect(existsSync(join(l2, '.processo/portao.json'))).toBe(false)
    expect(existsSync(join(l2, '.processo/linhas.json'))).toBe(false)
    expect(lerQuadro(spec)?.linhas.map(({ numero, tarefa: emCurso }) => [numero, emCurso])).toEqual([[1, null], [2, null]])
    expect(abrir(spec, 4, l2, { instalar: false }).texto).toMatch(/inteiro de 1 a 3/)
    expect(abrir(spec, 3, l2, { instalar: false }).texto).toMatch(/a linha 3 é a spec\/exemplo--l3/)
    // Do checkout de uma linha, nada: o quadro mora no andar da spec.
    expect(abrir(l2, 1, l2, { instalar: false }).texto).toMatch(/roda no andar da spec/)
    expect(quadro(l2)).toEqual({ codigo: 1, texto: expect.stringMatching(/^RECUSADO: este comando roda no andar da spec/) as string })
    expect(quadro(spec).codigo).toBe(0)
  })

  it('o quadro diz quem parte, e a partida recusa o que não corre junto', () => {
    const { spec } = andares()
    expect(lerPlano(spec, 'exemplo').map(({ numero, paralelaCom, arquivos }) => [numero, paralelaCom, arquivos])).toEqual([
      [1, [], []],
      [2, [3], ['apps/web/a.ts']],
      [3, [2], ['apps/web/b.ts']],
      [4, [], ['apps/web/c.ts']],
    ])
    expect(textoDoQuadro(spec)).toContain('Partem agora: linha 1 → 2.0; linha 2 → 3.0')
    expect(textoDoQuadro(spec)).toContain('Presas: 4.0 (espera 2.0)')
    expect(partida(spec, 1, '2').texto).toContain('terminais: Implementador e Mesa')
    expect(partida(spec, 2, '4.0').texto).toMatch(/a 4\.0 não parte agora: espera 2\.0/)
    expect(partida(spec, 2, '2').texto).toMatch(/já corre em outra linha/)
    expect(partida(spec, 1, '3').texto).toMatch(/a linha 1 está com a tarefa 2\.0/)
    expect(partida(spec, 2, '1').texto).toMatch(/já está concluída/)
    expect(partida(spec, 2, '3').texto).toContain('terminais: Implementador 2 e Mesa 2')
    expect(textoDoQuadro(spec)).toContain('linha 2: tarefa 3.0')
    expect(textoDoQuadro(spec)).toMatch(/linha 1: tarefa 2\.0 desde \d\d:\d\d/)
    expect(textoDoQuadro(spec)).not.toContain('Partem agora')
  })

  it('duas linhas se encontram na spec: cada commit de tarefa chega inteiro, e a segunda traz a primeira', () => {
    const { spec, checkouts, git, escrever, entregar, lista } = andares()
    partida(spec, 1, '2')
    partida(spec, 2, '3')
    entregar(1, 2, { 'apps/web/a.ts': 'a\n' })
    entregar(2, 3, { 'apps/web/b.ts': 'b\n' })
    // O diário é o único arquivo que o Orquestrador mexe no andar da spec, e o encontro o leva.
    escrever(spec, 'tasks/prd-exemplo/estado.md', '# Estado\n\n2.0 concluída\n')
    // Um documento a meio, do Arquiteto, fica como está: o encontro não o leva nem para por ele.
    escrever(spec, 'tasks/prd-exemplo/techspec.md', 'a meio\n')

    const primeiro = encontro(spec, 1, { push: false })
    expect(primeiro.codigo, primeiro.texto).toBe(0)
    expect(primeiro.texto).toContain('linha 1: ociosa')
    // A 4.0 já tem a dependência concluída, mas o Arquiteto não a autorizou com a 3.0, que ainda corre.
    expect(primeiro.texto).toContain('Presas: 4.0 (o tasks.md não autoriza a 4.0 em paralelo com a 3.0)')
    expect(git(spec, 'status', '--porcelain')).toBe('?? tasks/prd-exemplo/techspec.md')
    expect(git(spec, 'log', '-1', '--format=%s')).toBe('Registra o estado de exemplo depois da tarefa 2.0')
    expect(git(spec, 'show', '--name-only', '--format=', 'HEAD')).toBe('tasks/prd-exemplo/estado.md')

    const segundo = encontro(spec, 2, { push: false })
    expect(segundo.codigo, segundo.texto).toBe(0)
    expect(existsSync(join(spec, 'apps/web/a.ts')) && existsSync(join(spec, 'apps/web/b.ts'))).toBe(true)
    expect(lista(spec)).toContain('- [x] **2.0 — a tela A**')
    expect(lista(spec)).toContain('- [x] **3.0 — a tela B**')
    expect(lista(spec)).toContain('  - [x] 3.1 um')
    expect(lista(spec)).toContain('- [ ] **4.0 — o que depende da A**')
    // Os dois commits de tarefa estão na spec como foram feitos, com as revisões.
    const titulos = git(spec, 'log', '--format=%s').split('\n')
    expect(titulos).toEqual(expect.arrayContaining(['Entrega (tarefa 2.0)', 'Entrega (tarefa 3.0)']))
    expect(lerQuadro(spec)?.linhas.every((linha) => linha.tarefa === null)).toBe(true)

    // A linha 1 parte de novo já com o que a 2 entregou.
    expect(partida(spec, 1, '4').codigo).toBe(0)
    expect(existsSync(join(checkouts.get(1) ?? '', 'apps/web/b.ts'))).toBe(true)
  })

  it('o encontro recusa o que não é commit de tarefa revisado, e nada muda', () => {
    const { spec, checkouts, git, escrever, entregar } = andares([1])
    const l1 = checkouts.get(1) ?? ''
    expect(encontro(spec, 1, { push: false }).texto).toMatch(/não tem trabalho em curso/)
    partida(spec, 1, '2')
    expect(encontro(spec, 1, { push: false }).texto).toMatch(/nenhum commit novo/)
    escrever(l1, 'apps/web/a.ts', 'a\n')
    expect(encontro(spec, 1, { push: false }).texto).toMatch(/árvore da linha 1 não está limpa/)
    git(l1, 'add', '-A')
    git(l1, 'commit', '-q', '-m', 'Entrega (tarefa 3.0)\n\nRevisões: test-engineer APROVADO (1ª rodada)')
    expect(encontro(spec, 1, { push: false }).texto).toMatch(/leva código sem \(tarefa 2\.0\) no título: "Entrega \(tarefa 3\.0\)"/)
    git(l1, 'commit', '-q', '--amend', '-m', 'Entrega (tarefa 2.0)')
    expect(encontro(spec, 1, { push: false }).texto).toMatch(/não tem a linha "Revisões:"/)
    git(l1, 'commit', '-q', '--amend', '-m', 'Arruma (correção 2026-10-11-outra)\n\nRevisões: test-engineer APROVADO (1ª rodada)')
    expect(encontro(spec, 1, { push: false }).texto).toMatch(/falta o commit com \(tarefa 2\.0\) no título/)
    // Commit só de documento não precisa de marca; o de código, sim, cada um.
    escrever(l1, 'tasks/prd-exemplo/nota.md', 'nota\n')
    git(l1, 'add', '-A')
    git(l1, 'commit', '-q', '-m', 'Anota')
    entregar(1, 2, { 'apps/web/a2.ts': 'a\n' })
    escrever(spec, 'apps/web/solto.ts', 'código no andar da spec\n')
    expect(encontro(spec, 1, { push: false }).texto).toMatch(/andar da spec tem código alterado, e nele ninguém implementa:\n\?\? apps\/web\/solto\.ts/)
    expect(git(spec, 'log', '-1', '--format=%s')).toBe('Abre exemplo')
    expect(lerQuadro(spec)?.linhas[0]?.tarefa).toBe(2)
  })

  it('conflito de código para o encontro: nada muda, e o conserto custa só os arquivos em conflito', () => {
    const { spec, checkouts, git, escrever, entregar } = andares()
    const l2 = checkouts.get(2) ?? ''
    partida(spec, 1, '2')
    partida(spec, 2, '3')
    entregar(1, 2, { 'apps/web/a.ts': 'a\n', 'apps/web/registro.ts': 'export const telas = [\n  a,\n]\n' })
    entregar(2, 3, { 'apps/web/b.ts': 'b\n', 'apps/web/registro.ts': 'export const telas = [\n  b,\n]\n' })
    expect(encontro(spec, 1, { push: false }).codigo).toBe(0)

    const antes = git(l2, 'rev-parse', 'HEAD')
    const parado = encontro(spec, 2, { push: false })
    expect(parado.codigo).toBe(4)
    expect(parado.texto).toContain('CONFLITO no encontro da linha 2 (tarefa 3.0): apps/web/registro.ts')
    expect(parado.texto).toContain('slug encontro-3')
    expect(git(l2, 'rev-parse', 'HEAD')).toBe(antes)
    expect(git(l2, 'status', '--porcelain')).toBe('')
    expect(lerQuadro(spec)?.linhas.find((linha) => linha.numero === 2)?.tarefa).toBe(3)

    // O conserto, como o Implementador da linha faz: traz a spec, resolve, e o hook cobra só o que divergiu.
    expect(() => git(l2, 'merge', '--no-edit', 'spec/exemplo')).toThrow()
    expect(arquivosAlterados(l2).filter((arquivo) => arquivo.startsWith('apps/'))).toEqual(['apps/web/registro.ts'])
    escrever(l2, 'apps/web/registro.ts', 'export const telas = [\n  a,\n  b,\n]\n')
    git(l2, 'add', '-A')
    git(l2, 'commit', '-q', '-m', 'Junta as telas A e B no registro (correção 2026-10-11-encontro-3)\n\nRevisões: test-engineer APROVADO (1ª rodada), revisor-geral APROVADO (1ª rodada)')

    // O conserto é mais um commit da linha: o da tarefa continua lá, e o encontro leva os dois.
    const depois = encontro(spec, 2, { push: false })
    expect(depois.codigo, depois.texto).toBe(0)
    expect(readFileSync(join(spec, 'apps/web/registro.ts'), 'utf8')).toBe('export const telas = [\n  a,\n  b,\n]\n')
    expect(git(spec, 'log', '--format=%s')).toContain('Entrega (tarefa 3.0)')
  })

  it('conflito só na lista de tarefas é resolvido pelo encontro: a lista da spec, com a tarefa da linha marcada', () => {
    const { spec, git, entregar, lista } = andares()
    partida(spec, 1, '2')
    partida(spec, 2, '3')
    entregar(1, 2, { 'apps/web/a.ts': 'a\n' })
    entregar(2, 3, { 'apps/web/b.ts': 'b\n' })
    expect(encontro(spec, 1, { push: false }).codigo).toBe(0)
    // As tarefas 2.0 e 3.0 são vizinhas na lista, sem linha em branco entre elas: o merge do git para aí.
    const resultado = encontro(spec, 2, { push: false })
    expect(resultado.codigo, resultado.texto).toBe(0)
    expect(lista(spec)).toBe(marcarTarefaFeita(marcarTarefaFeita(TASKS, 2), 3))
    expect(git(spec, 'status', '--porcelain')).toBe('')
  })

  it('correção corre numa linha e encontra a spec com a marca de correção', () => {
    const { spec, entregar } = andares([1])
    expect(partida(spec, 1, 'correcao:esteira-vermelha').texto).toContain('correção esteira-vermelha')
    entregar(1, 0, { 'apps/web/conserto.ts': 'c\n' }, '(correção 2026-10-11-esteira-vermelha)')
    const resultado = encontro(spec, 1, { push: false })
    expect(resultado.codigo, resultado.texto).toBe(0)
    expect(existsSync(join(spec, 'apps/web/conserto.ts'))).toBe(true)
    expect(partida(spec, 1, 'qualquer').texto).toMatch(/não é tarefa \(5 ou 5\.0\) nem correção/)
  })

  it('a correção avulsa se confere no andar dela: marca, revisões, árvore limpa e push', () => {
    const base = mkdtempSync(join(tmpdir(), 'conferir-'))
    pastas.push(base)
    const [origem, andar] = [join(base, 'origem.git'), join(base, 'andar')]
    const git = (raiz: string, ...args: string[]) => execFileSync('git', args, { cwd: raiz, encoding: 'utf8', stdio: 'pipe' }).trim()
    execFileSync('git', ['init', '-q', '--bare', '-b', 'develop', origem])
    execFileSync('git', ['clone', '-q', origem, andar], { stdio: 'pipe' })
    git(andar, 'config', 'user.name', 'teste')
    git(andar, 'config', 'user.email', 'teste@exemplo.invalid')
    git(andar, 'commit', '-q', '--allow-empty', '-m', 'base')
    git(andar, 'push', '-q', 'origin', 'HEAD:develop')
    git(andar, 'checkout', '-q', '-b', 'correcao/2026-10-11-fuso')
    expect(conferir(andar).texto).toMatch(/nenhum commit novo/)
    mkdirSync(join(andar, 'apps'))
    writeFileSync(join(andar, 'apps/fuso.ts'), 'a\n')
    git(andar, 'add', '-A')
    git(andar, 'commit', '-q', '-m', 'Corrige o fuso (correção 2026-10-11-fuso)\n\nRevisões: test-engineer APROVADO (1ª rodada)')
    expect(conferir(andar).texto).toMatch(/o push não foi feito/)
    git(andar, 'push', '-q', '-u', 'origin', 'HEAD')
    expect(conferir(andar).codigo).toBe(0)
    writeFileSync(join(andar, 'apps/da-tarefa.ts'), 'em curso\n')
    expect(conferir(andar).texto).toMatch(/a árvore não está limpa/)
    expect(conferir(andar, { emCurso: true }).texto).toMatch(/árvore com 1 arquivo\(s\) da tarefa em curso e push feito/)
  })

  describe('conferir na branch da spec', () => {
    const REVISOES = '\n\nRevisões: test-engineer APROVADO (1ª rodada), revisor-geral APROVADO (1ª rodada)'

    /** Um andar de spec com a `develop` no GitHub, e o que o Implementador faz nele: o commit, com ou sem marca e revisões. */
    function andarDaSpec(branch = 'spec/exemplo') {
      const base = mkdtempSync(join(tmpdir(), 'conferir-spec-'))
      pastas.push(base)
      const [origem, andar] = [join(base, 'origem.git'), join(base, 'andar')]
      const git = (...args: string[]) => execFileSync('git', args, { cwd: andar, encoding: 'utf8', stdio: 'pipe' }).trim()
      execFileSync('git', ['init', '-q', '--bare', '-b', 'develop', origem])
      execFileSync('git', ['clone', '-q', origem, andar], { stdio: 'pipe' })
      git('config', 'user.name', 'teste')
      git('config', 'user.email', 'teste@exemplo.invalid')
      git('commit', '-q', '--allow-empty', '-m', 'base')
      git('push', '-q', 'origin', 'HEAD:develop')
      git('checkout', '-q', '-b', branch)
      const commit = (arquivo: string, titulo: string, corpo = REVISOES) => {
        mkdirSync(join(andar, 'apps'), { recursive: true })
        writeFileSync(join(andar, 'apps', arquivo), `${titulo}\n`)
        git('add', '-A')
        git('commit', '-q', '-m', `${titulo}${corpo}`)
      }
      return { andar, git, commit, enviar: () => git('push', '-q', '-u', 'origin', 'HEAD') }
    }

    it('aceita a correção que vem depois das tarefas da spec, que a develop ainda não tem', () => {
      const { andar, commit, enviar } = andarDaSpec()
      commit('a.ts', 'Entrega a tela A (tarefa 2.0)')
      commit('b.ts', 'Entrega a tela B (tarefa 3.0)')
      commit('conserto.ts', 'Corrige o conserto (correção 2026-10-18-conserto)')
      enviar()
      const resultado = conferir(andar)
      expect(resultado.codigo, resultado.texto).toBe(0)
      expect(resultado.texto).toContain('árvore limpa e push feito')
    })

    it('recusa quando o último commit com código é de tarefa, e não a correção que se esperava', () => {
      const { andar, commit, enviar } = andarDaSpec()
      commit('conserto.ts', 'Corrige o conserto (correção 2026-10-18-conserto)')
      commit('a.ts', 'Entrega a tela A (tarefa 2.0)')
      enviar()
      expect(conferir(andar).texto).toMatch(/falta o commit com \(correção <slug>\) no título, e ele tem de ser o último com código/)
    })

    it('um commit de documento depois do código não esconde que o último commit com código era de tarefa', () => {
      const { andar, commit, enviar, git } = andarDaSpec()
      commit('a.ts', 'Entrega a tela A (tarefa 2.0)')
      mkdirSync(join(andar, 'tasks'))
      writeFileSync(join(andar, 'tasks', 'estado.md'), 'estado\n')
      git('add', '-A')
      git('commit', '-q', '-m', 'Registra o estado')
      enviar()
      expect(conferir(andar).texto).toMatch(/falta o commit com \(correção <slug>\) no título, e ele tem de ser o último com código/)
    })

    it('commit com código sem marca, ou sem a linha Revisões, continua recusado na spec', () => {
      const semMarca = andarDaSpec()
      semMarca.commit('a.ts', 'Entrega a tela A (tarefa 2.0)')
      semMarca.commit('solto.ts', 'Conserta sem marca')
      semMarca.commit('conserto.ts', 'Corrige o conserto (correção 2026-10-18-conserto)')
      semMarca.enviar()
      expect(conferir(semMarca.andar).texto).toMatch(/leva código sem \(tarefa N\.0\) nem \(correção <slug>\) no título: "Conserta sem marca"/)

      const semRevisoes = andarDaSpec()
      semRevisoes.commit('a.ts', 'Entrega a tela A (tarefa 2.0)', '')
      semRevisoes.commit('conserto.ts', 'Corrige o conserto (correção 2026-10-18-conserto)')
      semRevisoes.enviar()
      expect(conferir(semRevisoes.andar).texto).toMatch(/não tem a linha "Revisões:"/)
    })

    it('uma spec só com documento e um commit sem marca é recusada: não há commit com código, e portanto nenhuma correção', () => {
      const { andar, git, enviar } = andarDaSpec()
      mkdirSync(join(andar, 'tasks'))
      writeFileSync(join(andar, 'tasks', 'prd.md'), 'prd\n')
      git('add', '-A')
      git('commit', '-q', '-m', 'Abre o PRD')
      enviar()
      expect(conferir(andar).texto).toBe('RECUSADO: falta o commit com (correção <slug>) no título, e ele tem de ser o último com código')
    })

    it('o merge do encontro não é cobrado pelo código que trouxe do outro lado, mas o que ele resolveu à mão é', () => {
      const lado = (marca: string) => {
        const spec = andarDaSpec()
        spec.commit('a.ts', 'Entrega a tela A (tarefa 2.0)')
        spec.git('checkout', '-q', '-b', 'lado', 'develop')
        spec.commit('a.ts', 'Entrega a tela B (tarefa 3.0)')
        spec.git('checkout', '-q', 'spec/exemplo')
        expect(() => spec.git('merge', '--no-edit', 'lado')).toThrow()
        writeFileSync(join(spec.andar, 'apps', 'a.ts'), 'resolvido\n')
        spec.git('add', '-A')
        spec.git('commit', '-q', '-m', `Junta as telas${marca}${marca === '' ? '' : REVISOES}`)
        spec.commit('conserto.ts', 'Corrige o conserto (correção 2026-10-18-conserto)')
        spec.enviar()
        return spec.andar
      }
      expect(conferir(lado('')).texto).toMatch(/leva código sem \(tarefa N\.0\) nem \(correção <slug>\) no título: "Junta as telas"/)
      const marcado = conferir(lado(' (correção 2026-10-18-encontro-3)'))
      expect(marcado.codigo, marcado.texto).toBe(0)
    })

    it('o merge que resolve o conflito ficando com um lado é cobrado, porque descartou o código do outro', () => {
      const spec = andarDaSpec()
      spec.commit('a.ts', 'Entrega a tela A (tarefa 2.0)')
      spec.git('checkout', '-q', '-b', 'lado', 'develop')
      spec.commit('a.ts', 'Entrega a tela B (tarefa 3.0)')
      spec.git('checkout', '-q', 'spec/exemplo')
      expect(() => spec.git('merge', '--no-edit', 'lado')).toThrow()
      spec.git('checkout', '--ours', 'apps/a.ts')
      spec.git('add', '-A')
      spec.git('commit', '-q', '-m', 'Junta as telas')
      spec.commit('conserto.ts', 'Corrige o conserto (correção 2026-10-18-conserto)')
      spec.enviar()
      expect(conferir(spec.andar).texto).toMatch(/leva código sem \(tarefa N\.0\) nem \(correção <slug>\) no título: "Junta as telas"/)
    })

    it('com duas linhas que mexem em trechos diferentes do mesmo arquivo, o merge limpo do encontro não é cobrado', () => {
      const { spec, entregar, git, escrever } = andares()
      const base = mkdtempSync(join(tmpdir(), 'conferir-linhas-'))
      pastas.push(base)
      execFileSync('git', ['init', '-q', '--bare', '-b', 'spec/exemplo', join(base, 'origem.git')])
      // O arquivo comum entra antes da `develop`, e por isso o `conferir` não o vê; a partida leva o arquivo às linhas.
      // Há espaço entre os trechos: mudança em linhas vizinhas vira conflito, e aqui o merge tem de ser limpo.
      const comum = (trocas: Record<number, string> = {}) =>
        `${Array.from({ length: 12 }, (_, i) => trocas[i + 1] ?? `linha ${String(i + 1)}`).join('\n')}\n`
      escrever(spec, 'apps/web/comum.ts', comum())
      git(spec, 'add', '-A')
      git(spec, 'commit', '-q', '-m', 'Abre o comum')
      git(spec, 'branch', 'develop')
      git(spec, 'remote', 'add', 'origin', join(base, 'origem.git'))
      expect(partida(spec, 1, '2').codigo).toBe(0)
      expect(partida(spec, 2, '3').codigo).toBe(0)
      entregar(1, 2, { 'apps/web/comum.ts': comum({ 2: 'da linha 1' }) })
      entregar(2, 3, { 'apps/web/comum.ts': comum({ 9: 'da linha 2' }) })
      expect(encontro(spec, 1, { push: false }).codigo).toBe(0)
      expect(encontro(spec, 2, { push: false }).codigo).toBe(0)
      // O encontro da linha 2 é um merge que juntou o arquivo sozinho, e o conflito do tasks.md ele resolveu.
      expect(git(spec, 'rev-list', '--merges', 'develop..HEAD')).not.toBe('')
      expect(readFileSync(join(spec, 'apps/web/comum.ts'), 'utf8')).toBe(comum({ 2: 'da linha 1', 9: 'da linha 2' }))
      escrever(spec, 'apps/web/conserto.ts', 'c\n')
      git(spec, 'add', '-A')
      git(spec, 'commit', '-q', '-m', 'Corrige o conserto (correção 2026-10-18-conserto)\n\nRevisões: test-engineer APROVADO (1ª rodada), revisor-geral APROVADO (1ª rodada)')
      git(spec, 'push', '-q', '-u', 'origin', 'spec/exemplo')
      const resultado = conferir(spec)
      expect(resultado.codigo, resultado.texto).toBe(0)
    })

    it('com duas linhas, o merge que o encontro faz não derruba a conferência da correção que vem depois', () => {
      const { spec, entregar, git, escrever } = andares()
      const base = mkdtempSync(join(tmpdir(), 'conferir-linhas-'))
      pastas.push(base)
      execFileSync('git', ['init', '-q', '--bare', '-b', 'spec/exemplo', join(base, 'origem.git')])
      git(spec, 'branch', 'develop')
      git(spec, 'remote', 'add', 'origin', join(base, 'origem.git'))
      expect(partida(spec, 1, '2').codigo).toBe(0)
      expect(partida(spec, 2, '3').codigo).toBe(0)
      entregar(1, 2, { 'apps/web/a.ts': 'a\n' })
      entregar(2, 3, { 'apps/web/b.ts': 'b\n' })
      expect(encontro(spec, 1, { push: false }).codigo).toBe(0)
      expect(encontro(spec, 2, { push: false }).codigo).toBe(0)
      // O histórico de verdade: o encontro da linha 2 é um merge, cujo primeiro pai é a linha, sem o código da linha 1.
      expect(git(spec, 'rev-list', '--merges', 'develop..HEAD')).not.toBe('')
      escrever(spec, 'apps/web/conserto.ts', 'c\n')
      git(spec, 'add', '-A')
      git(spec, 'commit', '-q', '-m', 'Corrige o conserto (correção 2026-10-18-conserto)\n\nRevisões: test-engineer APROVADO (1ª rodada), revisor-geral APROVADO (1ª rodada)')
      git(spec, 'push', '-q', '-u', 'origin', 'spec/exemplo')
      const resultado = conferir(spec)
      expect(resultado.codigo, resultado.texto).toBe(0)
    })

    it('fora da spec, na correção avulsa, a marca de tarefa continua não valendo', () => {
      const { andar, commit, enviar } = andarDaSpec('correcao/2026-10-18-conserto')
      commit('a.ts', 'Entrega a tela A (tarefa 2.0)')
      commit('conserto.ts', 'Corrige o conserto (correção 2026-10-18-conserto)')
      enviar()
      expect(conferir(andar).texto).toMatch(/leva código sem \(correção <slug>\) no título: "Entrega a tela A \(tarefa 2\.0\)"/)

      // Nem o merge limpo é isentado lá: a isenção é do merge do encontro, que só existe na spec.
      const comMerge = andarDaSpec('correcao/2026-10-18-com-merge')
      comMerge.commit('conserto.ts', 'Corrige o conserto (correção 2026-10-18-com-merge)')
      comMerge.git('checkout', '-q', '-b', 'lado', 'develop')
      comMerge.commit('outro.ts', 'Corrige o outro (correção 2026-10-18-com-merge)')
      comMerge.git('checkout', '-q', 'correcao/2026-10-18-com-merge')
      comMerge.git('merge', '--no-edit', 'lado')
      comMerge.enviar()
      expect(conferir(comMerge.andar).texto).toMatch(/leva código sem \(correção <slug>\) no título: "Merge branch 'lado'/)

      // E a ausência da correção, lá, não pede que ela seja a última com código: só que exista.
      const semCorrecao = andarDaSpec('correcao/2026-10-18-outro')
      writeFileSync(join(semCorrecao.andar, 'nota.md'), 'nota\n')
      semCorrecao.git('add', '-A')
      semCorrecao.git('commit', '-q', '-m', 'Registra a nota')
      semCorrecao.enviar()
      expect(conferir(semCorrecao.andar).texto).toBe('RECUSADO: falta o commit com (correção <slug>) no título')
    })
  })

  it('fechar só com tudo encontrado, e desfaz o quadro', () => {
    const { spec, entregar } = andares([1])
    partida(spec, 1, '2')
    expect(fechar(spec, { push: false }).texto).toMatch(/a linha 1 está com a tarefa 2\.0/)
    entregar(1, 2, { 'apps/web/a.ts': 'a\n' })
    encontro(spec, 1, { push: false })
    const fechado = fechar(spec, { push: false })
    expect(fechado.codigo, fechado.texto).toBe(0)
    expect(fechado.texto).toContain('maestri floor delete')
    expect(existsSync(join(spec, CAMINHO_DO_QUADRO))).toBe(false)
  })
})
