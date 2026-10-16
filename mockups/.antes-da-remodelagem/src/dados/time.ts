import { useSyncExternalStore } from 'react'
import type { AgenteId } from './agentes'
import { MENSAGENS_ASSISTENTE, MENSAGENS_TUTOR, type MensagemTime } from './mensagens-time'

/* O RESUMO DO TIME, para a lateral e para o cabeçalho da conversa: quem é, quantas mensagens esperam, a última coisa
   que o agente disse e quando. A conversa de cada agente, como dado, mora em dados/mensagens-time.

   20/09/2026 (revisão) — a lateral e a conversa passaram a ler DO MESMO LUGAR. Antes o "2" da lateral era uma
   constante e a faixa "Esperando você" contava por conta própria: ela aprovava na conversa, a faixa caía para 1 e a
   lateral continuava em 2 (e o Tutor dizia 2 na lateral e 1 na faixa). Agora o que ela FEZ em cada conversa — as
   respostas que entraram e as mensagens que resolveu — mora aqui, num armazenamento mínimo em memória, e o contador
   da lateral é o mesmo número da faixa: as mensagens com `pendente` que ela ainda não respondeu. De brinde, a conversa
   não esquece o que ela aprovou quando ela passeia pelo app e volta. Recarregar a página devolve o estado inicial.
   No PRODUTO isto é dado do servidor; aqui é SÓ NO MOCKUP. */

export type QuemTime = 'assistente' | 'tutor'

export type ResumoAgente = {
  id: AgenteId
  /** mensagens esperando a professora: é o mesmo número da faixa "Esperando você" da conversa */
  contador: number
  /** alguma delas espera a professora? (o contador fica laranja; só "não lida" iria em preto) */
  espera: boolean
  /** a última mensagem do agente, como aparece na linha da lateral */
  ultima: string
  quando: string
  /** está trabalhando agora? */
  ativo: boolean
}

/** O que a professora já fez numa conversa. */
export type EstadoConversa = {
  /** as mensagens que entraram depois das de `dados/mensagens-time` (as dela e as réplicas do agente) */
  extras: MensagemTime[]
  /** mensagens do agente que ela já respondeu → como ("aprovada", "rejeitada", "vista") */
  resolvidas: Record<string, string>
}

const BASE: Record<QuemTime, MensagemTime[]> = { assistente: MENSAGENS_ASSISTENTE, tutor: MENSAGENS_TUTOR }

/** A linha da lateral antes de qualquer resposta dela: o resumo da última mensagem, escrito à mão para caber. */
const INICIO: Record<QuemTime, { ultima: string; quando: string; ativo: boolean }> = {
  assistente: { ultima: 'Preparei a versão adaptada da prova do 2ºB. Espera você.', quando: '10h44', ativo: true },
  tutor: { ultima: 'Oito alunos do 2ºB travaram no mesmo passo.', quando: '10h15', ativo: true },
}

const ORDEM: QuemTime[] = ['assistente', 'tutor']

let conversas: Record<QuemTime, EstadoConversa> = {
  assistente: { extras: [], resolvidas: {} },
  tutor: { extras: [], resolvidas: {} },
}
/** o relógio do mockup: a hora da próxima mensagem dela, que anda um minuto por mensagem */
const relogios: Record<QuemTime, [number, number]> = { assistente: [10, 58], tutor: [10, 42] }
let seq = 0

function calcular(): ResumoAgente[] {
  return ORDEM.map((id) => {
    const { extras, resolvidas } = conversas[id]
    const contador = BASE[id].filter((m) => m.pendente && !resolvidas[m.id]).length
    const ultimaDoAgente = [...extras].reverse().find((m) => m.de === 'agente')
    return {
      id, contador, espera: contador > 0, ativo: INICIO[id].ativo,
      ultima: ultimaDoAgente ? ultimaDoAgente.texto.replaceAll('**', '') : INICIO[id].ultima,
      quando: ultimaDoAgente ? ultimaDoAgente.hora : INICIO[id].quando,
    }
  })
}

let resumo: ResumoAgente[] = calcular()

/** O estado de quando a página abre. Quem desenha usa `useResumoTime`, que acompanha o que ela faz na conversa. */
export const RESUMO_TIME: ResumoAgente[] = resumo

const ouvintes = new Set<() => void>()
const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }

function publicar(id: QuemTime, novo: EstadoConversa) {
  conversas = { ...conversas, [id]: novo }
  resumo = calcular()
  ouvintes.forEach((f) => f())
}

/** O resumo vivo do time: a lateral lê daqui. */
export function useResumoTime() {
  return useSyncExternalStore(assinar, () => resumo, () => resumo)
}

/** O resumo vivo de um agente: o cabeçalho da conversa lê daqui. */
export function useResumoDo(id: AgenteId) {
  return useResumoTime().find((r) => r.id === id)
}

/** O que ela já fez na conversa de um agente. */
export function useConversaTime(id: QuemTime) {
  return useSyncExternalStore(assinar, () => conversas[id], () => conversas[id])
}

export const conversaTime = {
  /** Entra uma mensagem no fim da conversa; devolve o id dela. */
  entra(id: QuemTime, m: Omit<MensagemTime, 'id'>): string {
    const idMsg = `nova-${seq++}`
    const c = conversas[id]
    publicar(id, { ...c, extras: [...c.extras, { ...m, id: idMsg }] })
    return idMsg
  },
  /** Ela respondeu a uma mensagem do agente: sai da faixa, e o contador da lateral cai junto. */
  resolve(id: QuemTime, idMsg: string, como: string) {
    const c = conversas[id]
    publicar(id, { ...c, resolvidas: { ...c.resolvidas, [idMsg]: como } })
  },
  /** A hora da próxima mensagem dela ("10h58"). */
  proximaHora(id: QuemTime): string {
    const [h, m] = relogios[id]
    relogios[id] = m === 59 ? [h + 1, 0] : [h, m + 1]
    return `${h}h${String(m).padStart(2, '0')}`
  },
}

export const resumoDo = (id: AgenteId) => resumo.find((r) => r.id === id)
