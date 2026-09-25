import { useCallback, useRef, useState } from 'react'

/**
 * Uma abertura de um diálogo da tela: o tipo dele e o número **desta** abertura. Cancelar o Nova escola e abrir outro Nova
 * escola são duas aberturas do mesmo tipo, com dois pedidos e dois ids (`pedidos-do-painel.ts`); só o número as separa.
 */
export interface AberturaDeDialogo<Tipo extends string> {
  readonly tipo: Tipo
  /** Único na tela enquanto ela vive; serve também de `key`, para a abertura nova nunca herdar o estado da anterior. */
  readonly numero: number
}

/** A abertura seguinte, com o número depois do último que a tela deu. */
export function proximaAbertura<Tipo extends string>(tipo: Tipo, ultimoNumero: number): AberturaDeDialogo<Tipo> {
  return { tipo, numero: ultimoNumero + 1 }
}

/**
 * O diálogo aberto depois que o pedido feito em `esta` abertura termina: fecha só se ela ainda é a aberta. O `onSuccess`
 * da mutação roda mesmo com o diálogo desmontado, e a resposta pode chegar com outro diálogo aberto, do mesmo tipo ou não;
 * esse fica aberto, com o que já foi digitado nele (correção 2026-09-25-resposta-atrasada-fecha-o-dialogo-reaberto).
 */
export function fecharSeAindaAberta<Tipo extends string>(aberta: AberturaDeDialogo<Tipo> | undefined, esta: AberturaDeDialogo<Tipo>): AberturaDeDialogo<Tipo> | undefined {
  return aberta?.numero === esta.numero ? undefined : aberta
}

/**
 * O diálogo aberto de uma tela, um de cada vez. Quem desenha o diálogo passa a `aberta` para a resposta do pedido dele:
 * o `aoCriar` chama `fecharSeAinda(aberta)` com a abertura em que o pedido saiu, nunca com o tipo.
 */
export function useDialogoDaTela<Tipo extends string>(): {
  readonly aberta: AberturaDeDialogo<Tipo> | undefined
  readonly abrir: (tipo: Tipo) => void
  /** O "Cancelar" e o Esc: só o diálogo montado os oferece, e ele é o aberto. */
  readonly fechar: () => void
  readonly fecharSeAinda: (esta: AberturaDeDialogo<Tipo>) => void
} {
  const [aberta, definirAberta] = useState<AberturaDeDialogo<Tipo> | undefined>(undefined)
  const ultimoNumero = useRef(0)
  const abrir = useCallback((tipo: Tipo) => {
    const nova = proximaAbertura(tipo, ultimoNumero.current)
    ultimoNumero.current = nova.numero
    definirAberta(nova)
  }, [])
  const fechar = useCallback(() => definirAberta(undefined), [])
  const fecharSeAinda = useCallback((esta: AberturaDeDialogo<Tipo>) => definirAberta((atual) => fecharSeAindaAberta(atual, esta)), [])
  return { aberta, abrir, fechar, fecharSeAinda }
}
