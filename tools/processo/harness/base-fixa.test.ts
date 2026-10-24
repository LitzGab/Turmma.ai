// A base fixa de contexto fica curta, e as regras que protegem a escola e o aluno continuam sempre carregadas (RF20).
//
// O que todo terminal lê antes de qualquer pedido é o `CLAUDE.md` mais as regras de `.claude/rules/` sem `paths:`: as que
// têm `paths:` só entram quando se lê arquivo do caminho delas. Em 23/10/2026 eram 75 KB; o limite é 40.000 B. Três coisas
// estragam isto sem que nada quebre: o `CLAUDE.md` crescer de novo, uma regra de segurança (a 10, a 20 ou a 70) ganhar
// `paths:` e sumir do contexto, ou um item numerado dessas três ser cortado para a conta fechar. A medida de antes está em
// `__fixtures__/base-fixa-antes.json`, e a conferência compara com ela.
//
// O `paths:` conta quando está no cabeçalho (`---`) do arquivo e traz ao menos um item: `paths:` escrito no corpo da regra
// ou lista vazia não a tiram do contexto. Limite declarado: o teste lê o que está no disco; não prova que o Claude Code
// carrega a regra com `paths:` no subagente (a prova da premissa, feita em 23/10/2026, está em `15_task.md`).
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const RAIZ = join(import.meta.dirname, '..', '..', '..')

const LIMITE_DA_BASE_FIXA = 40_000
const PASTA_DAS_REGRAS = '.claude/rules'
/** As regras que nunca perdem o lugar no contexto, e cujos itens numerados não saem do texto. */
const SEMPRE_CARREGADAS = ['10', '20', '70']
const COM_CAMINHO = ['00', '40', '60', '80']
/** Quantas regras a conferência acha hoje (00, 10, 20, 30, 40, 50, 60, 70, 80). */
const MINIMO_DE_REGRAS = 9

/** As quatro regras que não carregam sozinhas e que as skills de especificação mandam ler por extenso. */
const AS_QUATRO = ['00-arquitetura.md', '40-testes.md', '60-dominio.md', '80-infra-e-carga.md']
const SKILLS_QUE_LEEM_AS_QUATRO = ['criar-prd', 'criar-techspec', 'revisar-spec', 'criar-tasks', 'validar', 'retro']

interface Regra {
  numero: string
  bytes: number
  comPaths: boolean
  itens: string[]
}

interface Antes {
  claudeMdBytes: number
  baseFixaBytes: number
  regrasSemPaths: Record<string, number>
  itensNumerados: Record<string, string[]>
}

const ler = (caminho: string): string | null => {
  try {
    return readFileSync(caminho, 'utf8')
  } catch {
    return null
  }
}

const bytes = (texto: string): number => Buffer.byteLength(texto, 'utf8')

/** `paths:` no cabeçalho do arquivo, com ao menos um item de lista embaixo. */
function temCaminho(texto: string): boolean {
  const cabecalho = /^---\n([\s\S]*?)\n---\n/.exec(texto)?.[1] ?? ''
  return /^paths:[ \t]*\n(?:[ \t]+-[ \t]+\S.*\n)+/m.test(`${cabecalho}\n`)
}

function lerRegras(raiz: string): Regra[] {
  let nomes: string[]
  try {
    nomes = readdirSync(join(raiz, PASTA_DAS_REGRAS))
  } catch {
    return []
  }
  return nomes.sort().flatMap((nome) => {
    const numero = /^(\d+)-.+\.md$/.exec(nome)?.[1]
    const texto = ler(join(raiz, PASTA_DAS_REGRAS, nome))
    if (numero === undefined || texto === null) return []
    const itens = [...texto.matchAll(/^(\d+[a-z]?)\. /gm)].map((achado) => achado[1] ?? '')
    return [{ numero, bytes: bytes(texto), comPaths: temCaminho(texto), itens }]
  })
}

const lerAntes = (): Antes => JSON.parse(readFileSync(join(import.meta.dirname, '__fixtures__', 'base-fixa-antes.json'), 'utf8')) as Antes

/** O que está errado na base fixa sob `raiz`, uma frase por problema; lista vazia quando está tudo certo. */
function avaliar(raiz: string, antes: Antes): string[] {
  const problemas: string[] = []
  const claude = ler(join(raiz, 'CLAUDE.md'))
  if (claude === null) problemas.push('CLAUDE.md ausente: a base fixa não se mede sem ele')
  const regras = lerRegras(raiz)
  const sempre = regras.filter((regra) => !regra.comPaths)
  const base = bytes(claude ?? '') + sempre.reduce((soma, regra) => soma + regra.bytes, 0)
  if (base > LIMITE_DA_BASE_FIXA) problemas.push(`base fixa de ${base} B, acima de ${LIMITE_DA_BASE_FIXA} B`)
  const numeros = sempre.map((regra) => regra.numero)
  if (numeros.join(',') !== SEMPRE_CARREGADAS.join(',')) {
    problemas.push(`regras sempre carregadas: ${numeros.join(', ') || 'nenhuma'}; deveriam ser ${SEMPRE_CARREGADAS.join(', ')}`)
  }
  return [...problemas, ...itensPerdidos(regras, antes)]
}

/** Uma frase por regra sempre carregada que perdeu item numerado em relação à medida de antes. */
function itensPerdidos(regras: Regra[], antes: Antes): string[] {
  const problemas: string[] = []
  for (const numero of SEMPRE_CARREGADAS) {
    const atuais = regras.find((regra) => regra.numero === numero)?.itens ?? []
    const faltam = (antes.itensNumerados[numero] ?? []).filter((item) => !atuais.includes(item))
    if (faltam.length > 0) problemas.push(`a regra ${numero} perdeu os itens ${faltam.join(', ')}`)
  }
  return problemas
}

/** Uma frase por skill que não manda ler uma das quatro regras com `paths:`. */
function skillsSemAsQuatro(raiz: string): string[] {
  return SKILLS_QUE_LEEM_AS_QUATRO.flatMap((skill) => {
    const texto = ler(join(raiz, '.claude', 'skills', skill, 'SKILL.md'))
    if (texto === null) return [`${skill}: SKILL.md ausente`]
    return AS_QUATRO.filter((nome) => !texto.includes(nome)).map((nome) => `${skill}: não manda ler ${nome}`)
  })
}

const pastas: string[] = []
afterEach(() => {
  for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true })
})

/** Uma cópia do `CLAUDE.md`, das regras e das seis skills em pasta temporária, que o teste estraga sem tocar o original. */
function copia(): string {
  const raiz = mkdtempSync(join(tmpdir(), 'base-fixa-'))
  pastas.push(raiz)
  cpSync(join(RAIZ, 'CLAUDE.md'), join(raiz, 'CLAUDE.md'))
  cpSync(join(RAIZ, PASTA_DAS_REGRAS), join(raiz, PASTA_DAS_REGRAS), { recursive: true })
  for (const skill of SKILLS_QUE_LEEM_AS_QUATRO) {
    const caminho = join('.claude', 'skills', skill, 'SKILL.md')
    mkdirSync(join(raiz, dirname(caminho)), { recursive: true })
    cpSync(join(RAIZ, caminho), join(raiz, caminho))
  }
  return raiz
}

/** Reescreve um arquivo da cópia; o texto precisa mudar, ou o teste não prova nada. */
function estragar(raiz: string, caminho: string, mudar: (texto: string) => string): void {
  const alvo = join(raiz, caminho)
  const antes = readFileSync(alvo, 'utf8')
  const depois = mudar(antes)
  expect(depois, 'a amostra precisa mudar o arquivo, ou o teste não prova nada').not.toBe(antes)
  writeFileSync(alvo, depois)
}

const regra = (numero: string): string => {
  const nome = readdirSync(join(RAIZ, PASTA_DAS_REGRAS)).find((arquivo) => arquivo.startsWith(`${numero}-`))
  if (nome === undefined) throw new Error(`regra ${numero} não existe em ${PASTA_DAS_REGRAS}`)
  return join(PASTA_DAS_REGRAS, nome)
}

describe('a base fixa de contexto (RF20)', () => {
  it('o repositório de hoje passa, com a medida de antes gravada e as contagens mínimas', () => {
    const antes = lerAntes()
    expect(avaliar(RAIZ, antes)).toEqual([])
    const regras = lerRegras(RAIZ)
    expect(regras.length).toBeGreaterThanOrEqual(MINIMO_DE_REGRAS)
    for (const numero of SEMPRE_CARREGADAS) {
      expect(regras.find((achada) => achada.numero === numero)?.itens.length ?? 0).toBeGreaterThanOrEqual(antes.itensNumerados[numero]?.length ?? Infinity)
    }
    expect(regras.filter((achada) => achada.comPaths).map((achada) => achada.numero)).toEqual(expect.arrayContaining(COM_CAMINHO))
  })

  it('a medida de antes é a de 23/10/2026: 75 KB de base fixa e os itens numerados da 10, da 20 e da 70', () => {
    const antes = lerAntes()
    expect(antes.claudeMdBytes).toBe(36_351)
    expect(antes.baseFixaBytes).toBe(75_218)
    expect(Object.keys(antes.regrasSemPaths).sort()).toEqual(['00', '10', '20', '40', '60', '70', '80'])
    expect(antes.itensNumerados['10']).toHaveLength(9)
    expect(antes.itensNumerados['20']).toHaveLength(20)
    expect(antes.itensNumerados['70']).toHaveLength(15)
  })

  it('base fixa acima de 40.000 B: vermelha, e no limite exato ainda passa', () => {
    const antes = lerAntes()
    const raiz = copia()
    const dasRegras = lerRegras(raiz)
      .filter((achada) => !achada.comPaths)
      .reduce((soma, achada) => soma + achada.bytes, 0)
    const sobra = LIMITE_DA_BASE_FIXA - dasRegras
    estragar(raiz, 'CLAUDE.md', () => 'x'.repeat(sobra))
    expect(avaliar(raiz, antes)).toEqual([])
    writeFileSync(join(raiz, 'CLAUDE.md'), 'x'.repeat(sobra + 1))
    expect(avaliar(raiz, antes)).toEqual([`base fixa de ${LIMITE_DA_BASE_FIXA + 1} B, acima de ${LIMITE_DA_BASE_FIXA} B`])
  })

  it('CLAUDE.md ausente na amostra: vermelho', () => {
    const raiz = copia()
    rmSync(join(raiz, 'CLAUDE.md'))
    expect(avaliar(raiz, lerAntes())).toContain('CLAUDE.md ausente: a base fixa não se mede sem ele')
  })

  it('pasta das regras ausente na amostra: vermelho', () => {
    const raiz = copia()
    rmSync(join(raiz, PASTA_DAS_REGRAS), { recursive: true })
    expect(avaliar(raiz, lerAntes())).toContain('regras sempre carregadas: nenhuma; deveriam ser 10, 20, 70')
  })

  it.each(COM_CAMINHO.map((numero) => [`a regra ${numero} sem o paths:`, numero] as const))('regra com caminho que perde o paths: volta ao contexto: %s', (_nome, numero) => {
    const raiz = copia()
    estragar(raiz, regra(numero), (texto) => texto.replace(/^---\n[\s\S]*?\n---\n\n?/, ''))
    expect(avaliar(raiz, lerAntes())).toContain(`regras sempre carregadas: ${[...SEMPRE_CARREGADAS, numero].sort().join(', ')}; deveriam ser 10, 20, 70`)
  })

  it.each(SEMPRE_CARREGADAS.map((numero) => [`a regra ${numero} com paths:`, numero] as const))('regra de segurança que ganha paths: sai do contexto: %s', (_nome, numero) => {
    const raiz = copia()
    estragar(raiz, regra(numero), (texto) => `---\npaths:\n  - "apps/**"\n---\n\n${texto}`)
    const sempre = SEMPRE_CARREGADAS.filter((outra) => outra !== numero)
    expect(avaliar(raiz, lerAntes())).toContain(`regras sempre carregadas: ${sempre.join(', ')}; deveriam ser 10, 20, 70`)
  })

  it('paths: com lista vazia não tira a regra do contexto', () => {
    const raiz = copia()
    estragar(raiz, regra('40'), (texto) => texto.replace(/^---\npaths:\n(?: {2}- .*\n)+---\n/, '---\npaths:\n---\n'))
    expect(avaliar(raiz, lerAntes())).toContain('regras sempre carregadas: 10, 20, 40, 70; deveriam ser 10, 20, 70')
  })

  it('paths: escrito no corpo da regra, fora do cabeçalho, não a tira do contexto', () => {
    const raiz = copia()
    estragar(raiz, regra('10'), (texto) => `${texto}\nExemplo de cabeçalho:\npaths:\n  - "apps/**"\n`)
    expect(avaliar(raiz, lerAntes())).toEqual([])
  })

  it('arquivo sem número na pasta das regras não conta como regra', () => {
    const raiz = copia()
    writeFileSync(join(raiz, PASTA_DAS_REGRAS, 'notas.md'), '# Notas\n\n1. um item solto\n')
    expect(avaliar(raiz, lerAntes())).toEqual([])
  })

  it('pasta com nome de regra, que não se lê como arquivo, não conta e não derruba a conferência', () => {
    const raiz = copia()
    mkdirSync(join(raiz, PASTA_DAS_REGRAS, '99-pasta.md'))
    expect(avaliar(raiz, lerAntes())).toEqual([])
  })

  it.each(SEMPRE_CARREGADAS.map((numero) => [`a regra ${numero}`, numero] as const))('item numerado cortado: %s', (_nome, numero) => {
    const antes = lerAntes()
    const ultimo = antes.itensNumerados[numero]?.at(-1) ?? ''
    const raiz = copia()
    estragar(raiz, regra(numero), (texto) => texto.replace(new RegExp(`^${ultimo}\\. `, 'm'), ''))
    expect(avaliar(raiz, antes)).toEqual([`a regra ${numero} perdeu os itens ${ultimo}`])
  })

  it('item trocado por outro com a mesma contagem: vermelho, pelo número', () => {
    const antes = lerAntes()
    const raiz = copia()
    estragar(raiz, regra('70'), (texto) => texto.replace(/^4a\. /m, '4z. '))
    expect(avaliar(raiz, antes)).toEqual(['a regra 70 perdeu os itens 4a'])
  })

  it('item a mais numa das três: verde', () => {
    const raiz = copia()
    estragar(raiz, regra('10'), (texto) => `${texto}\n10. Um item novo.\n`)
    expect(avaliar(raiz, lerAntes())).toEqual([])
  })
})

describe('as skills de especificação mandam ler as quatro regras com paths: (15.5)', () => {
  it('as seis de hoje citam as quatro', () => {
    expect(skillsSemAsQuatro(RAIZ)).toEqual([])
  })

  it.each(SKILLS_QUE_LEEM_AS_QUATRO.map((skill) => [skill] as const))('a skill %s sem o nome da regra 60: vermelho, dizendo qual', (skill) => {
    const raiz = copia()
    estragar(raiz, join('.claude', 'skills', skill, 'SKILL.md'), (texto) => texto.replaceAll('60-dominio.md', ''))
    expect(skillsSemAsQuatro(raiz)).toEqual([`${skill}: não manda ler 60-dominio.md`])
  })

  it('skill ausente na amostra: vermelho', () => {
    const raiz = copia()
    rmSync(join(raiz, '.claude', 'skills', 'retro'), { recursive: true })
    expect(skillsSemAsQuatro(raiz)).toEqual(['retro: SKILL.md ausente'])
  })
})

describe('a regra 40 diz o RF17 (15.4)', () => {
  it('código de produção sem mutação não recebe carimbo', () => {
    const texto = ler(join(RAIZ, regra('40'))) ?? ''
    expect(texto).toContain('**Sem mutação:**')
    expect(texto).toContain('`apps/*/src`')
    expect(texto).toContain('`packages/*/src`')
  })
})
