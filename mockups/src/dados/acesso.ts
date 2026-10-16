import { useMemo } from 'react'
import { alunosDa, type Aluno } from './alunos'
import {
  CODIGO_DO_2B, ESCOLA_SLUG, listaDa, pedidosDa, TURMAS_DA_ESCOLA,
  type EstadoDoNome, type NomeDaLista, type ValidadeDoAcesso,
} from './estrutura'
import { agora, criarFatia, registrar, type QuemFez } from './demo/nucleo'
import { fatiaSessao, sessaoBase } from './demo/sessao-base'
import { fatiaTurmasCriadas, turmaPorId } from './demo/turmas-base'

/* O CAMINHO DE ENTRADA DO ALUNO (12ª rodada, 04/10/2026; plano de polimento, seções 4.2 e 6, F1).

   O que antes morava em três lugares que não conversavam (a memória da página pública, o painel do professor e o
   depósito da coordenação) agora mora aqui:
   · o ACESSO de cada turma: o código de 8 letras e o link, com validade; o 2ºB nasce com K7M2QX9B valendo;
     "gerar" usa o MESMO sorteio de `ConvidarAlunos.tsx` (semente por turma e versão); "revogar" derruba na hora;
   · as LISTAS: as de sempre (`listaDa`) e as que a coordenação grava na demonstração (o 3ºA);
   · os PEDIDOS de nome: o aluno pede (página pública), o professor da turma decide (ou a coordenação, só quando a
     turma não tem professor confirmado), e o aprovado vira CONTA de aluno;
   · a ENTRADA da escola (`entrar`), que responde ok, "esperando" ou erro.
   Aluno não tem e-mail, CPF, foto nem data de nascimento: nome, matrícula e a senha que ele criou (regra 20, item 2).
   100% sintético. No produto, nada disto mora no navegador. */

/* ── Tipos ─────────────────────────────────────────────────────────────────────────────────────────────── */

export type AcessoTurma = {
  turmaId: string
  versao: number
  dias: ValidadeDoAcesso
  /** "sexta, 25/09" */
  ate: string
  /** 8 letras e números, sem 0/O nem 1/I */
  codigo: string
  token: string
  /** o link da sala, para copiar e mandar */
  link: string
  /** gerado na demonstração (não é o de sempre) */
  novo: boolean
}

export type EstadoPedido = 'esperando' | 'aprovado' | 'recusado'

export type PedidoNome = {
  id: string
  turmaId: string
  nomeId: string
  nome: string
  matricula: string
  senha?: string
  /** "hoje, 10h38" */
  quando: string
  /** houve tentativa com matrícula diferente da lista */
  matriculaErrada: boolean
  estado: EstadoPedido
  decididoPor?: string
  decididoEm?: string
}

export type ContaAluno = {
  id: string
  nome: string
  primeiro: string
  iniciais: string
  turmaId: string
  turma: string
  serie: string
  escola: string
  matricula: string
  senha?: string
  novo: true
  criadaEm: string
}

type EstadoAcesso = {
  acessos: Record<string, { versao: number; dias: ValidadeDoAcesso; ate: string; revogado?: boolean }>
  /** listas gravadas ou mudadas na demonstração (substituem a de sempre) */
  listas: Record<string, NomeDaLista[]>
  /** o estado de cada nome quando muda: turma → nome → estado */
  estados: Record<string, Record<string, EstadoDoNome>>
  pedidos: PedidoNome[]
  contas: ContaAluno[]
}

/* ── O sorteio do código (o mesmo de professor/abas-turma/ConvidarAlunos.tsx) ─────────────────────────── */

const SEM_CONFUSAO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ALFABETO_DO_LINK = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function sorteio(semente: string, versao: number, tamanho: number, alfabeto: string) {
  let a = [...semente].reduce((n, c) => (n * 31 + c.charCodeAt(0)) | 0, 7) + versao * 2654435761
  return Array.from({ length: tamanho }, () => { a = (Math.imul(a ^ (a >>> 15), 0x2C1B3C6D) + 0x6D2B79F5) | 0; return alfabeto[(a >>> 8) % alfabeto.length] }).join('')
}

const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
const dois = (n: number) => String(n).padStart(2, '0')
/** "sexta, 25/09": hoje (21/09) mais `dias`. */
function ateQuando(dias: number, de = new Date(2026, 8, 21)) {
  const d = new Date(de.getFullYear(), de.getMonth(), de.getDate() + dias)
  return `${SEMANA[d.getDay()]}, ${dois(d.getDate())}/${dois(d.getMonth() + 1)}`
}

function montarAcesso(turmaId: string, a: { versao: number; dias: ValidadeDoAcesso; ate: string }): AcessoTurma {
  const codigo = a.versao === 0 && turmaId === '2b' ? CODIGO_DO_2B : sorteio(`codigo-${turmaId}`, a.versao, 8, SEM_CONFUSAO)
  const token = sorteio(`token-${turmaId}`, a.versao, 12, ALFABETO_DO_LINK)
  return { turmaId, versao: a.versao, dias: a.dias, ate: a.ate, codigo, token, link: `${typeof window === 'undefined' ? 'https://turmma.com' : window.location.origin}/e/${ESCOLA_SLUG}/turma#${token}`, novo: a.versao > 0 }
}

/* ── O estado inicial ──────────────────────────────────────────────────────────────────────────────────── */

/** Os pedidos que já esperam no começo: os do 2ºB, 2ºA e 1ºC (professora Camila) e os 2 do 6ºB (sem professor). */
function pedidosIniciais(): PedidoNome[] {
  return TURMAS_DA_ESCOLA.filter((t) => t.pedidos > 0).flatMap((t) => {
    const lista = listaDa(t.id)
    return pedidosDa(t.id).map((p, i): PedidoNome => {
      const n = lista.find((x) => x.nome === p.nome)
      return {
        id: `ped-${t.id}-${i + 1}`, turmaId: t.id, nomeId: n?.id ?? `${t.id}-${p.nome}`, nome: p.nome, matricula: n?.matricula ?? '',
        quando: p.quando, matriculaErrada: p.matriculaErrada, estado: 'esperando',
      }
    })
  })
}

const INICIAL: EstadoAcesso = {
  acessos: {
    '2b': { versao: 0, dias: 7, ate: ateQuando(4) },
    '2a': { versao: 0, dias: 7, ate: ateQuando(4) },
    '1c': { versao: 0, dias: 7, ate: ateQuando(4) },
    '9a': { versao: 0, dias: 7, ate: ateQuando(4) },
  },
  listas: {},
  estados: {},
  pedidos: pedidosIniciais(),
  contas: [],
}

const fatia = criarFatia<EstadoAcesso>('acesso', INICIAL)

/** O estado inteiro (para quem conta nomes e pedidos de todas as turmas de uma vez). */
export const useEstadoAcesso = () => fatia.useValor()

/* ── Leituras ──────────────────────────────────────────────────────────────────────────────────────────── */

function listaViva(e: EstadoAcesso, turmaId: string): NomeDaLista[] {
  const base = e.listas[turmaId] ?? (fatiaTurmasCriadas.ler().some((t) => t.id === turmaId) ? [] : listaDa(turmaId))
  const ov = e.estados[turmaId]
  return ov ? base.map((n) => (ov[n.id] ? { ...n, estado: ov[n.id] } : n)) : base
}

function acessoVivo(e: EstadoAcesso, turmaId: string): AcessoTurma | null {
  const a = e.acessos[turmaId]
  return a && !a.revogado ? montarAcesso(turmaId, a) : null
}

/** O acesso que vale agora numa turma; null quando não há (turma nova ou revogado). */
export function useAcesso(turmaId: string): AcessoTurma | null {
  const e = fatia.useValor()
  return useMemo(() => acessoVivo(e, turmaId), [e, turmaId])
}

/** Leitura fora do React. */
export const acessoDe = (turmaId: string) => acessoVivo(fatia.ler(), turmaId)

/** A lista de nomes da turma, com o estado vivo de cada nome. */
export function useLista(turmaId: string): NomeDaLista[] {
  const e = fatia.useValor()
  const criadas = fatiaTurmasCriadas.useValor()
  return useMemo(() => { void criadas; return listaViva(e, turmaId) }, [e, criadas, turmaId])
}

export const listaDe = (turmaId: string) => listaViva(fatia.ler(), turmaId)

/** Os pedidos que ESPERAM: de uma turma, ou de todas. */
export function usePedidos(turmaId?: string): PedidoNome[] {
  const e = fatia.useValor()
  return useMemo(() => e.pedidos.filter((p) => p.estado === 'esperando' && (!turmaId || p.turmaId === turmaId)), [e, turmaId])
}

/** Todos os pedidos (inclusive os decididos), para quem precisa do histórico. */
export function useTodosOsPedidos(): PedidoNome[] {
  return fatia.useValor().pedidos
}

export const pedidosEsperando = (turmaId?: string) => fatia.ler().pedidos.filter((p) => p.estado === 'esperando' && (!turmaId || p.turmaId === turmaId))

/** As contas de aluno criadas na demonstração (aprovadas). */
export function useContasDeAluno(): ContaAluno[] {
  return fatia.useValor().contas
}
export const contaDeAluno = (id: string) => fatia.ler().contas.find((c) => c.id === id)

export type AlunoDaTurma = {
  /** o id do nome na lista */
  id: string
  nome: string
  matricula: string
  situacao: 'na-turma' | 'pediu' | 'livre'
  /** o aluno com notas e habilidades, quando a turma tem (2ºB, 2ºA, 1ºC, 9ºA) */
  aluno?: Aluno
  /** a conta criada na demonstração, quando o pedido foi aprovado aqui */
  contaId?: string
}

const SITUACAO: Record<EstadoDoNome, AlunoDaTurma['situacao']> = { aprovado: 'na-turma', reivindicado: 'pediu', livre: 'livre' }

/** Os nomes da turma com a situação de cada um ("26 de 32 entraram"). */
export function useAlunosDaTurma(turmaId: string): AlunoDaTurma[] {
  const e = fatia.useValor()
  const criadas = fatiaTurmasCriadas.useValor()
  return useMemo(() => {
    void criadas
    const ricos = alunosDa(turmaId)
    return listaViva(e, turmaId).map((n) => ({
      id: n.id, nome: n.nome, matricula: n.matricula, situacao: SITUACAO[n.estado],
      aluno: ricos.find((a) => a.nome === n.nome),
      contaId: e.contas.find((c) => c.turmaId === turmaId && c.matricula === n.matricula)?.id,
    }))
  }, [e, criadas, turmaId])
}

/* ── Ações ─────────────────────────────────────────────────────────────────────────────────────────────── */

const normalizar = (c: string) => c.replace(/[\s-]+/g, '').trim()

export const acessos = {
  /** Gera um acesso novo (o de antes deixa de valer na hora). */
  gerar(turmaId: string, dias: ValidadeDoAcesso = 7): AcessoTurma {
    const antes = fatia.ler().acessos[turmaId]
    const novo = { versao: antes ? antes.versao + 1 : 0, dias, ate: ateQuando(dias) }
    fatia.mudar((e) => ({ ...e, acessos: { ...e.acessos, [turmaId]: novo } }))
    registrar('acesso-gerado', { turmaId, dias })
    return montarAcesso(turmaId, novo)
  },
  /** Derruba o link e o código na hora, sem gerar outro. Os pedidos já feitos continuam esperando. */
  revogar(turmaId: string) {
    const a = fatia.ler().acessos[turmaId]
    if (!a || a.revogado) return
    fatia.mudar((e) => ({ ...e, acessos: { ...e.acessos, [turmaId]: { ...a, revogado: true } } }))
    registrar('acesso-revogado', { turmaId })
  },
  /** A turma de um código (ou do token do link) que vale agora; null se não vale. */
  turmaDoCodigo(codigo: string): string | null {
    const c = normalizar(codigo)
    if (!c) return null
    const e = fatia.ler()
    for (const turmaId of Object.keys(e.acessos)) {
      const a = acessoVivo(e, turmaId)
      if (a && (a.codigo === c.toUpperCase() || a.token === codigo.trim())) return turmaId
    }
    return null
  },
}

export type LinhaDeLista = { nome: string; matricula: string }

export const listas = {
  /** Grava a lista inteira da turma (a prévia já conferiu as linhas). Todos os nomes nascem livres. */
  gravar(turmaId: string, linhas: LinhaDeLista[]) {
    const lista: NomeDaLista[] = linhas.map((l, i) => ({ id: `${turmaId}-${i + 1}`, nome: l.nome.trim(), matricula: l.matricula.trim(), estado: 'livre' }))
    fatia.mudar((e) => ({ ...e, listas: { ...e.listas, [turmaId]: lista }, estados: { ...e.estados, [turmaId]: {} } }))
    registrar('lista-gravada', { turmaId, nomes: lista.length }, { nome: 'Helena Martins', papel: 'coordenacao' })
  },
  /** Acrescenta nomes à lista (a mesma matrícula não entra duas vezes). */
  acrescentar(turmaId: string, linhas: LinhaDeLista[]) {
    const e = fatia.ler()
    const atual = listaViva(e, turmaId)
    const novas = linhas.filter((l) => !atual.some((n) => n.matricula === l.matricula.trim()))
    if (!novas.length) return
    const proximo = atual.length
    const lista = [...atual, ...novas.map((l, i): NomeDaLista => ({ id: `${turmaId}-n${proximo + i + 1}`, nome: l.nome.trim(), matricula: l.matricula.trim(), estado: 'livre' }))]
    fatia.mudar((x) => ({ ...x, listas: { ...x.listas, [turmaId]: lista }, estados: { ...x.estados, [turmaId]: {} } }))
    registrar('lista-gravada', { turmaId, nomes: lista.length, acrescentados: novas.length }, { nome: 'Helena Martins', papel: 'coordenacao' })
  },
  /** Tira um nome LIVRE da lista. */
  retirar(turmaId: string, nomeId: string) {
    const atual = listaViva(fatia.ler(), turmaId)
    const n = atual.find((x) => x.id === nomeId)
    if (!n || n.estado !== 'livre') return
    fatia.mudar((x) => ({ ...x, listas: { ...x.listas, [turmaId]: atual.filter((y) => y.id !== nomeId) }, estados: { ...x.estados, [turmaId]: {} } }))
  },
}

const MATRICULA = /^2026-0\d{3}$/

/** A conta nasce com o primeiro nome como id ("alice"), para o `?como=alice` do Mapa. */
function idDaConta(nome: string, contas: ContaAluno[]) {
  const base = nome.split(' ')[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  let id = base
  for (let i = 2; contas.some((c) => c.id === id) || id === 'lucas'; i++) id = `${base}-${i}`
  return id
}

export const pedidos = {
  /** O aluno pede o próprio nome na página da turma. Na lista gravada na demonstração (o 3ºA), a matrícula tem de
      ser a da lista; nas turmas de sempre, vale a regra branda (qualquer 2026-0xxx que não seja de outro aluno). */
  pedir({ turmaId, nomeId, matricula, senha }: { turmaId: string; nomeId: string; matricula: string; senha: string }): 'ok' | 'nao-confere' | 'ja-pedido' {
    const e = fatia.ler()
    const lista = listaViva(e, turmaId)
    const n = lista.find((x) => x.id === nomeId)
    if (!n) return 'nao-confere'
    if (n.estado !== 'livre') return 'ja-pedido'
    const m = matricula.trim()
    const estrita = !!e.listas[turmaId]
    const igual = n.matricula === m
    const confere = igual || (!estrita && MATRICULA.test(m) && !lista.some((x) => x.id !== nomeId && x.matricula === m))
    if (!confere) return 'nao-confere'
    const pedido: PedidoNome = {
      id: `ped-${turmaId}-${Date.now().toString(36)}`, turmaId, nomeId, nome: n.nome, matricula: m, senha,
      quando: `hoje, ${agora().hora}`, matriculaErrada: !igual, estado: 'esperando',
    }
    fatia.mudar((x) => ({
      ...x, pedidos: [...x.pedidos, pedido],
      estados: { ...x.estados, [turmaId]: { ...(x.estados[turmaId] ?? {}), [nomeId]: 'reivindicado' } },
    }))
    registrar('pedido-nome', { turmaId, nome: n.nome, pedidoId: pedido.id }, { nome: n.nome, papel: 'aluno' })
    return 'ok'
  },

  /** Aprova ou recusa os pedidos marcados. O aprovado vira conta de aluno; o recusado volta a ficar livre.
      `por` diz quem decide: o professor da turma (o padrão) ou a coordenação (turma sem professor confirmado). */
  decidir(turmaId: string, ids: string[], decisao: 'aprovar' | 'recusar', por?: QuemFez) {
    const e = fatia.ler()
    const alvo = e.pedidos.filter((p) => ids.includes(p.id) && p.turmaId === turmaId && p.estado === 'esperando')
    if (!alvo.length) return
    const quando = agora().rotulo
    const t = turmaPorId(turmaId)
    const contas = [...e.contas]
    const estados = { ...(e.estados[turmaId] ?? {}) }
    for (const p of alvo) {
      estados[p.nomeId] = decisao === 'aprovar' ? 'aprovado' : 'livre'
      if (decisao === 'aprovar' && !contas.some((c) => c.turmaId === turmaId && c.matricula === p.matricula)) {
        const partes = p.nome.split(' ')
        contas.push({
          id: idDaConta(p.nome, contas), nome: p.nome, primeiro: partes[0], iniciais: (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase(),
          turmaId, turma: t?.nome ?? turmaId, serie: t?.serie ?? '', escola: 'Colégio Aurora', matricula: p.matricula, senha: p.senha,
          novo: true, criadaEm: quando,
        })
      }
    }
    fatia.mudar((x) => ({
      ...x, contas, estados: { ...x.estados, [turmaId]: estados },
      pedidos: x.pedidos.map((p) => (alvo.some((a) => a.id === p.id) ? { ...p, estado: decisao === 'aprovar' ? 'aprovado' : 'recusado', decididoEm: quando } : p)),
    }))
    registrar('pedidos-decididos', { turmaId, turma: t?.nome ?? turmaId, decisao, n: alvo.length, nomes: alvo.map((p) => p.nome) }, por)
  },
}

/** A entrada da escola (`/e/:escola`): matrícula e senha. */
export function entrar(matricula: string, senha: string):
  | { tipo: 'ok'; alunoId: string; primeiraVez: boolean }
  | { tipo: 'espera' }
  | { tipo: 'erro' } {
  const m = matricula.trim()
  const s = senha.trim()
  if (m === '2026-0412' && (s.length >= 8 || s === 'demonstracao')) {
    sessaoBase.entrarComoAluno('lucas')
    registrar('aluno-entrou', { alunoId: 'lucas' }, { nome: 'Lucas Pereira', papel: 'aluno' })
    return { tipo: 'ok', alunoId: 'lucas', primeiraVez: false }
  }
  const e = fatia.ler()
  const conta = e.contas.find((c) => c.matricula === m)
  if (conta && (conta.senha ? conta.senha === s : s.length >= 8)) {
    sessaoBase.entrarComoAluno(conta.id)
    registrar('aluno-entrou', { alunoId: conta.id }, { nome: conta.nome, papel: 'aluno' })
    return { tipo: 'ok', alunoId: conta.id, primeiraVez: !fatiaSessao.ler().onboarding[conta.id] }
  }
  if (e.pedidos.some((p) => p.estado === 'esperando' && p.matricula === m && (p.senha === undefined || p.senha === s))) return { tipo: 'espera' }
  return { tipo: 'erro' }
}
