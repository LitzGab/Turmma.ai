import type { Perfil } from './perfis.js'
import type { TarefaDeIa } from './tarefa.js'

/** Quem atendeu: um adaptador, ou nenhum, quando a resposta saiu de regra fixa da tarefa (assunto delicado no Tutor). */
export const ORIGENS_DA_SAIDA = ['falso', 'openai_compat', 'regra_fixa'] as const
export type OrigemDaSaida = (typeof ORIGENS_DA_SAIDA)[number]

/**
 * Uma chamada de IA. A tarefa já declara a função e o perfil (regra 30, item 2); quem chama diz de que escola é o
 * gasto e, no Tutor, de que aluno. Não há campo para modelo nem para provedor: isso é configuração.
 */
export interface PedidoDeGeracao<Entrada, Saida> {
  readonly tarefa: TarefaDeIa<Entrada, Saida>
  readonly entrada: Entrada
  /** Do contexto autenticado ou da execução gravada, nunca do cliente (regra 10). */
  readonly escolaId: string
  /** Obrigatório nas tarefas do Tutor: é por ele que o freio diário do aluno é consultado (D38). Só o id, nunca o nome. */
  readonly alunoId?: string
  /** A `execucao_agente` que pediu, para o consumo apontar para ela. */
  readonly execucaoId?: string
  /** Cancela a chamada em curso: o `ExecutorDeAgente` passa o dele, e a execução que estourou o prazo não segue gastando. */
  readonly sinal?: AbortSignal
}

export interface MedicaoDaGeracao {
  readonly origem: OrigemDaSaida
  readonly perfil: Perfil
  readonly modelo: string
  readonly promptVersao: string
  readonly tokensDeEntrada: number
  readonly tokensDeSaida: number
  readonly duracaoMs: number
  /** O conteúdo saiu desta máquina para um provedor de fora (`LLM_PROCESSAMENTO_LOCAL=false`). */
  readonly envioExterno: boolean
  /** Chamadas ao modelo: 0 na regra fixa, 2 quando a primeira saída foi inválida. */
  readonly tentativas: number
}

export interface ResultadoDaGeracao<Saida> {
  /** Já validada pelo schema e pela conferência da tarefa. */
  readonly saida: Saida
  readonly medicao: MedicaoDaGeracao
}

/**
 * A porta. É a única coisa que o domínio conhece da camada de IA (regra 30, item 1): ele entrega uma tarefa e a
 * entrada, e recebe a saída validada e a medição. Falha é sempre `ErroDeIa`, com código; erro cru de provedor não
 * atravessa.
 */
export interface LLMProvider {
  gerar<Entrada, Saida>(pedido: PedidoDeGeracao<Entrada, Saida>): Promise<ResultadoDaGeracao<Saida>>
}
