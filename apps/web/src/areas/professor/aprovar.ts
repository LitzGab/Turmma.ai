import { NOME_DO_MOTIVO_DE_DESTAQUE, type AtividadeAplicada, type Destaque, type MotivoDeDestaque, type RespostaCorrecaoDoLote, type ResumoDoLote } from '@educa/shared'
import type { LinhaDoResumo } from '../../componentes/DialogoDeConfirmacao'
import { formatarDiaEHora } from '../../formatar'

/**
 * O que a tela de aprovar a correção diz (`docs/interface.md` 11.5; D33, D46, D56). **É diagnóstico, não nota**: tudo
 * aqui fala em acertos, questões e habilidades. Nenhum texto desta tela usa "nota", "conceito" nem "pontuação", e o
 * teste confere.
 */

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** "3,4 de 5 questões": a média de acertos da turma, em questões. */
export function textoDaMedia(resumo: Pick<ResumoDoLote, 'mediaDeAcertos' | 'questoes'>): string {
  return `${numero.format(resumo.mediaDeAcertos)} de ${String(resumo.questoes)} ${resumo.questoes === 1 ? 'questão' : 'questões'}`
}

/** "28 de 32 alunos": quantos têm correção, de quantos a turma tem. Quem não abriu a atividade não tem correção. */
export function textoDosCorrigidos(resumo: Pick<ResumoDoLote, 'corrigidos' | 'alunosDaTurma'>): string {
  return `${String(resumo.corrigidos)} de ${String(resumo.alunosDaTurma)} ${resumo.alunosDaTurma === 1 ? 'aluno' : 'alunos'}`
}

/** A faixa da distribuição: "0 a 1 acerto", "2 acertos", "4 a 5 acertos". */
export function rotuloDaFaixa(faixa: { readonly de: number; readonly ate: number }): string {
  if (faixa.de === faixa.ate) return `${String(faixa.de)} ${faixa.de === 1 ? 'acerto' : 'acertos'}`
  return `${String(faixa.de)} a ${String(faixa.ate)} acertos`
}

export function textoDeAlunos(quantos: number): string {
  return `${String(quantos)} ${quantos === 1 ? 'aluno' : 'alunos'}`
}

/**
 * O que cada motivo de destaque quer dizer, **como fato do trabalho, nunca como juízo sobre o aluno** (D57): o que se vê
 * nas respostas, e não o que isso diria da pessoa.
 */
export const EXPLICACAO_DO_MOTIVO: Readonly<Record<MotivoDeDestaque, string>> = {
  em_branco: 'Nenhuma questão foi respondida.',
  fora_do_historico: 'Os acertos ficaram bem acima ou bem abaixo dos que ele teve nas correções aprovadas desta disciplina.',
  padrao_de_erro: 'A mesma alternativa em todas as questões, ou erro em questões que quase toda a turma acertou.',
}

/** Por que a correção do aluno foi destacada, em texto: "Em branco · Padrão de erro para conferir". */
export function motivosDoDestaque(destaque: Pick<Destaque, 'motivos'>): string {
  return destaque.motivos.map((motivo) => NOME_DO_MOTIVO_DE_DESTAQUE[motivo]).join(' · ')
}

/** A explicação de cada motivo do destaque, uma frase por motivo. */
export function explicacoesDoDestaque(destaque: Pick<Destaque, 'motivos'>): string {
  return destaque.motivos.map((motivo) => EXPLICACAO_DO_MOTIVO[motivo]).join(' ')
}

/** "2 de 5 acertos", e quantas ficaram em branco quando ficou alguma. */
export function acertosDoAluno(correcao: { readonly acertos: number; readonly total: number; readonly emBranco: number }): string {
  const acertos = `${String(correcao.acertos)} de ${String(correcao.total)} ${correcao.total === 1 ? 'acerto' : 'acertos'}`
  return correcao.emBranco === 0 ? acertos : `${acertos} · ${String(correcao.emBranco)} em branco`
}

/** O estado do destaque: fechado, falta abrir; aberto, a hora em que foi aberto (é o que o registro da validação guarda). */
export function estadoDoDestaque(destaque: Pick<Destaque, 'abertoEm'>, opcoes: { fuso?: string; agora?: Date } = {}): { readonly aberto: boolean; readonly texto: string } {
  if (destaque.abertoEm === null) return { aberto: false, texto: 'Falta abrir' }
  return { aberto: true, texto: `Aberto · ${formatarDiaEHora(destaque.abertoEm, opcoes)}` }
}

export interface ContadorDosDestaques {
  /** "3 de 5 destaques abertos". */
  readonly texto: string
  /** Por que o botão de aprovar está desligado, ou `undefined` quando ele está ligado. */
  readonly porQue: string | undefined
}

/**
 * O contador ao lado do botão de aprovar, que **diz por que ele está desligado** (D33; regra 50, item 8): faltam destaques
 * para abrir. Quem libera o botão é a API (`podeAprovar`), e não a conta da tela: se as duas discordarem, vale a API, e o
 * texto manda atualizar.
 */
export function contadorDosDestaques(correcao: Pick<RespostaCorrecaoDoLote, 'destaques' | 'destaquesAbertos' | 'podeAprovar'>): ContadorDosDestaques {
  const total = correcao.destaques.length
  const faltam = total - correcao.destaquesAbertos
  const texto = total === 0 ? 'Nenhuma correção destacada neste lote' : `${String(correcao.destaquesAbertos)} de ${String(total)} ${total === 1 ? 'destaque aberto' : 'destaques abertos'}`
  if (correcao.podeAprovar) return { texto, porQue: undefined }
  if (faltam > 0) return { texto, porQue: faltam === 1 ? 'Abra o destaque que falta para liberar a aprovação.' : `Abra os ${String(faltam)} destaques que faltam para liberar a aprovação.` }
  return { texto, porQue: 'A aprovação ainda não foi liberada. Atualize a tela.' }
}

/** "Aprovar 28 correções": o botão diz o que acontece, com a quantidade. */
export function rotuloDeAprovar(corrigidos: number): string {
  return corrigidos === 1 ? 'Aprovar 1 correção' : `Aprovar ${String(corrigidos)} correções`
}

/** O que o diálogo de aprovar mostra antes de confirmar: a atividade, a turma, quantas correções e os destaques abertos. */
export function resumoDoLote(correcao: Pick<RespostaCorrecaoDoLote, 'titulo' | 'resumo' | 'destaques' | 'destaquesAbertos'>, nomeDaTurma: string | undefined): readonly [LinhaDoResumo, ...LinhaDoResumo[]] {
  return [
    { rotulo: 'Atividade', valor: correcao.titulo },
    { rotulo: 'Turma', valor: nomeDaTurma ?? 'Turma da atividade' },
    { rotulo: 'Correções', valor: textoDosCorrigidos(correcao.resumo) },
    { rotulo: 'Destaques abertos', valor: `${String(correcao.destaquesAbertos)} de ${String(correcao.destaques.length)}` },
  ]
}

export const EFEITO_DE_APROVAR_O_LOTE =
  'O diagnóstico por habilidade chega aos alunos da turma. Fica registrado o que a tela mostrou, os destaques que você abriu e que você confirmou, com a data e a hora.'
export const EFEITO_DE_REJEITAR_O_LOTE = 'Nenhum aluno recebe o diagnóstico desta correção. Fica registrado que você rejeitou, com a data, a hora e o motivo.'
export const AVISO_DA_REJEICAO_DO_LOTE = 'Diga o que está errado na correção (o gabarito de uma questão, por exemplo). Não escreva nome de aluno.'

/** A letra da alternativa, pelo índice do contrato (0 a 3). Em branco, o travessão. */
export function letraDaAlternativa(alternativa: number | null): string {
  if (alternativa === null) return '—'
  return ['a', 'b', 'c', 'd'][alternativa] ?? String(alternativa + 1)
}

/**
 * A atividade aplicada, numa linha: se está aberta ou encerrada, se é avaliativa, e quantos já enviaram. Sem nome de
 * aluno e sem lista de quem não entregou: só a contagem.
 */
export function situacaoDaAplicacao(aplicada: Pick<AtividadeAplicada, 'estado' | 'avaliativa' | 'participacao'>): string {
  const partes = [aplicada.estado === 'aberta' ? 'Aberta para a turma' : 'Encerrada', aplicada.avaliativa ? 'avaliativa' : 'prática', `${String(aplicada.participacao.enviaram)} de ${textoDeAlunos(aplicada.participacao.alunos)} enviaram`]
  return partes.join(' · ')
}

/** O que a professora escolhe ao aplicar, e o que cada escolha faz com o Tutor (D36, regra 70, item 4c). */
export const ESCOLHA_DE_AVALIATIVA = [
  { valor: 'pratica', avaliativa: false, rotulo: 'É prática', descricao: 'O Tutor continua disponível para a turma, conduzindo por perguntas.' },
  { valor: 'avaliativa', avaliativa: true, rotulo: 'É avaliativa', descricao: 'O Tutor fica pausado para a turma até você encerrar a atividade.' },
] as const

/**
 * A atividade encerrada que não tem correção para revisar, e por quê. A API encerra sem corrigir em dois casos: ninguém
 * abriu a atividade, ou a escola suspendeu a correção de objetiva. Com um lote rejeitado, encerrar de novo corrige de novo.
 */
export type SemCorrecao = 'ninguem_respondeu' | 'correcao_suspensa' | 'lote_rejeitado'

export function semCorrecao(aplicada: Pick<AtividadeAplicada, 'estado' | 'entrega' | 'participacao'>): SemCorrecao | undefined {
  if (aplicada.estado !== 'encerrada') return undefined
  if (aplicada.entrega === null) return aplicada.participacao.iniciaram === 0 ? 'ninguem_respondeu' : 'correcao_suspensa'
  return aplicada.entrega.estado === 'rejeitada' ? 'lote_rejeitado' : undefined
}

export const TEXTO_SEM_CORRECAO: Readonly<Record<SemCorrecao, string>> = {
  ninguem_respondeu: 'Nenhum aluno abriu a atividade: não há o que corrigir.',
  correcao_suspensa: 'A atividade encerrou sem corrigir: a coordenação suspendeu a correção de objetiva nesta escola. Quando a função voltar, peça a correção de novo.',
  lote_rejeitado: 'Você rejeitou a correção desta atividade. Peça a correção de novo quando o que estava errado for resolvido.',
}

export const EFEITO_DE_APLICAR = 'Os alunos da turma passam a ver a atividade e podem responder. Fica registrado que você aplicou, com a data e a hora.'
export const EFEITO_DE_ENCERRAR =
  'As respostas param agora: quem não enviou fica com o que respondeu até aqui. O Assistente corrige as objetivas, e a correção fica esperando você revisar e aprovar. Os alunos só veem o resultado depois disso.'
