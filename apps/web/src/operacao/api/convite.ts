import {
  esquemaRespostaAceitarConviteDeOperador,
  esquemaRespostaConsultarConviteDeOperador,
  type PedidoAceitarConviteDeOperador,
  type RespostaConsultarConviteDeOperador,
} from '@educa/shared'
import { chamarApi } from '../../api/cliente'
import { esquecerDesafioDeOperador, guardarDesafioDeOperador } from './sessao'

export const CAMINHO_DA_CONSULTA_DE_CONVITE_DE_OPERADOR = '/v1/operacao/convite/consultar'
export const CAMINHO_DO_ACEITE_DE_CONVITE_DE_OPERADOR = '/v1/operacao/convite/aceitar'

/**
 * `POST /v1/operacao/convite/consultar`: só se o convite vale (Tech Spec da A0, seção 4). O token vai no corpo, nunca
 * na URL da API (regra 20, item 8). Usado, vencido, revogado, de operador desativado e inexistente chegam iguais, no
 * mesmo `NAO_ENCONTRADO` (C9).
 *
 * Não passa pelo TanStack Query: o token é o argumento, e uma chave de cache com ele dentro é o que não pode existir.
 */
export function consultarConviteDeOperador(token: string): Promise<RespostaConsultarConviteDeOperador> {
  return chamarApi(CAMINHO_DA_CONSULTA_DE_CONVITE_DE_OPERADOR, esquemaRespostaConsultarConviteDeOperador, { metodo: 'POST', corpo: { token } })
}

/**
 * `POST /v1/operacao/convite/aceitar`, com o token e a senha nova. A resposta é o desafio `configurar_mfa` (5 min), que
 * fica só na memória desta aba, no módulo da sessão do operador, para a tela de configurar o segundo fator. O desafio
 * de qualquer tentativa anterior sai antes: o de outra pessoa nunca sobra na aba.
 */
export async function aceitarConviteDeOperador(pedido: PedidoAceitarConviteDeOperador): Promise<void> {
  esquecerDesafioDeOperador()
  const resposta = await chamarApi(CAMINHO_DO_ACEITE_DE_CONVITE_DE_OPERADOR, esquemaRespostaAceitarConviteDeOperador, { metodo: 'POST', corpo: pedido })
  guardarDesafioDeOperador(resposta.etapa, resposta.desafio)
}
