import { TAMANHO_MAXIMO_DO_TRECHO_CITADO } from '@educa/shared'

/** Quanto do texto antes da palavra achada entra no pedaço: o bastante para a frase não começar no meio. */
const FOLGA_ANTES_DA_PALAVRA = 80
/** Palavra de busca com menos letras que isto (artigo, preposição) não diz onde o assunto está na página. */
const MINIMO_DE_LETRAS_DA_PALAVRA = 3

/** Sem acento e em minúsculas, **com o mesmo comprimento** do texto composto: a posição achada aqui vale no original. */
const semAcento = (texto: string): string => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** O começo da palavra, que a flexão não muda: "reagentes" e "reagente" começam igual. */
function radical(palavra: string): string {
  return palavra.slice(0, Math.max(MINIMO_DE_LETRAS_DA_PALAVRA + 1, palavra.length - 2))
}

/**
 * O pedaço da página que a rota de busca devolve (`TAMANHO_MAXIMO_DO_TRECHO_CITADO`): numa linha só, começando perto
 * da primeira palavra da busca que aparece na página, cortado em palavra inteira, com reticências onde cortou. É só
 * para a pessoa conferir de relance que a página trata do assunto; quem decide o que casa é a busca do Postgres, e não
 * esta função. Sem achar palavra nenhuma (a busca casou pela flexão), devolve o começo da página.
 */
export function trechoCitado(texto: string, busca: string): string {
  const linha = texto.replace(/\s+/g, ' ').trim()
  if (linha.length <= TAMANHO_MAXIMO_DO_TRECHO_CITADO) return linha
  const base = semAcento(linha)
  const posicoes = semAcento(busca)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((palavra) => palavra.length >= MINIMO_DE_LETRAS_DA_PALAVRA)
    .map((palavra) => base.indexOf(radical(palavra)))
    .filter((posicao) => posicao >= 0)
  const achada = posicoes.length === 0 || base.length !== linha.length ? 0 : Math.min(...posicoes)
  let inicio = Math.max(0, achada - FOLGA_ANTES_DA_PALAVRA)
  if (inicio > 0) {
    const proximoEspaco = linha.indexOf(' ', inicio)
    inicio = proximoEspaco === -1 || proximoEspaco > achada ? achada : proximoEspaco + 1
  }
  const prefixo = inicio > 0 ? '…' : ''
  const cabe = TAMANHO_MAXIMO_DO_TRECHO_CITADO - prefixo.length
  const resto = linha.slice(inicio)
  if (resto.length <= cabe) return `${prefixo}${resto}`
  const corte = resto.slice(0, cabe - 1)
  const ultimoEspaco = corte.lastIndexOf(' ')
  return `${prefixo}${(ultimoEspaco > cabe / 2 ? corte.slice(0, ultimoEspaco) : corte).trimEnd()}…`
}
