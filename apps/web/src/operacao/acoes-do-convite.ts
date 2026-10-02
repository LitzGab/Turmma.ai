import { GERAR_CONVITE_POR_ESTADO, REFAZER_CONVITE_POR_ESTADO, REVOGAR_CONVITE_POR_ESTADO, type EscolaDoPainel } from '@educa/shared'

/** As três ações do convite da coordenação na linha da escola (Tech Spec da A0b, seções 5 e 9). */
export type AcaoDoConvite = 'gerar' | 'refazer' | 'revogar'

/** O rótulo visível de cada ação, curto para caber no cartão a 360 px; o nome acessível acrescenta a escola. */
export const ROTULO_DA_ACAO: Readonly<Record<AcaoDoConvite, string>> = {
  gerar: 'Convidar',
  refazer: 'Refazer',
  revogar: 'Revogar',
}

/**
 * As ações que a linha da escola oferece, na ordem em que aparecem, pela matriz de `@educa/shared` — a mesma pela qual o
 * servidor decide — e pelo que a API deu (tarefa 7.0, subtarefa 7.1). Refazer e revogar agem sobre o último convite de
 * coordenação, pelo id que a lista trouxe: sem o `conviteId`, não há o que refazer nem revogar, e a tela não inventa um.
 * Com a escola `ativa`, nada: a coordenação já entrou.
 */
export function acoesDoConvite(escola: Pick<EscolaDoPainel, 'estado' | 'conviteId'>): readonly AcaoDoConvite[] {
  const acoes: AcaoDoConvite[] = []
  if (GERAR_CONVITE_POR_ESTADO[escola.estado] !== 'conflito') acoes.push('gerar')
  if (escola.conviteId !== undefined) {
    if (REFAZER_CONVITE_POR_ESTADO[escola.estado] === 'refazer') acoes.push('refazer')
    if (REVOGAR_CONVITE_POR_ESTADO[escola.estado] === 'revogar') acoes.push('revogar')
  }
  return acoes
}
