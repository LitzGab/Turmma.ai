import { CodigoDeErro } from '@educa/shared'

/**
 * A fila das respostas que o servidor ainda não confirmou (regra 80, item 6: **resposta de prova nunca se perde**). A
 * escolha do aluno entra aqui na hora do toque, é mandada ao servidor, e só sai quando ele confirma. Se a gravação
 * falha, a escolha **fica**, e a fila tenta de novo sozinha; a tela continua mostrando o que ele marcou e diz que ainda
 * não foi salvo.
 *
 * Aqui mora só a regra, sem rede e sem relógio. Vive em memória (`fila-de-respostas.ts`), nunca em `localStorage`: o
 * que foi salvo de verdade é do servidor, lido pela consulta da prova.
 */

export interface EscolhaPendente {
  /** O número da questão, a partir de 1. */
  readonly questao: number
  /** O índice da alternativa, de 0 a 3. */
  readonly alternativa: number
}

/**
 * - `passageira`: a rede caiu, a API não respondeu. A fila tenta de novo sozinha.
 * - `encerrada`: a professora encerrou (ou a atividade já foi enviada). O servidor não aceita mais resposta: a fila
 *   para, e a tela diz quais escolhas não chegaram a ser salvas.
 * - `recusada`: o servidor recusou por outro motivo que não passa com o tempo. A fila para, e a tela manda chamar a
 *   professora; uma escolha nova tenta de novo.
 */
export type FalhaDaFila = 'passageira' | 'encerrada' | 'recusada'

export interface EstadoDaFila {
  /** As escolhas ainda não confirmadas, na ordem em que foram feitas. **Uma por questão**: a última escolha vence. */
  readonly pendentes: readonly EscolhaPendente[]
  /** A escolha que está sendo mandada agora. Uma por vez. */
  readonly noAr: EscolhaPendente | undefined
  readonly falha: FalhaDaFila | undefined
  /** Quantas tentativas seguidas falharam: é o que espaça a seguinte. */
  readonly tentativas: number
}

export const FILA_VAZIA: EstadoDaFila = { pendentes: [], noAr: undefined, falha: undefined, tentativas: 0 }

/** A falha que não passa sozinha: a fila não tenta de novo por conta própria. */
export function falhaDefinitiva(estado: EstadoDaFila): boolean {
  return estado.falha === 'encerrada' || estado.falha === 'recusada'
}

/**
 * O aluno marcou uma alternativa. A escolha anterior da mesma questão que ainda não tinha sido salva dá lugar a esta: o
 * que vale é a última. Com a atividade encerrada, nada entra: o servidor não aceitaria, e a tela não finge que aceitou.
 * A escolha nova depois de uma recusa tenta de novo.
 */
export function escolher(estado: EstadoDaFila, questao: number, alternativa: number): EstadoDaFila {
  if (estado.falha === 'encerrada') return estado
  const pendentes = [...estado.pendentes.filter((pendente) => pendente.questao !== questao), { questao, alternativa }]
  return estado.falha === 'recusada' ? { ...estado, pendentes, falha: undefined, tentativas: 0 } : { ...estado, pendentes }
}

/** O que mandar agora: a escolha mais antiga, uma por vez. Nada, com um envio no ar ou com a fila parada de vez. */
export function proximoEnvio(estado: EstadoDaFila): EscolhaPendente | undefined {
  if (estado.noAr !== undefined || falhaDefinitiva(estado)) return undefined
  return estado.pendentes[0]
}

/** O envio saiu. */
export function comecarEnvio(estado: EstadoDaFila): EstadoDaFila {
  const proximo = proximoEnvio(estado)
  return proximo === undefined ? estado : { ...estado, noAr: proximo }
}

/**
 * O servidor confirmou o que estava no ar. A escolha sai da fila **só se ainda é a mesma**: quem trocou de alternativa
 * enquanto a anterior era salva continua com a nova na fila, para ser mandada em seguida.
 */
export function confirmarEnvio(estado: EstadoDaFila): EstadoDaFila {
  const { noAr } = estado
  if (noAr === undefined) return estado
  return {
    pendentes: estado.pendentes.filter((pendente) => !(pendente.questao === noAr.questao && pendente.alternativa === noAr.alternativa)),
    noAr: undefined,
    falha: undefined,
    tentativas: 0,
  }
}

/** Como a falha de uma gravação é tratada, pelo código. Na dúvida é passageira: a escolha fica e é tentada de novo. */
export function tipoDaFalha(codigo: CodigoDeErro): FalhaDaFila {
  if (codigo === CodigoDeErro.ATIVIDADE_ENCERRADA) return 'encerrada'
  if (codigo === CodigoDeErro.NAO_ENCONTRADO || codigo === CodigoDeErro.ENTRADA_INVALIDA) return 'recusada'
  return 'passageira'
}

/** A gravação falhou. **A escolha continua na fila**, em qualquer falha: é o que a tela mostra como marcado e não salvo. */
export function falharEnvio(estado: EstadoDaFila, codigo: CodigoDeErro): EstadoDaFila {
  if (estado.noAr === undefined) return estado
  return { pendentes: estado.pendentes, noAr: undefined, falha: tipoDaFalha(codigo), tentativas: estado.tentativas + 1 }
}

export const PRIMEIRA_ESPERA_DA_FILA_MS = 2_000
export const MAIOR_ESPERA_DA_FILA_MS = 15_000

/**
 * Quanto esperar antes da tentativa seguinte: 2 s, 4 s, 8 s e, daí em diante, 15 s. Com a escola inteira atrás da mesma
 * rede que caiu, trinta alunos tentando a cada segundo é o que impediria a API de voltar (regra 80).
 */
export function esperaAntesDeTentar(tentativas: number): number {
  return Math.min(MAIOR_ESPERA_DA_FILA_MS, PRIMEIRA_ESPERA_DA_FILA_MS * 2 ** Math.max(0, tentativas - 1))
}

/** A escolha da questão que ainda não foi confirmada, se houver. */
export function pendenteDaQuestao(estado: EstadoDaFila, questao: number): EscolhaPendente | undefined {
  return estado.pendentes.find((pendente) => pendente.questao === questao)
}
