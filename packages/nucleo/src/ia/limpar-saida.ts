/**
 * O modelo local raciocina por padrão e, mesmo com o raciocínio desligado no pedido, pode devolver o bloco
 * `<think>…</think>` no texto. Raciocínio nunca é resposta: sai antes de qualquer validação e nunca é guardado.
 */
export function descartarRaciocinio(texto: string): string {
  let limpo = texto.replace(/<think\b[^>]*>[\s\S]*?<\/think\s*>/giu, '')
  // Fechamento sem abertura: o modelo cujo template abre o bloco sozinho devolve "raciocínio…</think>resposta".
  const fechamento = /<\/think\s*>/giu
  let ultimoFechamento = -1
  for (let achado = fechamento.exec(limpo); achado !== null; achado = fechamento.exec(limpo)) ultimoFechamento = achado.index + achado[0].length
  if (ultimoFechamento >= 0) limpo = limpo.slice(ultimoFechamento)
  // Abertura sem fechamento: a saída acabou no meio do raciocínio. Tudo dali em diante é raciocínio.
  const abertura = /<think\b[^>]*>/iu.exec(limpo)
  if (abertura !== null) limpo = limpo.slice(0, abertura.index)
  return limpo.trim()
}

/** Tira a cerca de código em volta do JSON (```json … ```), que modelo põe mesmo quando se pede para não pôr. */
export function tirarCercaDeCodigo(texto: string): string {
  const cerca = /^```[a-z]*\s*\n?([\s\S]*?)\n?```$/iu.exec(texto.trim())
  return (cerca?.[1] ?? texto).trim()
}

/** Raciocínio fora, cerca fora e, se sobrou prosa em volta, só o que vai da primeira chave à última. */
export function limparSaidaDoModelo(texto: string): string {
  const semCerca = tirarCercaDeCodigo(descartarRaciocinio(texto))
  if (semCerca.startsWith('{')) return semCerca
  const inicio = semCerca.indexOf('{')
  const fim = semCerca.lastIndexOf('}')
  return inicio >= 0 && fim > inicio ? semCerca.slice(inicio, fim + 1) : semCerca
}
