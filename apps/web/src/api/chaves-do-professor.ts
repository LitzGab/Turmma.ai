/**
 * O começo da chave de cada consulta das telas do Assistente (A2). Ficam num arquivo sem mais nada para a regra do ciclo
 * de execução (`ciclo-de-execucao.ts`) dizer o que invalidar sem carregar a sessão nem a rede.
 */
export const CHAVE_DO_TIME = ['time'] as const
export const CHAVE_DA_CONVERSA = ['assistente', 'conversa'] as const
export const CHAVE_DOS_ARTEFATOS = ['artefatos'] as const
export const CHAVE_DAS_ENTREGAS = ['entregas'] as const
export const CHAVE_DAS_EXECUCOES = ['execucoes'] as const
