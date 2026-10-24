// Cada item de cada regra diz a checagem que o garante, e a checagem existe (X7, RF25).
//
// Uma regra de `.claude/rules/` que ninguém checa é só um desejo: quem lê não sabe se o teste que a prova existe, e quem o apaga
// não sabe que apagou uma regra. Por isso todo item numerado termina numa linha `Checagem:` com o nome do teste (o caminho), da
// guarda (`guardas/<nome>`, a regra de lint) ou do revisor (o arquivo de `.claude/agents/`), ou com a frase "só a revisão
// garante", que declara que não há máquina por trás e diz quem olha. A frase é honesta, e a lista dela é a que o `TODO.md` e a
// retrospectiva leem para saber o que ainda não tem teste.
//
// A conferência prova que a checagem **existe**, não que ela prova o item: quem a escolheu pode ter escolhido o teste errado, e
// isso é da revisão. Um item é o que começa a linha com `<número>. ` (com letra, `2a.`); o que vem até o próximo item ou o próximo
// título `##` é dele. A regra 40 não tinha item numerado, e ganhou a seção "As regras e a checagem de cada uma".
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const RAIZ = join(import.meta.dirname, '..', '..', '..')

const PASTA_DAS_REGRAS = '.claude/rules'
const PASTA_DOS_REVISORES = '.claude/agents'
const ARQUIVO_DAS_GUARDAS = 'tools/guardas/index.mjs'
export const FRASE_DA_REVISAO = 'só a revisão garante'
/** O que a conferência acha hoje, abaixo do medido (111 itens, 87, 8 e 106 checagens, 47 com a frase, 9 guardas): o mínimo, para ela não passar vazia. */
const MINIMO_DE_ITENS = 111
const MINIMO_DE_REGRAS = 9
const MINIMO_POR_TIPO = { teste: 80, guarda: 8, revisor: 100 }
const MINIMO_DE_ITENS_COM_A_FRASE = 40
const MINIMO_DE_GUARDAS_REGISTRADAS = 7

interface Item {
  regra: string
  id: string
  /** O texto depois de `Checagem:`, com as linhas de continuação; `null` se o item não tem a linha. */
  checagem: string | null
}

/** O texto do arquivo, ou vazio se ele não existe: quem chama trata o arquivo ausente como texto sem nada. */
const ler = (caminho: string): string => {
  try {
    return readFileSync(caminho, 'utf8')
  } catch {
    return ''
  }
}

/** Os itens de uma regra: do `N. ` até o próximo item ou título. */
export function itensDaRegra(regra: string, texto: string): Item[] {
  const linhas = texto.split('\n')
  const itens: Item[] = []
  let atual: { id: string; linhas: string[] } | null = null
  const fechar = (): void => {
    if (atual !== null) itens.push({ regra, id: atual.id, checagem: checagemDe(atual.linhas) })
    atual = null
  }
  for (const linha of linhas) {
    const inicio = /^(\d+[a-z]?)\. /.exec(linha)
    if (inicio !== null || linha.startsWith('## ')) fechar()
    if (inicio !== null) atual = { id: inicio[1] ?? '', linhas: [] }
    else if (atual !== null) atual.linhas.push(linha)
  }
  fechar()
  return itens
}

/** A linha `Checagem:` do item, com a continuação (linhas seguintes recuadas, até a linha em branco ou a que não tem recuo). O texto vem com o `Checagem:` na frente, que não atrapalha. */
function checagemDe(linhas: string[]): string | null {
  const onde = linhas.findIndex((linha) => /^\s*Checagem:/.test(linha))
  if (onde < 0) return null
  const partes = [(linhas[onde] ?? '').trim()]
  for (const linha of linhas.slice(onde + 1)) {
    if (!/^\s+\S/.test(linha)) break
    partes.push(linha.trim())
  }
  return partes.join(' ')
}

/** As regras sob `raiz`: número e itens. Pasta ausente ou vazia devolve lista vazia. */
export function lerRegras(raiz: string): { numero: string; itens: Item[] }[] {
  let nomes: string[]
  try {
    nomes = readdirSync(join(raiz, PASTA_DAS_REGRAS))
  } catch {
    return []
  }
  return nomes.sort().flatMap((nome) => {
    const numero = /^(\d+)-.+\.md$/.exec(nome)?.[1]
    if (numero === undefined) return []
    return [{ numero, itens: itensDaRegra(numero, ler(join(raiz, PASTA_DAS_REGRAS, nome))) }]
  })
}

/** Os nomes das regras de lint que `tools/guardas/index.mjs` registra no plugin `guardas`. */
export function guardasRegistradas(raiz: string): string[] {
  const texto = ler(join(raiz, ARQUIVO_DAS_GUARDAS))
  const bloco = /export const guardas = \{[\s\S]*?rules: \{([\s\S]*?)\n {2}\}/.exec(texto)?.[1] ?? ''
  return [...bloco.matchAll(/^\s+'([a-z-]+)':/gm)].map((achado) => achado[1] ?? '')
}

type Tipo = 'teste' | 'guarda' | 'revisor'

/** O que um token entre crases da checagem é (`tipo`), ou por que não vale (`problema`). */
type Citada = { tipo: Tipo } | { problema: string }

/** Teste é o caminho de `*.test.ts(x)`, de `*.spec.ts` ou de qualquer arquivo de `tools/`; guarda é `guardas/<nome>`; revisor é o nome de um arquivo de `.claude/agents/`. */
function classificar(token: string, raiz: string, guardas: string[]): Citada {
  if (token.startsWith('guardas/')) {
    return guardas.includes(token.slice('guardas/'.length)) ? { tipo: 'guarda' } : { problema: `a guarda ${token} não está em ${ARQUIVO_DAS_GUARDAS}` }
  }
  if (token.includes('/')) {
    if (!/\.(?:test|spec)\.tsx?$/.test(token) && !token.startsWith('tools/')) return { problema: `${token} não é teste nem guarda` }
    return existsSync(join(raiz, token)) ? { tipo: 'teste' } : { problema: `${token} não existe` }
  }
  if (/^[a-z][a-z-]*$/.test(token)) {
    return existsSync(join(raiz, PASTA_DOS_REVISORES, `${token}.md`)) ? { tipo: 'revisor' } : { problema: `o revisor ${token} não tem arquivo em ${PASTA_DOS_REVISORES}` }
  }
  return { problema: `${token} não é teste, guarda nem revisor` }
}

interface Avaliacao {
  problemas: string[]
  itens: number
  /** Quantas checagens de cada tipo as regras citam, e quantos itens dizem a frase. */
  porTipo: Record<Tipo, number>
  comAFrase: number
}

/** O que a checagem de um item diz: os problemas dela, os tipos que cita e se diz a frase. */
function avaliarItem(onde: string, checagem: string | null, raiz: string, guardas: string[]): { problemas: string[]; tipos: Tipo[]; comAFrase: boolean } {
  if (checagem === null) return { problemas: [`${onde}: sem a linha "Checagem:"`], tipos: [], comAFrase: false }
  const citadas = [...checagem.matchAll(/`([^`]+)`/g)].map((achado) => classificar(achado[1] ?? '', raiz, guardas))
  const comAFrase = checagem.includes(FRASE_DA_REVISAO)
  const problemas = citadas.flatMap((citada) => ('problema' in citada ? [`${onde}: ${citada.problema}`] : []))
  if (citadas.length === 0 && !comAFrase) problemas.push(`${onde}: a checagem não cita teste, guarda nem revisor, e não diz "${FRASE_DA_REVISAO}"`)
  const tipos = citadas.flatMap((citada) => ('tipo' in citada ? [citada.tipo] : []))
  return { problemas, tipos, comAFrase }
}

/** O que está errado nas checagens das regras sob `raiz`, uma frase por problema. */
export function avaliar(raiz: string): Avaliacao {
  const problemas: string[] = []
  const porTipo: Record<Tipo, number> = { teste: 0, guarda: 0, revisor: 0 }
  let comAFrase = 0
  let total = 0
  const regras = lerRegras(raiz)
  if (regras.length === 0) problemas.push(`${PASTA_DAS_REGRAS}: nenhuma regra para conferir`)
  const guardas = guardasRegistradas(raiz)
  for (const { numero, itens } of regras) {
    if (itens.length === 0) problemas.push(`regra ${numero}: nenhum item numerado`)
    for (const item of itens) {
      total += 1
      const achado = avaliarItem(`regra ${numero}, item ${item.id}`, item.checagem, raiz, guardas)
      problemas.push(...achado.problemas)
      for (const tipo of achado.tipos) porTipo[tipo] += 1
      if (achado.comAFrase) comAFrase += 1
    }
  }
  return { problemas, itens: total, porTipo, comAFrase }
}

const pastas: string[] = []
afterEach(() => {
  for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true })
})

const INDICE_DAS_GUARDAS = `const antes = { rules: { 'isca-antes': 1 } }

export const guardas = {
  meta: { name: 'guardas' },
  rules: {
    'log-x': logX,
    'tabela-y': tabelaY,
  },
}

export const REGRAS_DE_LOG = ['guardas/log-x']

const depois = {
  rules: {
    'isca-depois': 'error',
  },
}
`

/** Uma amostra mínima e certa: uma regra com um item que cita um teste, uma guarda e um revisor que existem. O caso a estraga. */
function amostra(acrescenta: Record<string, string | null> = {}): string {
  const raiz = mkdtempSync(join(tmpdir(), 'checagens-'))
  pastas.push(raiz)
  const arquivos: Record<string, string | null> = {
    '.claude/rules/10-a.md': '# Regra 10\n\n## As regras\n\n1. **Uma regra.** Texto.\n   Checagem: `apps/api/test/a.test.ts`, `guardas/log-x`, `tenancy-guardian`.\n\n## Como isso é checado\n\nTexto.\n',
    '.claude/agents/tenancy-guardian.md': '# O guardião\n',
    'apps/api/test/a.test.ts': 'x\n',
    'tools/guardas/index.mjs': INDICE_DAS_GUARDAS,
    ...acrescenta,
  }
  for (const [nome, texto] of Object.entries(arquivos)) {
    if (texto === null) continue
    mkdirSync(join(raiz, dirname(nome)), { recursive: true })
    writeFileSync(join(raiz, nome), texto)
  }
  return raiz
}

const regraCom = (...linhas: string[]): Record<string, string> => ({ '.claude/rules/10-a.md': `# Regra 10\n\n## As regras\n\n${linhas.join('\n')}\n` })

describe('a checagem de cada item das regras (RF25)', () => {
  it('o repositório de hoje passa, com as nove regras, todos os itens e ao menos uma checagem de cada tipo', () => {
    const resultado = avaliar(RAIZ)
    expect(resultado.problemas).toEqual([])
    expect(lerRegras(RAIZ).length).toBeGreaterThanOrEqual(MINIMO_DE_REGRAS)
    expect(resultado.itens).toBeGreaterThanOrEqual(MINIMO_DE_ITENS)
    expect(resultado.porTipo.teste).toBeGreaterThanOrEqual(MINIMO_POR_TIPO.teste)
    expect(resultado.porTipo.guarda).toBeGreaterThanOrEqual(MINIMO_POR_TIPO.guarda)
    expect(resultado.porTipo.revisor).toBeGreaterThanOrEqual(MINIMO_POR_TIPO.revisor)
    expect(resultado.comAFrase).toBeGreaterThanOrEqual(MINIMO_DE_ITENS_COM_A_FRASE)
    expect(guardasRegistradas(RAIZ).length).toBeGreaterThanOrEqual(MINIMO_DE_GUARDAS_REGISTRADAS)
  })

  it('cada regra tem itens, e a 10, a 20 e a 70 não perderam nenhum dos da medida de 23/10/2026', () => {
    const regras = lerRegras(RAIZ)
    for (const regra of regras) expect(regra.itens.length, `regra ${regra.numero}`).toBeGreaterThan(0)
    const quantos = (numero: string): number => regras.find((regra) => regra.numero === numero)?.itens.length ?? 0
    expect(quantos('10')).toBeGreaterThanOrEqual(9)
    expect(quantos('20')).toBeGreaterThanOrEqual(20)
    expect(quantos('70')).toBeGreaterThanOrEqual(15)
  })

  it('a amostra certa passa', () => {
    expect(avaliar(amostra())).toMatchObject({ problemas: [], itens: 1, porTipo: { teste: 1, guarda: 1, revisor: 1 }, comAFrase: 0 })
  })

  it.each([
    ['teste que não existe', '`apps/api/test/inexistente.test.ts`', 'regra 10, item 1: apps/api/test/inexistente.test.ts não existe'],
    ['guarda que não existe', '`guardas/nao-existe`', 'regra 10, item 1: a guarda guardas/nao-existe não está em tools/guardas/index.mjs'],
    ['revisor que não existe', '`ninguem-guardian`', 'regra 10, item 1: o revisor ninguem-guardian não tem arquivo em .claude/agents'],
    ['arquivo que não é teste nem guarda', '`docs/lgpd.md`', 'regra 10, item 1: docs/lgpd.md não é teste nem guarda'],
    ['token que não é nada disso', '`dois nomes`', 'regra 10, item 1: dois nomes não é teste, guarda nem revisor'],
  ])('regra que cita checagem que não existe: %s', (_caso, token, esperado) => {
    expect(avaliar(amostra(regraCom('1. **Uma regra.**', `   Checagem: ${token}.`))).problemas).toEqual([esperado])
  })

  it('a checagem que existe e está na linha de continuação também é conferida', () => {
    const raiz = amostra(regraCom('1. **Uma regra.**', '   Checagem: `apps/api/test/a.test.ts`,', '   `apps/api/test/inexistente.test.ts`.'))
    expect(avaliar(raiz).problemas).toEqual(['regra 10, item 1: apps/api/test/inexistente.test.ts não existe'])
    const certa = amostra(regraCom('1. **Uma regra.**', '   Checagem: `apps/api/test/a.test.ts`,', '   `tenancy-guardian`.'))
    expect(avaliar(certa)).toMatchObject({ problemas: [], porTipo: { teste: 1, guarda: 0, revisor: 1 } })
  })

  it('um arquivo de tools/ e um .spec.ts valem como teste e como guarda', () => {
    const raiz = amostra({ ...regraCom('1. **Uma regra.**', '   Checagem: `tools/ci/x.ts`, `e2e/y.spec.ts`.'), 'tools/ci/x.ts': 'x\n', 'e2e/y.spec.ts': 'x\n' })
    expect(avaliar(raiz)).toMatchObject({ problemas: [], porTipo: { teste: 2 } })
  })

  it('regra que diz "só a revisão garante": verde, com ou sem o revisor, e conta como item com a frase', () => {
    const sozinha = amostra(regraCom('1. **Uma regra.**', `   Checagem: ${FRASE_DA_REVISAO}.`))
    expect(avaliar(sozinha)).toMatchObject({ problemas: [], itens: 1, comAFrase: 1 })
    const comRevisor = amostra(regraCom('1. **Uma regra.**', `   Checagem: ${FRASE_DA_REVISAO} (\`tenancy-guardian\`).`))
    expect(avaliar(comRevisor)).toMatchObject({ problemas: [], porTipo: { revisor: 1 }, comAFrase: 1 })
  })

  it('a frase com um revisor que não existe continua vermelha', () => {
    const raiz = amostra(regraCom('1. **Uma regra.**', `   Checagem: ${FRASE_DA_REVISAO} (\`ninguem-guardian\`).`))
    expect(avaliar(raiz).problemas).toEqual(['regra 10, item 1: o revisor ninguem-guardian não tem arquivo em .claude/agents'])
  })

  it('item sem checagem nem a frase: vermelho, e a checagem do item seguinte não vale para ele', () => {
    const raiz = amostra(regraCom('1. **Uma regra.** Texto.', '', '2. **Outra.**', '   Checagem: `apps/api/test/a.test.ts`.'))
    expect(avaliar(raiz).problemas).toEqual(['regra 10, item 1: sem a linha "Checagem:"'])
  })

  it('a linha "Checagem:" vazia, ou sem token nem frase, é vermelha', () => {
    expect(avaliar(amostra(regraCom('1. **Uma regra.**', '   Checagem:'))).problemas).toEqual([
      `regra 10, item 1: a checagem não cita teste, guarda nem revisor, e não diz "${FRASE_DA_REVISAO}"`,
    ])
    expect(avaliar(amostra(regraCom('1. **Uma regra.**', '   Checagem: depois eu vejo.'))).problemas).toEqual([
      `regra 10, item 1: a checagem não cita teste, guarda nem revisor, e não diz "${FRASE_DA_REVISAO}"`,
    ])
  })

  it('a checagem acaba na linha em branco, e a linha sem recuo também não é continuação dela', () => {
    const emBranco = amostra(regraCom('1. **Uma regra.**', '   Checagem: `tenancy-guardian`.', '', '   Veja `ninguem-guardian`.'))
    expect(avaliar(emBranco)).toMatchObject({ problemas: [], porTipo: { revisor: 1 } })
    const semRecuo = amostra(regraCom('1. **Uma regra.**', '   Checagem: `tenancy-guardian`.', 'texto de `ninguem-guardian` sem recuo'))
    expect(avaliar(semRecuo)).toMatchObject({ problemas: [], porTipo: { revisor: 1 } })
  })

  it('o item com letra (2a) e o título entre itens: a checagem solta depois de um título não é de ninguém', () => {
    const raiz = amostra(regraCom('1. **Uma.**', '   Checagem: `tenancy-guardian`.', '', '2a. **Duas.**', '', '## Outro título', '', '   Checagem: `tenancy-guardian`.'))
    expect(avaliar(raiz)).toMatchObject({ itens: 2, problemas: ['regra 10, item 2a: sem a linha "Checagem:"'] })
  })

  it('a linha Checagem: sem recuo, dentro do item, também vale', () => {
    expect(avaliar(amostra(regraCom('1. **Uma regra.**', 'Checagem: `tenancy-guardian`.')))).toMatchObject({ problemas: [], porTipo: { revisor: 1 } })
  })

  it('checagem escrita fora de um item, no corpo da regra, não vale para o item', () => {
    const raiz = amostra(regraCom('Checagem: `tenancy-guardian`.', '', '1. **Uma.**'))
    expect(avaliar(raiz).problemas).toEqual(['regra 10, item 1: sem a linha "Checagem:"'])
  })

  it('regra sem item numerado: vermelho', () => {
    const raiz = amostra({ '.claude/rules/10-a.md': '# Regra 10\n\n## As regras\n\nSó texto, sem item.\n' })
    expect(avaliar(raiz).problemas).toEqual(['regra 10: nenhum item numerado'])
  })

  it('arquivo de regra sem número no nome não é regra, e o de número que não é de regra também não conta como item perdido', () => {
    const raiz = amostra({ '.claude/rules/LEIAME.md': '1. **Sem checagem.**\n', '.claude/rules/15-rascunho.txt': '1. **Sem checagem.**\n' })
    expect(avaliar(raiz).problemas).toEqual([])
  })

  it('pasta das regras ausente ou vazia: vermelho', () => {
    const vazia = amostra({ '.claude/rules/10-a.md': null })
    mkdirSync(join(vazia, '.claude/rules'), { recursive: true })
    expect(avaliar(vazia).problemas).toEqual(['.claude/rules: nenhuma regra para conferir'])
    const ausente = amostra({ '.claude/rules/10-a.md': null })
    expect(avaliar(ausente).problemas).toEqual(['.claude/rules: nenhuma regra para conferir'])
  })

  it('o arquivo das guardas ausente: a guarda citada é vermelha, e as outras checagens seguem conferidas', () => {
    const raiz = amostra({ 'tools/guardas/index.mjs': null })
    expect(avaliar(raiz).problemas).toEqual(['regra 10, item 1: a guarda guardas/log-x não está em tools/guardas/index.mjs'])
  })

  it('as guardas registradas são só as do plugin `guardas`, e não as de outro objeto antes ou depois dele', () => {
    expect(guardasRegistradas(amostra())).toEqual(['log-x', 'tabela-y'])
  })
})
