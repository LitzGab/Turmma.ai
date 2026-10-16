import { calcular, type Celula, type Consulta, type Mes, type MetricaId, type Vocabulario } from './consulta'
import { ESCOLAS_ESTATICAS_DA_OPERACAO, USO_DE_AGOSTO, USO_DE_SETEMBRO } from './rede'
import { TURMAS_DA_ESCOLA } from './estrutura'
import { HABILIDADES } from './escola'

/* OS NÚMEROS DO COLÉGIO AURORA, UMA FONTE SÓ (13ª rodada, 04/10/2026; plano de painéis e introdução, seção 1.5).

   O painel da coordenação, o Analista em conversa, a introdução e o relatório leem daqui. Ninguém digita número
   solto na tela. Os que já existiam continuam iguais (as origens estão ao lado de cada um); os marcados (novo)
   nascem aqui, coerentes com os de antes.
   Contas fixas: porcentagem = round(a ÷ b × 100); por aluno = custo ÷ alunos COM ACESSO; projeção = round(% × 30 ÷ 21)
   (hoje é 21/09); grupo com menos de 5 pessoas aparece como "menos de 5".
   Tudo agregado, fora os dois recortes "só com motivo" (QUIMICA_2_ABAIXO e NOMES_1C), que só abrem com o motivo
   e o registro na auditoria (D34). 100% sintético (D71). */

/* ── Contas ────────────────────────────────────────────────────────────────────────────────────────────── */

/** Porcentagem inteira. */
export const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0)

/** Custo por aluno com acesso, em reais (sem arredondar: `reais` arredonda ao escrever). */
export const porAluno = (custo: number, alunos: number) => (alunos > 0 ? custo / alunos : 0)

/** Dia do mês de hoje na demonstração e dias do mês. */
export const DIA_DE_HOJE = 21
export const DIAS_DO_MES = 30

/** A projeção do mês: round(% × 30 ÷ 21). Com dois números, a % é a exata (custo ÷ teto), sem arredondar antes. */
export function projecaoDoMes(usadoOuCusto: number, teto?: number): number {
  const p = teto === undefined ? usadoOuCusto : teto > 0 ? (usadoOuCusto / teto) * 100 : 0
  return Math.round((p * DIAS_DO_MES) / DIA_DE_HOJE)
}

/** "R$ 1.486,40" */
export const reais = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** "3.412" */
export const inteiro = (n: number) => n.toLocaleString('pt-BR')

/** "6,8" */
export const decimal = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Grupo pequeno não aparece sozinho: n < 5 vira "menos de 5". */
export const celula = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : n < 5 ? 'menos de 5' : inteiro(n))

/* ── O período e a escola ──────────────────────────────────────────────────────────────────────────────── */

export const PERIODO = {
  mes: 'setembro',
  ano: 2026,
  de: '01/09',
  ate: '21/09',
  /** "01 a 21/09" */
  curto: '01 a 21/09',
  /** "Setembro · até 21/09" */
  linha: 'Setembro · até 21/09',
  /** "Setembro de 2026 · até 21/09 · dados do Turmma" */
  rodape: 'Setembro de 2026 · até 21/09 · dados do Turmma',
} as const

const DA_OPERACAO = ESCOLAS_ESTATICAS_DA_OPERACAO.find((e) => e.id === 'aurora')!

export const ESCOLA = {
  id: 'aurora',
  nome: DA_OPERACAO.nome,
  /** alunos com acesso */
  alunos: DA_OPERACAO.alunos,
  turmas: DA_OPERACAO.turmas,
  professores: DA_OPERACAO.professores,
} as const

/* ── Uso ───────────────────────────────────────────────────────────────────────────────────────────────── */

export const ALUNOS_QUE_USARAM = {
  setembro: USO_DE_SETEMBRO.aurora.alunosAtivos,
  agosto: USO_DE_AGOSTO.aurora.alunosAtivos,
  comAcesso: ESCOLA.alunos,
  /** 96 */
  pct: pct(USO_DE_SETEMBRO.aurora.alunosAtivos, ESCOLA.alunos),
  /** 93 */
  pctAgosto: pct(USO_DE_AGOSTO.aurora.alunosAtivos, ESCOLA.alunos),
} as const

/** Os materiais da IA no mês: a soma do "gerado" por série (41 + 38 + 52 + 63 + 71 + 112 + 35 = 412). */
export const MES = { gerou: 412, aprovadas: 389, esperam: 23 } as const
/** Agosto (novo). */
export const MES_AGOSTO = { gerou: 368, aprovadas: 344 } as const

/** Acerto nas objetivas, na escola toda. */
export const ACERTO = { setembro: 64, agosto: 65 } as const

/* ── Acerto por série ──────────────────────────────────────────────────────────────────────────────────── */

export type SerieDaEscola = {
  serie: string
  /** "6º", "1º EM" */
  curto: string
  /** null: fica de fora (um professor só) */
  acerto: number | null
  /** agosto (novo) */
  agosto: number | null
  turmas: number
  professores: number
  /** materiais da IA gerados para a série no mês */
  gerado: number
}

const turmasDa = (serie: string) => TURMAS_DA_ESCOLA.filter((t) => t.serie === serie).length

/** Os mesmos valores de POR_SERIE em coordenacao/Governanca.tsx; as turmas vêm de TURMAS_DA_ESCOLA. */
export const ACERTO_POR_SERIE: SerieDaEscola[] = [
  { serie: '6º ano EF', curto: '6º', acerto: 72, agosto: 72, turmas: turmasDa('6º ano EF'), professores: 4, gerado: 41 },
  { serie: '7º ano EF', curto: '7º', acerto: 69, agosto: 70, turmas: turmasDa('7º ano EF'), professores: 4, gerado: 38 },
  { serie: '8º ano EF', curto: '8º', acerto: 66, agosto: 62, turmas: turmasDa('8º ano EF'), professores: 5, gerado: 52 },
  { serie: '9º ano EF', curto: '9º', acerto: 63, agosto: 64, turmas: turmasDa('9º ano EF'), professores: 5, gerado: 63 },
  { serie: '1º ano EM', curto: '1º EM', acerto: 61, agosto: 62, turmas: turmasDa('1º ano EM'), professores: 6, gerado: 71 },
  { serie: '2º ano EM', curto: '2º EM', acerto: 58, agosto: 61, turmas: turmasDa('2º ano EM'), professores: 5, gerado: 112 },
  { serie: '3º ano EM', curto: '3º EM', acerto: null, agosto: null, turmas: turmasDa('3º ano EM'), professores: 1, gerado: 35 },
]

/** As turmas com recorte aberto (as séries com mais de um professor): 20. */
export const TURMAS_COM_ACERTO = ACERTO_POR_SERIE.filter((s) => s.acerto !== null).reduce((n, s) => n + s.turmas, 0)

/* ── Química ───────────────────────────────────────────────────────────────────────────────────────────── */

/** Média das notas de Química (0 a 10), por série. O 1º EM é novo; o 2º EM é a média das 4 turmas do alerta a1. */
export const QUIMICA_POR_SERIE: { serie: string; curto: string; media: number | null; agosto: number | null; turmas: number; professores: number }[] = [
  { serie: '1º ano EM', curto: '1º EM', media: 6.8, agosto: 6.7, turmas: 4, professores: 2 },
  { serie: '2º ano EM', curto: '2º EM', media: 5.4, agosto: 6.2, turmas: 4, professores: 2 },
  { serie: '3º ano EM', curto: '3º EM', media: null, agosto: null, turmas: 2, professores: 1 },
]

/** Química do 2º ano por turma: a base interna da conta do Analista (somaNotas nas células). NÃO vai à tela: o que
    aparece é QUIMICA_2_ABAIXO, em contagem de alunos (regra dos painéis de gestão: nenhuma média). */
const QUIMICA_2_NOTAS_INTERNAS = {
  linhas: [
    { turma: '2ºA', agosto: 6.2, setembro: 5.5 },
    { turma: '2ºB', agosto: 6.4, setembro: 5.5 },
    { turma: '2ºC', agosto: 6.1, setembro: 5.3 },
    { turma: '2ºD', agosto: 6.0, setembro: 5.2 },
  ],
} as const

/** Química do 2º ano EM: alunos abaixo de 6,0 (a média mínima da rede, o limiar do regimento) no 3º trimestre × no
    2º, por turma. É o alerta a1. Por turma, SÓ COM MOTIVO (cada turma tem um professor só); sem nome de professor.
    Totais: antes 5 · entraram 19 · saíram 2 · agora 22 (de 126). O 2ºB inclui Caio Mendes e Heitor Alves. */
export const QUIMICA_2_ABAIXO = {
  titulo: 'Alunos abaixo de 6,0 em Química, por turma · 2º tri → 3º tri',
  limiar: 'Abaixo de 6,0, a média mínima da rede',
  alunos: 126,
  linhas: [
    { turma: '2ºA', alunos: 30, antes: 1, entraram: 5, sairam: 1, agora: 5 },
    { turma: '2ºB', alunos: 32, antes: 2, entraram: 5, sairam: 1, agora: 6 },
    { turma: '2ºC', alunos: 33, antes: 1, entraram: 5, sairam: 0, agora: 6 },
    { turma: '2ºD', alunos: 31, antes: 1, entraram: 4, sairam: 0, agora: 5 },
  ],
} as const
/** 19 entraram · 22 agora · 5 antes */
export const QUIMICA_2_TOTAL = {
  entraram: QUIMICA_2_ABAIXO.linhas.reduce((n, l) => n + l.entraram, 0),
  agora: QUIMICA_2_ABAIXO.linhas.reduce((n, l) => n + l.agora, 0),
  antes: QUIMICA_2_ABAIXO.linhas.reduce((n, l) => n + l.antes, 0),
}

const habilidade = (codigo: string) => HABILIDADES.find((h) => h.codigo === codigo)!.acerto

/** As habilidades de Química do 2º ano EM (a série inteira: 4 turmas, 126 alunos), do menor acerto para o maior. */
export const HABILIDADES_2EM = {
  alunos: 126,
  turmas: 4,
  itens: [
    { codigo: 'EM13CNT301', nome: 'Reagente limitante', acerto: habilidade('EM13CNT301'), agosto: 52 as number | null },
    { codigo: 'EM13CNT104', nome: 'Cálculo com mol', acerto: habilidade('EM13CNT104'), agosto: 51 as number | null },
    { codigo: 'EM13CNT302', nome: 'Rendimento de reação', acerto: habilidade('EM13CNT302'), agosto: null as number | null },
    { codigo: 'EM13CNT205', nome: 'Interpretar equação balanceada', acerto: habilidade('EM13CNT205'), agosto: null as number | null },
    { codigo: 'EM13CNT101', nome: 'Conservação da massa', acerto: habilidade('EM13CNT101'), agosto: null as number | null },
  ],
}

/* ── Entregas ──────────────────────────────────────────────────────────────────────────────────────────── */

/** Alunos com 3 ou mais entregas faltando, por turma (o 2ºA e o 2ºB são novos). Na tela: `celula(n)`, sem total. */
export const ENTREGAS_ATRASADAS = [
  { turma: '1ºC', turmaId: '1c', n: 5 },
  { turma: '2ºA', turmaId: '2a', n: 4 },
  { turma: '2ºB', turmaId: '2b', n: 2 },
] as const

/** Os 5 do 1ºC: SÓ COM MOTIVO. O mesmo `comNome` do alerta a2. Só o nome e quantas faltam. */
export const NOMES_1C = {
  titulo: 'Os 5 alunos do 1ºC com três entregas faltando',
  linhas: [
    { nome: 'Ana Beatriz Costa', faltam: 3 },
    { nome: 'Caio Mendes', faltam: 3 },
    { nome: 'Gabriela Nunes', faltam: 3 },
    { nome: 'João Pedro Lima', faltam: 4 },
    { nome: 'Rafaela Souto', faltam: 3 },
  ],
} as const

/* ── O pacote de IA do mês ─────────────────────────────────────────────────────────────────────────────── */

const SET = USO_DE_SETEMBRO.aurora
const AGO = USO_DE_AGOSTO.aurora

export const PACOTE = {
  custo: SET.custoIA,
  teto: SET.tetoIA,
  /** 49 */
  usado: pct(SET.custoIA, SET.tetoIA),
  /** 2,43 */
  porAluno: porAluno(SET.custoIA, ESCOLA.alunos),
  /** 69 */
  projecao: projecaoDoMes(SET.custoIA, SET.tetoIA),
  agosto: {
    custo: AGO.custoIA,
    /** 45 */
    usado: pct(AGO.custoIA, AGO.tetoIA),
    /** 2,27 */
    porAluno: porAluno(AGO.custoIA, ESCOLA.alunos),
  },
} as const

/** O que usa a IA, por função (novo). Nunca por professor. */
export const PACOTE_POR_FUNCAO = [
  { rotulo: 'Tutor dos alunos', valor: 62 },
  { rotulo: 'Materiais dos professores', valor: 31 },
  { rotulo: 'Correções', valor: 7 },
] as const

/* ══ 14ª RODADA (05/10/2026; plano ux-composicao, 4.2, 4.5 e 4.6): AS CÉLULAS DO PAINEL E DO ANALISTA ══════════

   O Painel e o Analista leem a MESMA fonte: as células abaixo, pelo motor (dados/consulta.ts). Nenhuma linha de
   aluno: cada célula é turma × disciplina com prova objetiva × mês, já agregada. As contas fecham com as constantes
   de cima (conferirNumerosEscola confere em desenvolvimento):
   · alunos COM ACESSO por turma (somam os 612; a lista de nomes de cada turma é maior no 6º e no 7º, que esperam a
     autorização das famílias, e o 3ºA ainda não mandou a lista); usaram 588 em setembro e 571 em agosto, e em cada
     turma nunca mais do que os que entraram na lista dela (o 1ºC: 28 de 34; o 2ºB: 26 de 32);
   · acerto 64% (agosto 65%); cada série igual a ACERTO_POR_SERIE; o 3º EM fica de fora (um professor só): as células
     dele não têm resposta, nota nem entrega, e quem calcula desempenho tira a série (`semTerceiroEM`);
   · Química: a média de QUIMICA_POR_SERIE e, no 2º EM, a de cada turma de QUIMICA_2_NOTAS_INTERNAS (base interna, não vai à tela);
   · alunos com 3 ou mais entregas faltando: 1ºC 5, 2ºA 4, 2ºB 2 (ENTREGAS_ATRASADAS), 11 na escola;
   · materiais da IA: o "gerado" de cada série (412, 389 aprovados); conversas com o Tutor: as trocas de USO_DE_SETEMBRO. */

export type SerieId = '6' | '7' | '8' | '9' | '1em' | '2em' | '3em'
export type DisciplinaId = 'matematica' | 'portugues' | 'ciencias' | 'quimica' | 'fisica' | 'biologia'

/** As disciplinas com prova objetiva, na ordem de sempre. `curto` é o cabeçalho do mapa de calor. */
export const DISCIPLINAS_ESCOLA: { id: DisciplinaId; nome: string; curto: string }[] = [
  { id: 'matematica', nome: 'Matemática', curto: 'Mat' },
  { id: 'portugues', nome: 'Português', curto: 'Por' },
  { id: 'ciencias', nome: 'Ciências', curto: 'Ciê' },
  { id: 'quimica', nome: 'Química', curto: 'Quí' },
  { id: 'fisica', nome: 'Física', curto: 'Fís' },
  { id: 'biologia', nome: 'Biologia', curto: 'Bio' },
]
const D_EF: DisciplinaId[] = ['matematica', 'portugues', 'ciencias']
const D_EM: DisciplinaId[] = ['matematica', 'portugues', 'quimica', 'fisica', 'biologia']

/** As séries, do 6º ao 3º EM. `acerto` por disciplina: [agosto, setembro] (a média de cada série bate com ACERTO_POR_SERIE). */
export const SERIES_ESCOLA: { id: SerieId; nome: string; curto: string; disciplinas: DisciplinaId[]; foraDoDesempenho?: boolean }[] = [
  { id: '6', nome: '6º ano EF', curto: '6º', disciplinas: D_EF },
  { id: '7', nome: '7º ano EF', curto: '7º', disciplinas: D_EF },
  { id: '8', nome: '8º ano EF', curto: '8º', disciplinas: D_EF },
  { id: '9', nome: '9º ano EF', curto: '9º', disciplinas: D_EF },
  { id: '1em', nome: '1º ano EM', curto: '1º EM', disciplinas: D_EM },
  { id: '2em', nome: '2º ano EM', curto: '2º EM', disciplinas: D_EM },
  { id: '3em', nome: '3º ano EM', curto: '3º EM', disciplinas: D_EM, foraDoDesempenho: true },
]
export const serieDaEscola = (id: string) => SERIES_ESCOLA.find((s) => s.id === id)
const ID_DA_SERIE: Record<string, SerieId> = Object.fromEntries(SERIES_ESCOLA.map((s) => [s.nome, s.id]))

/** Acerto nas objetivas por série e disciplina: [agosto, setembro]. */
const ACERTO_SD: Record<Exclude<SerieId, '3em'>, Partial<Record<DisciplinaId, [number, number]>>> = {
  '6': { matematica: [71, 70], portugues: [72, 73], ciencias: [73, 73] },
  '7': { matematica: [68, 67], portugues: [71, 70], ciencias: [71, 70] },
  '8': { matematica: [60, 64], portugues: [64, 68], ciencias: [62, 66] },
  '9': { matematica: [61, 60], portugues: [66, 65], ciencias: [65, 64] },
  '1em': { matematica: [59, 58], portugues: [65, 64], quimica: [62, 61], fisica: [60, 59], biologia: [64, 63] },
  '2em': { matematica: [58, 57], portugues: [63, 62], quimica: [60, 54], fisica: [59, 56], biologia: [63, 61] },
}

/** Entregas no prazo por série (fração), antes do desconto das turmas com entregas faltando. */
const NO_PRAZO: Record<SerieId, [number, number]> = {
  '6': [0.93, 0.92], '7': [0.91, 0.9], '8': [0.9, 0.89], '9': [0.89, 0.88], '1em': [0.87, 0.85], '2em': [0.86, 0.84], '3em': [0, 0],
}

/** Os materiais da IA por série: [agosto, setembro], gerados e aprovados (somam MES e MES_AGOSTO). */
const MATERIAIS_SERIE: Record<SerieId, { gerou: [number, number]; aprovados: [number, number] }> = {
  '6': { gerou: [37, 41], aprovados: [35, 39] },
  '7': { gerou: [34, 38], aprovados: [32, 37] },
  '8': { gerou: [46, 52], aprovados: [43, 49] },
  '9': { gerou: [56, 63], aprovados: [52, 60] },
  '1em': { gerou: [63, 71], aprovados: [59, 67] },
  '2em': { gerou: [100, 112], aprovados: [93, 104] },
  '3em': { gerou: [32, 35], aprovados: [30, 33] },
}

/** Cada turma: alunos com acesso, os que usaram [agosto, setembro], os com 3 ou mais entregas faltando [agosto,
    setembro] e o desvio do acerto da turma em relação à série (em pontos). O desvio varia de série para série
    para que a ordem das turmas (A, B, C) nunca coincida com a ordem do acerto: a lista não pode ler como ranking. */
const TURMAS_CEL: { id: string; alunos: number; usaram: [number, number]; atrasados: [number, number]; desvio: number }[] = [
  { id: 'au-6a', alunos: 29, usaram: [28, 28], atrasados: [0, 0], desvio: 0 },
  { id: 'au-6b', alunos: 25, usaram: [24, 25], atrasados: [0, 0], desvio: 1 },
  { id: 'au-6c', alunos: 26, usaram: [24, 25], atrasados: [0, 0], desvio: -1 },
  { id: 'au-7a', alunos: 28, usaram: [26, 27], atrasados: [0, 0], desvio: -1 },
  { id: 'au-7b', alunos: 29, usaram: [28, 29], atrasados: [0, 0], desvio: 1 },
  { id: 'au-7c', alunos: 28, usaram: [27, 27], atrasados: [0, 0], desvio: 0 },
  { id: 'au-8a', alunos: 29, usaram: [28, 29], atrasados: [0, 0], desvio: 0 },
  { id: 'au-8b', alunos: 29, usaram: [28, 29], atrasados: [0, 0], desvio: 1 },
  { id: 'au-8c', alunos: 28, usaram: [28, 27], atrasados: [0, 0], desvio: -1 },
  { id: 'au-9a', alunos: 29, usaram: [28, 29], atrasados: [0, 0], desvio: 1 },
  { id: 'au-9b', alunos: 29, usaram: [28, 28], atrasados: [0, 0], desvio: -1 },
  { id: 'au-9c', alunos: 29, usaram: [28, 29], atrasados: [0, 0], desvio: 0 },
  { id: 'au-1a', alunos: 29, usaram: [27, 29], atrasados: [0, 0], desvio: 0 },
  { id: 'au-1b', alunos: 29, usaram: [28, 28], atrasados: [0, 0], desvio: 1 },
  { id: '1c', alunos: 34, usaram: [27, 28], atrasados: [3, 5], desvio: -1 },
  { id: 'au-1d', alunos: 28, usaram: [25, 26], atrasados: [0, 0], desvio: 0 },
  { id: '2a', alunos: 30, usaram: [28, 29], atrasados: [1, 4], desvio: -1 },
  { id: '2b', alunos: 32, usaram: [25, 26], atrasados: [2, 2], desvio: 1 },
  { id: 'au-2c', alunos: 33, usaram: [31, 32], atrasados: [0, 0], desvio: 1 },
  { id: 'au-2d', alunos: 31, usaram: [29, 31], atrasados: [0, 0], desvio: -1 },
  { id: 'au-3a', alunos: 0, usaram: [0, 0], atrasados: [0, 0], desvio: 0 },
  { id: 'au-3b', alunos: 28, usaram: [26, 27], atrasados: [0, 0], desvio: 0 },
]

/** Respostas objetivas por aluno que usou, em cada disciplina: [agosto inteiro, setembro até 21/09]. */
const RESPOSTAS_POR_ALUNO = { ef: [20, 14], em: [8, 8] } as const
/** Tarefas esperadas por aluno com acesso, em cada disciplina: [agosto, setembro]. */
const TAREFAS_POR_ALUNO = [3, 2] as const

const MESES: Mes[] = ['agosto', 'setembro']
const um = (n: number) => Math.round(n * 10) / 10

/** Distribui `total` em `partes` inteiras (as primeiras levam o resto). */
const repartir = (total: number, partes: number) => Array.from({ length: partes }, (_, i) => Math.floor(total / partes) + (i < total % partes ? 1 : 0))

function montarCelulas(): Celula[] {
  const cel: Celula[] = []
  const conversas = { agosto: USO_DE_AGOSTO.aurora.trocasTutor, setembro: USO_DE_SETEMBRO.aurora.trocasTutor }
  const usaramMes = { agosto: ALUNOS_QUE_USARAM.agosto, setembro: ALUNOS_QUE_USARAM.setembro }
  MESES.forEach((mes, m) => {
    SERIES_ESCOLA.forEach((s) => {
      const turmas = TURMAS_DA_ESCOLA.filter((t) => ID_DA_SERIE[t.serie] === s.id)
      // os materiais da série, repartidos pelas células (turma × disciplina) das turmas com alunos
      const comAlunos = turmas.filter((t) => (TURMAS_CEL.find((x) => x.id === t.id)?.alunos ?? 0) > 0)
      const nCel = comAlunos.length * s.disciplinas.length
      const gerou = repartir(MATERIAIS_SERIE[s.id].gerou[m], nCel)
      const aprov = repartir(MATERIAIS_SERIE[s.id].aprovados[m], nCel)
      let k = 0
      turmas.forEach((t) => {
        const tc = TURMAS_CEL.find((x) => x.id === t.id)!
        const usaram = tc.usaram[m]
        const atrasados = tc.atrasados[m]
        s.disciplinas.forEach((d) => {
          const fora = !!s.foraDoDesempenho || tc.alunos === 0
          const base = fora ? 0 : ACERTO_SD[s.id as Exclude<SerieId, '3em'>][d]![m]
          const acerto = base + tc.desvio
          const respostas = fora ? 0 : usaram * RESPOSTAS_POR_ALUNO[s.id.endsWith('em') ? 'em' : 'ef'][m]
          // a média das notas: Química do 1º e do 2º EM vem das constantes; o resto acompanha o acerto
          const q2 = QUIMICA_2_NOTAS_INTERNAS.linhas.find((l) => l.turma === t.nome)
          const media = fora ? 0
            : d === 'quimica' && s.id === '2em' && q2 ? (m === 0 ? q2.agosto : q2.setembro)
              : d === 'quimica' && s.id === '1em' ? (m === 0 ? QUIMICA_POR_SERIE[0].agosto! : QUIMICA_POR_SERIE[0].media!)
                : um(acerto / 10 + 0.3)
          const esperadas = fora ? 0 : tc.alunos * TAREFAS_POR_ALUNO[m]
          const noPrazo = NO_PRAZO[s.id][m] - atrasados * 0.012
          const doMaterial = tc.alunos > 0 ? k++ : -1
          cel.push({
            escola: ESCOLA.id, serie: s.id, turma: t.id, disciplina: d, mes,
            alunos: tc.alunos, usaram, atrasados,
            conversas: Math.round((conversas[mes] * usaram) / usaramMes[mes] / s.disciplinas.length),
            respostas, acertos: Math.round((respostas * acerto) / 100),
            somaNotas: um(media * (fora ? 0 : usaram)), notas: fora ? 0 : usaram,
            abaixo50: fora ? 0 : Math.round(tc.alunos * Math.min(0.5, Math.max(0.03, (62 - acerto) / 100 + 0.08))),
            entregues: Math.round(esperadas * noPrazo), esperadas,
            materiais: doMaterial >= 0 ? gerou[doMaterial] : 0, aprovados: doMaterial >= 0 ? aprov[doMaterial] : 0,
          })
        })
      })
    })
    // as conversas fecham na soma exata do mês (o arredondamento vai para a última célula com alunos)
    const doMes = cel.filter((c) => c.mes === mes && c.usaram > 0)
    const falta = conversas[mes] - doMes.reduce((a, c) => a + c.conversas, 0)
    doMes[doMes.length - 1].conversas += falta
  })
  return cel
}

/** As células do Colégio Aurora: 22 turmas × as disciplinas com objetiva × agosto e setembro. */
export const CELULAS_ESCOLA: Celula[] = montarCelulas()

/** As células sem o 3º EM, para as contas de desempenho (acerto, média, abaixo de 50%, entregas): ele tem um professor só. */
export const semTerceiroEM = (celulas: Celula[] = CELULAS_ESCOLA) => celulas.filter((c) => c.serie !== '3em')
/** As métricas em que o 3º EM fica de fora. */
export const METRICAS_DE_DESEMPENHO: MetricaId[] = ['acerto', 'media', 'abaixo50', 'entregas']

/* ── O vocabulário do Analista (a ordem é a ordem natural: 6º → 3º EM, 6ºA → 3ºB) ─────────────────────────── */

/** "9º" sozinho é a série, mas "9º A" é a turma. */
const serieRe = (n: string, extenso: string) =>
  new RegExp(`\\b${n}o?\\s*(ano|serie)s?\\b|\\b${extenso}\\b|\\b${n}o\\b(?!\\s?[a-d]\\b)`)
const serieEmRe = (n: string, extenso: string) =>
  new RegExp(`\\b${n}o?\\s*(ano|serie)?\\s*(do )?(em|medio|ensino medio)\\b|\\b${n}o?\\s*(ano|serie)\\b|${extenso} ano|${extenso} do medio|\\b${n}o\\b(?!\\s?[a-d]\\b)`)

export const VOCABULARIO_ESCOLA: Vocabulario = {
  escola: [{ id: ESCOLA.id, nome: ESCOLA.nome, apelidos: /aurora|colegio/, de: `no ${ESCOLA.nome}` }],
  serie: [
    { id: '6', nome: '6º ano', apelidos: serieRe('6', 'sexto'), de: 'do 6º ano' },
    { id: '7', nome: '7º ano', apelidos: serieRe('7', 'setimo'), de: 'do 7º ano' },
    { id: '8', nome: '8º ano', apelidos: serieRe('8', 'oitavo'), de: 'do 8º ano' },
    { id: '9', nome: '9º ano', apelidos: serieRe('9', 'nono'), de: 'do 9º ano' },
    { id: '1em', nome: '1º ano EM', apelidos: serieEmRe('1', 'primeiro'), de: 'do 1º ano EM' },
    { id: '2em', nome: '2º ano EM', apelidos: serieEmRe('2', 'segundo'), de: 'do 2º ano EM' },
    { id: '3em', nome: '3º ano EM', apelidos: serieEmRe('3', 'terceiro'), de: 'do 3º ano EM' },
  ],
  turma: TURMAS_DA_ESCOLA.map((t) => {
    const [n, l] = [t.nome[0], t.nome.slice(-1).toLowerCase()]
    return { id: t.id, nome: t.nome, apelidos: new RegExp(`\\b${n}o?\\s?${l}\\b`), de: `do ${t.nome}` }
  }),
  disciplina: [
    { id: 'matematica', nome: 'Matemática', apelidos: /matematica|\bmat\b/, de: 'em Matemática' },
    { id: 'portugues', nome: 'Português', apelidos: /portugues|lingua portuguesa/, de: 'em Português' },
    { id: 'ciencias', nome: 'Ciências', apelidos: /ciencia/, de: 'em Ciências' },
    { id: 'quimica', nome: 'Química', apelidos: /quimica/, de: 'em Química' },
    { id: 'fisica', nome: 'Física', apelidos: /fisica/, de: 'em Física' },
    { id: 'biologia', nome: 'Biologia', apelidos: /biologia|\bbio\b/, de: 'em Biologia' },
  ],
}

/* ── As 8 semanas de cada número do Painel (27/07 a 20/09: 5 de agosto, 3 de setembro) ───────────────────── */

export const SEMANAS_ESCOLA = {
  rotulos: ['27/07', '03/08', '10/08', '17/08', '24/08', '31/08', '07/09', '14/09'],
  mes: ['agosto', 'agosto', 'agosto', 'agosto', 'agosto', 'setembro', 'setembro', 'setembro'] as Mes[],
  /** acerto e entregas: pontos a somar ao número do mês */
  acerto: [1, 0, -1, 1, -1, 1, 0, -1],
  entregas: [-1, 1, 0, 1, -1, 0, 1, -1],
  /** alunos que usaram: a parte dos que usaram no mês que usou em cada semana */
  uso: [0.8, 0.86, 0.88, 0.9, 0.89, 0.9, 0.92, 0.94],
  /** materiais: a parte do mês feita em cada semana (cada mês soma 1) */
  materiais: [0.12, 0.22, 0.23, 0.22, 0.21, 0.31, 0.34, 0.35],
  /** pacote de IA: % do pacote do mês gasto em cada semana (agosto soma 45; setembro, 49) */
  pacote: [3, 10, 11, 11, 10, 15, 16, 18],
} as const

export type NumeroDoPainel = 'uso' | 'acerto' | 'entregas' | 'materiais' | 'pacote'

/** As 8 semanas de um número, a partir do valor de cada mês (no recorte do filtro). Uso em %, materiais em conta. */
export function semanasDe(n: NumeroDoPainel, agosto: number | null, setembro: number | null): (number | null)[] {
  return SEMANAS_ESCOLA.rotulos.map((_, i) => {
    const v = SEMANAS_ESCOLA.mes[i] === 'agosto' ? agosto : setembro
    if (n === 'pacote') return SEMANAS_ESCOLA.pacote[i]
    if (v === null) return null
    if (n === 'acerto') return v + SEMANAS_ESCOLA.acerto[i]
    if (n === 'entregas') return Math.min(100, v + SEMANAS_ESCOLA.entregas[i])
    if (n === 'uso') return Math.round(v * SEMANAS_ESCOLA.uso[i])
    return Math.round(v * SEMANAS_ESCOLA.materiais[i])
  })
}

/* ── As habilidades, por série e disciplina (as do 2º EM em Química são as de HABILIDADES_2EM) ───────────── */

export type HabilidadeDaEscola = { serie: SerieId; disciplina: DisciplinaId; codigo: string; nome: string; acerto: number; agosto: number | null }

export const HABILIDADES_ESCOLA: HabilidadeDaEscola[] = [
  { serie: '6', disciplina: 'matematica', codigo: 'EF06MA07', nome: 'Frações equivalentes', acerto: 58, agosto: 60 },
  { serie: '6', disciplina: 'matematica', codigo: 'EF06MA13', nome: 'Porcentagem', acerto: 61, agosto: 63 },
  { serie: '6', disciplina: 'portugues', codigo: 'EF06LP05', nome: 'Inferência em texto', acerto: 63, agosto: 62 },
  { serie: '6', disciplina: 'portugues', codigo: 'EF67LP08', nome: 'Efeitos de sentido', acerto: 66, agosto: 65 },
  { serie: '6', disciplina: 'ciencias', codigo: 'EF06CI01', nome: 'Misturas', acerto: 64, agosto: 66 },
  { serie: '6', disciplina: 'ciencias', codigo: 'EF06CI07', nome: 'Sistema nervoso', acerto: 67, agosto: null },
  { serie: '7', disciplina: 'matematica', codigo: 'EF07MA04', nome: 'Números inteiros', acerto: 55, agosto: 57 },
  { serie: '7', disciplina: 'matematica', codigo: 'EF07MA18', nome: 'Equações do 1º grau', acerto: 56, agosto: null },
  { serie: '7', disciplina: 'portugues', codigo: 'EF07LP09', nome: 'Concordância', acerto: 62, agosto: 63 },
  { serie: '7', disciplina: 'portugues', codigo: 'EF67LP28', nome: 'Gêneros textuais', acerto: 65, agosto: 66 },
  { serie: '7', disciplina: 'ciencias', codigo: 'EF07CI01', nome: 'Máquinas simples', acerto: 61, agosto: 62 },
  { serie: '7', disciplina: 'ciencias', codigo: 'EF07CI08', nome: 'Ecossistemas', acerto: 64, agosto: null },
  { serie: '8', disciplina: 'matematica', codigo: 'EF08MA06', nome: 'Expressões algébricas', acerto: 51, agosto: 47 },
  { serie: '8', disciplina: 'matematica', codigo: 'EF08MA08', nome: 'Sistemas de equações', acerto: 54, agosto: 50 },
  { serie: '8', disciplina: 'portugues', codigo: 'EF08LP04', nome: 'Regência', acerto: 58, agosto: 55 },
  { serie: '8', disciplina: 'portugues', codigo: 'EF89LP03', nome: 'Argumentação', acerto: 62, agosto: 58 },
  { serie: '8', disciplina: 'ciencias', codigo: 'EF08CI04', nome: 'Energia elétrica', acerto: 57, agosto: 54 },
  { serie: '8', disciplina: 'ciencias', codigo: 'EF08CI08', nome: 'Reprodução', acerto: 63, agosto: null },
  { serie: '9', disciplina: 'matematica', codigo: 'EF09MA09', nome: 'Equação do 2º grau', acerto: 48, agosto: 50 },
  { serie: '9', disciplina: 'matematica', codigo: 'EF09MA06', nome: 'Funções', acerto: 52, agosto: 53 },
  { serie: '9', disciplina: 'portugues', codigo: 'EF09LP08', nome: 'Orações subordinadas', acerto: 56, agosto: 57 },
  { serie: '9', disciplina: 'portugues', codigo: 'EF89LP04', nome: 'Tese e argumentos', acerto: 61, agosto: null },
  { serie: '9', disciplina: 'ciencias', codigo: 'EF09CI02', nome: 'Reações químicas', acerto: 55, agosto: 56 },
  { serie: '9', disciplina: 'ciencias', codigo: 'EF09CI08', nome: 'Hereditariedade', acerto: 58, agosto: null },
  { serie: '1em', disciplina: 'matematica', codigo: 'EM13MAT302', nome: 'Função quadrática', acerto: 49, agosto: 51 },
  { serie: '1em', disciplina: 'matematica', codigo: 'EM13MAT103', nome: 'Unidades de medida', acerto: 54, agosto: null },
  { serie: '1em', disciplina: 'portugues', codigo: 'EM13LP06', nome: 'Efeitos de sentido', acerto: 58, agosto: 59 },
  { serie: '1em', disciplina: 'portugues', codigo: 'EM13LP15', nome: 'Texto argumentativo', acerto: 60, agosto: null },
  { serie: '1em', disciplina: 'quimica', codigo: 'EM13CNT307', nome: 'Ligações químicas', acerto: 53, agosto: 54 },
  { serie: '1em', disciplina: 'quimica', codigo: 'EM13CNT201', nome: 'Modelos atômicos', acerto: 57, agosto: 58 },
  { serie: '1em', disciplina: 'fisica', codigo: 'EM13CNT204', nome: 'Cinemática', acerto: 52, agosto: 53 },
  { serie: '1em', disciplina: 'fisica', codigo: 'EM13CNT306', nome: 'Energia mecânica', acerto: 55, agosto: null },
  { serie: '1em', disciplina: 'biologia', codigo: 'EM13CNT202', nome: 'Ecologia', acerto: 60, agosto: 61 },
  { serie: '1em', disciplina: 'biologia', codigo: 'EM13CNT208', nome: 'Evolução', acerto: 58, agosto: null },
  { serie: '2em', disciplina: 'matematica', codigo: 'EM13MAT305', nome: 'Logaritmos', acerto: 50, agosto: 51 },
  { serie: '2em', disciplina: 'matematica', codigo: 'EM13MAT508', nome: 'Progressões', acerto: 53, agosto: null },
  { serie: '2em', disciplina: 'portugues', codigo: 'EM13LP02', nome: 'Coesão textual', acerto: 57, agosto: 58 },
  { serie: '2em', disciplina: 'portugues', codigo: 'EM13LP46', nome: 'Literatura', acerto: 59, agosto: null },
  ...HABILIDADES_2EM.itens.map((h) => ({ serie: '2em' as const, disciplina: 'quimica' as const, codigo: h.codigo, nome: h.nome, acerto: h.acerto, agosto: h.agosto })),
  { serie: '2em', disciplina: 'fisica', codigo: 'EM13CNT102', nome: 'Termodinâmica', acerto: 49, agosto: 52 },
  { serie: '2em', disciplina: 'fisica', codigo: 'EM13CNT103', nome: 'Calorimetria', acerto: 52, agosto: null },
  { serie: '2em', disciplina: 'biologia', codigo: 'EM13CNT305', nome: 'Genética', acerto: 55, agosto: 57 },
  { serie: '2em', disciplina: 'biologia', codigo: 'EM13CNT207', nome: 'Fisiologia', acerto: 58, agosto: null },
]

/** As habilidades de menor acerto no recorte (só aqui se ordena por valor: é conteúdo, não gente nem turma). */
export function ondeMaisErram(f: { serie?: string | null; disciplina?: string | null; mes?: Mes }, n = 5): (HabilidadeDaEscola & { valor: number })[] {
  return HABILIDADES_ESCOLA
    .filter((h) => (!f.serie || h.serie === f.serie) && (!f.disciplina || h.disciplina === f.disciplina))
    .map((h) => ({ ...h, valor: f.mes === 'agosto' ? h.agosto : h.acerto }))
    .filter((h): h is HabilidadeDaEscola & { valor: number } => h.valor !== null)
    .sort((a, b) => a.valor - b.valor)
    .slice(0, n)
}

/* ── Os números de hoje, pelo motor (o Painel sem filtro mostra estes) ──────────────────────────────────────── */

const conta = (metrica: MetricaId, mes: Mes, filtros: Consulta['filtros'] = {}) => {
  const cel = METRICAS_DE_DESEMPENHO.includes(metrica) ? semTerceiroEM() : CELULAS_ESCOLA
  return calcular(cel, { metrica, filtros, mes }, VOCABULARIO_ESCOLA)
}

/** Entregas no prazo, na escola (o 3º EM fica de fora). */
export const ENTREGAS_EM_DIA = { setembro: conta('entregas', 'setembro').valor ?? 0, agosto: conta('entregas', 'agosto').valor ?? 0 }
/** Alunos com 3 ou mais entregas faltando, na escola: 11. */
export const ALUNOS_COM_ENTREGAS_FALTANDO = conta('atrasados', 'setembro').valor ?? 0

/** Confere as contas das células com as constantes de hoje. Em desenvolvimento, roda ao carregar (console.assert). */
export function conferirNumerosEscola(): { conta: string; esperado: string; obtido: string; ok: boolean }[] {
  const l: { conta: string; esperado: string; obtido: string; ok: boolean }[] = []
  const ver = (nome: string, esperado: number | string | null, obtido: number | string | null | undefined) =>
    l.push({ conta: nome, esperado: String(esperado), obtido: String(obtido), ok: String(esperado) === String(obtido) })
  const uso = conta('uso', 'setembro')
  ver('alunos com acesso', ESCOLA.alunos, uso.alunos)
  ver('usaram em setembro', ALUNOS_QUE_USARAM.setembro, uso.extra?.usaram)
  ver('usaram em agosto', ALUNOS_QUE_USARAM.agosto, conta('uso', 'agosto').extra?.usaram)
  ver('turmas', ESCOLA.turmas, new Set(CELULAS_ESCOLA.map((c) => c.turma)).size)
  ver('acerto em setembro', ACERTO.setembro, conta('acerto', 'setembro').valor)
  ver('acerto em agosto', ACERTO.agosto, conta('acerto', 'agosto').valor)
  ACERTO_POR_SERIE.forEach((s) => {
    const id = ID_DA_SERIE[s.serie]
    if (s.acerto === null) { ver(`${s.curto} fica de fora`, 0, semTerceiroEM().filter((c) => c.serie === id).length); return }
    ver(`acerto ${s.curto}`, s.acerto, conta('acerto', 'setembro', { serie: [id] }).valor)
    ver(`acerto ${s.curto} agosto`, s.agosto, conta('acerto', 'agosto', { serie: [id] }).valor)
    ver(`turmas ${s.curto}`, s.turmas, conta('acerto', 'setembro', { serie: [id] }).turmas)
  })
  QUIMICA_POR_SERIE.forEach((q) => {
    const id = ID_DA_SERIE[q.serie]
    if (q.media === null) return
    ver(`química ${q.curto}`, decimal(q.media), decimal(conta('media', 'setembro', { serie: [id], disciplina: ['quimica'] }).valor ?? 0))
    ver(`química ${q.curto} agosto`, decimal(q.agosto!), decimal(conta('media', 'agosto', { serie: [id], disciplina: ['quimica'] }).valor ?? 0))
  })
  QUIMICA_2_ABAIXO.linhas.forEach((l) => ver(`química ${l.turma}: antes + entraram − saíram`, l.agora, l.antes + l.entraram - l.sairam))
  ver('química 2º EM: alunos', QUIMICA_2_ABAIXO.alunos, QUIMICA_2_ABAIXO.linhas.reduce((n, l) => n + l.alunos, 0))
  ver('alunos do 2º EM', HABILIDADES_2EM.alunos, conta('alunos', 'setembro', { serie: ['2em'] }).valor)
  ver('turmas do 2º EM', HABILIDADES_2EM.turmas, conta('alunos', 'setembro', { serie: ['2em'] }).turmas)
  ver('habilidades do 2º EM', HABILIDADES_2EM.itens.map((h) => h.codigo).join(','), ondeMaisErram({ serie: '2em', disciplina: 'quimica' }).map((h) => h.codigo).join(','))
  ENTREGAS_ATRASADAS.forEach((e) => ver(`atrasados ${e.turma}`, e.n, calcular(CELULAS_ESCOLA, { metrica: 'atrasados', filtros: { turma: [e.turmaId] }, mes: 'setembro' }, VOCABULARIO_ESCOLA, 1).valor))
  ver('atrasados na escola', ENTREGAS_ATRASADAS.reduce((a, e) => a + e.n, 0), ALUNOS_COM_ENTREGAS_FALTANDO)
  TURMAS_DA_ESCOLA.forEach((t) => {
    const n = CELULAS_ESCOLA.find((c) => c.turma === t.id)?.alunos ?? -1
    if (n > t.nomes) ver(`acesso ${t.nome} cabe na lista`, `<= ${t.nomes}`, n)
  })
  const mat = conta('materiais', 'setembro')
  ver('materiais', MES.gerou, mat.valor)
  ver('aprovados', MES.aprovadas, mat.extra?.aprovados)
  ver('materiais agosto', MES_AGOSTO.gerou, conta('materiais', 'agosto').valor)
  ver('conversas', USO_DE_SETEMBRO.aurora.trocasTutor, conta('conversas', 'setembro').valor)
  ver('9º ano por disciplina', '60,65,64', calcular(semTerceiroEM(), { metrica: 'acerto', filtros: { serie: ['9'] }, agrupar: 'disciplina', mes: 'setembro' }, VOCABULARIO_ESCOLA).grupos?.map((g) => g.valor).join(','))
  return l
}

if (import.meta.env.DEV) {
  for (const c of conferirNumerosEscola()) console.assert(c.ok, `numeros-escola: ${c.conta}: esperado ${c.esperado}, deu ${c.obtido}`)
}
