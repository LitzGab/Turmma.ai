import { useMemo } from 'react'
import { alunosDa } from './alunos'
import { estadoDe, questoesDoDocumento, tipoDocumento, type ItemBiblioteca, type QuestaoDoc } from './biblioteca'
import { fatiaLotes, type Lote } from './demo/lotes-base'
import { TURMAS } from './escola'
import { useEstadoEnvios, type Envio } from './envios'
import { atividadesDa } from './turma-atividades'

/* OS RESULTADOS DE UM DOCUMENTO ENVIADO (14ª rodada, 05/10/2026; plano ux-composicao, seção 3.5). A aba RESULTADOS
   do documento, no modelo do Plurall (a faixa de indicadores) e do Geekie (cada número com o "quem" embaixo).

   · Só existe para o que tem questões e FOI à turma: o envio vivo (dados/envios.ts, depois de APROVAR E ENVIAR) ou o
     documento de partida já aprovado (a lista de mol e massa molar, o simulado, a prova de modelos atômicos…).
   · ENVIO VIVO: as respostas são as entregas do lote do documento (`lote-<docId>`, o mesmo que a aba Atividades da
     turma conta): recém-enviado, ninguém respondeu ainda, e a tela diz isso.
   · DE PARTIDA: derivado de `alunosDa` e `atividadesDa`, com sorteio fixo (mulberry32): quem fez é quem tem a nota
     daquela atividade (ou quem não está no "não fez" dela), e o acerto médio é o mesmo da aba Atividades. Quem acerta
     qual questão sai do nível de cada uma. A tela não muda a cada recarga.
   · Nada de ranking: a lista de alunos é em ordem alfabética, sempre (regra 50, item 9). */

export type MarcaAluno = 'certa' | 'errada' | null

export type ResultadoAluno = {
  id: string
  nome: string
  /** por questão: certa, errada ou null (não fez) */
  marcas: MarcaAluno[]
  /** por questão: o índice da alternativa marcada (null sem alternativa ou sem resposta) */
  marcadas: (number | null)[]
  /** acertos (null: não fez) */
  acertos: number | null
}

export type ResultadoQuestao = {
  n: number
  certa?: number
  /** % de acerto entre quem respondeu (null: ninguém respondeu) */
  acerto: number | null
  /** % de quem respondeu que marcou cada alternativa */
  marcacoes: number[]
}

export type Resultados = {
  docId: string
  turmaId: string
  /** veio do envio vivo (e não do documento de partida) */
  vivo: boolean
  envio?: Envio
  receberam: number
  abriram: number
  responderam: number
  faltam: number
  faltaCorrigir: number
  /** acerto médio em % (null: ninguém respondeu) */
  acerto: number | null
  /** as notas já foram aprovadas pelo professor */
  aprovadas: boolean
  /** quem ainda não respondeu (nomes, em ordem alfabética) */
  quemFalta: string[]
  questoes: ResultadoQuestao[]
  alunos: ResultadoAluno[]
  total: number
}

const LETRAS = 'ABCDE'

/** mulberry32, o mesmo sorteio repetível de alunos.ts. */
function sorteio(semente: number) {
  let a = semente
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const semente = (x: string) => [...x].reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 7)

/** O acerto médio dos documentos de partida que não estão na aba Atividades com nota (os da aba vêm de lá). */
const ACERTO_DE_PARTIDA: Record<string, number> = {
  'prova-modelos-atomicos': 66, 'simulado-enem-estequiometria': 54, 'diagnostica-estequiometria': 58,
}

const FACILIDADE: Record<string, number> = { fácil: 1.35, médio: 1, difícil: 0.68 }

function porQuestao(qs: QuestaoDoc[], alunos: ResultadoAluno[]): ResultadoQuestao[] {
  const fizeram = alunos.filter((a) => a.acertos !== null)
  return qs.map((q, i) => {
    const n = fizeram.length
    const certas = fizeram.filter((a) => a.marcas[i] === 'certa').length
    const marcacoes = (q.alternativas ?? []).map((_, j) => (n ? Math.round((fizeram.filter((a) => a.marcadas[i] === j).length / n) * 100) : 0))
    return { n: q.n, certa: q.certa, acerto: n ? Math.round((certas / n) * 100) : null, marcacoes }
  })
}

/** O envio vivo: as entregas do lote do documento. */
function doEnvio(doc: ItemBiblioteca, qs: QuestaoDoc[], envio: Envio, lote: Lote | undefined): Resultados {
  const todos = alunosDa(doc.turmaId)
  const total = todos.length || TURMAS.find((t) => t.id === doc.turmaId)?.alunos || 0
  const destino = envio.para === 'turma' ? todos : todos.filter((a) => (envio.para as string[]).includes(a.nome))
  const entregas = lote?.entregas ?? []
  const alunos: ResultadoAluno[] = destino.map((a) => {
    const e = entregas.find((x) => x.nome === a.nome || x.alunoId === a.id)
    if (!e) return { id: a.id, nome: a.nome, marcas: qs.map(() => null), marcadas: qs.map(() => null), acertos: null }
    const marcadas = qs.map((_, i) => { const l = e.respostas[i]; return l ? LETRAS.indexOf(l.toUpperCase()) : null })
    const marcas = qs.map((q, i): MarcaAluno => (marcadas[i] === null ? 'errada' : marcadas[i] === q.certa ? 'certa' : 'errada'))
    return { id: a.id, nome: a.nome, marcas, marcadas, acertos: marcas.filter((m) => m === 'certa').length }
  })
  const fizeram = alunos.filter((a) => a.acertos !== null)
  const receberam = envio.para === 'turma' ? total : envio.para.length
  const acerto = fizeram.length ? Math.round((fizeram.reduce((s, a) => s + (a.acertos ?? 0), 0) / (fizeram.length * qs.length)) * 100) : null
  const aprovadas = lote?.estado === 'aprovado'
  return {
    docId: doc.id, turmaId: doc.turmaId, vivo: true, envio, receberam, abriram: fizeram.length, responderam: fizeram.length,
    faltam: Math.max(0, receberam - fizeram.length), faltaCorrigir: aprovadas ? 0 : fizeram.length, acerto, aprovadas,
    quemFalta: alunos.filter((a) => a.acertos === null).map((a) => a.nome), questoes: porQuestao(qs, alunos), alunos, total: qs.length,
  }
}

/** O documento de partida já aprovado: derivado da turma, com sorteio fixo. */
function dePartida(doc: ItemBiblioteca, qs: QuestaoDoc[]): Resultados | null {
  const todos = alunosDa(doc.turmaId)
  if (!todos.length) return null
  const r = sorteio(semente(doc.id))
  const atv = atividadesDa(doc.turmaId).find((a) => a.nome === doc.titulo)
  const n = qs.length
  /* quem fez: quem tem a nota da atividade; ou quem não está no "não fez" dela; ou, fora da aba, 9 em cada 10 */
  const fez = (i: number) => {
    const a = todos[i]
    if (atv && atv.indiceNota !== null) return a.notas[atv.indiceNota].valor !== null
    if (atv) return !atv.quem.some((x) => x.id === a.id)
    return r() < 0.9
  }
  const feitos = todos.map((_, i) => fez(i))
  const alvo = atv?.acerto ?? ACERTO_DE_PARTIDA[doc.id] ?? 60
  /* o acerto de cada um: a nota da atividade (sem os 11 pontos que a professora soma), ou um sorteio em torno do alvo */
  const base = todos.map((a, i) => {
    if (!feitos[i]) return 0
    const v = atv && atv.indiceNota !== null ? a.notas[atv.indiceNota].valor : null
    return Math.max(4, Math.min(100, v !== null ? v * 10 - 11 : alvo + (r() - 0.5) * 50))
  })
  const quantos = feitos.filter(Boolean).length
  /* acertos inteiros que somam o alvo (resto maior), para o acerto médio bater com a aba Atividades */
  const desejado = Math.round((alvo / 100) * n * quantos)
  const soma = base.reduce((s, b) => s + b, 0) || 1
  const exatos = base.map((b) => Math.min(n, (b / soma) * desejado))
  const acertos = exatos.map((x) => Math.floor(x))
  let falta = desejado - acertos.reduce((s, x) => s + x, 0)
  const ordem = exatos.map((x, i) => [x - Math.floor(x), i] as const).filter(([, i]) => feitos[i]).sort((a, b) => b[0] - a[0])
  for (const [, i] of ordem) { if (falta <= 0) break; if (acertos[i] < n) { acertos[i]++; falta-- } }
  const facil = qs.map((q, i) => (q.nivel ? FACILIDADE[q.nivel] ?? 1 : 1.25 - (0.5 * i) / Math.max(1, n - 1)))
  const alunos: ResultadoAluno[] = todos.map((a, i) => {
    if (!feitos[i]) return { id: a.id, nome: a.nome, marcas: qs.map(() => null), marcadas: qs.map(() => null), acertos: null }
    const certas = new Set(qs.map((_, j) => [facil[j] * (0.35 + r()), j] as const).sort((x, y) => y[0] - x[0]).slice(0, acertos[i]).map(([, j]) => j))
    const marcadas = qs.map((q, j) => {
      if (!q.alternativas || q.certa === undefined) return null
      if (certas.has(j)) return q.certa
      const k = q.alternativas.length
      return (q.certa + 1 + Math.floor(r() * (k - 1))) % k
    })
    return { id: a.id, nome: a.nome, marcas: qs.map((_, j) => (certas.has(j) ? 'certa' : 'errada')), marcadas, acertos: acertos[i] }
  })
  const abriram = quantos + feitos.filter((f) => !f && r() < 0.5).length
  return {
    docId: doc.id, turmaId: doc.turmaId, vivo: false, receberam: todos.length, abriram, responderam: quantos, faltam: todos.length - quantos,
    faltaCorrigir: 0, acerto: quantos ? Math.round((acertos.reduce((s, x) => s + x, 0) / (quantos * n)) * 100) : null, aprovadas: true,
    quemFalta: alunos.filter((a) => a.acertos === null).map((a) => a.nome), questoes: porQuestao(qs, alunos), alunos, total: n,
  }
}

const CACHE = new Map<string, Resultados | null>()

/** Os resultados do documento (null quando ele não foi à turma ou não tem questões). */
export function resultadosDe(doc: ItemBiblioteca, envio?: Envio, lote?: Lote): Resultados | null {
  const t = tipoDocumento(doc)
  if (t !== 'prova' && t !== 'atividade' && t !== 'simulado') return null
  const qs = questoesDoDocumento(doc)
  if (!qs.length) return null
  if (envio) return doEnvio(doc, qs, envio, lote)
  if (estadoDe(doc) !== 'aprovado') return null
  if (!CACHE.has(doc.id)) CACHE.set(doc.id, dePartida(doc, qs))
  return CACHE.get(doc.id) ?? null
}

/** O mesmo, como hook: relê quando o documento é enviado ou quando chega uma entrega. */
export function useResultados(doc: ItemBiblioteca | undefined): Resultados | null {
  const estado = useEstadoEnvios()
  const lotes = fatiaLotes.useValor()
  return useMemo(() => {
    if (!doc) return null
    const envio = [...estado.envios].filter((e) => e.docId === doc.id && e.versao === 'original').sort((a, b) => b.em.ordem - a.em.ordem)[0]
    return resultadosDe(doc, envio, lotes[`lote-${doc.id}`])
  }, [doc, estado, lotes])
}
