import { useMemo } from 'react'
import {
  ALOCACOES, PROFESSORES, TURMAS_DA_ESCOLA,
  type Alocacao, type Contestacao, type EstadoDoProfessor, type ProfessorDaEscola, type TurmaDaEscola,
} from './estrutura'
import { MATERIAIS } from './escola'
import { agora, criarFatia, registrar } from './demo/nucleo'
import { sessaoBase } from './demo/sessao-base'
import { fatiaTurmasCriadas, turmaPorId } from './demo/turmas-base'
import { listaDe, pedidosEsperando, useEstadoAcesso } from './acesso'

/* A ESCOLA, COMO ELA ESTÁ AGORA (12ª rodada, 04/10/2026; plano de polimento, seção 4.2).

   O que a coordenação monta e muda, numa fonte só (antes: dois depósitos em `coordenacao/_estrutura-pecas.tsx`,
   um em `Material.tsx` e outro em `Adaptacoes.tsx`, que não conversavam com o professor):
   · TURMAS: as 22 de sempre e as criadas na demonstração, com as contagens vivas (nomes, pedidos, livres, professores);
   · PROFESSORES e CONVITES: convidar (o link aparece uma vez), refazer, revogar, aceitar (cria a sessão do professor)
     e encerrar o vínculo. O convite de sempre, `t9KQ2xLmP4aR`, continua sendo o da Camila;
   · ALOCAÇÕES (professor × turma × disciplina): nascem pendentes; o professor confirma ou contesta; a coordenação
     corrige ou acrescenta (D3);
   · MATERIAL (só com licença, D5), ADAPTAÇÕES (a forma, nunca o diagnóstico, D35), EQUIPE com as atribuições
     "Recebe risco à vida" e "Atende o titular" (D78) e o ENCARREGADO de dados (LGPD, art. 41 — lei).
   Os dados iniciais são COPIADOS das telas (sem editar as telas). 100% sintético. */

/* ── Tipos ─────────────────────────────────────────────────────────────────────────────────────────────── */

export type ProfessorEstado = ProfessorDaEscola & {
  /** a disciplina principal (o convite pede uma) */
  disciplina: string
  email?: string
  /** o token do convite que vale agora */
  token?: string
  /** "25/09", a validade do convite em aberto */
  ate?: string
  /** o id da sessão quando a pessoa entra como professor ("camila", "marcos") */
  sessaoId?: string
  /** "professora" ou "professor", para o papel na lateral */
  tratamento: 'professora' | 'professor'
  /** nasceu na demonstração */
  criado?: boolean
}

export type AlocacaoEstado = Alocacao & { professorId: string }

export type EstadoIngestao = 'pronto' | 'processando' | 'falhou' | 'recusado'
export type Fonte = {
  id: string; titulo: string; capitulo: string; paginas: number; titular: string; licenca: string
  estado: EstadoIngestao; trechos: number; falha?: string; retirado?: { motivo: string; quando: string }
}

export type Adaptacao = { turmaId: string; aluno: string; tipos: string[]; validade: string; por: string }

export type Atribuicao = 'risco' | 'titular'
export type MembroEquipe = { id: string; nome: string; papel: string; email?: string; atribuicoes: Atribuicao[]; convidado?: boolean }

export type Encarregado = { nome: string; contato: string; quando: string }

type EstadoEscola = {
  professores: ProfessorEstado[]
  alocacoes: AlocacaoEstado[]
  material: Fonte[]
  adaptacoes: Adaptacao[]
  equipe: MembroEquipe[]
  encarregado: Encarregado | null
}

/* ── O começo (copiado das telas) ──────────────────────────────────────────────────────────────────────── */

const EMAIL: Record<string, string> = {
  'p-camila': 'camila.souza@colegioaurora.example', 'p-rafael': 'rafael.antunes@colegioaurora.example',
  'p-paulo': 'paulo.ribeiro@colegioaurora.example', 'p-silvia': 'silvia.moraes@colegioaurora.example',
  'p-marta': 'marta.figueiredo@colegioaurora.example', 'p-jonas': 'jonas.barreto@colegioaurora.example',
  'p-renata': 'renata.lopes@colegioaurora.example',
}
const TRATAMENTO: Record<string, ProfessorEstado['tratamento']> = {
  'p-camila': 'professora', 'p-rafael': 'professor', 'p-paulo': 'professor', 'p-silvia': 'professora',
  'p-marta': 'professora', 'p-jonas': 'professor', 'p-renata': 'professora',
}
const TOKEN: Record<string, string> = { 'p-camila': 't9KQ2xLmP4aR', 'p-marta': 'Mf3pTq8zRw2K', 'p-jonas': 'Jb7vNc2xLk9P' }

const PROFESSORES_INICIAIS: ProfessorEstado[] = PROFESSORES.map((p) => ({
  ...p, disciplina: p.disciplinas.split(',')[0].trim(), email: EMAIL[p.id], token: TOKEN[p.id], tratamento: TRATAMENTO[p.id] ?? 'professor',
  ate: p.id === 'p-marta' ? '25/09' : undefined, sessaoId: p.id === 'p-camila' ? 'camila' : undefined,
}))

const MATERIAL_INICIAL: Fonte[] = [
  { id: 'bio', titulo: 'Biologia 1 — Caderno do professor', capitulo: 'cap. 2 · Citologia', paginas: 164, titular: 'Colégio Aurora',
    licenca: 'Material próprio da escola', estado: 'falhou', trechos: 0, falha: 'páginas 40 a 72 sem texto' },
  ...MATERIAIS.map((m) => ({ ...m, estado: m.estado as EstadoIngestao })),
]

/* O 2ºB tem 3 alunos com adaptação: é para eles que vai a versão adaptada da prova que a professora aprova. */
const ADAPTACOES_INICIAIS: Adaptacao[] = [
  { turmaId: '2b', aluno: 'Daniela Rocha', tipos: ['fonte'], validade: 'Ano letivo de 2026', por: 'Helena Martins · 10/02' },
  { turmaId: '2b', aluno: 'Heitor Alves', tipos: ['fonte', 'direto'], validade: 'Ano letivo de 2026', por: 'Helena Martins · 10/02' },
  { turmaId: '2b', aluno: 'Nicolas Dias', tipos: ['fonte', 'tempo'], validade: 'Ano letivo de 2026', por: 'Helena Martins · 10/02' },
  { turmaId: '1c', aluno: 'Renan Coelho', tipos: ['direto', 'menos'], validade: 'Até 11/12/2026', por: 'Helena Martins · 03/08' },
  { turmaId: 'au-9a', aluno: 'Tainá Borges', tipos: ['escrita'], validade: 'Ano letivo de 2026', por: 'Helena Martins · 12/02' },
]

const EQUIPE_INICIAL: MembroEquipe[] = [
  { id: 'helena', nome: 'Helena Martins', papel: 'Coordenação pedagógica', email: 'helena.martins@colegioaurora.example', atribuicoes: ['risco', 'titular'] },
]

const fatia = criarFatia<EstadoEscola>('escola', {
  professores: PROFESSORES_INICIAIS,
  alocacoes: ALOCACOES.map((a) => ({ ...a, professorId: a.professorId ?? '' })),
  material: MATERIAL_INICIAL,
  adaptacoes: ADAPTACOES_INICIAIS,
  equipe: EQUIPE_INICIAL,
  encarregado: null,
})

const COORDENACAO = { nome: 'Helena Martins', papel: 'coordenacao' as const }
const hojeCurto = () => agora().dia
const VALIDADE = '28/09'

function sortearToken(n = 12) {
  const alfabeto = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const b = new Uint8Array(n)
  try { crypto.getRandomValues(b) } catch { for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256) }
  return Array.from(b, (x) => alfabeto[x % alfabeto.length]).join('')
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/* ── Turmas ────────────────────────────────────────────────────────────────────────────────────────────── */

export type TurmaViva = TurmaDaEscola & {
  /** professores com a alocação confirmada */
  confirmados: number
  /** os professores da turma, com o estado da alocação */
  professores: { profId: string; nome: string; disciplina: string; estado: Alocacao['estado'] }[]
  /** quantos alunos têm adaptação registrada */
  adaptacoes: number
  criada?: boolean
}

function contar(t: TurmaDaEscola, e: EstadoEscola, criada: boolean): TurmaViva {
  const lista = listaDe(t.id)
  const temLista = lista.length > 0
  const aloc = e.alocacoes.filter((a) => a.turmaId === t.id && a.estado !== 'encerrado')
  return {
    ...t,
    nomes: lista.length,
    livres: lista.filter((n) => n.estado === 'livre').length,
    pedidos: pedidosEsperando(t.id).length,
    listaEm: temLista ? t.listaEm ?? hojeCurto() : undefined,
    confirmados: aloc.filter((a) => a.estado === 'confirmado').length,
    professores: aloc.map((a) => ({ profId: a.professorId, nome: a.professor, disciplina: a.disciplina, estado: a.estado })),
    adaptacoes: e.adaptacoes.filter((x) => x.turmaId === t.id).length,
    criada,
  }
}

/** As turmas da escola com as contagens vivas (nomes, pedidos, livres, professores confirmados). */
export function useTurmasDaEscola(): TurmaViva[] {
  const e = fatia.useValor()
  const criadas = fatiaTurmasCriadas.useValor()
  const acesso = useEstadoAcesso() // relê quando um pedido chega ou uma lista é gravada
  return useMemo(() => {
    void acesso
    return [...TURMAS_DA_ESCOLA.map((t) => contar(t, e, false)), ...criadas.map((t) => contar(t, e, true))]
  }, [e, criadas, acesso])
}

/** Uma turma viva pelo id. */
export function useTurmaDaEscola(id: string): TurmaViva | undefined {
  const todas = useTurmasDaEscola()
  return todas.find((t) => t.id === id)
}

export const turmas = {
  /** Cria a turma no ano em curso, sem lista. */
  criar({ nome, serie, turno }: { nome: string; serie: string; turno: 'Manhã' | 'Tarde' }): TurmaDaEscola {
    const id = `au-${slug(nome).replace(/-/g, '')}${fatiaTurmasCriadas.ler().length ? `-${fatiaTurmasCriadas.ler().length + 1}` : ''}`
    const t: TurmaDaEscola = { id, nome: nome.trim(), serie, turno, nomes: 0, pedidos: 0, livres: 0 }
    fatiaTurmasCriadas.mudar((l) => [...l, t])
    registrar('turma-criada', { turmaId: id, nome: t.nome }, COORDENACAO)
    return t
  },
}

/** Uma turma (de sempre ou criada) pelo id, fora do React. */
export const turmaDaEscolaPorId = turmaPorId

/* ── Professores e convites ────────────────────────────────────────────────────────────────────────────── */

export function useProfessoresDaEscola(): ProfessorEstado[] {
  return fatia.useValor().professores
}
export const professoresDaEscola = () => fatia.ler().professores
export const professorPorSessao = (sessaoId: string) => fatia.ler().professores.find((p) => p.sessaoId === sessaoId)

export type ConviteLido = {
  profId: string
  nome: string
  email: string
  disciplina: string
  turmas: string[]
  escola: string
  estado: 'valido' | 'vencido' | 'revogado' | 'aceito'
  /** a pessoa já tem conta (em outra escola, ou já aceitou): só aceita */
  contaExiste: boolean
  ate?: string
}

const tratamentoDe = (nome: string): ProfessorEstado['tratamento'] => (/a$/i.test(nome.trim().split(' ')[0]) ? 'professora' : 'professor')

export const convites = {
  /** Cadastra o professor, aloca nas turmas (pendente) e gera o convite. O link aparece uma vez. */
  convidarProfessor({ nome, email, disciplina, turmaIds }: { nome: string; email: string; disciplina: string; turmaIds: string[] }):
    { profId: string; token: string; link: string } {
    const e = fatia.ler()
    let profId = `p-${slug(nome.split(' ')[0])}`
    for (let i = 2; e.professores.some((p) => p.id === profId); i++) profId = `p-${slug(nome.split(' ')[0])}-${i}`
    const token = sortearToken()
    const prof: ProfessorEstado = {
      id: profId, nome: nome.trim(), estado: 'pendente', disciplinas: disciplina, disciplina, quando: `vale até ${VALIDADE}`,
      email: email.trim(), token, ate: VALIDADE, tratamento: tratamentoDe(nome), criado: true,
    }
    const novas: AlocacaoEstado[] = turmaIds.map((turmaId, i) => ({
      id: `v-${profId}-${i + 1}`, professorId: profId, professor: prof.nome, turmaId, turma: turmaPorId(turmaId)?.nome ?? turmaId,
      disciplina, estado: 'pendente', quando: `alocado em ${hojeCurto()} · convite em aberto`,
    }))
    fatia.mudar((x) => ({ ...x, professores: [...x.professores, prof], alocacoes: [...x.alocacoes, ...novas] }))
    registrar('professor-convidado', { profId, nome: prof.nome, disciplina, turmas: novas.map((a) => a.turma) }, COORDENACAO)
    return { profId, token, link: `/convite#${token}` }
  },
  /** Gera um link novo (o anterior deixa de valer). Também serve para o convite vencido. */
  refazer(profId: string): { token: string; link: string } {
    const token = sortearToken()
    fatia.mudar((x) => ({
      ...x, professores: x.professores.map((p) => (p.id === profId ? { ...p, token, ate: VALIDADE, estado: 'pendente', quando: `vale até ${VALIDADE}` } : p)),
    }))
    registrar('convite-refeito', { profId }, COORDENACAO)
    return { token, link: `/convite#${token}` }
  },
  revogar(profId: string) {
    fatia.mudar((x) => ({
      ...x, professores: x.professores.map((p) => (p.id === profId ? { ...p, token: undefined, estado: 'revogado', quando: `revogado em ${hojeCurto()}` } : p)),
    }))
    registrar('convite-revogado', { profId }, COORDENACAO)
  },
  /** O convite pelo token do link (`/convite#<token>`). */
  doToken(token: string): ConviteLido | null {
    const e = fatia.ler()
    const p = e.professores.find((x) => x.token === token)
    if (!p) return null
    const estado: ConviteLido['estado'] = p.estado === 'pendente' ? 'valido' : p.estado === 'vencido' ? 'vencido'
      : p.estado === 'revogado' || p.estado === 'desativado' ? 'revogado' : 'aceito'
    return {
      profId: p.id, nome: p.nome, email: p.email ?? '', disciplina: p.disciplina, escola: 'Colégio Aurora', ate: p.ate,
      turmas: e.alocacoes.filter((a) => a.professorId === p.id && a.estado !== 'encerrado').map((a) => a.turma),
      estado, contaExiste: !p.criado,
    }
  },
  /** Aceita o convite: o professor fica ativo, a sessão vira a dele e as turmas esperam a confirmação. Devolve o id. */
  aceitar(token: string, senha: string): string | null {
    void senha
    const p = fatia.ler().professores.find((x) => x.token === token)
    if (!p) return null
    const sessaoId = p.sessaoId ?? slug(p.nome.split(' ')[0])
    fatia.mudar((x) => ({
      ...x,
      professores: x.professores.map((y) => (y.id === p.id ? { ...y, estado: 'ativo' as EstadoDoProfessor, quando: `entrou em ${hojeCurto()}`, sessaoId } : y)),
      alocacoes: x.alocacoes.map((a) => (a.professorId === p.id && a.estado === 'pendente' ? { ...a, quando: `alocado em ${hojeCurto()}` } : a)),
    }))
    sessaoBase.entrarComoProfessor(sessaoId)
    registrar('convite-aceito', { profId: p.id, nome: p.nome }, { nome: p.nome, papel: 'professor' })
    return p.id
  },
  /** Encerra o vínculo do professor com a escola (as alocações acabam). */
  encerrarVinculo(profId: string) {
    fatia.mudar((x) => ({
      ...x,
      professores: x.professores.map((p) => (p.id === profId ? { ...p, estado: 'desativado', token: undefined, quando: `encerrado em ${hojeCurto()}` } : p)),
      alocacoes: x.alocacoes.map((a) => (a.professorId === profId && a.estado !== 'encerrado' ? { ...a, estado: 'encerrado', quando: `encerrado em ${hojeCurto()}` } : a)),
    }))
    registrar('equipe-mudou', { profId, encerrado: true }, COORDENACAO)
  },
}

/* ── Alocações ─────────────────────────────────────────────────────────────────────────────────────────── */

/** As alocações (de um professor, quando passado). */
export function useAlocacoes(profId?: string): AlocacaoEstado[] {
  const e = fatia.useValor()
  return useMemo(() => (profId ? e.alocacoes.filter((a) => a.professorId === profId) : e.alocacoes), [e, profId])
}
export const alocacoesDe = (profId?: string) => (profId ? fatia.ler().alocacoes.filter((a) => a.professorId === profId) : fatia.ler().alocacoes)

export const alocacoes = {
  /** O professor confirma a turma: ela abre para ele. */
  confirmar(alocId: string) {
    const a = fatia.ler().alocacoes.find((x) => x.id === alocId)
    if (!a || a.estado === 'confirmado') return
    fatia.mudar((x) => ({ ...x, alocacoes: x.alocacoes.map((y) => (y.id === alocId ? { ...y, estado: 'confirmado', quando: `confirmou em ${hojeCurto()}`, contestacao: undefined } : y)) }))
    registrar('turma-confirmada', { alocId, turmaId: a.turmaId, turma: a.turma, profId: a.professorId }, { nome: a.professor, papel: 'professor' })
  },
  /** O professor diz que a turma não é dele: vai para a coordenação corrigir. */
  contestar(alocId: string, motivo: Contestacao, complemento?: string) {
    const a = fatia.ler().alocacoes.find((x) => x.id === alocId)
    if (!a) return
    fatia.mudar((x) => ({
      ...x, alocacoes: x.alocacoes.map((y) => (y.id === alocId ? { ...y, estado: 'contestado', quando: `avisou em ${hojeCurto()}`, contestacao: { motivo, complemento: complemento?.trim() || undefined } } : y)),
    }))
    registrar('turma-contestada', { alocId, turmaId: a.turmaId, turma: a.turma, profId: a.professorId, motivo }, { nome: a.professor, papel: 'professor' })
  },
  /** A coordenação corrige a turma: a alocação antiga acaba e nasce outra, pendente, que o professor confirma. */
  corrigir(alocId: string, turmaId: string, disciplina?: string): string | null {
    const a = fatia.ler().alocacoes.find((x) => x.id === alocId)
    if (!a) return null
    const id = `v-${Date.now().toString(36)}`
    const nova: AlocacaoEstado = {
      id, professorId: a.professorId, professor: a.professor, turmaId, turma: turmaPorId(turmaId)?.nome ?? turmaId,
      disciplina: disciplina ?? a.disciplina, estado: 'pendente', quando: `corrigida em ${hojeCurto()}`,
    }
    fatia.mudar((x) => ({
      ...x, alocacoes: [...x.alocacoes.map((y) => (y.id === alocId ? { ...y, estado: 'encerrado' as const, quando: `corrigida em ${hojeCurto()}` } : y)), nova],
    }))
    registrar('alocacao-corrigida', { de: alocId, para: id, turmaId, turma: nova.turma, profId: a.professorId }, COORDENACAO)
    return id
  },
  /** A coordenação põe o professor em mais uma turma (pendente). */
  acrescentar(profId: string, turmaId: string, disciplina: string): string {
    const p = fatia.ler().professores.find((x) => x.id === profId)
    const id = `v-${Date.now().toString(36)}`
    const nova: AlocacaoEstado = {
      id, professorId: profId, professor: p?.nome ?? profId, turmaId, turma: turmaPorId(turmaId)?.nome ?? turmaId,
      disciplina, estado: 'pendente', quando: `alocado em ${hojeCurto()}`,
    }
    fatia.mudar((x) => ({ ...x, alocacoes: [...x.alocacoes, nova] }))
    registrar('turma-acrescentada', { alocId: id, turmaId, turma: nova.turma, profId }, COORDENACAO)
    return id
  },
}

/* ── Material ──────────────────────────────────────────────────────────────────────────────────────────── */

export function useMaterial(): Fonte[] {
  return fatia.useValor().material
}

export const material = {
  /** Só chega aqui o que tem dono e licença (D5): sem licença, o envio é recusado antes de sair do computador. */
  enviar(f: Omit<Fonte, 'id' | 'estado' | 'trechos'> & { id?: string }) {
    const nova: Fonte = { ...f, id: f.id ?? `m-${Date.now().toString(36)}`, estado: 'processando', trechos: 0 }
    fatia.mudar((x) => ({ ...x, material: [nova, ...x.material] }))
    registrar('material-enviado', { id: nova.id, titulo: nova.titulo }, COORDENACAO)
    window.setTimeout(() => {
      fatia.mudar((x) => ({ ...x, material: x.material.map((m) => (m.id === nova.id && m.estado === 'processando' ? { ...m, estado: 'pronto', trechos: 640, capitulo: m.capitulo === 'na fila de leitura' ? 'lido agora' : m.capitulo } : m)) }))
    }, 2000)
    return nova.id
  },
  /** Envia outra versão do arquivo que não carregou: lendo, e pronto em 2 segundos. */
  reenviar(id: string) {
    fatia.mudar((x) => ({ ...x, material: x.material.map((m) => (m.id === id ? { ...m, estado: 'processando', falha: undefined } : m)) }))
    registrar('material-reenviado', { id }, COORDENACAO)
    window.setTimeout(() => {
      fatia.mudar((x) => ({ ...x, material: x.material.map((m) => (m.id === id && m.estado === 'processando' ? { ...m, estado: 'pronto', trechos: 1420 } : m)) }))
    }, 2000)
  },
  /** Tira do uso, com motivo (ECA Digital, arts. 29 e 30 — lei). */
  retirar(id: string, motivo: string) {
    fatia.mudar((x) => ({ ...x, material: x.material.map((m) => (m.id === id ? { ...m, retirado: { motivo, quando: agora().rotulo } } : m)) }))
    registrar('material-retirado', { id, motivo }, COORDENACAO)
  },
}

/* ── Adaptações ────────────────────────────────────────────────────────────────────────────────────────── */

export function useAdaptacoes(turmaId?: string): Adaptacao[] {
  const e = fatia.useValor()
  return useMemo(() => (turmaId ? e.adaptacoes.filter((a) => a.turmaId === turmaId) : e.adaptacoes), [e, turmaId])
}
export const adaptacoesDe = (turmaId?: string) => (turmaId ? fatia.ler().adaptacoes.filter((a) => a.turmaId === turmaId) : fatia.ler().adaptacoes)

export const adaptacoes = {
  registrar({ turmaId, aluno, tipos, validade }: { turmaId: string; aluno: string; tipos: string[]; validade: string }) {
    const nova: Adaptacao = { turmaId, aluno, tipos, validade, por: `Helena Martins · ${hojeCurto()}` }
    fatia.mudar((x) => ({ ...x, adaptacoes: [...x.adaptacoes.filter((a) => !(a.turmaId === turmaId && a.aluno === aluno)), nova] }))
    registrar('adaptacao-registrada', { turmaId, aluno, tipos }, COORDENACAO)
  },
  encerrar(turmaId: string, aluno: string) {
    fatia.mudar((x) => ({ ...x, adaptacoes: x.adaptacoes.filter((a) => !(a.turmaId === turmaId && a.aluno === aluno)) }))
    registrar('adaptacao-encerrada', { turmaId, aluno }, COORDENACAO)
  },
}

/* ── Equipe e encarregado ──────────────────────────────────────────────────────────────────────────────── */

export function useEquipe(): MembroEquipe[] {
  return fatia.useValor().equipe
}
/** Alguém da equipe recebe o encaminhamento de risco à vida? Sem ninguém, o Tutor fica desligado. */
export const temQuemRecebeRisco = () => fatia.ler().equipe.some((m) => m.atribuicoes.includes('risco'))
export function useTemQuemRecebeRisco(): boolean {
  return fatia.useValor().equipe.some((m) => m.atribuicoes.includes('risco'))
}

export const equipe = {
  atribuir(membroId: string, atribuicao: Atribuicao, ligado: boolean) {
    fatia.mudar((x) => ({
      ...x, equipe: x.equipe.map((m) => (m.id !== membroId ? m : {
        ...m, atribuicoes: ligado ? [...new Set([...m.atribuicoes, atribuicao])] : m.atribuicoes.filter((a) => a !== atribuicao),
      })),
    }))
    registrar('equipe-mudou', { membroId, atribuicao, ligado }, COORDENACAO)
  },
  convidar({ nome, email, papel = 'Gestão' }: { nome: string; email: string; papel?: string }) {
    const id = slug(nome) || `m-${Date.now().toString(36)}`
    fatia.mudar((x) => ({ ...x, equipe: [...x.equipe, { id, nome: nome.trim(), email: email.trim(), papel, atribuicoes: [], convidado: true }] }))
    registrar('equipe-mudou', { membroId: id, convidado: true }, COORDENACAO)
  },
}

export function useEncarregado(): Encarregado | null {
  return fatia.useValor().encarregado
}

export const encarregado = {
  /** Indica o encarregado de dados (LGPD, art. 41 — lei): aparece na página da escola e no dossiê. */
  definir({ nome, contato }: { nome: string; contato: string }) {
    fatia.mudar((x) => ({ ...x, encarregado: { nome: nome.trim(), contato: contato.trim(), quando: agora().rotulo } }))
    registrar('encarregado-indicado', { nome: nome.trim() }, COORDENACAO)
  },
}

/** Leitura da escola inteira fora do React (para a fila e a sessão). */
export const lerEscola = () => fatia.ler()
export const useEscolaEstado = () => fatia.useValor()
