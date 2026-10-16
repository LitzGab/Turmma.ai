import { useMemo } from 'react'
import { ESCOLAS } from './escola'
import { agora, useAgora } from './demo/nucleo'

/* A GRADE DA SEMANA (12ª rodada, 04/10/2026; plano de polimento, seção 1).

   A grade da professora Camila, como a coordenação importou, COPIADA de `professor/Calendario.tsx` (GRADE,
   CONTEUDO e MATERIAL), para uma fonte só: dela saem a faixa "Agora" do Início, a Semana dentro de Turmas, o
   "na próxima aula" do documento e a abertura da prova enviada "na próxima aula".
   A semana é a de 21 a 25 de setembro de 2026; o agora é segunda, 10h42 (a aula do 2ºB começou às 10h30).
   Professor sem grade (quem aceitou um convite na demonstração) não tem aula: as funções devolvem vazio. */

type Aula = [hora: string, turma: string, escola?: string]

const RIO = ESCOLAS[1]

/* Índice 0 = segunda. */
const GRADE: Aula[][] = [
  [['7:30', '1ºC'], ['8:20', '2ºA'], ['10:30', '2ºB'], ['14:10', '9ºA', RIO.curto]],
  [['7:30', '2ºB'], ['9:10', '1ºC'], ['10:30', '2ºA']],
  [['8:20', '2ºA'], ['14:10', '9ºA', RIO.curto], ['15:00', '9ºA', RIO.curto]],
  [['7:30', '1ºC'], ['10:30', '2ºB']],
  [['7:30', '2ºA'], ['9:10', '2ºB'], ['10:30', '1ºC']],
]

/* O que a professora já preencheu nesta semana: "dia hora turma" → conteúdo. */
const CONTEUDO: Record<string, string> = {
  '21 7:30 1ºC': 'Modelos atômicos: de Dalton a Bohr', '21 8:20 2ºA': 'Correção da lista de mol', '21 10:30 2ºB': 'Revisão de estequiometria',
  '22 7:30 2ºB': 'Reagente limitante · aula 1 do plano', '22 9:10 1ºC': 'Distribuição eletrônica',
  '23 8:20 2ºA': 'Reagente limitante', '23 14:10 9ºA': 'Reações químicas do dia a dia',
  '24 10:30 2ºB': 'Reagente limitante · aula 2 do plano', '25 7:30 2ºA': 'Rendimento de reação', '25 10:30 1ºC': 'Tabela periódica: famílias',
}

/* O material já ligado a uma aula: o plano de duas aulas de reagente limitante do 2ºB. */
const PLANO = { nome: 'Plano da semana · reagente limitante', para: '/professor/conversa/plano-semana' }
const MATERIAL: Record<string, { nome: string; para: string }> = { '22 7:30 2ºB': PLANO, '24 10:30 2ºB': PLANO }

/* As avaliações marcadas nesta semana (o selo AVALIAÇÃO na Semana). */
const AVALIACAO: Record<string, string> = {}

const ID_DA_TURMA: Record<string, string> = { '2ºB': '2b', '2ºA': '2a', '1ºC': '1c', '9ºA': '9a' }
const MATERIA_DA_TURMA: Record<string, string> = { '2b': 'Química', '2a': 'Química', '1c': 'Química', '9a': 'Ciências' }
const DIAS = ['segunda', 'terça', 'quarta', 'quinta', 'sexta']
const DIAS_CURTOS = ['seg', 'ter', 'qua', 'qui', 'sex']
const DURACAO_MIN = 50
const SEGUNDA = new Date(2026, 8, 21)

export type AulaDaSemana = {
  id: string
  /** 0 = segunda */
  diaSemana: number
  /** "segunda" */
  nomeDia: string
  /** "21/09" */
  data: string
  /** "10h30" */
  hora: string
  turmaId: string
  turma: string
  materia: string
  escolaId: string
  conteudo: string | null
  material: { nome: string; para: string } | null
  avaliacao: string | null
  /** a aula está acontecendo agora */
  agora: boolean
  /** minutos desde segunda 0h (para ordenar) */
  ordem: number
}

export type DiaDaSemana = { indice: number; nome: string; curto: string; data: string; hoje: boolean; aulas: AulaDaSemana[] }

const dois = (n: number) => String(n).padStart(2, '0')
const horaBonita = (hm: string) => { const [h, m] = hm.split(':'); return `${Number(h)}h${m}` }
const minutoDoDia = (hm: string) => { const [h, m] = hm.split(':').map(Number); return h * 60 + m }

/** O minuto de agora, contado desde segunda 0h, pelo relógio da demonstração. */
function minutoDeAgora(ordemRelogio: number) {
  return 10 * 60 + 42 + ordemRelogio
}

/** A semana de 21 a 25/09 inteira (as aulas da Camila), com o "agora" marcado. */
function montarSemana(ordemRelogio: number): AulaDaSemana[] {
  const m = minutoDeAgora(ordemRelogio)
  return GRADE.flatMap((aulas, i) => aulas.map(([hm, turma, escola]): AulaDaSemana => {
    const d = new Date(SEGUNDA.getFullYear(), SEGUNDA.getMonth(), SEGUNDA.getDate() + i)
    const chave = `${d.getDate()} ${hm} ${turma}`
    const turmaId = ID_DA_TURMA[turma]
    const ordem = i * 24 * 60 + minutoDoDia(hm)
    return {
      id: `${i}-${hm}-${turmaId}`, diaSemana: i, nomeDia: DIAS[i], data: `${dois(d.getDate())}/${dois(d.getMonth() + 1)}`,
      hora: horaBonita(hm), turmaId, turma, materia: MATERIA_DA_TURMA[turmaId], escolaId: escola ? 'cachoeira' : 'aurora',
      conteudo: CONTEUDO[chave] ?? null, material: MATERIAL[chave] ?? null, avaliacao: AVALIACAO[chave] ?? null,
      agora: m >= ordem && m < ordem + DURACAO_MIN, ordem,
    }
  }))
}

/** Só a Camila tem grade na demonstração; quem entrou por convite ainda não tem aula importada. */
const temGrade = (professorId: string) => professorId === 'camila'

/** A semana de um professor numa escola, em 5 colunas (seg a sex). */
export function useSemana(professorId: string, escolaId: string): DiaDaSemana[] {
  const { ordem } = useAgora()
  return useMemo(() => {
    const aulas = temGrade(professorId) ? montarSemana(ordem).filter((a) => a.escolaId === escolaId) : []
    return DIAS.map((nome, i) => {
      const d = new Date(SEGUNDA.getFullYear(), SEGUNDA.getMonth(), SEGUNDA.getDate() + i)
      return { indice: i, nome, curto: DIAS_CURTOS[i], data: `${dois(d.getDate())}/${dois(d.getMonth() + 1)}`, hoje: i === 0, aulas: aulas.filter((a) => a.diaSemana === i) }
    })
  }, [professorId, escolaId, ordem])
}

export type AulaAgora = {
  aula: AulaDaSemana
  agora: boolean
  /** "Agora · 10h30" ou "Próxima · terça 7h30" (a caixa alta vem do CSS) */
  rotulo: string
}

/** A aula de agora, ou a próxima, de um professor numa escola; null para quem não tem grade. */
export function aulaAgoraOuProxima(professorId: string, escolaId: string): AulaAgora | null {
  if (!temGrade(professorId)) return null
  const m = minutoDeAgora(agora().ordem)
  const aulas = montarSemana(agora().ordem).filter((a) => a.escolaId === escolaId)
  const ja = aulas.find((a) => a.agora)
  if (ja) return { aula: ja, agora: true, rotulo: `Agora · ${ja.hora}` }
  const prox = aulas.find((a) => a.ordem > m)
  if (!prox) return null
  return { aula: prox, agora: false, rotulo: `Próxima · ${prox.diaSemana === 0 ? 'hoje' : prox.nomeDia} ${prox.hora}` }
}

export type ProximaAula = {
  /** "terça" */
  dia: string
  /** "7h30" */
  hora: string
  /** "22/09" */
  data: string
  /** "terça, 7h30" */
  rotulo: string
  /** "Terça 7h30", para o selo (a caixa alta vem do CSS) */
  selo: string
}

/** A próxima aula de uma turma que COMEÇA depois de agora. No 2ºB, depois de segunda 10h30, é terça, 7h30. */
export function proximaAulaDe(turmaId: string): ProximaAula | null {
  const m = minutoDeAgora(agora().ordem)
  const a = montarSemana(agora().ordem).find((x) => x.turmaId === turmaId && x.ordem > m)
  if (!a) return null
  const dia = a.diaSemana === 0 ? 'hoje' : a.nomeDia
  return { dia, hora: a.hora, data: a.data, rotulo: `${dia}, ${a.hora}`, selo: `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${a.hora}` }
}

/* ── 14ª rodada (05/10/2026): o horário de cada aula, para a grade de horário da Semana (só acréscimo) ──────── */

/** Quanto dura uma aula, em minutos. */
export const DURACAO_AULA = DURACAO_MIN

/** "10h30" (ou "10:30") → minutos desde 0h (630). */
export function minutosDaHora(hora: string): number {
  const [h, m] = hora.split(/[h:]/).map(Number)
  return h * 60 + (m || 0)
}

/** 630 → "10h30". */
export function horaDosMinutos(min: number): string {
  return `${Math.floor(min / 60)}h${dois(min % 60)}`
}
