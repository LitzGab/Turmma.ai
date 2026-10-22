import { MAXIMO_DE_BYTES_DA_LISTA, MAXIMO_DE_LINHAS_DA_LISTA } from '@educa/shared'

/**
 * O arquivo da lista de nomes, lido como texto no navegador (A1, 13.0; Tech Spec, seções 9 e 12). A API recebe sempre o
 * texto, nunca o arquivo: nada de upload nem de storage para uma lista de 64 KB.
 *
 * O Excel brasileiro grava o CSV em windows-1252, com `;` (premissa não verificada da seção 12 da Tech Spec), e o Google
 * Planilhas e o LibreOffice, em UTF-8, às vezes com BOM. A leitura tenta UTF-8 estrito primeiro: um arquivo em
 * windows-1252 com acento quase nunca é UTF-8 válido, e a falha é o sinal de trocar. O BOM sai na leitura.
 *
 * O "Texto Unicode" do Excel é UTF-16 com BOM, separado por tabulação: lido como windows-1252 viraria um caractere nulo
 * entre cada letra. O BOM de UTF-16 (`FF FE` ou `FE FF`) decide antes de tudo, e nenhuma lista de nomes começa por "ÿþ".
 */

/**
 * O maior arquivo em UTF-8 ou em windows-1252 que a tela chega a ler. O texto nunca encolhe ao ir para UTF-8 (só perde o
 * BOM, de 3 bytes).
 */
export const MAXIMO_DE_BYTES_DO_ARQUIVO = MAXIMO_DE_BYTES_DA_LISTA + 3

/** O maior arquivo em UTF-16: dois bytes por caractere e o BOM. Acima disso, o texto não cabe em 64 KB de UTF-8. */
export const MAXIMO_DE_BYTES_DO_ARQUIVO_EM_UTF16 = 2 * MAXIMO_DE_BYTES_DA_LISTA + 2

/**
 * Por que o arquivo não virou texto. `planilha` é o arquivo de planilha em si (`.xlsx` e `.ods`, que são zip, e o `.xls`
 * antigo): não é texto, e lido como tal encheria o campo de lixo; a tela diz para salvar como CSV. `ilegivel` é o
 * arquivo que o navegador não conseguiu ler (apagado ou movido depois de escolhido, sem permissão).
 */
export const MOTIVOS_DO_ARQUIVO_RECUSADO = ['grande', 'planilha', 'ilegivel'] as const
export type MotivoDoArquivoRecusado = (typeof MOTIVOS_DO_ARQUIVO_RECUSADO)[number]

export type ArquivoLido = { readonly ok: true; readonly texto: string } | { readonly ok: false; readonly motivo: MotivoDoArquivoRecusado }

/** O começo de todo zip ("PK", 3, 4), que é o do `.xlsx` e do `.ods`, e o do `.xls` antigo (`D0 CF 11 E0`). */
const COMECOS_DE_PLANILHA = [
  [0x50, 0x4b, 0x03, 0x04],
  [0xd0, 0xcf, 0x11, 0xe0],
]

export async function lerArquivoDaLista(arquivo: Blob): Promise<ArquivoLido> {
  try {
    return await lerComoTexto(arquivo)
  } catch {
    // A leitura que o navegador recusa não pode virar promessa rejeitada sem aviso na tela.
    return { ok: false, motivo: 'ilegivel' }
  }
}

async function lerComoTexto(arquivo: Blob): Promise<ArquivoLido> {
  // Só o começo, antes do teto: uma planilha passa fácil de 128 KB, e "grande demais" não diria o que fazer com ela.
  const comeco = new Uint8Array(await arquivo.slice(0, 4).arrayBuffer())
  if (COMECOS_DE_PLANILHA.some((assinatura) => assinatura.every((byte, posicao) => comeco[posicao] === byte))) return { ok: false, motivo: 'planilha' }
  if (arquivo.size > MAXIMO_DE_BYTES_DO_ARQUIVO_EM_UTF16) return { ok: false, motivo: 'grande' }
  const bytes = new Uint8Array(await arquivo.arrayBuffer())
  const utf16 = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : undefined
  if (utf16 !== undefined) return { ok: true, texto: new TextDecoder(utf16).decode(bytes) }
  if (arquivo.size > MAXIMO_DE_BYTES_DO_ARQUIVO) return { ok: false, motivo: 'grande' }
  try {
    return { ok: true, texto: new TextDecoder('utf-8', { fatal: true }).decode(bytes) }
  } catch {
    return { ok: true, texto: new TextDecoder('windows-1252').decode(bytes) }
  }
}

/**
 * As quebras de linha do arquivo (o `\r\n` do Excel, o `\r` sozinho de arquivo antigo) viram as do campo de texto, que só
 * guarda `\n`: o texto que a tela mostra é o mesmo que o campo devolve quando a pessoa mexe nele, e a prévia de um texto
 * vale para ele depois de uma tecla errada e apagada.
 */
export function comQuebrasDoCampo(texto: string): string {
  return texto.replace(/\r\n?/g, '\n')
}

/**
 * O que a tela já sabe que a API recusaria, antes de enviar (regra 80, item 3): mais de 64 KB em UTF-8, ou mais linhas
 * preenchidas que as 200 de aluno e um cabeçalho. Entre os dois, quem decide é a API, que sabe qual linha é cabeçalho.
 */
export function tetoPassado(texto: string): 'bytes' | 'linhas' | undefined {
  if (new TextEncoder().encode(texto).length > MAXIMO_DE_BYTES_DA_LISTA) return 'bytes'
  const preenchidas = texto.split(/\r\n|\r|\n/).filter((linha) => linha.trim() !== '').length
  if (preenchidas > MAXIMO_DE_LINHAS_DA_LISTA + 1) return 'linhas'
  return undefined
}
