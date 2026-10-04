import type { ChaveDeFuncao } from '@educa/shared'
import { relogioDoSistema, type Relogio } from '../relogio.js'
import { diaDeUso } from '../uso/dia-de-uso.js'
import type { CodigoDeErroDeIa } from './erros.js'
import type { Perfil } from './perfis.js'
import type { OrigemDaSaida } from './porta.js'

/**
 * O que toda execução de IA deixa registrado (regra 30, item 4): é o que sustenta a cobrança, o consumo da
 * governança e a resposta à escola quando ela pergunta por que a IA disse algo.
 *
 * `entrada` e `saida` são conteúdo, e **nunca vão para o log** (regra 20, item 9). Em tarefa que leva texto de aluno
 * (`levaTextoDeAluno`, hoje o turno do Tutor) elas não vêm: o registro da conversa é `mensagem_tutor`, com a
 * retenção curta e o acesso restrito de lá (regra 20, item 14), e `consumo_ia` não vira uma segunda cópia dela.
 */
export interface ConsumoDeIa {
  readonly escolaId: string
  /** Só no Tutor. O id, nunca o nome. */
  readonly alunoId?: string
  readonly execucaoId?: string
  readonly tarefa: string
  readonly funcao: ChaveDeFuncao
  readonly perfil: Perfil
  readonly origem: OrigemDaSaida
  readonly modelo: string
  readonly promptVersao: string
  /** Ausente (nula na tabela) em tarefa que leva texto de aluno. */
  readonly entrada?: unknown
  /** Ausente (nula na tabela) em tarefa que leva texto de aluno, e quando a execução falhou. */
  readonly saida?: unknown
  readonly tokensDeEntrada: number
  readonly tokensDeSaida: number
  readonly duracaoMs: number
  readonly envioExterno: boolean
  readonly tentativas: number
  readonly estado: 'concluida' | 'falhou'
  readonly codigoDeErro?: CodigoDeErroDeIa
  readonly em: Date
}

/** Porta do registro. A implementação em Postgres grava em `consumo_ia`, com o escopo da escola do próprio registro. */
export interface RegistroDeConsumo {
  registrar(consumo: ConsumoDeIa): Promise<void>
}

export interface ConsultaDeOrcamento {
  readonly escolaId: string
  readonly funcao: ChaveDeFuncao
  /** Presente no Tutor: além do teto da escola, vale o freio diário do aluno (D38). */
  readonly alunoId?: string
}

export type DecisaoDoOrcamento = { readonly permitido: true } | { readonly permitido: false; readonly tenteDeNovoEmSegundos?: number }

/**
 * Porta do orçamento, consultada **antes** de gastar (D14). Os tetos são configuração por escola e por rede, nunca
 * constante no código (D41): quem os conhece é a implementação, não o provedor.
 */
export interface OrcamentoDeIa {
  consultar(consulta: ConsultaDeOrcamento): Promise<DecisaoDoOrcamento>
}

/** Registro em memória, para teste e para a demonstração enquanto `consumo_ia` não está ligada. */
export class ConsumoEmMemoria implements RegistroDeConsumo {
  readonly registros: ConsumoDeIa[] = []

  async registrar(consumo: ConsumoDeIa): Promise<void> {
    this.registros.push(consumo)
  }
}

export interface LimitesDoOrcamentoEmMemoria {
  /** Tokens de entrada e saída somados, por escola, no mês corrente. Sem valor, não há teto. */
  readonly tokensPorEscolaNoMes?: number
  /** Trocas do Tutor por aluno no dia (o freio da D38). Sem valor, não há freio. */
  readonly trocasPorAlunoNoDia?: number
}

/** Orçamento em memória, lido do registro em memória. O dia e o mês viram no fuso do uso, como o resto do sistema. */
export class OrcamentoEmMemoria implements OrcamentoDeIa {
  constructor(
    private readonly consumo: ConsumoEmMemoria,
    private readonly limites: LimitesDoOrcamentoEmMemoria = {},
    private readonly relogio: Relogio = relogioDoSistema,
  ) {}

  async consultar(consulta: ConsultaDeOrcamento): Promise<DecisaoDoOrcamento> {
    const hoje = diaDeUso(this.relogio.agora())
    const mes = hoje.slice(0, 7)
    const daEscola = this.consumo.registros.filter((registro) => registro.escolaId === consulta.escolaId)
    if (this.limites.tokensPorEscolaNoMes !== undefined) {
      const gastos = daEscola
        .filter((registro) => diaDeUso(registro.em).startsWith(mes))
        .reduce((soma, registro) => soma + registro.tokensDeEntrada + registro.tokensDeSaida, 0)
      if (gastos >= this.limites.tokensPorEscolaNoMes) return { permitido: false }
    }
    if (consulta.alunoId !== undefined && this.limites.trocasPorAlunoNoDia !== undefined) {
      const trocas = daEscola.filter(
        (registro) => registro.alunoId === consulta.alunoId && registro.funcao === consulta.funcao && registro.estado === 'concluida' && diaDeUso(registro.em) === hoje,
      ).length
      if (trocas >= this.limites.trocasPorAlunoNoDia) return { permitido: false }
    }
    return { permitido: true }
  }
}
