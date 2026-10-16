import { useSyncExternalStore } from 'react'

/* O TEMA (14ª rodada, 05/10/2026; pesquisa/ux-composicao/plano.md, seção 2.1).

   O <html> recebe sempre `data-tema="claro"` ou `data-tema="escuro"`, resolvido. A ordem de quem manda:
     1. o forçado desta aba (`?tema=escuro|claro`, guardado em sessionStorage 'turmma-tema-forcado'), para fotografar;
     2. a escolha da pessoa em Configurações › Geral › Aparência (localStorage 'turmma-aparencia');
     3. "Sistema" (o padrão): o `prefers-color-scheme` do computador, acompanhado enquanto a página está aberta.
   O script do <head> (index.html) faz a mesma conta antes do React, para não piscar.
   Fica FORA da fatia da demonstração: RECOMEÇAR A DEMONSTRAÇÃO não apaga a aparência. */

export type Aparencia = 'sistema' | 'claro' | 'escuro'
export type Tema = 'claro' | 'escuro'

const CHAVE_APARENCIA = 'turmma-aparencia'
const CHAVE_FORCADO = 'turmma-tema-forcado'
const CONSULTA = '(prefers-color-scheme: dark)'

const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())

function lerAparencia(): Aparencia {
  try {
    const v = localStorage.getItem(CHAVE_APARENCIA)
    return v === 'claro' || v === 'escuro' ? v : 'sistema'
  } catch { return 'sistema' }
}

function lerForcado(): Tema | null {
  try {
    const v = sessionStorage.getItem(CHAVE_FORCADO)
    return v === 'claro' || v === 'escuro' ? v : null
  } catch { return null }
}

function doSistema(): Tema {
  try { return window.matchMedia(CONSULTA).matches ? 'escuro' : 'claro' } catch { return 'claro' }
}

function resolver(): Tema {
  const f = lerForcado()
  if (f) return f
  const a = lerAparencia()
  return a === 'sistema' ? doSistema() : a
}

let ouvindoSistema = false

/** Escreve data-tema e color-scheme no <html>; na primeira chamada, passa a ouvir o sistema. */
export function aplicarTema(): void {
  if (typeof document === 'undefined') return
  const t = resolver()
  const html = document.documentElement
  if (html.getAttribute('data-tema') !== t) html.setAttribute('data-tema', t)
  html.style.colorScheme = t === 'escuro' ? 'dark' : 'light'
  if (!ouvindoSistema) {
    ouvindoSistema = true
    try { window.matchMedia(CONSULTA).addEventListener('change', () => { aplicarTema(); avisar() }) } catch { /* sem matchMedia */ }
    window.addEventListener('storage', (e) => { if (e.key === CHAVE_APARENCIA) { aplicarTema(); avisar() } })
  }
}

/** Força o tema nesta aba (o `?tema=`); `null` tira o forçado. */
export function forcarTema(t: Tema | null): void {
  try {
    if (t) sessionStorage.setItem(CHAVE_FORCADO, t)
    else sessionStorage.removeItem(CHAVE_FORCADO)
  } catch { /* modo privado */ }
  aplicarTema()
  avisar()
}

export const aparencia = {
  /** Grava a escolha, tira o forçado da aba e aplica na hora. */
  mudar(a: Aparencia) {
    try {
      if (a === 'sistema') localStorage.removeItem(CHAVE_APARENCIA)
      else localStorage.setItem(CHAVE_APARENCIA, a)
      sessionStorage.removeItem(CHAVE_FORCADO)
    } catch { /* modo privado: vale até recarregar */ }
    aplicarTema()
    avisar()
  },
}

const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }

/** A escolha da pessoa (Sistema · Claro · Escuro). */
export function useAparencia(): Aparencia {
  return useSyncExternalStore(assinar, lerAparencia, () => 'sistema')
}

/** O tema que está valendo agora (o forçado, a escolha ou o do sistema). */
export function useTema(): Tema {
  return useSyncExternalStore(assinar, resolver, () => 'claro')
}

/** O tema forçado nesta aba pelo `?tema=` (ou null): a Aparência mostra o que está valendo, não só a escolha guardada. */
export function useTemaForcado(): Tema | null {
  return useSyncExternalStore(assinar, lerForcado, () => null)
}
