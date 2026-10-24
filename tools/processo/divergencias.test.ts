import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { avisoDaDivergenciaSoNoDocumento, avisoDeDivergencia, divergenciasNovas } from './divergencias.ts'

// A M3 da retro da X7: o portão avisa a divergência que ficou só no documento da tarefa. Só informa, como o `--faltando`.

const CABECALHO = '| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |\n|---|---|---|\n'

/** Um `N_task.md` com a seção de divergências e a seção seguinte, que não é dela. */
function documento(linhas: string, depois = '| Isto | não | é divergência |\n'): string {
  return `# Tarefa\n\n## Divergências resolvidas nesta tarefa\n\n${CABECALHO}${linhas}\n## Mutações\n\n${depois}`
}

const UMA = '| O limite passa de 5 para 6 | A medição deu 6 | `techspec.md` §3 |\n'
const OUTRA = '| O nome da função muda | O módulo já tinha um igual | `cenarios.md` C2 |\n'

describe('divergenciasNovas', () => {
  it('a linha que o HEAD já tinha não conta', () => {
    expect(divergenciasNovas(documento(UMA), documento(UMA + OUTRA))).toEqual([OUTRA.trim()])
  })

  it('sem versão no HEAD, toda linha da seção é nova', () => {
    expect(divergenciasNovas(null, documento(UMA + OUTRA))).toEqual([UMA.trim(), OUTRA.trim()])
  })

  it('"nenhuma" não é divergência', () => {
    expect(divergenciasNovas(null, documento('| nenhuma | | |\n'))).toEqual([])
    expect(divergenciasNovas(null, documento('\nNenhuma.\n'))).toEqual([])
  })

  it('o cabeçalho e o separador da tabela não são divergência', () => {
    expect(divergenciasNovas(null, documento(''))).toEqual([])
    expect(divergenciasNovas(null, documento('|---|---|---|\n| : --- | --- |\n'))).toEqual([])
  })

  it('só a seção de divergências conta: a linha da seção seguinte, não', () => {
    expect(divergenciasNovas(documento(UMA), documento(UMA, '| Outra | linha | nova |\n'))).toEqual([])
    // Com a divergência da própria seção ainda nova: a seguinte fica de fora, e a da seção entra.
    expect(divergenciasNovas(null, documento(UMA, '| Outra | linha | nova |\n'))).toEqual([UMA.trim()])
  })

  it('a linha de comentário e a em branco não são divergência', () => {
    expect(divergenciasNovas(null, documento('<!-- escreva aqui -->\n\n'))).toEqual([])
  })

  it('o recuo da linha e o espaço depois do título não escondem a seção nem a divergência', () => {
    // Comentário recuado: sem o `trim` da linha ele passaria por divergência.
    expect(divergenciasNovas(null, documento('  <!-- escreva aqui -->\n'))).toEqual([])
    // A linha recuada que é divergência entra sem o recuo, e a que o HEAD já tinha, com recuo diferente, é a mesma.
    expect(divergenciasNovas(null, documento(`   ${UMA}`))).toEqual([UMA.trim()])
    expect(divergenciasNovas(documento(UMA), documento(`    ${UMA}`))).toEqual([])
    // Título com espaço no fim: sem o `trim` do título a seção some.
    expect(divergenciasNovas(null, documento(UMA).replace('nesta tarefa\n', 'nesta tarefa  \n'))).toEqual([UMA.trim()])
  })

  it('o negrito do "nenhuma" não é divergência', () => {
    expect(divergenciasNovas(null, documento('**Nenhuma.**\n'))).toEqual([])
    expect(divergenciasNovas(null, documento('| **nenhuma** | | |\n'))).toEqual([])
  })

  it('a seção que é a última do documento vai até o fim', () => {
    const ultima = `# Tarefa\n\n## Divergências resolvidas nesta tarefa\n\n${CABECALHO}${UMA.trim()}`
    expect(divergenciasNovas(null, ultima)).toEqual([UMA.trim()])
  })

  it('documento sem a seção não tem divergência', () => {
    expect(divergenciasNovas(null, '# Tarefa\n\n## Mutações\n\n| a | b | c |\n')).toEqual([])
  })

  it('a divergência escrita em texto corrido, e não em tabela, também conta', () => {
    expect(divergenciasNovas(null, documento('O limite passa de 5 para 6.\n'))).toEqual(['O limite passa de 5 para 6.'])
  })
})

describe('avisoDeDivergencia', () => {
  const DOC = 'tasks/prd-x/3_task.md'

  it('com linha nova e a spec parada, avisa e diz o documento, a quantidade e os dois arquivos', () => {
    const aviso = avisoDeDivergencia([UMA.trim(), OUTRA.trim()], DOC, ['tools/a.ts', DOC])
    expect(aviso).toContain(DOC)
    expect(aviso).toContain('2 linhas')
    expect(aviso).toContain('tasks/prd-x/techspec.md')
    expect(aviso).toContain('tasks/prd-x/cenarios.md')
    expect(aviso).toMatch(/só informa/)
    expect(aviso?.endsWith('\n')).toBe(true)
  })

  it('uma linha só, no singular', () => {
    expect(avisoDeDivergencia([UMA.trim()], DOC, [])).toContain('1 linha ')
  })

  it('sem linha nova, sem aviso', () => {
    expect(avisoDeDivergencia([], DOC, [])).toBeNull()
  })

  it('sem aviso quando a techspec.md mudou', () => {
    expect(avisoDeDivergencia([UMA.trim()], DOC, ['tasks/prd-x/techspec.md'])).toBeNull()
  })

  it('sem aviso quando o cenarios.md mudou', () => {
    expect(avisoDeDivergencia([UMA.trim()], DOC, ['tasks/prd-x/cenarios.md'])).toBeNull()
  })

  it('a techspec.md de outra spec não vale', () => {
    expect(avisoDeDivergencia([UMA.trim()], DOC, ['tasks/prd-y/techspec.md', 'tasks/prd-y/cenarios.md', 'techspec.md'])).not.toBeNull()
  })
})

describe('avisoDaDivergenciaSoNoDocumento', () => {
  const DOC = 'tasks/prd-x/3_task.md'

  /** Um repositório com a spec e a tarefa já commitadas, sem divergência. */
  const criados: string[] = []
  afterEach(() => {
    for (const raiz of criados.splice(0)) rmSync(raiz, { recursive: true, force: true })
  })

  function repositorio(): { raiz: string; git: (...argumentos: string[]) => string; escrever: (arquivo: string, conteudo: string) => void } {
    const raiz = mkdtempSync(join(tmpdir(), 'divergencias-'))
    criados.push(raiz)
    const git = (...argumentos: string[]) => execFileSync('git', argumentos, { cwd: raiz, encoding: 'utf8', stdio: 'pipe' })
    const escrever = (arquivo: string, conteudo: string) => {
      mkdirSync(dirname(join(raiz, arquivo)), { recursive: true })
      writeFileSync(join(raiz, arquivo), conteudo)
    }
    git('init', '-q')
    git('config', 'user.email', 'teste@exemplo.com')
    git('config', 'user.name', 'Teste')
    escrever('tasks/prd-x/techspec.md', '# Tech Spec\n')
    escrever('tasks/prd-x/cenarios.md', '# Cenários\n')
    escrever(DOC, documento(''))
    git('add', '-A')
    git('commit', '-q', '-m', 'base')
    return { raiz, git, escrever }
  }

  it('divergência só no documento: avisa', () => {
    const { raiz, escrever } = repositorio()
    escrever(DOC, documento(UMA))
    expect(avisoDaDivergenciaSoNoDocumento(raiz, DOC, [DOC])).toContain('1 linha ')
  })

  it('divergência no documento e na techspec.md: não avisa', () => {
    const { raiz, escrever } = repositorio()
    escrever(DOC, documento(UMA))
    escrever('tasks/prd-x/techspec.md', '# Tech Spec\n\nO limite passa de 5 para 6.\n')
    expect(avisoDaDivergenciaSoNoDocumento(raiz, DOC, [DOC, 'tasks/prd-x/techspec.md'])).toBeNull()
  })

  it('documento sem alteração na seção: não avisa', () => {
    const { raiz } = repositorio()
    expect(avisoDaDivergenciaSoNoDocumento(raiz, DOC, [])).toBeNull()
  })

  it('a linha que o HEAD já tinha não avisa de novo', () => {
    const { raiz, git, escrever } = repositorio()
    escrever(DOC, documento(UMA))
    git('add', '-A')
    git('commit', '-q', '-m', 'divergência registrada')
    expect(avisoDaDivergenciaSoNoDocumento(raiz, DOC, [])).toBeNull()
    escrever(DOC, documento(UMA + OUTRA))
    expect(avisoDaDivergenciaSoNoDocumento(raiz, DOC, [DOC])).toContain('1 linha ')
  })

  it('documento novo: toda linha da seção é nova', () => {
    const { raiz, escrever } = repositorio()
    escrever('tasks/prd-x/4_task.md', documento(UMA + OUTRA))
    expect(avisoDaDivergenciaSoNoDocumento(raiz, 'tasks/prd-x/4_task.md', ['tasks/prd-x/4_task.md'])).toContain('2 linhas')
  })
})

describe('a ligação no portão', () => {
  // `portao-local.ts` executa ao ser importado e rodar o portão num teste custa minutos: a ligação se prova pela leitura do fonte,
  // como as demais (`duracao-do-e2e.test.ts`, `e2e-que-cita-literal.test.ts`).
  const portao = readFileSync(join(import.meta.dirname, 'portao-local.ts'), 'utf8')

  it('o portão imprime o aviso, só informa, e antes de qualquer suíte', () => {
    expect(portao).toContain('  const aviso = avisoDaDivergenciaSoNoDocumento(raiz, documento, arquivosAlterados(raiz))')
    expect(portao).toContain('  if (aviso !== null) process.stdout.write(`\\n${aviso}`)')
    expect(portao.indexOf('avisoDaDivergenciaSoNoDocumento(raiz')).toBeLessThan(portao.indexOf('const dependencias = rodar('))
    // Só informa: o aviso não sai do processo nem grava recusa.
    const trecho = portao.slice(portao.indexOf('avisoDaDivergenciaSoNoDocumento(raiz'), portao.indexOf('const dependencias = rodar('))
    expect(trecho).not.toContain('process.exit')
  })
})
