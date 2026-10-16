import { useMemo } from 'react'
import {
  ACERTO_POR_SERIE, AVISOS_DA_REDE, ESCOLAS_DA_REDE, SAIDAS_IA, USO_DE_AGOSTO, USO_DE_SETEMBRO, useEscolasDaOperacao, useRede,
  type DisciplinaRede, type EscolaNaRede, type SituacaoEscola,
} from './rede'
import { MES, pct, porAluno, projecaoDoMes } from './numeros-escola'
import {
  FAIXAS, painelDa, somarLinhas, type Coluna, type DadosDaLinha, type FaixaId, type Frequencia, type HabilidadeTravada, type LinhaDoPainel,
  type Notas,
} from './gestao'
import type { RedeId } from './rede-atual'
import { calcular as calcularConsulta, type Celula, type Consulta, type Mes, type MetricaId, type Resultado, type Vocabulario } from './consulta'

/* OS NÚMEROS DA REDE MUNICIPAL DE JOINVILLE, UMA FONTE SÓ (13ª rodada, 04/10/2026; plano de painéis e introdução,
   seção 1.5). O painel da secretaria, o Analista da rede, a introdução e o relatório leem daqui.
   Só agregado da rede e por escola: nenhum número de aluno nem de professor (regra 10, item 8; regra 60, item 11;
   D45; D64). Escolas sempre de A a Z.
   As escolas trazem a correção do convite que a operação mexe (revogar o convite da Figueira volta a escola para
   "sem convite"), que antes morava em `outras/Rede.tsx`. Os marcados (novo) nascem aqui. 100% sintético (D71). */

export type PacoteDaEscola = { id: string; curto: string; custo: number; teto: number; usado: number; porAluno: number }

export type NumerosDaRede = {
  /** de A a Z, com as criadas na demonstração */
  escolas: EscolaNaRede[]
  situacoes: Record<SituacaoEscola, number>
  emUso: number
  total: number
  alunos: { comAcesso: number; usaram: number; pct: number; agosto: number; pctAgosto: number }
  turmas: number
  acerto: typeof ACERTO_POR_SERIE
  /** agosto (novo) */
  acertoAgosto: typeof ACERTO_POR_SERIE
  /** a média da disciplina, ponderada pelas turmas: Matemática 62, Ciências 65, Português 67 */
  mediaDaDisciplina: Record<DisciplinaRede, number>
  materiais: {
    total: number
    porEscola: Record<string, number>
    /** agosto (novo) */
    agosto: number
    agostoPorEscola: Record<string, number>
    revisado: number
    aprovado: number
    aprovadoAgosto: number
  }
  pacote: {
    custo: number
    teto: number
    usado: number
    porAluno: number
    projecao: number
    /** as escolas em uso, de A a Z */
    porEscola: PacoteDaEscola[]
    agosto: { custo: number; usado: number; porAluno: number }
    porFuncao: { rotulo: string; valor: number }[]
  }
  avisos: { recebidos: number; noPrazo: number; agosto: { recebidos: number; noPrazo: number } }
}

/** Acerto por série em agosto (novo), na mesma forma de ACERTO_POR_SERIE. */
const ACERTO_AGOSTO: typeof ACERTO_POR_SERIE = {
  matematica: [{ serie: '6º ano', acerto: 67, turmas: 28 }, { serie: '7º ano', acerto: 61, turmas: 27 }, { serie: '8º ano', acerto: 58, turmas: 26 }, { serie: '9º ano', acerto: 62, turmas: 25 }],
  ciencias: [{ serie: '6º ano', acerto: 71, turmas: 28 }, { serie: '7º ano', acerto: 65, turmas: 27 }, { serie: '8º ano', acerto: 63, turmas: 26 }, { serie: '9º ano', acerto: 60, turmas: 25 }],
  portugues: [{ serie: '6º ano', acerto: 70, turmas: 28 }, { serie: '7º ano', acerto: 68, turmas: 27 }, { serie: '8º ano', acerto: 62, turmas: 26 }, { serie: '9º ano', acerto: 64, turmas: 25 }],
}

/** Materiais da IA em agosto, por escola (novo): 371 + 318 + 342 + 421 = 1.452. */
const SAIDAS_AGOSTO: Record<string, number> = { araucaria: 371, 'ipe-amarelo': 318, manaca: 342, cachoeira: 421 }

const POR_FUNCAO = [
  { rotulo: 'Tutor dos alunos', valor: 64 },
  { rotulo: 'Materiais dos professores', valor: 29 },
  { rotulo: 'Correções', valor: 7 },
]

const AVISOS_AGOSTO = { recebidos: 9, noPrazo: 9 }

const media = (l: { acerto: number; turmas: number }[]) =>
  Math.round(l.reduce((s, x) => s + x.acerto * x.turmas, 0) / Math.max(1, l.reduce((s, x) => s + x.turmas, 0)))

/** Os números da rede, com as escolas como a operação deixou. */
export function useNumerosDaRede(): NumerosDaRede {
  const vista = useRede()
  const daOperacao = useEscolasDaOperacao()
  return useMemo(() => {
    const coord = new Map(daOperacao.map((e) => [e.id, e.coordenacao]))
    const escolas = vista.escolas.map((e): EscolaNaRede => {
      const c = coord.get(e.id)
      if (e.situacao === 'convite' && c === 'sem convite') return { ...e, situacao: 'nova' }
      if (e.situacao === 'nova' && c === 'convite em aberto') return { ...e, situacao: 'convite' }
      return e
    })
    const situacoes: Record<SituacaoEscola, number> = { 'em-uso': 0, montando: 0, convite: 0, nova: 0 }
    escolas.forEach((e) => { situacoes[e.situacao] += 1 })
    const emUso = escolas.filter((e) => e.situacao === 'em-uso')

    const comAcesso = emUso.reduce((s, e) => s + e.alunos, 0)
    const usaram = emUso.reduce((s, e) => s + (USO_DE_SETEMBRO[e.id]?.alunosAtivos ?? 0), 0)
    const usaramAgosto = emUso.reduce((s, e) => s + (USO_DE_AGOSTO[e.id]?.alunosAtivos ?? 0), 0)
    const turmas = emUso.reduce((s, e) => s + e.turmas, 0)

    const total = emUso.reduce((s, e) => s + (SAIDAS_IA[e.id] ?? 0), 0)
    const agosto = emUso.reduce((s, e) => s + (SAIDAS_AGOSTO[e.id] ?? 0), 0)
    const aprovado = Math.round(emUso.reduce((s, e) => s + e.aprovado * e.alunos, 0) / Math.max(1, comAcesso))

    const porEscola: PacoteDaEscola[] = emUso.map((e) => {
      const u = USO_DE_SETEMBRO[e.id]
      const custo = u?.custoIA ?? 0
      const teto = u?.tetoIA ?? 0
      return { id: e.id, curto: e.curto, custo, teto, usado: pct(custo, teto), porAluno: porAluno(custo, e.alunos) }
    })
    const custo = porEscola.reduce((s, e) => s + e.custo, 0)
    const teto = porEscola.reduce((s, e) => s + e.teto, 0)
    const custoAgosto = emUso.reduce((s, e) => s + (USO_DE_AGOSTO[e.id]?.custoIA ?? 0), 0)
    const tetoAgosto = emUso.reduce((s, e) => s + (USO_DE_AGOSTO[e.id]?.tetoIA ?? 0), 0)

    return {
      escolas,
      situacoes,
      emUso: emUso.length,
      total: escolas.length,
      alunos: { comAcesso, usaram, pct: pct(usaram, comAcesso), agosto: usaramAgosto, pctAgosto: pct(usaramAgosto, comAcesso) },
      turmas,
      acerto: ACERTO_POR_SERIE,
      acertoAgosto: ACERTO_AGOSTO,
      mediaDaDisciplina: {
        matematica: media(ACERTO_POR_SERIE.matematica),
        ciencias: media(ACERTO_POR_SERIE.ciencias),
        portugues: media(ACERTO_POR_SERIE.portugues),
      },
      materiais: {
        total, porEscola: SAIDAS_IA, agosto, agostoPorEscola: SAIDAS_AGOSTO,
        revisado: 100, aprovado, aprovadoAgosto: 93,
      },
      pacote: {
        custo, teto, usado: pct(custo, teto), porAluno: porAluno(custo, comAcesso), projecao: projecaoDoMes(custo, teto),
        porEscola,
        agosto: { custo: custoAgosto, usado: pct(custoAgosto, tetoAgosto), porAluno: porAluno(custoAgosto, comAcesso) },
        porFuncao: POR_FUNCAO,
      },
      avisos: { recebidos: AVISOS_DA_REDE.total, noPrazo: AVISOS_DA_REDE.respondidos, agosto: AVISOS_AGOSTO },
    }
  }, [vista, daOperacao])
}

/* ══ 14ª RODADA (05/10/2026; plano ux-composicao, 4.3, 4.5 e 4.6): AS CÉLULAS DA REDE ═══════════════════════════════
   O Painel e o Analista da secretaria calculam sobre a MESMA fonte: as células agregadas por escola × série ×
   disciplina × mês (nenhuma linha de aluno; na rede não há turma). Tudo o que existe acima fica como está (a
   introdução e a operação usam); daqui para baixo é só acréscimo.
   · As 4 escolas em uso × 6º a 9º × Matemática, Ciências e Português × agosto e setembro (96 células). A Bem-te-vi, a
     Figueira e a escola criada na demonstração não têm célula: aparecem como "ainda sem dado".
   · Turmas por escola e série (somam as linhas e as colunas de rede.ts): Araucária 8, 8, 7, 7 · Ipê Amarelo 7, 7, 6, 6
     · Manacá 7, 7, 7, 7 · Rio Cachoeira 6, 5, 6, 5 (escolas 30, 26, 28, 22; séries 28, 27, 26, 25).
   · Os alunos de cada escola (980, 820, 900, 712) repartidos pelas turmas; os que usaram batem com USO_DE_SETEMBRO e
     USO_DE_AGOSTO.
   · O acerto de cada escola é o da rede mais um desvio inteiro cuja média, ponderada pelas turmas, é zero em cada série
     e disciplina: a rede continua igual a ACERTO_POR_SERIE (e agosto, ao acerto de agosto). As respostas são
     proporcionais às turmas, para a conta do motor (acertos ÷ respostas) ponderar como a rede pondera.
   · A Rio Cachoeira tem 3 alunos do 9º ano abaixo de 50% em Português: o grupo "menos de 5" da demonstração.
   conferirNumerosRede() confere tudo isso; em desenvolvimento roda ao carregar (console.assert). 100% sintético (D71). */


/** As séries da rede (só o fundamental II), na ordem natural. */
export const SERIES_REDE = [
  { id: '6', nome: '6º ano', curto: '6º' }, { id: '7', nome: '7º ano', curto: '7º' },
  { id: '8', nome: '8º ano', curto: '8º' }, { id: '9', nome: '9º ano', curto: '9º' },
] as const
export type SerieRede = (typeof SERIES_REDE)[number]['id']

/** As disciplinas com prova objetiva na rede, na ordem do painel (Matemática · Ciências · Português). */
export const DISCIPLINAS_REDE: { id: DisciplinaRede; nome: string; curto: string }[] = [
  { id: 'matematica', nome: 'Matemática', curto: 'Mat' }, { id: 'ciencias', nome: 'Ciências', curto: 'Ciê' }, { id: 'portugues', nome: 'Português', curto: 'Por' },
]

/** Turmas de cada escola em uso, do 6º ao 9º. */
export const TURMAS_REDE: Record<string, [number, number, number, number]> = {
  araucaria: [8, 8, 7, 7],
  'ipe-amarelo': [7, 7, 6, 6],
  manaca: [7, 7, 7, 7],
  cachoeira: [6, 5, 6, 5],
}
const ESCOLAS_COM_DADO = Object.keys(TURMAS_REDE)
const ALUNOS_ESCOLA: Record<string, number> = { araucaria: 980, 'ipe-amarelo': 820, manaca: 900, cachoeira: 712 }

/** O desvio do acerto de cada escola (em pontos), por série e disciplina, na ordem Araucária · Ipê · Manacá · Rio
    Cachoeira. Em cada série e disciplina, Σ turmas × desvio = 0. */
const DESVIO: Record<SerieRede, Record<DisciplinaRede, [number, number, number, number]>> = {
  '6': { matematica: [2, -1, -3, 2], ciencias: [-2, 1, 3, -2], portugues: [2, -3, -1, 2] },
  '7': { matematica: [1, 2, -1, -3], ciencias: [2, -2, -1, 1], portugues: [-1, 1, -2, 3] },
  '8': { matematica: [2, 1, -2, -1], ciencias: [1, -2, -1, 2], portugues: [-1, 2, 1, -2] },
  '9': { matematica: [1, 2, -2, -1], ciencias: [2, -1, 1, -3], portugues: [-2, 2, 1, -1] },
}

/** Respostas objetivas por turma em cada disciplina: agosto inteiro e setembro até 21/09. */
const RESPOSTAS_POR_TURMA: Record<Mes, number> = { agosto: 300, setembro: 240 }
/** Entregas no prazo por série (fração): [agosto, setembro]. */
const NO_PRAZO_REDE: Record<SerieRede, [number, number]> = { '6': [0.91, 0.92], '7': [0.89, 0.9], '8': [0.87, 0.88], '9': [0.86, 0.87] }
/** Materiais da IA em agosto, por escola (os de setembro são SAIDAS_IA). */
const MATERIAIS_AGOSTO: Record<string, number> = { araucaria: 371, 'ipe-amarelo': 318, manaca: 342, cachoeira: 421 }

const repartir = (total: number, pesos: number[]) => {
  const soma = pesos.reduce((a, b) => a + b, 0)
  const partes = pesos.map((p) => Math.floor((total * p) / Math.max(1, soma)))
  let resto = total - partes.reduce((a, b) => a + b, 0)
  // o resto vai para as maiores partes, na ordem
  const ordem = pesos.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p || a.i - b.i)
  for (let k = 0; resto > 0; k = (k + 1) % ordem.length, resto--) partes[ordem[k].i] += 1
  return partes
}

function montarCelulasRede(): Celula[] {
  const cel: Celula[] = []
  ESCOLAS_COM_DADO.forEach((e, ie) => {
    const turmas = TURMAS_REDE[e]
    const alunos = repartir(ALUNOS_ESCOLA[e], turmas)
    const aprovadoPct = ESCOLAS_DA_REDE.find((x) => x.id === e)?.aprovado ?? 95
    ;(['agosto', 'setembro'] as Mes[]).forEach((mes) => {
      const m = mes === 'agosto' ? 0 : 1
      const uso = (mes === 'setembro' ? USO_DE_SETEMBRO : USO_DE_AGOSTO)[e]
      const usaram = repartir(uso?.alunosAtivos ?? 0, alunos)
      const conversas = repartir(uso?.trocasTutor ?? 0, usaram.flatMap((u) => [u, u, u]))
      const totalMat = mes === 'setembro' ? SAIDAS_IA[e] ?? 0 : MATERIAIS_AGOSTO[e] ?? 0
      const pesosMat = alunos.flatMap((a) => [a, a, a])
      const materiais = repartir(totalMat, pesosMat)
      const aprovados = repartir(Math.round((totalMat * (aprovadoPct - (mes === 'agosto' ? 2 : 0))) / 100), pesosMat)
      SERIES_REDE.forEach((s, is) => {
        DISCIPLINAS_REDE.forEach((d, id) => {
          const k = is * 3 + id
          const daRede = (mes === 'setembro' ? ACERTO_POR_SERIE : ACERTO_AGOSTO)[d.id][is].acerto
          const acerto = daRede + DESVIO[s.id][d.id][ie]
          const respostas = turmas[is] * RESPOSTAS_POR_TURMA[mes]
          let abaixo50 = Math.round(alunos[is] * Math.min(0.4, Math.max(0.04, (62 - acerto) / 100 + 0.07)))
          if (e === 'cachoeira' && s.id === '9' && d.id === 'portugues' && mes === 'setembro') abaixo50 = 3
          const esperadas = alunos[is] * (mes === 'agosto' ? 3 : 2)
          cel.push({
            escola: e, serie: s.id, disciplina: d.id, mes, turmas: turmas[is],
            alunos: alunos[is], usaram: usaram[is], conversas: conversas[k],
            respostas, acertos: Math.round((respostas * acerto) / 100), somaNotas: 0, notas: 0,
            atrasados: Math.round(alunos[is] * (0.03 + is * 0.008 + (mes === 'setembro' ? 0.004 : 0))),
            abaixo50,
            entregues: Math.round(esperadas * (NO_PRAZO_REDE[s.id][m] + ([0.01, -0.01, 0.005, -0.005][ie] ?? 0))), esperadas,
            materiais: materiais[k], aprovados: aprovados[k],
          })
        })
      })
    })
  })
  return cel
}

/** As células da rede: 4 escolas em uso × 6º a 9º × 3 disciplinas × agosto e setembro. */
export const CELULAS_REDE: Celula[] = montarCelulasRede()

/* ── O vocabulário do Analista da rede (a ordem é a natural: escolas de A a Z, 6º → 9º) ──────────────────────── */

const semAcentoMin = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const APELIDOS_ESCOLA: Record<string, RegExp> = {
  araucaria: /araucaria/,
  'bem-te-vi': /bem.?te.?vi/,
  figueira: /figueira/,
  'ipe-amarelo': /\bipe\b|ipe amarelo/,
  manaca: /manaca/,
  cachoeira: /cachoeira/,
}
const serieRede = (n: string, extenso: string) => new RegExp(`\\b${n}o?\\s*(ano|serie)s?\\b|\\b${extenso}\\b|\\b${n}o\\b`)

/** O vocabulário com as escolas que a rede tem agora (as de sempre e as criadas na demonstração), de A a Z. */
export function vocabularioRede(escolas: { id: string; curto: string }[] = ESCOLAS_DA_REDE): Vocabulario {
  const lista = [...escolas].sort((a, b) => a.curto.localeCompare(b.curto, 'pt-BR'))
  return {
    escola: lista.map((e) => ({
      id: e.id, nome: e.curto, de: `na ${e.curto}`,
      apelidos: APELIDOS_ESCOLA[e.id] ?? new RegExp(semAcentoMin(e.curto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    })),
    serie: [
      { id: '6', nome: '6º ano', apelidos: serieRede('6', 'sexto'), de: 'do 6º ano' },
      { id: '7', nome: '7º ano', apelidos: serieRede('7', 'setimo'), de: 'do 7º ano' },
      { id: '8', nome: '8º ano', apelidos: serieRede('8', 'oitavo'), de: 'do 8º ano' },
      { id: '9', nome: '9º ano', apelidos: serieRede('9', 'nono'), de: 'do 9º ano' },
    ],
    turma: [],
    disciplina: [
      { id: 'matematica', nome: 'Matemática', apelidos: /matematica|\bmat\b/, de: 'em Matemática' },
      { id: 'ciencias', nome: 'Ciências', apelidos: /ciencia/, de: 'em Ciências' },
      { id: 'portugues', nome: 'Português', apelidos: /portugues|lingua portuguesa/, de: 'em Português' },
    ],
  }
}

/** O vocabulário das 6 escolas de sempre. */
export const VOCABULARIO_REDE: Vocabulario = vocabularioRede()

/** A conta de uma métrica na rede (ou numa escola, série, disciplina), pelo motor, sobre CELULAS_REDE, já com a
    supressão entre agrupamentos (protegerRede). */
export function contarRede(metrica: MetricaId, filtros: Consulta['filtros'], mes: Mes, extra: Partial<Consulta> = {}, voc: Vocabulario = VOCABULARIO_REDE): ResultadoRede {
  return calcularRede({ metrica, filtros, mes, ...extra }, voc)
}

/* ── A supressão entre agrupamentos (05/10/2026) ─────────────────────────────────────────────────────────────────
   O motor esconde o grupo com menos de 5 e o total da MESMA resposta. Mas, entre respostas, a conta voltava: "9º em
   Português por escola" escondia a Rio Cachoeira (3) e o total; "Português por série" mostrava o 9º ano (34); e
   34 − (14 + 8 + 9) = 3. A regra agora: toda contagem de alunos (abaixo de 50%, entregas faltando) que INCLUI uma
   unidade sensível (escola × série × disciplina × mês com 1 a 4 alunos) e não é a própria unidade não aparece, em
   qualquer agrupamento (por série, por disciplina, por escola, o total da rede). Assim nenhuma subtração isola o
   grupo pequeno. Os grupos de 5 ou mais são regra nossa (D45); a proteção do dado de criança e adolescente é lei
   (LGPD, art. 14). */

const CONTAGENS: MetricaId[] = ['abaixo50', 'atrasados']
type Unidade = { escola: string; serie: string; disciplina?: string; mes: Mes }

/** Uma resposta da rede: o resultado do motor e o que saiu por conter um grupo pequeno ("total", id do grupo, ou
    "linha|coluna" no cruzado). */
export type ResultadoRede = Resultado & { protegidos?: Set<string> }

const SENSIVEIS = new Map<string, Unidade[]>()
/** As unidades com 1 a 4 alunos na contagem (abaixo de 50% é por disciplina; entregas faltando é do aluno, sem disciplina). */
function unidadesSensiveis(m: MetricaId, mes: Mes): Unidade[] {
  const k = `${m}|${mes}`
  const pronto = SENSIVEIS.get(k)
  if (pronto) return pronto
  const l: Unidade[] = []
  if (CONTAGENS.includes(m)) {
    const vistas = new Set<string>()
    CELULAS_REDE.filter((c) => c.mes === mes).forEach((c) => {
      const v = m === 'abaixo50' ? c.abaixo50 : c.atrasados
      const u: Unidade = m === 'abaixo50' ? { escola: c.escola, serie: c.serie, disciplina: c.disciplina, mes } : { escola: c.escola, serie: c.serie, mes }
      const chave = `${u.escola}|${u.serie}|${u.disciplina ?? ''}`
      if (v > 0 && v < 5 && !vistas.has(chave)) { vistas.add(chave); l.push(u) }
    })
  }
  SENSIVEIS.set(k, l)
  return l
}

const dentro = (c: Celula, u: Unidade) => c.escola === u.escola && c.serie === u.serie && (!u.disciplina || c.disciplina === u.disciplina)

/** As células de um recorte (o mesmo filtro do motor). */
function celulasDe(filtros: Consulta['filtros'], mes: Mes): Celula[] {
  return CELULAS_REDE.filter((c) => c.mes === mes && (Object.keys(filtros) as (keyof Consulta['filtros'])[]).every((d) => {
    const lista = filtros[d]
    if (!lista?.length) return true
    const v = c[d as 'escola' | 'serie' | 'disciplina']
    return v !== undefined && lista.includes(v)
  }))
}

/** O recorte inclui uma unidade sensível sem ser ela mesma (então o número revelaria a unidade por subtração). */
function revelaria(m: MetricaId, filtros: Consulta['filtros'], mes: Mes): boolean {
  const us = unidadesSensiveis(m, mes)
  if (!us.length) return false
  const cels = celulasDe(filtros, mes)
  // abaixo de 50% em mais de uma disciplina conta o aluno uma vez (o maior número da série): não soma a unidade
  return us.some((u) => cels.some((c) => dentro(c, u)) && !cels.every((c) => dentro(c, u))
    && (!u.disciplina || cels.every((c) => c.disciplina === u.disciplina)))
}

/** Aplica a supressão entre agrupamentos a um resultado do motor. */
export function protegerRede(r: Resultado): ResultadoRede {
  const q = r.consulta
  if (!CONTAGENS.includes(q.metrica)) return r
  const protegidos = new Set<string>()
  const meses: Mes[] = q.comparar ? ['agosto', q.mes] : [q.mes]
  const esconde = (f: Consulta['filtros']) => meses.some((mes) => revelaria(q.metrica, f, mes))
  let ocultos = r.ocultos
  const grupos = r.grupos?.map((g) => {
    if (g.alunos === 0) return g
    const f = { ...q.filtros, [q.agrupar!]: [g.id] }
    if (!esconde(f)) return g
    protegidos.add(g.id)
    if (g.valor !== null) ocultos += 1
    return { ...g, valor: null, ...(q.comparar ? { agosto: null } : {}) }
  })
  const cruzado = r.cruzado && q.agrupar && q.agrupar2 ? {
    ...r.cruzado,
    valores: r.cruzado.valores.map((linha, i) => linha.map((v, j) => {
      const l = r.cruzado!.linhas[i].id, c = r.cruzado!.colunas[j].id
      if (v === null || !esconde({ ...q.filtros, [q.agrupar!]: [l], [q.agrupar2!]: [c] })) return v
      protegidos.add(`${l}|${c}`)
      ocultos += 1
      return null
    })),
  } : r.cruzado
  const totalSai = esconde(q.filtros) || protegidos.size > 0
  if (totalSai) protegidos.add('total')
  if (!protegidos.size) return r
  return {
    ...r, grupos, cruzado, ocultos,
    valor: totalSai ? null : r.valor,
    agosto: r.agosto === undefined ? undefined : totalSai ? null : r.agosto,
    protegidos,
  }
}

/** O motor sobre as células da rede, com a supressão entre agrupamentos. */
export function calcularRede(q: Consulta, voc: Vocabulario = VOCABULARIO_REDE): ResultadoRede {
  return protegerRede(calcularConsulta(CELULAS_REDE, q, voc))
}

/* ── As 8 semanas de cada número do Painel (27/07 a 20/09: 5 de agosto, 3 de setembro) ───────────────────────── */

export const SEMANAS_REDE = {
  rotulos: ['27/07', '03/08', '10/08', '17/08', '24/08', '31/08', '07/09', '14/09'],
  mes: ['agosto', 'agosto', 'agosto', 'agosto', 'agosto', 'setembro', 'setembro', 'setembro'] as Mes[],
  /** acerto: pontos a somar ao número do mês */
  acerto: [-1, 0, 1, 0, -1, 0, 1, -1],
  /** alunos que usaram: a parte dos que usaram no mês que usou em cada semana */
  uso: [0.78, 0.84, 0.87, 0.89, 0.9, 0.88, 0.91, 0.93],
  /** aprovado: pontos a somar ao número do mês */
  aprovado: [-1, 1, 0, -1, 1, -1, 0, 1],
  /** pacote: a parte do mês gasta em cada semana (agosto soma 1; setembro, até 21/09, soma 1) */
  pacote: [0.1, 0.22, 0.23, 0.23, 0.22, 0.3, 0.33, 0.37],
} as const

export type NumeroDaRede = 'uso' | 'acerto' | 'revisado' | 'pacote'

/** As 8 semanas de um número, a partir do valor de cada mês no recorte do filtro. */
export function semanasRede(n: NumeroDaRede, agosto: number | null, setembro: number | null): (number | null)[] {
  return SEMANAS_REDE.rotulos.map((_, i) => {
    const v = SEMANAS_REDE.mes[i] === 'agosto' ? agosto : setembro
    if (v === null) return null
    if (n === 'acerto') return v + SEMANAS_REDE.acerto[i]
    if (n === 'revisado') return Math.min(100, v + SEMANAS_REDE.aprovado[i])
    if (n === 'uso') return Math.round(v * SEMANAS_REDE.uso[i])
    return Math.round(v * SEMANAS_REDE.pacote[i])
  })
}

/* ── As habilidades da rede (BNCC do fundamental), por série e disciplina ───────────────────────────────────── */

export type HabilidadeDaRede = { serie: SerieRede; disciplina: DisciplinaRede; codigo: string; nome: string; acerto: number; agosto: number | null }

export const HABILIDADES_REDE: HabilidadeDaRede[] = [
  { serie: '6', disciplina: 'matematica', codigo: 'EF06MA07', nome: 'Frações equivalentes', acerto: 59, agosto: 58 },
  { serie: '6', disciplina: 'matematica', codigo: 'EF06MA13', nome: 'Porcentagem', acerto: 62, agosto: 61 },
  { serie: '6', disciplina: 'ciencias', codigo: 'EF06CI01', nome: 'Misturas', acerto: 64, agosto: 63 },
  { serie: '6', disciplina: 'ciencias', codigo: 'EF06CI07', nome: 'Sistema nervoso', acerto: 67, agosto: null },
  { serie: '6', disciplina: 'portugues', codigo: 'EF06LP05', nome: 'Inferência em texto', acerto: 61, agosto: 60 },
  { serie: '6', disciplina: 'portugues', codigo: 'EF67LP08', nome: 'Efeitos de sentido', acerto: 65, agosto: 64 },
  { serie: '7', disciplina: 'matematica', codigo: 'EF07MA04', nome: 'Números inteiros', acerto: 53, agosto: 54 },
  { serie: '7', disciplina: 'matematica', codigo: 'EF07MA18', nome: 'Equações do 1º grau', acerto: 55, agosto: null },
  { serie: '7', disciplina: 'ciencias', codigo: 'EF07CI01', nome: 'Máquinas simples', acerto: 60, agosto: 59 },
  { serie: '7', disciplina: 'ciencias', codigo: 'EF07CI08', nome: 'Ecossistemas', acerto: 63, agosto: null },
  { serie: '7', disciplina: 'portugues', codigo: 'EF07LP09', nome: 'Concordância', acerto: 62, agosto: 61 },
  { serie: '7', disciplina: 'portugues', codigo: 'EF67LP28', nome: 'Gêneros textuais', acerto: 66, agosto: 66 },
  { serie: '8', disciplina: 'matematica', codigo: 'EF08MA06', nome: 'Expressões algébricas', acerto: 51, agosto: 52 },
  { serie: '8', disciplina: 'matematica', codigo: 'EF08MA08', nome: 'Sistemas de equações', acerto: 49, agosto: 51 },
  { serie: '8', disciplina: 'ciencias', codigo: 'EF08CI04', nome: 'Energia elétrica', acerto: 57, agosto: 56 },
  { serie: '8', disciplina: 'ciencias', codigo: 'EF08CI08', nome: 'Reprodução', acerto: 61, agosto: null },
  { serie: '8', disciplina: 'portugues', codigo: 'EF08LP04', nome: 'Regência', acerto: 55, agosto: 56 },
  { serie: '8', disciplina: 'portugues', codigo: 'EF89LP03', nome: 'Argumentação', acerto: 58, agosto: 57 },
  { serie: '9', disciplina: 'matematica', codigo: 'EF09MA09', nome: 'Equação do 2º grau', acerto: 52, agosto: 53 },
  { serie: '9', disciplina: 'matematica', codigo: 'EF09MA06', nome: 'Funções', acerto: 56, agosto: 55 },
  { serie: '9', disciplina: 'ciencias', codigo: 'EF09CI02', nome: 'Reações químicas', acerto: 50, agosto: 53 },
  { serie: '9', disciplina: 'ciencias', codigo: 'EF09CI08', nome: 'Hereditariedade', acerto: 54, agosto: null },
  { serie: '9', disciplina: 'portugues', codigo: 'EF09LP08', nome: 'Orações subordinadas', acerto: 57, agosto: 58 },
  { serie: '9', disciplina: 'portugues', codigo: 'EF89LP04', nome: 'Tese e argumentos', acerto: 60, agosto: null },
]

/** As habilidades de menor acerto no recorte (só aqui se ordena por valor: é conteúdo, não escola nem gente). Numa
    escola, o acerto da habilidade leva o desvio da escola naquela série e disciplina. */
export function ondeMaisErramRede(f: { escola?: string | null; serie?: string | null; disciplina?: string | null; mes?: Mes }, n = 5): (HabilidadeDaRede & { valor: number })[] {
  const ie = f.escola ? ESCOLAS_COM_DADO.indexOf(f.escola) : -1
  if (f.escola && ie < 0) return []
  return HABILIDADES_REDE
    .filter((h) => (!f.serie || h.serie === f.serie) && (!f.disciplina || h.disciplina === f.disciplina))
    .map((h) => {
      const base = f.mes === 'agosto' ? h.agosto : h.acerto
      return { ...h, valor: base === null ? null : base + (ie >= 0 ? DESVIO[h.serie][h.disciplina][ie] : 0) }
    })
    .filter((h): h is HabilidadeDaRede & { valor: number } => h.valor !== null)
    .sort((a, b) => a.valor - b.valor)
    .slice(0, n)
}

/* ── A conferência ───────────────────────────────────────────────────────────────────────────────────────────── */

/** Confere as contas das células com as constantes de hoje. Em desenvolvimento, roda ao carregar (console.assert). */
export function conferirNumerosRede(): { conta: string; esperado: string; obtido: string; ok: boolean }[] {
  const l: { conta: string; esperado: string; obtido: string; ok: boolean }[] = []
  const ver = (nome: string, esperado: number | string | null | undefined, obtido: number | string | null | undefined) =>
    l.push({ conta: nome, esperado: String(esperado), obtido: String(obtido), ok: String(esperado) === String(obtido) })
  const emUso = ESCOLAS_DA_REDE.filter((e) => e.situacao === 'em-uso')
  ver('escolas com célula', emUso.map((e) => e.id).join(','), ESCOLAS_COM_DADO.join(','))
  const uso = contarRede('uso', {}, 'setembro')
  ver('alunos com acesso', emUso.reduce((s, e) => s + e.alunos, 0), uso.alunos)
  ver('usaram em setembro', emUso.reduce((s, e) => s + (USO_DE_SETEMBRO[e.id]?.alunosAtivos ?? 0), 0), uso.extra?.usaram)
  ver('usaram em agosto', emUso.reduce((s, e) => s + (USO_DE_AGOSTO[e.id]?.alunosAtivos ?? 0), 0), contarRede('uso', {}, 'agosto').extra?.usaram)
  ver('turmas', emUso.reduce((s, e) => s + e.turmas, 0), uso.turmas)
  emUso.forEach((e) => {
    const r = contarRede('uso', { escola: [e.id] }, 'setembro')
    ver(`alunos ${e.curto}`, e.alunos, r.alunos)
    ver(`turmas ${e.curto}`, e.turmas, r.turmas)
    ver(`usaram ${e.curto}`, USO_DE_SETEMBRO[e.id]?.alunosAtivos, r.extra?.usaram)
    ver(`usaram ${e.curto} agosto`, USO_DE_AGOSTO[e.id]?.alunosAtivos, contarRede('uso', { escola: [e.id] }, 'agosto').extra?.usaram)
    ver(`materiais ${e.curto}`, SAIDAS_IA[e.id], contarRede('materiais', { escola: [e.id] }, 'setembro').valor)
    ver(`conversas ${e.curto}`, USO_DE_SETEMBRO[e.id]?.trocasTutor, contarRede('conversas', { escola: [e.id] }, 'setembro').valor)
  })
  ;(['matematica', 'ciencias', 'portugues'] as DisciplinaRede[]).forEach((d) => {
    ACERTO_POR_SERIE[d].forEach((s, i) => {
      const serie = SERIES_REDE[i].id
      ver(`acerto ${s.serie} ${d}`, s.acerto, contarRede('acerto', { serie: [serie], disciplina: [d] }, 'setembro').valor)
      ver(`acerto ${s.serie} ${d} agosto`, ACERTO_AGOSTO[d][i].acerto, contarRede('acerto', { serie: [serie], disciplina: [d] }, 'agosto').valor)
      ver(`turmas ${s.serie}`, s.turmas, contarRede('acerto', { serie: [serie], disciplina: [d] }, 'setembro').turmas)
    })
    ver(`média de ${d}`, media(ACERTO_POR_SERIE[d]), contarRede('acerto', { disciplina: [d] }, 'setembro').valor)
  })
  SERIES_REDE.forEach((s) => (['matematica', 'ciencias', 'portugues'] as DisciplinaRede[]).forEach((d) => {
    const soma = ESCOLAS_COM_DADO.reduce((a, e, ie) => a + TURMAS_REDE[e][SERIES_REDE.indexOf(s)] * DESVIO[s.id][d][ie], 0)
    ver(`desvio ${s.curto} ${d} pondera zero`, 0, soma)
  }))
  ver('menos de 5: Rio Cachoeira, 9º, Português', 'null', String(contarRede('abaixo50', { serie: ['9'], disciplina: ['portugues'] }, 'setembro', { agrupar: 'escola' }).grupos?.find((g) => g.id === 'cachoeira')?.valor ?? null))
  ver('o 9º em Português por série não aparece', 'null', String(contarRede('abaixo50', { disciplina: ['portugues'] }, 'setembro', { agrupar: 'serie' }).grupos?.find((g) => g.id === '9')?.valor ?? null))
  // nenhum número visível menos as partes visíveis dele (por escola, série ou disciplina) dá de 1 a 4
  const ids = { escola: ESCOLAS_COM_DADO, serie: SERIES_REDE.map((s) => s.id as string), disciplina: DISCIPLINAS_REDE.map((d) => d.id as string) }
  const dims = Object.keys(ids) as (keyof typeof ids)[]
  const opcoes = (d: keyof typeof ids) => [null, ...ids[d]]
  let vazamentos = 0
  for (const m of CONTAGENS) for (const mes of ['agosto', 'setembro'] as Mes[]) {
    for (const e of opcoes('escola')) for (const s of opcoes('serie')) for (const d of opcoes('disciplina')) {
      const f: Consulta['filtros'] = {}
      if (e) f.escola = [e]
      if (s) f.serie = [s]
      if (d) f.disciplina = [d]
      const todo = contarRede(m, f, mes).valor
      if (todo === null) continue
      dims.filter((dim) => !f[dim]).forEach((dim) => {
        const partes = ids[dim].map((x) => contarRede(m, { ...f, [dim]: [x] }, mes).valor)
        if (!partes.some((p) => p === null)) return
        const escondido = todo - partes.reduce<number>((a, p) => a + (p ?? 0), 0)
        if (escondido > 0 && escondido < 5) vazamentos += 1
      })
    }
  }
  ver('subtração entre agrupamentos que revela grupo de 1 a 4', 0, vazamentos)
  return l
}


/* ══ PAINÉIS DE GESTÃO DAS DUAS REDES (06/10/2026; pesquisa/paineis-gestao/plano.md): O RECORTE POR SÉRIE ════════════
   dados/gestao.ts tem os números por ESCOLA (painelDa('prefeitura' | 'estado')); o filtro Série do Painel, das Escolas e
   do Analista precisa da fatia de cada escola numa série. Ela é repartida aqui, sem mudar nenhum total:
   · cada número de cada escola é repartido pelas séries (maiores restos: as fatias somam exatamente a escola);
   · os alunos da prefeitura seguem as turmas da escola (TURMAS_REDE); no Estado, um peso fixo por série;
   · o que é "problema" (abaixo de 75%, falta crônica, APOIA, notas abaixo de 6,0) pesa mais no 8º ano da prefeitura e na
     1ª série do EM do Estado (é onde a rede trava);
   · o Pé-de-Meia só existe no Ensino Médio; "1ª série: 2+ abaixo de 6,0" só na 1ª série;
   · o Colégio Aurora não é repartido: a fatia dele é a soma das turmas da série (painelDa('escola')).
   O movimento (pioraram, melhoraram; trimestre anterior, entraram) é repartido no total da rede, com os mesmos pesos.
   Nenhuma média: só contagens. conferirRecortesPorSerie() confere as somas. */

/** Reparte `total` pelos pesos, em inteiros que somam exatamente `total` (os maiores restos levam a sobra). */
export function repartirExato(total: number, pesos: readonly number[]): number[] {
  const soma = pesos.reduce((a, b) => a + b, 0)
  if (total <= 0 || soma <= 0) return pesos.map(() => 0)
  const brutos = pesos.map((p) => (total * p) / soma)
  const partes = brutos.map(Math.floor)
  let sobra = total - partes.reduce((a, b) => a + b, 0)
  const ordem = brutos.map((b, i) => ({ r: b - Math.floor(b), i })).filter((x) => pesos[x.i] > 0).sort((a, b) => b.r - a.r || a.i - b.i)
  for (let k = 0; sobra > 0 && ordem.length; k = (k + 1) % ordem.length, sobra--) partes[ordem[k].i] += 1
  return partes
}

const PESOS_POR_SERIE: Record<RedeId, { alunos: number[]; problema: number[]; medio: number[] }> = {
  // 6º · 7º · 8º · 9º
  prefeitura: { alunos: [26, 26, 25, 23], problema: [20, 24, 30, 26], medio: [0, 0, 0, 0] },
  // 6º · 7º · 8º · 9º · 1ª EM · 2ª EM · 3ª EM
  estado: { alunos: [13, 13, 13, 13, 18, 15, 15], problema: [10, 11, 13, 13, 22, 17, 14], medio: [0, 0, 0, 0, 40, 33, 27] },
}

/** A série da turma do Aurora ("1º ano EM") no nome da série do Estado ("1ª série EM"). */
const SERIE_DO_AURORA: Record<string, string> = {
  '6º ano EF': '6º ano', '7º ano EF': '7º ano', '8º ano EF': '8º ano', '9º ano EF': '9º ano',
  '1º ano EM': '1ª série EM', '2º ano EM': '2ª série EM', '3º ano EM': '3ª série EM',
}

/** As séries do recorte, na ordem natural ("6º ano" … "3ª série EM"). */
export const seriesDaRede = (rede: RedeId): string[] => painelDa(rede).series

/** A fatia de uma escola numa série (a escola sem dados continua sem dados). */
function fatiaDaEscola(rede: RedeId, l: LinhaDoPainel, i: number): LinhaDoPainel {
  if (!l.dados) return l
  const serie = seriesDaRede(rede)[i]
  if (rede === 'estado' && l.id === 'aurora') {
    const turmas = painelDa('escola').linhas.filter((t) => t.serie && SERIE_DO_AURORA[t.serie] === serie)
    const s = somarLinhas(turmas)
    const d = l.dados
    const P = PESOS_POR_SERIE.estado
    return {
      ...l, alunos: s.alunos,
      dados: {
        ...s.dados,
        abaixoDe80: repartirExato(d.abaixoDe80 ?? 0, P.problema)[i],
        peDeMeia: d.peDeMeia ? { beneficiarios: repartirExato(d.peDeMeia.beneficiarios, P.medio)[i], abaixoDe80: repartirExato(d.peDeMeia.abaixoDe80, P.medio)[i] } : undefined,
        apoiaVencidos: 0,
        semChamada: turmas.filter((t) => (t.dados?.semChamada ?? 0) >= 3).length,
        primeiraSerieDois: serie === '1ª série EM' ? d.primeiraSerieDois ?? s.dados.dois : undefined,
      },
    }
  }
  const P = PESOS_POR_SERIE[rede]
  const pesoAlunos = rede === 'prefeitura' ? TURMAS_REDE[l.id] ?? P.alunos : P.alunos
  const d = l.dados
  const pr = (n: number) => repartirExato(n, P.problema)[i]
  const alunos = repartirExato(l.alunos, pesoAlunos)[i]
  const reprova = pr(d.faixas.reprova)
  const cronica = pr(d.faixas.cronica)
  const atencao = repartirExato(d.faixas.atencao, pesoAlunos)[i]
  const dados: DadosDaLinha = {
    faixas: { 'em-dia': alunos - reprova - cronica - atencao, atencao, cronica, reprova },
    apoia: pr(d.apoia), apoiaVencidos: pr(d.apoiaVencidos), lp: pr(d.lp), mat: pr(d.mat), dois: pr(d.dois),
    semChamada: pr(d.semChamada), pioraram: pr(d.pioraram), melhoraram: pr(d.melhoraram),
  }
  if (d.abaixoDe80 !== undefined) dados.abaixoDe80 = pr(d.abaixoDe80)
  if (d.peDeMeia) dados.peDeMeia = { beneficiarios: repartirExato(d.peDeMeia.beneficiarios, P.medio)[i], abaixoDe80: repartirExato(d.peDeMeia.abaixoDe80, P.medio)[i] }
  if (d.primeiraSerieDois !== undefined) {
    // na 1ª série, "2 ou mais abaixo de 6,0" É a coluna da 1ª série; o resto da escola vai para as outras séries
    const i1 = seriesDaRede(rede).indexOf('1ª série EM')
    dados.dois = i === i1 ? d.primeiraSerieDois : repartirExato(d.dois - d.primeiraSerieDois, P.problema.map((x, j) => (j === i1 ? 0 : x)))[i]
    dados.primeiraSerieDois = i === i1 ? d.primeiraSerieDois : undefined
  }
  return { ...l, alunos, dados }
}

export type RecorteDoPainel = {
  /** null = todas as séries */
  serie: string | null
  alunos: number
  linhas: LinhaDoPainel[]
  frequencia: Frequencia
  notas: Notas
  /** as colunas que fazem sentido na série (o Pé-de-Meia só no EM; a 1ª série só nela) */
  colunas: Coluna[]
  habilidades: HabilidadeTravada[]
}

/** O painel inteiro (serie null) ou a fatia de uma série: linhas, faixas, notas, colunas e habilidades. */
export function recorteDoPainel(rede: RedeId, serie: string | null): RecorteDoPainel {
  const p = painelDa(rede)
  const i = serie ? p.series.indexOf(serie) : -1
  if (i < 0) {
    return { serie: null, alunos: p.totalDeAlunos, linhas: p.linhas, frequencia: p.frequencia, notas: p.notas, colunas: p.colunas, habilidades: p.habilidades.itens }
  }
  const P = PESOS_POR_SERIE[rede]
  const pr = (n: number) => repartirExato(n, P.problema)[i]
  const linhas = p.linhas.map((l) => fatiaDaEscola(rede, l, i))
  const tot = somarLinhas(linhas)
  const t = tot.dados
  const faixas = FAIXAS.map((f) => {
    const daRede = p.frequencia.faixas.find((x) => x.id === f.id)!
    return { id: f.id as FaixaId, alunos: t.faixas[f.id], pioraram: pr(daRede.pioraram), melhoraram: pr(daRede.melhoraram) }
  })
  const frequencia: Frequencia = {
    ...p.frequencia, total: tot.alunos, faixas,
    pioraram: faixas.reduce((s, f) => s + f.pioraram, 0), melhoraram: faixas.reduce((s, f) => s + f.melhoraram, 0),
    abaixoDe80: t.abaixoDe80,
  }
  const notas: Notas = {
    ...p.notas,
    itens: p.notas.itens.map((n) => {
      const alunos = t[n.id]
      const anterior = pr(n.anterior)
      let entraram = pr(n.entraram)
      let sairam = anterior + entraram - alunos
      if (sairam < 0) { entraram -= sairam; sairam = 0 }
      return { ...n, alunos, anterior, entraram, sairam }
    }),
  }
  const medio = /EM$/.test(serie!)
  const colunas = p.colunas.filter((c) => (c.id === 'peDeMeia' ? medio : c.id === 'primeiraSerieDois' ? serie === '1ª série EM' : true))
  return { serie, alunos: tot.alunos, linhas, frequencia, notas, colunas, habilidades: p.habilidades.itens.filter((h) => h.serie === serie) }
}

/** O que a IA preparou em setembro e o que espera a revisão do professor, por escola (somam o "IA sob controle"). */
export const IA_POR_ESCOLA: Record<RedeId, Record<string, { materiais: number; esperando: number }>> = {
  prefeitura: {
    araucaria: { materiais: SAIDAS_IA.araucaria, esperando: 17 }, 'ipe-amarelo': { materiais: SAIDAS_IA['ipe-amarelo'], esperando: 12 },
    manaca: { materiais: SAIDAS_IA.manaca, esperando: 15 }, cachoeira: { materiais: SAIDAS_IA.cachoeira, esperando: 14 },
  },
  estado: {
    bracatinga: { materiais: 431, esperando: 11 }, 'canela-preta': { materiais: 586, esperando: 14 }, aurora: { materiais: MES.gerou, esperando: MES.esperam },
    'gralha-azul': { materiais: 377, esperando: 6 }, imbuia: { materiais: 466, esperando: 12 },
  },
}

/** Confere: as fatias somam a escola em cada número; nenhuma faixa negativa; a IA por escola soma o painel. */
export function conferirRecortesPorSerie(): { conta: string; esperado: string; obtido: string; ok: boolean }[] {
  const r: { conta: string; esperado: string; obtido: string; ok: boolean }[] = []
  const ver = (conta: string, esperado: number | string, obtido: number | string) => r.push({ conta, esperado: String(esperado), obtido: String(obtido), ok: String(esperado) === String(obtido) })
  for (const rede of ['prefeitura', 'estado'] as RedeId[]) {
    const p = painelDa(rede)
    const fatias = p.series.map((s) => recorteDoPainel(rede, s))
    ver(`${rede}: alunos por série somam a rede`, p.totalDeAlunos, fatias.reduce((s, f) => s + f.alunos, 0))
    for (const f of FAIXAS) ver(`${rede}: ${f.rotulo} por série soma a rede`, p.frequencia.faixas.find((x) => x.id === f.id)!.alunos, fatias.reduce((s, x) => s + x.frequencia.faixas.find((y) => y.id === f.id)!.alunos, 0))
    for (const n of p.notas.itens) ver(`${rede}: ${n.curto} por série soma a rede`, n.alunos, fatias.reduce((s, x) => s + x.notas.itens.find((y) => y.id === n.id)!.alunos, 0))
    if (rede === 'estado') ver('estado: 1ª série, 2+ abaixo de 6,0 = a coluna da 1ª série', p.linhas.reduce((s, l) => s + (l.dados?.primeiraSerieDois ?? 0), 0), recorteDoPainel(rede, '1ª série EM').notas.itens.find((n) => n.id === 'dois')!.alunos)
    for (const f of fatias) for (const l of f.linhas) if (l.dados && l.dados.faixas['em-dia'] < 0) ver(`${rede} · ${f.serie} · ${l.curto}: em dia não negativo`, '≥ 0', l.dados.faixas['em-dia'])
    const ia = Object.values(IA_POR_ESCOLA[rede])
    ver(`${rede}: esperando revisão por escola = painel`, p.ia.esperando, ia.reduce((s, x) => s + x.esperando, 0))
    ver(`${rede}: materiais por escola = painel`, p.ia.materiais, ia.reduce((s, x) => s + x.materiais, 0))
  }
  return r
}

if (import.meta.env.DEV) {
  for (const c of conferirNumerosRede()) console.assert(c.ok, `numeros-rede: ${c.conta}: esperado ${c.esperado}, deu ${c.obtido}`)
  for (const c of conferirRecortesPorSerie()) console.assert(c.ok, `numeros-rede (série): ${c.conta}: esperado ${c.esperado}, deu ${c.obtido}`)
}
