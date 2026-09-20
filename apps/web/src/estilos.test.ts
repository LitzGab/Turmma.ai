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
 */
const raizDaWeb = dirname(fileURLToPath(import.meta.url))

const FAMILIAS = [
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
].join('|')

/** As propriedades do Tailwind que pintam a partir da paleta. */
const PROPRIEDADES = ['bg', 'text', 'border', 'outline', 'ring', 'fill', 'stroke', 'divide', 'placeholder', 'accent', 'caret', 'decoration', 'from', 'via', 'to', 'shadow'].join('|')

/** `hover:bg-amber-50`, `sm:text-slate-900/80` e `[&>p]:border-red-300` contam igual: o prefixo não muda a cor. */
const CLASSE_COM_COR = new RegExp(String.raw`(?:^|[\s"'\`:\[])(?:${PROPRIEDADES})-((?:${FAMILIAS})(?:-\d{2,3})?)(?![\w-])`, 'g')

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

/** As cores que `estilos.css` devolve depois de zerar a paleta. */
function coresDeclaradas(): Set<string> {
  const css = readFileSync(join(raizDaWeb, 'estilos.css'), 'utf8')
  return new Set([...css.matchAll(/--color-([a-z]+(?:-\d{2,3})?)\s*:\s*(#[0-9a-fA-F]{3,8})/g)].map(([, cor]) => cor ?? ''))
}

describe('paleta de estilos.css', () => {
  it('toda cor que o código usa está declarada, senão a classe não gera CSS', () => {
    const usadas = coresUsadas()
    // Sem esta âncora, o caso passaria vazio no dia em que a varredura deixasse de achar arquivo — uma mudança na
    // pasta ou no filtro de extensão —, e `[].filter(...)` é `[]`. O botão é a cor mais antiga da web.
    expect(usadas.get('blue-700'), 'a varredura não está achando os arquivos da web').toContain('componentes/Botao.tsx')
    const declaradas = coresDeclaradas()
    const semDeclaracao = [...usadas].filter(([cor]) => !declaradas.has(cor)).map(([cor, arquivos]) => `${cor} (${[...new Set(arquivos)].join(', ')})`)
    expect(semDeclaracao, 'cor usada sem `--color-<cor>` em estilos.css: a classe sai sem CSS nenhum').toEqual([])
  })

  it('a paleta é zerada e toda cor devolvida é hex, nunca oklch()', () => {
    const css = readFileSync(join(raizDaWeb, 'estilos.css'), 'utf8')
    // Sem o `initial`, a paleta em oklch() volta inteira e o Chrome 109 do laboratório perde as cores caladamente.
    expect(css).toContain('--color-*: initial')
    const declaracoes = [...css.matchAll(/--color-([a-z]+(?:-\d{2,3})?)\s*:\s*([^;]+);/g)].filter(([, cor]) => cor !== undefined)
    expect(declaracoes.length).toBeGreaterThan(0)
    expect(declaracoes.filter(([, , valor]) => !/^#[0-9a-fA-F]{3,8}$/.test((valor ?? '').trim())).map(([linha]) => linha)).toEqual([])
  })

  it('o teste enxerga a cor que falta, e não só a que sobra', () => {
    // Sem isto, um erro no regex deixaria o primeiro teste passando sempre, que é o modo de falhar deste arquivo.
    const achadas = [...'<p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">'.matchAll(CLASSE_COM_COR)].map(([, cor]) => cor)
    expect(achadas).toEqual(['amber-300', 'amber-50', 'amber-900'])
  })
})
