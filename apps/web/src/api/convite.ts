import {
  esquemaRespostaAceitarConvite,
  esquemaRespostaConsultarConvite,
  type PedidoAceitarConvite,
  type RespostaAceitarConvite,
  type RespostaConsultarConvite,
} from '@educa/shared'
import { chamarApi } from './cliente'
import { guardarBilheteDeConvite, guardarDesafio } from './sessao'

export const CAMINHO_DA_CONSULTA_DE_CONVITE = '/v1/convites/consultar'
export const CAMINHO_DO_ACEITE_DE_CONVITE = '/v1/convites/aceitar'

/**
 * `POST /v1/convites/consultar`: o nome da escola que convida. O token vai sempre no corpo, nunca na URL da API, que
 * fica no log de borda e no histórico do navegador (regra 20, item 8). Expirado, revogado, usado e inexistente chegam
 * iguais.
 *
 * A consulta não passa pelo TanStack Query: o token é o argumento, e uma chave de cache com ele dentro é justamente o
 * que não pode existir.
 */
export function consultarConvite(token: string): Promise<RespostaConsultarConvite> {
  return chamarApi(CAMINHO_DA_CONSULTA_DE_CONVITE, esquemaRespostaConsultarConvite, { metodo: 'POST', corpo: { token } })
}

/**
 * `POST /v1/convites/aceitar` (Tech Spec, seção 5, "Convite"):
 *
 * - **conta nova:** com a senha, a resposta é `configurar_mfa`, e o desafio fica guardado em memória para a tela do
 *   segundo fator. Sem a senha, a API responde `ENTRADA_INVALIDA` **sem gastar o convite**, e é por isso que a tela
 *   tenta primeiro sem ela: assim ninguém digita uma senha nova para descobrir depois que a conta já existia;
 * - **conta que já existe:** a senha é ignorada pela API e a resposta é `entrar`, com o bilhete de 30 min, que fica
 *   só na memória desta aba e vai no corpo do próximo login por e-mail.
 */
export async function aceitarConvite(pedido: PedidoAceitarConvite): Promise<RespostaAceitarConvite> {
  const resposta = await chamarApi(CAMINHO_DO_ACEITE_DE_CONVITE, esquemaRespostaAceitarConvite, { metodo: 'POST', corpo: pedido })
  if (resposta.etapa === 'entrar') guardarBilheteDeConvite(resposta.bilhete)
  else guardarDesafio(resposta.etapa, resposta.desafio)
  return resposta
}
