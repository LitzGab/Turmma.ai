import type { CodigoDeErro } from '@educa/shared'
import { ErroDeDominio } from '../erro/erro-de-dominio.js'

/**
 * O que pode dar errado numa chamada de IA, do jeito que o domínio enxerga. O erro cru do provedor (status HTTP,
 * corpo, mensagem do `fetch`) nunca sai da camada: ele pode repetir o prompt, e o prompt do Tutor é texto de aluno.
 */
export const CODIGOS_DE_ERRO_DE_IA = [
  /** O provedor não respondeu, recusou (429) ou falhou (5xx). */
  'IA_INDISPONIVEL',
  /** A chamada passou do prazo (`LLM_TIMEOUT_MS`) ou a execução passou do dela. */
  'IA_TEMPO_ESGOTADO',
  /** A saída não passou no schema ou na conferência da tarefa, nem depois da repetição. */
  'IA_SAIDA_INVALIDA',
  /** O orçamento da escola, ou o do aluno no Tutor, não cobre mais uma chamada (D14, D38). */
  'IA_ORCAMENTO_ESGOTADO',
  /** Quem chamou mandou uma entrada fora do schema da tarefa: chave a mais (nome de pessoa, por exemplo) ou campo errado. */
  'IA_ENTRADA_INVALIDA',
  /** A escola suspendeu esta função (D60): nada dela executa enquanto a suspensão durar. */
  'IA_FUNCAO_SUSPENSA',
] as const
export type CodigoDeErroDeIa = (typeof CODIGOS_DE_ERRO_DE_IA)[number]

/**
 * O código da resposta HTTP de cada erro de IA. `CodigoDeErro` é contrato de `packages/shared` e ainda não tem os
 * códigos de IA: até entrarem lá, o filtro global responde com o código geral mais próximo, e o código de IA fica em
 * `codigoDeIa`, que é o que a `execucao_agente` grava em `erro`.
 *
 * TODO(fase-1): quando o pacote S entregar os códigos de IA em `packages/shared/src/erros/` (indisponível, tempo
 * esgotado, saída inválida, função suspensa), esta tabela passa a apontar cada `CodigoDeErroDeIa` para o código
 * próprio dele, e o status sai de `STATUS_HTTP_DO_CODIGO`. O que não ganhar código próprio (orçamento esgotado,
 * entrada inválida) continua no código geral. `codigoDeIa` fica: é o que o `ExecutorDeAgente` grava, e nada do
 * domínio precisa mudar.
 */
const CODIGO_DE_DOMINIO: Readonly<Record<CodigoDeErroDeIa, CodigoDeErro>> = {
  IA_INDISPONIVEL: 'INDISPONIVEL_TENTE_DE_NOVO',
  IA_TEMPO_ESGOTADO: 'TEMPO_ESGOTADO',
  IA_SAIDA_INVALIDA: 'INDISPONIVEL_TENTE_DE_NOVO',
  IA_ORCAMENTO_ESGOTADO: 'LIMITE_EXCEDIDO',
  IA_ENTRADA_INVALIDA: 'ENTRADA_INVALIDA',
  IA_FUNCAO_SUSPENSA: 'CONFLITO',
}

/** Como o `ErroDeDominio`, não tem texto livre: não há onde levar prompt, resposta de modelo ou nome. */
export class ErroDeIa extends ErroDeDominio {
  constructor(
    readonly codigoDeIa: CodigoDeErroDeIa,
    tenteDeNovoEmSegundos?: number,
  ) {
    super(CODIGO_DE_DOMINIO[codigoDeIa], undefined, tenteDeNovoEmSegundos)
    this.name = 'ErroDeIa'
  }
}
