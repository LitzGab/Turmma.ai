import { alunosDa, type Aluno } from './alunos'
import { resumoDa } from './turmas-resumo'

/* O QUE AS ABAS Atividades, Notas, Frequência e Tutor da turma aberta dividem (20/09/2026, "Minhas turmas" no modelo
   da Teachy). 100% sintético (D71) e DERIVADO de `alunosDa()`, para as abas contarem a mesma história:
   · as atividades corrigidas são as quatro que já existem em `aluno.notas` (mesmos nomes, mesmas datas); a entrega é
     quem tem nota, e o acerto sai da média das notas;
   · as 16 aulas dadas são a grade do 2ºB (seg, ter, qui, sex) de 24/08 a 21/09, sem o feriado de 07/09. As datas de
     falta de `alunos.ts` saem dessa mesma lista em todas as turmas, então a chamada usa as mesmas 16 para todas;
   · do Tutor só existe CONTAGEM e dúvida de conteúdo: nada de tempo de uso, humor ou navegação (D57, D66).
     O total de alunos e de conversas vem de `turmas-resumo`, para a Visão geral e esta aba darem o mesmo número.
   · (oitava rodada, a aba "Uso de IA" no desenho da Teachy) entram a SÉRIE de conversas por dia, por assunto, e o
     HISTÓRICO: o que o aluno fez no Tutor (tirou dúvida de um assunto, pediu resposta pronta, revisou) e quando.
     Continua sendo fato registrado: nem duração, nem o texto da conversa, nem leitura de como o aluno estava.
   O "agora" é segunda, 21/09/2026, 10h42. */

export const comVirgula = (n: number, casas = 1) => n.toFixed(casas).replace('.', ',')

/** mulberry32, o mesmo sorteio repetível de `alunos.ts`: a tela não muda a cada recarga. */
function sorteio(semente: number) {
  let a = semente
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/* ── Atividades ──────────────────────────────────────────────────────────────────────────────────────────── */
export type TipoAtividade = 'prova' | 'lista' | 'atividade'
/** esperando = o Assistente corrigiu e a professora ainda não aprovou · corrigir = aplicada e sem correção */
export type EstadoAtividade = 'esperando' | 'aprovada' | 'corrigir' | 'aberta' | 'agendada' | 'rascunho'

export type AtividadeTurma = {
  id: string
  nome: string
  /** nome curto, para o cabeçalho de coluna do diário */
  curto: string
  tipo: TipoAtividade
  detalhe: string
  /** dd/mm, e o que a data quer dizer: "Aplicada", "Entregue", "Prazo", "Agendada", "Editado" */
  data: string
  rotuloData: string
  estado: EstadoAtividade
  selo: string
  /** índice em `aluno.notas`, quando a atividade já tem nota lançada */
  indiceNota: number | null
  entregas: { feitas: number; total: number } | null
  /** acerto médio em %, e a nota média de 0 a 10; null enquanto não há correção */
  acerto: number | null
  media: number | null
  habilidade: { nome: string; pagina: number } | null
  /** uma frase de fato sobre a situação da atividade */
  nota: string
  aprovadaEm?: string
  /** os alunos que a atividade ainda espera (ou que vão fazer), e como chamar a lista */
  quem: Aluno[]
  rotuloQuem: string
  acao: { rotulo: string; para: string }
}

const ABRIR = '/professor/biblioteca/prova-estequiometria'
const ordemDe = (data: string) => Number(data.slice(3)) * 100 + Number(data.slice(0, 2))

/* A nota não é só o acerto: soma o que a professora considera na atividade (ver `alunos.ts`). Descontando esses 11
   pontos, a prova do 2ºB dá os mesmos 64% de acerto que o Assistente relata no resto do mockup. */
const ACIMA_DO_ACERTO = 11

/* Na ordem de `aluno.notas`. */
const CORRIGIDAS: { curto: string; tipo: TipoAtividade; detalhe: string; aprovadaEm: string }[] = [
  { curto: 'Balanceamento', tipo: 'atividade', detalhe: '6 exercícios', aprovadaEm: '31/08' },
  { curto: 'Proporção · lista 1', tipo: 'lista', detalhe: '10 exercícios', aprovadaEm: '08/09' },
  { curto: 'Mol e massa molar', tipo: 'lista', detalhe: '8 exercícios', aprovadaEm: '18/09' },
  { curto: 'Prova', tipo: 'prova', detalhe: '10 questões', aprovadaEm: '19/09' },
]

type Extra = Pick<AtividadeTurma, 'nome' | 'tipo' | 'detalhe' | 'data' | 'estado' | 'nota'> & { id: string; curto?: string; habilidade?: AtividadeTurma['habilidade'] }

const EXTRAS: Record<string, Extra[]> = {
  '2b': [
    { id: 'segunda-chamada', nome: 'Prova de estequiometria · 2ª chamada', tipo: 'prova', detalhe: '10 questões', data: '24/09', estado: 'agendada',
      nota: 'Para quem não fez a prova de 18/09. A versão adaptada, com fonte ampliada, espera a sua aprovação.', habilidade: { nome: 'Reagente limitante', pagina: 151 } },
    { id: 'estequiometria', nome: 'Atividade de estequiometria', tipo: 'atividade', detalhe: '6 exercícios', data: '23/09', estado: 'aberta',
      nota: 'Atribuída em 16/09. Os alunos entregam até quarta, 23/09, às 23h59.', habilidade: { nome: 'Mol e massa molar', pagina: 145 } },
    { id: 'rascunho', nome: 'Lista de reagente limitante', tipo: 'lista', detalhe: '8 exercícios', data: '19/09', estado: 'rascunho',
      nota: 'Ainda não foi atribuída: os alunos só veem depois que você definir o prazo e atribuir.', habilidade: { nome: 'Reagente limitante', pagina: 151 } },
  ],
  '2a': [
    { id: 'limitante', nome: 'Atividade de reagente limitante', tipo: 'atividade', detalhe: '6 exercícios', data: '25/09', estado: 'aberta',
      nota: 'Atribuída em 18/09. Os alunos entregam até sexta, 25/09, às 23h59.', habilidade: { nome: 'Reagente limitante', pagina: 151 } },
    { id: 'rascunho', nome: 'Revisão para o simulado', tipo: 'lista', detalhe: '12 exercícios', data: '11/09', estado: 'rascunho',
      nota: 'Ainda não foi atribuída: os alunos só veem depois que você definir o prazo e atribuir.' },
  ],
  '1c': [
    { id: 'distribuicao', nome: 'Lista de distribuição eletrônica', tipo: 'lista', detalhe: '8 exercícios', data: '25/09', estado: 'aberta',
      nota: 'Atribuída em 18/09. Os alunos entregam até sexta, 25/09, às 23h59.', habilidade: { nome: 'Distribuição eletrônica', pagina: 55 } },
    { id: 'numero', nome: 'Lista de número atômico e de massa', curto: 'Nº atômico e de massa', tipo: 'lista', detalhe: '8 exercícios', data: '15/09', estado: 'corrigir',
      nota: 'Entregue e ainda sem correção. A objetiva o Assistente corrige, e a nota só vale com a sua aprovação.', habilidade: { nome: 'Número atômico e de massa', pagina: 48 } },
    { id: 'modelos', nome: 'Lista de modelos atômicos', curto: 'Modelos atômicos · lista', tipo: 'lista', detalhe: '6 exercícios', data: '08/09', estado: 'corrigir',
      nota: 'Entregue e ainda sem correção. A objetiva o Assistente corrige, e a nota só vale com a sua aprovação.', habilidade: { nome: 'Modelos atômicos', pagina: 44 } },
    { id: 'rascunho', nome: 'Discursiva sobre Lavoisier', tipo: 'atividade', detalhe: '1 questão · rubrica de 4 critérios', data: '04/09', estado: 'rascunho',
      nota: 'Ainda não foi atribuída: os alunos só veem depois que você definir o prazo e atribuir.' },
    { id: 'prova-modelos', nome: 'Prova de modelos atômicos', curto: 'Prova', tipo: 'prova', detalhe: '10 questões · 2 versões', data: '25/08', estado: 'corrigir',
      nota: 'Aplicada e ainda sem correção. A objetiva o Assistente corrige, e a nota só vale com a sua aprovação.', habilidade: { nome: 'Modelos atômicos', pagina: 44 } },
  ],
  '9a': [
    { id: 'feira', nome: 'Projeto da feira de ciências · 2ª etapa', tipo: 'atividade', detalhe: 'relatório do experimento', data: '30/09', estado: 'aberta',
      nota: 'Atribuída em 14/09. Os grupos entregam a 2ª etapa até quarta, 30/09.' },
    { id: 'rascunho', nome: 'Lista de reações do dia a dia', tipo: 'lista', detalhe: '8 exercícios', data: '19/09', estado: 'rascunho',
      nota: 'Ainda não foi atribuída: os alunos só veem depois que você definir o prazo e atribuir.' },
  ],
}

const SELO: Record<EstadoAtividade, (data: string) => string> = {
  esperando: () => 'Esperando você', aprovada: () => 'Corrigida e aprovada', corrigir: () => 'Sem correção',
  aberta: (d) => `Aberta até ${d}`, agendada: () => 'Agendada', rascunho: () => 'Rascunho',
}
const ACAO: Record<EstadoAtividade, AtividadeTurma['acao']> = {
  esperando: { rotulo: 'Revisar a correção', para: '/professor/aprovar' },
  aprovada: { rotulo: 'Abrir', para: ABRIR }, aberta: { rotulo: 'Abrir', para: ABRIR }, agendada: { rotulo: 'Abrir', para: ABRIR },
  corrigir: { rotulo: 'Corrigir', para: '/professor/ferramentas/correcao' },
  rascunho: { rotulo: 'Continuar', para: '/professor/ferramentas/atividade' },
}
const ROTULO_DATA: Record<EstadoAtividade, string> = { esperando: 'Aplicada', aprovada: 'Aplicada', corrigir: 'Aplicada', aberta: 'Prazo', agendada: 'Agendada', rascunho: 'Editado' }

function montarAtividades(turmaId: string): AtividadeTurma[] {
  const alunos = alunosDa(turmaId)
  const total = alunos.length
  const paginas = resumoDa(turmaId).paginas
  const semNota = alunos.every((a) => a.media === null)
  const lista: AtividadeTurma[] = []

  // as que já têm nota: saem de `aluno.notas`, para o diário e a sala mostrarem a mesma coisa
  if (!semNota) alunos[0].notas.forEach((n, i) => {
    const valores = alunos.map((a) => a.notas[i].valor).filter((v): v is number => v !== null)
    const media = valores.reduce((s, v) => s + v, 0) / Math.max(1, valores.length)
    const hab = alunos[0].habilidades.find((h) => h.codigo === n.habilidade)
    const esperando = turmaId === '2b' && i === 3 // a prova que o Assistente corrigiu e espera a Camila
    const estado: EstadoAtividade = esperando ? 'esperando' : 'aprovada'
    const base = CORRIGIDAS[i]
    lista.push({
      id: `${turmaId}-nota-${i}`, nome: n.atividade, curto: base.curto, tipo: base.tipo, detalhe: base.detalhe,
      data: n.data, rotuloData: base.tipo === 'prova' ? 'Aplicada' : 'Entregue', estado, selo: SELO[estado](n.data), indiceNota: i,
      // a prova do 2ºB é citada com 64% de acerto no resto do mockup (Home, time, Visão geral): aqui vale o mesmo número
      entregas: { feitas: valores.length, total }, acerto: esperando ? 64 : Math.round(media * 10 - ACIMA_DO_ACERTO), media: Math.round(media * 10) / 10,
      habilidade: hab ? { nome: hab.curto, pagina: paginas?.[hab.codigo] ?? hab.pagina } : null,
      nota: esperando
        ? `O Assistente corrigiu ${valores.length} provas e separou 5 destaques. A nota só vale depois da sua aprovação.`
        : 'Correção do Assistente, conferida e aprovada por você. A nota já conta na média.',
      aprovadaEm: esperando ? undefined : base.aprovadaEm,
      quem: alunos.filter((a) => a.notas[i].valor === null), rotuloQuem: 'Não fez',
      acao: ACAO[estado],
    })
  })

  for (const e of EXTRAS[turmaId] ?? []) {
    // aberta: entregou quem está com tudo em dia · sem correção: fez quem estava na aula do dia
    const quem = e.estado === 'aberta' ? alunos.filter((a) => a.entregas.feitas < a.entregas.total)
      : e.estado === 'corrigir' ? alunos.filter((a) => a.datasFaltas.includes(e.data))
      : e.estado === 'agendada' ? alunos.filter((a) => a.notas[3].valor === null)
      : []
    lista.push({
      id: `${turmaId}-${e.id}`, nome: e.nome, curto: e.curto ?? e.nome, tipo: e.tipo, detalhe: e.detalhe, data: e.data,
      rotuloData: e.estado === 'corrigir' && e.tipo !== 'prova' ? 'Entregue' : ROTULO_DATA[e.estado],
      estado: e.estado, selo: SELO[e.estado](e.data), indiceNota: null,
      entregas: e.estado === 'aberta' || e.estado === 'corrigir' ? { feitas: total - quem.length, total } : null,
      acerto: null, media: null, habilidade: e.habilidade ?? null, nota: e.nota, quem,
      rotuloQuem: e.estado === 'aberta' ? 'Ainda não entregou' : e.estado === 'agendada' ? 'Quem vai fazer' : 'Não fez',
      acao: ACAO[e.estado],
    })
  }
  // do mais novo para o mais velho
  return lista.sort((a, b) => ordemDe(b.data) - ordemDe(a.data))
}

const ATIVIDADES = new Map<string, AtividadeTurma[]>()
export function atividadesDa(turmaId: string): AtividadeTurma[] {
  if (!ATIVIDADES.has(turmaId)) ATIVIDADES.set(turmaId, montarAtividades(turmaId))
  return ATIVIDADES.get(turmaId)!
}

/** As atividades com nota lançada, da mais antiga para a mais nova: as colunas do diário. */
export const comNotaDa = (turmaId: string) => atividadesDa(turmaId).filter((a) => a.indiceNota !== null).sort((a, b) => a.indiceNota! - b.indiceNota!)

/* ── Aulas dadas: as colunas da chamada ──────────────────────────────────────────────────────────────────── */
export type AulaDada = { data: string; dia: string; hoje: boolean }

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const doisDigitos = (n: number) => String(n).padStart(2, '0')

const AULAS: AulaDada[] = (() => {
  const lista: AulaDada[] = []
  const fim = new Date(2026, 8, 21)
  for (let d = new Date(2026, 7, 24); d <= fim; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    if (![1, 2, 4, 5].includes(d.getDay())) continue // seg, ter, qui e sex
    if (d.getMonth() === 8 && d.getDate() === 7) continue // feriado da Independência
    lista.push({ data: `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`, dia: DIAS[d.getDay()], hoje: d.getTime() === fim.getTime() })
  }
  return lista
})()

/** As 16 aulas dadas até hoje. É a mesma lista para todas as turmas (ver a nota no alto do arquivo). */
export const aulasDa = (turmaId: string): AulaDada[] => { void turmaId; return AULAS }

/* ── Uso do Tutor: fato e agregado ("sinal, não conversa") ───────────────────────────────────────────────── */
export type DuvidaRepetida = { texto: string; vezes: number; alunos: number; pagina: number }
export type OndeTravou = { nome: string; codigo?: string; pagina: number; alunos: number }
export type UsoAluno = { aluno: Aluno; usou: boolean; conversas: number }

export type UsoTutor = {
  alunos: number
  usaram: number
  conversas: number
  /** conversas em que o aluno chegou à resposta pelos próprios passos */
  resolvidas: number
  prontas: { pedidos: number; alunos: number }
  material: { titulo: string; capitulo: string }
  duvidas: DuvidaRepetida[]
  travaram: OndeTravou[]
  porAluno: UsoAluno[]
}

/* O que `turmas-resumo` não tem: a 3ª e a 4ª dúvidas, os pedidos de resposta pronta e, no 1ºC (que ainda não tem
   diagnóstico por habilidade), onde os alunos travaram. */
const TUTOR_EXTRA: Record<string, { prontas: UsoTutor['prontas']; duvidas: DuvidaRepetida[]; travaram?: OndeTravou[]; sempre?: string[] }> = {
  '2b': { prontas: { pedidos: 7, alunos: 2 }, sempre: ['Lucas Pereira', 'Ana Beatriz', 'Heitor Alves', 'Larissa Melo'], duvidas: [
    { texto: 'O coeficiente entra na conta da massa?', vezes: 5, alunos: 4, pagina: 142 },
    { texto: 'Como acho o rendimento se sobrou reagente?', vezes: 4, alunos: 3, pagina: 151 },
  ] },
  '2a': { prontas: { pedidos: 4, alunos: 2 }, duvidas: [
    { texto: 'Como sei que a equação está balanceada?', vezes: 4, alunos: 4, pagina: 142 },
    { texto: 'Qual é a diferença entre mol e massa molar?', vezes: 3, alunos: 3, pagina: 145 },
  ] },
  '1c': { prontas: { pedidos: 3, alunos: 2 }, duvidas: [
    { texto: 'Como distribuo os elétrons nas camadas?', vezes: 3, alunos: 3, pagina: 55 },
    { texto: 'O que é um isótopo?', vezes: 2, alunos: 2, pagina: 50 },
  ], travaram: [
    { nome: 'Número atômico e de massa', pagina: 48, alunos: 6 },
    { nome: 'Camadas do modelo de Bohr', pagina: 52, alunos: 4 },
    { nome: 'Distribuição eletrônica', pagina: 55, alunos: 3 },
    { nome: 'Isótopos', pagina: 50, alunos: 2 },
    { nome: 'Modelo de Rutherford', pagina: 46, alunos: 1 },
  ] },
  '9a': { prontas: { pedidos: 2, alunos: 1 }, duvidas: [
    { texto: 'Por que a massa não muda na reação?', vezes: 3, alunos: 3, pagina: 52 },
    { texto: 'Posso mudar o número pequeno da fórmula?', vezes: 2, alunos: 2, pagina: 54 },
  ] },
}

function montarUso(turmaId: string): UsoTutor {
  const alunos = alunosDa(turmaId)
  const resumo = resumoDa(turmaId)
  const extra = TUTOR_EXTRA[turmaId] ?? TUTOR_EXTRA['2b']
  const usaram = Math.min(alunos.length, resumo.tutor.usaram)
  const conversas = Math.max(usaram, resumo.tutor.conversas)
  const r = sorteio(7000 + alunos.length * 31 + usaram)

  // quem usou: os que já aparecem com o Tutor em outras telas, e o resto por sorteio de semente fixa
  const peso = new Map(alunos.map((a) => [a.id, (extra.sempre ?? []).includes(a.nome) ? 2 : r()]))
  const usou = new Set([...alunos].sort((a, b) => peso.get(b.id)! - peso.get(a.id)!).slice(0, usaram).map((a) => a.id))

  // as conversas repartidas entre quem usou: todo mundo com pelo menos uma, e a soma fecha com o total
  const quota = new Map<string, number>()
  const fatia = alunos.filter((a) => usou.has(a.id)).map((a) => ({ id: a.id, w: 0.4 + r() * r() * 3 }))
  const somaW = fatia.reduce((s, f) => s + f.w, 0)
  let resto = conversas - usaram
  for (const f of fatia) { const n = Math.floor(((conversas - usaram) * f.w) / somaW); quota.set(f.id, 1 + n); resto -= n }
  for (const f of [...fatia].sort((a, b) => b.w - a.w)) { if (resto <= 0) break; quota.set(f.id, quota.get(f.id)! + 1); resto-- }

  const paginas = resumo.paginas
  const travaram: OndeTravou[] = extra.travaram ?? alunos[0].habilidades.map((h, i) => ({
    nome: h.curto, codigo: h.codigo, pagina: paginas?.[h.codigo] ?? h.pagina,
    // nem todo mundo que está abaixo de 50% na habilidade travou com o Tutor: conta-se a metade de quem usou
    alunos: Math.round(alunos.filter((a) => usou.has(a.id) && a.habilidades[i].acerto < 50).length / 2),
  })).sort((a, b) => b.alunos - a.alunos)

  return {
    alunos: alunos.length, usaram, conversas, resolvidas: Math.round(conversas * 0.84), prontas: extra.prontas,
    material: resumo.material,
    duvidas: [...resumo.tutor.duvidas.map((d) => ({ ...d, alunos: Math.max(2, Math.round(d.vezes * 0.8)) })), ...extra.duvidas].sort((a, b) => b.vezes - a.vezes),
    travaram,
    porAluno: alunos.map((a) => ({ aluno: a, usou: usou.has(a.id), conversas: quota.get(a.id) ?? 0 })),
  }
}

/** O material da turma, para o chip de página abrir o livro certo. */
export const materialDa = (turmaId: string) => resumoDa(turmaId).material

const USO = new Map<string, UsoTutor>()
export function usoTutorDa(turmaId: string): UsoTutor {
  if (!USO.has(turmaId)) USO.set(turmaId, montarUso(turmaId))
  return USO.get(turmaId)!
}

/* ── Uso de IA ao longo do tempo: conversas por dia, por assunto (os três mais perguntados) ─────────────────── */
export const PERIODOS_USO = ['Personalizado', '30D', '2M', '3M', '6M', '12M'] as const
export type PeriodoUso = (typeof PERIODOS_USO)[number]
export type PassoUso = 'dia' | 'semana' | 'mês'
export type UsoNoTempo = {
  /** o que cada ponto soma: até 30 dias é por dia; até 3 meses, por semana; acima disso, por mês */
  passo: PassoUso
  de: string
  ate: string
  /** um rótulo por ponto: "24/08" (dia e semana) ou "ago" (mês) */
  rotulos: string[]
  series: { assunto: string; valores: number[] }[]
  /** o teto do eixo y, já arredondado para um número limpo */
  teto: number
  usaram: number
  alunos: number
  pct: number
}

const AGORA = new Date(2026, 8, 21)
const UM_DIA = 86_400_000
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
/** "Personalizado" é o 3º bimestre, de 24/08 a 21/09 */
const DIAS_DO_PERIODO: Record<PeriodoUso, number> = { Personalizado: 29, '30D': 30, '2M': 61, '3M': 91, '6M': 183, '12M': 365 }
/* num período mais longo, mais gente usou o Tutor pelo menos uma vez */
const ALUNOS_A_MAIS: Record<PeriodoUso, number> = { Personalizado: 0, '30D': 0, '2M': 2, '3M': 3, '6M': 4, '12M': 5 }
/* o ritmo do ano letivo: férias em janeiro, julho e dezembro */
const RITMO_DO_MES = [0.04, 0.5, 0.7, 0.75, 0.8, 0.85, 0.12, 0.8, 1, 0.6, 0.7, 0.18]
/* cada assunto sobe perto da atividade dele: a lista de 17/09, a prova de 18/09 e a lista de 04/09 */
const PICO = [new Date(2026, 8, 16), new Date(2026, 8, 17), new Date(2026, 8, 3)]
const FATIA = [0.46, 0.32, 0.22]

const diaMes = (d: Date) => `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`

/** Os três assuntos mais perguntados: o primeiro é o de `turmas-resumo`; os outros, onde mais alunos travaram. */
export function assuntosDoTutor(turmaId: string): string[] {
  const primeiro = resumoDa(turmaId).tutor.assunto
  const p = primeiro.toLowerCase()
  const outros = usoTutorDa(turmaId).travaram.map((t) => t.nome).filter((n) => !n.toLowerCase().includes(p) && !p.includes(n.toLowerCase()))
  return [primeiro, ...outros].slice(0, 3)
}

/* 365 dias de conversas por assunto, do mais antigo para hoje. A semana que termina hoje fecha com 80% das conversas
   da semana (o resto é de outros assuntos), para o gráfico e o número da Visão geral contarem a mesma história. */
const DIARIO = new Map<string, number[][]>()
function diarioDo(turmaId: string): number[][] {
  const pronto = DIARIO.get(turmaId)
  if (pronto) return pronto
  const uso = usoTutorDa(turmaId)
  const r = sorteio(4200 + uso.alunos * 17 + uso.conversas)
  const cru = FATIA.map((fatia, k) => Array.from({ length: 365 }, (_, i) => {
    const d = new Date(AGORA.getTime() - (364 - i) * UM_DIA)
    const longe = (d.getTime() - PICO[k].getTime()) / UM_DIA
    const onda = 1 + 1.4 * Math.exp(-(longe * longe) / (2 * 3.2 * 3.2))
    const fimDeSemana = d.getDay() === 0 || d.getDay() === 6 ? 0.35 : 1
    return RITMO_DO_MES[d.getMonth()] * fatia * onda * fimDeSemana * (0.65 + r() * 0.7)
  }))
  const semana = cru.reduce((s, serie) => s + serie.slice(-7).reduce((a, v) => a + v, 0), 0)
  const escala = (uso.conversas * 0.8) / Math.max(0.001, semana)
  // conversa é número inteiro: o resto de cada dia passa para o dia seguinte, e a soma do período não se perde
  const dias = cru.map((serie) => { let resto = 0.5; return serie.map((v) => { resto += v * escala; const n = Math.floor(resto); resto -= n; return n }) })
  DIARIO.set(turmaId, dias)
  return dias
}

const tetoLimpo = (max: number) => (max <= 4 ? 4 : max <= 10 ? Math.ceil(max / 2) * 2 : max <= 50 ? Math.ceil(max / 10) * 10 : Math.ceil(max / 50) * 50)

export function usoNoTempoDa(turmaId: string, periodo: PeriodoUso): UsoNoTempo {
  const uso = usoTutorDa(turmaId)
  const n = DIAS_DO_PERIODO[periodo]
  const passo: PassoUso = n <= 31 ? 'dia' : n <= 92 ? 'semana' : 'mês'
  const dias = diarioDo(turmaId).map((serie) => serie.slice(-n))
  const dataDe = (i: number) => new Date(AGORA.getTime() - (n - 1 - i) * UM_DIA)

  // os baldes: [início, fim) em índice de dia, do mais antigo para o mais novo
  const baldes: { de: number; ate: number; rotulo: string }[] = []
  if (passo === 'dia') for (let i = 0; i < n; i++) baldes.push({ de: i, ate: i + 1, rotulo: diaMes(dataDe(i)) })
  else if (passo === 'semana') for (let fim = n; fim - 7 >= 0; fim -= 7) baldes.unshift({ de: fim - 7, ate: fim, rotulo: diaMes(dataDe(fim - 7)) })
  else for (let i = 0; i < n; i++) {
    const d = dataDe(i)
    const ultimo = baldes[baldes.length - 1]
    const rotulo = MESES[d.getMonth()] + (d.getMonth() === 0 || baldes.length === 0 ? `/${String(d.getFullYear()).slice(2)}` : '')
    if (ultimo && dataDe(ultimo.de).getMonth() === d.getMonth()) ultimo.ate = i + 1
    else baldes.push({ de: i, ate: i + 1, rotulo })
  }

  const assuntos = assuntosDoTutor(turmaId)
  const series = assuntos.map((assunto, k) => ({ assunto, valores: baldes.map((b) => dias[k].slice(b.de, b.ate).reduce((s, v) => s + v, 0)) }))
  const usaram = Math.min(uso.alunos, uso.usaram + ALUNOS_A_MAIS[periodo])
  // o período que atravessa o ano diz o ano: "22/09/25 a 21/09/26"
  const inicio = dataDe(baldes[0].de)
  const ano = (d: Date) => (inicio.getFullYear() === AGORA.getFullYear() ? '' : `/${String(d.getFullYear()).slice(2)}`)
  return {
    passo, de: diaMes(inicio) + ano(inicio), ate: diaMes(AGORA) + ano(AGORA), rotulos: baldes.map((b) => b.rotulo), series,
    teto: tetoLimpo(Math.max(1, ...series.flatMap((s) => s.valores))),
    usaram, alunos: uso.alunos, pct: Math.round((usaram / uso.alunos) * 100),
  }
}

/* ── O histórico: o que cada aluno fez no Tutor, e quando. Dez registros, sempre os mesmos ──────────────────── */
export type AcaoTutor = 'duvida' | 'pronta' | 'revisao'
export type RegistroTutor = { id: string; aluno: Aluno; acao: AcaoTutor; texto: string; assunto: string | null; quando: string }

/* o "agora" é segunda de manhã: quinta-feira é 17/09, a véspera da prova */
const QUANDO = ['há 25 minutos', 'há 2 horas', 'há 3 horas', 'ontem', 'ontem', 'sábado', 'sexta-feira', 'sexta-feira', 'quinta-feira', 'quinta-feira']
const ROTEIRO: AcaoTutor[] = ['duvida', 'duvida', 'pronta', 'duvida', 'duvida', 'duvida', 'pronta', 'duvida', 'revisao', 'revisao']
const ASSUNTO_DA_VEZ = [0, 1, 0, 0, 2, 1, 0, 0, 1, 2]

const HISTORICO = new Map<string, RegistroTutor[]>()
export function historicoTutorDa(turmaId: string): RegistroTutor[] {
  const pronto = HISTORICO.get(turmaId)
  if (pronto) return pronto
  const uso = usoTutorDa(turmaId)
  const assuntos = assuntosDoTutor(turmaId)
  const sempre = TUTOR_EXTRA[turmaId]?.sempre ?? []
  const r = sorteio(5100 + uso.alunos * 13 + uso.usaram)
  // quem mais conversou (e quem já aparece com o Tutor em outras telas), numa ordem embaralhada de semente fixa
  const quem = uso.porAluno.filter((x) => x.usou)
    .sort((a, b) => Number(sempre.includes(b.aluno.nome)) - Number(sempre.includes(a.aluno.nome)) || b.conversas - a.conversas)
    .slice(0, 10).map((x) => ({ aluno: x.aluno, w: r() })).sort((a, b) => a.w - b.w).map((x) => x.aluno)
  const temProva = atividadesDa(turmaId).some((a) => a.tipo === 'prova' && (a.estado === 'agendada' || a.estado === 'esperando'))
  let jaPediu: Aluno | null = null
  const lista = ROTEIRO.map((acao, i): RegistroTutor => {
    let aluno = quem[i % quem.length]
    // resposta pronta é de poucos alunos: com um só na turma, os dois pedidos são dele
    if (acao === 'pronta') { if (jaPediu && uso.prontas.alunos < 2) aluno = jaPediu; jaPediu = jaPediu ?? aluno }
    const assunto = acao === 'pronta' ? null : acao === 'revisao' && temProva ? null : assuntos[ASSUNTO_DA_VEZ[i] % assuntos.length]
    const texto = acao === 'pronta' ? 'Pediu resposta pronta' : acao === 'revisao' ? (temProva ? 'Revisou para a prova' : 'Revisou a matéria') : 'Tirou dúvida'
    return { id: `${turmaId}-tutor-${i}`, aluno, acao, texto, assunto, quando: QUANDO[i] }
  })
  HISTORICO.set(turmaId, lista)
  return lista
}
