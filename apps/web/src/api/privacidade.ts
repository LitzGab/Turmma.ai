import { esquemaRespostaRetencao } from '@educa/shared'
import { queryOptions } from '@tanstack/react-query'
import { buscarComSessao } from './sessao'

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
