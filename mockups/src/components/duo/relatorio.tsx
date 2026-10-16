import * as React from 'react'
import { Check, Download, FileText } from 'lucide-react'
import { Aviso } from './aviso'
import { Botao } from './botao'
import { Dialogo } from './dialogo'
import { LadrilhoIcone } from './ladrilho'
import { TabelaCurta } from './graficos'

/* O RELATÓRIO (13ª rodada, 04/10/2026; plano de painéis e introdução, seção 1.4.4): um PDF DE VERDADE, gerado no
   navegador, sem dependência nova. Texto e tabelas, sem gráfico (o gráfico no PDF fica para o produto).
   · montarPdf: puro. PDF 1.4 escrito à mão, A4 (595 × 842 pt), margens de 56 pt, Helvetica e Helvetica-Bold com a
     codificação WinAnsi e as larguras da fonte para alinhar (o Latin-1 vai direto; travessão, meia-risca, reticências, aspas curvas, marcador e euro vão
     para os códigos do WinAnsi; o resto vira "?"). Quebra de linha e de página, tabelas com fio de 0,5 pt, rodapé com
     "página n de N" em cada página e o xref com os deslocamentos em bytes.
   · baixarPdf e baixarCsv: Blob e link de download (o CSV com BOM, ";" e CRLF, como o da rede).
   · PreviaRelatorio: o mesmo conteúdo do PDF nas peças duo, num diálogo de 720 px.
   · CartaoArquivo: o arquivo dentro da conversa do Analista (BAIXAR e VER ANTES). */

export type BlocoRelatorio =
  | { tipo: 'paragrafo'; texto: string }
  | { tipo: 'nota'; texto: string }
  | { tipo: 'numeros'; itens: { valor: string; rotulo: string }[] }
  | { tipo: 'tabela'; colunas: string[]; linhas: string[][] }

export type DocumentoRelatorio = {
  titulo: string
  subtitulo: string
  aviso: string
  secoes: { titulo: string; blocos: BlocoRelatorio[] }[]
  rodape: string
}

/* ── A codificação: texto → bytes WinAnsi ───────────────────────────────────────────────────────────────── */

const WINANSI: Record<number, number> = {
  0x20ac: 0x80, // €
  0x2026: 0x85, // …
  0x2018: 0x91, 0x2019: 0x92, // ‘ ’
  0x201c: 0x93, 0x201d: 0x94, // “ ”
  0x2022: 0x95, // •
  0x2013: 0x96, // –
  0x2014: 0x97, // —
}

/** Um caractere em um byte (devolvido como caractere de 0 a 255, para montar a "string binária"). */
function byteDe(ch: string): string {
  const c = ch.codePointAt(0) ?? 63
  if (c === 0x09) return ' '
  if (c >= 0x20 && c <= 0x7e) return ch
  if (c >= 0xa0 && c <= 0xff) return String.fromCharCode(c)
  const w = WINANSI[c]
  return w !== undefined ? String.fromCharCode(w) : '?'
}

/** Texto PDF entre parênteses: troca o que não há no WinAnsi e escapa ( ) \. */
function textoPdf(s: string): string {
  const limpo = s.replace(/→/g, '->').replace(/ /g, ' ')
  let out = ''
  for (const ch of limpo) {
    const b = byteDe(ch)
    out += b === '(' || b === ')' || b === '\\' ? `\\${b}` : b
  }
  return `(${out})`
}

/* ── A medida: as larguras da Helvetica (milésimos de em), para alinhar à direita sem passar da margem ──── */

const LARGURA_BASE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const HELVETICA = [556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500,
  667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611]
const HELVETICA_BOLD = [556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500,
  722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611]
const OUTROS: Record<string, [number, number]> = {
  ' ': [278, 278], '.': [278, 278], ',': [278, 278], ':': [278, 333], ';': [278, 333], '·': [278, 278], '%': [889, 889],
  '(': [333, 333], ')': [333, 333], '-': [333, 333], '/': [278, 278], '—': [1000, 1000], '–': [556, 556], '…': [1000, 1000],
  'º': [365, 365], 'ª': [370, 370], '°': [400, 400], '$': [556, 556], '"': [355, 474], "'": [191, 238], '“': [333, 500], '”': [333, 500],
}

function larguraDe(ch: string, negrito: boolean): number {
  if (ch >= '0' && ch <= '9') return 556
  const o = OUTROS[ch]
  if (o) return o[negrito ? 1 : 0]
  const base = ch.normalize('NFD')[0]
  const i = LARGURA_BASE.indexOf(base)
  if (i >= 0) return (negrito ? HELVETICA_BOLD : HELVETICA)[i]
  return 556
}

const largura = (s: string, tam: number, negrito = false) => {
  let soma = 0
  for (const ch of s) soma += larguraDe(ch, negrito)
  return (soma / 1000) * tam
}

function quebrar(texto: string, tam: number, max: number, negrito = false): string[] {
  const linhas: string[] = []
  let atual = ''
  for (const palavra of texto.split(/\s+/).filter(Boolean)) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra
    if (largura(tentativa, tam, negrito) <= max || !atual) atual = tentativa
    else { linhas.push(atual); atual = palavra }
  }
  if (atual) linhas.push(atual)
  return linhas.length ? linhas : ['']
}

function cortar(texto: string, tam: number, max: number, negrito = false): string {
  if (largura(texto, tam, negrito) <= max) return texto
  const chars = [...texto]
  while (chars.length > 1 && largura(`${chars.join('')}…`, tam, negrito) > max) chars.pop()
  return `${chars.join('')}…`
}

/* ── A página ───────────────────────────────────────────────────────────────────────────────────────────── */

const A4 = { l: 595, a: 842 }
const MARGEM = 56
const UTIL = A4.l - 2 * MARGEM
const TOPO = A4.a - MARGEM
const LIMITE = 70

type Pagina = string[]

/** Monta o PDF inteiro. Puro: o mesmo documento dá sempre os mesmos bytes. */
export function montarPdf(doc: DocumentoRelatorio): Uint8Array {
  const paginas: Pagina[] = [[]]
  let y = TOPO
  const pag = () => paginas[paginas.length - 1]
  const novaPagina = () => { paginas.push([]); y = TOPO }
  const caber = (h: number) => { if (y - h < LIMITE) novaPagina() }
  const texto = (s: string, x: number, yy: number, tam: number, negrito = false, cinza = 0.12) => {
    pag().push(`BT ${cinza.toFixed(2)} g /${negrito ? 'F2' : 'F1'} ${tam} Tf ${x.toFixed(2)} ${yy.toFixed(2)} Td ${textoPdf(s)} Tj ET`)
  }
  const fio = (x1: number, x2: number, yy: number, esp = 0.5, cinza = 0.8) => {
    pag().push(`${cinza.toFixed(2)} G ${esp} w ${x1.toFixed(2)} ${yy.toFixed(2)} m ${x2.toFixed(2)} ${yy.toFixed(2)} l S`)
  }
  const paragrafo = (s: string, tam: number, entre: number, negrito = false, cinza = 0.12) => {
    for (const l of quebrar(s, tam, UTIL, negrito)) {
      caber(entre)
      y -= entre
      texto(l, MARGEM, y + (entre - tam) / 2, tam, negrito, cinza)
    }
  }

  // o topo
  paragrafo(doc.titulo, 18, 24, true)
  y -= 2
  paragrafo(doc.subtitulo, 11, 16, false, 0.4)
  y -= 8
  paragrafo(doc.aviso, 10, 14, true)
  y -= 6
  fio(MARGEM, A4.l - MARGEM, y, 1, 0.75)
  y -= 4

  doc.secoes.forEach((secao, n) => {
    caber(18 + 14 + 30)
    y -= 14
    paragrafo(`${n + 1}. ${secao.titulo}`, 13, 18, true)
    y -= 4
    for (const b of secao.blocos) {
      if (b.tipo === 'paragrafo') { paragrafo(b.texto, 10.5, 15); y -= 4 }
      else if (b.tipo === 'nota') { paragrafo(b.texto, 9.5, 13, false, 0.42); y -= 4 }
      else if (b.tipo === 'numeros') {
        const porLinha = Math.min(4, Math.max(1, b.itens.length))
        const col = UTIL / porLinha
        for (let i = 0; i < b.itens.length; i += porLinha) {
          caber(36)
          y -= 36
          b.itens.slice(i, i + porLinha).forEach((it, k) => {
            const x = MARGEM + k * col
            texto(cortar(it.valor, 16, col - 8, true), x, y + 16, 16, true)
            texto(cortar(it.rotulo, 9, col - 8), x, y + 4, 9, false, 0.4)
          })
        }
        y -= 6
      } else {
        // as colunas, proporcionais ao texto mais longo de cada uma (com um mínimo)
        const pesos = b.colunas.map((c, i) => Math.max(6, [...c].length, ...b.linhas.map((l) => [...(l[i] ?? '')].length)))
        const soma = pesos.reduce((s, p) => s + p, 0)
        const larguras = pesos.map((p) => (p / soma) * UTIL)
        const xs = larguras.map((_, i) => MARGEM + larguras.slice(0, i).reduce((s, w) => s + w, 0))
        const linha = (celulas: string[], negrito: boolean, tam: number) => {
          celulas.forEach((c, i) => {
            const w = larguras[i] - 8
            const t = cortar(c ?? '', tam, w, negrito)
            const x = i === 0 ? xs[i] : xs[i] + larguras[i] - largura(t, tam, negrito)
            texto(t, x, y + 5, tam, negrito, negrito ? 0.35 : 0.12)
          })
        }
        const cabecalho = () => { caber(18); y -= 18; linha(b.colunas, true, 9.5); fio(MARGEM, A4.l - MARGEM, y, 0.5, 0.6) }
        caber(18 + 17)
        cabecalho()
        for (const l of b.linhas) {
          if (y - 17 < LIMITE) { novaPagina(); cabecalho() }
          y -= 17
          linha(l, false, 10)
          fio(MARGEM, A4.l - MARGEM, y, 0.5, 0.85)
        }
        y -= 8
      }
    }
  })

  // o rodapé de cada página, agora que o total é conhecido
  const total = paginas.length
  paginas.forEach((p, i) => {
    const num = `página ${i + 1} de ${total}`
    const espaco = UTIL - largura(num, 8) - 16
    p.push(`BT 0.45 g /F1 8 Tf ${MARGEM} 36 Td ${textoPdf(cortar(doc.rodape, 8, espaco))} Tj ET`)
    p.push(`BT 0.45 g /F1 8 Tf ${(A4.l - MARGEM - largura(num, 8)).toFixed(2)} 36 Td ${textoPdf(num)} Tj ET`)
  })

  // os objetos: 1 catálogo, 2 páginas, 3 e 4 as fontes, depois página e conteúdo de cada uma
  const objetos: string[] = []
  const kids = paginas.map((_, i) => `${5 + i * 2} 0 R`).join(' ')
  objetos.push('<< /Type /Catalog /Pages 2 0 R >>')
  objetos.push(`<< /Type /Pages /Kids [${kids}] /Count ${total} >>`)
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  paginas.forEach((p, i) => {
    const conteudo = p.join('\n')
    objetos.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.l} ${A4.a}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`)
    objetos.push(`<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`)
  })

  // tudo é "string binária" (um caractere = um byte), então o comprimento é o deslocamento em bytes
  let saida = '%PDF-1.4\n%âãÏÓ\n'
  const deslocamentos: number[] = []
  objetos.forEach((o, i) => {
    deslocamentos.push(saida.length)
    saida += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = saida.length
  saida += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  saida += deslocamentos.map((d) => `${String(d).padStart(10, '0')} 00000 n \n`).join('')
  saida += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

  const bytes = new Uint8Array(saida.length)
  for (let i = 0; i < saida.length; i++) bytes[i] = saida.charCodeAt(i) & 0xff
  return bytes
}

/* ── Baixar ─────────────────────────────────────────────────────────────────────────────────────────────── */

function baixarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function baixarPdf(doc: DocumentoRelatorio, nomeArquivo: string): void {
  baixarBlob(new Blob([montarPdf(doc) as BlobPart], { type: 'application/pdf' }), nomeArquivo)
}

const celulaCsv = (v: string | number) => {
  const s = String(v)
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV com BOM, ";" e CRLF (abre direto no Excel em português). */
export function baixarCsv(linhas: (string | number)[][], nomeArquivo: string): void {
  const texto = '﻿' + linhas.map((l) => l.map(celulaCsv).join(';')).join('\r\n')
  baixarBlob(new Blob([texto], { type: 'text/csv;charset=utf-8' }), nomeArquivo)
}

/* ── A prévia (o mesmo conteúdo do PDF) ─────────────────────────────────────────────────────────────────── */

export function PreviaRelatorio({ doc, aoFechar, aoBaixar }: {
  doc: DocumentoRelatorio | null
  aoFechar: () => void
  aoBaixar: () => void
}) {
  // guarda o último documento para o diálogo não esvaziar enquanto fecha
  const [ultimo, setUltimo] = React.useState(doc)
  if (doc && doc !== ultimo) setUltimo(doc)
  const d = doc ?? ultimo
  return (
    <Dialogo aberto={!!doc} aoMudar={(v) => { if (!v) aoFechar() }} largura={720} titulo={d?.titulo ?? 'Relatório'}
      descricao="Prévia do relatório. Feche com Esc."
      rodape={(
        <>
          <Botao variante="secundario" onClick={aoFechar}>Fechar</Botao>
          <Botao icone={<Download strokeWidth={2.5} />} onClick={aoBaixar}>Baixar</Botao>
        </>
      )}>
      {d && (
        <div className="grid gap-5">
          <p className="t-apoio">{d.subtitulo}</p>
          <Aviso tom="info">{d.aviso}</Aviso>
          {d.secoes.map((s, n) => (
            <section key={s.titulo} className="grid gap-3">
              <h3 className="t-secao text-tinta">{n + 1}. {s.titulo}</h3>
              {s.blocos.map((b, i) => {
                if (b.tipo === 'paragrafo') return <p key={i} className="t-corpo text-tinta">{b.texto}</p>
                if (b.tipo === 'nota') return <p key={i} className="t-apoio">{b.texto}</p>
                if (b.tipo === 'numeros') return (
                  <dl key={i} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {b.itens.map((it) => (
                      <div key={it.rotulo} className="rounded-[12px] border-2 border-borda px-3 py-2">
                        <dt className="sr-only">{it.rotulo}</dt>
                        <dd className="t-numero text-tinta">{it.valor}</dd>
                        <dd aria-hidden className="t-apoio">{it.rotulo}</dd>
                      </div>
                    ))}
                  </dl>
                )
                return <TabelaCurta key={i} rotulo={s.titulo} colunas={b.colunas} linhas={b.linhas} />
              })}
            </section>
          ))}
          <p className="t-apoio border-t-2 border-borda pt-3">{d.rodape}</p>
        </div>
      )}
    </Dialogo>
  )
}

/* ── O arquivo dentro da conversa ───────────────────────────────────────────────────────────────────────── */

export function CartaoArquivo({ titulo, apoio, aoBaixar, aoVer, baixado: baixadoFora = false }: {
  titulo: string
  apoio: string
  aoBaixar: () => void
  aoVer?: () => void
  /** baixado por fora do cartão (o BAIXAR da prévia) */
  baixado?: boolean
}) {
  // depois de baixar, o botão diz que baixou (quem assiste vê que o arquivo saiu); dá para baixar de novo
  const [baixadoAqui, setBaixado] = React.useState(false)
  const baixado = baixadoAqui || baixadoFora
  const baixar = () => { aoBaixar(); setBaixado(true) }
  return (
    <div className="grid gap-3 rounded-[16px] border-2 border-borda bg-white p-3">
      <div className="flex min-w-0 items-center gap-3">
        <LadrilhoIcone familia="anil" tamanho={40} icone={<FileText strokeWidth={2.5} />} className="text-(--texto)" />
        <div className="min-w-0">
          <p className="t-cartao text-tinta">{titulo}</p>
          <p className="t-apoio">{apoio}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Botao variante="secundario" tamanho="p" icone={baixado ? <Check strokeWidth={3} /> : <Download strokeWidth={2.5} />} onClick={baixar}
          aria-label={baixado ? 'Baixado. Baixar de novo' : undefined}>{baixado ? 'Baixado' : 'Baixar'}</Botao>
        {aoVer && <Botao variante="fantasma" tamanho="p" onClick={aoVer}>Ver antes</Botao>}
      </div>
      {baixado && <p role="status" className="t-apoio">Arquivo baixado. Ele está na pasta de downloads do computador.</p>}
    </div>
  )
}
