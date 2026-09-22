import { alunosDa, type Aluno } from './alunos'
import { TURMAS } from './escola'

/* O RANKING DE PARTICIPAÇÃO DA TURMA (pedido do Gabriel, 20/09/2026: "dentro de turmas, quero estabelecer um rank";
   "pontos são recebidos com base na presença em sala e realização das atividades").
   A REGRA DOS PONTOS: presença na aula +10 · atividade entregue +20. **Nota, acerto e dificuldade NÃO entram na
   conta.** Pontua o que o aluno FEZ e ficou registrado (a chamada e a entrega), nunca o quanto ele acertou, e nunca
   atenção, humor ou jeito do aluno (D57, D66). Na tela a palavra é PARTICIPAÇÃO.
   Tudo sai de `alunosDa(turmaId)`, sem sorteio novo onde o dado já existe:
   · BIMESTRE é o total do aluno: (aulasDadas − faltas) × 10 + entregas.feitas × 20 — o mesmo número de `pontosDe`
     em `turmas-resumo.ts`, que aparece no cartão da turma.
   · MÊS e SEMANA são recortes pela DATA: a presença sai das `datasFaltas` de cada aluno (então bate com a chamada
     que outra aba mostrar); a entrega sai de um sorteio de semente fixa que decide QUAIS das cinco atividades o
     aluno deixou de entregar. A semana são os últimos sete dias (15 a 21/09): quatro aulas e uma entrega; o mês é setembro (11 aulas, 3 entregas).
   · EMPATE: com teto de pontos, o empate no alto é grande (perto de um terço da turma faz tudo), e o pódio da peça é
     de TRÊS PESSOAS. Então o desempate é outro fato de participação, nunca de nota: fica na frente QUEM ENTREGOU MAIS
     CEDO (a antecedência média das entregas, em dias antes do prazo). Se ainda empatar, vale a ordem da chamada.
     Cada aluno tem a sua posição (1º a 32º). Desempate decidido em 20/09/2026 ao ver o pódio com nove pessoas no
     1º lugar; é proposta do mockup, como o ranking inteiro.
   · A VARIAÇÃO compara a posição com a do período anterior: na semana, a semana de 8 a 14/09 pelas datas; no mês e
     no bimestre, um período anterior sintético (semente fixa), parecido com o atual. */

export const PONTOS = { presenca: 10, entrega: 20 } as const

export type PeriodoId = 'semana' | 'mes' | 'bimestre'
export type Periodo = { id: PeriodoId; nome: string; de: string; ate: string; anterior: string }

/** Datas em ISO. O "agora" do mockup é segunda, 21/09/2026. */
export const PERIODOS: readonly Periodo[] = [
  { id: 'semana', nome: 'Semana', de: '2026-09-15', ate: '2026-09-21', anterior: 'a semana anterior' },
  { id: 'mes', nome: 'Mês', de: '2026-09-01', ate: '2026-09-21', anterior: 'o mês anterior' },
  { id: 'bimestre', nome: 'Bimestre', de: '2026-08-24', ate: '2026-09-21', anterior: 'o 2º bimestre' },
]
const SEMANA_ANTERIOR = { de: '2026-09-08', ate: '2026-09-14' }

/* As 16 aulas dadas: as MESMAS colunas da aba Frequência (dados/turma-atividades) — a grade da turma (seg, ter, qui,
   sex) de 24/08 a 21/09, sem o feriado de 07/09. As `datasFaltas` de `alunos.ts` caem todas dentro delas. */
const AULAS = [
  '2026-08-24', '2026-08-25', '2026-08-27', '2026-08-28', '2026-08-31', '2026-09-01', '2026-09-03', '2026-09-04',
  '2026-09-08', '2026-09-10', '2026-09-11', '2026-09-14', '2026-09-15', '2026-09-17', '2026-09-18', '2026-09-21',
]
/* O prazo das cinco atividades com entrega do bimestre (a prova de 18/09 é feita em sala: conta como presença). */
const PRAZOS = ['2026-08-26', '2026-08-28', '2026-09-04', '2026-09-11', '2026-09-17']

export type LinhaRanking = {
  aluno: Aluno
  /** posição única, de 1 ao total da turma: pontos e, no empate, quem entregou mais cedo */
  posicao: number
  /** sempre 1 desde o desempate; fica para quem quiser voltar ao empate que divide a posição */
  empatados: number
  /** antecedência média das entregas, em dias antes do prazo: é o desempate */
  antecedencia: number
  pontos: number
  presentes: number
  aulas: number
  entregues: number
  atividades: number
  /** posições ganhas (+) ou perdidas (−) contra o período anterior; 0 = igual */
  variacao: number
  /** o fato por trás dos pontos: "15/16 aulas · 5/5 entregas" */
  byline: string
  /** o desempate, por extenso: "3,5 dias antes do prazo". Vazio para quem não entregou nada no período. Vai separado
      da byline porque é a parte que some quando a linha é estreita (celular), para a byline nunca sair cortada. */
  desempate: string
}

export type RankingDaTurma = {
  periodo: Periodo
  aulas: number
  atividades: number
  /** o teto do período: todas as aulas e todas as entregas */
  maximo: number
  /** quantos alunos fizeram o teto */
  completos: number
  linhas: LinhaRanking[]
}

/** mulberry32: sorteio repetível a partir de uma semente (o mesmo de `alunos.ts`). */
function sorteio(semente: number) {
  let a = semente
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

const limita = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const dentro = (dia: string, p: { de: string; ate: string }) => dia >= p.de && dia <= p.ate
/** "17/09" → "2026-09-17" */
const iso = (diaMes: string) => `2026-${diaMes.slice(3)}-${diaMes.slice(0, 2)}`
const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos)

export const pontosDe = (presentes: number, entregues: number) => presentes * PONTOS.presenca + entregues * PONTOS.entrega

/** Quais atividades o aluno entregou: o total vem de `entregas.feitas`; QUAIS ficaram sem entrega é sorteio de semente fixa. */
function entregasDe(a: Aluno, semente: number): boolean[] {
  const total = a.entregas.total
  const r = sorteio(semente)
  const ordem = Array.from({ length: total }, (_, i) => i)
  for (let i = total - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ordem[i], ordem[j]] = [ordem[j], ordem[i]] }
  const semEntrega = new Set(ordem.slice(0, total - a.entregas.feitas))
  return ordem.map((_, i) => !semEntrega.has(i))
}

/** Posição única: mais pontos na frente; no empate, quem entregou mais cedo; depois, a ordem da chamada. */
function posicoes(itens: { pontos: number; antecedencia: number; numero: number }[]): number[] {
  const ordem = itens.map((x, i) => ({ ...x, i })).sort((a, b) => b.pontos - a.pontos || b.antecedencia - a.antecedencia || a.numero - b.numero)
  const pos = Array<number>(itens.length).fill(0)
  ordem.forEach((x, lugar) => { pos[x.i] = lugar + 1 })
  return pos
}

const virgula = (n: number) => n.toFixed(1).replace('.', ',').replace(',0', '')

type Conta = { presentes: number; aulas: number; entregues: number; atividades: number }

function contar(a: Aluno, entregou: boolean[], janela: { de: string; ate: string }): Conta {
  const aulas = AULAS.filter((d) => dentro(d, janela)).length
  const faltas = a.datasFaltas.map(iso).filter((d) => dentro(d, janela)).length
  const prazos = PRAZOS.map((d, i) => ({ d, i })).filter((p) => dentro(p.d, janela))
  return { presentes: aulas - faltas, aulas, entregues: prazos.filter((p) => entregou[p.i]).length, atividades: prazos.length }
}

function montar(turmaId: string, periodo: Periodo): RankingDaTurma {
  const alunos = alunosDa(turmaId)
  const indice = Math.max(0, TURMAS.findIndex((t) => t.id === turmaId))
  const ordemDoPeriodo = PERIODOS.findIndex((p) => p.id === periodo.id)

  const contas = alunos.map((a) => {
    const semente = 9000 + indice * 1009 + a.numero * 31
    const entregou = entregasDe(a, semente)
    // o bimestre é o total do aluno, para dar o mesmo número do cartão da turma
    const atual: Conta = periodo.id === 'bimestre'
      ? { presentes: a.aulasDadas - a.faltas, aulas: a.aulasDadas, entregues: a.entregas.feitas, atividades: a.entregas.total }
      : contar(a, entregou, periodo)

    let antes: Conta
    if (periodo.id === 'semana') antes = contar(a, entregou, SEMANA_ANTERIOR)
    else {
      // período anterior sintético: parecido com o atual, com uma falta ou uma entrega de diferença aqui e ali
      const r = sorteio(semente + 7 + ordemDoPeriodo)
      const s = r(), t = r()
      const faltas = limita(atual.aulas - atual.presentes + (s < 0.06 ? -1 : s < 0.9 ? 0 : s < 0.98 ? 1 : 2), 0, atual.aulas)
      const entregues = limita(atual.entregues + (t < 0.03 ? -1 : t < 0.96 ? 0 : 1), 0, atual.atividades)
      antes = { ...atual, presentes: atual.aulas - faltas, entregues }
    }
    // o desempate: quantos dias antes do prazo ele costuma entregar (0,5 a 4); quem deixou entrega para trás entrega mais em cima
    const ra = sorteio(semente + 101)
    const antecedencia = Math.round((0.5 + ra() * 3.5 - (a.entregas.total - a.entregas.feitas) * 0.4) * 2) / 2
    // o período anterior quase não muda a antecedência: senão a variação de posição vira um sobe e desce sem sentido
    const j = ra()
    const antecedenciaAntes = Math.max(0, antecedencia + (j < 0.12 ? -0.5 : j > 0.88 ? 0.5 : 0))
    return { aluno: a, atual, antes, antecedencia: Math.max(0, antecedencia), antecedenciaAntes }
  })

  const posAtual = posicoes(contas.map((c) => ({ pontos: pontosDe(c.atual.presentes, c.atual.entregues), antecedencia: c.antecedencia, numero: c.aluno.numero })))
  const posAntes = posicoes(contas.map((c) => ({ pontos: pontosDe(c.antes.presentes, c.antes.entregues), antecedencia: c.antecedenciaAntes, numero: c.aluno.numero })))

  const linhas: LinhaRanking[] = contas.map((c, i) => ({
    aluno: c.aluno, posicao: posAtual[i], empatados: 1, antecedencia: c.antecedencia,
    pontos: pontosDe(c.atual.presentes, c.atual.entregues),
    presentes: c.atual.presentes, aulas: c.atual.aulas, entregues: c.atual.entregues, atividades: c.atual.atividades,
    variacao: posAntes[i] - posAtual[i],
    byline: `${c.atual.presentes}/${c.atual.aulas} ${plural(c.atual.aulas, 'aula', 'aulas')} · ${c.atual.entregues}/${c.atual.atividades} ${plural(c.atual.atividades, 'entrega', 'entregas')}`,
    desempate: c.atual.entregues === 0 ? '' : c.antecedencia > 0 ? `${virgula(c.antecedencia)} ${c.antecedencia === 1 ? 'dia' : 'dias'} antes do prazo` : 'no dia do prazo',
  })).sort((x, y) => x.posicao - y.posicao)

  const aulas = contas[0]?.atual.aulas ?? 0
  const atividades = contas[0]?.atual.atividades ?? 0
  const maximo = pontosDe(aulas, atividades)
  return { periodo, aulas, atividades, maximo, completos: linhas.filter((l) => l.pontos === maximo).length, linhas }
}

const CACHE = new Map<string, RankingDaTurma>()
export function rankingDeParticipacao(turmaId: string, periodoId: PeriodoId = 'bimestre'): RankingDaTurma {
  const chave = `${turmaId}:${periodoId}`
  if (!CACHE.has(chave)) CACHE.set(chave, montar(turmaId, PERIODOS.find((p) => p.id === periodoId) ?? PERIODOS[2]))
  return CACHE.get(chave)!
}
