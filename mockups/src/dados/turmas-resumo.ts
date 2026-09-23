import { alunosDa, dificuldades, type Aluno } from './alunos'
import { rankingDeParticipacao } from './ranking'

/* O RESUMO DE CADA TURMA, para a área "Turmas" (a lista, a Visão Geral e a aba Alunos da turma aberta).
   Aqui mora o que não sai de `alunosDa()`: os erros recorrentes que a correção achou, o uso do Tutor em agregado, as
   adaptações registradas — e as contas que a lista, a Visão Geral, a aba Alunos e o Ranking dividem, para darem o mesmo
   número. 100% sintético (D71) e coerente com o resto do mockup: o "agora" é segunda, 21/09/2026, 10h42; o 2ºB teve a
   prova de estequiometria corrigida (64% de acerto, 5 destaques) e uma versão adaptada esperando; o 2ºA tem a lista de
   mol com 4 entregas em atraso; o 1ºC ainda não tem correção aprovada; o 9ºA é Ciências, à tarde, na E. M. Rio Cachoeira.
   Tudo é TRABALHO do aluno (nota, entrega, acerto, presença). Do Tutor só entra contagem e dúvida de conteúdo:
   nada de tempo de uso, horário, atenção ou jeito do aluno (D57, D66, D69).
   OITAVA RODADA (20/09/2026, "ctrl c e ctrl v da Teachy"): o cartão da lista passou a mostrar SÓ o desempenho, então
   `proximaAula`, `diasDeAula`, `esperando` e `andamento` deixaram de aparecer na lista (continuam aqui: outras telas
   contam a mesma história). Entraram a TENDÊNCIA, o STATUS e a ADAPTAÇÃO de cada aluno, para a tabela da aba Alunos. */

export type Espera = { titulo: string; detalhe: string }
export type ErroRecorrente = { texto: string; alunos: number; onde: string; pagina: number }
export type DuvidaTutor = { texto: string; vezes: number; pagina: number }
export type Capitulo = { nome: string; pagina: number; codigos: string[] }

export type ResumoTurma = {
  /** a próxima aula da grade; `conteudo` é o "o que vou dar" do calendário (null = ainda em branco) */
  proximaAula: { quando: string; conteudo: string | null; agora?: boolean }
  /** em que dias da semana a turma tem aula comigo, como a coordenação importou: 0 = segunda … 4 = sexta */
  diasDeAula: number[]
  /** o que a IA produziu e só vale com a aprovação da professora */
  esperando: Espera[]
  /** quando nada espera: o fato da turma que vale saber */
  andamento: Espera
  material: { titulo: string; capitulo: string }
  capitulos: Capitulo[]
  /** página de cada habilidade quando o material da turma não é o de Química 2 */
  paginas?: Record<string, number>
  origemDosErros: string
  erros: ErroRecorrente[]
  /** só agregado: quantos usaram na semana, quantas conversas, o assunto mais perguntado e as dúvidas que se repetiram */
  tutor: { usaram: number; conversas: number; assunto: string; duvidas: DuvidaTutor[] }
}

const QUIMICA_2 = { titulo: 'Química 2 — Material próprio do Colégio Aurora', capitulo: 'cap. 7 · Estequiometria' }
const CAPITULOS_Q2: Capitulo[] = [
  { nome: '7.1 Leis ponderais e equação', pagina: 142, codigos: ['EM13CNT101', 'EM13CNT205'] },
  { nome: '7.2 Mol e massa molar', pagina: 145, codigos: ['EM13CNT104'] },
  { nome: '7.4 Reagente limitante e rendimento', pagina: 151, codigos: ['EM13CNT301', 'EM13CNT302'] },
]

const RESUMOS: Record<string, ResumoTurma> = {
  '2b': {
    proximaAula: { quando: 'Hoje, 10h30', conteudo: 'Revisão de estequiometria', agora: true }, diasDeAula: [0, 1, 3, 4],
    esperando: [
      { titulo: 'Correção da prova', detalhe: '5 destaques' },
      { titulo: 'Versão adaptada', detalhe: 'fonte ampliada' },
    ],
    andamento: { titulo: 'Atividade de estequiometria', detalhe: 'entrega até 23/09' },
    material: QUIMICA_2, capitulos: CAPITULOS_Q2,
    origemDosErros: 'Prova de 18/09 · 64% de acerto',
    erros: [
      { texto: 'Não converte massa em mol antes de usar a proporção', alunos: 14, onde: 'questões 3 e 4', pagina: 145 },
      { texto: 'Escolhe o limitante pela menor massa, não pela proporção', alunos: 11, onde: 'questões 7 e 8', pagina: 151 },
      { texto: 'Usa o coeficiente da equação como se fosse massa', alunos: 8, onde: 'questão 5', pagina: 142 },
      { texto: 'Inverte o real e o teórico na conta do rendimento', alunos: 5, onde: 'questão 10', pagina: 151 },
    ],
    tutor: { usaram: 21, conversas: 58, assunto: 'Mol e massa molar', duvidas: [
      { texto: 'Por que eu divido pela massa molar?', vezes: 11, pagina: 145 },
      { texto: 'Como sei qual reagente sobra?', vezes: 7, pagina: 151 },
    ] },
  },
  '2a': {
    proximaAula: { quando: 'Amanhã, 10h30', conteudo: null }, diasDeAula: [0, 1, 2, 4],
    esperando: [],
    andamento: { titulo: 'Lista de mol e massa molar', detalhe: '4 entregas em atraso' },
    material: QUIMICA_2, capitulos: CAPITULOS_Q2,
    origemDosErros: 'Lista de mol, 17/09',
    erros: [
      { texto: 'Esquece de multiplicar pelo índice ao somar a massa molar', alunos: 9, onde: 'exercícios 2 e 3', pagina: 145 },
      { texto: 'Não converte massa em mol antes de usar a proporção', alunos: 7, onde: 'exercício 6', pagina: 145 },
      { texto: 'Usa a massa atômica no lugar da massa molar do composto', alunos: 6, onde: 'exercício 4', pagina: 145 },
      { texto: 'Arredonda a massa molar cedo demais e erra o resultado', alunos: 4, onde: 'exercício 5', pagina: 145 },
    ],
    tutor: { usaram: 17, conversas: 41, assunto: 'Massa molar', duvidas: [
      { texto: 'Como somo a massa molar de fórmula com parênteses?', vezes: 8, pagina: 145 },
      { texto: 'Quando eu uso 6,02 × 10²³?', vezes: 5, pagina: 144 },
    ] },
  },
  '1c': {
    proximaAula: { quando: 'Amanhã, 9h10', conteudo: 'Distribuição eletrônica' }, diasDeAula: [0, 1, 3, 4],
    esperando: [],
    andamento: { titulo: 'Prova de modelos atômicos', detalhe: 'aplicada em 25/08 · sem correção' },
    material: { titulo: 'Química 1 — Material próprio do Colégio Aurora', capitulo: 'cap. 3 · Modelos atômicos' },
    capitulos: [],
    origemDosErros: '',
    erros: [],
    tutor: { usaram: 12, conversas: 19, assunto: 'Número atômico e de massa', duvidas: [
      { texto: 'Qual a diferença entre número atômico e número de massa?', vezes: 6, pagina: 48 },
      { texto: 'Por que o modelo de Bohr tem camadas?', vezes: 4, pagina: 52 },
    ] },
  },
  '9a': {
    proximaAula: { quando: 'Hoje, 14h10', conteudo: null }, diasDeAula: [0, 2],
    esperando: [],
    andamento: { titulo: 'Projeto da feira de ciências', detalhe: '2ª etapa até 30/09' },
    material: { titulo: 'Ciências 9 — Caderno de atividades', capitulo: 'cap. 3 · Reações químicas' },
    capitulos: [
      { nome: '3.1 Conservação da massa e equação', pagina: 52, codigos: ['EM13CNT101', 'EM13CNT205'] },
      { nome: '3.2 Quantidade de matéria', pagina: 57, codigos: ['EM13CNT104'] },
      { nome: '3.3 Proporção entre reagentes', pagina: 61, codigos: ['EM13CNT301', 'EM13CNT302'] },
    ],
    paginas: { EM13CNT101: 52, EM13CNT205: 54, EM13CNT104: 57, EM13CNT301: 61, EM13CNT302: 63 },
    origemDosErros: 'Atividade de reações, 16/09',
    erros: [
      { texto: 'Conta os átomos sem multiplicar pelo coeficiente', alunos: 12, onde: 'questões 2 e 3', pagina: 54 },
      { texto: 'Muda o índice da fórmula para acertar a equação', alunos: 9, onde: 'questão 4', pagina: 54 },
      { texto: 'Soma a massa dos reagentes esquecendo o gás que saiu', alunos: 6, onde: 'questão 6', pagina: 52 },
      { texto: 'Trata mistura como se fosse reação química', alunos: 5, onde: 'questão 1', pagina: 50 },
    ],
    tutor: { usaram: 9, conversas: 15, assunto: 'Equação química', duvidas: [
      { texto: 'Como eu sei que houve reação química?', vezes: 5, pagina: 50 },
      { texto: 'O que o número na frente da fórmula quer dizer?', vezes: 4, pagina: 54 },
    ] },
  },
}

export const resumoDa = (turmaId: string): ResumoTurma => RESUMOS[turmaId] ?? RESUMOS['2b']

export const virgula = (n: number, casas = 1) => n.toFixed(casas).replace('.', ',')

/* ── Ranking de participação ─────────────────────────────────────────────────────────────────────────────────
   Pontua o que o aluno FEZ, não o quanto acertou: presença vale 10 por aula, entrega vale 20. É o mesmo critério
   da aba Ranking. No empate vale a ordem de chamada (a ordenação é estável), sem desempate por nota. */
export const pontosDe = (a: Aluno) => (a.aulasDadas - a.faltas) * 10 + a.entregas.feitas * 20
/* a ordem é a da aba Ranking (dados/ranking): pontos e, no empate, quem entregou mais cedo */
export const rankingDa = (turmaId: string) => rankingDeParticipacao(turmaId).linhas.map((l) => ({ aluno: l.aluno, pontos: l.pontos }))

/* ── Os números da turma ─────────────────────────────────────────────────────────────────────────────────── */
export type NumerosTurma = {
  alunos: number
  /** média das médias, de 0 a 10; null enquanto não há correção aprovada */
  media: number | null
  presenca: number
  entregas: number
  /** acerto médio nas habilidades avaliadas, em %; null sem diagnóstico */
  desempenho: number | null
  /** quantos alunos em cada faixa de média: abaixo de 6 · de 6 a 8 · 8 ou mais */
  faixas: [number, number, number]
  /** média da turma em cada atividade corrigida, na ordem em que aconteceram */
  evolucao: { atividade: string; data: string; media: number }[]
}

const soma = (l: number[]) => l.reduce((s, n) => s + n, 0)
const mediaDe = (l: number[]) => (l.length ? soma(l) / l.length : 0)

export function faixasDe(medias: (number | null)[]): [number, number, number] {
  const m = medias.filter((x): x is number => x !== null)
  return [m.filter((x) => x < 6).length, m.filter((x) => x >= 6 && x < 8).length, m.filter((x) => x >= 8).length]
}

const CACHE = new Map<string, NumerosTurma>()
export function numerosDa(turmaId: string): NumerosTurma {
  const pronto = CACHE.get(turmaId)
  if (pronto) return pronto
  const alunos = alunosDa(turmaId)
  const comNota = alunos.filter((a) => a.media !== null)
  const n: NumerosTurma = {
    alunos: alunos.length,
    media: comNota.length ? Math.round(mediaDe(comNota.map((a) => a.media!)) * 10) / 10 : null,
    presenca: Math.round((soma(alunos.map((a) => a.aulasDadas - a.faltas)) / soma(alunos.map((a) => a.aulasDadas))) * 100),
    entregas: Math.round((soma(alunos.map((a) => a.entregas.feitas)) / soma(alunos.map((a) => a.entregas.total))) * 100),
    desempenho: comNota.length ? Math.round(mediaDe(habilidadesDa(turmaId).map((h) => h.acerto))) : null,
    faixas: faixasDe(alunos.map((a) => a.media)),
    evolucao: comNota.length ? alunos[0].notas.map((nota, i) => ({
      atividade: nota.atividade, data: nota.data,
      media: Math.round(mediaDe(alunos.map((a) => a.notas[i].valor).filter((v): v is number => v !== null)) * 10) / 10,
    })) : [],
  }
  CACHE.set(turmaId, n)
  return n
}

/* ── Assuntos: o acerto da turma por habilidade e por capítulo ───────────────────────────────────────────── */
export type AssuntoTurma = { id: string; nome: string; codigo?: string; pagina: number; acerto: number; abaixo: number; /** só no capítulo: as habilidades dele */ partes?: { nome: string; codigo?: string; acerto: number }[] }

/** Acerto médio da turma em cada habilidade, do pior para o melhor; `abaixo` = quantos alunos estão abaixo de 50%. */
export function habilidadesDa(turmaId: string): AssuntoTurma[] {
  const alunos = alunosDa(turmaId)
  const paginas = resumoDa(turmaId).paginas
  return alunos[0].habilidades.map((h, i) => ({
    id: h.codigo, nome: h.curto, codigo: h.codigo, pagina: paginas?.[h.codigo] ?? h.pagina,
    acerto: Math.round(mediaDe(alunos.map((a) => a.habilidades[i].acerto))),
    abaixo: alunos.filter((a) => a.habilidades[i].acerto < 50).length,
  })).sort((x, y) => x.acerto - y.acerto)
}

export function capitulosDa(turmaId: string): AssuntoTurma[] {
  const hab = habilidadesDa(turmaId)
  return resumoDa(turmaId).capitulos.map((c) => {
    const dele = hab.filter((h) => c.codigos.includes(h.id))
    return { id: c.nome, nome: c.nome, pagina: c.pagina, acerto: Math.round(mediaDe(dele.map((h) => h.acerto))), abaixo: Math.max(0, ...dele.map((h) => h.abaixo)), partes: dele.map((h) => ({ nome: h.nome, codigo: h.codigo, acerto: h.acerto })) }
  }).sort((x, y) => x.acerto - y.acerto)
}

/* ── Quem precisa de atenção: o MOTIVO é sempre um fato do trabalho ──────────────────────────────────────── */
export type Atencao = { aluno: Aluno; motivos: string[]; peso: number }

/** Entra quem tem 3 ou mais habilidades abaixo de 50% com média abaixo de 6, média abaixo de 5, 2 ou mais entregas
    faltando, ou 4 ou mais faltas. Do caso mais pesado para o mais leve. Nunca comportamento (D57, D66). */
export function atencaoDa(turmaId: string): Atencao[] {
  return alunosDa(turmaId).map((a) => {
    const fracas = a.media === null ? [] : dificuldades(a)
    const faltando = a.entregas.total - a.entregas.feitas
    const entra = (fracas.length >= 3 && a.media !== null && a.media < 6) || (a.media !== null && a.media < 5) || faltando >= 2 || a.faltas >= 4
    const motivos = [
      fracas.length >= 2 ? `${fracas.length} habilidades abaixo de 50%` : fracas.length === 1 ? `${fracas[0].curto} abaixo de 50%` : '',
      faltando >= 1 ? `${faltando} ${faltando === 1 ? 'entrega faltando' : 'entregas faltando'}` : '',
      a.faltas >= 3 ? `${a.faltas} faltas` : '',
    ].filter(Boolean)
    if (motivos.length === 0 && a.media !== null) motivos.push(`média ${virgula(a.media)} nas atividades`)
    const peso = fracas.length * 2 + faltando * 1.5 + Math.max(0, a.faltas - 2) + (a.media !== null && a.media < 6 ? 2 : 0)
    return { aluno: a, motivos, peso, entra }
  }).filter((x) => x.entra).sort((x, y) => y.peso - x.peso).map(({ aluno, motivos, peso }) => ({ aluno, motivos, peso }))
}

/* ── A tabela da aba Alunos: tendência, status e adaptação ──────────────────────────────────────────────── */
export type Tendencia = { sentido: 'sobe' | 'desce' | 'estavel' | 'sem'; delta: number }

/** A evolução das notas do aluno: a metade mais recente das atividades corrigidas contra a metade mais antiga.
    Meio ponto para cima ou para baixo já conta; menos que isso é "estável". Com menos de duas notas, não há tendência. */
export function tendenciaDe(a: Aluno): Tendencia {
  const v = a.notas.map((n) => n.valor).filter((x): x is number => x !== null)
  if (v.length < 2) return { sentido: 'sem', delta: 0 }
  const meio = Math.floor(v.length / 2)
  const delta = Math.round((mediaDe(v.slice(v.length - meio)) - mediaDe(v.slice(0, meio))) * 10) / 10
  return { sentido: delta >= 0.5 ? 'sobe' : delta <= -0.5 ? 'desce' : 'estavel', delta }
}

export type StatusAluno = 'em-dia' | 'entrega' | 'abaixo'
/** Um status por aluno, sempre um fato do trabalho: média abaixo de 6 pesa mais que entrega faltando. */
export const statusDe = (a: Aluno): StatusAluno => (a.media !== null && a.media < 6 ? 'abaixo' : a.entregas.feitas < a.entregas.total ? 'entrega' : 'em-dia')

/* Adaptação REGISTRADA pela coordenação: o que muda é a FORMA do material (nunca o que é cobrado), e a versão adaptada
   só chega ao aluno depois que a professora aprova. Só o 2ºB tem, e são dois alunos (o mesmo "2" de TURMA_CARREGA). */
const ADAPTACOES: Record<string, string> = { '2b-13': 'fonte ampliada', '2b-27': 'enunciado direto, um exercício por bloco' }
export const adaptacaoDe = (alunoId: string): string | null => ADAPTACOES[alunoId] ?? null
