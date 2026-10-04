import {
  esquemaRespostaAnalistaNominal,
  esquemaRespostaConsumo,
  esquemaRespostaExecucaoAceita,
  esquemaRespostaFuncaoDaGovernanca,
  esquemaRespostaFuncoesDaGovernanca,
  esquemaRespostaResumoDaGovernanca,
  esquemaRespostaResumoDoAnalista,
  type ChaveDeFuncao,
  type FinalidadeDaLeituraNominal,
  type FuncaoDaGovernanca,
  type MotivoDeSuspensao,
  type RespostaAnalistaNominal,
  type RespostaExecucaoAceita,
  type RespostaFuncoesDaGovernanca,
} from '@educa/shared'
import { infiniteQueryOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import type { CicloDeExecucao } from './ciclo-de-execucao'
import { criarLugarNaAba } from './memoria-da-aba'
import { buscarComSessao, chamarComSessao } from './sessao'

/**
 * A governança de IA e o Analista de desempenho escolar, pela coordenação (MVP, A5). A escola e o ano letivo vêm do
 * token, nunca da tela (regra 10, item 3). Nenhuma consulta daqui leva professor, turma ou pessoa: a API recusa esses
 * campos, e a tela não tem onde escolhê-los (D45, D64).
 */

/** O começo de toda chave destas telas: a troca de escola e a pessoa seguinte esvaziam tudo junto (`main.tsx`). */
export const CHAVE_DA_GOVERNANCA = ['governanca'] as const
export const CHAVE_DO_ANALISTA = ['analista'] as const

const CAMINHO_DA_GOVERNANCA = '/v1/governanca'
const CAMINHO_DO_ANALISTA = '/v1/analista'

/** "O que a IA gerou e quem aprovou", da mais nova para a mais antiga, uma página por vez (`proxima`). Os números vêm em toda página. */
export const consultaResumoDaGovernanca = infiniteQueryOptions({
  queryKey: [...CHAVE_DA_GOVERNANCA, 'resumo'],
  queryFn: ({ pageParam, signal }) =>
    buscarComSessao(pageParam === undefined ? `${CAMINHO_DA_GOVERNANCA}/resumo` : `${CAMINHO_DA_GOVERNANCA}/resumo?pagina=${encodeURIComponent(pageParam)}`, esquemaRespostaResumoDaGovernanca, signal),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (ultima) => ultima.proxima,
})

/** O consumo do mês corrente, somado por função. */
export const consultaConsumo = queryOptions({
  queryKey: [...CHAVE_DA_GOVERNANCA, 'consumo'],
  queryFn: ({ signal }) => buscarComSessao(`${CAMINHO_DA_GOVERNANCA}/consumo`, esquemaRespostaConsumo, signal),
})

/** Os três agentes e as funções, com a autonomia em português comum e a suspensão vigente na escola. */
export const consultaFuncoesDaGovernanca = queryOptions({
  queryKey: [...CHAVE_DA_GOVERNANCA, 'funcoes'],
  queryFn: ({ signal }) => buscarComSessao(`${CAMINHO_DA_GOVERNANCA}/funcoes`, esquemaRespostaFuncoesDaGovernanca, signal),
})

const caminhoDaFuncao = (chave: ChaveDeFuncao, acao: 'suspender' | 'retomar'): string => `${CAMINHO_DA_GOVERNANCA}/funcoes/${encodeURIComponent(chave)}/${acao}`

/** `POST …/suspender`: a função passa a recusar execução nova na escola. O motivo é opcional e de lista fechada. */
export function suspenderFuncao(chave: ChaveDeFuncao, motivo: MotivoDeSuspensao | undefined): Promise<FuncaoDaGovernanca> {
  return chamarComSessao(caminhoDaFuncao(chave, 'suspender'), esquemaRespostaFuncaoDaGovernanca, { metodo: 'POST', corpo: motivo === undefined ? {} : { motivo } })
}

/** `POST …/retomar`: fecha a suspensão vigente. Sem suspensão vigente, a API responde como inexistente. */
export function retomarFuncao(chave: ChaveDeFuncao): Promise<FuncaoDaGovernanca> {
  return chamarComSessao(caminhoDaFuncao(chave, 'retomar'), esquemaRespostaFuncaoDaGovernanca, { metodo: 'POST', corpo: {} })
}

/** A função como a API a devolveu entra no lugar da antiga, em qualquer lista já lida. Sem lista lida, nada muda. */
export function trocarFuncao(lista: RespostaFuncoesDaGovernanca | undefined, nova: FuncaoDaGovernanca): RespostaFuncoesDaGovernanca | undefined {
  if (lista === undefined) return undefined
  return { agentes: lista.agentes.map((agente) => ({ ...agente, funcoes: agente.funcoes.map((funcao) => (funcao.chave === nova.chave ? nova : funcao)) })) }
}

/**
 * A tela depois de suspender ou retomar: a função muda na hora na lista lida, e a lista é marcada como velha. O time que
 * o professor lê (`GET /v1/time`) é de outra sessão, com o cache dela: ele o relê quando abre a tela.
 */
export function aplicarFuncao(cliente: QueryClient, nova: FuncaoDaGovernanca): void {
  cliente.setQueryData<RespostaFuncoesDaGovernanca>(consultaFuncoesDaGovernanca.queryKey, (lista) => trocarFuncao(lista, nova))
  void cliente.invalidateQueries({ queryKey: consultaFuncoesDaGovernanca.queryKey })
}

/** O resumo mais recente do Analista na escola, ou `null` se nenhum foi gerado. */
export const consultaResumoDoAnalista = queryOptions({
  queryKey: [...CHAVE_DO_ANALISTA, 'resumo'],
  queryFn: ({ signal }) => buscarComSessao(`${CAMINHO_DO_ANALISTA}/resumo`, esquemaRespostaResumoDoAnalista, signal),
})

/** `POST /v1/analista/gerar`: 202 com a execução, que a tela acompanha pelo ciclo de `execucoes.ts`. */
export function gerarResumoDoAnalista(chaveEnvio: string): Promise<RespostaExecucaoAceita> {
  return chamarComSessao(`${CAMINHO_DO_ANALISTA}/gerar`, esquemaRespostaExecucaoAceita, { metodo: 'POST', corpo: { chaveEnvio } })
}

/** Onde o pedido de "Gerar resumo" mora enquanto está no ar: sair da tela e voltar não o perde nem o manda de novo. */
export const lugarDoResumoDoAnalista = criarLugarNaAba<CicloDeExecucao<null>>()

/**
 * `GET /v1/analista/nominal`: o detalhe de uma turma, que nomeia os professores dela. **Cada chamada grava auditoria**,
 * com a finalidade, e por isso não é consulta com cache: é uma leitura pedida uma vez, de dentro do diálogo que avisa.
 */
export function lerDadoNominal(turmaId: string, finalidade: FinalidadeDaLeituraNominal): Promise<RespostaAnalistaNominal> {
  return chamarComSessao(`${CAMINHO_DO_ANALISTA}/nominal?turmaId=${encodeURIComponent(turmaId)}&finalidade=${encodeURIComponent(finalidade)}`, esquemaRespostaAnalistaNominal)
}
