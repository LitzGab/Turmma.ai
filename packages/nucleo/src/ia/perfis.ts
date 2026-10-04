/**
 * O perfil diz o tamanho do modelo que a tarefa precisa, e quem declara é a tarefa, nunca o adaptador (regra 30,
 * item 2). Qual modelo atende cada perfil é configuração (`LLM_MODELO_<PERFIL>`): trocar de provedor ou de modelo
 * não muda uma linha de domínio.
 */
export const PERFIS = ['rapido', 'padrao', 'complexo', 'visao'] as const
export type Perfil = (typeof PERFIS)[number]
