import { useMemo } from 'react'
import { contaDeAluno, useContasDeAluno } from './acesso'
import { professorPorSessao, useProfessoresDaEscola } from './escola-estado'
import { definirQuemPadrao, registrar, type PapelEvento, type QuemFez, type TipoEvento } from './demo/nucleo'
import { fatiaSessao, sessaoBase } from './demo/sessao-base'

/* A SESSÃO DA DEMONSTRAÇÃO (12ª rodada, 04/10/2026; plano de polimento, seção 4.2).

   Quem está usando agora, em cada papel:
   · o ALUNO: o Lucas Pereira (2ºB, matrícula 2026-0412) por padrão, ou um aluno aprovado na demonstração (a Alice,
     da 3ºA), que entra pela escola com a matrícula e a senha que criou;
   · o PROFESSOR: a Camila Souza (Química; Colégio Aurora e E. M. Rio Cachoeira) por padrão, ou quem aceitou um
     convite na demonstração (o Marcos Vieira, Física).
   `?como=<id>` na URL (só nos links do Mapa) troca a pessoa; a casca lê e tira o parâmetro.
   Também guarda o primeiro acesso já visto (a onça aparece uma vez por aluno) e as novidades abertas (o selo NOVO,
   que some ao abrir: não é recompensa nem número subindo, D59). */

export type AlunoAtual = {
  id: string
  nome: string
  primeiro: string
  iniciais: string
  turmaId: string
  turma: string
  serie: string
  escola: string
  matricula: string
  /** nasceu na demonstração (sem tarefas, sem notas) */
  novo: boolean
}

export type ProfessorAtual = {
  id: string
  /** o id em PROFESSORES ("p-camila") */
  profId: string
  nome: string
  primeiro: string
  iniciais: string
  disciplina: string
  /** "Professora · Química" */
  papel: string
  escolas: string[]
  novo: boolean
}

export const LUCAS: AlunoAtual = {
  id: 'lucas', nome: 'Lucas Pereira', primeiro: 'Lucas', iniciais: 'LP', turmaId: '2b', turma: '2ºB', serie: '2º ano EM',
  escola: 'Colégio Aurora', matricula: '2026-0412', novo: false,
}

export const CAMILA: ProfessorAtual = {
  id: 'camila', profId: 'p-camila', nome: 'Camila Souza', primeiro: 'Camila', iniciais: 'CS', disciplina: 'Química',
  papel: 'Professora · Química', escolas: ['aurora', 'cachoeira'], novo: false,
}

const iniciaisDe = (nome: string) => { const p = nome.split(' '); return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase() }

/** O aluno da sessão. */
export function useAlunoAtual(): AlunoAtual {
  const { alunoId } = fatiaSessao.useValor()
  const contas = useContasDeAluno()
  return useMemo(() => {
    const c = contas.find((x) => x.id === alunoId)
    if (!c) return LUCAS
    return { id: c.id, nome: c.nome, primeiro: c.primeiro, iniciais: c.iniciais, turmaId: c.turmaId, turma: c.turma, serie: c.serie, escola: c.escola, matricula: c.matricula, novo: true }
  }, [alunoId, contas])
}

/** O professor da sessão. */
export function useProfessorAtual(): ProfessorAtual {
  const { professorId } = fatiaSessao.useValor()
  const profs = useProfessoresDaEscola()
  return useMemo(() => {
    if (professorId === 'camila') return CAMILA
    const p = profs.find((x) => x.sessaoId === professorId)
    if (!p) return CAMILA
    const titulo = p.tratamento === 'professora' ? 'Professora' : 'Professor'
    return {
      id: professorId, profId: p.id, nome: p.nome, primeiro: p.nome.split(' ')[0], iniciais: iniciaisDe(p.nome),
      disciplina: p.disciplina, papel: `${titulo} · ${p.disciplina}`, escolas: ['aurora'], novo: !!p.criado,
    }
  }, [professorId, profs])
}

/** Leitura fora do React: o aluno e o professor da sessão. */
export function alunoDaSessao(): AlunoAtual {
  const c = contaDeAluno(fatiaSessao.ler().alunoId)
  return c ? { id: c.id, nome: c.nome, primeiro: c.primeiro, iniciais: c.iniciais, turmaId: c.turmaId, turma: c.turma, serie: c.serie, escola: c.escola, matricula: c.matricula, novo: true } : LUCAS
}
export function professorDaSessao(): ProfessorAtual {
  const id = fatiaSessao.ler().professorId
  if (id === 'camila') return CAMILA
  const p = professorPorSessao(id)
  if (!p) return CAMILA
  return {
    id, profId: p.id, nome: p.nome, primeiro: p.nome.split(' ')[0], iniciais: iniciaisDe(p.nome), disciplina: p.disciplina,
    papel: `${p.tratamento === 'professora' ? 'Professora' : 'Professor'} · ${p.disciplina}`, escolas: ['aurora'], novo: !!p.criado,
  }
}

export const sessao = {
  /** Troca o aluno da sessão. Um id que não existe (ainda) é ignorado. */
  entrarComoAluno(id: string) {
    if (id === 'lucas' || contaDeAluno(id)) sessaoBase.entrarComoAluno(id)
  },
  /** Troca o professor da sessão. Um id que não existe (ainda) é ignorado. */
  entrarComoProfessor(id: string) {
    if (id === 'camila' || professorPorSessao(id)) sessaoBase.entrarComoProfessor(id)
  },
  /** Marca o primeiro acesso com a onça como visto (uma vez por aluno). */
  verOnboarding: sessaoBase.verOnboarding,
  /** Marca a introdução do papel como vista (uma vez por pessoa); registra o evento da primeira vez. */
  verIntroducao,
  /** Marca uma novidade como aberta: o selo NOVO dela some. */
  marcarVisto: sessaoBase.marcarVisto,
}

/* ── A introdução de cada papel (13ª rodada; plano de painéis e introdução, seções 2.1 e 2.2) ─────────────────
   Uma vez por pessoa. A chave é "papel:pessoa"; a pessoa padrão é a da sessão (aluno e professor), 'helena'
   (coordenação), 'secretaria' (rede) e 'equipe' (operação). No aluno, "vista" também vale para o primeiro acesso
   antigo (`onboarding`), e marcar vista mantém o evento `onboarding-visto` que o Mapa e `entrar()` usam. Nos outros
   papéis, marcar vista registra `introducao-vista` { papel, pessoa }, com quem fez explícito. */

export type PapelIntroducao = 'aluno' | 'professor' | 'coordenacao' | 'rede' | 'operacao'

function pessoaPadrao(papel: PapelIntroducao, s: { alunoId: string; professorId: string }): string {
  if (papel === 'aluno') return s.alunoId
  if (papel === 'professor') return s.professorId
  if (papel === 'coordenacao') return 'helena'
  if (papel === 'rede') return 'secretaria'
  return 'equipe'
}

const SECRETARIA: QuemFez = { nome: 'Secretaria Municipal de Educação de Joinville', papel: 'rede' }
const EQUIPE: QuemFez = { nome: 'Equipe Turmma', papel: 'operacao' }

function quemDaIntroducao(papel: PapelIntroducao, pessoa: string): QuemFez {
  if (papel === 'professor') {
    const p = pessoa === 'camila' ? undefined : professorPorSessao(pessoa)
    return { nome: p?.nome ?? (pessoa === 'camila' ? CAMILA.nome : professorDaSessao().nome), papel: 'professor' }
  }
  if (papel === 'coordenacao') return { nome: 'Helena Martins', papel: 'coordenacao' }
  if (papel === 'rede') return SECRETARIA
  return EQUIPE
}

/** A introdução deste papel (e pessoa) já foi vista? Fora do React: a verificação decide o destino com isto. */
export function introducaoVista(papel: PapelIntroducao, pessoaId?: string): boolean {
  const s = fatiaSessao.ler()
  const pessoa = pessoaId ?? pessoaPadrao(papel, s)
  return !!s.introducoes?.[`${papel}:${pessoa}`] || (papel === 'aluno' && !!s.onboarding[pessoa])
}

/** A mesma pergunta, como hook. */
export function useIntroducaoVista(papel: PapelIntroducao, pessoaId?: string): boolean {
  const s = fatiaSessao.useValor()
  const pessoa = pessoaId ?? pessoaPadrao(papel, s)
  return !!s.introducoes?.[`${papel}:${pessoa}`] || (papel === 'aluno' && !!s.onboarding[pessoa])
}

function verIntroducao(papel: PapelIntroducao, pessoaId?: string) {
  const pessoa = pessoaId ?? pessoaPadrao(papel, fatiaSessao.ler())
  const primeira = sessaoBase.verIntroducao(`${papel}:${pessoa}`)
  if (papel === 'aluno') { sessaoBase.verOnboarding(pessoa); return }
  if (primeira) registrar('introducao-vista', { papel, pessoa }, quemDaIntroducao(papel, pessoa))
}

export function useOnboardingVisto(alunoId?: string): boolean {
  const s = fatiaSessao.useValor()
  return !!s.onboarding[alunoId ?? s.alunoId]
}

/** A novidade desta chave já foi aberta? (o selo NOVO aparece enquanto for false) */
export function useVisto(chave: string): boolean {
  return !!fatiaSessao.useValor().vistos[chave]
}

/** Todas as novidades abertas (para listas que precisam de muitas chaves de uma vez). */
export function useVistos(): Record<string, true> {
  return fatiaSessao.useValor().vistos
}

/* ── Quem fez um evento, quando a ação não diz ─────────────────────────────────────────────────────────── */

const DO_ALUNO: TipoEvento[] = ['tarefa-respondida', 'tarefa-entregue', 'leitura-feita', 'prova-saida', 'revisao-pedida', 'assunto-delicado', 'onboarding-visto']
const DO_PROFESSOR: TipoEvento[] = [
  'pedidos-decididos', 'turma-confirmada', 'turma-contestada', 'acesso-gerado', 'acesso-revogado', 'documento-gerado', 'documento-enviado',
  'documento-recusado', 'adaptada-gerada', 'notas-aprovadas', 'notas-recusadas', 'revisao-respondida', 'sinal-visto', 'sinal-contestado',
  'atencao-vista', 'conversa-aberta',
]
const DA_OPERACAO: TipoEvento[] = ['escola-criada', 'convite-coordenacao']

definirQuemPadrao((tipo): QuemFez => {
  if (DO_ALUNO.includes(tipo)) return { nome: alunoDaSessao().nome, papel: 'aluno' }
  if (DO_PROFESSOR.includes(tipo)) return { nome: professorDaSessao().nome, papel: 'professor' }
  if (DA_OPERACAO.includes(tipo)) return { nome: 'Equipe Turmma', papel: 'operacao' }
  return { nome: 'Helena Martins', papel: 'coordenacao' as PapelEvento }
})
