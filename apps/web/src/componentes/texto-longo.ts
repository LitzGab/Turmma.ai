/**
 * A regra do campo de várias linhas (`CampoLongo`): quantos caracteres valem, o que o contador diz e o que falta. Conta o
 * texto **sem o espaço das pontas**, que é como a API conta (`z.string().trim()` nos contratos de `@educa/shared`): oito
 * espaços não são uma justificativa de oito caracteres.
 */
export interface LimitesDoTexto {
  /** O mínimo de caracteres. Sem ele, nenhum. */
  readonly minimo?: number
  readonly maximo: number
}

export function tamanhoDoTexto(valor: string): number {
  return [...valor.trim()].length
}

/** O contador ao lado do campo: `12 de 500`. */
export function textoDoContador(valor: string, { maximo }: LimitesDoTexto): string {
  return `${String(tamanhoDoTexto(valor))} de ${String(maximo)}`
}

/** O que há de errado com o texto, dizendo o que fazer, ou `undefined` quando ele serve. */
export function problemaDoTexto(valor: string, { minimo = 0, maximo }: LimitesDoTexto): string | undefined {
  const tamanho = tamanhoDoTexto(valor)
  if (tamanho < minimo) return tamanho === 0 ? `Escreva pelo menos ${String(minimo)} caracteres.` : `Escreva pelo menos ${String(minimo)} caracteres: ${minimo - tamanho === 1 ? 'falta 1' : `faltam ${String(minimo - tamanho)}`}.`
  if (tamanho > maximo) return `Use até ${String(maximo)} caracteres.`
  return undefined
}
