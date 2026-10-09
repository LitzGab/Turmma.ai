import { esquemaRespostaIncidentes, esquemaRespostaRetencao, esquemaRespostaSuboperadores } from '@educa/shared'
import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { SEM_CORPO } from './cliente'
import { buscarComSessao, chamarComSessao } from './sessao'

/**
 * A Privacidade da coordenação (F3, 6.0). A escola vem do token, nunca da tela (regra 10, item 3). Só a coordenação
 * alcança estas leituras: professor, aluno e a rede recebem a resposta do inexistente da guarda (`PrivacidadeController`).
 */

/**
 * O começo de toda chave da Privacidade: a troca de sessão ou de escola esvazia tudo junto (`main.tsx`, `resetQueries`),
 * e a pessoa seguinte não lê a retenção da anterior.
 */
export const CHAVE_DA_PRIVACIDADE = ['privacidade'] as const

/** Por quanto tempo a escola guarda cada dado: as categorias, com o prazo que vale e de onde ele vem, e os prazos fixos. */
export const consultaRetencao = queryOptions({
  queryKey: [...CHAVE_DA_PRIVACIDADE, 'retencao'],
  queryFn: ({ signal }) => buscarComSessao('/v1/privacidade/retencao', esquemaRespostaRetencao, signal),
})

/** As empresas que recebem dado da escola, vigentes e passadas (F3, 8.0). */
export const consultaSuboperadores = queryOptions({
  queryKey: [...CHAVE_DA_PRIVACIDADE, 'suboperadores'],
  queryFn: ({ signal }) => buscarComSessao('/v1/privacidade/suboperadores', esquemaRespostaSuboperadores, signal),
})

/**
 * Os incidentes de segurança que afetaram a escola, só a seção dela, com os sem confirmação primeiro (F3, 10.0; RF9). Duas
 * telas leem esta consulta: o aviso da área da coordenação, que a lê uma vez por sessão, e a aba Incidentes. A chave é uma só,
 * e por isso a confirmação numa delas atualiza a outra.
 */
export const consultaIncidentes = queryOptions({
  queryKey: [...CHAVE_DA_PRIVACIDADE, 'incidentes'],
  queryFn: ({ signal }) => buscarComSessao('/v1/privacidade/incidentes', esquemaRespostaIncidentes, signal),
})

/**
 * `POST /v1/privacidade/incidentes/:id/confirmar`: a coordenação diz que recebeu o aviso. Quem e quando ficam registrados na
 * API; confirmar de novo responde igual, e o id de outra escola responde o do inexistente (regra 10, item 6).
 */
export function confirmarIncidente(id: string): Promise<void> {
  return chamarComSessao(`/v1/privacidade/incidentes/${encodeURIComponent(id)}/confirmar`, SEM_CORPO, { metodo: 'POST', corpo: {} })
}

/**
 * Depois de confirmar, a tela relê os incidentes e só então o pedido termina: o dado que aparece é o do servidor (a data de
 * confirmação é dele), e a faixa e o diálogo somem juntos com a aba. O `await` mantém o botão desligado até a leitura chegar.
 */
export function relerIncidentes(cliente: QueryClient): Promise<void> {
  return cliente.invalidateQueries({ queryKey: consultaIncidentes.queryKey })
}
