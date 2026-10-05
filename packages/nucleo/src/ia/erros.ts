import { CodigoDeErro } from '@educa/shared'
import { ErroDeDominio } from '../erro/erro-de-dominio.js'

/**
 * O que pode dar errado numa chamada de IA, do jeito que o domínio enxerga. São códigos do contrato da API
 * (`CodigoDeErro`, em `@educa/shared`), com o status de `STATUS_HTTP_DO_CODIGO`: o mesmo código vai para a resposta
 * HTTP, para `execucao_agente.erro` e para `consumo_ia.codigo_de_erro`. O erro cru do provedor (status, corpo,
 * mensagem do `fetch`) nunca sai da camada: ele pode repetir o prompt, e o prompt do Tutor é texto de aluno.
 */
export const CODIGOS_DE_ERRO_DE_IA = [
  /** O provedor não respondeu, recusou (429) ou falhou (5xx), mesmo depois da repetição. */
  CodigoDeErro.IA_INDISPONIVEL,
  /** A chamada passou do prazo (`LLM_TIMEOUT_MS`) ou a execução passou do dela. */
  CodigoDeErro.IA_TEMPO_ESGOTADO,
  /** A saída não passou no schema ou na conferência da tarefa, nem depois da repetição. */
  CodigoDeErro.IA_SAIDA_INVALIDA,
  /** O orçamento de IA da escola não cobre mais uma chamada (D14). */
  CodigoDeErro.IA_ORCAMENTO_ESGOTADO,
  /** O aluno chegou ao freio diário do Tutor (D38). */
  CodigoDeErro.LIMITE_DIARIO_DO_TUTOR,
  /** A turma gastou o pacote do mês do Tutor (D38). */
  CodigoDeErro.PACOTE_DO_TUTOR_ESGOTADO,
  /** Quem chamou mandou uma entrada fora do schema da tarefa: chave a mais (nome de pessoa, por exemplo) ou campo errado. */
  CodigoDeErro.IA_ENTRADA_INVALIDA,
  /** A escola suspendeu esta função (D60): nada dela executa enquanto a suspensão durar. */
  CodigoDeErro.FUNCAO_SUSPENSA,
  /** Os trechos do material não sustentam o que foi pedido: sem página para citar, nada é gerado (regra 30, item 12). */
  CodigoDeErro.MATERIAL_INSUFICIENTE,
] as const
export type CodigoDeErroDeIa = (typeof CODIGOS_DE_ERRO_DE_IA)[number]

/** Como o `ErroDeDominio`, não tem texto livre: não há onde levar prompt, resposta de modelo ou nome. */
export class ErroDeIa extends ErroDeDominio {
  /** O mesmo `codigo`, com o tipo restrito aos da camada de IA. */
  readonly codigoDeIa: CodigoDeErroDeIa

  constructor(codigoDeIa: CodigoDeErroDeIa, tenteDeNovoEmSegundos?: number) {
    super(codigoDeIa, undefined, tenteDeNovoEmSegundos)
    this.name = 'ErroDeIa'
    this.codigoDeIa = codigoDeIa
  }
}
