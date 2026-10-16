import { useSyncExternalStore } from 'react'
import { ESCOLAS, escolaDe } from './escola'

/* A ESCOLA ATIVA (20/09/2026) — a professora que dá aula em duas escolas escolhe uma no alto da lateral, e a escolha
   vale para o app inteiro: a lateral, a barra do celular e a ordem dos grupos no menu "Para qual turma" da caixa de
   pedido leem daqui. Aluno e coordenação têm uma escola só e não passam por este arquivo.

   No molde de dados/conversas.ts: memória + localStorage, SÓ NO MOCKUP, para o Gabriel recarregar e a escola continuar
   a mesma. No PRODUTO a escola ativa é escopo de sessão no servidor (regra 10): cada escola tem o seu material e as
   suas turmas, e nada passa de uma para a outra. Para voltar ao estado inicial: apagar a chave abaixo no navegador. */

const CHAVE = 'turmma-mockup-escola-v1'

function carregar(): string {
  try {
    const lido = window.localStorage.getItem(CHAVE)
    return lido && ESCOLAS.some((e) => e.id === lido) ? lido : ESCOLAS[0].id
  } catch { return ESCOLAS[0].id }
}

let ativa: string = typeof window === 'undefined' ? ESCOLAS[0].id : carregar()
const ouvintes = new Set<() => void>()
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }

/** A escola escolhida no alto da lateral (o objeto de ESCOLAS, não só o id). */
export function useEscolaAtiva() {
  const id = useSyncExternalStore(assinar, () => ativa, () => ativa)
  return escolaDe(id)
}

export function definirEscolaAtiva(id: string) {
  if (id === ativa || !ESCOLAS.some((e) => e.id === id)) return
  ativa = id
  try { window.localStorage.setItem(CHAVE, id) } catch { /* modo privado: fica só na memória */ }
  ouvintes.forEach((f) => f())
}
