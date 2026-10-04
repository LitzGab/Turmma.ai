import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

/**
 * O texto de um PDF, página por página, com `pdfjs-dist` em Node. É a receita que a ingestão do produto reusa
 * (`docs/mvp-rapido.md` seção 4, item 3): por isso o teste do material de demonstração extrai por aqui.
 *
 * - A build é a `legacy`: a padrão é para navegador, e em Node avisa para usar esta.
 * - `data` vai como `Uint8Array` **copiado**: o pdfjs recusa `Buffer`, e esvazia o array que recebe.
 * - Só texto: sem fonte do sistema e sem `@font-face`. Nada é desenhado, então não precisa de canvas nem dos
 *   arquivos de fonte padrão; `verbosity: 0` cala o aviso de que eles faltam.
 * - Uma linha é o que vem até o item com `hasEOL`. O item traz o texto de um trecho contínuo; o pdfjs já põe o
 *   espaço entre trechos da mesma linha, e marca o fim dela num item que pode vir vazio.
 * - Cada linha sai com um espaço só entre as palavras e sem linha vazia; as linhas da página se juntam com `\n`.
 */
export async function extrairTextoPorPagina(bytes: Uint8Array): Promise<string[]> {
  const tarefa = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: false,
    disableFontFace: true,
    verbosity: 0,
  })
  try {
    const pdf = await tarefa.promise
    const paginas: string[] = []
    for (let numero = 1; numero <= pdf.numPages; numero++) {
      const pagina = await pdf.getPage(numero)
      const conteudo = await pagina.getTextContent()
      const linhas: string[] = []
      let linha = ''
      for (const item of conteudo.items) {
        // O outro tipo de item é o marcador de conteúdo marcado, que não tem texto.
        if (!('str' in item)) continue
        linha += item.str
        if (item.hasEOL) {
          linhas.push(linha)
          linha = ''
        }
      }
      linhas.push(linha)
      paginas.push(
        linhas
          .map((texto) => texto.replace(/\s+/g, ' ').trim())
          .filter((texto) => texto !== '')
          .join('\n'),
      )
    }
    return paginas
  } finally {
    await tarefa.destroy()
  }
}
