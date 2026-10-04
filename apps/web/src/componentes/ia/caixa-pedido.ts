/**
 * A regra da caixa de pedido (`docs/interface.md` 11.2 e 11.3): o que é enviado, quando o Enter envia e quando o botão
 * de enviar vira "Parar".
 */

/** `pronta` aceita pedido; `gerando` é a resposta chegando, e enviar vira "Parar"; `desligada` não aceita nada. */
export type EstadoDaCaixa = 'pronta' | 'gerando' | 'desligada'

/** O texto que vai no pedido: sem o espaço das pontas. Só espaço e quebra de linha não é pedido (`undefined`). */
export function textoDoPedido(valor: string): string | undefined {
  const texto = valor.trim()
  return texto === '' ? undefined : texto
}

/** Dá para enviar agora? Só com a caixa pronta e com texto: enquanto a resposta chega, um segundo pedido não sai. */
export function podeEnviar(valor: string, estado: EstadoDaCaixa): boolean {
  return estado === 'pronta' && textoDoPedido(valor) !== undefined
}

export interface TeclaDaCaixa {
  readonly key: string
  readonly shiftKey: boolean
  /** A tecla faz parte de uma composição (acento morto, teclado de outro alfabeto): o Enter confirma a letra, não envia. */
  readonly isComposing: boolean
}

/** **Enter envia, Shift+Enter quebra a linha.** O Enter que fecha uma composição não é envio. */
export function teclaEnvia(tecla: TeclaDaCaixa): boolean {
  return tecla.key === 'Enter' && !tecla.shiftKey && !tecla.isComposing
}
