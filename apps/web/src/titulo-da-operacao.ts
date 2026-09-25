/**
 * O título da aba de uma tela da operação: `<tela> · Operação Turmma`. Mora fora de `src/operacao/` porque a fronteira de
 * erro do chunk da operação (`rotas.tsx`) também o usa, e a entrada da web não importa nada de lá (B2).
 */
export const SUFIXO_DO_TITULO = 'Operação Turmma'

export function tituloDaOperacao(tela: string): string {
  return `${tela} · ${SUFIXO_DO_TITULO}`
}
