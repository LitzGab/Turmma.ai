import { useEffect } from 'react'
import { tituloDaOperacao } from '../titulo-da-operacao'

/**
 * O `document.title` da rota (regra 50, item 11; `docs/interface.md` 6): o leitor de tela anuncia a aba ao trocar de
 * rota, e a pessoa com várias abas abertas acha a certa pelo título, com o sufixo da operação para não confundir com uma
 * aba da escola aberta ao lado. Ao sair da rota, devolve o título que havia.
 */
export function useTituloDaPagina(titulo: string): void {
  useEffect(() => {
    const anterior = document.title
    document.title = tituloDaOperacao(titulo)
    return () => {
      document.title = anterior
    }
  }, [titulo])
}
