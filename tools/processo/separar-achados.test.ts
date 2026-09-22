import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { conferirPlano, migrar, planejarMigracao, separarBlocos } from './separar-achados.ts'

// A migração apaga um arquivo que sustenta auditoria de tarefa — 646 KB e 158 rodadas no caso do F1.
// Ela ficou no repositório para rodar de novo quando uma branch antiga trouxer o formato de volta no
// merge, então "roda duas vezes" é caso de uso, não borda.

const bloco = (revisor: string, rodada: number, fim: string, documento: string, corpo: string) =>
  `## ${revisor} · ${String(rodada)}ª rodada · REPROVADO · ${fim} · \`${documento}\`\n\n${corpo}\n`

const arquivoAntigo = (...blocos: string[]) => `# Achados das revisões\n\nEscrito pelo hook.\n\n${blocos.join('\n')}`

function repositorio() {
  const raiz = mkdtempSync(join(tmpdir(), 'separar-'))
  mkdirSync(join(raiz, 'tasks/prd-exemplo'), { recursive: true })
  return raiz
}

const blocosDe = (raiz: string, caminho: string) => separarBlocos(readFileSync(join(raiz, caminho), 'utf8'))
const linhasDoIndice = (raiz: string, pasta: string) =>
  readFileSync(join(raiz, pasta, 'indice.md'), 'utf8')
    .split('\n')
    .filter((linha) => /^\| \d{4}-/.test(linha))

describe('migração do arquivo único para achados por documento', () => {
  it('separa por documento, com uma linha de índice por bloco', () => {
    const raiz = repositorio()
    const antigo = join(raiz, 'tasks/prd-exemplo/achados-revisoes.md')
    writeFileSync(
      antigo,
      arquivoAntigo(
        bloco('tenancy-guardian', 1, '2026-09-13 10:05:00', 'tasks/prd-exemplo/3_task.md', 'Bloqueantes:\n- query sem escopo de escola'),
        bloco('test-engineer', 1, '2026-09-14 11:00:00', 'tasks/prd-exemplo/20_task.md', 'Bloqueantes:\n- o vencimento não tem folga de relógio'),
      ),
    )
    migrar(antigo, raiz)

    expect(existsSync(antigo)).toBe(false)
    expect(readdirSync(join(raiz, 'tasks/prd-exemplo/achados')).sort()).toEqual(['20_task.md', '3_task.md', 'indice.md'])
    expect(blocosDe(raiz, 'tasks/prd-exemplo/achados/3_task.md')).toHaveLength(1)
    expect(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/3_task.md'), 'utf8')).toContain('query sem escopo de escola')
    expect(readFileSync(join(raiz, 'tasks/prd-exemplo/achados/20_task.md'), 'utf8')).not.toContain('query sem escopo de escola')
    expect(linhasDoIndice(raiz, 'tasks/prd-exemplo/achados')).toHaveLength(2)
  })

  it('rodando de novo sobre pasta já migrada, nada do que estava lá se perde', () => {
    // O caso pelo qual o script ficou no repositório: branch antiga traz o formato único no merge.
    const raiz = repositorio()
    mkdirSync(join(raiz, 'tasks/prd-exemplo/achados'), { recursive: true })
    const antigo = join(raiz, 'tasks/prd-exemplo/achados-revisoes.md')
    const deAntes = bloco('test-engineer', 1, '2026-09-13 09:00:00', 'tasks/prd-exemplo/9_task.md', 'Bloqueantes:\n- o primeiro achado, de antes')

    writeFileSync(antigo, arquivoAntigo(deAntes))
    migrar(antigo, raiz)
    expect(linhasDoIndice(raiz, 'tasks/prd-exemplo/achados')).toHaveLength(1)

    // O merge devolve o formato antigo, com um bloco novo e o mesmo bloco de antes.
    writeFileSync(antigo, arquivoAntigo(deAntes, bloco('revisor-geral', 1, '2026-09-13 12:00:00', 'tasks/prd-exemplo/9_task.md', 'Bloqueantes:\n- o achado que veio no merge')))
    migrar(antigo, raiz)

    const conteudo = readFileSync(join(raiz, 'tasks/prd-exemplo/achados/9_task.md'), 'utf8')
    expect(conteudo).toContain('o primeiro achado, de antes')
    expect(conteudo).toContain('o achado que veio no merge')
    // Nem perdeu o de antes, nem duplicou: dois blocos, duas linhas de índice.
    expect(blocosDe(raiz, 'tasks/prd-exemplo/achados/9_task.md')).toHaveLength(2)
    expect(linhasDoIndice(raiz, 'tasks/prd-exemplo/achados')).toHaveLength(2)
  })

  it('`##` dentro do texto do revisor não vira bloco novo', () => {
    // No F1, `grep -c '^## '` devolvia 183 num arquivo de 158 rodadas: o resto é texto do revisor.
    const raiz = repositorio()
    const antigo = join(raiz, 'tasks/prd-exemplo/achados-revisoes.md')
    const corpo = 'VEREDITO: REPROVADO\n\n## O furo\n\nA query não tem escopo.\n\n## Bloqueantes\n\n- corrigir o repository'
    writeFileSync(antigo, arquivoAntigo(bloco('tenancy-guardian', 1, '2026-09-13 10:05:00', 'tasks/prd-exemplo/3_task.md', corpo)))
    migrar(antigo, raiz)

    const conteudo = readFileSync(join(raiz, 'tasks/prd-exemplo/achados/3_task.md'), 'utf8')
    expect(separarBlocos(conteudo)).toHaveLength(1)
    expect(conteudo).toContain('## O furo')
    expect(conteudo).toContain('## Bloqueantes')
    expect(linhasDoIndice(raiz, 'tasks/prd-exemplo/achados')).toHaveLength(1)
  })

  it('recusa e não apaga a origem quando a conservação não fecha', () => {
    const raiz = repositorio()
    const antigo = join(raiz, 'tasks/prd-exemplo/achados-revisoes.md')
    const repetido = bloco('test-engineer', 1, '2026-09-13 09:00:00', 'tasks/prd-exemplo/9_task.md', 'Bloqueantes:\n- um achado')
    writeFileSync(antigo, arquivoAntigo(repetido, repetido))

    expect(() => migrar(antigo, raiz)).toThrow(/repetido/)
    // A origem é a única cópia até a escrita terminar.
    expect(existsSync(antigo)).toBe(true)
    expect(existsSync(join(raiz, 'tasks/prd-exemplo/achados/9_task.md'))).toBe(false)

    // E a conferência pega perda de bloco mesmo que o plano venha errado de outro caminho.
    const plano = planejarMigracao(arquivoAntigo(repetido), new Map(), '')
    expect(() => {
      conferirPlano({ ...plano, arquivos: new Map() }, '')
    }).toThrow(/conservação falhou/)
  })

  it('a conservação falha depois de planejar: a origem sobrevive e o destino não é tocado', () => {
    // O `rmSync` é a última linha de `migrar`, depois de tudo escrito e conferido. Sem um caso que
    // chegue a `conferirPlano` **dentro** de `migrar`, mover o `rmSync` para antes dele passa
    // despercebido — e ele apaga 646 KB de achado que não tem outra cópia.
    //
    // O caminho sem costura artificial: o destino já traz o mesmo bloco duas vezes, o que o merge
    // que este script existe para absorver produz. `jaExistiam` conta a identidade uma vez e
    // `separarBlocos` conta duas, então a conservação não fecha.
    const raiz = repositorio()
    const pasta = join(raiz, 'tasks/prd-exemplo/achados')
    mkdirSync(pasta, { recursive: true })
    const repetido = bloco('test-engineer', 1, '2026-09-13 09:00:00', 'tasks/prd-exemplo/9_task.md', 'Bloqueantes:\n- o achado duplicado pelo merge')
    const destino = join(pasta, '9_task.md')
    writeFileSync(destino, `# Achados\n\n${repetido}\n${repetido}`)
    const indiceAntes = '| 2026-09-13 09:00:00 | `test-engineer` | 1ª | REPROVADO | `9_task` | o achado duplicado pelo merge |\n'
    writeFileSync(join(pasta, 'indice.md'), indiceAntes)
    const antes = join(raiz, 'tasks/prd-exemplo/achados-revisoes.md')
    writeFileSync(antes, arquivoAntigo(bloco('revisor-geral', 1, '2026-09-13 12:00:00', 'tasks/prd-exemplo/9_task.md', 'Bloqueantes:\n- o achado que veio no merge')))

    expect(() => migrar(antes, raiz)).toThrow(/conservação falhou/)
    // A origem é a única cópia do que ela traz: não pode sumir com a conferência vermelha.
    expect(existsSync(antes)).toBe(true)
    // E o destino fica exatamente como estava: nada meio escrito.
    expect(blocosDe(raiz, 'tasks/prd-exemplo/achados/9_task.md')).toHaveLength(2)
    expect(readFileSync(destino, 'utf8')).not.toContain('o achado que veio no merge')
    expect(readFileSync(join(pasta, 'indice.md'), 'utf8')).toBe(indiceAntes)
  })

  it('o resumo do índice sai do corpo do bloco, não do cabeçalho', () => {
    const raiz = repositorio()
    const antigo = join(raiz, 'tasks/prd-exemplo/achados-revisoes.md')
    writeFileSync(
      antigo,
      arquivoAntigo(
        bloco('infra-guardian', 2, '2026-09-13 10:05:00', 'tasks/prd-exemplo/3_task.md', 'VEREDITO: APROVADO\n\nBloqueantes: nenhum\n\nRecomendações:\n- a fila não tem limite por escola'),
      ),
    )
    migrar(antigo, raiz)

    const linha = linhasDoIndice(raiz, 'tasks/prd-exemplo/achados')[0] ?? ''
    expect(linha).toContain('a fila não tem limite por escola')
    expect(linha).not.toMatch(/nenhum/)
    expect(linha).toContain('`infra-guardian`')
    expect(linha).toContain('2ª')
  })
})
