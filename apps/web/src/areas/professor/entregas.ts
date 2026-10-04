import { FUNCOES, NOME_DO_TIPO_DE_ENTREGA, ROTULOS_DA_ADAPTACAO, TAMANHO_MAXIMO_DA_JUSTIFICATIVA, TAMANHO_MINIMO_DA_JUSTIFICATIVA, type AdaptacaoAplicada, type ChaveDeFuncao, type Entrega } from '@educa/shared'
import type { Aprovacao } from '../../componentes/ia/aprovacao'

/**
 * O que a tela diz de uma entrega (glossário, "Entrega"; regra 70, item 3): a situação dela diante da aprovação, o que
 * o Assistente fez, o que espera a professora e o que acontece quando ela aprova. Texto curto, na primeira pessoa do
 * agente, e **nunca sobre aluno**: a entrega fala do que foi produzido.
 */

/** Quem decidiu e não está mais na escola: o registro fica, sem o nome (o id sobrevive à eliminação da pessoa). */
export const AUTOR_QUE_SAIU = 'pessoa que não está mais na escola'

/**
 * A situação da entrega para a `LinhaAprovacao`: pendente, aprovada por quem e quando, ou rejeitada com o motivo. A
 * decidida que chegar sem a data (o contrato não deixa) é mostrada como pendente: a tela não afirma uma aprovação que
 * não sabe datar.
 */
export function aprovacaoDaEntrega(entrega: Pick<Entrega, 'estado' | 'decididaEm' | 'decididaPor' | 'justificativa'>): Aprovacao {
  if (entrega.estado === 'pendente' || entrega.decididaEm === null) return { estado: 'pendente' }
  const por = entrega.decididaPor?.nome ?? AUTOR_QUE_SAIU
  if (entrega.estado === 'aprovada') return { estado: 'aprovada', por, quando: entrega.decididaEm }
  return { estado: 'rejeitada', por, quando: entrega.decididaEm, motivo: entrega.justificativa ?? '' }
}

/** O verbo da linha, com o gênero do que foi aprovado: a versão adaptada é "Aprovada por"; a correção, também. */
export const VERBO_DA_ENTREGA = 'Aprovada por'

/** "Fonte ampliada + Tempo adicional (50% a mais)": os tipos escolhidos, e nunca o motivo. */
export function textoDaAdaptacao(adaptacao: AdaptacaoAplicada): string {
  return adaptacao.tipos.map((tipo) => (tipo === 'tempo_adicional' && adaptacao.tempoExtraPercentual !== undefined ? `${ROTULOS_DA_ADAPTACAO[tipo]} (${String(adaptacao.tempoExtraPercentual)}% a mais)` : ROTULOS_DA_ADAPTACAO[tipo])).join(' + ')
}

function daTurma(nomeDaTurma: string | undefined): string {
  return nomeDaTurma === undefined ? '' : ` da turma ${nomeDaTurma}`
}

/**
 * O que o Assistente diz da entrega, no balão do Seu time: o que fez, e o que falta para valer. Só o trabalho, sem
 * número de aluno nem nome: o detalhe abre na tela da própria entrega.
 */
export function falaDaEntrega(entrega: Pick<Entrega, 'tipo' | 'titulo'>, nomeDaTurma: string | undefined): string {
  if (entrega.tipo === 'versao_adaptada') return `Preparei a versão adaptada de "${entrega.titulo}"${daTurma(nomeDaTurma)}. Ela só pode ir aos alunos depois que você aprovar.`
  return `Corrigi "${entrega.titulo}"${daTurma(nomeDaTurma)}. O diagnóstico só chega aos alunos depois que você revisar os destaques e aprovar.`
}

/** Um cartão de "Esperando você", na Home: a função que fez, o que foi feito e de que turma. */
export interface ItemEsperando {
  readonly id: string
  readonly funcao: ChaveDeFuncao
  /** O nome da função do Assistente: "Adaptação", "Correção de objetiva". */
  readonly nomeDaFuncao: string
  /** O que espera a professora: "Versão adaptada", "Correção da turma". */
  readonly titulo: string
  /** De quê e de que turma: "Atividade de estequiometria · 2ºB". */
  readonly detalhe: string
}

/**
 * O que aparece em "Esperando você" (`docs/interface.md` 11.2): **só as entregas pendentes**, da mais antiga para a mais
 * nova, que é a ordem em que a professora deve olhar. A aprovada e a rejeitada não esperam ninguém, e sem pendência a
 * lista é vazia: a tela não põe nada no lugar.
 */
export function esperandoVoce(entregas: readonly Entrega[], nomesDasTurmas: Readonly<Record<string, string>>): ItemEsperando[] {
  return entregas
    .filter((entrega) => entrega.estado === 'pendente')
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))
    .map((entrega) => {
      const turma = nomesDasTurmas[entrega.turmaId]
      return { id: entrega.id, funcao: entrega.funcao, nomeDaFuncao: FUNCOES[entrega.funcao].nome, titulo: NOME_DO_TIPO_DE_ENTREGA[entrega.tipo], detalhe: turma === undefined ? entrega.titulo : `${entrega.titulo} · ${turma}` }
    })
}

/** Os filtros da conversa do Assistente no Seu time (11.4; P14): tudo, o que espera a professora, e por função. */
export const FILTROS_DO_TIME = [
  { id: 'tudo', rotulo: 'Tudo' },
  { id: 'esperando', rotulo: 'Esperando você' },
  { id: 'correcao_de_objetiva', rotulo: 'Correção' },
  { id: 'adaptacao', rotulo: 'Adaptação' },
] as const
export type FiltroDoTime = (typeof FILTROS_DO_TIME)[number]['id']

export function ehFiltroDoTime(valor: string): valor is FiltroDoTime {
  return FILTROS_DO_TIME.some((filtro) => filtro.id === valor)
}

/** As entregas que o filtro deixa passar. */
export function entregasDoFiltro(entregas: readonly Entrega[], filtro: FiltroDoTime): Entrega[] {
  if (filtro === 'tudo') return [...entregas]
  if (filtro === 'esperando') return entregas.filter((entrega) => entrega.estado === 'pendente')
  return entregas.filter((entrega) => entrega.funcao === filtro)
}

/**
 * A entrega se decide por `POST /v1/entregas/:id/decidir`? Só a versão adaptada pendente. O lote de correção se aprova
 * na tela de revisão, que grava o registro da validação (D56): aqui ele aparece, e a decisão dele não.
 */
export function decideAqui(entrega: Pick<Entrega, 'tipo' | 'estado'>): boolean {
  return entrega.tipo === 'versao_adaptada' && entrega.estado === 'pendente'
}

/** Os limites da justificativa de quem rejeita, os do contrato: o `CampoLongo` conta e o `problemaDoTexto` diz o que falta. */
export const LIMITES_DA_JUSTIFICATIVA = { minimo: TAMANHO_MINIMO_DA_JUSTIFICATIVA, maximo: TAMANHO_MAXIMO_DA_JUSTIFICATIVA } as const

/** O aviso do campo da justificativa: ela fala da saída da IA, e não de aluno (regra 20). */
export const AVISO_DA_JUSTIFICATIVA = 'Diga o que está errado na versão, para o Assistente refazer. Não escreva nome de aluno nem o motivo da adaptação.'

/** O que o diálogo de aprovar mostra antes de confirmar (regra 50, item 8): o que é, de qual turma, e o que muda. */
export function resumoDaAprovacao(entrega: Pick<Entrega, 'tipo' | 'titulo'>, nomeDaTurma: string | undefined): readonly [{ rotulo: string; valor: string }, ...{ rotulo: string; valor: string }[]] {
  return [
    { rotulo: 'O que é', valor: `${NOME_DO_TIPO_DE_ENTREGA[entrega.tipo]} de "${entrega.titulo}"` },
    { rotulo: 'Turma', valor: nomeDaTurma ?? 'Turma da atividade' },
    { rotulo: 'Feita por', valor: 'Assistente de ensino, com IA' },
  ]
}

export const EFEITO_DE_APROVAR = 'Só depois da sua aprovação esta versão pode ir aos alunos da turma. Fica registrado que você aprovou, com a data e a hora.'
export const EFEITO_DE_REJEITAR = 'A versão não vai aos alunos. Fica registrado que você rejeitou, com a data, a hora e o motivo.'
