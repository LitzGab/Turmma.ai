import {
  CalendarDays, ChartColumn, ClipboardCheck, MessageCircleQuestion, MessagesSquare,
  SlidersHorizontal, type LucideIcon,
} from 'lucide-react'

/* UM AGENTE PARA CADA PESSOA DA ESCOLA (proposta de 19/09/2026, a registrar como revisão da D32):
   o professor tem o Assistente, o aluno tem o Tutor, a coordenação tem o Analista; a família terá o Mensageiro.
   Antes eram seis, e quatro deles eram do professor (Assistente, Corretor, Planejador, Adaptador) — cada um com uma
   ferramenta gêmea que fazia a mesma coisa. Agora o Assistente é um só, e o que eram agentes viraram FUNÇÕES dele.
   O que muda por baixo: a autonomia (D9) e a suspensão (D60) passam a ser declaradas POR FUNÇÃO, não por agente.
   A AIA já era por funcionalidade (regra 70, item 6a). Identidade continua de função, sem nome próprio e sem rosto
   (D17, D58): quem conversa tem cor cheia — o Assistente em preto, o Tutor no laranja da pinta. */

/** Os ids antigos continuam aceitos para as telas da coordenação que ainda não foram revistas: caem no Assistente. */
type Legado = 'corretor' | 'planejador' | 'adaptador'
export type AgenteId = 'assistente' | 'tutor' | 'analista' | Legado

export type FuncaoId = 'conversa' | 'correcao' | 'adaptacao' | 'dia'

export type Funcao = {
  id: FuncaoId
  nome: string
  icone: LucideIcon
  /** autonomia em português comum (D9) — nunca "nível 2" */
  autonomia: string
  /** o que ela produz nasce pendente e espera o professor? */
  espera: boolean
  altoRisco: boolean
}

export type Agente = {
  id: AgenteId
  nome: string
  curto: string
  ladrilho: string
  corIcone: string
  icone: LucideIcon
  paraQuem: string
  autonomia: string
  resumo: string
  altoRisco: boolean
  fazSozinho: string[]
  esperaAprovacao: string[]
  nuncaFaz: string[]
  funcoes?: Funcao[]
}

export const FUNCOES_ASSISTENTE: Funcao[] = [
  { id: 'conversa', nome: 'Conversa e ferramentas', icone: MessagesSquare, autonomia: 'Faz quando você pede; tudo é rascunho seu', espera: false, altoRisco: false },
  { id: 'correcao', nome: 'Correção de objetiva', icone: ClipboardCheck, autonomia: 'Corrige e avisa; o diagnóstico só chega ao aluno com você', espera: true, altoRisco: true },
  { id: 'adaptacao', nome: 'Adaptação', icone: SlidersHorizontal, autonomia: 'Prepara a versão adaptada e espera você', espera: true, altoRisco: true },
  { id: 'dia', nome: 'Seu dia e sua semana', icone: CalendarDays, autonomia: 'Abre o dia e registra; plano novo só quando você pede', espera: false, altoRisco: false },
]

export const funcao = (id: FuncaoId) => FUNCOES_ASSISTENTE.find((f) => f.id === id)!

const ASSISTENTE: Agente = {
  id: 'assistente', nome: 'Assistente de ensino', curto: 'Assistente',
  ladrilho: '#0D0D0D', corIcone: '#FFFFFF', icone: MessagesSquare,
  paraQuem: 'Professor',
  autonomia: 'prepara e avisa; o que vale só com você',
  resumo: 'É o agente do professor. Conversa e abre as ferramentas quando você pede; e, por conta própria, corrige as objetivas, prepara a versão adaptada e abre o seu dia. Tudo a partir do material da escola, com a página citada.',
  altoRisco: true,
  fazSozinho: ['Gera rascunho de prova, atividade e plano quando o professor pede', 'Corrige objetivas e monta o diagnóstico por habilidade', 'Abre o dia com aulas, avaliações e entregas em atraso', 'Cita material e página em toda saída'],
  esperaAprovacao: ['Diagnóstico que chega ao aluno', 'Toda versão adaptada, antes de o aluno receber', 'Nota de objetiva, quando a nota oficial existir'],
  nuncaFaz: ['Corrigir, avaliar ou sugerir nota em redação e discursiva', 'Receber ou guardar diagnóstico, laudo ou CID', 'Gerar plano que ninguém pediu', 'Avisar fora do horário útil da escola'],
  funcoes: FUNCOES_ASSISTENTE,
}

export const AGENTES: Record<AgenteId, Agente> = {
  assistente: ASSISTENTE,
  tutor: {
    id: 'tutor', nome: 'Tutor', curto: 'Tutor',
    ladrilho: '#E8732E', corIcone: '#0D0D0D', icone: MessageCircleQuestion,
    paraQuem: 'Aluno, e o professor da turma',
    autonomia: 'conversa com o aluno e avisa você; sempre supervisionado',
    resumo: 'É o agente do aluno. Conduz por perguntas, nunca entrega a resposta pronta, cita a página. Avisa o professor o que viu no uso.',
    altoRisco: true,
    fazSozinho: ['Responde o aluno por perguntas, dentro do conteúdo da turma', 'Avisa o professor quem travou e onde'],
    esperaAprovacao: ['Busca em fontes aprovadas: a escola libera e o professor liga'],
    nuncaFaz: ['Entregar resposta pronta', 'Dizer que é uma pessoa ou simular afeto', 'Inferir emoção, humor ou atenção', 'Aconselhar em assunto pessoal delicado'],
  },
  analista: {
    id: 'analista', nome: 'Analista de desempenho escolar', curto: 'Analista',
    ladrilho: '#F0F0F0', corIcone: '#0D0D0D', icone: ChartColumn,
    paraQuem: 'Coordenação',
    autonomia: 'faz e avisa; sempre em agregado',
    resumo: 'É o agente da coordenação. Resumo de segunda de manhã e alerta na hora, por série e disciplina. Alerta é hipótese, nunca veredito.',
    altoRisco: true,
    fazSozinho: ['Resumo semanal em agregado', 'Alerta quando um indicador passa do limiar'],
    esperaAprovacao: ['Abrir dado nominal: só você, com registro em auditoria'],
    nuncaFaz: ['Ranquear professor ou medir adoção nominal', 'Contatar professor ou família', 'Recomendar decisão sobre professor ou aluno'],
  },
  // legado: a mesma identidade do Assistente, dizendo qual função dele está falando
  corretor: { ...ASSISTENTE, id: 'corretor', nome: 'Assistente · correção de objetiva' },
  adaptador: { ...ASSISTENTE, id: 'adaptador', nome: 'Assistente · adaptação' },
  planejador: { ...ASSISTENTE, id: 'planejador', nome: 'Assistente · seu dia', altoRisco: false },
}

export const agente = (id: AgenteId) => AGENTES[id]
export const LISTA_AGENTES: Agente[] = [AGENTES.assistente, AGENTES.tutor, AGENTES.analista]
