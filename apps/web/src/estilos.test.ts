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
 * Por isso a lista é conferida por teste, e não por atenção: toda cor que o código usa precisa estar declarada.
 *
 * A pele é a da D72 (`docs/interface.md` 9.9). Os tokens dela entram ao lado da paleta anterior, e os componentes de
 * `componentes/` já usam só eles; as telas de `paginas/` trocam na tarefa 2.0 da A0, que também deixa esta guarda
 * estrita (só os nomes do `@theme`, sem modificador de opacidade).
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

/** Os nomes da D72 que não são da paleta de fábrica (`white` e `black` estão nas duas). */
const NOMES_DA_D72 = [...tokensDaD72().keys()].filter((nome) => nome !== 'white' && nome !== 'black')

/** As famílias da paleta de fábrica do Tailwind, que a `--color-*: initial` apaga. */
const FAMILIAS_DE_FABRICA = [
  'white',
  'black',
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
]

/** O mais longo primeiro: `caramelo-texto` antes de `caramelo`, senão a alternância para no prefixo. */
const FAMILIAS = [...FAMILIAS_DE_FABRICA, ...NOMES_DA_D72].sort((a, b) => b.length - a.length).join('|')

/** As propriedades do Tailwind que pintam a partir da paleta. */
const PROPRIEDADES = ['bg', 'text', 'border', 'outline', 'ring', 'fill', 'stroke', 'divide', 'placeholder', 'accent', 'caret', 'decoration', 'from', 'via', 'to', 'shadow'].join('|')

/** `hover:bg-amber-50`, `sm:text-slate-900/80` e `[&>p]:border-red-300` contam igual: o prefixo não muda a cor. */
const CLASSE_COM_COR = new RegExp(String.raw`(?:^|[\s"'\`:\[])(?:${PROPRIEDADES})-((?:${FAMILIAS})(?:-\d{2,3})?)(?![\w-])`, 'g')

/** Classe de cor da paleta de fábrica, com ou sem modificador de opacidade. `white` e `black` ficam: estão na 9.9. */
const CLASSE_DE_FABRICA = new RegExp(
  String.raw`(?:^|[\s"'\`:\[])(?:${PROPRIEDADES})-((?:${FAMILIAS_DE_FABRICA.filter((familia) => familia !== 'white' && familia !== 'black').join('|')})(?:-\d{2,3})?)(?![\w-])`,
  'g',
)

/** Modificador de opacidade numa classe de cor (`bg-tinta/40`): vira `color-mix()`, que o Chrome 109 não entende. */
const MODIFICADOR_DE_OPACIDADE = new RegExp(String.raw`(?:^|[\s"'\`:\[])(?:${PROPRIEDADES})-[a-z][\w-]*\/\d+`, 'g')

function arquivosDeCodigo(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name)
    if (entrada.isDirectory()) return arquivosDeCodigo(caminho)
    return /\.tsx?$/.test(entrada.name) && !entrada.name.endsWith('.test.ts') && !entrada.name.endsWith('.test.tsx') ? [caminho] : []
  })
}

/** Toda cor que alguma classe do código pede, com o arquivo que a pediu. */
function coresUsadas(): Map<string, string[]> {
  const usos = new Map<string, string[]>()
  for (const arquivo of arquivosDeCodigo(raizDaWeb)) {
    const conteudo = readFileSync(arquivo, 'utf8')
    for (const [, cor] of conteudo.matchAll(CLASSE_COM_COR)) {
      if (cor === undefined) continue
      usos.set(cor, [...(usos.get(cor) ?? []), arquivo.slice(raizDaWeb.length + 1)])
    }
  }
  return usos
}

/** As declarações de cor de `estilos.css`, nome e valor. O nome pode ter hífen: `caramelo-texto`, `slate-900`. */
function declaracoesDeCor(): Map<string, string> {
  const css = readFileSync(join(raizDaWeb, 'estilos.css'), 'utf8')
  return new Map([...css.matchAll(/--color-([a-z]+(?:-[a-z0-9]+)*)\s*:\s*([^;]+);/g)].map(([, cor, valor]) => [cor ?? '', (valor ?? '').trim().toLowerCase()]))
}

/** As cores que `estilos.css` devolve depois de zerar a paleta. */
function coresDeclaradas(): Set<string> {
  return new Set([...declaracoesDeCor()].filter(([, valor]) => /^#[0-9a-f]{3,8}$/.test(valor)).map(([cor]) => cor))
}

const PASTA_DOS_COMPONENTES = join(raizDaWeb, 'componentes')

describe('paleta de estilos.css', () => {
  it('toda cor que o código usa está declarada, senão a classe não gera CSS', () => {
    const usadas = coresUsadas()
    // Sem esta âncora, o caso passaria vazio no dia em que a varredura deixasse de achar arquivo — uma mudança na
    // pasta ou no filtro de extensão —, e `[].filter(...)` é `[]`. O botão primário é a cor da marca (9.1).
    expect(usadas.get('caramelo'), 'a varredura não está achando os arquivos da web').toContain('componentes/Botao.tsx')
    const declaradas = coresDeclaradas()
    const semDeclaracao = [...usadas].filter(([cor]) => !declaradas.has(cor)).map(([cor, arquivos]) => `${cor} (${[...new Set(arquivos)].join(', ')})`)
    expect(semDeclaracao, 'cor usada sem `--color-<cor>` em estilos.css: a classe sai sem CSS nenhum').toEqual([])
  })

  it('a paleta é zerada e toda cor devolvida é hex, nunca oklch()', () => {
    const css = readFileSync(join(raizDaWeb, 'estilos.css'), 'utf8')
    // Sem o `initial`, a paleta em oklch() volta inteira e o Chrome 109 do laboratório perde as cores caladamente.
    expect(css).toContain('--color-*: initial')
    const declaracoes = declaracoesDeCor()
    // Os nomes com hífen (`caramelo-texto`) contam: sem eles a conferência deixaria de fora metade da D72.
    expect(declaracoes.get('caramelo-texto')).toBeDefined()
    expect([...declaracoes].filter(([, valor]) => !/^#[0-9a-f]{3,8}$/.test(valor)).map(([cor, valor]) => `${cor}: ${valor}`)).toEqual([])
  })

  it('todo token de cor da 9.9 está declarado, com o mesmo hex do documento', () => {
    const tokens = tokensDaD72()
    // A 9.9 tem 33 cores, `white` e `black` incluídas; outro número é o bloco do documento lido pela metade.
    expect(tokens.size).toBe(33)
    const declaracoes = declaracoesDeCor()
    const divergentes = [...tokens]
      .filter(([nome, hex]) => declaracoes.get(nome) !== hex)
      .map(([nome, hex]) => `${nome}: a 9.9 diz ${hex}, estilos.css diz ${declaracoes.get(nome) ?? 'nada'}`)
    expect(divergentes).toEqual([])
  })

  it('o teste enxerga a cor que falta, e não só a que sobra', () => {
    // Sem isto, um erro no regex deixaria o primeiro teste passando sempre, que é o modo de falhar deste arquivo.
    const achadas = [...'<p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">'.matchAll(CLASSE_COM_COR)].map(([, cor]) => cor)
    expect(achadas).toEqual(['amber-300', 'amber-50', 'amber-900'])
  })
})

describe('componentes compartilhados na pele da D72', () => {
  it('nenhum componente de `componentes/` usa cor da paleta de fábrica nem modificador de opacidade', () => {
    const arquivos = arquivosDeCodigo(PASTA_DOS_COMPONENTES)
    // Os dez da tarefa 1.0 da A0, mais o QR e a marca: menos que isso é a varredura que deixou de achar a pasta.
    expect(arquivos.length).toBeGreaterThanOrEqual(10)
    const achados = arquivos.flatMap((arquivo) => {
      const conteudo = readFileSync(arquivo, 'utf8')
      const nome = arquivo.slice(raizDaWeb.length + 1)
      return [...[...conteudo.matchAll(CLASSE_DE_FABRICA)].map(([classe]) => `${nome}: ${classe.trim()}`), ...[...conteudo.matchAll(MODIFICADOR_DE_OPACIDADE)].map(([classe]) => `${nome}: ${classe.trim()}`)]
    })
    expect(achados, 'componente com a paleta anterior: troque pelo token da D72 (Tech Spec da A0, seção 9)').toEqual([])
  })

  it('a varredura dos componentes enxerga a classe antiga e o modificador de opacidade', () => {
    // Sem isto, um erro nos dois regex deixaria o caso acima passando sempre.
    const exemplo = '<p className="border-slate-400 hover:bg-blue-700 text-red-900 bg-white text-tinta bg-tinta/40 sm:border-linha/5">'
    expect([...exemplo.matchAll(CLASSE_DE_FABRICA)].map(([, cor]) => cor)).toEqual(['slate-400', 'blue-700', 'red-900'])
    expect([...exemplo.matchAll(MODIFICADOR_DE_OPACIDADE)].map(([classe]) => classe.trim().replace(/^:/, ''))).toEqual(['bg-tinta/40', 'border-linha/5'])
  })
})
