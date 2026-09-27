import { tituloDaOperacao, useTituloDaAba } from '../titulo'

/**
 * O título de uma tela da operação: `<tela> · Operação Turmma`, com o sufixo para não confundir com uma aba da escola
 * aberta ao lado (`apps/web/src/titulo.ts`). Ao sair da rota, devolve o título que havia.
 */
export function useTituloDaPagina(tela: string): void {
  useTituloDaAba(tituloDaOperacao(tela))
}
