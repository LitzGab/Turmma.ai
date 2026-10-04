import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  MATERIAL_DE_DEMONSTRACAO,
  PAGINAS_DO_MATERIAL,
  normalizarTexto,
  rodapeDaPagina,
  textoDaPagina,
  type PaginaDoMaterial,
} from './conteudo-estequiometria.ts'
import { extrairTextoPorPagina } from './extrair-texto.ts'
import { CAMINHO_DO_MATERIAL, gerarMaterial } from './gerar-material.ts'

// O material de demonstração só serve se a ingestão conseguir lê-lo: a extração por página com `pdfjs-dist`
// é a mesma que o produto faz (`docs/mvp-rapido.md` seção 4, item 3). O que se prova aqui é que o PDF
// commitado devolve, página por página, o texto que está em `conteudo-estequiometria.ts`.

const PAGINAS_ESPERADAS = 6

let commitado: Uint8Array
let paginasDoCommitado: string[]
let gerado: Uint8Array
let paginasDoGerado: string[]

beforeAll(async () => {
  commitado = new Uint8Array(readFileSync(CAMINHO_DO_MATERIAL))
  gerado = await gerarMaterial()
  paginasDoCommitado = await extrairTextoPorPagina(commitado)
  paginasDoGerado = await extrairTextoPorPagina(gerado)
})

function paginaExtraida(numero: number): string {
  const texto = paginasDoCommitado[numero - 1]
  if (texto === undefined) throw new Error(`o PDF commitado não tem a página ${String(numero)}`)
  return normalizarTexto(texto)
}

describe('o PDF commitado do material de demonstração', () => {
  it(`tem as ${String(PAGINAS_ESPERADAS)} páginas do conteúdo e fica bem abaixo de 1 MB`, () => {
    expect(PAGINAS_DO_MATERIAL.map((pagina) => pagina.numero)).toEqual([1, 2, 3, 4, 5, 6])
    expect(paginasDoCommitado).toHaveLength(PAGINAS_ESPERADAS)
    expect(Buffer.from(commitado.subarray(0, 5)).toString('latin1')).toBe('%PDF-')
    expect(commitado.length).toBeLessThan(100_000)
  })

  it.each(PAGINAS_DO_MATERIAL)('a página $numero, extraída sozinha, traz as frases-chave dela, com acento', (pagina) => {
    const texto = paginaExtraida(pagina.numero)
    expect(pagina.frasesChave.length).toBeGreaterThan(0)
    for (const frase of pagina.frasesChave) expect(texto).toContain(frase)
    // A frase-chave é do conteúdo desta página, não de outra: sem isto a lista poderia apontar para a página errada.
    for (const frase of pagina.frasesChave) expect(normalizarTexto(textoDaPagina(pagina.numero))).toContain(frase)
    // O número impresso no rodapé é o que a demonstração cita ("p. 3").
    expect(texto.endsWith(rodapeDaPagina(pagina.numero))).toBe(true)
    expect(texto.endsWith(`p. ${String(pagina.numero)}`)).toBe(true)
  })

  it.each(PAGINAS_DO_MATERIAL)('a página $numero volta da extração com o texto inteiro do conteúdo, sem caractere trocado', (pagina) => {
    expect(paginaExtraida(pagina.numero)).toBe(normalizarTexto(textoDaPagina(pagina.numero)))
  })

  it('acento, expoente, sinal de vezes e índice na linha do símbolo sobrevivem à fonte padrão e à extração', () => {
    expect(paginaExtraida(1)).toContain('Mol é a quantidade de matéria que contém 6,02 × 10²³ entidades elementares.')
    expect(paginaExtraida(1)).toContain('2º ano do Ensino Médio')
    expect(paginaExtraida(1)).toContain('Química 2 — Capítulo 7')
    expect(paginaExtraida(2)).toContain('Carbonato de cálcio, CaCO3: 40 + 12 + 3 × 16 = 100 g/mol.')
    expect(paginaExtraida(3)).toContain('7.5 Cálculo mol–mol e cálculo massa–massa')
    expect(paginaExtraida(3)).toContain('CH4 + 2 O2 -> CO2 + 2 H2O')
    expect(paginaExtraida(5)).toContain('Só a parte pura da amostra entra no cálculo estequiométrico.')
    // Nenhuma página traz o caractere de substituição nem os que a fonte padrão trocaria por outro.
    for (const texto of paginasDoCommitado) expect(texto).not.toMatch(/[�₀-₉→]/)
  })

  it('não ficou velho: o texto por página é igual ao que o script gera agora, com o mesmo número de páginas', () => {
    expect(paginasDoGerado).toHaveLength(paginasDoCommitado.length)
    expect(paginasDoCommitado).toEqual(paginasDoGerado)
  })
})

describe('o gerador do material de demonstração', () => {
  it('é determinístico: duas execuções dão os mesmos bytes', async () => {
    const outraVez = await gerarMaterial()
    expect(Buffer.from(outraVez).equals(Buffer.from(gerado))).toBe(true)
  })

  it('recusa o caractere que a fonte padrão não escreve, em vez de imprimir outro no lugar', async () => {
    const com = (texto: string): PaginaDoMaterial[] => [{ numero: 1, assunto: 'teste', blocos: [{ tipo: 'paragrafo', texto }], frasesChave: [] }]
    await expect(gerarMaterial(com('A água é H₂O.'))).rejects.toThrow(/não escreve "₂" \(U\+2082\)/)
    await expect(gerarMaterial(com('2 H2 + O2 → 2 H2O'))).rejects.toThrow(/não escreve "→" \(U\+2192\)/)
    await expect(gerarMaterial(com('dois  espaços'))).rejects.toThrow(/espaço dobrado/)
  })

  it('recusa conteúdo que não cabe na página, em vez de abrir uma página que o conteúdo não declarou', async () => {
    const paragrafo = { tipo: 'paragrafo', texto: 'Reagente limitante é o reagente que acaba primeiro.' } as const
    const cheia: PaginaDoMaterial[] = [{ numero: 1, assunto: 'teste', blocos: Array.from({ length: 60 }, () => paragrafo), frasesChave: [] }]
    await expect(gerarMaterial(cheia)).rejects.toThrow(/página 1 passa \d+ pt do limite/)
  })
})

describe('o conteúdo do material de demonstração', () => {
  it('tem pelo menos dezoito frases definitórias, espalhadas por mais de quatro páginas', () => {
    // "X é ..." e "A lei ... afirma que ...": a forma que o adaptador falso de IA transforma em questão objetiva.
    const definitoria = /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][^.?!:;]* (é|afirma que) /
    const porPagina = PAGINAS_DO_MATERIAL.map((pagina) => pagina.frasesChave.filter((frase) => definitoria.test(frase)))
    expect(porPagina.flat().length).toBeGreaterThanOrEqual(18)
    expect(new Set(porPagina.flat()).size).toBe(porPagina.flat().length)
    expect(porPagina.filter((frases) => frases.length >= 3).length).toBeGreaterThanOrEqual(5)
  })

  it('declara a titularidade na primeira página, e não cita pessoa, escola nem editora', () => {
    expect(MATERIAL_DE_DEMONSTRACAO.titularidade).toBe(
      'Material de demonstração. Autoria: equipe Turmma. Texto original, com dado sintético, sem relação com nenhuma escola real.',
    )
    expect(paginaExtraida(1)).toContain(MATERIAL_DE_DEMONSTRACAO.titularidade)
    // As duas leis vão pelo que afirmam, sem o nome de quem as formulou; "Avogadro" só no nome da constante.
    const tudo = paginasDoCommitado.map(normalizarTexto).join(' ')
    expect(tudo).not.toMatch(/Lavoisier|Proust|Dalton|editora|colégio|apostila/i)
    expect(tudo.match(/Avogadro/g)).toHaveLength(tudo.match(/[Cc]onstante de Avogadro/g)?.length ?? 0)
  })

  it('não traz o gabarito dos exercícios propostos', () => {
    const tudo = paginasDoCommitado.map(normalizarTexto).join(' ')
    expect(tudo).not.toMatch(/gabarito|respostas|resolução dos exercícios|soluções/i)

    const exercicios = paginaExtraida(6)
    expect(exercicios).toContain('7.9 Exercícios propostos')
    expect(exercicios).toContain('10. Explique, com suas palavras')
    // As respostas, conferidas à mão com as massas atômicas da seção 7.3. Ficam aqui, fora do material.
    const respostas = [
      '98 g/mol', // 1: H2SO4 = 2 + 32 + 64
      '74 g/mol', // 1: Ca(OH)2 = 40 + 32 + 2
      '9,03', // 2: 1,5 × 6,02 × 10²³ moléculas
      '2,5 mol', // 3: 245 g / 98 g/mol
      '4 Al + 3 O2', // 4: a equação balanceada
      '6 mol', // 4: 8 mol de Al × 3 / 4
      '224 g', // 5: 320 g / 160 g/mol = 2 mol de Fe2O3 -> 4 mol de Fe × 56 g/mol
      'limitante é o N2', // 6: 2 mol de N2 / 1 < 9 mol de H2 / 3
      '68 g', // 6: 4 mol de NH3 × 17 g/mol
      '6 g', // 6: sobram 3 mol de H2
      '75%', // 7: 60 g / 80 g de MgO
      '252 g', // 8: 450 g de CaCO3 = 4,5 mol -> 4,5 mol de CaO × 56 g/mol
      '26,4 g', // 9: 100 g de CaCO3 = 1 mol -> 44 g de CO2 × 60%
    ]
    for (const resposta of respostas) {
      const isolada = new RegExp(`(?<![\\d,])${resposta.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\d,])`)
      expect(exercicios, `a resposta "${resposta}" está na página dos exercícios`).not.toMatch(isolada)
    }
  })
})

describe('a química do material de demonstração', () => {
  /** As massas atômicas que o próprio material declara na seção 7.3. */
  function massasAtomicas(): Map<string, number> {
    const linha = /Massas atômicas usadas neste capítulo, em unidade de massa atômica \(u\): ([^.]+)\./.exec(normalizarTexto(textoDaPagina(2)))?.[1]
    if (linha === undefined) throw new Error('a página 2 não declara as massas atômicas')
    return new Map(
      linha.split('; ').map((par) => {
        const [simbolo = '', valor = ''] = par.split(' = ')
        return [simbolo, Number(valor.replace(',', '.'))]
      }),
    )
  }

  /** Os átomos de uma fórmula escrita como no material: `H2O`, `Ca(OH)2`. */
  function atomosDa(formula: string): Map<string, number> {
    const atomos = new Map<string, number>()
    const conhecidos = massasAtomicas()
    const somar = (simbolo: string, quantos: number): void => {
      if (!conhecidos.has(simbolo)) throw new Error(`"${simbolo}", de "${formula}", não está nas massas atômicas da seção 7.3`)
      atomos.set(simbolo, (atomos.get(simbolo) ?? 0) + quantos)
    }
    let resto = formula
    while (resto !== '') {
      const grupo = /^\(([A-Za-z0-9]+)\)(\d*)/.exec(resto)
      const elemento = /^([A-Z][a-z]?)(\d*)/.exec(resto)
      if (grupo) {
        for (const [simbolo, quantos] of atomosDa(grupo[1] ?? '')) somar(simbolo, quantos * Number(grupo[2] === '' ? 1 : grupo[2]))
        resto = resto.slice(grupo[0].length)
      } else if (elemento) {
        somar(elemento[1] ?? '', Number(elemento[2] === '' ? 1 : elemento[2]))
        resto = resto.slice(elemento[0].length)
      } else {
        throw new Error(`não sei ler a fórmula "${formula}"`)
      }
    }
    return atomos
  }

  function atomosDoLado(lado: string): Map<string, number> {
    const atomos = new Map<string, number>()
    for (const termo of lado.split(' + ')) {
      const partes = /^(?:(\d+) )?(\S+)$/.exec(termo)
      if (!partes) throw new Error(`não sei ler o termo "${termo}"`)
      for (const [simbolo, quantos] of atomosDa(partes[2] ?? '')) {
        atomos.set(simbolo, (atomos.get(simbolo) ?? 0) + quantos * Number(partes[1] ?? 1))
      }
    }
    return atomos
  }

  function balanceada(equacao: string): boolean {
    const [reagentes = '', produtos = ''] = equacao.split(' -> ')
    const antes = [...atomosDoLado(reagentes)].sort()
    const depois = [...atomosDoLado(produtos)].sort()
    return JSON.stringify(antes) === JSON.stringify(depois)
  }

  it('toda equação impressa está balanceada, menos a que o exercício 4 pede para balancear', () => {
    const formula = String.raw`(?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+`
    const lado = String.raw`(?:\d+ )?${formula}(?: \+ (?:\d+ )?${formula})*`
    const equacoes = paginasDoCommitado.flatMap((texto) => normalizarTexto(texto).match(new RegExp(`${lado} -> ${lado}`, 'g')) ?? [])

    expect(equacoes).toEqual([
      '2 H2 + O2 -> 2 H2O',
      'N2 + 3 H2 -> 2 NH3',
      'CH4 + 2 O2 -> CO2 + 2 H2O',
      '2 H2 + O2 -> 2 H2O',
      'CaCO3 -> CaO + CO2',
      'Al + O2 -> Al2O3',
      'Fe2O3 + 3 CO -> 2 Fe + 3 CO2',
      'N2 + 3 H2 -> 2 NH3',
      '2 Mg + O2 -> 2 MgO',
    ])
    expect(equacoes.filter((equacao) => !balanceada(equacao))).toEqual(['Al + O2 -> Al2O3'])
    // O leitor de equação distingue: a resposta do exercício 4 fecha, e um coeficiente errado não.
    expect(balanceada('4 Al + 3 O2 -> 2 Al2O3')).toBe(true)
    expect(balanceada('CH4 + O2 -> CO2 + 2 H2O')).toBe(false)
  })

  it('cada massa molar da seção 7.3 é a soma das massas atômicas que o próprio material declara', () => {
    const massas = massasAtomicas()
    const massaMolar = (formula: string): number =>
      [...atomosDa(formula)].reduce((soma, [simbolo, quantos]) => soma + (massas.get(simbolo) ?? Number.NaN) * quantos, 0)
    const declaradas = [...normalizarTexto(textoDaPagina(2)).matchAll(/, ([A-Za-z0-9()]+): [\d ,+×]+ = ([\d,]+) g\/mol\./g)].map(
      (achado) => [achado[1] ?? '', Number((achado[2] ?? '').replace(',', '.'))] as const,
    )

    expect(declaradas.map(([formula]) => formula)).toEqual(['H2O', 'CO2', 'CaCO3', 'NaCl'])
    for (const [formula, valor] of declaradas) expect(massaMolar(formula), formula).toBe(valor)
    // As que os exemplos e os exercícios usam sem a conta escrita.
    expect(massaMolar('CH4')).toBe(16)
    expect(massaMolar('NH3')).toBe(17)
    expect(massaMolar('CaO')).toBe(56)
    expect(massaMolar('MgO')).toBe(40)
    expect(massaMolar('Fe2O3')).toBe(160)
    expect(massaMolar('H2SO4')).toBe(98)
    expect(massaMolar('Ca(OH)2')).toBe(74)
  })
})
