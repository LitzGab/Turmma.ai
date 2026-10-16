import { useSyncExternalStore } from 'react'

/* AS FERRAMENTAS FAVORITAS: a estrela do cartão do catálogo (areas/professor/Catalogo.tsx).
   Oitava rodada (20/09/2026, cópia do modal da Teachy): a estrela marcada é laranja e as favoritas deixaram de ser uma
   seção no alto da página — são o último item da lista de categorias ("Favoritas"), que mostra só as marcadas.
   Guarda só os ids de `dados/ferramentas`; id que não existe mais no catálogo é ignorado por quem lê.
   SÓ NO MOCKUP isto mora no navegador (memória + localStorage), para a estrela continuar lá quando o Gabriel recarrega.
   No produto é preferência da pessoa, guardada no servidor junto com o resto da conta.
   Para voltar ao estado inicial: apagar a chave `turmma-mockup-favoritas-v1` no navegador. */

const CHAVE = 'turmma-mockup-favoritas-v1'
const INICIAIS: readonly string[] = ['plano', 'prova', 'apresentacao']

function carregar(): readonly string[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return INICIAIS
    const lido: unknown = JSON.parse(bruto)
    return Array.isArray(lido) ? lido.filter((x): x is string => typeof x === 'string') : INICIAIS
  } catch { return INICIAIS }
}

let estado: readonly string[] = typeof window === 'undefined' ? INICIAIS : carregar()
const ouvintes = new Set<() => void>()
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }

/** Os ids favoritados, na ordem em que a pessoa marcou. Quem desenha decide a ordem de mostrar. */
export function useFavoritas(): readonly string[] {
  return useSyncExternalStore(assinar, () => estado, () => estado)
}

/** Põe ou tira a estrela. Todo mundo que usa `useFavoritas` redesenha na hora. */
export function alternarFavorita(id: string) {
  estado = estado.includes(id) ? estado.filter((x) => x !== id) : [...estado, id]
  try { window.localStorage.setItem(CHAVE, JSON.stringify(estado)) } catch { /* modo privado: fica só na memória */ }
  ouvintes.forEach((f) => f())
}
