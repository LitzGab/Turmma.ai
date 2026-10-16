import { BIBLIOTECA, type ItemBiblioteca } from './biblioteca'
import { turmaDe } from './escola'

/* OS DADOS DAS ABAS "Recursos" E "Mural" DA TURMA ABERTA (20/09/2026, cópia da Teachy; aqui são PROPOSTA do mockup:
   nenhuma das duas existe no roadmap). 100% sintético (D71) e determinístico: a tela não muda a cada recarga.
   · RECURSO é um documento da Biblioteca que a professora compartilhou com a turma (ou com um grupo dela). Só entra
     o que é material de ALUNO: fica de fora a prova, a adaptação, o plano de aula, o planejamento e a diagnóstica.
     O que ainda não foi enviado aparece no menu "Enviar recursos".
   · MURAL é recado da professora para a turma inteira. Não é conversa: o produto não abre chat professor–aluno.
     Do aluno só existe CONTAGEM ("visto por 27 de 32", "27 de 32 abriram"), nunca quem, quando ou por quanto tempo.
   · As datas batem com o resto do mockup: a 2ª chamada da prova é quinta, 24/09; a atividade de estequiometria fecha
     quarta, 23/09; a feira de ciências do 9ºA é sexta, 23/10. O "agora" é segunda, 21/09/2026. */

export type DiaMes = [number, number]
export const HOJE: DiaMes = [21, 9]

const noAno = ([dia, mes]: DiaMes) => new Date(2026, mes - 1, dia).getTime()
export const diasAtras = (em: DiaMes) => Math.round((noAno(HOJE) - noAno(em)) / 86_400_000)
export const dataCurta = ([dia, mes]: DiaMes) => `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`

/** "hoje", "ontem", "há 3 dias", "há 1 semana", "há 2 semanas": relativo ao agora do mockup. */
export function haQuanto(em: DiaMes) {
  const d = diasAtras(em)
  if (d <= 0) return 'hoje'
  if (d === 1) return 'ontem'
  if (d < 7) return `há ${d} dias`
  if (d < 14) return 'há 1 semana'
  if (d < 31) return `há ${Math.floor(d / 7)} semanas`
  return d < 61 ? 'há 1 mês' : `há ${Math.floor(d / 30)} meses`
}

/* ── Os documentos da turma ─────────────────────────────────────────────────────────────────────────────── */
const FORA = new Set(['prova', 'adaptacao', 'plano', 'periodo', 'diagnostica', 'importar', 'correcao'])
const TIPO: Record<string, string> = {
  apresentacao: 'Apresentação', material: 'Material didático', mapa: 'Mapa mental', atividade: 'Lista de exercícios',
  experimento: 'Roteiro de experimento', recuperacao: 'Plano de recuperação', projeto: 'Projeto', proposta: 'Proposta de redação',
  simulado: 'Simulado ENEM', redacao: 'Rubrica',
}

export const docDe = (n: number) => BIBLIOTECA.find((d) => d.n === n)
/** "Apresentação · 12 slides": o tipo do documento e o tamanho dele, na linha cinza. */
export const tipoDoDoc = (d: ItemBiblioteca) => `${TIPO[d.de] ?? 'Documento'} · ${d.detalhe}`

/** O que a professora pode compartilhar com esta turma: aprovado, e feito para o aluno. Do mais novo para o mais antigo. */
export function compartilhaveisDa(turmaId: string): ItemBiblioteca[] {
  const nome = turmaDe(turmaId).nome
  return BIBLIOTECA.filter((d) => d.turma === nome && d.estado === 'aprovado' && !FORA.has(d.de))
    .sort((a, b) => noAno(b.em) - noAno(a.em))
}

/* ── Recursos enviados ──────────────────────────────────────────────────────────────────────────────────── */
export type Destino = { tipo: 'turma' } | { tipo: 'grupo'; nome: string; alunos: number }
export type RecursoEnviado = {
  /** `n` do documento na Biblioteca */
  doc: number
  destino: Destino
  /** quando foi enviado; 'agora' é o que a professora acabou de enviar nesta visita */
  em: DiaMes | 'agora'
  /** quantos alunos abriram: só a contagem */
  abriram: number
}

const TURMA: Destino = { tipo: 'turma' }

const ENVIADOS: Record<string, RecursoEnviado[]> = {
  // os slides de "Rendimento de reação" ficam por enviar: a aula é sexta, 25/09
  '2b': [
    { doc: 3, destino: TURMA, em: [19, 9], abriram: 21 },
    { doc: 5, destino: TURMA, em: [17, 9], abriram: 30 },
    { doc: 14, destino: TURMA, em: [2, 9], abriram: 27 },
    { doc: 18, destino: { tipo: 'grupo', nome: 'Grupo de reforço', alunos: 8 }, em: [25, 8], abriram: 7 },
  ],
  // a proposta de redação fica por enviar
  '2a': [{ doc: 12, destino: TURMA, em: [8, 9], abriram: 26 }],
  // o 1ºC ainda não recebeu nada: o roteiro de conservação da massa está no menu
  '1c': [],
  '9a': [{ doc: 11, destino: TURMA, em: [10, 9], abriram: 25 }],
}

export const recursosDa = (turmaId: string): RecursoEnviado[] => ENVIADOS[turmaId] ?? []
export const totalDo = (destino: Destino, turmaId: string) => destino.tipo === 'grupo' ? destino.alunos : turmaDe(turmaId).alunos
export const nomeDo = (destino: Destino) => destino.tipo === 'grupo' ? `${destino.nome} · ${destino.alunos} alunos` : 'Toda a turma'

/* ── Mural ──────────────────────────────────────────────────────────────────────────────────────────────── */
export type PostMural = {
  id: string
  texto: string
  em: DiaMes | 'agora'
  /** `n` do documento da Biblioteca anexado */
  anexo?: number
  /** quantos alunos viram: só a contagem */
  visto: number
}

export const LIMITE_POST = 5000

const POSTS: Record<string, PostMural[]> = {
  '2b': [
    { id: '2b-3', em: [19, 9], visto: 27, anexo: 5, texto: 'Prova de estequiometria na quinta, 24/09 (2ª chamada). Revisem reagente limitante: páginas 150 a 153.' },
    { id: '2b-2', em: [18, 9], visto: 30, texto: 'Quem não entregou a atividade de estequiometria tem até quarta, 23/09.' },
    { id: '2b-1', em: [15, 9], visto: 32, texto: 'Prova de estequiometria na sexta, 18/09. São dez questões objetivas. Calculadora simples liberada; a tabela periódica vai no verso da prova.' },
  ],
  '2a': [
    { id: '2a-2', em: [18, 9], visto: 24, texto: 'A atividade de reagente limitante está aberta até sexta, 25/09. São 6 exercícios: mostrem o cálculo de cada um.' },
    { id: '2a-1', em: [8, 9], visto: 29, anexo: 12, texto: 'Deixei o resumo de balanceamento para quem quiser revisar antes da lista. Cabe em uma página.' },
  ],
  '1c': [],
  '9a': [
    { id: '9a-2', em: [18, 9], visto: 22, anexo: 11, texto: 'Feira de ciências na sexta, 23/10. Na semana que vem cada grupo me entrega o nome do grupo e o resíduo que escolheu.' },
    { id: '9a-1', em: [16, 9], visto: 25, texto: 'A 2ª etapa do projeto, o relatório do experimento, é para quarta, 30/09.' },
  ],
}

export const postsDa = (turmaId: string): PostMural[] => POSTS[turmaId] ?? []
