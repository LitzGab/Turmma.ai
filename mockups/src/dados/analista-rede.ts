import { cloneElement, createElement, Fragment, isValidElement, type ReactNode } from 'react'
import { baixarCsv, baixarPdf, montarPdf, semAcento } from '@/components/duo'
import type { DocumentoRelatorio, RespostaDados, RoteiroDados } from '@/components/duo'
import { agora, registrar } from './demo/nucleo'
import { inteiro, PERIODO, reais } from './numeros-escola'
import { calcularRede, contarRede, recorteDoPainel, IA_POR_ESCOLA, vocabularioRede, type NumerosDaRede, type ResultadoRede } from './numeros-rede'
import { entender, normalizar, responder as responderConsulta, descreverRecorte, type Consulta, type Dim, type Resultado } from './consulta'
import {
  FAIXAS, LIMIAR_DA_FREQUENCIA, LIMIAR_DO_APOIA, LIMIAR_DO_PE_DE_MEIA, LIMIAR_DAS_NOTAS, SITUACAO_DA_LINHA, painelDa, textoDaContagem,
  valorDaColuna, type LinhaDoPainel, type Origem, type Painel,
} from './gestao'
import { REDES_DO_PAINEL, type RedeId } from './rede-atual'

/* O ANALISTA DAS REDES (painéis de gestão, 06/10/2026; pesquisa/paineis-gestao/plano.md, seção "Analista").
   Uma conversa por rede (Prefeitura de Joinville · Estado de SC, Regional Joinville), com os MESMOS números do Painel:
   tudo sai de painelDa(rede) e recorteDoPainel(rede, série) (dados/gestao.ts e dados/numeros-rede.ts).

   AS REGRAS, todas na resposta:
   · NENHUMA MÉDIA. Pergunta de média ("frequência média", "nota média", "acerto médio") é respondida com a
     DISTRIBUIÇÃO: "a média esconde quem mais precisa: 96 alunos estão abaixo de 75%…";
   · todo número é uma contagem com o limiar escrito (LDB 75%; APOIA 5 seguidas ou 7 alternadas em 30 dias;
     Pé-de-Meia 80%; 6,0, a média mínima da rede) e a fonte com OFICIAL (diário EVN / Professor Online, APOIA,
     Pé-de-Meia, INEP) ou TURMMA (provas aprovadas, IA);
   · NOME NUNCA, nem de aluno nem de professor. "Quem entrou no APOIA?" responde a contagem por escola e diz que
     quem abre o aviso é a escola. Grupo de 1 a 4 aparece "menos de 5";
   · ranking de escolas: "Eu não ordeno escolas da melhor para a pior" e a lista de A a Z, com as contagens;
   · nada por professor; nada por turma (na rede não há turma).
   Na prefeitura, o motor de consulta (dados/consulta.ts, CELULAS_REDE) ainda responde o USO ("quantos alunos do 8º ano
   usaram em setembro?", "e em agosto?") e a contagem abaixo de 50% nas provas; conta de acerto ou de média dele vira a
   distribuição. No Estado, o uso não está aqui (o Analista diz o que sabe responder).
   O controlador é o Município de Joinville na prefeitura e o Estado de SC na rede estadual; o Turmma é o operador
   (LGPD, arts. 5º e 23: lei). Dado de criança e adolescente: LGPD, art. 14 (lei). Grupos de 5 ou mais: regra nossa. */

/* ── Quem é cada rede ──────────────────────────────────────────────────────────────────────────────────────── */

export const ORGAO: Record<RedeId, {
  /** "Secretaria Municipal de Educação de Joinville" */
  secretaria: string
  /** "Rede municipal de Joinville" */
  rede: string
  controlador: string
  encarregado: string
  arquivo: string
  /** a série em que a rede mais trava (a pergunta pronta) */
  serieQueTrava: string
}> = {
  prefeitura: {
    secretaria: 'Secretaria Municipal de Educação de Joinville', rede: 'Rede municipal de Joinville',
    controlador: 'Município de Joinville',
    encarregado: 'Indicado pela Secretaria Municipal de Educação. Nome e contato publicados no site da Prefeitura (LGPD, art. 41).',
    arquivo: 'rede-municipal-joinville', serieQueTrava: '8º ano',
  },
  estado: {
    secretaria: 'Secretaria de Estado da Educação de SC · Coordenadoria Regional de Joinville', rede: 'Rede estadual em Joinville',
    controlador: 'Estado de Santa Catarina',
    encarregado: 'Indicado pela Secretaria de Estado da Educação. Nome e contato publicados no site da SED (LGPD, art. 41).',
    arquivo: 'rede-estadual-joinville', serieQueTrava: '1ª série EM',
  },
}

/* ── As perguntas (o que os cartões do Painel, as Escolas e as sugestões mandam) ──────────────────────────── */

/** "no 8º ano", "na 1ª série do EM". */
export const naSerie = (serie: string) => (/s[ée]rie/.test(serie) ? `na ${serie.replace(/ EM$/, ' do EM')}` : `no ${serie}`)

export const PERGUNTAS = {
  semana: 'O que pede ação esta semana?',
  frequencia: 'Quantos alunos estão abaixo de 75%?',
  frequenciaEscola: 'Abaixo de 75% por escola',
  apoia: 'Quais escolas têm APOIA vencido?',
  apoiaNovos: 'Quem entrou no critério do APOIA esta semana?',
  notas: 'Quantos alunos estão abaixo de 6,0?',
  notasEscola: 'Abaixo de 6,0 por escola',
  trava: (serie: string) => `Em que habilidade ${naSerie(serie).replace(/^n/, '')} mais trava?`,
  ideb: (rede: RedeId) => (rede === 'estado' ? 'Como está o Ideb do Ensino Médio?' : 'Como está o Ideb dos anos finais?'),
  peDeMeia: 'Quantos alunos do Pé-de-Meia estão abaixo de 80%?',
  primeiraSerie: 'Como está a 1ª série do EM?',
  escolas: 'Como está cada escola?',
  ia: 'Quanto da IA espera revisão?',
  media: 'Qual a frequência média da rede?',
  movimento: 'Quem piorou desde agosto?',
  chamada: 'Quais escolas estão com a chamada atrasada?',
  relatorio: 'Gere o relatório do mês',
} as const

/* ── Frases: "**negrito**" vira <b>, e o mesmo texto, limpo, vai para o relatório ──────────────────────── */

function frase(t: string): ReactNode {
  return createElement(Fragment, null, ...t.split(/\*\*/).map((p, i) => (i % 2 ? createElement('b', { key: i }, p) : p)))
}
const limpo = (t: string) => t.replace(/\*\*/g, '')
/** "na Araucária", "no Colégio Aurora" (e "da"/"do", "a"/"o"): o artigo do nome da escola. */
export const artigoDa = (curto: string) => (/^(Col[eé]gio|Instituto|Centro)\b/.test(curto) ? 'o' : 'a')
export const naEscola = (curto: string) => `${artigoDa(curto) === 'o' ? 'no' : 'na'} ${curto}`
export const daEscola = (curto: string) => `${artigoDa(curto) === 'o' ? 'do' : 'da'} ${curto}`
/** "a, b e c" */
const lista = (l: string[]) => (l.length <= 1 ? l.join('') : `${l.slice(0, -1).join(', ')} e ${l[l.length - 1]}`)
const pctDe = (n: number, de: number) => (de > 0 ? Math.round((n / de) * 100) : 0)
/** A linha "Oficial · Diário EVN · hoje 7h" de uma origem. */
const fonteDe = (o: Origem, extra?: string) => {
  const rotulo = o.tipo === 'oficial' ? 'Oficial' : 'Turmma'
  return `${rotulo} · ${o.fonte.replace(new RegExp(`^${rotulo} · `), '')}${extra ? ` · ${extra}` : ''}`
}
/** "menos de 5" só vale para grupo de alunos (escolas e turmas aparecem com o número). */
const contaDe = (rede: RedeId, n: number, unidade: string) => (/alunos|APOIAs/.test(unidade) ? textoDaContagem(n, rede) : inteiro(n))
const comDados = (p: Painel) => p.linhas.filter((l) => l.dados)
const semDados = (p: Painel) => p.linhas.filter((l) => !l.dados)
const escolasComDados = (p: Painel) => {
  const c = comDados(p)
  return `${c.length} ${c.length === 1 ? 'escola' : 'escolas'} com dados, ${inteiro(c.reduce((s, l) => s + l.alunos, 0))} alunos`
}
/** "Bem-te-vi (montando) e Figueira (convite enviado): ainda sem dados." */
const notaSemDados = (p: Painel) => {
  const s = semDados(p)
  if (!s.length) return ''
  return `${lista(s.map((l) => `${l.curto} (${l.situacao === 'convite' ? 'convite enviado' : 'montando'})`))}: ainda sem dados.`
}

/** A tabela por escola, de A a Z, com as colunas pedidas; as escolas sem dados entram com "sem dados". */
function tabelaPorEscola(rede: RedeId, linhas: LinhaDoPainel[], colunas: { rotulo: string; valor: (l: LinhaDoPainel) => number | null }[]): (string | number)[][] {
  return linhas.map((l) => [l.curto, ...colunas.map((c) => {
    if (!l.dados) return 'sem dados'
    const v = c.valor(l)
    return v === null ? '—' : textoDaContagem(v, rede)
  })])
}

/* ── O relatório do mês (o mesmo esqueleto do Painel) ─────────────────────────────────────────────────── */

export function relatorioDaRede(rede: RedeId, fixadas: string[] = [], textos: Record<string, string> = {}): DocumentoRelatorio {
  const p = painelDa(rede)
  const o = ORGAO[rede]
  const f = p.frequencia
  const fix = fixadas.map((id) => textos[id]).filter((t): t is string => !!t)
  const conta = (n: number) => textoDaContagem(n, rede)
  return {
    titulo: `Relatório de setembro de 2026 · ${REDES_DO_PAINEL[rede].nome}`,
    subtitulo: `${p.escopo} · gerado em ${agora().rotulo}`,
    aviso: 'Só números agregados: contagens de alunos por limiar. Nenhum nome de aluno, nenhum número de professor, nenhuma média.',
    secoes: [
      { titulo: 'Pede ação esta semana', blocos: p.acoes.map((a) => ({ tipo: 'paragrafo' as const, texto: `${contaDe(rede, a.numero, a.unidade)} ${a.unidade} ${a.frase}. ${a.prazo}. (${a.limiar})` })) },
      { titulo: 'Frequência por faixa', blocos: [
        { tipo: 'tabela', colunas: ['Faixa', 'Alunos', 'Pioraram desde agosto'], linhas: FAIXAS.map((x) => {
          const v = f.faixas.find((y) => y.id === x.id)!
          return [x.rotulo, conta(v.alunos), conta(v.pioraram)]
        }) },
        { tipo: 'nota', texto: `${LIMIAR_DA_FREQUENCIA}.${f.abaixoDe80 !== undefined ? ` Abaixo de 80% (Pé-de-Meia): ${conta(f.abaixoDe80)} alunos.` : ''} Fonte: ${fonteDe(f.origem)}.` },
      ] },
      { titulo: 'Notas abaixo de 6,0', blocos: [
        { tipo: 'tabela', colunas: ['Componente', p.notas.periodo, p.notas.comparado], linhas: p.notas.itens.map((n) => [n.rotulo, conta(n.alunos), conta(n.anterior)]) },
        { tipo: 'nota', texto: `${LIMIAR_DAS_NOTAS}. Fonte: ${fonteDe(p.notas.origem)}.` },
      ] },
      { titulo: 'Escolas, de A a Z', blocos: [
        { tipo: 'tabela', colunas: ['Escola', 'Alunos', ...p.colunas.map((c) => c.rotulo)], linhas: p.linhas.map((l) => [
          l.curto, l.dados ? inteiro(l.alunos) : SITUACAO_DA_LINHA[l.situacao], ...p.colunas.map((c) => (l.dados ? textoDaContagem(valorDaColuna(l, c.id), rede) : '')),
        ]) },
        { tipo: 'nota', texto: 'Grupo com menos de 5 alunos aparece como "menos de 5". Escolas sempre de A a Z: o relatório não ordena escolas.' },
      ] },
      { titulo: 'Onde a aprendizagem trava', blocos: [
        { tipo: 'tabela', colunas: ['Habilidade', 'Série', 'Alunos abaixo de 50%'], linhas: p.habilidades.itens.map((h) => [`${h.nome} (${h.codigo})`, h.serie, h.de ? `${conta(h.alunos)} de ${inteiro(h.de)}` : conta(h.alunos)]) },
        { tipo: 'nota', texto: `Fonte: ${fonteDe(p.habilidades.origem)}. Não substitui Saeb nem Ideb.` },
      ] },
      { titulo: 'IA sob controle', blocos: [
        { tipo: 'numeros', itens: [
          { valor: inteiro(p.ia.materiais), rotulo: 'materiais da IA' },
          { valor: `${p.ia.revisados}%`, rotulo: 'revisados por professor' },
          { valor: inteiro(p.ia.esperando), rotulo: 'esperando revisão' },
          { valor: `${p.ia.pacote}%`, rotulo: `do pacote · ${reais(p.ia.porAluno)} por aluno` },
        ] },
      ] },
      { titulo: 'Indicadores anuais (INEP)', blocos: [
        { tipo: 'tabela', colunas: ['Indicador', 'Valor', 'Contexto'], linhas: p.anuais.map((a) => [a.rotulo, a.valor, `${a.contexto}${a.nota ? ` · ${a.nota}` : ''}`]) },
      ] },
      { titulo: 'Respostas fixadas', blocos: fix.length
        ? fix.map((t) => ({ tipo: 'paragrafo' as const, texto: t }))
        : [{ tipo: 'nota', texto: 'Nenhuma resposta fixada nesta conversa.' }] },
      { titulo: 'Como contamos', blocos: [
        { tipo: 'paragrafo', texto: `Chamada e notas lidas do diário oficial (${p.sistemaOficial}) todo dia às 7h; o Turmma soma o que só ele tem (provas aprovadas pelos professores, materiais da IA). Nenhuma média: cada número é quantos alunos passaram de um limiar.` },
        { tipo: 'nota', texto: `Controlador dos dados: ${o.controlador}. Operador: Turmma (LGPD, arts. 5º e 23). Encarregado: ${o.encarregado}` },
      ] },
    ],
    rodape: `Controlador: ${o.controlador} · Operador: Turmma (LGPD, arts. 5º e 23)`,
  }
}

/** A planilha: as mesmas contagens, por escola de A a Z. */
export function csvDaRede(rede: RedeId): (string | number)[][] {
  const p = painelDa(rede)
  return [
    [`Relatório de setembro de 2026`, ORGAO[rede].secretaria],
    ['Só números agregados: contagens de alunos por limiar. Grupo com menos de 5 aparece como "menos de 5".'],
    [],
    ['Faixa de frequência', 'Alunos', 'Pioraram desde agosto'],
    ...FAIXAS.map((x) => { const v = p.frequencia.faixas.find((y) => y.id === x.id)!; return [x.rotulo, textoDaContagem(v.alunos, rede), textoDaContagem(v.pioraram, rede)] }),
    [],
    ['Abaixo de 6,0', 'Trimestre atual', 'Trimestre anterior'],
    ...p.notas.itens.map((n) => [n.rotulo, textoDaContagem(n.alunos, rede), textoDaContagem(n.anterior, rede)]),
    [],
    ['Escola', 'Situação', 'Alunos', ...p.colunas.map((c) => c.titulo)],
    ...p.linhas.map((l) => [l.nome, SITUACAO_DA_LINHA[l.situacao], l.dados ? l.alunos : '', ...p.colunas.map((c) => (l.dados ? textoDaContagem(valorDaColuna(l, c.id), rede) : ''))]),
    [],
    ['Indicador anual (INEP)', 'Valor', 'Contexto'],
    ...p.anuais.map((a) => [a.rotulo, a.valor, a.contexto]),
  ]
}

/** Baixa o relatório e registra a exportação (o ✓ do roteiro no Mapa). */
export function baixarRelatorioDaRede(rede: RedeId, formato: 'pdf' | 'csv' = 'pdf', fixadas: string[] = [], textos: Record<string, string> = {}): string {
  const arquivo = `relatorio-setembro-${ORGAO[rede].arquivo}.${formato}`
  if (formato === 'pdf') baixarPdf(relatorioDaRede(rede, fixadas, textos), arquivo)
  else baixarCsv(csvDaRede(rede), arquivo)
  registrar('exportacao', { conjunto: 'rede', finalidade: 'Relatório de setembro' }, { nome: ORGAO[rede].secretaria, papel: 'rede' })
  return arquivo
}

/** Quantas páginas o PDF tem (conta os objetos de página do próprio arquivo). */
function paginas(doc: DocumentoRelatorio): number {
  const bytes = montarPdf(doc)
  let s = ''
  for (let i = 0; i < bytes.length; i += 4096) s += String.fromCharCode(...bytes.subarray(i, i + 4096))
  return Math.max(1, (s.match(/\/Type\s*\/Page(?!s)/g) ?? []).length)
}

/* ── As respostas prontas ──────────────────────────────────────────────────────────────────────────────── */

type Pronta = { pergunta: string; texto: string; r: Omit<RespostaDados, 'frase' | 'id'> }

function respostas(rede: RedeId): Record<string, Pronta> {
  const p = painelDa(rede)
  const o = ORGAO[rede]
  const f = p.frequencia
  const faixa = (id: string) => f.faixas.find((x) => x.id === id)!
  const conta = (n: number) => textoDaContagem(n, rede)
  const out: Record<string, Pronta> = {}
  const estado = rede === 'estado'

  /* o que pede ação: os 3 cartões do Painel */
  out.semana = {
    pergunta: PERGUNTAS.semana,
    texto: `Esta semana, ${lista(p.acoes.map((a) => `**${contaDe(rede, a.numero, a.unidade)} ${a.unidade}** ${a.frase}`))}.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['O quê', 'Quantos', 'Prazo'], linhas: p.acoes.map((a) => [a.frase.charAt(0).toUpperCase() + a.frase.slice(1), `${contaDe(rede, a.numero, a.unidade)} ${a.unidade}`, a.prazo]) },
      fonte: `${lista([...new Set(p.acoes.map((a) => fonteDe(a.origem)))])} · ${escolasComDados(p)}`,
      seguir: estado
        ? [{ rotulo: 'Pé-de-Meia por escola', pergunta: PERGUNTAS.peDeMeia }, { rotulo: 'APOIA vencido', pergunta: PERGUNTAS.apoia }]
        : [{ rotulo: 'APOIA vencido por escola', pergunta: PERGUNTAS.apoia }, { rotulo: 'Abaixo de 75%', pergunta: PERGUNTAS.frequencia }],
      fixavel: true,
    },
  }

  /* frequência: abaixo de 75% por série */
  const series = p.series.map((s) => ({ s, r: recorteDoPainel(rede, s) }))
  const fr = (x: (typeof series)[number], id: string) => x.r.frequencia.faixas.find((y) => y.id === id)!.alunos
  const pior = series.reduce((a, b) => (fr(b, 'reprova') > fr(a, 'reprova') ? b : a))
  out.frequencia = {
    pergunta: PERGUNTAS.frequencia,
    texto: `**${conta(faixa('reprova').alunos)} dos ${inteiro(f.total)} alunos** estão abaixo de 75% de frequência: se o ano fechar assim, reprovam por falta. Outros **${conta(faixa('cronica').alunos)}** estão entre 75 e 90% (falta crônica). O ${pior.s} tem mais alunos abaixo de 75%: **${conta(fr(pior, 'reprova'))}**.${estado && f.abaixoDe80 !== undefined ? ` Abaixo de 80%, a linha do Pé-de-Meia: ${conta(f.abaixoDe80)}.` : ''}`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Série', 'Abaixo de 75%', '75 a 90%', 'Alunos'], linhas: series.map((x) => [x.s, conta(fr(x, 'reprova')), conta(fr(x, 'cronica')), inteiro(x.r.alunos)]) },
      fonte: fonteDe(f.origem, escolasComDados(p)),
      seguir: [{ rotulo: 'Por escola', pergunta: PERGUNTAS.frequenciaEscola }, { rotulo: 'Quem piorou desde agosto', pergunta: PERGUNTAS.movimento }],
      fixavel: true,
    },
  }
  out.frequenciaEscola = {
    pergunta: PERGUNTAS.frequenciaEscola,
    texto: `As escolas **de A a Z**, com quantos alunos estão abaixo de 75% e entre 75 e 90%. Na rede: ${conta(faixa('reprova').alunos)} e ${conta(faixa('cronica').alunos)}.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Escola', 'Abaixo de 75%', '75 a 90%'], linhas: tabelaPorEscola(rede, p.linhas, [
        { rotulo: '< 75%', valor: (l) => l.dados!.faixas.reprova }, { rotulo: '75–90%', valor: (l) => l.dados!.faixas.cronica },
      ]) },
      fonte: fonteDe(f.origem, escolasComDados(p)),
      seguir: [{ rotulo: 'Por série', pergunta: PERGUNTAS.frequencia }],
      fixavel: true,
    },
  }

  /* a média: a distribuição */
  out.media = {
    pergunta: PERGUNTAS.media,
    texto: `A média esconde quem mais precisa: tem aluno que nunca falta e aluno que falta muito. Em vez dela, as faixas: **${conta(faixa('reprova').alunos)} alunos** abaixo de 75%, **${conta(faixa('cronica').alunos)}** entre 75 e 90% (falta crônica), ${conta(faixa('atencao').alunos)} entre 90 e 95% e ${conta(faixa('em-dia').alunos)} com 95% ou mais.`,
    r: {
      visual: { tipo: 'barras', familia: 'anil', max: f.total, itens: FAIXAS.map((x) => ({ rotulo: x.rotulo, valor: faixa(x.id).alunos, texto: `${conta(faixa(x.id).alunos)} alunos` })) },
      fonte: fonteDe(f.origem, escolasComDados(p)),
      seguir: [{ rotulo: 'Abaixo de 75% por série', pergunta: PERGUNTAS.frequencia }, { rotulo: 'Notas abaixo de 6,0', pergunta: PERGUNTAS.notas }],
      fixavel: true,
    },
  }

  /* o movimento desde agosto */
  out.movimento = {
    pergunta: PERGUNTAS.movimento,
    texto: `Desde agosto, **${conta(f.pioraram)} alunos pioraram de faixa** e ${conta(f.melhoraram)} melhoraram. Para abaixo de 75% foram **${conta(faixa('reprova').pioraram)}**; para a falta crônica, ${conta(faixa('cronica').pioraram)}. Não mostro quem: na rede, só contagens.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Faixa', 'Alunos hoje', 'Pioraram', 'Melhoraram'], linhas: FAIXAS.map((x) => [x.rotulo, conta(faixa(x.id).alunos), conta(faixa(x.id).pioraram), conta(faixa(x.id).melhoraram)]) },
      fonte: fonteDe(f.origem, 'movimento desde agosto'),
      seguir: [{ rotulo: 'Por escola', pergunta: PERGUNTAS.frequenciaEscola }],
      fixavel: true,
    },
  }

  /* APOIA */
  const ap = p.apoias
  const comVencido = comDados(p).filter((l) => l.dados!.apoiaVencidos > 0)
  out.apoia = {
    pergunta: PERGUNTAS.apoia,
    texto: `**${conta(ap.vencidos)} APOIAs** estão com o prazo de 14 dias vencido, em ${comVencido.length} ${comVencido.length === 1 ? 'escola' : 'escolas'}: ${lista(comVencido.map((l) => l.curto))}. Dos ${conta(ap.abertos)} avisos abertos, ${conta(ap.naEscola)} estão na escola, ${conta(ap.noConselho)} no Conselho Tutelar e ${conta(ap.noMp)} no Ministério Público.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Escola', 'APOIA vencido', 'No critério, sem aviso'], linhas: tabelaPorEscola(rede, p.linhas, [
        { rotulo: 'Vencido', valor: (l) => l.dados!.apoiaVencidos }, { rotulo: 'No critério', valor: (l) => l.dados!.apoia },
      ]) },
      fonte: fonteDe(ap.origem, 'cada etapa tem 14 dias: escola, Conselho Tutelar, Ministério Público'),
      seguir: [{ rotulo: 'Quem entrou no critério', pergunta: PERGUNTAS.apoiaNovos }, { rotulo: 'Abaixo de 75%', pergunta: PERGUNTAS.frequencia }],
      fixavel: true,
    },
  }
  const tot = comDados(p).reduce((s, l) => s + l.dados!.apoia, 0)
  out.apoiaNovos = {
    pergunta: PERGUNTAS.apoiaNovos,
    texto: `Na rede eu não vejo nomes: quem abre o aviso no APOIA é a escola. **${conta(tot)} alunos** estão no critério (${LIMIAR_DO_APOIA.replace(' (APOIA, MPSC)', '')}), ainda sem aviso aberto. Por escola, de A a Z:`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Escola', 'No critério, sem aviso'], linhas: tabelaPorEscola(rede, p.linhas, [{ rotulo: 'No critério', valor: (l) => l.dados!.apoia }]) },
      fonte: fonteDe(ap.origem),
      seguir: [{ rotulo: 'APOIA vencido', pergunta: PERGUNTAS.apoia }],
      fixavel: true,
    },
  }

  /* notas abaixo de 6,0 */
  const nt = p.notas
  const mat = nt.itens.find((n) => n.id === 'mat')!
  out.notas = {
    pergunta: PERGUNTAS.notas,
    texto: `No trimestre, até ${PERIODO.ate}: **${lista(nt.itens.map((n) => `${conta(n.alunos)} alunos ${n.id === 'dois' ? 'em 2 ou mais componentes' : `em ${n.rotulo}`}`))}** abaixo de 6,0, a média mínima da rede. Em Matemática, ${conta(mat.entraram)} entraram e ${conta(mat.sairam)} saíram desde o trimestre anterior.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Abaixo de 6,0', 'Este trimestre', 'Trimestre anterior'], linhas: nt.itens.map((n) => [n.rotulo, conta(n.alunos), conta(n.anterior)]) },
      fonte: fonteDe(nt.origem, escolasComDados(p)),
      seguir: [{ rotulo: 'Por escola', pergunta: PERGUNTAS.notasEscola }, { rotulo: `Onde ${naSerie(o.serieQueTrava).replace(/^n/, '')} trava`, pergunta: PERGUNTAS.trava(o.serieQueTrava) }],
      fixavel: true,
    },
  }
  out.notasEscola = {
    pergunta: PERGUNTAS.notasEscola,
    texto: 'As escolas **de A a Z**, com quantos alunos estão abaixo de 6,0 no trimestre. Eu não ordeno escolas da melhor para a pior.',
    r: {
      visual: { tipo: 'tabela', colunas: ['Escola', 'LP', 'MAT', '2 ou mais'], linhas: tabelaPorEscola(rede, p.linhas, [
        { rotulo: 'LP', valor: (l) => l.dados!.lp }, { rotulo: 'MAT', valor: (l) => l.dados!.mat }, { rotulo: '2+', valor: (l) => l.dados!.dois },
      ]) },
      fonte: fonteDe(nt.origem, escolasComDados(p)),
      fixavel: true,
    },
  }
  out.mediaNotas = {
    pergunta: 'Qual a nota média da rede?',
    texto: `Eu não calculo média: ela esconde quem ficou para trás. Em vez dela, quantos alunos estão abaixo de 6,0 no trimestre: **${lista(nt.itens.map((n) => `${conta(n.alunos)} ${n.id === 'dois' ? 'em 2 ou mais componentes' : `em ${n.curto}`}`))}**.`,
    r: { ...out.notas.r },
  }

  /* onde a aprendizagem trava */
  for (const serie of p.series) {
    const h = p.habilidades.itens.filter((x) => x.serie === serie)
    if (!h.length) continue
    const [a, ...resto] = h
    out[`trava-${serie}`] = {
      pergunta: PERGUNTAS.trava(serie),
      texto: `${naSerie(serie).charAt(0).toUpperCase()}${naSerie(serie).slice(1)}, a habilidade com mais alunos abaixo de 50% de acerto é **${a.nome} (${a.codigo})**: **${conta(a.alunos)}${a.de ? ` de ${inteiro(a.de)}` : ''} alunos**.${resto.length ? ` Depois, ${lista(resto.map((x) => `${x.nome}, com ${conta(x.alunos)}`))}.` : ''}`,
      r: {
        visual: { tipo: 'barras', familia: 'azul', max: a.de ?? Math.max(...h.map((x) => x.alunos)), itens: h.map((x) => ({ rotulo: `${x.nome} · ${x.codigo}`, valor: x.alunos, texto: `${conta(x.alunos)}${x.de ? ` de ${inteiro(x.de)}` : ''}` })) },
        fonte: fonteDe(p.habilidades.origem, 'não substitui Saeb nem Ideb'),
        seguir: [{ rotulo: 'Todas as séries', pergunta: 'Onde a aprendizagem trava?' }],
        fixavel: true,
      },
    }
  }
  out.trava = {
    pergunta: 'Onde a aprendizagem trava?',
    texto: `As habilidades com mais alunos abaixo de 50% de acerto nas provas aprovadas pelos professores. A primeira é **${p.habilidades.itens[0].nome}**, ${naSerie(p.habilidades.itens[0].serie)}: **${conta(p.habilidades.itens[0].alunos)} alunos**.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Habilidade', 'Série', 'Abaixo de 50%'], linhas: p.habilidades.itens.map((x) => [`${x.nome} · ${x.codigo}`, x.serie, `${conta(x.alunos)}${x.de ? ` de ${inteiro(x.de)}` : ''}`]) },
      fonte: fonteDe(p.habilidades.origem, 'não substitui Saeb nem Ideb'),
      fixavel: true,
    },
  }

  /* Ideb e os anuais */
  const ideb = p.anuais.find((a) => a.id === (estado ? 'ideb-em' : 'ideb-af'))!
  const outros = p.anuais.filter((a) => a !== ideb)
  out.ideb = {
    pergunta: PERGUNTAS.ideb(rede),
    texto: estado
      ? `O Ideb do Ensino Médio da rede estadual em Joinville é **${ideb.valor}** (2025): ${ideb.contexto.charAt(0).toLowerCase()}${ideb.contexto.slice(1)}. Nos anos finais, **5,0**, com a última meta (2021) em 5,8. Na 1ª série do EM, a reprovação é de 15,7% e o abandono, 4,4%.`
      : `O Ideb dos anos finais da rede municipal é **${ideb.valor}** (2025): parado em 6,0 desde 2023, e a última meta (2021) era **6,4**. Nos anos iniciais, 7,1: o Turmma não atua nessa etapa. O abandono nos anos finais é 0,0%.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Ano', ideb.rotulo], linhas: (ideb.historico ?? []).map((x) => [String(x.ano), x.valor]) },
      fonte: fonteDe(ideb.origem, 'dado oficial, anual'),
      seguir: [{ rotulo: 'Os outros indicadores', pergunta: 'Quais são os indicadores anuais?' }, { rotulo: `Onde ${naSerie(o.serieQueTrava).replace(/^n/, '')} trava`, pergunta: PERGUNTAS.trava(o.serieQueTrava) }],
      fixavel: true,
    },
  }
  out.anuais = {
    pergunta: 'Quais são os indicadores anuais?',
    texto: `Os indicadores oficiais do INEP para a ${o.rede.charAt(0).toLowerCase()}${o.rede.slice(1)}, de 2025. Eles mudam uma vez por ano; o Painel mostra o que muda toda semana.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Indicador', 'Valor', 'Contexto'], linhas: [ideb, ...outros].map((a) => [a.rotulo, a.valor, `${a.contexto}${a.nota ? ` · ${a.nota}` : ''}`]) },
      fonte: 'Oficial · INEP · Ideb e Censo Escolar 2025',
      fixavel: true,
    },
  }

  /* Estado: Pé-de-Meia e a 1ª série do EM */
  if (estado && p.peDeMeia) {
    const pm = p.peDeMeia
    out.peDeMeia = {
      pergunta: PERGUNTAS.peDeMeia,
      texto: `**${conta(pm.abaixoDe80)} dos ${inteiro(pm.beneficiarios)} beneficiários** do Pé-de-Meia nas escolas com Turmma estão abaixo de 80% de frequência em setembro. ${LIMIAR_DO_PE_DE_MEIA}. Setembro fecha em 30/09: ainda dá para recuperar.`,
      r: {
        visual: { tipo: 'tabela', colunas: ['Escola', 'Beneficiários', 'Abaixo de 80%'], linhas: p.linhas.map((l) => [
          l.curto, l.dados?.peDeMeia ? inteiro(l.dados.peDeMeia.beneficiarios) : 'sem dados', l.dados?.peDeMeia ? conta(l.dados.peDeMeia.abaixoDe80) : '',
        ]) },
        fonte: fonteDe(pm.origem),
        seguir: [{ rotulo: '1ª série do EM', pergunta: PERGUNTAS.primeiraSerie }, { rotulo: 'Abaixo de 75%', pergunta: PERGUNTAS.frequencia }],
        fixavel: true,
      },
    }
    const prim = recorteDoPainel(rede, '1ª série EM')
    const doisPrim = comDados(p).reduce((s, l) => s + (l.dados!.primeiraSerieDois ?? 0), 0)
    out.primeiraSerie = {
      pergunta: PERGUNTAS.primeiraSerie,
      texto: `Na 1ª série do EM, **${conta(doisPrim)} alunos** estão abaixo de 6,0 em 2 ou mais componentes, e **${conta(prim.frequencia.faixas.find((x) => x.id === 'reprova')!.alunos)}** estão abaixo de 75% de frequência. É a série com 15,7% de reprovação, 4,4% de abandono e 24,8% de distorção idade-série em Joinville (INEP 2025).`,
      r: {
        visual: { tipo: 'tabela', colunas: ['Escola', '2 ou mais abaixo de 6,0', 'Abaixo de 75%'], linhas: prim.linhas.map((l) => [
          l.curto, l.dados ? conta(l.dados.primeiraSerieDois ?? 0) : 'sem dados', l.dados ? conta(l.dados.faixas.reprova) : '',
        ]) },
        fonte: `${fonteDe(p.notas.origem)} · ${fonteDe({ tipo: 'oficial', fonte: 'INEP · Censo Escolar 2025' })}`,
        seguir: [{ rotulo: 'Onde a 1ª série trava', pergunta: PERGUNTAS.trava('1ª série EM') }, { rotulo: 'Pé-de-Meia', pergunta: PERGUNTAS.peDeMeia }],
        fixavel: true,
      },
    }
  }

  /* as escolas, de A a Z */
  const colunasEscolas: { rotulo: string; valor: (l: LinhaDoPainel) => number | null }[] = [
    { rotulo: 'Abaixo de 75%', valor: (l) => l.dados!.faixas.reprova },
    { rotulo: 'APOIA vencido', valor: (l) => l.dados!.apoiaVencidos },
    estado
      ? { rotulo: 'Pé-de-Meia < 80%', valor: (l) => l.dados!.peDeMeia?.abaixoDe80 ?? null }
      : { rotulo: 'MAT < 6,0', valor: (l) => l.dados!.mat },
  ]
  out.escolas = {
    pergunta: PERGUNTAS.escolas,
    texto: `As ${p.linhas.length} escolas, **de A a Z**, em contagens de alunos. Eu não ordeno escolas da melhor para a pior. ${notaSemDados(p)}`.trim(),
    r: {
      visual: { tipo: 'tabela', colunas: ['Escola', 'Alunos', ...colunasEscolas.map((c) => c.rotulo)], linhas: p.linhas.map((l) => [
        l.curto, l.dados ? inteiro(l.alunos) : 'sem dados', ...colunasEscolas.map((c) => (l.dados ? textoDaContagem(c.valor(l), rede) : '')),
      ]) },
      fonte: `${fonteDe(f.origem)} · ${fonteDe(ap.origem)}`,
      seguir: [{ rotulo: 'O que pede ação', pergunta: PERGUNTAS.semana }],
      fixavel: true,
    },
  }

  /* a chamada atrasada (o diário em dia) */
  const atrasadas = comDados(p).filter((l) => l.dados!.semChamada > 0)
  out.chamada = {
    pergunta: PERGUNTAS.chamada,
    texto: `**${atrasadas.length} ${atrasadas.length === 1 ? 'escola tem' : 'escolas têm'}** turma sem chamada lançada há 3 dias letivos ou mais: ${lista(atrasadas.map((l) => `${l.curto} (${l.dados!.semChamada} ${l.dados!.semChamada === 1 ? 'turma' : 'turmas'})`))}. O Censo e o APOIA dependem do diário em dia; o diário de setembro fecha em 30/09.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Escola', 'Turmas sem chamada'], linhas: p.linhas.map((l) => [l.curto, l.dados ? String(l.dados.semChamada) : 'sem dados']) },
      fonte: fonteDe(p.frequencia.origem, 'turmas sem chamada há 3 dias letivos ou mais'),
      seguir: [{ rotulo: 'O que pede ação', pergunta: PERGUNTAS.semana }],
      fixavel: true,
    },
  }

  /* a IA sob controle */
  const ia = IA_POR_ESCOLA[rede]
  out.ia = {
    pergunta: PERGUNTAS.ia,
    texto: `Nada da IA chega ao aluno sem um professor revisar. Em setembro, a IA preparou **${inteiro(p.ia.materiais)} materiais**; **${inteiro(p.ia.esperando)}** esperam a revisão. A rede usou ${p.ia.pacote}% do pacote de IA do mês, ${reais(p.ia.porAluno)} por aluno.`,
    r: {
      visual: { tipo: 'tabela', colunas: ['Escola', 'Materiais da IA', 'Esperando revisão'], linhas: p.linhas.map((l) => [
        l.curto, ia[l.id] ? inteiro(ia[l.id].materiais) : 'sem dados', ia[l.id] ? textoDaContagem(ia[l.id].esperando, rede) : '',
      ]) },
      fonte: fonteDe(p.ia.origem),
      fixavel: true,
    },
  }
  return out
}

/* ── Recusas e "não sei" (nunca beco: sempre 2 ou 3 caminhos) ──────────────────────────────────────────── */

function recusas(rede: RedeId) {
  const semana = { rotulo: 'O que pede ação', pergunta: PERGUNTAS.semana }
  const freq = { rotulo: 'Abaixo de 75%', pergunta: PERGUNTAS.frequencia }
  const escolas = { rotulo: 'Cada escola, de A a Z', pergunta: PERGUNTAS.escolas }
  return {
    nominal: { id: 'r-nominal', tom: 'recusa', frase: frase('**Na rede eu só vejo números agregados, de grupos de 5 ou mais alunos.** Não mostro nome nem dado de um aluno: quem acompanha cada aluno é a escola.'), seguir: [freq, escolas] },
    professor: { id: 'r-professor', tom: 'recusa', frase: 'Eu não comparo nem avalio professores. Na rede, nenhum número é de um professor.', seguir: [semana, freq] },
    turma: { id: 'r-turma', tom: 'recusa', frase: 'Na rede eu não abro turma: uma turma tem poucos professores e poucos alunos. Posso mostrar a série na rede toda.', seguir: [freq] },
    conversa: { id: 'r-conversa', tom: 'recusa', frase: `Eu não vejo conversas, e a ${rede === 'estado' ? 'regional' : 'secretaria'} também não.`, seguir: [{ rotulo: 'Como protegemos os dados', pergunta: 'Como protegemos os dados' }] },
    naoSei: { id: 'nao-sei', tom: 'nao-sei', frase: 'Isso eu ainda não sei responder. Posso mostrar:', seguir: [semana, freq, { rotulo: 'Notas abaixo de 6,0', pergunta: PERGUNTAS.notas }] },
  } satisfies Record<string, RespostaDados>
}

/* ── O roteiro ─────────────────────────────────────────────────────────────────────────────────────────── */

export type OpcoesRoteiroRede = {
  /** as respostas fixadas agora (o relatório as leva) */
  fixadas?: () => string[]
  /** "Como protegemos os dados" abre o painel ao lado */
  aoAbrirProtecao?: () => void
  /** a 375: rótulos curtos nas sugestões; barras com rótulo longo viram tabela */
  celular?: boolean
}

/** Normaliza para comparar perguntas prontas: sem acento, minúsculas, sem pontuação no fim. */
const chave = (s: string) => semAcento(s).toLowerCase().replace(/[?!.\s]+$/g, '').trim()

/** O nome curto da escola, para achar na pergunta ("araucaria", "ipe", "canela preta", "aurora"). */
const apelidoDe = (curto: string) => new RegExp(`\\b${semAcento(curto).toLowerCase().replace(/^colegio /, '').split(/[\s-]+/)[0]}`)

export function criarRoteiroRede(rede: RedeId, n: NumerosDaRede, opcoes: OpcoesRoteiroRede = {}): RoteiroDados {
  const p = painelDa(rede)
  const o = ORGAO[rede]
  const estado = rede === 'estado'
  const prontas = respostas(rede)
  const RECUSAS = recusas(rede)
  const voc = vocabularioRede(n.escolas)
  const conta = (x: number) => textoDaContagem(x, rede)
  const montar = (id: string): RespostaDados => {
    const r = prontas[id]
    return { id, frase: frase(r.texto), ...r.r }
  }
  const fixadas = () => opcoes.fixadas?.() ?? []
  const textosFixados = () => Object.fromEntries(Object.entries(prontas).map(([id, r]) => [id, `${r.pergunta}${/[?!.]$/.test(r.pergunta) ? '' : ':'} ${limpo(r.texto)}`]))

  const relatorio = (): RespostaDados => {
    const doc = relatorioDaRede(rede, fixadas(), textosFixados())
    const nf = fixadas().length
    const comFixadas = nf === 0 ? '' : nf === 1 ? ' e a resposta que você fixou' : ` e as ${nf} respostas que você fixou`
    return {
      id: 'relatorio',
      frase: frase(`Pronto. Montei o **relatório de setembro · ${REDES_DO_PAINEL[rede].nome}**: o que pede ação, frequência por faixa, notas abaixo de 6,0, as escolas de A a Z, onde a aprendizagem trava, a IA e os indicadores anuais${comFixadas}. **Só contagens, sem nomes e sem médias.**`),
      fonte: `Os mesmos números do Painel · ${p.linhaDeFonte}`,
      arquivo: {
        titulo: `Relatório de setembro · ${REDES_DO_PAINEL[rede].nome}`,
        apoio: `PDF · ${paginas(doc)} páginas`,
        aoBaixar: () => baixarRelatorioDaRede(rede, 'pdf', fixadas(), textosFixados()),
        doc: () => relatorioDaRede(rede, fixadas(), textosFixados()),
      },
    }
  }

  const protecao = (): RespostaDados => {
    opcoes.aoAbrirProtecao?.()
    return {
      id: 'protecao', tom: 'recusa',
      frase: `Abri ao lado como protegemos os dados: o controlador é o ${o.controlador}, e a ${estado ? 'regional' : 'secretaria'} não vê aluno nem conversa.`,
      seguir: [{ rotulo: 'O que pede ação', pergunta: PERGUNTAS.semana }],
    }
  }

  // as perguntas prontas (sugestões, cartões do Painel, seguir) casam inteiras, antes do texto livre
  const exatas = new Map<string, () => RespostaDados>()
  Object.keys(prontas).forEach((id) => exatas.set(chave(prontas[id].pergunta), () => montar(id)))
  exatas.set(chave(PERGUNTAS.relatorio), relatorio)
  exatas.set(chave('Como protegemos os dados'), protecao)

  /** A escola citada na pergunta (uma só), entre as do recorte. */
  const escolaCitada = (t: string): LinhaDoPainel | null => {
    const citadas = p.linhas.filter((l) => apelidoDe(l.curto).test(t))
    return citadas.length === 1 ? citadas[0] : null
  }

  /** "Como está a Araucária?": as contagens da escola, sem nome e sem média. */
  const resumoDaEscola = (l: LinhaDoPainel): RespostaDados => {
    if (!l.dados) {
      return {
        id: `escola-${l.id}-${++FEITAS}`, tom: 'nao-sei',
        frase: frase(`${artigoDa(l.curto) === 'o' ? 'O' : 'A'} **${l.curto}** está ${l.situacao === 'convite' ? 'com o convite enviado' : 'montando as turmas'}: **ainda sem dados**. Os números aparecem quando o diário dela chegar ao Turmma.`),
        seguir: [{ rotulo: 'Cada escola, de A a Z', pergunta: PERGUNTAS.escolas }],
      }
    }
    const d = l.dados
    return {
      id: `escola-${l.id}-${++FEITAS}`,
      frase: frase(`${artigoDa(l.curto) === 'o' ? 'No' : 'Na'} **${l.curto}** (${inteiro(l.alunos)} alunos): **${conta(d.faixas.reprova)}** abaixo de 75% de frequência e **${conta(d.faixas.cronica)}** com falta crônica; ${conta(d.apoia)} no critério do APOIA sem aviso${d.apoiaVencidos ? ` e ${conta(d.apoiaVencidos)} com prazo vencido` : ''}${d.peDeMeia ? `; ${conta(d.peDeMeia.abaixoDe80)} do Pé-de-Meia abaixo de 80%` : ''}. No trimestre, ${conta(d.lp)} abaixo de 6,0 em LP e ${conta(d.mat)} em MAT.`),
      visual: { tipo: 'barras', familia: 'anil', max: l.alunos, itens: FAIXAS.map((x) => ({ rotulo: x.rotulo, valor: d.faixas[x.id], texto: `${conta(d.faixas[x.id])} alunos` })) },
      fonte: `${fonteDe(p.frequencia.origem)} · ${fonteDe(p.notas.origem)}`,
      seguir: [{ rotulo: 'Cada escola, de A a Z', pergunta: PERGUNTAS.escolas }, { rotulo: 'APOIA vencido', pergunta: PERGUNTAS.apoia }],
      fixavel: true,
    }
  }

  /** "Qual escola tem mais alunos?": maior e menor só para tamanho; a lista de A a Z. */
  const tamanho = (t: string): RespostaDados | null => {
    if (!/\b(mais|menos|maior|menor)\b.{0,20}\b(alunos|escolas?)\b|\b(maior|menor)\b|tamanho/.test(t)) return null
    if (/usa|usou|acert|abaixo|atras|falt|nota|desempenho|conversa|materia|pacote|\bia\b|gast|custo|apoia|frequen|meia/.test(t)) return null
    if (!/escola|alunos/.test(t)) return null
    const com = comDados(p)
    if (com.length < 2) return null
    const maior = com.reduce((a, l) => (l.alunos > a.alunos ? l : a))
    const menor = com.reduce((a, l) => (l.alunos < a.alunos ? l : a))
    return {
      id: `tamanho-${++FEITAS}`,
      frase: frase(`A maior é ${artigoDa(maior.curto)} **${maior.curto}**, com **${inteiro(maior.alunos)} alunos**; a menor é ${artigoDa(menor.curto)} **${menor.curto}**, com **${inteiro(menor.alunos)}**. Abaixo, todas de A a Z. ${notaSemDados(p)}`.trim()),
      visual: { tipo: 'tabela', colunas: ['Escola', 'Alunos'], linhas: p.linhas.map((l) => [l.curto, l.dados ? inteiro(l.alunos) : 'sem dados']) },
      fonte: fonteDe(p.frequencia.origem, escolasComDados(p)),
      fixavel: true,
    }
  }

  /** Série que o Turmma não atende nesta rede. */
  const serieFora = (t: string): RespostaDados | null => {
    const iniciais = /\b[1-5]o?\s*ano\b|\b(primeiro|segundo|terceiro|quarto|quinto) ano\b|anos iniciais|fundamental (1|i)\b/.test(t)
    const medio = /\b[1-3][oa]?\s*(serie|ano)\s*(do\s*)?(em|ensino medio)\b|\bensino medio\b|\bem\b.*\bserie\b/.test(t)
    if (iniciais && !/ideb/.test(t)) {
      return {
        id: `serie-fora-${++FEITAS}`, tom: 'nao-sei',
        frase: frase(estado
          ? 'Na rede estadual, o Turmma está **do 6º ano à 3ª série do EM**: não tenho dado dos anos iniciais.'
          : 'Na rede municipal, o Turmma está **do 6º ao 9º ano**: não atua nos anos iniciais nem no infantil. O Ideb dos anos iniciais (7,1, oficial) está nos indicadores anuais.'),
        seguir: [{ rotulo: 'Indicadores anuais', pergunta: 'Quais são os indicadores anuais?' }, { rotulo: 'Abaixo de 75% por série', pergunta: PERGUNTAS.frequencia }],
      }
    }
    if (medio && !estado) {
      return {
        id: `serie-fora-${++FEITAS}`, tom: 'nao-sei',
        frase: frase('A rede municipal não tem **Ensino Médio**: ele é da rede estadual. Troque para "Estado de SC · Regional Joinville" no seletor da rede.'),
        seguir: [{ rotulo: 'Abaixo de 75% por série', pergunta: PERGUNTAS.frequencia }],
      }
    }
    return null
  }

  /** "Em que habilidade o 8º ano mais trava?" com a série na pergunta. */
  const travaDaSerie = (t: string): RespostaDados | null => {
    if (!/trava|habilidade|aprendizagem|dificuldade|mais err/.test(t)) return null
    const s = p.series.find((x) => {
      const num = x.match(/\d/)![0]
      return /serie/.test(x) ? new RegExp(`\\b${num}[ao]?\\s*serie|\\b${num}[ao]?\\s*(ano\\s*)?(do\\s*)?em\\b`).test(t) : new RegExp(`\\b${num}o?\\s*ano\\b|\\b${num}o\\b`).test(t)
    })
    if (s && prontas[`trava-${s}`]) return montar(`trava-${s}`)
    if (s) return { id: `trava-${++FEITAS}`, tom: 'nao-sei', frase: `${naSerie(s).charAt(0).toUpperCase()}${naSerie(s).slice(1)}, nenhuma habilidade está entre as que mais travam na rede.`, seguir: [{ rotulo: 'Todas as séries', pergunta: 'Onde a aprendizagem trava?' }] }
    return montar('trava')
  }

  return {
    abertura: `Pergunte sobre a ${o.rede.charAt(0).toLowerCase()}${o.rede.slice(1)}.`,
    placeholder: 'Pergunte sobre as escolas, a frequência e as notas',
    selo: { rotulo: 'Só números agregados', titulo: 'Só contagens de grupos de 5 ou mais alunos; nunca nome de aluno, nunca número de professor.' },
    sugestoes: estado
      ? [
          { rotulo: PERGUNTAS.semana, pergunta: PERGUNTAS.semana },
          { rotulo: opcoes.celular ? 'Pé-de-Meia abaixo de 80%' : PERGUNTAS.peDeMeia, pergunta: PERGUNTAS.peDeMeia },
          { rotulo: PERGUNTAS.primeiraSerie, pergunta: PERGUNTAS.primeiraSerie },
          { rotulo: PERGUNTAS.ideb('estado'), pergunta: PERGUNTAS.ideb('estado') },
          { rotulo: PERGUNTAS.apoia, pergunta: PERGUNTAS.apoia },
          { rotulo: PERGUNTAS.relatorio, pergunta: PERGUNTAS.relatorio, fixa: true },
        ]
      : [
          { rotulo: PERGUNTAS.semana, pergunta: PERGUNTAS.semana },
          { rotulo: PERGUNTAS.frequencia, pergunta: PERGUNTAS.frequencia },
          { rotulo: PERGUNTAS.apoia, pergunta: PERGUNTAS.apoia },
          { rotulo: PERGUNTAS.ideb('prefeitura'), pergunta: PERGUNTAS.ideb('prefeitura') },
          { rotulo: opcoes.celular ? 'Onde o 8º ano trava' : PERGUNTAS.trava('8º ano'), pergunta: PERGUNTAS.trava('8º ano') },
          { rotulo: PERGUNTAS.relatorio, pergunta: PERGUNTAS.relatorio, fixa: true },
        ],
    responder: (pergunta, ctx) => {
      const pronta = exatas.get(chave(pergunta))
      if (pronta) return pronta()
      const t = normalizar(pergunta)

      if (/relatorio/.test(t)) return relatorio()
      if (/protegemos|protecao dos dados|lgpd|controlador/.test(t)) return protecao()
      if (/(ver|ler|mostr\w*|abr\w*|le) (as |a )?conversas?|o que (os alunos|eles) (perguntaram|conversaram)|\bchat\b/.test(t)) return RECUSAS.conversa
      // o APOIA, mesmo com "quem": a resposta é a contagem por escola
      if (/apoia|busca ativa|conselho tutelar/.test(t)) return montar(/venc|atras|prazo|escola/.test(t) && !/quem|entrou|entraram|novos?/.test(t) ? 'apoia' : 'apoiaNovos')
      if (/\bnomes?\b|quais (os |as )?alun|qual (o |a )?alun|\bquem\b(?! aprova| revisa)|lista de alun/.test(t) && !/piorou|pioraram/.test(t)) return recusaDeNome(t)
      if (/professor(?!.*\b(aprova|revis))/.test(t)) return RECUSAS.professor
      if (/\bturma\b|(por|cada|das|nas) turmas/.test(t)) return RECUSAS.turma
      if (/\b(ranking|top)\b|(melhor|pior|primeira|ultima)s?\b.*escola|escola.*\b(melhor|pior|primeira|ultima)s?\b|ordem de desempenho/.test(t)) return ranking()
      // média: sempre a distribuição
      if (/\bmedi[ao]s?\b|em media/.test(t) && !/ensino medio|media minima/.test(t)) {
        return /nota|acert|desempenho|aprendiz|prova|portugues|matematica/.test(t) ? montar('mediaNotas') : montar('media')
      }
      const fora = serieFora(t)
      if (fora) return fora
      const tam = tamanho(t)
      if (tam) return tam
      if (/pe.de.meia|pe de meia|80\s*%|parcela/.test(t)) return estado ? montar('peDeMeia') : {
        id: `pdm-${++FEITAS}`, tom: 'nao-sei',
        frase: 'O Pé-de-Meia é do Ensino Médio, e a rede municipal não tem Ensino Médio. Na prefeitura, a linha que vale é a de 75% (LDB).',
        seguir: [{ rotulo: 'Abaixo de 75%', pergunta: PERGUNTAS.frequencia }],
      }
      if (estado && /\b1[ao]?\s*serie|primeira serie|\b1o?\s*(ano\s*)?(do\s*)?em\b/.test(t) && !/habilidade|trava/.test(t)) return montar('primeiraSerie')
      const trava = travaDaSerie(t)
      if (trava) return trava
      if (/ideb|saeb|seaesc|indicador|reprovac|abandono|distorc|censo|inep|meta/.test(t)) return /ideb|meta/.test(t) ? montar('ideb') : montar('anuais')
      const escola = escolaCitada(t)
      if (escola && !/usaram|usou|usando/.test(t)) return resumoDaEscola(escola)
      const daOutra = painelDa(estado ? 'prefeitura' : 'estado').linhas.find((l) => apelidoDe(l.curto).test(t))
      if (daOutra) {
        return {
          id: `outra-rede-${++FEITAS}`, tom: 'nao-sei',
          frase: frase(`${artigoDa(daOutra.curto) === 'o' ? 'O' : 'A'} **${daOutra.curto}** é escola ${estado ? 'municipal' : 'estadual'}: está no painel ${estado ? 'da Prefeitura de Joinville' : 'do Estado de SC · Regional Joinville'}. Troque de rede no topo da lateral.`),
          seguir: [{ rotulo: 'Cada escola desta rede', pergunta: PERGUNTAS.escolas }],
        }
      }
      if (/pior(ou|aram)|melhor(ou|aram)|mudou de faixa|desde agosto|movimento/.test(t)) return montar('movimento')
      if (/chamada|diario/.test(t)) return montar('chamada')
      if (/frequen|falt|75|presenc|evasao|reprova por falta/.test(t)) {
        if (/media/.test(t)) return montar('media')
        return /escola/.test(t) ? montar('frequenciaEscola') : montar('frequencia')
      }
      if (/nota|abaixo de 6|6,0|\b6\b|componente|recupera/.test(t)) return /escola/.test(t) ? montar('notasEscola') : montar('notas')
      if (/\bia\b|revis|material|pacote|gast|custo|token|credito|consumo|aprova/.test(t)) return montar('ia')
      if (/acao|semana|urgente|prioridade|resumo|como esta|geral|panorama/.test(t) && !/escola/.test(t)) return montar('semana')
      // na prefeitura, o motor ainda responde o uso e a contagem abaixo de 50% nas provas
      if (!estado) {
        const doMotor = motor(pergunta, ctx.anterior)
        if (doMotor) return doMotor
      }
      if (estado && /usaram|usou|usando|\buso\b|acess/.test(t)) {
        return { id: `uso-${++FEITAS}`, tom: 'nao-sei', frase: 'Na rede estadual, eu respondo pelas contagens do diário e das provas: frequência, APOIA, Pé-de-Meia e notas. O uso do Turmma por escola ainda não está aqui.', seguir: [{ rotulo: 'O que pede ação', pergunta: PERGUNTAS.semana }, { rotulo: 'Pé-de-Meia', pergunta: PERGUNTAS.peDeMeia }] }
      }
      if (/escola/.test(t)) return montar('escolas')
      if (/agosto|compar/.test(t)) return montar('movimento')
      return RECUSAS.naoSei
    },
  }

  function ranking(): RespostaDados {
    const r = montar('escolas')
    return { ...r, id: `ranking-${++FEITAS}`, frase: frase(`Eu não ordeno escolas da melhor para a pior: cada uma tem alunos diferentes, e o ranking não diz onde agir. Aqui estão todas **de A a Z**, em contagens. ${notaSemDados(p)}`.trim()) }
  }

  /** O pedido de nome: a frase da regra, sem botão de ver nomes, e a pergunta agregada equivalente. */
  function recusaDeNome(t: string): RespostaDados {
    const escola = escolaCitada(t)
    const nota = /nota|mal|abaixo|reprov|matematica|portugues/.test(t)
    const pergunta = escola ? `Como está ${artigoDa(escola.curto)} ${escola.curto}?` : nota ? PERGUNTAS.notasEscola : PERGUNTAS.frequenciaEscola
    return {
      id: `r-nominal-${++FEITAS}`, tom: 'recusa',
      frase: frase(`**Na rede eu só vejo números agregados, de grupos de 5 ou mais alunos.** Não mostro nome: quem acompanha cada aluno é a escola. Posso mostrar quantos alunos${escola ? ` ${daEscola(escola.curto)}` : ''} passaram de cada limiar.`),
      seguir: [{ rotulo: escola ? `Contagens ${daEscola(escola.curto)}` : nota ? 'Abaixo de 6,0 por escola' : 'Abaixo de 75% por escola', pergunta }],
    }
  }

  /* ── O motor (só na prefeitura): o uso e a contagem abaixo de 50% nas provas ── */

  function motor(pergunta: string, anteriorId?: string): RespostaDados | null {
    const texto = pergunta
      .replace(/\bdo\s*6\s*[º°o]?\s*(ano\s*)?ao\s*9\s*[º°o]?(\s*ano)?/i, ' ')
      .replace(/quantas turmas|n[uú]mero de turmas/i, 'quantos alunos')
      .replace(/^(.*\b(qual|quais|que) (a |as )?escolas?\b.*?)(\?)?$/i, '$1 por escola$4')
    const anterior = anteriorId ? CONSULTAS.get(anteriorId) : undefined
    const q = entender(texto, voc, anterior)
    if (!q) return null
    if (q.pedeProfessor) return RECUSAS.professor
    if (q.pedeNomes) return recusaDeNome(normalizar(pergunta))
    // acerto e média são médias: a resposta é a distribuição (quantos abaixo de 6,0)
    if (q.metrica === 'acerto' || q.metrica === 'media') return montar('mediaNotas')
    if (q.metrica === 'uso' || q.metrica === 'alunos') {
      if (q.agrupar === 'disciplina' || q.agrupar2 === 'disciplina' || q.filtros.disciplina?.length) {
        return {
          id: `sem-disciplina-${++FEITAS}`, tom: 'nao-sei',
          frase: 'O uso é do aluno, não da disciplina: quem entrou no Turmma conta uma vez, em qualquer matéria. Posso mostrar por série ou por escola.',
          seguir: [{ rotulo: 'Por série', pergunta: 'quantos alunos usaram por série?' }, { rotulo: 'Por escola', pergunta: 'quantos alunos usaram por escola?' }],
        }
      }
    }
    const r = calcularRede(q, voc)
    const resp = responderConsulta(r, voc, { recorte: 'rede', periodo: PERIODO.curto, fonte: fonteDoMotor })
    CONSULTAS.set(resp.id, q)
    return comContagens(resp, r)
  }

  /** As barras e tabelas do motor: no uso, "219 de 228 · 96%"; sem as escolas sem dado; grupos pequenos na frase. */
  function comContagens(resp: RespostaDados, r: ResultadoRede): RespostaDados {
    const q = r.consulta
    const protegidos = r.protegidos ?? new Set<string>()
    const sutil = (t: string) => createElement('span', { className: 'text-sutil' }, ` ${t}`)
    if (q.filtros.escola?.length) resp = { ...resp, frase: semNaRede(resp.frase) }

    if (r.valor === null && !r.grupos && !q.comparar) {
      return { ...resp, visual: undefined, csv: undefined, frase: frase('Nesse recorte há **menos de 5 alunos**: por isso o número não aparece.') }
    }
    if (q.metrica === 'uso' && q.comparar && r.valor !== null && r.agosto !== null && r.agosto !== undefined) {
      const rec = descreverRecorte(q, voc)
      resp = { ...resp, frase: frase(`Em agosto, **${inteiro(r.extra?.usaramAgosto ?? 0)} de ${inteiro(r.alunos)}** alunos${rec} usaram o Turmma (**${r.agosto}%**); em setembro, até ${PERIODO.ate}, **${inteiro(r.extra?.usaram ?? 0)}** (**${r.valor}%**).`) }
    }
    if (r.grupos && q.agrupar && resp.visual?.tipo === 'tabela' && !r.cruzado) {
      const dim = q.agrupar
      const semDado = r.grupos.filter((g) => g.alunos === 0).map((g) => g.nome)
      const comDado = r.grupos.filter((g) => g.alunos > 0)
      const usoDe = (g: { id: string }, mes: 'agosto' | 'setembro') => {
        const c = contarRede('uso', { ...q.filtros, [dim]: [g.id] }, mes, {}, voc)
        if (opcoes.celular) return `${c.valor ?? 0}%`
        return `${inteiro(c.extra?.usaram ?? 0)} de ${inteiro(c.alunos)} (${c.valor ?? 0}%)`
      }
      const linhas = q.metrica === 'uso' && q.comparar
        ? comDado.map((g) => [g.nome, usoDe(g, 'agosto'), usoDe(g, 'setembro')])
        : resp.visual.linhas.filter((l) => comDado.some((g) => g.nome === String(l[0])))
      const nota = semDado.length ? `${lista(semDado)}: ainda sem dado.` : ''
      return { ...resp, frase: nota ? createElement(Fragment, null, resp.frase, sutil(nota)) : resp.frase, visual: { ...resp.visual, linhas } }
    }
    if (!r.grupos || r.cruzado || resp.visual?.tipo !== 'barras' || !q.agrupar) return resp
    const dim = q.agrupar
    const semDado = r.grupos.filter((g) => g.valor === null && g.alunos === 0).map((g) => g.nome)
    const comTexto = (it: { rotulo: string; valor: number | null; texto?: string }) => {
      if (q.metrica !== 'uso' || q.comparar) return it
      const g = r.grupos!.find((x) => x.nome === it.rotulo)!
      const c = contarRede('uso', { ...q.filtros, [dim]: [g.id] }, q.mes, {}, voc)
      return { ...it, texto: `${inteiro(c.extra?.usaram ?? 0)} de ${inteiro(c.alunos)} · ${g.valor}%` }
    }
    const itens = resp.visual.itens.filter((_, i) => r.grupos![i].valor !== null).map(comTexto)
    const linhasComPoucos = r.grupos.filter((g) => g.alunos > 0).map((g) => {
      if (g.valor === null) return [g.nome, protegidos.has(g.id) ? 'não aparece' : 'menos de 5']
      const it = itens.find((i) => i.rotulo === g.nome)
      return [g.nome, it ? it.texto ?? String(it.valor ?? '') : '']
    })
    const poucos = r.grupos.some((g) => g.valor === null && g.alunos > 0)
    const colunas = [NOME_DIM[dim], ROTULO_METRICA[q.metrica] ?? 'Alunos']
    const visual: RespostaDados['visual'] = poucos || opcoes.celular
      ? { tipo: 'tabela', colunas, linhas: poucos ? linhasComPoucos : itens.map((i) => [i.rotulo, i.texto ?? String(i.valor ?? '')]) }
      : { ...resp.visual, itens }
    const extra = [poucos ? 'Onde diz "menos de 5", o grupo é pequeno demais para mostrar.' : '', semDado.length ? `${lista(semDado)}: ainda sem dado.` : ''].filter(Boolean).join(' ')
    return { ...resp, frase: extra ? createElement(Fragment, null, resp.frase, sutil(extra)) : resp.frase, visual }
  }
}

const NOME_DIM: Record<Dim, string> = { escola: 'Escola', serie: 'Série', turma: 'Turma', disciplina: 'Disciplina' }
const ROTULO_METRICA: Partial<Record<Consulta['metrica'], string>> = {
  uso: 'Usaram', entregas: 'No prazo', atrasados: 'Alunos', abaixo50: 'Alunos', alunos: 'Alunos', conversas: 'Conversas', materiais: 'Materiais',
}

/** Tira " na rede" dos textos de uma frase (mantém o negrito). */
function semNaRede(no: ReactNode): ReactNode {
  if (typeof no === 'string') return no.replace(/ na rede\b/g, '')
  if (Array.isArray(no)) return no.map(semNaRede)
  if (isValidElement<{ children?: ReactNode }>(no)) {
    const filhos = no.props.children
    return filhos === undefined ? no : cloneElement(no, undefined, ...(Array.isArray(filhos) ? filhos : [filhos]).map(semNaRede))
  }
  return no
}

/** A consulta de cada resposta do motor (o "e em agosto?" herda dela). Fica fora do roteiro, que se refaz. */
const CONSULTAS = new Map<string, Consulta>()
let FEITAS = 0

const ORIGEM_DO_MOTOR: Record<Consulta['metrica'], string> = {
  uso: 'Turmma · acessos dos alunos', acerto: 'Turmma · correções aprovadas pelos professores', media: 'Turmma · correções aprovadas pelos professores',
  entregas: 'Turmma · entregas das tarefas', atrasados: 'Turmma · entregas das tarefas', abaixo50: 'Turmma · correções aprovadas pelos professores',
  alunos: 'Turmma · alunos com acesso', conversas: 'Turmma · conversas com o Tutor, só a contagem', materiais: 'Turmma · o que a IA gerou e quem aprovou',
}

/** "Turmma · acessos dos alunos · 01 a 21/09 · 4 escolas, 106 turmas, 3.412 alunos". */
function fonteDoMotor(r: Pick<Resultado, 'consulta' | 'escolas' | 'turmas' | 'alunos'>): string {
  const q = r.consulta
  const periodo = q.comparar ? 'agosto e setembro' : q.mes === 'agosto' ? 'agosto' : PERIODO.curto
  return `${ORIGEM_DO_MOTOR[q.metrica]} · ${periodo} · ${r.escolas} ${r.escolas === 1 ? 'escola' : 'escolas'}, ${inteiro(r.turmas)} turmas, ${inteiro(r.alunos)} alunos`
}

/** As frases dos cartões do Painel, para o PERGUNTAR de cada bloco. */
export const perguntaDoCartao = (rede: RedeId, id: string): string => {
  if (id === 'pe-de-meia') return PERGUNTAS.peDeMeia
  if (id === 'apoia-vencido') return PERGUNTAS.apoia
  if (id === 'primeira-serie') return PERGUNTAS.primeiraSerie
  if (id === 'revisao') return PERGUNTAS.ia
  if (id === 'chamada') return PERGUNTAS.chamada
  return rede === 'estado' ? PERGUNTAS.peDeMeia : PERGUNTAS.semana
}
