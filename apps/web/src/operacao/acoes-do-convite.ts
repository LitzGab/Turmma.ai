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

/**
 * O link do convite, montado com a origem desta web e o token no fragmento (`/convite#<token>`, a tela do F1): o
 * navegador nunca manda o fragmento ao servidor, e a tela do convite o tira da barra antes da primeira chamada.
 */
export function linkDoConvite(origem: string, caminhoDoConvite: string, token: string): string {
  return `${origem}${caminhoDoConvite}#${token}`
}

/** O que a área de transferência fez com o link: copiou, ou não há como, e a tela seleciona o campo e pede a cópia. */
export type ResultadoDaCopia = 'copiado' | 'selecionar'

/**
 * Copia o link pela área de transferência, quando o navegador a oferece (W9). Sem ela — endereço fora de contexto seguro,
 * navegador antigo — ou com a escrita recusada (permissão negada), a resposta é `selecionar`: a tela seleciona o campo e
 * pede à pessoa que copie. Nunca diz "copiado" sem a escrita ter terminado.
 */
export async function copiarLink(link: string, area: Pick<Clipboard, 'writeText'> | undefined): Promise<ResultadoDaCopia> {
  if (area === undefined) return 'selecionar'
  try {
    await area.writeText(link)
    return 'copiado'
  } catch {
    return 'selecionar'
  }
}
