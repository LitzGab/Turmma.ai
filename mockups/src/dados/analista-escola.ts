import { createElement, Fragment, isValidElement, type ReactNode } from 'react'
import { casar, semAcento, type RespostaDados, type RoteiroDados } from '@/components/duo/chat-dados'
import { baixarPdf, type BlocoRelatorio, type DocumentoRelatorio } from '@/components/duo/relatorio'
import { agora, registrar } from './demo/nucleo'
import { ia } from './ia'
import { alunosDa } from './alunos'
import { calcular, descreverRecorte, entender, responder as responderMotor, type Consulta, type MetricaId, type Resultado } from './consulta'
import { FAIXAS, LIMIAR_DO_APOIA, listaNominal, painelDa, type HabilidadeTravada } from './gestao'
import { FREQUENCIA_ANTERIOR, HABILIDADES_POR_SERIE, serieCurta } from './gestao-escola'
import {
  CELULAS_ESCOLA, ENTREGAS_ATRASADAS, ESCOLA, MES as MES_BASE, METRICAS_DE_DESEMPENHO, NOMES_1C, PACOTE, PACOTE_POR_FUNCAO, PERIODO,
  SERIES_ESCOLA, VOCABULARIO_ESCOLA, celula, inteiro, reais, semTerceiroEM,
} from './numeros-escola'

/* O ANALISTA DA COORDENAÇÃO EM CONVERSA (13ª rodada, 04/10/2026; refeito em 06/10/2026 com os painéis de gestão,
   pesquisa/paineis-gestao/plano.md, T1).

   O roteiro que a peça ChatDados lê no Analista da coordenação (Helena, Colégio Aurora). Nenhum número é digitado aqui:
   as contagens vêm de dados/gestao.ts (painelDa('escola'), as mesmas do Painel) e de dados/gestao-escola.ts (onde
   cada série trava); o uso da IA e as entregas, de numeros-escola.ts.
   · NENHUMA MÉDIA. Todo número é "quantos alunos passaram de um limiar", com o limiar e a origem. Pergunta de média
     ("qual a frequência média?", "a média de Química") é respondida com a DISTRIBUIÇÃO: "a média esconde…".
   · As perguntas prontas: como está a escola, quantos abaixo de 75%, quem entrou no APOIA, onde o 8º ano trava,
     quantos pioraram desde agosto, o que fazer com o 2ºB, quantos abaixo de 6,0, uso da IA, quem aprova, relatório.
   · Dado com nome (o APOIA, as listas do 2ºB, os 5 do 1ºC) só abre com um MOTIVO de lista fechada, e fica na
     auditoria (`ia.verDadosComNome`). Só o nome e o número, nunca conversa.
   · Nada por professor, nada de ranking: turmas na ordem da escola. Consumo de IA em % do pacote e R$ por aluno.
   14ª rodada (05/10/2026; plano ux-composicao, 4.5): o MOTOR continua para as perguntas com recorte que não são de
   limiar (uso, entregas, acerto por série e disciplina): entender(texto) → calcular(CELULAS_ESCOLA) → responder().
   Nomes pelo motor: só por turma, com motivo. */

/* ── Frase com negrito, sem JSX ────────────────────────────────────────────────────────────────────────── */

type Parte = string | [string]
/** `frase('Usamos ', ['49%'], ' do pacote.')`: o que vai entre colchetes sai em negrito. */
const frase = (...partes: Parte[]): ReactNode =>
  createElement(Fragment, null, ...partes.map((p, i) => (typeof p === 'string' ? p : createElement('b', { key: i }, p[0]))))

/** O texto de uma frase (para o PDF). */
export function textoDe(n: ReactNode): string {
  if (n === null || n === undefined || typeof n === 'boolean') return ''
  if (typeof n === 'string' || typeof n === 'number') return String(n).replace(/ /g, ' ')
  if (Array.isArray(n)) return n.map(textoDe).join('')
  if (isValidElement(n)) return textoDe((n.props as { children?: ReactNode }).children)
  return ''
}

/* ── As perguntas ──────────────────────────────────────────────────────────────────────────────────────── */

export const PERGUNTAS_ESCOLA = {
  R1: 'Como a escola está esta semana?',
  F75: 'Quantos alunos estão abaixo de 75% de frequência?',
  APOIA: 'Quem entrou no critério do APOIA esta semana?',
  TRAVA8: 'Em que habilidade o 8º ano mais trava?',
  PIORARAM: 'Quantos alunos pioraram de faixa desde agosto?',
  T2B: 'O que fazer com o 2ºB?',
  NOTAS: 'Quantos alunos estão abaixo de 6,0?',
  R4: 'Quantos alunos estão com entregas atrasadas?',
  R5: 'Quanto da IA já usamos este mês?',
  R6: 'Monte o relatório do mês',
  R8: 'Quem aprova o que a IA faz?',
} as const

const P = PERGUNTAS_ESCOLA
const COMPARAR = 'Comparar com agosto'
const COMPARAR_TRIMESTRE = 'Comparar com o trimestre anterior'

const SEGUIR = {
  resumo: { rotulo: 'Como está a escola', pergunta: P.R1 },
  f75: { rotulo: 'Abaixo de 75%', pergunta: P.F75 },
  apoia: { rotulo: 'APOIA esta semana', pergunta: P.APOIA },
  pioraram: { rotulo: 'Pioraram desde agosto', pergunta: P.PIORARAM },
  notas: { rotulo: 'Abaixo de 6,0', pergunta: P.NOTAS },
  trava: { rotulo: 'Onde o 8º ano trava', pergunta: P.TRAVA8 },
  ia: { rotulo: 'Uso da IA', pergunta: P.R5 },
}

/* ── Os números do mês de materiais: acompanham a demonstração (useMesIA, em Governanca), quem chama passa ── */

export type MesIA = { gerou: number; aprovadas: number; esperam: number }
let MES: MesIA = MES_BASE
/** Quem chama (a tela do Analista) passa os números vivos do mês antes de cada resposta e do relatório. */
const comMes = <T,>(mes: MesIA | undefined, f: () => T): T => {
  const antes = MES
  MES = mes ?? MES_BASE
  try { return f() } finally { MES = antes }
}

/* ── Os números, em frases ─────────────────────────────────────────────────────────────────────────────── */

const pctTxt = (n: number) => `${n}%`
/** "R$ 1.486,40" com espaço que não quebra entre o R$ e o número. */
const reaisNb = (n: number) => reais(n).replace(' ', ' ')
const porAlunoTxt = (n: number) => reaisNb(n)
const ENTREGA_1C = ENTREGAS_ATRASADAS[0]
const alunosTxt = (n: number) => `${inteiro(n)} ${n === 1 ? 'aluno' : 'alunos'}`

const PAINEL = painelDa('escola')
const FREQ = PAINEL.frequencia
const faixa = (id: (typeof FAIXAS)[number]['id']) => FREQ.faixas.find((f) => f.id === id)!
const NOTA = (id: 'lp' | 'mat' | 'dois') => PAINEL.notas.itens.find((n) => n.id === id)!
const APOIA = PAINEL.acoes.find((a) => a.id === 'apoia')!
const L2B = PAINEL.linhas.find((l) => l.id === '2b')!
const D2B = L2B.dados!
const comDados = PAINEL.linhas.filter((l) => l.dados)
const FONTE_FREQ = `${FREQ.origem.fonte.replace(' · hoje 7h', '')} lido hoje às 7h · ${inteiro(PAINEL.totalDeAlunos)} alunos, ${comDados.length} turmas`
const FONTE_NOTAS = `${PAINEL.notas.origem.fonte.replace(' · hoje 7h', '')} · ${PAINEL.notas.periodo.toLowerCase()}`
/** "2 no 2ºB, 1 no 1ºC e 1 no 8ºA" */
const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`)

/* ── As respostas ──────────────────────────────────────────────────────────────────────────────────────── */

function r1(): RespostaDados {
  return {
    id: 'R1',
    frase: frase('Esta semana pedem ação: ', [`${alunosTxt(APOIA.numero)} no critério do APOIA`], ' (aviso até 24/09), ',
      [`${faixa('reprova').alunos} abaixo de 75%`], ' de frequência e ', [`${NOTA('mat').alunos} abaixo de 6,0 em Matemática`],
      `. Desde agosto, ${FREQ.pioraram} alunos pioraram de faixa e ${FREQ.melhoraram} melhoraram.`),
    visual: { tipo: 'numeros', itens: [
      { valor: String(APOIA.numero), rotulo: 'no critério do APOIA' },
      { valor: String(faixa('reprova').alunos), rotulo: 'abaixo de 75%' },
      { valor: String(NOTA('mat').alunos), rotulo: 'abaixo de 6,0 em MAT' },
    ] },
    fonte: `${FONTE_FREQ} · notas do trimestre · APOIA 3 (MPSC)`,
    seguir: [SEGUIR.apoia, SEGUIR.pioraram, { rotulo: 'O que fazer com o 2ºB', pergunta: P.T2B }],
    fixavel: true,
  }
}

function frequencia(): RespostaDados {
  const r = faixa('reprova'), c = faixa('cronica')
  const turmas = comDados.filter((l) => l.dados!.faixas.reprova > 0)
  return {
    id: 'F75',
    frase: frase([`${alunosTxt(r.alunos)} estão abaixo de 75%`], ` de frequência: se o ano fechasse hoje, reprovariam por falta. Outros ${c.alunos} estão entre 75 e 90% (falta crônica). `,
      `Desde agosto, ${r.pioraram} ${r.pioraram === 1 ? 'entrou' : 'entraram'} na faixa de baixo.`),
    visual: { tipo: 'barras', familia: 'anil', max: PAINEL.totalDeAlunos,
      itens: FAIXAS.map((f) => ({ rotulo: f.rotulo, valor: faixa(f.id).alunos, texto: alunosTxt(faixa(f.id).alunos) })) },
    fonte: `${FONTE_FREQ} · ${FREQ.limiar}`,
    etapas: [`Abaixo de 75% em ${turmas.length} turmas: ${turmas.map((l) => `${l.nome} (${l.dados!.faixas.reprova})`).join(', ')}`],
    seguir: [SEGUIR.pioraram, SEGUIR.apoia, { rotulo: 'Comparar com o trimestre anterior', pergunta: COMPARAR_TRIMESTRE }],
    fixavel: true,
  }
}

function frequenciaAnterior(): RespostaDados {
  return {
    id: 'F75a',
    frase: frase('No trimestre anterior, ', [`${FREQUENCIA_ANTERIOR.reprova} alunos`], ` fecharam abaixo de 75%; hoje são ${faixa('reprova').alunos}. A falta crônica foi de ${FREQUENCIA_ANTERIOR.cronica} para ${faixa('cronica').alunos}.`),
    visual: { tipo: 'tabela', colunas: ['Faixa', 'Trimestre anterior', 'Hoje'],
      linhas: FAIXAS.map((f) => [f.rotulo, inteiro(FREQUENCIA_ANTERIOR[f.id]), inteiro(faixa(f.id).alunos)]) },
    fonte: `${FREQ.origem.fonte.replace(' · hoje 7h', '')} · trimestre anterior e hoje · ${inteiro(PAINEL.totalDeAlunos)} alunos`,
    fixavel: true,
  }
}

/** A frequência de uma turma, com as faixas dela. */
function frequenciaDaTurma(turmaId: string): RespostaDados | null {
  const l = PAINEL.linhas.find((x) => x.id === turmaId)
  if (!l) return null
  if (!l.dados) return { id: `freq-${turmaId}`, tom: 'nao-sei', frase: `O ${l.nome} ainda não tem lista: sem lista, não há chamada para contar.` }
  const d = l.dados
  return {
    id: `freq-${turmaId}`,
    frase: frase(`No ${l.nome} (${l.alunos} alunos), `, [`${d.faixas.reprova} abaixo de 75%`], ` e ${d.faixas.cronica} em falta crônica; ${d.faixas['em-dia']} estão com 95% ou mais.`),
    visual: { tipo: 'barras', familia: 'anil', max: l.alunos, itens: FAIXAS.map((f) => ({ rotulo: f.rotulo, valor: d.faixas[f.id], texto: alunosTxt(d.faixas[f.id]) })) },
    fonte: `${FREQ.origem.fonte.replace(' · hoje 7h', '')} · ${l.nome}, ${l.alunos} alunos`,
    seguir: turmaId === '2b' ? [{ rotulo: 'O que fazer com o 2ºB', pergunta: P.T2B }] : [SEGUIR.f75],
    fixavel: true,
  }
}

const MOTIVOS_DO_APOIA = ['Abrir o aviso no APOIA', 'Apoio aos alunos, com o professor da turma', 'Conversa com a família', 'Pedido do titular do dado']

function apoia(): RespostaDados {
  const lista = listaNominal('apoia')!
  const porTurma = new Map<string, number>()
  lista.alunos.forEach((a) => porTurma.set(a.turma, (porTurma.get(a.turma) ?? 0) + 1))
  // na ordem da escola
  const turmas = PAINEL.linhas.filter((l) => porTurma.has(l.nome)).map((l) => [l.nome, porTurma.get(l.nome)!] as const)
  return {
    id: 'APOIA',
    frase: frase([`${alunosTxt(APOIA.numero)} entraram no critério do APOIA`], ` e ainda não têm aviso aberto: ${juntar(turmas.map(([t, n]) => `${n} no ${t}`))}. O prazo para abrir o aviso é `, ['24/09'], '. Para ver os nomes, escolha o motivo: fica registrado na auditoria.'),
    visual: { tipo: 'tabela', colunas: ['Turma', 'No critério, sem aviso'], linhas: turmas.map(([t, n]) => [t, n]) },
    fonte: `${APOIA.origem.fonte} · ${LIMIAR_DO_APOIA}`,
    motivo: {
      opcoes: MOTIVOS_DO_APOIA,
      confirmar: 'Mostrar os nomes',
      aoEscolher: (motivo) => {
        ia.verDadosComNome(`Lista · APOIA · ${ESCOLA.nome}`, motivo)
        return {
          id: `APOIA-nomes-${agora().ordem}`,
          frase: frase([`Os ${lista.alunos.length} alunos`], ' no critério do APOIA, sem aviso aberto. Só o nome, a turma e as faltas.'),
          visual: { tipo: 'nomes', titulo: 'No critério do APOIA · em ordem de turma', linhas: lista.alunos.map((a) => ({ nome: `${a.nome} · ${a.turma}`, valor: a.motivo })) },
          fonte: APOIA.origem.fonte,
          auditoria: { quando: agora().rotulo, motivo },
        }
      },
    },
  }
}

/** Onde trava: as habilidades com mais alunos abaixo de 50% de acerto, da escola ou de uma série. */
function trava(serieId?: string): RespostaDados {
  const serie = serieId ? SERIES_ESCOLA.find((s) => s.id === serieId)?.nome : undefined
  if (serieId === '3em') return foraTerceiro()
  const itens: HabilidadeTravada[] = serie ? HABILIDADES_POR_SERIE[serie] ?? [] : PAINEL.habilidades.itens
  if (!itens.length) return naoSei()
  const [a, b] = itens
  const onde = serie ? `No ${serieCurta(serie)}` : 'Na escola'
  const txt = (h: HabilidadeTravada) => `${h.nome.toLowerCase()}${serie ? '' : ` (${serieCurta(h.serie)})`}: ${h.alunos}${h.de ? ` de ${h.de}` : ''} alunos`
  return {
    id: `trava-${serieId ?? 'escola'}-${++travas}`,
    frase: frase(`${onde}, a aprendizagem mais trava em `, [txt(a)], ' abaixo de 50% de acerto', ...(b ? ['; depois, ', [txt(b)] as [string], '.'] : ['.'])),
    visual: { tipo: 'barras', familia: 'anil', max: Math.max(...itens.map((h) => h.de ?? h.alunos)),
      itens: itens.map((h) => ({ rotulo: serie ? `${h.nome} · ${h.componente}` : `${h.nome} · ${serieCurta(h.serie)}`, valor: h.alunos, texto: `${h.alunos} alunos` })) },
    fonte: `${PAINEL.habilidades.origem.fonte} · ${serie ?? 'a escola'} · contagem de alunos abaixo de 50% de acerto na habilidade`,
    seguir: serie ? [{ rotulo: 'Onde a escola trava', pergunta: 'Onde a aprendizagem trava na escola?' }] : [SEGUIR.trava],
    fixavel: true,
  }
}
let travas = 0

function pioraram(): RespostaDados {
  const porFaixa = FREQ.faixas.filter((f) => f.pioraram > 0)
  const turmas = comDados.filter((l) => l.dados!.pioraram > 0)
  return {
    id: 'PIORARAM',
    frase: frase([`${FREQ.pioraram} alunos pioraram de faixa`], ` de frequência desde agosto e ${FREQ.melhoraram} melhoraram. Dos que pioraram, `,
      [`${faixa('reprova').pioraram} caíram para baixo de 75%`], `. Estão espalhados por ${turmas.length} turmas, nenhuma com mais de ${Math.max(...turmas.map((l) => l.dados!.pioraram))}.`),
    visual: { tipo: 'tabela', colunas: ['Entraram na faixa', 'Pioraram', 'Melhoraram'],
      linhas: FREQ.faixas.filter((f) => f.pioraram > 0 || f.melhoraram > 0).map((f) => [FAIXAS.find((x) => x.id === f.id)!.rotulo, f.pioraram, f.melhoraram]) },
    fonte: `${FONTE_FREQ} · comparado com o fim de agosto`,
    etapas: [`Pioraram por faixa: ${porFaixa.map((f) => `${f.pioraram} para ${FAIXAS.find((x) => x.id === f.id)!.rotulo.toLowerCase()}`).join(', ')}`,
      `Turmas, na ordem da escola: ${turmas.map((l) => `${l.nome} ${l.dados!.pioraram}`).join(', ')}`],
    seguir: [SEGUIR.f75, SEGUIR.apoia],
    fixavel: true,
  }
}

function notas(): RespostaDados {
  const lp = NOTA('lp'), mat = NOTA('mat'), dois = NOTA('dois')
  return {
    id: 'NOTAS',
    frase: frase('No trimestre, ', [`${mat.alunos} alunos estão abaixo de 6,0 em Matemática`], ` e ${lp.alunos} em Língua Portuguesa; `,
      [`${dois.alunos} estão abaixo em 2 ou mais componentes`], `. Em Matemática, ${mat.entraram} entraram e ${mat.sairam} saíram desde o trimestre anterior.`),
    visual: { tipo: 'tabela', colunas: ['Abaixo de 6,0', 'Trimestre anterior', 'Agora', 'Entraram', 'Saíram'],
      linhas: [lp, mat, dois].map((n) => [n.rotulo, n.anterior, n.alunos, n.entraram, n.sairam]) },
    fonte: `${FONTE_NOTAS} · ${PAINEL.notas.limiarTexto}`,
    seguir: [{ rotulo: '1º ano EM: 2 ou mais abaixo', pergunta: 'Quantos alunos do 1º ano EM estão abaixo de 6,0 em 2 ou mais componentes?' }, SEGUIR.trava],
    fixavel: true,
  }
}

function notasPrimeiroAno(): RespostaDados {
  const turmas = PAINEL.linhas.filter((l) => l.serie === '1º ano EM' && l.dados)
  const total = turmas.reduce((s, l) => s + (l.dados!.primeiraSerieDois ?? 0), 0)
  const alunos = turmas.reduce((s, l) => s + l.alunos, 0)
  return {
    id: 'NOTAS-1EM',
    frase: frase('No 1º ano EM, ', [`${total} dos ${alunos} alunos`], ' estão abaixo de 6,0 em 2 ou mais componentes. É a série em que mais se reprova na rede estadual de Joinville (15,7% em 2025).'),
    visual: { tipo: 'tabela', colunas: ['Turma', '2 ou mais abaixo de 6,0'], linhas: turmas.map((l) => [l.nome, l.dados!.primeiraSerieDois ?? 0]) },
    fonte: `${FONTE_NOTAS} · 1º ano EM, ${turmas.length} turmas`,
    fixavel: true,
  }
}

const MOTIVOS_2B = ['Abrir o aviso no APOIA', 'Apoio aos alunos, com o professor da turma', 'Conversa com a família', 'Conselho de classe']

function o2b(): RespostaDados {
  const reprova = listaNominal('reprova', '2b')!.alunos
  const apoia2b = listaNominal('apoia', '2b')!.alunos
  const mat = listaNominal('mat', '2b')!.alunos
  const emTodas = apoia2b.filter((a) => reprova.some((r) => r.nome === a.nome) && mat.some((m) => m.nome === a.nome)).length
  return {
    id: 'T2B',
    frase: frase(`No 2ºB (${L2B.alunos} alunos), três coisas pedem ação, nesta ordem: `, [`abrir o aviso do APOIA de ${D2B.apoia} alunos até 24/09`],
      `, conversar com as famílias dos ${D2B.faixas.reprova} abaixo de 75% e levar os ${D2B.mat} abaixo de 6,0 em Matemática para a recuperação do trimestre. Para ver os nomes, escolha o motivo.`),
    visual: { tipo: 'tabela', colunas: ['O quê', 'Alunos', 'Até quando'], linhas: [
      ['APOIA: abrir o aviso', D2B.apoia, '24/09'],
      ['Abaixo de 75%: falar com a família', D2B.faixas.reprova, 'esta semana'],
      ['Matemática abaixo de 6,0: recuperação', D2B.mat, 'fim do trimestre'],
      ['Falta crônica (75 a 90%): acompanhar', D2B.faixas.cronica, '—'],
    ] },
    hipotese: emTodas > 0 ? `${emTodas === 1 ? 'Um mesmo aluno aparece' : `${emTodas} alunos aparecem`} no APOIA, abaixo de 75% e abaixo de 6,0 em Matemática: vale começar por ${emTodas === 1 ? 'ele' : 'eles'}.` : undefined,
    fonte: `${FREQ.origem.fonte.replace(' · hoje 7h', '')}, notas do trimestre e APOIA 3 (MPSC) · 2ºB, ${L2B.alunos} alunos. A sugestão é do Analista; quem decide é a escola.`,
    motivo: {
      opcoes: MOTIVOS_2B,
      confirmar: 'Mostrar os nomes',
      aoEscolher: (motivo) => {
        ia.verDadosComNome('Lista · 2ºB · APOIA, frequência e Matemática', motivo)
        const linhas = [...new Set([...apoia2b, ...reprova, ...mat].map((a) => a.nome))].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((nome) => ({
          nome,
          valor: [apoia2b.some((a) => a.nome === nome) && 'APOIA', reprova.some((a) => a.nome === nome) && 'abaixo de 75%', mat.some((a) => a.nome === nome) && 'MAT abaixo de 6,0'].filter(Boolean).join(' · '),
        }))
        return {
          id: `T2B-nomes-${agora().ordem}`,
          frase: frase([`${linhas.length} alunos do 2ºB`], ' em pelo menos uma das três listas. Só o nome e onde ele aparece.'),
          visual: { tipo: 'nomes', titulo: '2ºB · APOIA, frequência e Matemática', linhas },
          fonte: `2ºB · ${PERIODO.curto}`,
          auditoria: { quando: agora().rotulo, motivo },
        }
      },
    },
    seguir: [{ rotulo: 'Abrir a turma', pergunta: 'Abrir o 2ºB' }],
  }
}

/** Pergunta de média: a resposta é a distribuição. "A média esconde…" */
function media(assunto: 'frequencia' | 'notas' | 'geral'): RespostaDados {
  const emDia = faixa('em-dia').alunos, reprova = faixa('reprova').alunos, cronica = faixa('cronica').alunos
  if (assunto === 'frequencia' || assunto === 'geral') {
    return {
      id: `media-${assunto}-${++medias}`,
      frase: frase('Eu não mostro média: ', ['a média esconde'], ` quem mais precisa. Na frequência, ${inteiro(emDia)} alunos estão com 95% ou mais, mas `,
        [`${reprova} estão abaixo de 75%`], ` e ${cronica} em falta crônica. Esses dois grupos somem dentro de uma média alta.`),
      visual: { tipo: 'barras', familia: 'anil', max: PAINEL.totalDeAlunos, itens: FAIXAS.map((f) => ({ rotulo: f.rotulo, valor: faixa(f.id).alunos, texto: alunosTxt(faixa(f.id).alunos) })) },
      fonte: `${FONTE_FREQ} · contagem por faixa, sem média`,
      seguir: assunto === 'geral' ? [SEGUIR.notas, SEGUIR.f75] : [SEGUIR.f75, SEGUIR.pioraram],
      fixavel: true,
    }
  }
  const mat = NOTA('mat'), lp = NOTA('lp'), dois = NOTA('dois')
  return {
    id: `media-notas-${++medias}`,
    frase: frase('Eu não mostro média de nota: ', ['a média esconde'], ' quem ficou para trás. No trimestre, ', [`${mat.alunos} alunos estão abaixo de 6,0 em Matemática`],
      `, ${lp.alunos} em Língua Portuguesa e ${dois.alunos} em 2 ou mais componentes.`),
    visual: { tipo: 'tabela', colunas: ['Abaixo de 6,0', 'Alunos'], linhas: [lp, mat, dois].map((n) => [n.rotulo, n.alunos]) },
    fonte: `${FONTE_NOTAS} · contagem abaixo de 6,0, sem média`,
    seguir: [SEGUIR.notas, SEGUIR.trava],
    fixavel: true,
  }
}
let medias = 0

/** Os indicadores anuais (Ideb, Censo): oficiais, uma vez por ano. */
function anuais(): RespostaDados {
  return {
    id: 'ANUAIS',
    frase: frase('O Ideb e o Censo saem uma vez por ano. Em 2025, o Ideb do ', [`${ESCOLA.nome}`], ` foi ${PAINEL.anuais.filter((a) => a.id.startsWith('ideb')).map((a) => `${a.valor} ${a.id === 'ideb-em' ? 'no Ensino Médio' : 'nos anos finais'}`).join(' e ')}.`),
    visual: { tipo: 'tabela', colunas: ['Indicador', '2025', 'Para comparar'], linhas: PAINEL.anuais.map((a) => [a.rotulo, a.valor, a.contexto]) },
    fonte: 'INEP · Ideb 2025 e Censo Escolar 2025 da escola',
    seguir: [SEGUIR.resumo],
  }
}

/** "três ou mais": um dos 5 tem 4 faltando. */
export const TITULO_NOMES_1C = NOMES_1C.titulo.replace('com três entregas', 'com três ou mais entregas')

const MOTIVOS_TURMA = ['Conversa com os professores da série', 'Apoio aos alunos, com o professor da turma', 'Pedido do titular do dado']
const MOTIVOS_NOMES = ['Apoio aos alunos, com o professor da turma', 'Conversa com a família', 'Pedido do titular do dado']

function r4(): RespostaDados {
  return {
    id: 'R4',
    frase: frase('Com 3 ou mais entregas faltando: ', [`${ENTREGA_1C.n} alunos no ${ENTREGA_1C.turma}`],
      '. No 2ºA e no 2ºB o grupo é pequeno, e aparece como "menos de 5".'),
    // sem total: a soma deixaria deduzir as turmas com menos de 5
    visual: { tipo: 'tabela', colunas: ['Turma', 'Com 3 ou mais faltando'], linhas: ENTREGAS_ATRASADAS.map((e) => [e.turma, celula(e.n)]) },
    fonte: `Entregas registradas pelos professores · até ${PERIODO.ate} · só a contagem`,
    seguir: [{ rotulo: `Quem são os ${ENTREGA_1C.n} do ${ENTREGA_1C.turma}?`, pergunta: `Quem são os ${ENTREGA_1C.n} do ${ENTREGA_1C.turma}?` }],
  }
}

function r4a(): RespostaDados {
  return {
    id: 'R4a',
    frase: frase('Posso mostrar os nomes, mas antes preciso do motivo. ', ['Fica registrado na auditoria'], ' com seu nome, a hora e o motivo.'),
    motivo: {
      opcoes: MOTIVOS_NOMES,
      confirmar: 'Mostrar os nomes',
      aoEscolher: (motivo) => {
        ia.verDadosComNome('alerta-a2', motivo)
        return {
          id: 'R4a-aberto',
          frase: frase(`${TITULO_NOMES_1C}.`),
          visual: { tipo: 'nomes', titulo: `${ENTREGA_1C.turma} · entregas faltando`,
            linhas: NOMES_1C.linhas.map((l) => ({ nome: l.nome, valor: `${l.faltam} faltando` })) },
          auditoria: { quando: agora().rotulo, motivo },
        }
      },
    },
  }
}

function r5(): RespostaDados {
  return {
    id: 'R5',
    frase: frase('Usamos ', [`${PACOTE.usado}% do pacote de setembro`], ` (${reaisNb(PACOTE.custo)} de ${reaisNb(PACOTE.teto)}), ou `,
      [`${porAlunoTxt(PACOTE.porAluno)} por aluno`], '. Nesse ritmo, o mês fecha perto de ', [`${PACOTE.projecao}%`], ' (a linha tracejada). Eu aviso quando chegar a 80% (a linha cheia).'),
    visual: { tipo: 'pacote', usado: PACOTE.usado, projecao: PACOTE.projecao },
    fonte: `Uso da IA da escola · ${PERIODO.curto} · ${ESCOLA.alunos} alunos com acesso`,
    seguir: [{ rotulo: COMPARAR, pergunta: COMPARAR }, { rotulo: 'O que mais usa a IA', pergunta: 'O que mais usa a IA?' }],
    fixavel: true,
  }
}

function r5a(): RespostaDados {
  return {
    id: 'R5a',
    frase: frase('Agosto fechou em ', [`${PACOTE.agosto.usado}%`], ` (${reaisNb(PACOTE.agosto.custo)}), ou ${porAlunoTxt(PACOTE.agosto.porAluno)} por aluno.`),
    visual: { tipo: 'tabela', colunas: ['Pacote de IA', 'Agosto', 'Setembro'], linhas: [
      ['Usado', pctTxt(PACOTE.agosto.usado), pctTxt(PACOTE.usado)],
      ['Gasto', reais(PACOTE.agosto.custo), reais(PACOTE.custo)],
      ['Por aluno', porAlunoTxt(PACOTE.agosto.porAluno), porAlunoTxt(PACOTE.porAluno)],
    ] },
    fonte: `Uso da IA da escola · agosto inteiro e ${PERIODO.curto}`,
  }
}

function r5b(): RespostaDados {
  const [tutor, materiais, correcoes] = PACOTE_POR_FUNCAO
  return {
    id: 'R5b',
    frase: frase('O Tutor dos alunos usa ', [`${tutor.valor}%`], ', os materiais dos professores ', [`${materiais.valor}%`], ' e as correções ',
      [`${correcoes.valor}%`], '. Eu mostro por função, nunca por professor.'),
    visual: { tipo: 'barras', familia: 'turquesa', max: 100, itens: PACOTE_POR_FUNCAO.map((f) => ({ rotulo: f.rotulo, valor: f.valor, texto: pctTxt(f.valor) })) },
    fonte: `Uso da IA da escola por função · ${PERIODO.curto}`,
  }
}

function r8(): RespostaDados {
  return {
    id: 'R8',
    frase: frase('Dos ', [`${MES.gerou} materiais`], ' da IA em setembro, ', [`${MES.aprovadas} foram aprovados`], ` por um professor e ${MES.esperam} esperam. Nenhum chegou ao aluno sem aprovação.`),
    visual: { tipo: 'empilhada', partes: [
      { rotulo: 'aprovados', valor: MES.aprovadas, familia: 'verde' },
      { rotulo: 'esperando', valor: MES.esperam, familia: 'amarelo' },
    ] },
    fonte: `O que a IA gerou e quem aprovou · ${PERIODO.curto}`,
    seguir: [{ rotulo: 'Ver em Registros', pergunta: 'Ver em Registros' }],
  }
}

/* ── Recusas e "não sei" ───────────────────────────────────────────────────────────────────────────────── */

const recusaProfessor = (): RespostaDados => ({
  id: 'recusa-professor', tom: 'recusa',
  frase: 'Eu não mostro números por professor nem comparo professores: o Turmma ajuda o professor, não avalia o professor. Posso mostrar o uso por série.',
  seguir: [{ rotulo: 'Uso por série', pergunta: 'Quantos alunos usaram o Turmma, por série?' }, SEGUIR.f75],
})
const recusaConversa = (): RespostaDados => ({
  id: 'recusa-conversa', tom: 'recusa',
  frase: 'Eu não abro conversa de aluno com o Tutor. Isso só sai a pedido do titular, pelos Registros.',
  seguir: [{ rotulo: 'Abrir Registros', pergunta: 'Abrir Registros' }],
})
const recusaSemDado = (): RespostaDados => ({
  id: 'recusa-sem-dado', tom: 'recusa',
  frase: 'Eu não tenho o Saeb por escola nem a evasão do ano. Tenho a frequência e as notas do diário, o APOIA, o Ideb e o Censo do INEP, e as provas que os professores aprovaram.',
  seguir: [SEGUIR.f75, { rotulo: 'Ideb e Censo', pergunta: 'Qual o Ideb da escola?' }],
})
const recusaNominal = (): RespostaDados => ({
  id: 'recusa-nominal', tom: 'recusa',
  frase: 'Para mostrar nomes, preciso de uma lista (APOIA, abaixo de 75%, abaixo de 6,0) e de um motivo. Comece pela contagem.',
  seguir: [SEGUIR.apoia, SEGUIR.f75],
})
const naoSei = (): RespostaDados => ({
  id: 'nao-sei', tom: 'nao-sei',
  frase: 'Isso eu ainda não sei responder. Posso mostrar:',
  seguir: [SEGUIR.resumo, SEGUIR.f75, SEGUIR.notas],
})
const abrindo = (id: string, frase: string): RespostaDados => ({ id, tom: 'nao-sei', frase })

/** "Comparar com…" compara o assunto da resposta anterior. */
const COMPARA: Record<string, () => RespostaDados> = { R5: r5a, F75: frequenciaAnterior }

/* ── O motor (14ª rodada): a pergunta com recorte é calculada sobre as células ─────────────────────────────── */

/** O que cada resposta pronta "é", para a pergunta seguinte herdar ("e no 8º ano?" depois do acerto por série). */
const CONSULTA_DO_ROTEIRO: Record<string, Consulta> = {
  R4: { metrica: 'atrasados', filtros: {}, agrupar: 'turma', mes: 'setembro' },
}

/** De onde vem cada métrica, para a linha "De onde veio". */
const ORIGEM: Record<MetricaId, string> = {
  acerto: 'Correções aprovadas pelos professores', abaixo50: 'Correções aprovadas pelos professores', media: 'Notas aprovadas pelos professores',
  uso: 'Acessos ao Turmma', alunos: 'Alunos com acesso', conversas: 'Conversas com o Tutor', entregas: 'Entregas registradas pelos professores',
  atrasados: 'Entregas registradas pelos professores', materiais: 'O que a IA gerou e quem aprovou',
}

const nomeDaTurma = (id: string) => VOCABULARIO_ESCOLA.turma.find((t) => t.id === id)?.nome ?? id
const serieDaTurma = (id: string) => CELULAS_ESCOLA.find((c) => c.turma === id)?.serie
const nomeDaSerie = (id: string) => VOCABULARIO_ESCOLA.serie.find((s) => s.id === id)?.nome ?? id
const nomeDaDisciplina = (id: string) => VOCABULARIO_ESCOLA.disciplina.find((d) => d.id === id)?.nome ?? id

/** "9º ano, 3 turmas, 100 alunos" */
function fonteDoMotor(r: Resultado): string {
  const q = r.consulta
  const quem = q.filtros.turma?.length ? q.filtros.turma.map(nomeDaTurma).join(', ')
    : q.filtros.serie?.length ? q.filtros.serie.map(nomeDaSerie).join(', ') : 'a escola'
  const disc = q.filtros.disciplina?.length ? ` · ${q.filtros.disciplina.map(nomeDaDisciplina).join(', ')}` : ''
  const periodo = q.comparar ? `agosto e ${PERIODO.curto}` : q.mes === 'agosto' ? 'agosto' : PERIODO.curto
  const turmas = q.filtros.turma?.length === 1 ? '' : `, ${r.turmas} ${r.turmas === 1 ? 'turma' : 'turmas'}`
  return `${ORIGEM[q.metrica]} · ${periodo} · ${quem}${disc}${turmas}, ${inteiro(r.alunos)} alunos`
}

const toca3EM = (q: Consulta) => !!q.filtros.serie?.includes('3em') || !!q.filtros.turma?.some((t) => serieDaTurma(t) === '3em')
const ehDesempenho = (q: Consulta) => METRICAS_DE_DESEMPENHO.includes(q.metrica)

const MOTIVOS_NOMES_MOTOR = MOTIVOS_NOMES
const MOTIVOS_PROFESSOR = MOTIVOS_TURMA

/** Os nomes de uma turma com a condição da métrica: só o nome e o número. Os 5 do 1ºC são os do alerta. */
function nomesDa(turma: string, metrica: MetricaId, n: number, disciplina?: string): { titulo: string; condicao: string; linhas: { nome: string; valor: string }[]; alvo: string } | null {
  const nome = nomeDaTurma(turma)
  if (metrica === 'atrasados') {
    if (turma === '1c') return { titulo: `${nome} · entregas faltando`, condicao: 'com 3 ou mais entregas faltando', alvo: 'alerta-a2', linhas: NOMES_1C.linhas.map((l) => ({ nome: l.nome, valor: `${l.faltam} faltando` })) }
    /* os n da conta da turma (ENTREGAS_ATRASADAS: 2ºA 4, 2ºB 2), os de mais entregas faltando na lista da turma. A
       lista de alunos do 2ºA ainda não tem ninguém com 3 ou mais: até ela acompanhar a conta, o número mostrado é o
       da condição (3), para a resposta não contradizer o Painel. */
    const linhas = alunosDa(turma)
      .map((a) => ({ nome: a.nome, faltam: a.entregas.total - a.entregas.feitas }))
      .sort((a, b) => b.faltam - a.faltam || a.nome.localeCompare(b.nome, 'pt-BR'))
      .slice(0, n)
      .map((a) => ({ ...a, faltam: Math.max(3, a.faltam) }))
    return linhas.length ? { titulo: `${nome} · entregas faltando`, condicao: 'com 3 ou mais entregas faltando', alvo: `${nome} · entregas faltando`, linhas: linhas.map((l) => ({ nome: l.nome, valor: `${l.faltam} faltando` })) } : null
  }
  if (metrica === 'abaixo50' && (!disciplina || disciplina === 'quimica')) {
    const linhas = alunosDa(turma)
      .map((a) => ({ nome: a.nome, acerto: Math.round(a.habilidades.reduce((x, h) => x + h.acerto, 0) / Math.max(1, a.habilidades.length)) }))
      .filter((a) => a.acerto < 50)
      .sort((a, b) => a.acerto - b.acerto || a.nome.localeCompare(b.nome, 'pt-BR'))
      .slice(0, n)
    return linhas.length ? { titulo: `${nome} · Química, abaixo de 50%`, condicao: 'abaixo de 50% de acerto em Química', alvo: `${nome} · Química, abaixo de 50%`, linhas: linhas.map((l) => ({ nome: l.nome, valor: `${l.acerto}% de acerto` })) } : null
  }
  return null
}

/** O motivo do motor: nomes (lista fechada, depois só nome e número) ou o número por professor (turma × disciplina). */
function motivoDoMotor(guardar: (id: string, q: Consulta) => void) {
  return (r: Resultado, pedido: 'nomes' | 'professor'): RespostaDados['motivo'] => {
    const q = r.consulta
    if (pedido === 'nomes') {
      const turma = q.filtros.turma![0]
      // o número de verdade da turma (a resposta mostra "menos de 5", mas a lista com motivo traz todos os da condição)
      const total = q.metrica === 'atrasados'
        ? ENTREGAS_ATRASADAS.find((e) => e.turmaId === turma)?.n ?? calcular(CELULAS_ESCOLA, { ...q, filtros: { turma: [turma] } }, VOCABULARIO_ESCOLA, 1).valor
        : r.valor
      const lista = nomesDa(turma, q.metrica, Math.max(1, total ?? 0), q.filtros.disciplina?.[0])
      return {
        opcoes: MOTIVOS_NOMES_MOTOR,
        confirmar: 'Mostrar os nomes',
        aoEscolher: (motivo) => {
          const alvo = lista?.alvo ?? `${nomeDaTurma(turma)} · nomes`
          ia.verDadosComNome(alvo, motivo)
          const id = `nomes-${turma}-${q.metrica}-${agora().ordem}`
          guardar(id, { ...q, pedeNomes: false })
          return lista
            ? { id, frase: frase([`${lista.linhas.length === 1 ? 'O aluno' : `Os ${lista.linhas.length} alunos`} do ${nomeDaTurma(turma)}`], ` ${lista.condicao}. Só o nome e o número, sem conversa nem nota.`),
                visual: { tipo: 'nomes', titulo: lista.titulo, linhas: lista.linhas },
                fonte: fonteDoMotor(r), auditoria: { quando: agora().rotulo, motivo } }
            : { id, tom: 'nao-sei', frase: 'Os nomes desta turma ficam com o professor dela. O acesso ficou registrado.', auditoria: { quando: agora().rotulo, motivo } }
        },
      }
    }
    const serie = q.filtros.serie?.[0] ?? serieDaTurma(q.filtros.turma?.[0] ?? '')
    const disc = q.filtros.disciplina?.[0]
    // a Química do 2º ano por turma é o mesmo recorte do alerta a1 (abaixo de 6,0 por turma)
    const alvo = serie === '2em' && disc === 'quimica' ? 'alerta-a1' : `${serie ? nomeDaSerie(serie) : ''}${disc ? ` · ${nomeDaDisciplina(disc)}` : ''} por turma`
    return {
      opcoes: MOTIVOS_PROFESSOR,
      confirmar: 'Mostrar por turma',
      aoEscolher: (motivo) => {
        ia.verDadosComNome(alvo, motivo)
        const aberta = responderMotor({ ...r, porProfessor: false }, VOCABULARIO_ESCOLA, CTX_SEM_MOTIVO)
        const id = `${aberta.id}-motivo`
        guardar(id, q)
        return { ...aberta, id, fixavel: false, auditoria: { quando: agora().rotulo, motivo } }
      },
    }
  }
}

const CTX_SEM_MOTIVO = { recorte: 'escola' as const, periodo: PERIODO.curto, fonte: fonteDoMotor }

/** Junta uma frase do motor com um complemento. */
const mais = (f: ReactNode, ...partes: Parte[]): ReactNode => createElement(Fragment, null, f, frase(...partes))

const foraTerceiro = (): RespostaDados => ({
  id: 'fora-3em', tom: 'nao-sei',
  frase: 'O 3º ano EM fica de fora do desempenho: tem um professor só, e o número da série seria o dele. Posso mostrar quantos alunos usaram o Turmma.',
  seguir: [{ rotulo: 'Uso do 3º ano EM', pergunta: 'Quantos alunos do 3º ano EM usaram o Turmma?' }],
})

/** O motor inteiro: entende (herdando a consulta anterior), calcula e responde. null quando não entende. */
function perguntarAoMotor(pergunta: string, anterior: Consulta | undefined, guardar: (id: string, q: Consulta) => void): RespostaDados | null {
  const q0 = entender(pergunta, VOCABULARIO_ESCOLA, anterior)
  if (!q0) return null
  /* Regra dos painéis de gestão (06/10/2026): nenhuma média. Pergunta de acerto ou de nota média vira a CONTAGEM de
     alunos abaixo de 50% de acerto, com o mesmo recorte; a frase diz por quê. */
  if (q0.metrica === 'acerto' || q0.metrica === 'media') {
    const r = motorSemMedia(pergunta, { ...q0, metrica: 'abaixo50' }, guardar)
    return r.tom ? r : { ...r, frase: createElement(Fragment, null, frase('Eu não mostro acerto médio: ', ['a média esconde'], ' quem ficou para trás. Em vez dela, a contagem. '), r.frase) }
  }
  return motorSemMedia(pergunta, q0, guardar)
}

function motorSemMedia(_pergunta: string, q: Consulta, guardar: (id: string, q: Consulta) => void): RespostaDados {
  if (q.pedeProfessor) return recusaProfessor()
  if (ehDesempenho(q) && toca3EM(q)) return foraTerceiro()
  // nomes só por turma, e só de entregas faltando ou de abaixo de 50%
  if (q.pedeNomes && !q.filtros.turma?.length) {
    const porTurma = { ...q, pedeNomes: false, agrupar: 'turma' as const, agrupar2: undefined }
    const r = calcular(ehDesempenho(q) ? semTerceiroEM() : CELULAS_ESCOLA, porTurma, VOCABULARIO_ESCOLA)
    const resp = responderMotor({ ...r, porProfessor: false }, VOCABULARIO_ESCOLA, CTX_SEM_MOTIVO)
    guardar(resp.id, porTurma)
    return { ...resp, frase: createElement(Fragment, null, 'Os nomes saem por turma, com um motivo registrado. Primeiro, a contagem: ', resp.frase), seguir: [] }
  }
  if (q.pedeNomes && !['atrasados', 'abaixo50'].includes(q.metrica)) {
    return { id: 'nomes-metrica', tom: 'nao-sei', frase: 'Com nome, eu mostro só quem tem 3 ou mais entregas faltando ou ficou abaixo de 50%, e sempre com um motivo.',
      seguir: [{ rotulo: 'Entregas faltando', pergunta: `Quais alunos ${descreverRecorte(q, VOCABULARIO_ESCOLA).trim()} estão com entregas atrasadas?` }] }
  }
  const r = calcular(ehDesempenho(q) ? semTerceiroEM() : CELULAS_ESCOLA, q, VOCABULARIO_ESCOLA)
  const resp = responderMotor(r, VOCABULARIO_ESCOLA, { ...CTX_SEM_MOTIVO, motivo: motivoDoMotor(guardar) })
  guardar(resp.id, q)
  // o pedido de nome diz o que conta antes do motivo: "5 alunos do 1ºC estão com 3 ou mais entregas faltando."
  if (q.pedeNomes && resp.motivo && r.valor !== null) {
    const n = r.valor
    const condicao = q.metrica === 'atrasados' ? 'com 3 ou mais entregas faltando' : `abaixo de 50% de acerto${q.filtros.disciplina?.length ? ` em ${nomeDaDisciplina(q.filtros.disciplina[0])}` : ''}`
    return { ...resp, frase: frase([`${inteiro(n)} ${n === 1 ? 'aluno' : 'alunos'} do ${nomeDaTurma(q.filtros.turma![0])}`], ` ${n === 1 ? 'está' : 'estão'} ${condicao}. Para ver os nomes, escolha o motivo: `, ['fica registrado na auditoria'], '.') }
  }
  // por série, no desempenho: o 3º EM não aparece, e a frase diz por quê
  if (ehDesempenho(q) && q.agrupar === 'serie' && !q.pedeNomes && !r.porProfessor) {
    return { ...resp, frase: mais(resp.frase, ' O 3º ano EM fica de fora: tem um professor só.') }
  }
  return resp
}

/** A pergunta tem recorte, agrupamento ou ranking: vai ao motor mesmo que uma resposta pronta case pela palavra. */
const especifica = (q: Consulta | null) => !!q && (!!q.filtros.serie?.length || !!q.filtros.turma?.length || !!q.filtros.disciplina?.length
  || !!q.agrupar || !!q.pedeRanking || !!q.pedeProfessor)

/* ── O roteiro ─────────────────────────────────────────────────────────────────────────────────────────── */

export function criarRoteiroEscola({ resumoLigado, fixadas, abrir, mes }: {
  resumoLigado: boolean
  /** os números vivos do mês de materiais (useMesIA); sem isso, os do mês fechado */
  mes?: () => MesIA
  /** as respostas fixadas na página, para o relatório (R6) */
  fixadas?: () => RespostaDados[]
  /** "Ver em Registros", "Abrir Registros" e "Abrir o 2ºB" levam à página */
  abrir?: (rota: string) => void
}): RoteiroDados {
  const lerFixadas = () => fixadas?.() ?? []
  /** a consulta por trás de cada resposta (do motor), para a pergunta seguinte herdar */
  const consultas = new Map<string, Consulta>()
  const guardar = (id: string, q: Consulta) => { consultas.set(id, q) }
  /** as respostas de "onde trava", para a seguinte ("e no 9º ano?") continuar nas habilidades */
  const travadas = new Set<string>()
  const travaGuardada = (serieId?: string) => { const r = trava(serieId); if (!r.tom) travadas.add(r.id); return r }

  const r6 = (): RespostaDados => ({
    id: 'R6',
    frase: frase('Pronto. Montei o ', [`relatório de setembro do ${ESCOLA.nome}`],
      `: frequência por faixa, APOIA, notas abaixo de 6,0, onde a aprendizagem trava e uso da IA${((nf) => (nf === 0 ? '' : nf === 1 ? ', com a resposta que você fixou' : `, com as ${nf} respostas que você fixou`))(lerFixadas().length)}. `,
      ['Sem nomes de alunos, sem médias e sem comparação entre professores.']),
    arquivo: {
      titulo: `Relatório de setembro · ${ESCOLA.nome}`,
      apoio: 'PDF · 2 páginas',
      aoBaixar: () => baixarRelatorioDaEscola(lerFixadas(), mes?.()),
      doc: () => relatorioDaEscola(lerFixadas(), mes?.()),
    },
    fonte: `Os mesmos números do Painel · ${PERIODO.curto}`,
  })

  /** As perguntas prontas, os "seguir" e as sugestões: respondidas pelo roteiro, sem passar pelo motor. */
  const PRONTAS: Record<string, () => RespostaDados> = {
    [P.R1]: r1, [P.F75]: frequencia, [P.APOIA]: apoia, [P.TRAVA8]: () => travaGuardada('8'), [P.PIORARAM]: pioraram, [P.T2B]: o2b,
    [P.NOTAS]: notas, [P.R4]: r4, [P.R5]: r5, [P.R6]: r6, [P.R8]: r8,
    'Resumo de segunda': r1, 'O que mais usa a IA?': r5b, [COMPARAR_TRIMESTRE]: frequenciaAnterior,
    'Onde a aprendizagem trava na escola?': () => travaGuardada(),
    'Quantos alunos do 1º ano EM estão abaixo de 6,0 em 2 ou mais componentes?': notasPrimeiroAno,
    [`Quem são os ${ENTREGA_1C.n} do ${ENTREGA_1C.turma}?`]: r4a,
  }

  const responder = (pergunta: string, ctx: { anterior?: string }): RespostaDados => {
    const ant = ctx.anterior
    const t = pergunta.trim()
    const s = semAcento(t).toLowerCase()
    const anteriorQ = ant ? consultas.get(ant) ?? CONSULTA_DO_ROTEIRO[ant] : undefined
    const doRoteiro = !!ant && !consultas.has(ant)
    const q = entender(t, VOCABULARIO_ESCOLA, anteriorQ)
    const turma = q?.filtros.turma?.length === 1 ? q.filtros.turma[0] : undefined
    const serieId = q?.filtros.serie?.length === 1 ? q.filtros.serie[0] : undefined
    const regra = casar<() => RespostaDados>(t, [
      [/relatorio/, r6],
      [/professor.*(menos|mais|melhor|pior|usa|ranking|compar)|(menos|mais|melhor|pior|usa|ranking|compar).*professor/, recusaProfessor],
      [/(conversa|perguntou).*(aluno|tutor)|(aluno|tutor).*(conversa|perguntou)/, recusaConversa],
      // média: a resposta é a distribuição
      [/\bmedi[ao]s?\b/, () => media(/frequencia|falta|presen/.test(s) ? 'frequencia' : /nota|acerto|portugu|matematic|quimic|fisic|biolog|ciencia|historia|geografia|ingles/.test(s) ? 'notas' : 'geral')],
      [/saeb|evasao/, recusaSemDado],
      [/ideb|censo|distorcao|reprovacao do ano/, anuais],
      // os "seguir", com o contexto da resposta anterior
      [/^ver na ia$|^ver em registros$/, () => { abrir?.('/coordenacao/registros?aba=ia'); return abrindo('abrir-ia', 'Abri os Registros, na aba IA: o que a IA gerou e quem aprovou.') }],
      [/^abrir registros$/, () => { abrir?.('/coordenacao/registros?aba=avisos'); return abrindo('abrir-registros', 'Abri os Registros, na aba dos avisos.') }],
      [/^abrir o 2ob$|^abrir o 2ºb$|^abrir a turma$/, () => { abrir?.('/coordenacao/escola/turmas/2b'); return abrindo('abrir-2b', 'Abri a página do 2ºB.') }],
      ...((doRoteiro && COMPARA[ant!]) || (!ant && /^compar/.test(s))
        ? [[/^compar|agosto|trimestre/, () => (COMPARA[ant ?? ''] ?? frequenciaAnterior)()] as [RegExp, () => RespostaDados]] : []),
      ...(ant === 'R4' ? [[/quem|nome/, r4a] as [RegExp, () => RespostaDados]] : []),
    ])
    return comMes(mes?.(), () => {
      if (regra) return regra()
      const pronta = PRONTAS[t]
      if (pronta) return pronta()
      // os limiares da escola, em texto livre
      if (/apoia/.test(s)) return apoia()
      if (/o que fazer|como ajudar|por onde comecar/.test(s) && turma === '2b') return o2b()
      if (/pior|melhor(ar|aram|ou)/.test(s) && /faixa|frequencia|falta|agosto/.test(s)) return pioraram()
      if (/frequencia|\bfaltas?\b|faltando aula|presenca|75\s?%|reprova/.test(s)) {
        if (turma) return frequenciaDaTurma(turma) ?? frequencia()
        return frequencia()
      }
      if (/abaixo de 6|nota baixa|notas baixas|recupera/.test(s)) return /1o ano em|1º ano em|primeiro ano/.test(s) && /2 ou mais|dois ou mais/.test(s) ? notasPrimeiroAno() : notas()
      // onde trava: as habilidades com mais alunos abaixo de 50% (a escola ou a série)
      if (/trava|erra|habilidade|dificuldade/.test(s)) return travaGuardada(serieId)
      // depois de "onde trava", a pergunta que só troca a série ("e no 9º ano?") continua nas habilidades
      if (ant && travadas.has(ant) && serieId && !turma && !q?.pedeNomes) return travaGuardada(serieId)
      // com recorte, agrupamento ou ranking, ou herdando do motor: calcula
      if (especifica(q) || (q && ant && consultas.has(ant))) {
        const m = perguntarAoMotor(t, anteriorQ, guardar)
        if (m) return m
      }
      const geral = casar<() => RespostaDados>(t, [
        [/entrega|atras|faltando/, () => (/nome|quem/.test(s) ? r4a() : r4())],
        [/nota|acerto/, notas],
        [/aprova|revis|supervis/, r8],
        [/\bia\b|pacote|gasto|custo|token|credito|consumo/, r5],
        [/semana|setembro|resumo|como (esta|foi)|geral/, r1],
        [/nome|quem sao|quais alunos/, recusaNominal],
      ])
      if (geral) return geral()
      return perguntarAoMotor(t, anteriorQ, guardar) ?? naoSei()
    })
  }

  return {
    abertura: 'Oi, Helena. Conto quantos alunos passaram de cada limiar e monto relatórios. Média, eu não faço.',
    placeholder: 'Pergunte sobre os números da escola',
    selo: { rotulo: 'Nome só com motivo registrado', titulo: 'Dado com nome só abre com um motivo, e fica na auditoria.' },
    linhaInicial: resumoLigado ? { rotulo: 'Resumo de segunda · 21/09, 7h10', pergunta: 'Resumo de segunda' } : undefined,
    sugestoes: [
      { rotulo: 'Abaixo de 75%', pergunta: P.F75 },
      { rotulo: 'APOIA esta semana', pergunta: P.APOIA },
      { rotulo: 'Onde o 8º ano trava', pergunta: P.TRAVA8 },
      { rotulo: 'Pioraram desde agosto', pergunta: P.PIORARAM },
      { rotulo: 'O que fazer com o 2ºB', pergunta: P.T2B },
      { rotulo: 'Relatório do mês', pergunta: P.R6, fixa: true },
    ],
    responder,
  }
}

/* ── O relatório do mês (seção 1.4.4) ──────────────────────────────────────────────────────────────────── */

/** As colunas da tabela que substitui as barras no PDF. */
const COLUNAS_BARRAS: Record<string, string[]> = {
  F75: ['Faixa', 'Alunos'], R5b: ['Função', 'Parte do uso'],
}

/** Uma resposta fixada, em blocos do PDF: a frase, o visual (em tabela ou números) e de onde veio. */
function blocosDaResposta(r: RespostaDados): BlocoRelatorio[] {
  const blocos: BlocoRelatorio[] = [{ tipo: 'paragrafo', texto: textoDe(r.frase) }]
  const v = r.visual
  if (v?.tipo === 'numeros') blocos.push({ tipo: 'numeros', itens: v.itens })
  else if (v?.tipo === 'tabela') blocos.push({ tipo: 'tabela', colunas: v.colunas, linhas: v.linhas.map((l) => l.map((c) => (c === null ? 'menos de 5' : String(c)))) })
  else if (v?.tipo === 'barras') blocos.push({ tipo: 'tabela', colunas: COLUNAS_BARRAS[r.id] ?? ['Recorte', 'Valor'], linhas: v.itens.map((i) => [i.rotulo, i.valor === null ? 'fica de fora' : i.texto ?? String(i.valor)]) })
  else if (v?.tipo === 'pacote') blocos.push({ tipo: 'numeros', itens: [{ valor: pctTxt(v.usado), rotulo: 'do pacote usado' }, ...(v.projecao ? [{ valor: pctTxt(v.projecao), rotulo: 'fecha perto de' }] : [])] })
  else if (v?.tipo === 'empilhada') blocos.push({ tipo: 'tabela', colunas: ['Parte', 'Quantidade'], linhas: v.partes.map((p) => [p.rotulo, inteiro(p.valor)]) })
  if (r.hipotese) blocos.push({ tipo: 'nota', texto: `Hipótese: ${r.hipotese}` })
  if (r.fonte) blocos.push({ tipo: 'nota', texto: `De onde veio: ${r.fonte}` })
  return blocos
}

export function relatorioDaEscola(fixadas: RespostaDados[], mes?: MesIA): DocumentoRelatorio {
  return comMes(mes, () => montarRelatorio(fixadas))
}

function montarRelatorio(fixadas: RespostaDados[]): DocumentoRelatorio {
  const fixas = fixadas.filter((r) => r.visual?.tipo !== 'nomes' && !r.motivo && !r.auditoria)
  const apoiaLista = listaNominal('apoia')!
  const porTurma = PAINEL.linhas.flatMap((l) => {
    const n = apoiaLista.alunos.filter((a) => a.turma === l.nome).length
    return n ? [[l.nome, String(n)]] : []
  })
  return {
    titulo: `Relatório de setembro de ${PERIODO.ano} · ${ESCOLA.nome}`,
    subtitulo: `${PERIODO.curto} · gerado em ${agora().rotulo}`,
    aviso: 'Sem nomes de alunos. Sem médias. Sem comparação entre professores.',
    secoes: [
      { titulo: 'Frequência por faixa', blocos: [
        { tipo: 'tabela', colunas: ['Faixa', 'Alunos', 'Pioraram desde agosto', 'Melhoraram'],
          linhas: FAIXAS.map((f) => [f.rotulo, inteiro(faixa(f.id).alunos), String(faixa(f.id).pioraram), String(faixa(f.id).melhoraram)]) },
        { tipo: 'nota', texto: `${FREQ.limiar}. Fonte: ${FONTE_FREQ}.` },
      ] },
      { titulo: 'APOIA', blocos: [
        { tipo: 'paragrafo', texto: `${APOIA.numero} alunos no critério, ainda sem aviso aberto (prazo: 24/09). ${PAINEL.apoias.abertos} avisos abertos: ${PAINEL.apoias.naEscola} na escola, ${PAINEL.apoias.noConselho} no Conselho Tutelar.` },
        { tipo: 'tabela', colunas: ['Turma', 'No critério, sem aviso'], linhas: porTurma },
        { tipo: 'nota', texto: LIMIAR_DO_APOIA },
      ] },
      { titulo: 'Notas abaixo de 6,0 no trimestre', blocos: [
        { tipo: 'tabela', colunas: ['Componente', 'Trimestre anterior', 'Agora', 'Entraram', 'Saíram'],
          linhas: PAINEL.notas.itens.map((n) => [n.rotulo, String(n.anterior), String(n.alunos), String(n.entraram), String(n.sairam)]) },
        { tipo: 'nota', texto: `${PAINEL.notas.limiarTexto}. Fonte: ${FONTE_NOTAS}.` },
      ] },
      { titulo: 'Onde a aprendizagem trava', blocos: [
        { tipo: 'tabela', colunas: ['Habilidade', 'Série', 'Alunos abaixo de 50%'],
          linhas: PAINEL.habilidades.itens.map((h) => [`${h.codigo} · ${h.nome}`, serieCurta(h.serie), h.de ? `${h.alunos} de ${h.de}` : String(h.alunos)]) },
        { tipo: 'nota', texto: `Fonte: ${PAINEL.habilidades.origem.fonte}. A turma não aparece: cada uma tem um professor só.` },
      ] },
      { titulo: 'Entregas atrasadas (só a contagem)', blocos: [
        { tipo: 'tabela', colunas: ['Turma', 'Alunos com 3 ou mais entregas faltando'], linhas: ENTREGAS_ATRASADAS.map((e) => [e.turma, celula(e.n)]) },
        { tipo: 'nota', texto: 'Sem total, para que nenhum grupo pequeno possa ser deduzido.' },
      ] },
      { titulo: 'IA sob controle', blocos: [
        { tipo: 'numeros', itens: [
          { valor: inteiro(MES.gerou), rotulo: 'materiais da IA' },
          { valor: inteiro(MES.esperam), rotulo: 'esperando o professor' },
          { valor: pctTxt(PACOTE.usado), rotulo: 'do pacote do mês' },
          { valor: porAlunoTxt(PACOTE.porAluno), rotulo: 'por aluno com acesso' },
        ] },
        { tipo: 'paragrafo', texto: `Nada chegou ao aluno sem um professor. ${reais(PACOTE.custo)} de ${reais(PACOTE.teto)}; nesse ritmo, o mês fecha perto de ${PACOTE.projecao}%. O aviso vem em 80%.` },
      ] },
      { titulo: 'Respostas fixadas', blocos: fixas.length
        ? fixas.flatMap(blocosDaResposta)
        : [{ tipo: 'nota', texto: 'Nenhuma resposta fixada nesta conversa.' }] },
    ],
    rodape: 'Frequência e notas do diário oficial (Professor Online); habilidades e IA do Turmma. Não substituem Saeb nem Ideb.',
  }
}

export function baixarRelatorioDaEscola(fixadas: RespostaDados[], mes?: MesIA): void {
  baixarPdf(relatorioDaEscola(fixadas, mes), 'relatorio-setembro-colegio-aurora.pdf')
  registrar('exportacao', { conjunto: 'Relatório do mês', finalidade: 'Relatório de setembro' }, { nome: 'Helena Martins', papel: 'coordenacao' })
}
