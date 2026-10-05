import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import {
  MATERIAL_DE_DEMONSTRACAO,
  PAGINAS_DO_MATERIAL,
  rodapeDaPagina,
  type BlocoDoMaterial,
  type PaginaDoMaterial,
} from './conteudo-estequiometria.ts'

/**
 * Gera o PDF do material de demonstração (`npm run demonstracao:material`) a partir de
 * `conteudo-estequiometria.ts`. O arquivo gerado é commitado: a coordenação o sobe na demonstração.
 *
 * - **Texto de verdade, na fonte padrão do PDF** (Helvetica), sem fonte embutida: o arquivo fica pequeno e a
 *   ingestão extrai o texto. O que a fonte padrão não escreve é recusado aqui, com o caractere apontado.
 * - **A quebra de linha é deste script**, só no espaço: a do pdfkit também quebra depois de hífen e de barra,
 *   e partiria `g/mol` e `massa–massa`. Cada linha é escrita sozinha, na posição dela.
 * - **A paginação é a do conteúdo**: uma entrada é uma página, e conteúdo que não cabe é erro, não página nova.
 * - **Determinístico**: a data de criação é fixa e nada depende do relógio, da máquina nem da ordem de execução.
 */

export const CAMINHO_DO_MATERIAL = fileURLToPath(new URL(MATERIAL_DE_DEMONSTRACAO.arquivo, import.meta.url))

/** Fixa, para o mesmo conteúdo dar o mesmo arquivo: é a data em que o material foi escrito. */
const DATA_DO_MATERIAL = new Date('2026-10-04T12:00:00.000Z')

// A4, em pontos.
const LARGURA_DA_PAGINA = 595.28
const ALTURA_DA_PAGINA = 841.89
const MARGEM_LATERAL = 64
const TOPO = 62
/** O conteúdo não desce daqui: abaixo ficam o fio e o rodapé. */
const LIMITE_DO_CONTEUDO = 772
const Y_DO_FIO = 784
const Y_DO_RODAPE = 792
const LARGURA_UTIL = LARGURA_DA_PAGINA - 2 * MARGEM_LATERAL

const COR_DO_TEXTO = '#111111'
const COR_DA_NOTA = '#4a4a4a'
const COR_DO_FIO = '#bdbdbd'

type Fonte = 'Helvetica' | 'Helvetica-Bold' | 'Helvetica-Oblique'

interface Estilo {
  fonte: Fonte
  tamanho: number
  /** Distância entre as linhas do bloco. */
  entrelinha: number
  /** Espaço antes do bloco, a não ser no topo da página. */
  antes: number
  /** Espaço depois do bloco. */
  depois: number
  /** Recuo à esquerda. */
  recuo: number
  cor: string
}

const ESTILOS: Record<Exclude<BlocoDoMaterial['tipo'], 'quadro'>, Estilo> = {
  titulo: { fonte: 'Helvetica-Bold', tamanho: 26, entrelinha: 32, antes: 2, depois: 6, recuo: 0, cor: COR_DO_TEXTO },
  nota: { fonte: 'Helvetica-Oblique', tamanho: 9.5, entrelinha: 13, antes: 0, depois: 3, recuo: 0, cor: COR_DA_NOTA },
  secao: { fonte: 'Helvetica-Bold', tamanho: 13.5, entrelinha: 18, antes: 12, depois: 6, recuo: 0, cor: COR_DO_TEXTO },
  paragrafo: { fonte: 'Helvetica', tamanho: 10.5, entrelinha: 15, antes: 0, depois: 7, recuo: 0, cor: COR_DO_TEXTO },
  enunciado: { fonte: 'Helvetica-Bold', tamanho: 10.5, entrelinha: 15, antes: 4, depois: 7, recuo: 0, cor: COR_DO_TEXTO },
  destaque: { fonte: 'Helvetica-Bold', tamanho: 11, entrelinha: 16, antes: 1, depois: 8, recuo: 28, cor: COR_DO_TEXTO },
  item: { fonte: 'Helvetica', tamanho: 10.5, entrelinha: 15, antes: 0, depois: 4, recuo: 16, cor: COR_DO_TEXTO },
}

const ESTILO_DO_TITULO_DO_QUADRO: Estilo = { ...ESTILOS.secao, antes: 0, depois: 6 }
const ESTILO_DO_ITEM_DO_QUADRO: Estilo = { ...ESTILOS.item, recuo: 0, depois: 5 }
const ESTILO_DO_RODAPE: Estilo = { ...ESTILOS.nota, fonte: 'Helvetica', tamanho: 8.5, entrelinha: 11 }
const RESPIRO_DO_QUADRO = 12
const DEPOIS_DO_QUADRO = 8
const DEPOIS_DA_LISTA = 4

/**
 * O que a fonte padrão do PDF escreve e a extração devolve igual: ASCII imprimível, as letras acentuadas e os
 * sinais do Latin-1 (`×`, `²`, `³`, `º`, `·`) e os dois travessões. Dígito subscrito e seta ficam de fora: não
 * têm glifo na Helvetica padrão e sairiam como outro caractere.
 */
const ESCREVIVEL = /^[ -~¡-ÿ–—]*$/

function conferirTexto(texto: string): void {
  if (!ESCREVIVEL.test(texto)) {
    const estranho = [...texto].find((caractere) => !ESCREVIVEL.test(caractere)) ?? ''
    throw new Error(
      `a fonte padrão do PDF não escreve "${estranho}" (U+${estranho.codePointAt(0)?.toString(16).padStart(4, '0') ?? '?'}): "${texto}"`,
    )
  }
  if (texto !== texto.trim() || texto.includes('  ') || texto === '') {
    throw new Error(`o texto do material vai sem espaço nas pontas nem espaço dobrado, e nunca vazio: "${texto}"`)
  }
}

type Documento = InstanceType<typeof PDFDocument>

/** Quebra o texto na largura dada, só no espaço, com a fonte e o tamanho que estiverem ativos no documento. */
function quebrarEmLinhas(documento: Documento, texto: string, largura: number): string[] {
  const linhas: string[] = []
  let linha = ''
  for (const palavra of texto.split(' ')) {
    const candidata = linha === '' ? palavra : `${linha} ${palavra}`
    if (documento.widthOfString(candidata) <= largura) {
      linha = candidata
      continue
    }
    if (linha === '') throw new Error(`a palavra "${palavra}" não cabe na largura da página`)
    linhas.push(linha)
    linha = palavra
  }
  linhas.push(linha)
  return linhas
}

/** Escreve o texto com o estilo, a partir de `y`, e devolve o `y` logo abaixo da última linha. */
function escrever(documento: Documento, texto: string, estilo: Estilo, x: number, y: number, largura: number): number {
  conferirTexto(texto)
  documento.font(estilo.fonte).fontSize(estilo.tamanho).fillColor(estilo.cor)
  let proximo = y
  for (const linha of quebrarEmLinhas(documento, texto, largura - estilo.recuo)) {
    documento.text(linha, x + estilo.recuo, proximo + (estilo.entrelinha - estilo.tamanho) / 2, { lineBreak: false })
    proximo += estilo.entrelinha
  }
  return proximo
}

function desenharQuadro(documento: Documento, bloco: Extract<BlocoDoMaterial, { tipo: 'quadro' }>, y: number): number {
  const x = MARGEM_LATERAL + RESPIRO_DO_QUADRO
  const largura = LARGURA_UTIL - 2 * RESPIRO_DO_QUADRO
  let proximo = escrever(documento, bloco.titulo, ESTILO_DO_TITULO_DO_QUADRO, x, y + RESPIRO_DO_QUADRO, largura)
  proximo += ESTILO_DO_TITULO_DO_QUADRO.depois
  for (const item of bloco.itens) {
    proximo = escrever(documento, item, ESTILO_DO_ITEM_DO_QUADRO, x, proximo, largura) + ESTILO_DO_ITEM_DO_QUADRO.depois
  }
  const fim = proximo - ESTILO_DO_ITEM_DO_QUADRO.depois + RESPIRO_DO_QUADRO
  documento.lineWidth(0.8).strokeColor(COR_DO_FIO).rect(MARGEM_LATERAL, y, LARGURA_UTIL, fim - y).stroke()
  return fim + DEPOIS_DO_QUADRO
}

function desenharPagina(documento: Documento, pagina: PaginaDoMaterial): void {
  let y = TOPO
  // Onde acaba a última coisa desenhada: o espaço depois do último bloco não ocupa a página.
  let fim = TOPO
  for (const [indice, bloco] of pagina.blocos.entries()) {
    if (bloco.tipo === 'quadro') {
      y = desenharQuadro(documento, bloco, y)
      fim = y - DEPOIS_DO_QUADRO
      continue
    }
    const estilo = ESTILOS[bloco.tipo]
    if (indice > 0) y += estilo.antes
    // A lista acaba com o espaço curto do item: o bloco que vem depois dela ganha o que falta.
    if (bloco.tipo !== 'item' && pagina.blocos[indice - 1]?.tipo === 'item') y += DEPOIS_DA_LISTA
    fim = escrever(documento, bloco.texto, estilo, MARGEM_LATERAL, y, LARGURA_UTIL)
    y = fim + estilo.depois
  }
  if (fim > LIMITE_DO_CONTEUDO) {
    throw new Error(
      `o conteúdo da página ${String(pagina.numero)} passa ${Math.ceil(fim - LIMITE_DO_CONTEUDO).toFixed(0)} pt do limite: encurte o texto ou mude a paginação em conteudo-estequiometria.ts`,
    )
  }
  documento
    .lineWidth(0.6)
    .strokeColor(COR_DO_FIO)
    .moveTo(MARGEM_LATERAL, Y_DO_FIO)
    .lineTo(LARGURA_DA_PAGINA - MARGEM_LATERAL, Y_DO_FIO)
    .stroke()
  escrever(documento, rodapeDaPagina(pagina.numero), ESTILO_DO_RODAPE, MARGEM_LATERAL, Y_DO_RODAPE, LARGURA_UTIL)
}

/** O PDF do material de demonstração, em memória. O mesmo conteúdo dá sempre os mesmos bytes. */
export function gerarMaterial(paginas: readonly PaginaDoMaterial[] = PAGINAS_DO_MATERIAL): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const documento = new PDFDocument({
      size: [LARGURA_DA_PAGINA, ALTURA_DA_PAGINA],
      margin: 0,
      autoFirstPage: false,
      compress: true,
      lang: 'pt-BR',
      displayTitle: true,
      info: {
        Title: MATERIAL_DE_DEMONSTRACAO.titulo,
        Author: MATERIAL_DE_DEMONSTRACAO.autoria,
        Subject: MATERIAL_DE_DEMONSTRACAO.titularidade,
        CreationDate: DATA_DO_MATERIAL,
      },
    })
    const partes: Buffer[] = []
    documento.on('data', (parte: Buffer) => partes.push(parte))
    documento.on('end', () => {
      resolve(new Uint8Array(Buffer.concat(partes)))
    })
    documento.on('error', reject)
    try {
      for (const [indice, pagina] of paginas.entries()) {
        if (pagina.numero !== indice + 1) {
          throw new Error(`a página ${String(pagina.numero)} está na posição ${String(indice + 1)} do conteúdo`)
        }
        documento.addPage()
        desenharPagina(documento, pagina)
      }
      documento.end()
    } catch (erro) {
      reject(erro instanceof Error ? erro : new Error(String(erro)))
    }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const bytes = await gerarMaterial()
  writeFileSync(CAMINHO_DO_MATERIAL, bytes)
  process.stdout.write(
    `material de demonstração gerado: tools/demonstracao/${MATERIAL_DE_DEMONSTRACAO.arquivo} ` +
      `(${String(PAGINAS_DO_MATERIAL.length)} páginas, ${String(bytes.length)} bytes)\n`,
  )
}
