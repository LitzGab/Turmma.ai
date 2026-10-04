/**
 * O texto que o modelo devolve vira parágrafos: uma linha em branco separa um do outro, e a quebra de linha simples fica
 * dentro do parágrafo (uma lista numerada, as alternativas de uma questão). Nada aqui interpreta marcação: o texto do
 * modelo é **texto**, e o que parecer HTML ou Markdown aparece escrito, como veio (regra 30: saída de modelo é dado).
 */
export function paragrafosDoTexto(texto: string): string[] {
  return texto
    .replaceAll('\r\n', '\n')
    .split(/\n[ \t]*\n+/)
    .map((paragrafo) => paragrafo.trim())
    .filter((paragrafo) => paragrafo !== '')
}
