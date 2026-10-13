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
 * Por isso a lista é conferida por teste, e não por atenção. A pele é a da D80 (`docs/interface.md` 9.10), em dois
 * blocos, o claro e o escuro, com os mesmos nomes. A guarda é estrita desde a tarefa 2.0 da A0: toda classe que pinta,
 * em qualquer arquivo de `apps/web/src`, pede um nome da 9.10 e nenhum outro, e sem modificador de opacidade
 * (`bg-tinta/40`), que vira `color-mix()` e é descartado pelo Chrome 109 (9.9, "Modificador de opacidade em cor não
 * entra"). Desde a X1 ela reprova também o que faria uma tela ficar errada no escuro sem ninguém ver: `white` e `black`
 * em classe, a variante `dark:` e a cor escrita à mão num atributo.
 */
const raizDaWeb = dirname(fileURLToPath(import.meta.url))
const raizDoRepositorio = join(raizDaWeb, '..', '..', '..')

/** Quantas cores cada bloco declara, `white` e `black` incluídas. Outro número é bloco lido pela metade, ou cor nova sem o par. */
const CORES_POR_BLOCO = 97

/** Os únicos tokens que não são hex de seis dígitos: o véu é hex de oito, com a transparência nos dois últimos. */
const CORES_COM_TRANSPARENCIA = ['veu']

type Tema = 'claro' | 'escuro'
type Paleta = Map<string, string>

const DECLARACAO_DE_COR = /--color-([a-z]+(?:-[a-z0-9]+)*)\s*:\s*([^;]+);/g

/** As declarações de cor de um trecho de CSS, nome e valor em minúsculas. O nome pode ter hífen: `caramelo-texto`. */
function coresDe(css: string): Paleta {
  return new Map([...css.matchAll(DECLARACAO_DE_COR)].map(([, cor, valor]) => [cor ?? '', (valor ?? '').trim().toLowerCase()]))
}

/** O miolo do bloco que abre na primeira `{` depois de `inicio`, até a `}` que o fecha. */
function miolo(texto: string, inicio: number): string {
  const abertura = texto.indexOf('{', inicio)
  let profundidade = 0
  for (let posicao = abertura; posicao < texto.length; posicao++) {
    if (texto[posicao] === '{') profundidade++
    else if (texto[posicao] === '}' && --profundidade === 0) return texto.slice(abertura + 1, posicao)
  }
  throw new Error('bloco de CSS sem fechamento')
}

const ABERTURA_DO_CLARO = '@theme static'
const ABERTURA_DO_ESCURO = ":root[data-tema='escuro']"

/** Os dois blocos de cor de um CSS: o do `@theme static` e o de `:root[data-tema='escuro']`. */
function blocosDe(css: string): Record<Tema, Paleta> {
  const claro = css.indexOf(ABERTURA_DO_CLARO)
  // O bloco de tokens do escuro é o que abre com `{` logo depois do seletor, sem nada entre os dois.
  const escuro = css.search(/:root\[data-tema='escuro'\]\s*\{/)
  if (claro === -1 || escuro === -1) throw new Error('o CSS não tem os dois blocos de cor')
  return { claro: coresDe(miolo(css, claro)), escuro: coresDe(miolo(css, escuro)) }
}

/**
 * Os tokens de cor dos dois blocos `css` da 9.10 do `docs/interface.md`, com o valor de cada um. O documento é a fonte: o
 * teste lê de lá, e não de uma cópia aqui, para que um hex trocado em qualquer um dos dois lados deixe vermelho.
 */
function tokensDoDocumento(): Record<Tema, Paleta> {
  const documento = readFileSync(join(raizDoRepositorio, 'docs', 'interface.md'), 'utf8')
  const inicio = documento.indexOf('### 9.10')
  if (inicio === -1) throw new Error('docs/interface.md sem a seção 9.10')
  const proxima = documento.indexOf('\n## ', inicio)
  const secao = documento.slice(inicio, proxima === -1 ? undefined : proxima)
  const blocos = [...secao.matchAll(/```css\n([\s\S]*?)```/g)].map(([, bloco]) => bloco ?? '')
  const claro = blocos.find((bloco) => bloco.includes(ABERTURA_DO_CLARO))
  const escuro = blocos.find((bloco) => bloco.includes(ABERTURA_DO_ESCURO))
  if (claro === undefined || escuro === undefined) throw new Error('a 9.10 não tem os dois blocos css, o claro e o escuro')
  return { claro: coresDe(claro), escuro: coresDe(escuro) }
}

function cssDoProduto(): string {
  return readFileSync(join(raizDaWeb, 'estilos.css'), 'utf8')
}

/** Os nomes de cor da 9.10: os únicos que uma classe de cor pode pedir. */
const NOMES_DE_COR = new Set(blocosDe(cssDoProduto()).claro.keys())

/** `white` e `black` não mudam com o tema: classe com eles fica errada no escuro. Só o QR, que precisa ficar claro, pode. */
const ARQUIVOS_COM_BRANCO_FIXO = ['componentes/CodigoQr.tsx']

/** Os arquivos que podem escrever cor à mão. A onça entra aqui com a tarefa dela; o ícone ilustrado lê token e não entra. */
const ARQUIVOS_COM_COR_EM_LINHA = ['componentes/CodigoQr.tsx']

/** As sombras do `@theme` (`shadow-caixa`, `shadow-flutua`): `shadow-<nome>` com elas é sombra, não cor. */
function sombrasDeclaradas(): Set<string> {
  return new Set([...cssDoProduto().matchAll(/--shadow-([a-z]+(?:-[a-z0-9]+)*)\s*:/g)].map(([, nome]) => nome ?? ''))
}

/**
 * O que, em cada propriedade que pinta, **não** é cor: tamanho de texto, alinhamento, largura e lado de borda, estilo
 * de linha, sombra de fábrica e do `@theme`. Qualquer outro valor é lido como cor e precisa ser um nome da 9.10. É a
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

/** A variante `dark:` antes de qualquer classe. O escuro é o atributo `data-tema`, e a variante do Tailwind não o enxerga. */
const VARIANTE_DARK = /(?:^|[\s"'`])((?:[a-z-]+:)*dark:[\w[\]/.#-]+)/g

/**
 * Cor escrita à mão, que não muda com o tema: hex ou função de cor. A guarda a procura **em qualquer lugar do
 * arquivo**, e não só em `fill`, `stroke` e `style`: atributo com valor condicional, a segunda camada de uma sombra,
 * o segundo hex de um gradiente e o objeto de estilo guardado numa constante escapam de toda regra que dependa da
 * posição. Nem a cor entre colchetes de uma classe fica de fora: `inset-shadow-[#fff]` não é classe que a guarda de
 * classes conheça, e o Tailwind a transforma em cor fixa do mesmo jeito.
 *
 * O preço são os falsos positivos, todos de texto que parece cor: o hex num comentário (quem comenta diz o nome do
 * token), a âncora `href="#cafe"`, o `url(#fade)` cujo nome só tem letras de `a` a `f`, e o texto entre aspas que é
 * exatamente um nome de cor do CSS, em qualquer caixa (`'tan'`, `'gold'`, `'navy'`). Quem cair num deles troca o nome.
 *
 * O que a guarda **não** pega: a cor pelo nome dentro de um valor composto (`'0 1px white'`) e a cor montada em tempo
 * de execução; para essas, o que há é o axe com o tema escuro, no e2e.
 */
const COR_ESCRITA = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/gi

/** O nome à esquerda da cor, na mesma linha, só para a mensagem: o atributo ou a propriedade que a recebe. */
const NOME_A_ESQUERDA = /([A-Za-z]+)\s*[=:](?!.*[A-Za-z]\s*[=:])/

/** Os nomes de cor do CSS. `transparent`, `currentColor` e `none` não entram: não são cor que deixe de virar com o tema. */
const NOMES_DE_COR_DO_CSS =
  'aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgr[ae]y|darkgreen|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategr[ae]y|darkturquoise|darkviolet|deeppink|deepskyblue|dimgr[ae]y|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gr[ae]y|green|greenyellow|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgr[ae]y|lightgreen|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategr[ae]y|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategr[ae]y|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen'

/**
 * A cor pelo nome, quando ela é o texto inteiro entre aspas: `fill="white"`, `fill={aberto ? 'white' : 'none'}`,
 * `style={{ color: 'red' }}`. Também não vira com o tema, e vale em qualquer lugar do arquivo, como a cor escrita.
 */
const COR_PELO_NOME = new RegExp(String.raw`(["'\`])(${NOMES_DE_COR_DO_CSS})\1`, 'gi')

/** A classe inteira em volta de uma cor entre colchetes (`sm:bg-[#1d4ed8]`), para a mensagem; `null` fora de colchete. */
function classeArbitraria(conteudo: string, posicao: number): string | null {
  if (conteudo[posicao - 1] !== '[') return null
  const inicio = Math.max(...[' ', '\n', '"', "'", '`'].map((limite) => conteudo.lastIndexOf(limite, posicao))) + 1
  const fim = conteudo.indexOf(']', posicao)
  return fim === -1 ? null : conteudo.slice(inicio, fim + 1)
}

/** As faces fortes de hoje, que viram com o tema: o texto em cima delas é `sobre-cor` ou `sobre-grafite`, nunca `tinta` nem branco. */
const FACE_FORTE = /^bg-(?:noite|erro|caramelo|caramelo-claro|caramelo-fundo)$/

/** O texto que não acompanha a face forte: `tinta` vira clara no escuro, e `white` não vira. */
const TEXTO_QUE_NAO_ACOMPANHA = /^text-(?:tinta|white)$/

/** Cada texto entre aspas ou crases de uma linha só: é onde mora uma lista de classes. */
const TEXTO_ENTRE_ASPAS = /(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g

/**
 * O texto que não acompanha a face forte, na mesma lista de classes e com a mesma variante dela: `bg-caramelo
 * text-tinta` reprova, e `disabled:bg-inativo disabled:text-tinta`, ao lado de um `bg-caramelo` sem variante, passa.
 */
function textosSobreFaceForte(conteudo: string): string[] {
  const achados: string[] = []
  for (const [, , lista = ''] of conteudo.matchAll(TEXTO_ENTRE_ASPAS)) {
    const classes = lista.split(/\s+/).map((classe) => {
      const corte = classe.lastIndexOf(':') + 1
      return { variante: classe.slice(0, corte), nome: classe.slice(corte) }
    })
    for (const face of classes.filter(({ nome }) => FACE_FORTE.test(nome))) {
      for (const texto of classes.filter(({ variante, nome }) => variante === face.variante && TEXTO_QUE_NAO_ACOMPANHA.test(nome))) {
        achados.push(`${texto.variante}${texto.nome} com ${face.variante}${face.nome}`)
      }
    }
  }
  return achados
}

/** Cada cor escrita à mão de `conteudo`, como `propriedade cor`, na ordem em que aparece e uma vez só. */
function coresEmLinha(conteudo: string): string[] {
  const achados = new Map<number, string>()
  const nomeDe = (posicao: number) => NOME_A_ESQUERDA.exec(conteudo.slice(conteudo.lastIndexOf('\n', posicao) + 1, posicao))?.[1] ?? 'texto'
  for (const achado of conteudo.matchAll(COR_ESCRITA)) {
    achados.set(achado.index, classeArbitraria(conteudo, achado.index) ?? `${nomeDe(achado.index)} ${achado[0]}`)
  }
  for (const achado of conteudo.matchAll(COR_PELO_NOME)) {
    achados.set(achado.index, `${nomeDe(achado.index)} ${achado[2] ?? ''}`)
  }
  return [...achados].sort(([a], [b]) => a - b).map(([, achado]) => achado)
}

/**
 * As classes e os atributos de `conteudo` que a guarda reprova, como `arquivo: o quê (motivo)`: a cor com nome fora da
 * 9.10 (a paleta de fábrica, que a `--color-*: initial` apaga, ou um nome que ninguém declarou), a cor arbitrária, o
 * modificador de opacidade em cor, que vira `color-mix()` e some no Chrome 109, e o que não vira com o tema.
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
    else if ((valor === 'white' || valor === 'black') && !ARQUIVOS_COM_BRANCO_FIXO.includes(arquivo)) reprovadas.push(`${arquivo}: ${classe} (não muda com o tema)`)
  }
  for (const [, classe = ''] of conteudo.matchAll(VARIANTE_DARK)) reprovadas.push(`${arquivo}: ${classe} (variante dark:)`)
  for (const par of textosSobreFaceForte(conteudo)) reprovadas.push(`${arquivo}: ${par} (texto que não acompanha a face)`)
  if (!ARQUIVOS_COM_COR_EM_LINHA.includes(arquivo)) {
    for (const cor of coresEmLinha(conteudo)) reprovadas.push(`${arquivo}: ${cor} (cor em linha)`)
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

/** O que diverge entre duas paletas, nos dois sentidos, como `nome: um lado diz X, o outro diz Y`. */
function divergencias(documento: Paleta, codigo: Paleta): string[] {
  const nomes = [...new Set([...documento.keys(), ...codigo.keys()])].sort()
  return nomes.filter((nome) => documento.get(nome) !== codigo.get(nome)).map((nome) => `${nome}: a 9.10 diz ${documento.get(nome) ?? 'nada'}, estilos.css diz ${codigo.get(nome) ?? 'nada'}`)
}

describe('paleta de estilos.css', () => {
  it('a paleta é zerada e toda cor devolvida é hex, nunca oklch()', () => {
    const css = cssDoProduto()
    // Sem o `initial`, a paleta em oklch() volta inteira e o Chrome 109 do laboratório perde as cores caladamente.
    expect(css).toContain('--color-*: initial')
    const { claro, escuro } = blocosDe(css)
    // Os nomes com hífen (`caramelo-texto`) contam: sem eles a conferência deixaria de fora metade da pele.
    expect(claro.get('caramelo-texto')).toBeDefined()
    for (const [tema, paleta] of [['claro', claro], ['escuro', escuro]] as const) {
      const foraDoHex = [...paleta]
        .filter(([cor, valor]) => !(CORES_COM_TRANSPARENCIA.includes(cor) ? /^#[0-9a-f]{8}$/ : /^#[0-9a-f]{6}$/).test(valor))
        .map(([cor, valor]) => `${tema} · ${cor}: ${valor}`)
      expect(foraDoHex).toEqual([])
    }
  })

  it.each(['claro', 'escuro'] as const)('o bloco %s de estilos.css declara exatamente as cores da 9.10, com o mesmo hex, e nenhuma outra', (tema) => {
    const documento = tokensDoDocumento()[tema]
    // `white` e `black` incluídas; outro número é o bloco do documento lido pela metade, e o teste passaria vazio.
    expect(documento.size).toBe(CORES_POR_BLOCO)
    expect(divergencias(documento, blocosDe(cssDoProduto())[tema])).toEqual([])
  })

  it('o claro e o escuro têm o mesmo conjunto de nomes: cor sem par herdaria o valor do outro tema', () => {
    const { claro, escuro } = blocosDe(cssDoProduto())
    expect(claro.size).toBe(CORES_POR_BLOCO)
    expect([...claro.keys()].sort()).toEqual([...escuro.keys()].sort())
  })

  it('o escuro fica fora de camada, para vencer o bloco do Tailwind', () => {
    const css = cssDoProduto()
    const escuro = css.search(/:root\[data-tema='escuro'\]\s*\{/)
    // Dentro de `@layer`, o bloco perderia para o `@layer theme` em que o Tailwind põe o `@theme`, pela ordem das camadas.
    const camadasAbertasAntes = [...css.slice(0, escuro).matchAll(/@layer\s+[a-z]+\s*\{/g)].length
    expect(camadasAbertasAntes).toBe(0)
  })
})

describe('guarda de cor em apps/web/src (U3)', () => {
  it('nenhum arquivo da web pede cor fora do @theme da 9.10, modificador de opacidade, nem cor que não vira com o tema', () => {
    const arquivos = arquivosDeCodigo(raizDaWeb)
    const conteudos = arquivos.map((arquivo) => ({ nome: arquivo.slice(raizDaWeb.length + 1), conteudo: readFileSync(arquivo, 'utf8') }))
    // Sem estas âncoras o caso passaria vazio no dia em que a varredura deixasse de achar arquivo — uma mudança na
    // pasta ou no filtro de extensão —, e `[].flatMap(...)` é `[]`. O botão primário é a cor da marca (9.1), e as
    // telas de `paginas/` são as que a tarefa 2.0 da A0 migrou; a de vínculos foi para `areas/professor/` na 11.0 da A1.
    const nomes = conteudos.map(({ nome }) => nome)
    expect(nomes, 'a varredura não está achando os arquivos da web').toContain('componentes/Botao.tsx')
    expect(nomes.filter((nome) => nome.startsWith('paginas/') || nome.startsWith('areas/')).length).toBeGreaterThanOrEqual(10)
    // As classes do botão moraram em `Botao.tsx` até o MVP de apresentação; com as cinco variantes da 11.1, a tabela
    // que o `Botao` lê fica em `botao-secundario.ts`, e é lá que o laranja da ação primária precisa estar.
    expect(conteudos.find(({ nome }) => nome === 'componentes/botao-secundario.ts')?.conteudo).toMatch(/\bbg-caramelo\b/)
    // As peças do MVP de apresentação (`docs/mvp-rapido.md`, 9.3) também são varridas: o selo "IA" pinta com a família
    // `ia`, e a pasta inteira das peças de IA entra na conta.
    expect(conteudos.find(({ nome }) => nome === 'componentes/ia/AssinaturaIA.tsx')?.conteudo).toMatch(/\bbg-ia-cx\b/)
    expect(nomes.filter((nome) => nome.startsWith('componentes/ia/') && nome.endsWith('.tsx')).length).toBeGreaterThanOrEqual(10)
    // As duas listas fechadas apontam arquivo que existe: lista com nome velho deixaria a exceção valendo para ninguém.
    for (const arquivo of [...ARQUIVOS_COM_BRANCO_FIXO, ...ARQUIVOS_COM_COR_EM_LINHA]) expect(nomes, `${arquivo} saiu do lugar`).toContain(arquivo)
    const reprovadas = conteudos.flatMap(({ nome, conteudo }) => classesReprovadas(nome, conteudo))
    expect(reprovadas, 'troque pelo token da D80 (docs/interface.md 9.1 e 9.10)').toEqual([])
  })

  it('a guarda reprova a cor fora do @theme e o modificador de opacidade, com o arquivo e a classe', () => {
    // Sem isto, um erro no regex deixaria o caso acima passando sempre, que é o modo de falhar deste arquivo.
    const fixture = [
      '<p className="rounded-cartao border border-amber-300 bg-amber-50 p-4 text-amber-900">',
      '<p className="hover:bg-blue-700 bg-neutral-200 text-foo sm:bg-[#1d4ed8]">',
      '<p className="bg-tinta/80 text-apoio/50 enabled:hover:border-linha/[.4]">',
      // O que passa: token da 9.10, antigo ou novo, e o que não é cor na mesma propriedade.
      '<p className="bg-caramelo text-sobre-cor bg-laranja-claro text-azul-texto border-borda border-b border-2 text-sm/6 text-base shadow-flutua outline-offset-2 bg-[url(x.svg)]">',
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
      // A cor entre colchetes reprova duas vezes: como classe fora do `@theme` e como cor escrita à mão.
      'paginas/Fixture.tsx: sm:bg-[#1d4ed8] (cor em linha)',
    ])
  })

  it('a guarda reprova o que não vira com o tema: branco e preto fixos, a variante dark: e a cor escrita à mão', () => {
    // No escuro, `text-white` sobre uma face que virou clara some, e `dark:` nunca liga: o tema é `data-tema`.
    const fixture = [
      '<p className="bg-fundo text-white hover:bg-black">',
      '<p className="dark:bg-tinta md:dark:text-fundo">',
      '<path d="M0 0" fill="#333333" stroke="rgb(1, 2, 3)" />',
      '<div style={{ backgroundColor: \'#fff\', color: "hsl(0 0% 0%)" }} />',
      '<div style={{ background: "#fff", boxShadow: "0 0 0 2px #123456", borderTopColor: aberto ? \'#123\' : undefined, outlineColor: "rgb(1,2,3)" }} />',
      // A cor em qualquer posição: a segunda camada da sombra, os dois hex do gradiente, o valor condicional do
      // atributo, o objeto de estilo guardado numa constante, a função de cor nova e a cor pelo nome.
      '<div style={{ boxShadow: "0 0 0 2px var(--color-borda), 0 1px #fff", backgroundImage: "linear-gradient(#fff, #000)" }} />',
      "<path d=\"M0 0\" fill={aberto ? '#fff' : '#000'} />",
      "const estilo = { accentColor: 'oklch(70% 0.1 200)' }",
      '<circle r="2" fill="white" stroke=\'red\' />',
      // A cor entre colchetes de uma classe que a guarda de classes não conhece, a função em maiúscula e a cor pelo
      // nome fora do atributo literal.
      '<p className="inset-shadow-[#fff] drop-shadow-[#123456] inset-ring-[rgb(1,2,3)]">',
      '<div style={{ color: "RGB(1, 2, 3)", outlineColor: \'White\' }} />',
      "<path d=\"M2 2\" fill={aberto ? 'white' : 'none'} floodColor = \"red\" />",
      // O que passa: o token no objeto de estilo e no atributo.
      '<div style={{ boxShadow: "0 0 0 2px var(--color-borda)", width: 3 }} />',
      '<path d="M1 1" fill="var(--color-laranja)" stroke="url(#desenho)" />',
      // O que passa: o token no atributo (`currentColor`, `none`) e a classe de cor do `@theme`.
      '<path d="M0 0" fill="currentColor" stroke="none" className="fill-tinta" />',
    ].join('\n')
    expect(classesReprovadas('paginas/Fixture.tsx', fixture)).toEqual([
      'paginas/Fixture.tsx: text-white (não muda com o tema)',
      'paginas/Fixture.tsx: bg-black (não muda com o tema)',
      'paginas/Fixture.tsx: dark:bg-tinta (variante dark:)',
      'paginas/Fixture.tsx: md:dark:text-fundo (variante dark:)',
      'paginas/Fixture.tsx: fill #333333 (cor em linha)',
      'paginas/Fixture.tsx: stroke rgb( (cor em linha)',
      'paginas/Fixture.tsx: backgroundColor #fff (cor em linha)',
      'paginas/Fixture.tsx: color hsl( (cor em linha)',
      'paginas/Fixture.tsx: background #fff (cor em linha)',
      'paginas/Fixture.tsx: boxShadow #123456 (cor em linha)',
      'paginas/Fixture.tsx: borderTopColor #123 (cor em linha)',
      'paginas/Fixture.tsx: outlineColor rgb( (cor em linha)',
      'paginas/Fixture.tsx: boxShadow #fff (cor em linha)',
      'paginas/Fixture.tsx: backgroundImage #fff (cor em linha)',
      'paginas/Fixture.tsx: backgroundImage #000 (cor em linha)',
      'paginas/Fixture.tsx: fill #fff (cor em linha)',
      'paginas/Fixture.tsx: fill #000 (cor em linha)',
      'paginas/Fixture.tsx: accentColor oklch( (cor em linha)',
      'paginas/Fixture.tsx: fill white (cor em linha)',
      'paginas/Fixture.tsx: stroke red (cor em linha)',
      'paginas/Fixture.tsx: inset-shadow-[#fff] (cor em linha)',
      'paginas/Fixture.tsx: drop-shadow-[#123456] (cor em linha)',
      'paginas/Fixture.tsx: inset-ring-[rgb(1,2,3)] (cor em linha)',
      'paginas/Fixture.tsx: color RGB( (cor em linha)',
      'paginas/Fixture.tsx: outlineColor White (cor em linha)',
      'paginas/Fixture.tsx: fill white (cor em linha)',
      'paginas/Fixture.tsx: floodColor red (cor em linha)',
    ])
  })

  it('a guarda reprova o texto que não acompanha a face forte, na mesma lista de classes e com a mesma variante', () => {
    // No escuro a face forte clareia ou fica, e `tinta` clareia junto: `tinta` sobre o laranja dá 2,2:1, e sobre o
    // oficial some. O par certo é `sobre-cor` na face colorida e `sobre-grafite` na escura.
    const fixture = [
      '<p className="bg-caramelo text-tinta">',
      '<p className="rounded-full bg-noite px-3 text-tinta">',
      "const perigo = 'bg-erro text-white hover:bg-caramelo-claro hover:text-tinta'",
      // O que passa: o texto que acompanha, e o `tinta` de outra variante que não a da face (o desligado do primário).
      "const primario = 'bg-caramelo text-sobre-cor enabled:active:bg-caramelo-fundo disabled:bg-inativo disabled:text-tinta'",
      '<p className="bg-noite text-sobre-grafite">',
      '<p className="bg-fundo text-tinta">',
    ].join('\n')
    expect(classesReprovadas('paginas/Fixture.tsx', fixture)).toEqual([
      'paginas/Fixture.tsx: text-white (não muda com o tema)',
      'paginas/Fixture.tsx: text-tinta com bg-caramelo (texto que não acompanha a face)',
      'paginas/Fixture.tsx: text-tinta com bg-noite (texto que não acompanha a face)',
      'paginas/Fixture.tsx: text-white com bg-erro (texto que não acompanha a face)',
      'paginas/Fixture.tsx: hover:text-tinta com hover:bg-caramelo-claro (texto que não acompanha a face)',
    ])
  })

  it('a seleção de texto pinta com token, nos dois temas: fundo laranja-borda e texto tinta', () => {
    // Sem a regra, o navegador pinta a seleção com o azul do sistema, que no escuro apaga o texto claro; e com hex
    // escrito à mão a cor ficaria fora da 9.10 e não viraria com o tema (RF1).
    const selecao = /::selection\s*\{([^}]*)\}/.exec(cssDoProduto())?.[1] ?? ''
    expect(selecao).toMatch(/background-color:\s*var\(--color-laranja-borda\)/)
    expect(selecao).toMatch(/(?:^|[\s;])color:\s*var\(--color-tinta\)/)
    expect([...cssDoProduto().matchAll(/::selection\s*\{/g)]).toHaveLength(1)
  })

  it('fora dos dois blocos de token, o estilos.css escreve cor uma vez só: o véu do diálogo', () => {
    // Toda regra do CSS pinta por variável, e é isso que a faz virar com o tema. O véu é a exceção: antes do Chrome
    // 122 o `::backdrop` não herda variável, e a regra ficaria sem cor nenhuma.
    const css = cssDoProduto()
    const claro = css.indexOf(ABERTURA_DO_CLARO)
    const escuro = css.search(/:root\[data-tema='escuro'\]\s*\{/)
    const semTokens = [miolo(css, claro), miolo(css, escuro)].reduce((resto, bloco) => resto.replace(bloco, ''), css)
    const semComentario = semTokens.replace(/\/\*[\s\S]*?\*\//g, '')
    expect([...semComentario.matchAll(COR_ESCRITA)].map(([cor]) => cor)).toEqual(['rgba('])
    expect(semComentario).toMatch(/dialog::backdrop\s*\{\s*background-color:\s*rgba\(13, 13, 13, 0\.75\);\s*\}/)
  })

  it('o QR é a única exceção, e só nele: branco fixo e cor em linha passam no arquivo da lista', () => {
    const qr = '<svg className="bg-white"><path fill="#0d0d0d" /></svg>'
    expect(classesReprovadas('componentes/CodigoQr.tsx', qr)).toEqual([])
    expect(classesReprovadas('componentes/Outro.tsx', qr)).toEqual(['componentes/Outro.tsx: bg-white (não muda com o tema)', 'componentes/Outro.tsx: fill #0d0d0d (cor em linha)'])
  })
})
