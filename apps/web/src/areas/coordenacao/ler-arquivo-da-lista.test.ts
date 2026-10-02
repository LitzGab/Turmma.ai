import { MAXIMO_DE_BYTES_DA_LISTA, MAXIMO_DE_LINHAS_DA_LISTA } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { comQuebrasDoCampo, lerArquivoDaLista, MAXIMO_DE_BYTES_DO_ARQUIVO, MAXIMO_DE_BYTES_DO_ARQUIVO_EM_UTF16, tetoPassado } from './ler-arquivo-da-lista'

/** Os bytes de um texto em windows-1252, como o Excel brasileiro grava: nesta faixa, um byte por caractere (latin-1). */
const emWindows1252 = (texto: string): Uint8Array<ArrayBuffer> => Uint8Array.from(texto, (caractere) => caractere.charCodeAt(0))

describe('W10 (unidade): o arquivo da lista, lido como texto', () => {
  it('windows-1252 com ; e acento, como o Excel grava, sai com os nomes certos', async () => {
    const texto = 'nome;matrícula\r\nJoão Conceição;1001\r\nAntônia Araújo;1002\r\n'
    const lido = await lerArquivoDaLista(new Blob([emWindows1252(texto)]))
    expect(lido).toEqual({ ok: true, texto })
  })

  it('UTF-8 com BOM e vírgula sai sem o BOM e com os acentos', async () => {
    const texto = 'nome,matrícula\nJoão Conceição,1001\nÇécile Ãnô,1002\n'
    const bom = new Uint8Array([0xef, 0xbb, 0xbf])
    const lido = await lerArquivoDaLista(new Blob([bom, new TextEncoder().encode(texto)]))
    expect(lido).toEqual({ ok: true, texto })
  })

  it('UTF-8 sem acento nenhum é lido igual pelas duas: não há o que decidir', async () => {
    const lido = await lerArquivoDaLista(new Blob([new TextEncoder().encode('Ana;1\n')]))
    expect(lido).toEqual({ ok: true, texto: 'Ana;1\n' })
  })

  it('o "Texto Unicode" do Excel, em UTF-16 com BOM e tabulação, sai com os nomes certos e sem o BOM, nas duas ordens de byte', async () => {
    const texto = 'nome\tmatrícula\r\nJoão Conceição\t1001\r\nAntônia Araújo\t1002\r\n'
    const unidades = Array.from(texto, (caractere) => caractere.charCodeAt(0))
    const le = new Uint8Array([0xff, 0xfe, ...unidades.flatMap((unidade) => [unidade & 0xff, unidade >> 8])])
    const be = new Uint8Array([0xfe, 0xff, ...unidades.flatMap((unidade) => [unidade >> 8, unidade & 0xff])])
    expect(await lerArquivoDaLista(new Blob([le]))).toEqual({ ok: true, texto })
    expect(await lerArquivoDaLista(new Blob([be]))).toEqual({ ok: true, texto })
  })

  it('o teto do UTF-16 é o dobro: o arquivo que em UTF-8 caberia é lido, e acima do dobro nem é lido', async () => {
    expect(MAXIMO_DE_BYTES_DO_ARQUIVO_EM_UTF16).toBe(2 * MAXIMO_DE_BYTES_DA_LISTA + 2)
    // 64 KB de "a" em UTF-16: passa do teto do UTF-8 em bytes de arquivo, e o texto cabe.
    const noTeto = new Uint8Array(MAXIMO_DE_BYTES_DO_ARQUIVO_EM_UTF16)
    noTeto.set([0xff, 0xfe])
    for (let posicao = 2; posicao < noTeto.length; posicao += 2) noTeto[posicao] = 0x61
    const lido = await lerArquivoDaLista(new Blob([noTeto]))
    expect(lido).toEqual({ ok: true, texto: 'a'.repeat(MAXIMO_DE_BYTES_DA_LISTA) })
    const acima = new Uint8Array(MAXIMO_DE_BYTES_DO_ARQUIVO_EM_UTF16 + 2)
    acima.set([0xff, 0xfe])
    expect(await lerArquivoDaLista(new Blob([acima]))).toEqual({ ok: false, motivo: 'grande' })
    // Sem o BOM de UTF-16, vale o teto de sempre.
    expect(await lerArquivoDaLista(new Blob([new Uint8Array(MAXIMO_DE_BYTES_DO_ARQUIVO + 1).fill(0x61)]))).toEqual({ ok: false, motivo: 'grande' })
  })

  it('a planilha (.xlsx e .ods, que são zip, e o .xls antigo) não é lida como texto, pequena ou acima do teto', async () => {
    const comAssinatura = (assinatura: number[], tamanho: number) => {
      const bytes = new Uint8Array(tamanho)
      bytes.set(assinatura)
      return new Blob([bytes])
    }
    const zip = (tamanho: number) => comAssinatura([0x50, 0x4b, 0x03, 0x04], tamanho)
    expect(await lerArquivoDaLista(zip(2_000))).toEqual({ ok: false, motivo: 'planilha' })
    expect(await lerArquivoDaLista(zip(MAXIMO_DE_BYTES_DO_ARQUIVO_EM_UTF16 + 1))).toEqual({ ok: false, motivo: 'planilha' })
    expect(await lerArquivoDaLista(comAssinatura([0xd0, 0xcf, 0x11, 0xe0], 2_000))).toEqual({ ok: false, motivo: 'planilha' })
    // Um texto que só começa por "PK" continua sendo texto.
    expect(await lerArquivoDaLista(new Blob([new TextEncoder().encode('PKaula;1\n')]))).toEqual({ ok: true, texto: 'PKaula;1\n' })
  })

  it('o arquivo que o navegador não consegue ler (apagado depois de escolhido) sai como ilegível, e não como promessa rejeitada', async () => {
    // O arquivo existia quando foi escolhido, e a leitura falha: o navegador rejeita com `NotReadableError`.
    class ArquivoApagado extends Blob {
      override arrayBuffer(): Promise<ArrayBuffer> {
        return Promise.reject(new DOMException('o arquivo não pôde ser lido', 'NotReadableError'))
      }
      override slice(): Blob {
        return this
      }
    }
    expect(await lerArquivoDaLista(new ArquivoApagado(['Ana;1\n']))).toEqual({ ok: false, motivo: 'ilegivel' })
  })

  it('o arquivo acima do teto nem é lido', async () => {
    expect(MAXIMO_DE_BYTES_DO_ARQUIVO).toBe(MAXIMO_DE_BYTES_DA_LISTA + 3)
    expect(await lerArquivoDaLista(new Blob([new Uint8Array(MAXIMO_DE_BYTES_DO_ARQUIVO + 1)]))).toEqual({ ok: false, motivo: 'grande' })
    // No teto, lê: 64 KB de "a" e o BOM.
    const noTeto = new Uint8Array(MAXIMO_DE_BYTES_DO_ARQUIVO).fill(0x61)
    noTeto.set([0xef, 0xbb, 0xbf])
    const lido = await lerArquivoDaLista(new Blob([noTeto]))
    expect(lido.ok).toBe(true)
  })
})

describe('as quebras de linha do arquivo viram as do campo', () => {
  it('o \\r\\n do Excel e o \\r sozinho viram \\n, e o \\n fica', () => {
    expect(comQuebrasDoCampo('nome;matrícula\r\nAna;1\r\n')).toBe('nome;matrícula\nAna;1\n')
    expect(comQuebrasDoCampo('nome;matrícula\rAna;1\rBia;2')).toBe('nome;matrícula\nAna;1\nBia;2')
    expect(comQuebrasDoCampo('Ana;1\nBia;2\r\n\rCaio;3')).toBe('Ana;1\nBia;2\n\nCaio;3')
  })
})

describe('o teto do envio, conferido antes de enviar', () => {
  it('passa com 200 linhas de aluno e o cabeçalho; recusa a 202ª linha preenchida e o texto acima de 64 KB em UTF-8', () => {
    const linhas = (quantas: number) => Array.from({ length: quantas }, (_, posicao) => `Aluno ${String(posicao)};${String(posicao)}`)
    expect(tetoPassado(['nome;matrícula', ...linhas(MAXIMO_DE_LINHAS_DA_LISTA)].join('\n'))).toBeUndefined()
    // Linha em branco não conta.
    expect(tetoPassado(['nome;matrícula', '', '  ', ...linhas(MAXIMO_DE_LINHAS_DA_LISTA)].join('\n'))).toBeUndefined()
    expect(tetoPassado(['nome;matrícula', ...linhas(MAXIMO_DE_LINHAS_DA_LISTA + 1)].join('\n'))).toBe('linhas')
    // O teto é de bytes em UTF-8: "ç" vale dois.
    expect(tetoPassado('a'.repeat(MAXIMO_DE_BYTES_DA_LISTA))).toBeUndefined()
    expect(tetoPassado(`${'a'.repeat(MAXIMO_DE_BYTES_DA_LISTA - 1)}ç`)).toBe('bytes')
  })
})
