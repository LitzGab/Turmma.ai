import { createElement, Fragment, type ReactNode } from 'react'
import type { RespostaDados, VisualDados } from '@/components/duo/chat-dados'
import { ACERTO_POR_SERIE, USO_DE_AGOSTO, USO_DE_SETEMBRO } from './rede'

/* O MOTOR DE CONSULTA DO ANALISTA (14ª rodada, 05/10/2026; plano ux-composicao, seção 4.5).

   Por quê: o Analista respondia só ao roteiro. Para quem está na frente (a coordenação, a secretaria, o vereador)
   perguntar o que quiser, a conversa precisa CALCULAR. O motor é puro e tem três passos:
     1. entender(texto, vocabulário, anterior) → a Consulta: a métrica, o recorte (escola, série, turma, disciplina, com
        os apelidos), o agrupamento, o mês, a comparação com agosto e os pedidos que mudam a resposta (nomes, ranking,
        professor). Sem métrica, herda a métrica e o recorte da anterior ("e no 8º ano?", "e em agosto?").
     2. calcular(células, consulta, vocabulário) → o Resultado. Os grupos saem SEMPRE na ordem do vocabulário (A a Z,
        6º → 3º EM, 6ºA → 3ºB), nunca por valor. Grupo com menos de 5 alunos (ou contagem de alunos de 1 a 4) vira
        null, "menos de 5"; havendo grupo oculto, o total sai da frase (supressão complementar: senão daria para
        deduzir o oculto). `porProfessor` quando a conta chega a uma turma em uma disciplina só (um professor).
     3. responder(resultado, vocabulário, contexto) → a RespostaDados do ChatDados: a frase com o número em negrito, o
        visual pela forma (1 valor → números; grupos → barras; 2 dimensões → calor ou tabela; comparação → tabela
        Agosto | Setembro), a fonte com quantas escolas, turmas e alunos entraram, as etapas e até 2 próximas.

   A CÉLULA é o menor recorte guardado, já agregado (nenhuma linha de aluno): escola · série · turma (só na escola) ·
   disciplina · mês. Convenção das contas que são de ALUNO, e não de disciplina (`alunos`, `usaram`, `atrasados`): são
   da turma (ou da escola × série, na rede) e se repetem igual em cada disciplina dela; o motor conta UMA vez por
   unidade. `abaixo50` é por disciplina: somado entre disciplinas, conta uma vez por unidade (o maior), "em alguma
   disciplina". O resto (respostas, acertos, notas, entregas, conversas, materiais) soma.
   Na rede não há turma: a célula leva `turmas` (quantas turmas a escola tem naquela série), para a fonte contar.

   O TEXTO que os apelidos leem: minúsculo, sem acento, com º/ª/° trocados por "o" ("2ºB" → "2ob", "9º ano" → "9o ano").

   As células de verdade moram em `numeros-escola.ts` (CELULAS_ESCOLA, VOCABULARIO_ESCOLA; tarefa CP) e
   `numeros-rede.ts` (CELULAS_REDE, VOCABULARIO_REDE; tarefa RP). Aqui ficam só as de EXEMPLO e o `testarConsulta()`,
   que os Fundamentos rodam com as perguntas da tabela da 4.5. */

export type Dim = 'escola' | 'serie' | 'turma' | 'disciplina'
export type Mes = 'agosto' | 'setembro'
export type Celula = {
  escola: string; serie: string; turma?: string; disciplina: string; mes: Mes
  alunos: number; usaram: number; conversas: number; respostas: number; acertos: number; somaNotas: number; notas: number
  atrasados: number; abaixo50: number; entregues: number; esperadas: number; materiais: number; aprovados: number
  /** na rede (sem turma): quantas turmas a escola tem nesta série */
  turmas?: number
}
export type MetricaId = 'uso' | 'acerto' | 'media' | 'entregas' | 'atrasados' | 'abaixo50' | 'alunos' | 'conversas' | 'materiais'
/** A ordem de cada lista é a ordem natural (A a Z, 6º → 3º EM, 6ºA → 3ºB). `de` é como o recorte entra na frase
    ("da Araucária", "do 9º ano", "em Matemática"); sem ele, "de <nome>". */
export type Vocabulario = Record<Dim, { id: string; nome: string; apelidos: RegExp; de?: string }[]>
export type Consulta = {
  metrica: MetricaId; filtros: Partial<Record<Dim, string[]>>; agrupar?: Dim; mes: Mes; comparar?: boolean
  pedeNomes?: boolean; pedeRanking?: boolean; pedeProfessor?: boolean
  /** a segunda dimensão ("por série e disciplina"): a resposta vira calor ou tabela */
  agrupar2?: Dim
}
export type Grupo = { id: string; nome: string; valor: number | null; agosto?: number | null; alunos: number }
export type Resultado = {
  consulta: Consulta; valor: number | null; agosto?: number | null; grupos?: Grupo[]
  alunos: number; turmas: number; escolas: number; ocultos: number; porProfessor: boolean
  /** com `agrupar2`: linhas × colunas, null = menos de 5 ou sem dado */
  cruzado?: { linhas: { id: string; nome: string }[]; colunas: { id: string; nome: string }[]; valores: (number | null)[][] }
  /** contexto para a frase das contagens (usaram de quantos; aprovados) */
  extra?: { usaram?: number; aprovados?: number; usaramAgosto?: number }
}

/* ── 1. Entender ───────────────────────────────────────────────────────────────────────────────────────────── */

/** O texto que os apelidos leem: minúsculo, sem acento, º/ª/° → "o", espaços simples. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[º°ª]/g, 'o').replace(/\s+/g, ' ').trim()
}

/** A métrica, na ordem em que se testa (a mais específica primeiro). */
const METRICAS: [RegExp, MetricaId][] = [
  [/abaixo d[eo]s? ?50|menos de 50 ?%|foram mal|vao mal|indo mal|nota baixa|com dificuldade/, 'abaixo50'],
  [/atrasad|em atraso|faltando|nao entreg|sem entregar/, 'atrasados'],
  [/entreg|no prazo|em dia/, 'entregas'],
  [/conversa|trocas?\b|pergunt\w* ao tutor/, 'conversas'],
  [/materia(l|is) (da|de|gerad)|materiais|ia gerou|gerad[oa]s? pela ia|saidas da ia/, 'materiais'],
  [/\bmedia|\bnotas?\b/, 'media'],
  [/acert|\berr(a|am|o|ou|aram)\b|desempenho|aproveitamento|rendimento/, 'acerto'],
  [/\busa(r|m|ram|ndo)?\b|\busou\b|\buso\b|acess|entraram|ativos?\b|tutor/, 'uso'],
  [/quantos alunos|numero de alunos|quantidade de alunos|alunos (tem|ha)|matricul|tamanho|maior|menor/, 'alunos'],
]

const AGRUPAR: [RegExp, Dim][] = [
  [/(por|cada|entre as|nas|de cada|todas as) escolas?/, 'escola'],
  [/(por|cada|entre as|nas|de cada|todas as) (series?|anos?)\b|serie x|series x/, 'serie'],
  [/(por|cada|entre as|nas|de cada|todas as) turmas?/, 'turma'],
  [/(por|cada|entre as|nas|de cada|todas as) (disciplinas?|materias?)|x disciplina|e disciplina|e materia/, 'disciplina'],
]

const RE_RANKING = /melhor|pior|ranking|\bordene|\bordenar|\btop\b|primeiro lugar|ultimo lugar|mais (alto|baixo)|caiu mais|subiu mais|quem (mais|menos)/
const RE_TAMANHO = /maior|menor/
const RE_PROFESSOR = /professor|professora|docente/
const RE_NOMES = /quais (sao )?(os |as )?alunos|quem sao|quem e\b|quem esta|\bnomes?\b|lista de alunos|quais estudantes/
const RE_COMPARAR = /compar|caiu|subiu|evolu|variou|mudou|diferenca|\bvs\b|versus|lado a lado/
const RE_AGOSTO = /agosto|mes passado|mes anterior/
const RE_SETEMBRO = /setembro|este mes|esse mes|neste mes/

/** Quem o texto cita em cada dimensão (na ordem do vocabulário). */
function recortesDe(t: string, voc: Vocabulario): Partial<Record<Dim, string[]>> {
  const filtros: Partial<Record<Dim, string[]>> = {}
  ;(['escola', 'serie', 'turma', 'disciplina'] as Dim[]).forEach((d) => {
    const ids = voc[d].filter((v) => v.apelidos.test(t)).map((v) => v.id)
    if (ids.length) filtros[d] = ids
  })
  return filtros
}

/** As dimensões de agrupamento, na ordem em que aparecem no texto. */
function agrupamentosDe(t: string): Dim[] {
  return AGRUPAR.map(([re, d]) => ({ d, i: t.search(re) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i).map((x) => x.d)
}

/** A Consulta que o texto pede, ou null quando o motor não reconhece nada (vai para o "ainda não sei"). */
export function entender(texto: string, voc: Vocabulario, anterior?: Consulta): Consulta | null {
  const t = normalizar(texto)
  const temTurma = voc.turma.length > 0
  let metrica = METRICAS.find(([re]) => re.test(t))?.[1]
  // "maior"/"menor" só valem para tamanho: com outra métrica no texto, é pedido de ordenar
  const pedeProfessor = RE_PROFESSOR.test(t)
  const pedeNomes = RE_NOMES.test(t)
  let pedeRanking = RE_RANKING.test(t) || (RE_TAMANHO.test(t) && metrica !== undefined && metrica !== 'alunos'
    && METRICAS.filter(([re, m]) => m !== 'alunos' && re.test(t)).length > 0)
  if (metrica === 'alunos' && RE_TAMANHO.test(t)) pedeRanking = false
  // na rede não há "média de notas": nota vira acerto
  if (metrica === 'media' && !temTurma) metrica = 'acerto'
  const filtros = recortesDe(t, voc)
  const grupos = agrupamentosDe(t).map((d) => (d === 'turma' && !temTurma ? 'escola' : d))
  const agosto = RE_AGOSTO.test(t)
  const setembro = RE_SETEMBRO.test(t)
  const algoReconhecido = Object.keys(filtros).length > 0 || grupos.length > 0 || agosto || setembro || RE_COMPARAR.test(t)

  let q: Consulta
  if (metrica) {
    q = { metrica, filtros, mes: agosto && !setembro && !RE_COMPARAR.test(t) ? 'agosto' : 'setembro' }
    if (RE_COMPARAR.test(t) || (agosto && setembro)) { q.comparar = true; q.mes = 'setembro' }
  } else if (anterior && algoReconhecido && !anterior.pedeNomes && !anterior.pedeProfessor) {
    // sem métrica: herda a métrica e o recorte; o que o texto cita troca a dimensão inteira
    q = { metrica: anterior.metrica, filtros: { ...anterior.filtros, ...filtros }, mes: anterior.mes, agrupar: anterior.agrupar, agrupar2: anterior.agrupar2 }
    // turma citada tira a série herdada que não é dela; série citada tira a turma herdada
    if (filtros.serie && !filtros.turma) delete q.filtros.turma
    if (agosto && !setembro) {
      // "e em agosto?" depois de setembro: a mesma conta, lado a lado
      if (anterior.mes === 'setembro') { q.comparar = true; q.mes = 'setembro' } else q.mes = 'agosto'
    } else if (setembro) q.mes = 'setembro'
    if (RE_COMPARAR.test(t)) { q.comparar = true; q.mes = 'setembro' }
  } else if (pedeProfessor || pedeRanking || pedeNomes) {
    // pedido sem métrica e sem conversa antes ("qual a melhor escola?"): o acerto (ou o uso, para professor)
    q = { metrica: pedeProfessor ? 'uso' : 'acerto', filtros, mes: 'setembro' }
  } else return null

  if (grupos[0]) q.agrupar = grupos[0]
  if (grupos[1] && grupos[1] !== grupos[0]) q.agrupar2 = grupos[1]
  else if (grupos[0]) delete q.agrupar2
  if (pedeRanking && !q.agrupar) {
    q.agrupar = /turma/.test(t) && temTurma ? 'turma' : /serie|ano\b/.test(t) && !filtros.serie ? 'serie' : voc.escola.length > 1 ? 'escola' : temTurma ? 'turma' : 'serie'
  }
  // na rede, sem escola citada nem agrupamento, a conta vem por escola (o total e cada escola, de A a Z)
  if (!temTurma && !q.agrupar && !q.filtros.escola?.length && voc.escola.length > 1 && !pedeNomes && !pedeProfessor) q.agrupar = 'escola'
  // o agrupamento pela mesma dimensão de um filtro único não agrupa nada: tira o filtro
  if (q.agrupar && q.filtros[q.agrupar]?.length === 1 && q.agrupar !== 'turma' && q.agrupar !== 'disciplina') delete q.filtros[q.agrupar]
  if (pedeNomes) q.pedeNomes = true
  if (pedeRanking) q.pedeRanking = true
  if (pedeProfessor) q.pedeProfessor = true
  return q
}

/* ── 2. Calcular ───────────────────────────────────────────────────────────────────────────────────────────── */

type Soma = {
  alunos: number; usaram: number; atrasados: number; abaixo50: number
  conversas: number; respostas: number; acertos: number; somaNotas: number; notas: number
  entregues: number; esperadas: number; materiais: number; aprovados: number
  turmas: number; escolas: number
}

/** Soma as células, contando UMA vez por unidade (turma, ou escola × série) o que é de aluno. */
function somar(cels: Celula[]): Soma {
  const unidades = new Map<string, { alunos: number; usaram: number; atrasados: number; abaixo50: number; turmas: number; disciplinas: Set<string> }>()
  const s: Soma = { alunos: 0, usaram: 0, atrasados: 0, abaixo50: 0, conversas: 0, respostas: 0, acertos: 0, somaNotas: 0, notas: 0,
    entregues: 0, esperadas: 0, materiais: 0, aprovados: 0, turmas: 0, escolas: 0 }
  const escolas = new Set<string>()
  cels.forEach((c) => {
    escolas.add(c.escola)
    const k = `${c.escola}|${c.serie}|${c.turma ?? ''}|${c.mes}`
    const u = unidades.get(k) ?? { alunos: 0, usaram: 0, atrasados: 0, abaixo50: 0, turmas: 0, disciplinas: new Set<string>() }
    u.alunos = Math.max(u.alunos, c.alunos)
    u.usaram = Math.max(u.usaram, c.usaram)
    u.atrasados = Math.max(u.atrasados, c.atrasados)
    u.abaixo50 = u.disciplinas.has(c.disciplina) ? u.abaixo50 + c.abaixo50 : Math.max(u.abaixo50, c.abaixo50)
    u.turmas = c.turma ? 1 : Math.max(u.turmas, c.turmas ?? 0)
    u.disciplinas.add(c.disciplina)
    unidades.set(k, u)
    s.conversas += c.conversas; s.respostas += c.respostas; s.acertos += c.acertos; s.somaNotas += c.somaNotas; s.notas += c.notas
    s.entregues += c.entregues; s.esperadas += c.esperadas; s.materiais += c.materiais; s.aprovados += c.aprovados
  })
  unidades.forEach((u) => { s.alunos += u.alunos; s.usaram += u.usaram; s.atrasados += u.atrasados; s.abaixo50 += u.abaixo50; s.turmas += u.turmas })
  s.escolas = escolas.size
  return s
}

const porcento = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null)
const CONTAGEM_DE_ALUNOS: MetricaId[] = ['atrasados', 'abaixo50']
const PERCENTUAIS: MetricaId[] = ['uso', 'acerto', 'entregas']

function valorDa(s: Soma, m: MetricaId): number | null {
  switch (m) {
    case 'uso': return porcento(s.usaram, s.alunos)
    case 'acerto': return porcento(s.acertos, s.respostas)
    case 'media': return s.notas > 0 ? Math.round((s.somaNotas / s.notas) * 10) / 10 : null
    case 'entregas': return porcento(s.entregues, s.esperadas)
    case 'atrasados': return s.atrasados
    case 'abaixo50': return s.abaixo50
    case 'alunos': return s.alunos
    case 'conversas': return s.conversas
    case 'materiais': return s.materiais
  }
}

/** O valor que pode aparecer: null quando o grupo tem menos de `minimo` alunos, ou a contagem de alunos fica entre 1 e
    `minimo - 1` (D45). */
function visivel(s: Soma, m: MetricaId, minimo: number): number | null {
  if (s.alunos === 0 || s.alunos < minimo) return null
  const v = valorDa(s, m)
  if (v !== null && CONTAGEM_DE_ALUNOS.includes(m) && v > 0 && v < minimo) return null
  return v
}

function filtrar(celulas: Celula[], filtros: Consulta['filtros'], mes: Mes): Celula[] {
  return celulas.filter((c) => c.mes === mes && (Object.keys(filtros) as Dim[]).every((d) => {
    const lista = filtros[d]
    if (!lista?.length) return true
    const v = c[d]
    return v !== undefined && lista.includes(v)
  }))
}

/** Os grupos de uma dimensão, na ordem do vocabulário: os que aparecem nas células do recorte e, sem filtro na
    dimensão, os que não têm célula nenhuma ("ainda sem dado", como a Figueira). */
function idsDoGrupo(d: Dim, recorte: Celula[], todas: Celula[], voc: Vocabulario, filtrado: boolean) {
  const presentes = new Set(recorte.map((c) => c[d]).filter(Boolean) as string[])
  const algum = new Set(todas.map((c) => c[d]).filter(Boolean) as string[])
  return voc[d].filter((v) => presentes.has(v.id) || (!filtrado && d === 'escola' && !algum.has(v.id)))
}

export function calcular(celulas: Celula[], q: Consulta, voc: Vocabulario, minimo = 5): Resultado {
  const doMes = filtrar(celulas, q.filtros, q.mes)
  const doAgosto = q.comparar ? filtrar(celulas, q.filtros, 'agosto') : []
  const total = somar(doMes)
  const totalAgosto = q.comparar ? somar(doAgosto) : undefined
  let ocultos = 0
  let grupos: Grupo[] | undefined
  let cruzado: Resultado['cruzado']
  if (q.agrupar) {
    const d = q.agrupar
    grupos = idsDoGrupo(d, doMes, celulas, voc, !!q.filtros[d]?.length).map((g) => {
      const s = somar(doMes.filter((c) => c[d] === g.id))
      const valor = visivel(s, q.metrica, minimo)
      if (valor === null && s.alunos > 0) ocultos += 1
      const grupo: Grupo = { id: g.id, nome: g.nome, valor, alunos: s.alunos }
      if (q.comparar) grupo.agosto = visivel(somar(doAgosto.filter((c) => c[d] === g.id)), q.metrica, minimo)
      return grupo
    })
    if (q.agrupar2) {
      const d2 = q.agrupar2
      const colunas = idsDoGrupo(d2, doMes, celulas, voc, !!q.filtros[d2]?.length).map(({ id, nome }) => ({ id, nome }))
      const linhas = grupos.map(({ id, nome }) => ({ id, nome }))
      const valores = linhas.map((l) => colunas.map((c) => {
        const cel = doMes.filter((x) => x[d] === l.id && x[d2] === c.id)
        if (!cel.length) return null
        const v = visivel(somar(cel), q.metrica, minimo)
        if (v === null) ocultos += 1
        return v
      }))
      cruzado = { linhas, colunas, valores }
    }
  }
  const somaDe = (dim: Dim | undefined) => dim === 'turma' || q.filtros.turma?.length === 1
  const umaDisciplina = q.filtros.disciplina?.length === 1 || q.agrupar === 'disciplina' || q.agrupar2 === 'disciplina'
  const chegaNaTurma = celulas.some((c) => c.turma) && (somaDe(q.agrupar) || q.agrupar2 === 'turma' || !!q.filtros.turma?.length)
  return {
    consulta: q,
    // supressão complementar: com grupo oculto, o total sai
    valor: ocultos > 0 ? null : visivel(total, q.metrica, minimo),
    agosto: totalAgosto ? (ocultos > 0 ? null : visivel(totalAgosto, q.metrica, minimo)) : undefined,
    grupos,
    cruzado,
    alunos: total.alunos,
    turmas: total.turmas,
    escolas: total.escolas,
    ocultos,
    porProfessor: umaDisciplina && chegaNaTurma,
    extra: { usaram: total.usaram, aprovados: total.aprovados, usaramAgosto: totalAgosto?.usaram },
  }
}

/* ── 3. Responder ──────────────────────────────────────────────────────────────────────────────────────────── */

const inteiro = (n: number) => n.toLocaleString('pt-BR')
const decimal = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const b = (s: string) => createElement('b', null, s)
const frase = (...partes: ReactNode[]) => createElement(Fragment, null, ...partes)

/** O valor como texto, na unidade da métrica. */
export function formatar(m: MetricaId, v: number | null | undefined, alunos?: number): string {
  if (v === null || v === undefined) return alunos === 0 ? 'ainda sem dado' : 'menos de 5'
  if (PERCENTUAIS.includes(m)) return `${v}%`
  if (m === 'media') return decimal(v)
  return inteiro(v)
}

const NOME_METRICA: Record<MetricaId, string> = {
  uso: 'Usaram', acerto: 'Acerto nas objetivas', media: 'Média das notas', entregas: 'Entregas em dia',
  atrasados: 'Alunos com 3 ou mais entregas faltando', abaixo50: 'Alunos abaixo de 50%', alunos: 'Alunos',
  conversas: 'Conversas com o Tutor', materiais: 'Materiais da IA',
}
const SUJEITO: Record<MetricaId, string> = {
  uso: 'O uso', acerto: 'O acerto nas objetivas', media: 'A média das notas', entregas: 'As entregas em dia',
  atrasados: 'Os alunos com 3 ou mais entregas faltando', abaixo50: 'Os alunos abaixo de 50%', alunos: 'Os alunos',
  conversas: 'As conversas com o Tutor', materiais: 'Os materiais da IA',
}
const NOME_DIM: Record<Dim, { um: string; muitos: string; ordem: string }> = {
  escola: { um: 'escola', muitos: 'escolas', ordem: 'de A a Z' },
  serie: { um: 'série', muitos: 'séries', ordem: 'do 6º ano em diante' },
  turma: { um: 'turma', muitos: 'turmas', ordem: 'na ordem das turmas' },
  disciplina: { um: 'disciplina', muitos: 'disciplinas', ordem: 'na ordem das disciplinas' },
}

/** O recorte como entra na frase: " do 9º ano em Português na Araucária". */
export function descreverRecorte(q: Consulta, voc: Vocabulario, sem: Dim[] = []): string {
  const de = (d: Dim) => (q.filtros[d] ?? []).map((id) => {
    const v = voc[d].find((x) => x.id === id)
    return v ? (v.de ?? `de ${v.nome}`) : id
  })
  const juntar = (l: string[]) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l[l.length - 1].replace(/^(do|da|de|em|no|na) /, '')}`)
  const partes: string[] = []
  ;(['turma', 'serie', 'disciplina', 'escola'] as Dim[]).forEach((d) => {
    if (sem.includes(d)) return
    if (d === 'serie' && q.filtros.turma?.length) return
    const l = de(d)
    if (l.length) partes.push(juntar(l))
  })
  return partes.length ? ` ${partes.join(' ')}` : ''
}

const MES_NOME: Record<Mes, string> = { agosto: 'agosto', setembro: 'setembro' }

/** A frase de um valor, com o número em negrito. */
function fraseDoValor(r: Resultado, voc: Vocabulario, recorteRede: boolean): ReactNode {
  const q = r.consulta
  const rec = descreverRecorte(q, voc)
  const mes = MES_NOME[q.mes]
  const v = r.valor
  const onde = recorteRede ? ' na rede' : ''
  if (v === null) {
    return frase('Há grupos com menos de 5 alunos neste recorte; por isso o total não aparece. ', 'Abaixo, cada grupo:')
  }
  switch (q.metrica) {
    case 'uso': return frase(b(`${inteiro(r.extra?.usaram ?? 0)} de ${inteiro(r.alunos)}`), ` alunos${rec}${onde} usaram o Turmma em ${mes} (`, b(`${v}%`), ').')
    case 'acerto': return frase(`O acerto nas objetivas${rec}${onde} é de `, b(`${v}%`), ` em ${mes}.`)
    case 'media': return frase(`A média das notas${rec} é `, b(decimal(v)), ` em ${mes}.`)
    case 'entregas': return frase(b(`${v}%`), ` das tarefas${rec}${onde} foram entregues no prazo em ${mes}.`)
    case 'atrasados': return frase(b(`${inteiro(v)} ${v === 1 ? 'aluno' : 'alunos'}`), `${rec}${onde} ${v === 1 ? 'está' : 'estão'} com 3 ou mais entregas faltando.`)
    case 'abaixo50': return frase(b(`${inteiro(v)} alunos`), `${rec}${onde} estão abaixo de 50% de acerto${q.filtros.disciplina?.length ? '' : ' em alguma disciplina'}.`)
    case 'alunos': return frase(rec ? `${rec.trim().replace(/^./, (c) => c.toUpperCase())} ${r.turmas === 1 ? 'tem' : 'têm'} ` : `${recorteRede ? 'A rede tem' : 'A escola tem'} `, b(`${inteiro(v)} alunos`), ` em ${inteiro(r.turmas)} ${r.turmas === 1 ? 'turma' : 'turmas'}.`)
    case 'conversas': return frase('Foram ', b(`${inteiro(v)} conversas`), ` com o Tutor${rec}${onde} em ${mes}.`)
    case 'materiais': return frase('A IA preparou ', b(`${inteiro(v)} materiais`), `${rec}${onde} em ${mes}; ${inteiro(r.extra?.aprovados ?? 0)} foram aprovados por professor.`)
  }
}

/** O visual pela forma do resultado. */
function visualDe(r: Resultado): VisualDados | undefined {
  const q = r.consulta
  const m = q.metrica
  const pct = PERCENTUAIS.includes(m)
  if (r.cruzado) {
    if (pct) return { tipo: 'calor', linhas: r.cruzado.linhas.map((l) => l.nome), colunas: r.cruzado.colunas.map((c) => c.nome), valores: r.cruzado.valores }
    return { tipo: 'tabela', colunas: ['', ...r.cruzado.colunas.map((c) => c.nome)], linhas: r.cruzado.linhas.map((l, i) => [l.nome, ...r.cruzado!.valores[i].map((v) => formatar(m, v))]) }
  }
  if (r.grupos) {
    if (q.comparar) {
      return { tipo: 'tabela', colunas: [NOME_DIM[q.agrupar!].um.replace(/^./, (c) => c.toUpperCase()), 'Agosto', 'Setembro'],
        linhas: r.grupos.map((g) => [g.nome, formatar(m, g.agosto, g.alunos), formatar(m, g.valor, g.alunos)]) }
    }
    const max = pct ? 100 : m === 'media' ? 10 : Math.max(1, ...r.grupos.map((g) => g.valor ?? 0))
    return {
      tipo: 'barras', max, familia: 'azul',
      itens: r.grupos.map((g) => ({ rotulo: g.nome, valor: g.valor, texto: g.valor === null ? formatar(m, null, g.alunos) : formatar(m, g.valor) })),
    }
  }
  if (q.comparar) return { tipo: 'tabela', colunas: ['', 'Agosto', 'Setembro'], linhas: [[NOME_METRICA[m], formatar(m, r.agosto), formatar(m, r.valor)]] }
  if (r.valor === null) return undefined
  if (m === 'uso') return { tipo: 'numeros', itens: [{ valor: inteiro(r.extra?.usaram ?? 0), rotulo: 'usaram' }, { valor: inteiro(r.alunos), rotulo: 'com acesso' }, { valor: `${r.valor}%`, rotulo: 'do total' }] }
  if (m === 'materiais') return { tipo: 'numeros', itens: [{ valor: inteiro(r.valor), rotulo: 'preparados' }, { valor: inteiro(r.extra?.aprovados ?? 0), rotulo: 'aprovados' }] }
  return { tipo: 'numeros', itens: [{ valor: formatar(m, r.valor), rotulo: NOME_METRICA[m].toLowerCase() }] }
}

/** A tabela do BAIXAR CSV. */
function csvDe(r: Resultado, id: string): RespostaDados['csv'] {
  const q = r.consulta
  const m = q.metrica
  const cel = (v: number | null | undefined, alunos?: number) => (v === null || v === undefined ? formatar(m, v, alunos) : v)
  if (r.cruzado) return { nome: `${id}.csv`, linhas: [['', ...r.cruzado.colunas.map((c) => c.nome)], ...r.cruzado.linhas.map((l, i) => [l.nome, ...r.cruzado!.valores[i].map((v) => cel(v))])] }
  if (!r.grupos) return undefined
  const cab = q.comparar ? [NOME_DIM[q.agrupar!].um, `${NOME_METRICA[m]} em agosto`, `${NOME_METRICA[m]} em setembro`] : [NOME_DIM[q.agrupar!].um, NOME_METRICA[m]]
  return { nome: `${id}.csv`, linhas: [cab, ...r.grupos.map((g) => (q.comparar ? [g.nome, cel(g.agosto, g.alunos), cel(g.valor, g.alunos)] : [g.nome, cel(g.valor, g.alunos)]))] }
}

/** As etapas do "De onde veio". */
function etapasDe(r: Resultado, voc: Vocabulario, periodo: string): string[] {
  const q = r.consulta
  const rec = descreverRecorte(q, voc).trim()
  const e = [`Filtrado: ${rec || 'tudo'} · ${q.comparar ? 'agosto e setembro' : periodo}`]
  if (q.agrupar) e.push(`Agrupado por ${NOME_DIM[q.agrupar].um}${q.agrupar2 ? ` e ${NOME_DIM[q.agrupar2].um}` : ''}, ${NOME_DIM[q.agrupar].ordem} (nunca do maior para o menor)`)
  if (r.ocultos) e.push(`Ficou de fora: ${r.ocultos} ${r.ocultos === 1 ? 'grupo' : 'grupos'} com menos de 5 alunos; por isso o total não aparece`)
  e.push(`Contados: ${r.escolas} ${r.escolas === 1 ? 'escola' : 'escolas'}, ${inteiro(r.turmas)} turmas, ${inteiro(r.alunos)} alunos`)
  return e
}

/** As próximas perguntas que o motor sabe responder. */
function proximas(r: Resultado, voc: Vocabulario, recorteRede: boolean): { rotulo: string; pergunta: string }[] {
  const q = r.consulta
  const l: { rotulo: string; pergunta: string }[] = []
  if (!q.comparar) l.push({ rotulo: 'Comparar com agosto', pergunta: 'e em agosto?' })
  const outra: Dim | undefined = !q.agrupar ? (recorteRede ? 'escola' : q.filtros.serie ? 'disciplina' : 'serie') : q.agrupar !== 'serie' && !q.filtros.serie ? 'serie' : q.agrupar !== 'disciplina' && !q.filtros.disciplina ? 'disciplina' : undefined
  if (outra && voc[outra].length > 1) l.push({ rotulo: `Por ${NOME_DIM[outra].um}`, pergunta: `e por ${NOME_DIM[outra].um}?` })
  return l.slice(0, 2)
}

/** Os motivos de sempre (a lista fechada da coordenação, a mesma do alerta). */
export const MOTIVOS_PADRAO = ['Planejar reforço', 'Conversar com o professor da turma', 'Falar com as famílias', 'Encaminhar à orientação']

let sequencia = 0

export function responder(r: Resultado, voc: Vocabulario, ctx: {
  recorte: 'escola' | 'rede'; periodo: string
  fonte: (r: Resultado) => string
  seguir?: (q: Consulta) => { rotulo: string; pergunta: string }[]
  /** na escola: o que o motivo mostra (os nomes, ou o número por professor). Sem ele, o motor mostra a conta e o
      selo REGISTRADO NA AUDITORIA, sem nome. */
  motivo?: (r: Resultado, pedido: 'nomes' | 'professor') => RespostaDados['motivo']
}): RespostaDados {
  const q = r.consulta
  const rede = ctx.recorte === 'rede'
  const id = `motor-${++sequencia}`
  const seguir = ctx.seguir?.(q) ?? proximas(r, voc, rede)
  const base = { id, fonte: ctx.fonte(r), etapas: etapasDe(r, voc, ctx.periodo) }

  // 1. por professor: recusa e oferece por série
  if (q.pedeProfessor) {
    return { id, tom: 'recusa', frase: 'Eu não mostro números por professor. Posso mostrar o uso por série.',
      seguir: [{ rotulo: 'Uso por série', pergunta: 'uso por série' }] }
  }
  // 2. nomes
  if (q.pedeNomes) {
    const disc = q.filtros.disciplina?.length ? ` em ${voc.disciplina.find((d) => d.id === q.filtros.disciplina![0])?.nome ?? ''}` : ''
    const rec = descreverRecorte(q, voc, ['disciplina'])
    if (rede) {
      return { id, tom: 'recusa',
        frase: 'Na rede eu só vejo números agregados, de grupos de 5 ou mais alunos.',
        seguir: [{ rotulo: `Quantos ficaram abaixo de 50%${disc}`, pergunta: `quantos alunos${rec || ' do 6º ao 9º ano'} estão abaixo de 50%${disc}?` }] }
    }
    const motivo = ctx.motivo?.(r, 'nomes') ?? motivoPadrao(r, voc, ctx, base, 'nomes')
    const n = r.valor
    return { ...base, frase: frase(n === null ? 'Há alunos neste recorte. ' : frase(b(`${inteiro(n)} ${n === 1 ? 'aluno' : 'alunos'}`), `${descreverRecorte(q, voc)}. `), 'Para ver os nomes, escolha o motivo: fica registrado na auditoria.'), motivo }
  }
  // 3. por turma numa disciplina, na escola: é o número de um professor; passa pelo motivo
  if (r.porProfessor && !rede) {
    const motivo = ctx.motivo?.(r, 'professor') ?? motivoPadrao(r, voc, ctx, base, 'professor')
    return { ...base, frase: 'Por turma em uma disciplina, o número é o de um professor só. Para ver, escolha o motivo: fica registrado na auditoria.', motivo }
  }
  // 4. a conta (com o aviso de que não ordena, quando pediram ranking)
  const ranking = q.pedeRanking && q.agrupar
    ? `Eu não ordeno ${NOME_DIM[q.agrupar].muitos} da melhor para a pior. Aqui estão todas, ${NOME_DIM[q.agrupar].ordem}. `
    : ''
  let principal: ReactNode
  if (q.comparar && !q.agrupar) {
    principal = r.valor === null || r.agosto === null || r.agosto === undefined
      ? fraseDoValor(r, voc, rede)
      : frase(`${SUJEITO[q.metrica]}${descreverRecorte(q, voc)}: `, b(formatar(q.metrica, r.agosto)), ' em agosto e ', b(formatar(q.metrica, r.valor)), ' em setembro.')
  } else if (q.comparar && q.agrupar) {
    principal = frase(`${SUJEITO[q.metrica]}${descreverRecorte(q, voc)}, em agosto e em setembro, por ${NOME_DIM[q.agrupar].um}`,
      r.valor !== null && r.agosto !== null && r.agosto !== undefined ? frase(': no total, ', b(formatar(q.metrica, r.agosto)), ' e ', b(formatar(q.metrica, r.valor)), '.') : '.')
  } else {
    principal = r.valor === null && r.grupos
      ? frase(`${SUJEITO[q.metrica]}${descreverRecorte(q, voc)}, por ${NOME_DIM[q.agrupar!].um}. Um grupo tem menos de 5 alunos; por isso o total não aparece.`)
      : fraseDoValor(r, voc, rede)
    // poucos grupos, todos visíveis: a lista vai na própria frase, na ordem do vocabulário
    const vis = r.grupos?.filter((g) => g.valor !== null) ?? []
    if (r.grupos && r.valor !== null && r.grupos.length <= 4 && vis.length === r.grupos.length && !r.cruzado && q.metrica !== 'alunos') {
      principal = frase(principal, ` ${vis.map((g) => `${g.nome} ${formatar(q.metrica, g.valor)}`).join(', ')}.`)
    }
  }
  // "maior" e "menor" só para tamanho
  let tamanho: ReactNode = null
  if (q.metrica === 'alunos' && r.grupos && r.grupos.length > 1) {
    const vis = r.grupos.filter((g) => g.valor !== null)
    if (vis.length > 1) {
      const maior = vis.reduce((a, g) => ((g.valor ?? 0) > (a.valor ?? 0) ? g : a))
      tamanho = frase(` A maior é ${maior.nome}, com ${inteiro(maior.valor ?? 0)}.`)
    }
  }
  return {
    ...base,
    frase: frase(ranking, principal, tamanho),
    visual: visualDe(r),
    csv: csvDe(r, `analista-${q.metrica}`),
    seguir,
    fixavel: true,
  }
}

/** O motivo de sempre, quando quem chama não traz o seu: mostra a conta (sem nome) e o selo da auditoria. */
function motivoPadrao(r: Resultado, voc: Vocabulario, ctx: Parameters<typeof responder>[2], base: { id: string; fonte: string; etapas: string[] }, pedido: 'nomes' | 'professor'): RespostaDados['motivo'] {
  return {
    opcoes: MOTIVOS_PADRAO,
    confirmar: pedido === 'nomes' ? 'Mostrar os nomes' : 'Mostrar por turma',
    aoEscolher: (motivo) => {
      const q = { ...r.consulta, pedeNomes: false }
      const r2: Resultado = { ...r, consulta: q, porProfessor: false }
      const resp = responder(r2, voc, { ...ctx, motivo: undefined })
      return { ...resp, ...base, id: `${base.id}-m`, frase: resp.frase, auditoria: { quando: 'agora', motivo } }
    },
  }
}

/** A fonte de sempre: "correções aprovadas · 01 a 21/09 · 4 escolas, 26 turmas, 3.241 alunos". */
export function fontePadrao(origem: string, periodo: string) {
  return (r: Resultado) => `${origem} · ${r.consulta.comparar ? 'agosto e setembro' : periodo} · ${r.escolas} ${r.escolas === 1 ? 'escola' : 'escolas'}, ${inteiro(r.turmas)} turmas, ${inteiro(r.alunos)} alunos`
}

/** Atalho: entende, calcula e responde (ou null, para o "ainda não sei"). */
export function perguntar(texto: string, celulas: Celula[], voc: Vocabulario, ctx: Parameters<typeof responder>[2], anterior?: Consulta, minimo = 5): { consulta: Consulta; resposta: RespostaDados } | null {
  const q = entender(texto, voc, anterior)
  if (!q) return null
  return { consulta: q, resposta: responder(calcular(celulas, q, voc, minimo), voc, ctx) }
}

/* ── Exemplo: as células e o vocabulário de demonstração, e o teste ─────────────────────────────────────────── */

/** O vocabulário da rede de exemplo (as 6 escolas de A a Z, do 6º ao 9º, Matemática · Ciências · Português). */
export const VOCABULARIO_EXEMPLO_REDE: Vocabulario = {
  escola: [
    { id: 'araucaria', nome: 'Araucária', apelidos: /araucaria/, de: 'na Araucária' },
    { id: 'bem-te-vi', nome: 'Bem-te-vi', apelidos: /bem.?te.?vi/, de: 'na Bem-te-vi' },
    { id: 'figueira', nome: 'Figueira', apelidos: /figueira/, de: 'na Figueira' },
    { id: 'ipe-amarelo', nome: 'Ipê Amarelo', apelidos: /\bipe\b/, de: 'no Ipê Amarelo' },
    { id: 'manaca', nome: 'Manacá', apelidos: /manaca/, de: 'no Manacá' },
    { id: 'cachoeira', nome: 'Rio Cachoeira', apelidos: /cachoeira/, de: 'no Rio Cachoeira' },
  ],
  serie: [
    { id: '6', nome: '6º ano', apelidos: /\b6o?\s*(ano|serie)|\bsexto\b|\b6o\b/, de: 'do 6º ano' },
    { id: '7', nome: '7º ano', apelidos: /\b7o?\s*(ano|serie)|\bsetimo\b|\b7o\b/, de: 'do 7º ano' },
    { id: '8', nome: '8º ano', apelidos: /\b8o?\s*(ano|serie)|\boitavo\b|\b8o\b/, de: 'do 8º ano' },
    { id: '9', nome: '9º ano', apelidos: /\b9o?\s*(ano|serie)|\bnono\b|\b9o\b/, de: 'do 9º ano' },
  ],
  turma: [],
  disciplina: [
    { id: 'matematica', nome: 'Matemática', apelidos: /matematica|\bmat\b/, de: 'em Matemática' },
    { id: 'ciencias', nome: 'Ciências', apelidos: /ciencia/, de: 'em Ciências' },
    { id: 'portugues', nome: 'Português', apelidos: /portugues|lingua portuguesa|\bport\b/, de: 'em Português' },
  ],
}

/** Um sorteio fixo, para os exemplos não mudarem de uma carga para outra. */
function sorteio(semente: number) {
  let s = semente
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

/** As células de exemplo da rede: as 4 escolas em uso × 6º a 9º × 3 disciplinas × agosto e setembro. Os alunos, os
    que usaram e o acerto de cada série batem com `rede.ts`; o desvio por escola é ilustrativo (a tarefa RP faz o de
    verdade em CELULAS_REDE). A Rio Cachoeira tem só 3 alunos do 9º abaixo de 50% em Português: o caso "menos de 5". */
export function celulasExemploRede(): Celula[] {
  const ESCOLAS = [
    { id: 'araucaria', alunos: 980, turmas: [8, 8, 7, 7], desvio: 2 },
    { id: 'ipe-amarelo', alunos: 820, turmas: [7, 7, 6, 6], desvio: -2 },
    { id: 'manaca', alunos: 900, turmas: [7, 7, 7, 7], desvio: 1 },
    { id: 'cachoeira', alunos: 712, turmas: [6, 5, 6, 5], desvio: -1 },
  ]
  const DISC = ['matematica', 'ciencias', 'portugues'] as const
  const rnd = sorteio(42)
  const cel: Celula[] = []
  ESCOLAS.forEach((e) => {
    const nT = e.turmas.reduce((a, x) => a + x, 0)
    let resto = e.alunos
    e.turmas.forEach((t, i) => {
      const alunos = i === 3 ? resto : Math.round((e.alunos * t) / nT)
      resto -= alunos
      ;(['agosto', 'setembro'] as Mes[]).forEach((mes) => {
        const uso = (mes === 'setembro' ? USO_DE_SETEMBRO : USO_DE_AGOSTO)[e.id]
        const usaram = Math.round((alunos * (uso?.alunosAtivos ?? 0)) / e.alunos)
        const atrasados = Math.round(alunos * (0.04 + rnd() * 0.03))
        DISC.forEach((d) => {
          const serie = ACERTO_POR_SERIE[d][i]
          const acerto = Math.max(30, serie.acerto + e.desvio + (mes === 'agosto' ? -1 : 0))
          const respostas = usaram * 8
          let abaixo50 = Math.round(alunos * Math.max(0.04, (62 - acerto) / 100 + 0.06))
          if (e.id === 'cachoeira' && i === 3 && d === 'portugues' && mes === 'setembro') abaixo50 = 3
          const esperadas = alunos * 3
          cel.push({
            escola: e.id, serie: String(6 + i), disciplina: d, mes, turmas: t,
            alunos, usaram, conversas: Math.round(((uso?.trocasTutor ?? 0) * alunos) / e.alunos / 3),
            respostas, acertos: Math.round((respostas * acerto) / 100), somaNotas: 0, notas: 0,
            atrasados, abaixo50, entregues: Math.round(esperadas * (0.84 + rnd() * 0.08)), esperadas,
            materiais: Math.round(alunos / 8 + rnd() * 6), aprovados: Math.round(alunos / 8.6),
          })
        })
      })
    })
  })
  return cel
}

/** O vocabulário da escola de exemplo (um pedaço do Colégio Aurora: 8º, 9º, 1º EM e 2º EM). */
export const VOCABULARIO_EXEMPLO_ESCOLA: Vocabulario = {
  escola: [{ id: 'aurora', nome: 'Colégio Aurora', apelidos: /aurora|colegio/, de: 'no Colégio Aurora' }],
  serie: [
    { id: '8', nome: '8º ano', apelidos: /\b8o?\s*(ano|serie)|\boitavo\b/, de: 'do 8º ano' },
    { id: '9', nome: '9º ano', apelidos: /\b9o?\s*(ano|serie)|\bnono\b/, de: 'do 9º ano' },
    { id: '1em', nome: '1º ano EM', apelidos: /\b1o?\s*(ano)?\s*(do )?(em|medio|ensino medio)\b|primeiro ano do medio/, de: 'do 1º ano EM' },
    { id: '2em', nome: '2º ano EM', apelidos: /\b2o?\s*(ano)?\s*(do )?(em|medio|ensino medio)\b|segundo ano( do medio)?|\b2o ano\b/, de: 'do 2º ano EM' },
  ],
  turma: [
    { id: '8a', nome: '8ºA', apelidos: /\b8o?\s?a\b/, de: 'do 8ºA' },
    { id: '8b', nome: '8ºB', apelidos: /\b8o?\s?b\b/, de: 'do 8ºB' },
    { id: '8c', nome: '8ºC', apelidos: /\b8o?\s?c\b/, de: 'do 8ºC' },
    { id: '9a', nome: '9ºA', apelidos: /\b9o?\s?a\b/, de: 'do 9ºA' },
    { id: '9b', nome: '9ºB', apelidos: /\b9o?\s?b\b/, de: 'do 9ºB' },
    { id: '9c', nome: '9ºC', apelidos: /\b9o?\s?c\b/, de: 'do 9ºC' },
    { id: '1c', nome: '1ºC', apelidos: /\b1o?\s?c\b/, de: 'do 1ºC' },
    { id: '2a', nome: '2ºA', apelidos: /\b2o?\s?a\b/, de: 'do 2ºA' },
    { id: '2b', nome: '2ºB', apelidos: /\b2o?\s?b\b/, de: 'do 2ºB' },
    { id: '2c', nome: '2ºC', apelidos: /\b2o?\s?c\b/, de: 'do 2ºC' },
    { id: '2d', nome: '2ºD', apelidos: /\b2o?\s?d\b/, de: 'do 2ºD' },
  ],
  disciplina: [
    { id: 'matematica', nome: 'Matemática', apelidos: /matematica/, de: 'em Matemática' },
    { id: 'portugues', nome: 'Português', apelidos: /portugues/, de: 'em Português' },
    { id: 'ciencias', nome: 'Ciências', apelidos: /ciencia/, de: 'em Ciências' },
    { id: 'quimica', nome: 'Química', apelidos: /quimica/, de: 'em Química' },
  ],
}

/** As células de exemplo da escola: o 9º acerta 63% (Matemática 60, Português 65, Ciências 64, como em
    numeros-escola.ts); o 1ºC tem 5 alunos com entregas atrasadas, o 2ºA 4 e o 2ºB 2. */
export function celulasExemploEscola(): Celula[] {
  const T: { turma: string; serie: string; alunos: number; atrasados: number; disc: [string, number][] }[] = [
    { turma: '8a', serie: '8', alunos: 30, atrasados: 1, disc: [['matematica', 64], ['portugues', 68], ['ciencias', 66]] },
    { turma: '8b', serie: '8', alunos: 31, atrasados: 2, disc: [['matematica', 63], ['portugues', 69], ['ciencias', 67]] },
    { turma: '8c', serie: '8', alunos: 29, atrasados: 0, disc: [['matematica', 65], ['portugues', 67], ['ciencias', 65]] },
    { turma: '9a', serie: '9', alunos: 34, atrasados: 1, disc: [['matematica', 60], ['portugues', 65], ['ciencias', 64]] },
    { turma: '9b', serie: '9', alunos: 33, atrasados: 1, disc: [['matematica', 61], ['portugues', 64], ['ciencias', 63]] },
    { turma: '9c', serie: '9', alunos: 33, atrasados: 0, disc: [['matematica', 59], ['portugues', 66], ['ciencias', 65]] },
    { turma: '1c', serie: '1em', alunos: 32, atrasados: 5, disc: [['matematica', 60], ['portugues', 63], ['quimica', 61]] },
    { turma: '2a', serie: '2em', alunos: 31, atrasados: 4, disc: [['matematica', 58], ['portugues', 60], ['quimica', 55]] },
    { turma: '2b', serie: '2em', alunos: 32, atrasados: 2, disc: [['matematica', 59], ['portugues', 61], ['quimica', 55]] },
    { turma: '2c', serie: '2em', alunos: 32, atrasados: 0, disc: [['matematica', 57], ['portugues', 59], ['quimica', 53]] },
    { turma: '2d', serie: '2em', alunos: 31, atrasados: 0, disc: [['matematica', 56], ['portugues', 60], ['quimica', 52]] },
  ]
  const cel: Celula[] = []
  T.forEach((t) => (['agosto', 'setembro'] as Mes[]).forEach((mes) => t.disc.forEach(([d, acerto]) => {
    const a = mes === 'agosto' ? acerto + 1 : acerto
    const respostas = t.alunos * 10
    cel.push({
      escola: 'aurora', serie: t.serie, turma: t.turma, disciplina: d, mes,
      alunos: t.alunos, usaram: t.alunos - (mes === 'agosto' ? 2 : 1), conversas: t.alunos * 22, respostas, acertos: Math.round((respostas * a) / 100),
      somaNotas: (t.alunos * a) / 10, notas: t.alunos, atrasados: mes === 'setembro' ? t.atrasados : 0,
      abaixo50: Math.round(t.alunos * Math.max(0.05, (62 - a) / 100 + 0.08)), entregues: t.alunos * 3 - t.atrasados * 3, esperadas: t.alunos * 3,
      materiais: 6, aprovados: 5,
    })
  })))
  return cel
}

/** As perguntas da tabela da 4.5, com o que se espera de cada uma. Os Fundamentos rodam em desenvolvimento e mostram. */
export function testarConsulta(): { pergunta: string; onde: 'rede' | 'escola'; espera: string; frase: string; consulta: Consulta | null; ok: boolean }[] {
  const rede = celulasExemploRede()
  const escola = celulasExemploEscola()
  const ctxRede = { recorte: 'rede' as const, periodo: '01 a 21/09', fonte: fontePadrao('correções aprovadas e acessos', '01 a 21/09') }
  const ctxEscola = { recorte: 'escola' as const, periodo: '01 a 21/09', fonte: fontePadrao('correções aprovadas', '01 a 21/09') }
  const casos: { pergunta: string; onde: 'rede' | 'escola'; espera: string; confere: (q: Consulta | null, r?: Resultado) => boolean }[] = [
    { pergunta: 'quantos alunos do 8º ano usaram em setembro?', onde: 'rede', espera: 'uso do 8º, o total e por escola de A a Z',
      confere: (q, r) => q?.metrica === 'uso' && q.filtros.serie?.[0] === '8' && q.agrupar === 'escola' && r?.valor !== null },
    { pergunta: 'e em agosto?', onde: 'rede', espera: 'a mesma conta, agosto × setembro', confere: (q) => !!q?.comparar && q.metrica === 'uso' && q.filtros.serie?.[0] === '8' },
    { pergunta: 'acerto de matemática por escola', onde: 'rede', espera: 'barras A a Z; Figueira e Bem-te-vi sem dado',
      confere: (q, r) => q?.agrupar === 'escola' && (r?.grupos?.map((g) => g.id).join(',') ?? '') === 'araucaria,bem-te-vi,figueira,ipe-amarelo,manaca,cachoeira' },
    { pergunta: 'quantos alunos do 9º ano estão abaixo de 50% em português?', onde: 'rede', espera: 'por escola; uma com menos de 5; total fora',
      confere: (q, r) => q?.metrica === 'abaixo50' && q.agrupar === 'escola' && !!r && r.ocultos > 0 && r.valor === null },
    { pergunta: 'quais alunos da araucária foram mal em matemática?', onde: 'rede', espera: 'recusa sem botão + pergunta agregada', confere: (q) => !!q?.pedeNomes },
    { pergunta: 'qual a melhor escola?', onde: 'rede', espera: '"Eu não ordeno escolas…" + A a Z', confere: (q) => !!q?.pedeRanking && q.agrupar === 'escola' },
    { pergunta: 'qual o acerto do 9º ano por disciplina?', onde: 'escola', espera: '63%; Matemática, Português, Ciências',
      confere: (q, r) => q?.metrica === 'acerto' && r?.valor === 63 && r.grupos?.length === 3 },
    { pergunta: 'acerto do 2º ano em química por turma', onde: 'escola', espera: 'pede o motivo (um professor por turma)', confere: (_q, r) => !!r?.porProfessor },
    { pergunta: 'quantos alunos do 1ºC estão com entregas atrasadas? quem são?', onde: 'escola', espera: '5; depois o motivo',
      confere: (q, r) => q?.metrica === 'atrasados' && !!q.pedeNomes && r?.valor === 5 },
    { pergunta: 'qual professor usa menos o Turmma?', onde: 'escola', espera: 'recusa + uso por série', confere: (q) => !!q?.pedeProfessor },
    { pergunta: 'qual a melhor turma do 8º ano?', onde: 'escola', espera: '"Eu não ordeno turmas…" + 8ºA, 8ºB, 8ºC',
      confere: (q, r) => !!q?.pedeRanking && (r?.grupos?.map((g) => g.id).join(',') ?? '') === '8a,8b,8c' },
  ]
  const anteriores: Record<'rede' | 'escola', Consulta | undefined> = { rede: undefined, escola: undefined }
  return casos.map((c) => {
    const voc = c.onde === 'rede' ? VOCABULARIO_EXEMPLO_REDE : VOCABULARIO_EXEMPLO_ESCOLA
    const q = entender(c.pergunta, voc, anteriores[c.onde])
    if (q) anteriores[c.onde] = q
    const qq = q
    const r = qq ? calcular(c.onde === 'rede' ? rede : escola, qq, voc) : undefined
    const resp = r ? responder(r, voc, c.onde === 'rede' ? ctxRede : ctxEscola) : undefined
    return { pergunta: c.pergunta, onde: c.onde, espera: c.espera, frase: resp ? textoDe(resp.frase) : 'ainda não sei', consulta: qq, ok: c.confere(qq, r) }
  })
}

/** O texto puro de uma frase (para o teste e para o CSV). */
export function textoDe(n: ReactNode): string {
  if (n === null || n === undefined || typeof n === 'boolean') return ''
  if (typeof n === 'string' || typeof n === 'number') return String(n)
  if (Array.isArray(n)) return n.map(textoDe).join('')
  if (typeof n === 'object' && 'props' in n) return textoDe((n as { props: { children?: ReactNode } }).props.children)
  return ''
}
