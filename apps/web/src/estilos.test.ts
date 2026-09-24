import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * `estilos.css` zera a paleta do Tailwind (`--color-*: initial`) e devolve em hex só as cores usadas, porque a paleta
 * padrão da versão 4 é em `oklch()`, que o Chrome anterior ao 111 não entende — e laboratório de escola tem navegador
 * velho (regra 50, item 1).
 *
 * O efeito colateral é silencioso e foi ao ar uma vez: classe com cor fora da lista **não gera CSS nenhum**. A caixa
 * continua na tela, com o texto certo, sem fundo e sem borda — e o axe não reclama, porque o texto herda o contraste
 * da página. É exatamente o aviso de atenção ("este convite não vale mais", "guarde estes códigos agora") que some.
 *
 * Por isso a lista é conferida por teste, e não por atenção. A pele é a da D72 (`docs/interface.md` 9.9), e a guarda é
 * estrita desde a tarefa 2.0 da A0: toda classe que pinta, em qualquer arquivo de `apps/web/src`, pede um nome do
 * `@theme` da 9.9 e nenhum outro, e sem modificador de opacidade (`bg-tinta/40`), que vira `color-mix()` e é descartado
 * pelo Chrome 109 (9.9, "Modificador de opacidade em cor não entra").
 */
const raizDaWeb = dirname(fileURLToPath(import.meta.url))
const raizDoRepositorio = join(raizDaWeb, '..', '..', '..')

/**
 * Os tokens de cor do bloco `@theme` da 9.9 do `docs/interface.md`, com o hex de cada um. O documento é a fonte: o
 * teste lê de lá, e não de uma cópia aqui, para que um hex trocado em qualquer um dos dois lados deixe vermelho.
 */
function tokensDaD72(): Map<string, string> {
  const documento = readFileSync(join(raizDoRepositorio, 'docs', 'interface.md'), 'utf8')
  const secao = documento.slice(documento.indexOf('### 9.9'))
  const bloco = secao.slice(secao.indexOf('```css'), secao.indexOf('```', secao.indexOf('```css') + 6))
  return new Map([...bloco.matchAll(/--color-([a-z]+(?:-[a-z0-9]+)*)\s*:\s*(#[0-9a-fA-F]{6})/g)].map(([, nome, hex]) => [nome ?? '', (hex ?? '').toLowerCase()]))
}

/** Os nomes de cor da 9.9, `white` e `black` incluídos: os únicos que uma classe de cor pode pedir. */
const NOMES_DE_COR = new Set(tokensDaD72().keys())

/** As sombras do `@theme` (`shadow-caixa`, `shadow-flutua`): `shadow-<nome>` com elas é sombra, não cor. */
function sombrasDeclaradas(): Set<string> {
  const css = readFileSync(join(raizDaWeb, 'estilos.css'), 'utf8')
  return new Set([...css.matchAll(/--shadow-([a-z]+(?:-[a-z0-9]+)*)\s*:/g)].map(([, nome]) => nome ?? ''))
}

/**
 * O que, em cada propriedade que pinta, **não** é cor: tamanho de texto, alinhamento, largura e lado de borda, estilo
 * de linha, sombra de fábrica e do `@theme`. Qualquer outro valor é lido como cor e precisa ser um nome da 9.9. É a
 * lista que falta, e não a que sobra, que decide: um valor novo que ninguém previu reprova até alguém dizer o que ele é.
 */
const NAO_E_COR: Record<string, RegExp> = {
  text: /^(?:xs|sm|base|lg|[2-9]?xl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$/,
  border: /^(?:\d+|[xytblrse](?:-\d+)?|solid|dashed|dotted|double|hidden|none|collapse|separate)$/,
  outline: /^(?:\d+|none|hidden|solid|dashed|dotted|double|offset-\d+)$/,
  ring: /^(?:\d+|inset|offset-\d+)$/,
  shadow: /^(?:2xs|xs|sm|md|lg|xl|2xl|none|inner)$/,
  decoration: /^(?:\d+|solid|double|dotted|dashed|wavy|auto|from-font|clone|slice)$/,
  bg: /^(?:none|fixed|local|scroll|repeat|no-repeat|repeat-[xy]|repeat-round|repeat-space|cover|contain|auto|center|top|bottom|left|right|(?:left|right)-(?:top|bottom)|clip-\w+|origin-\w+|blend-[\w-]+)$/,
  fill: /^none$/,
  stroke: /^(?:\d+|none)$/,
  divide: /^(?:[xy](?:-\d+|-reverse)?|solid|dashed|dotted|double|none)$/,
  accent: /^auto$/,
  caret: /^$/,
  placeholder: /^$/,
  from: /^$/,
  via: /^$/,
  to: /^$/,
}

/**
 * Toda classe de propriedade que pinta, com a variante (`hover:`, `enabled:`, `sm:`) que vier antes, o valor e o
 * modificador depois da barra (`bg-tinta/40`, `text-sm/6`). O valor entre colchetes é o arbitrário (`bg-[#1d4ed8]`).
 */
const CLASSE_QUE_PINTA = new RegExp(
  String.raw`(?:^|[\s"'\`:\[])(${Object.keys(NAO_E_COR).join('|')})-(\[[^\]\s]+\]|[a-z0-9][a-z0-9-]*)(\/(?:\d+|\[[^\]\s]+\]))?(?![\w-])`,
  'g',
)

/** Valor arbitrário que é cor: hex, função de cor ou variável de cor. Pinta sem passar pelo `@theme`. */
const ARBITRARIO_DE_COR = /^\[(?:#|rgba?\(|hsla?\(|oklch\(|oklab\(|lab\(|lch\(|hwb\(|color-mix\(|color:|var\(--color)/i

/**
 * As classes de `conteudo` que a guarda reprova, como `arquivo: classe`: a cor com nome fora da 9.9 (a paleta de
 * fábrica, que a `--color-*: initial` apaga, ou um nome que ninguém declarou), a cor arbitrária, e o modificador de
 * opacidade em cor, que vira `color-mix()` e some no Chrome 109.
 */
function classesReprovadas(arquivo: string, conteudo: string): string[] {
  const sombras = sombrasDeclaradas()
  const reprovadas: string[] = []
  for (const [, propriedade = '', valor = '', modificador] of conteudo.matchAll(CLASSE_QUE_PINTA)) {
    const classe = `${propriedade}-${valor}${modificador ?? ''}`
    if (valor.startsWith('[')) {
      if (ARBITRARIO_DE_COR.test(valor)) reprovadas.push(`${arquivo}: ${classe} (cor fora do @theme)`)
      continue
    }
    if (NAO_E_COR[propriedade]?.test(valor) || (propriedade === 'shadow' && sombras.has(valor))) continue
    if (!NOMES_DE_COR.has(valor)) reprovadas.push(`${arquivo}: ${classe} (cor fora do @theme)`)
    else if (modificador !== undefined) reprovadas.push(`${arquivo}: ${classe} (modificador de opacidade)`)
  }
  return reprovadas
}

function arquivosDeCodigo(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name)
    if (entrada.isDirectory()) return arquivosDeCodigo(caminho)
    return /\.tsx?$/.test(entrada.name) && !entrada.name.endsWith('.test.ts') && !entrada.name.endsWith('.test.tsx') ? [caminho] : []
  })
}

/** As declarações de cor de `estilos.css`, nome e valor. O nome pode ter hífen: `caramelo-texto`, `borda-campo`. */
function declaracoesDeCor(): Map<string, string> {
  const css = readFileSync(join(raizDaWeb, 'estilos.css'), 'utf8')
  return new Map([...css.matchAll(/--color-([a-z]+(?:-[a-z0-9]+)*)\s*:\s*([^;]+);/g)].map(([, cor, valor]) => [cor ?? '', (valor ?? '').trim().toLowerCase()]))
}

describe('paleta de estilos.css', () => {
  it('a paleta é zerada e toda cor devolvida é hex, nunca oklch()', () => {
    const css = readFileSync(join(raizDaWeb, 'estilos.css'), 'utf8')
    // Sem o `initial`, a paleta em oklch() volta inteira e o Chrome 109 do laboratório perde as cores caladamente.
    expect(css).toContain('--color-*: initial')
    const declaracoes = declaracoesDeCor()
    // Os nomes com hífen (`caramelo-texto`) contam: sem eles a conferência deixaria de fora metade da D72.
    expect(declaracoes.get('caramelo-texto')).toBeDefined()
    expect([...declaracoes].filter(([, valor]) => !/^#[0-9a-f]{3,8}$/.test(valor)).map(([cor, valor]) => `${cor}: ${valor}`)).toEqual([])
  })

  it('estilos.css declara exatamente as cores da 9.9, com o mesmo hex, e nenhuma outra', () => {
    const tokens = tokensDaD72()
    // A 9.9 tem 33 cores, `white` e `black` incluídas; outro número é o bloco do documento lido pela metade.
    expect(tokens.size).toBe(33)
    const declaracoes = declaracoesDeCor()
    const divergentes = [...tokens]
      .filter(([nome, hex]) => declaracoes.get(nome) !== hex)
      .map(([nome, hex]) => `${nome}: a 9.9 diz ${hex}, estilos.css diz ${declaracoes.get(nome) ?? 'nada'}`)
    expect(divergentes).toEqual([])
    // A paleta anterior (`slate`, `blue`, `amber`, `red`, `emerald`) saiu inteira: sobra nada fora da 9.9.
    expect([...declaracoes.keys()].filter((nome) => !tokens.has(nome))).toEqual([])
  })
})

describe('guarda de cor em apps/web/src (U3)', () => {
  it('nenhum arquivo da web pede cor fora do @theme da 9.9 nem modificador de opacidade', () => {
    const arquivos = arquivosDeCodigo(raizDaWeb)
    const conteudos = arquivos.map((arquivo) => ({ nome: arquivo.slice(raizDaWeb.length + 1), conteudo: readFileSync(arquivo, 'utf8') }))
    // Sem estas âncoras o caso passaria vazio no dia em que a varredura deixasse de achar arquivo — uma mudança na
    // pasta ou no filtro de extensão —, e `[].flatMap(...)` é `[]`. O botão primário é a cor da marca (9.1), e as
    // telas de `paginas/` são as que a tarefa 2.0 da A0 migrou.
    const nomes = conteudos.map(({ nome }) => nome)
    expect(nomes, 'a varredura não está achando os arquivos da web').toContain('componentes/Botao.tsx')
    expect(nomes.filter((nome) => nome.startsWith('paginas/')).length).toBeGreaterThanOrEqual(10)
    expect(conteudos.find(({ nome }) => nome === 'componentes/Botao.tsx')?.conteudo).toMatch(/\bbg-caramelo\b/)
    const reprovadas = conteudos.flatMap(({ nome, conteudo }) => classesReprovadas(nome, conteudo))
    expect(reprovadas, 'troque pelo token da D72 (Tech Spec da A0, seção 9; docs/interface.md 9.9)').toEqual([])
  })

  it('a guarda reprova a cor fora do @theme e o modificador de opacidade, com o arquivo e a classe', () => {
    // Sem isto, um erro no regex deixaria o caso acima passando sempre, que é o modo de falhar deste arquivo.
    const fixture = [
      '<p className="rounded-cartao border border-amber-300 bg-amber-50 p-4 text-amber-900">',
      '<p className="hover:bg-blue-700 bg-neutral-200 text-foo sm:bg-[#1d4ed8]">',
      '<p className="bg-tinta/80 text-apoio/50 enabled:hover:border-linha/[.4]">',
      // O que passa: token da 9.9, `white`/`black`, e o que não é cor na mesma propriedade.
      '<p className="bg-caramelo text-tinta bg-white text-black border-b border-2 text-sm/6 text-base shadow-flutua outline-offset-2 bg-[url(x.svg)]">',
    ].join('\n')
    expect(classesReprovadas('paginas/Fixture.tsx', fixture)).toEqual([
      'paginas/Fixture.tsx: border-amber-300 (cor fora do @theme)',
      'paginas/Fixture.tsx: bg-amber-50 (cor fora do @theme)',
      'paginas/Fixture.tsx: text-amber-900 (cor fora do @theme)',
      'paginas/Fixture.tsx: bg-blue-700 (cor fora do @theme)',
      'paginas/Fixture.tsx: bg-neutral-200 (cor fora do @theme)',
      'paginas/Fixture.tsx: text-foo (cor fora do @theme)',
      'paginas/Fixture.tsx: bg-[#1d4ed8] (cor fora do @theme)',
      'paginas/Fixture.tsx: bg-tinta/80 (modificador de opacidade)',
      'paginas/Fixture.tsx: text-apoio/50 (modificador de opacidade)',
      'paginas/Fixture.tsx: border-linha/[.4] (modificador de opacidade)',
    ])
  })
})
