import { useEffect } from 'react'

/** O sufixo de toda aba da operação: quem tem uma aba da escola aberta ao lado não confunde as duas. */
export const SUFIXO_DO_TITULO = 'Operação Turmma'

/**
 * O `document.title` da rota (regra 50, item 11; `docs/interface.md` 6): o leitor de tela anuncia a aba ao trocar de
 * rota, e a pessoa com várias abas abertas acha a certa pelo título. Ao sair da rota, devolve o título que havia.
 */
export function useTituloDaPagina(titulo: string): void {
  useEffect(() => {
    const anterior = document.title
    document.title = `${titulo} · ${SUFIXO_DO_TITULO}`
    return () => {
      document.title = anterior
    }
  }, [titulo])
}
