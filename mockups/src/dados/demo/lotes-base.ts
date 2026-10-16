import { PROVA_MOL } from '../questoes'
import { criarFatia } from './nucleo'

/* OS LOTES DE NOTAS, a parte que não depende de ninguém (12ª rodada). Mora aqui, embaixo de `dados/avaliacoes.ts`,
   para `dados/alunos.ts` saber se a prova de 18/09 já foi aprovada (a média só conta nota aprovada, regra 70) sem
   importar quem o importa. As telas usam `useLotes`, `useLote` e `lotes.*` de `dados/avaliacoes.ts`.

   O lote `prova-2b` é o das 26 provas da "Prova de mol e massa molar" (18/09): os 26 alunos do 2ºB que entraram no
   Turmma (a turma tem 32 nomes; os 6 que não entraram não fizeram a prova). 5 DESTAQUES e 21 "outras". O Lucas está
   nas "outras", com 7 de 10. Os acertos daqui são a FONTE da coluna "Prova de mol" do boletim (`dados/alunos.ts` lê
   ACERTOS_PROVA_MOL_2B), para a nota aprovada ser a mesma que entra no boletim. */

export type Destaque = { id: string; quem: string; porque: string; resumo: string; fato?: boolean }

export type EntregaNoLote = {
  alunoId: string
  nome: string
  /** índice da questão → letra marcada (A a D) */
  respostas: Record<number, string>
  acertos: number
  total: number
  /** quantas vezes saiu da aba da prova (só o professor vê; D70) */
  saidas: number
  /** o recado que vai com a nota, em modelo, escrito pelo Assistente */
  recado: string
  quando: string
}

export type EstadoLote = 'espera' | 'aprovado' | 'recusado'

export type Lote = {
  id: string
  tarefaId: string
  turmaId: string
  turma: string
  materia: string
  /** "Prova de mol e massa molar" */
  titulo: string
  tipo: 'prova' | 'lista' | 'atividade'
  /** "18/09" */
  data: string
  questoes: number
  gabarito: string
  gabaritoTrocado?: boolean
  destaques: Destaque[]
  /** os destaques já abertos pela professora */
  vistos: string[]
  /** as notas iguais ao gabarito, em ordem alfabética, nunca por nota */
  outras: { nome: string; acertos: number }[]
  /** as entregas feitas na demonstração */
  entregas: EntregaNoLote[]
  /** quem a professora tirou do lote (vai refazer) */
  tirados: string[]
  estado: EstadoLote
  por?: string
  quando?: string
  motivo?: string
  /** o recado que vai com as notas do lote de 26 (a devolutiva da objetiva também é aprovada; auditoria 4.1.3) */
  recado?: string
}

export const DESTAQUES_PROVA_2B: Destaque[] = [
  { id: 'abaixo', quem: 'Ana Beatriz', porque: 'Muito abaixo do que costuma tirar', resumo: '20% de acerto; costuma ficar entre 70% e 80%' },
  { id: 'branco', quem: 'Caio Mendes', porque: 'Prova em branco', resumo: 'nenhuma questão respondida' },
  { id: 'q7', quem: 'Daniela Rocha', porque: 'Nota no limite, por causa da questão 7', resumo: '50% de acerto; 24 alunos marcaram c na 7, o gabarito diz a' },
  { id: 'acima', quem: 'Nicolas Dias', porque: 'Muito acima do que costuma tirar', resumo: '90% de acerto; costuma ficar perto de 40%' },
  { id: 'aba', quem: 'Felipe Nunes', porque: 'Saiu da aba da prova 3 vezes', resumo: 'é um fato, sem consequência automática', fato: true },
]

/** Os acertos (de 10) dos 26 que fizeram a prova de 18/09. Os 5 destaques batem com as letras de `professor/Aprovar.tsx`
    (Ana 2, Caio em branco, Daniela 5, Nicolas 9, Felipe 9). Ninguém das "outras" tirou 10: todos erraram a questão 7
    marcando c, como o Lucas; com a Ana, a Daniela e o Nicolas, são os 24 que marcaram c na 7. */
export const ACERTOS_PROVA_MOL_2B: Record<string, number> = {
  'Ana Beatriz': 2, 'Caio Mendes': 0, 'Daniela Rocha': 5, 'Nicolas Dias': 9, 'Felipe Nunes': 9,
  'Arthur Lopes': 8, 'Beatriz Nogueira': 6, 'Bruno Tavares': 7, 'Camila Duarte': 7, 'Davi Lucca': 5, 'Eduarda Lima': 8,
  'Gabriela Reis': 6, 'Heitor Alves': 4, 'Isabela Pinto': 8, 'João Vitor': 7, 'Larissa Melo': 6, 'Lucas Pereira': 7,
  'Marina Costa': 9, 'Olívia Ramos': 7, 'Pedro Henrique': 6, 'Rafael Moura': 8, 'Sofia Martins': 9, 'Thiago Barros': 5,
  'Valentina Cruz': 7, 'Vitor Hugo': 6, 'Yasmin Farias': 8,
}

/** As outras 21: em ordem alfabética, nunca por nota. O Lucas Pereira tem 7 de 10. */
export const OUTRAS_PROVA_2B = Object.keys(ACERTOS_PROVA_MOL_2B).filter((n) => !DESTAQUES_PROVA_2B.some((d) => d.quem === n))
  .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  .map((nome) => ({ nome, acertos: ACERTOS_PROVA_MOL_2B[nome] }))

/** As respostas do Lucas na prova de 18/09: errou a 3, a 5 e a 7 (marcou c, como 23 colegas). 7 de 10. */
export const RESPOSTAS_LUCAS_PROVA_MOL: Record<number, string> = { 0: 'C', 1: 'B', 2: 'B', 3: 'B', 4: 'A', 5: 'A', 6: 'C', 7: 'D', 8: 'A', 9: 'B' }

const LOTE_PROVA_2B: Lote = {
  id: 'prova-2b', tarefaId: 'prova-mol', turmaId: '2b', turma: '2ºB', materia: 'Química',
  titulo: 'Prova de mol e massa molar', tipo: 'prova', data: '18/09', questoes: 10, gabarito: PROVA_MOL.gabarito,
  destaques: DESTAQUES_PROVA_2B, vistos: [], outras: OUTRAS_PROVA_2B, entregas: [], tirados: [], estado: 'espera',
  recado: 'Você acertou X de 10. Revise as questões que errou com a página indicada em cada uma.',
}

export const fatiaLotes = criarFatia<Record<string, Lote>>('lotes', { 'prova-2b': LOTE_PROVA_2B })

/** O lote de uma tarefa ("prova-mol" → "prova-2b"; as entregas da demonstração → "lote-<tarefa>"). */
export const loteDaTarefa = (tarefaId: string) => (tarefaId === 'prova-mol' ? 'prova-2b' : `lote-${tarefaId}`)
