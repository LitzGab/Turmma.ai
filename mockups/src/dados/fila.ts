import { useMemo } from 'react'
import { TURMAS } from './escola'
import { criarFatia } from './demo/nucleo'
import { fatiaLotes, type Lote } from './demo/lotes-base'
import { turmaPorId } from './demo/turmas-base'
import { useEstadoAcesso, type PedidoNome } from './acesso'
import { alocacoes as acoesAlocacoes, useEscolaEstado, type AlocacaoEstado } from './escola-estado'
import { envios as acoesEnvios, useEstadoEnvios } from './envios'
import { lotes as acoesLotes, notasDoLote, useRevisoes, type Revisao } from './avaliacoes'
import { avisos as acoesAvisos, useEstadoAvisos, type Aviso } from './avisos'
import { ia as acoesIA, useEstadoIA } from './ia'
import { useProfessorAtual, type ProfessorAtual } from './sessao'

/* A FILA ÚNICA, "Esperando você" — 12ª rodada (04/10/2026): deixa de ser lista e vira VISTA do estado.

   Os itens são CALCULADOS do que aconteceu (plano de polimento, seção 4.1): um pedido de nome que espera vira item do
   professor que confirmou a turma (ou da coordenação, quando a turma não tem professor confirmado); um lote de notas
   em espera vira "Notas da prova"; um aviso aberto vira item da coordenação; o assunto delicado no Tutor vira
   "precisa de atenção" para o professor (sem o texto) e "Encaminhamento" para a coordenação. Resolver é mudar o
   estado com a ação de domínio (`pedidos.decidir`, `lotes.aprovar`, `alocacoes.confirmar`…), e o item sai de todo
   lugar ao mesmo tempo, nas duas abas.
   Os ids antigos ficam (atencao-2b, notas-2b, sinal-2b, pedidos-2b, adaptada-2b, turma-3a, aviso-0031,
   contestacao-paulo, alerta-a1, alerta-a2, material-bio, convite-jonas); o "dossie-mec" saiu (mora no Dossiê).
   `fila.resolver` e `fila.reabrir` continuam: como marcação manual (o que não tem domínio) e como ponte para as
   telas que ainda chamam por id. O professor vê só os itens DELE (a pessoa da sessão) e das turmas que confirmou. */

export type PapelFila = 'professor' | 'coordenacao'

export type TipoItem =
  | 'atencao' | 'notas' | 'sinal' | 'pedidos' | 'material' | 'turma'
  | 'aviso' | 'pedidos-nome' | 'contestacao' | 'alerta' | 'material-falhou' | 'convite' | 'dossie'
  | 'revisao' | 'risco' | 'titular'

export type ItemFila = {
  id: string
  papel: PapelFila
  tipo: TipoItem
  /** verbo + objeto, ou o fato em uma linha */
  titulo: string
  turmaId?: string
  /** o selo curto da turma ("2ºB") */
  turma?: string
  detalhe?: string
  /** a hora ou a data, em cinza; vazio quando não há */
  quando: string
  /** o agente que assina o item */
  de?: 'assistente' | 'tutor' | 'analista'
  /** rota que o item abre; sem ela, o item abre num painel ao lado, com ?item=<id> */
  para?: string
  urgente?: boolean
  ordem: number
  /** o título curto do cartão, de 2 a 4 palavras; sem ele, vale `titulo` */
  curto?: string
  /** o número do contador no fim do cartão (30 notas, 8 alunos…) */
  n?: number
  /** o prazo, num selo vermelho ("até 23/09") */
  prazo?: string
  /* 12ª rodada */
  /** o professor dono do item (só no papel professor) */
  professorId?: string
  /** a matéria, para o selo da turma na cor certa */
  materia?: string
  /** o cartão agrupado ("Pedidos para entrar · 3 turmas") traz os itens de cada turma */
  subitens?: ItemFila[]
  /** de onde vem (para o painel achar o objeto): o id do aviso, do lote, da alocação, da revisão, do pedido */
  ref?: string
}

export type Resolucao = 'aprovada' | 'recusada' | 'confirmada' | 'contestada' | 'vista' | 'feita'

/* ── Marcações manuais (o que não tem domínio, e a ponte para telas antigas) ──────────────────────────── */

const manuais = criarFatia<Record<string, Resolucao>>('fila', {})

/* ── O cálculo ─────────────────────────────────────────────────────────────────────────────────────────── */

type Fontes = {
  prof: ProfessorAtual
  pedidos: PedidoNome[]
  escola: ReturnType<typeof useEscolaEstado>
  docs: ReturnType<typeof useEstadoEnvios>
  lotes: Record<string, Lote>
  revisoes: Revisao[]
  avisos: Aviso[]
  ia: ReturnType<typeof useEstadoIA>
}

type Calculado = ItemFila & { resolucao?: Resolucao }

const materiaDa = (turmaId?: string) => (turmaId ? TURMAS.find((t) => t.id === turmaId)?.disciplina : undefined)
const nomeTurma = (turmaId: string) => TURMAS.find((t) => t.id === turmaId)?.nome ?? turmaPorId(turmaId)?.nome ?? turmaId
const horaDe = (rotulo: string) => rotulo.split(', ')[1] ?? rotulo
const primeiro = (nome?: string) => (nome ?? '').split(' ')[0]

const ORDEM_PROFESSOR: Partial<Record<TipoItem, number>> = { atencao: 0, notas: 1, revisao: 2, sinal: 3, pedidos: 4, material: 5, turma: 6 }
const ORDEM_COORDENACAO: Partial<Record<TipoItem, number>> = { risco: 0, aviso: 1, titular: 2, 'pedidos-nome': 3, contestacao: 4, alerta: 5, 'material-falhou': 6, convite: 7 }

const ALERTAS: ItemFila[] = [
  { id: 'alerta-a1', curto: 'Química · 2º ano', turma: '2º ano', papel: 'coordenacao', tipo: 'alerta', de: 'analista', titulo: 'Química do 2º ano: 19 alunos entraram abaixo de 6,0',
    detalhe: 'hipótese · 4 turmas', quando: '', ordem: 0, materia: 'Química' },
  { id: 'alerta-a2', curto: 'Entregas faltando', turma: '1ºC', n: 5, papel: 'coordenacao', tipo: 'alerta', de: 'analista', titulo: '1ºC: 5 alunos com três entregas faltando',
    detalhe: 'só a contagem', quando: '', ordem: 0, turmaId: '1c', materia: 'Química' },
]

/** Quem dá a matéria na turma (alocação confirmada). A contestação da memória vai a essa pessoa, não a qualquer
    professor da turma; sem ninguém, vai à coordenação. */
function daMateriaNaTurma(aloc: AlocacaoEstado[], turmaId: string, materia?: string): string[] {
  return aloc.filter((a) => a.turmaId === turmaId && a.estado === 'confirmado' && (!materia || a.disciplina === materia)).map((a) => a.professorId)
}

/** As turmas confirmadas do professor da sessão. */
function turmasConfirmadas(prof: ProfessorAtual, aloc: AlocacaoEstado[]): string[] {
  return aloc.filter((a) => a.professorId === prof.profId && a.estado === 'confirmado').map((a) => a.turmaId)
}

function doProfessor(f: Fontes): Calculado[] {
  const { prof } = f
  const minhas = turmasConfirmadas(prof, f.escola.alocacoes)
  const base = { papel: 'professor' as const, professorId: prof.id }
  const itens: Calculado[] = []

  // assunto delicado no Tutor: o professor da turma vê o sinal, SEM o texto (D36, D78)
  for (const a of f.avisos.filter((x) => x.tipo === 'risco' && x.turmaId && minhas.includes(x.turmaId))) {
    itens.push({
      ...base, id: a.numero === 32 ? 'atencao-2b' : `atencao-${a.numero}`, tipo: 'atencao', de: 'tutor', urgente: true,
      curto: `${primeiro(a.alunoNome)} precisa de atenção`, titulo: `${a.alunoNome} precisa de atenção`,
      turmaId: a.turmaId, turma: a.turma, materia: materiaDa(a.turmaId), detalhe: 'assunto pessoal; você não vê o texto',
      quando: horaDe(a.recebido), ordem: a.numero, ref: a.id, resolucao: a.vistoPeloProfessor ? 'vista' : undefined,
    })
  }

  // notas para aprovar
  for (const l of Object.values(f.lotes).filter((x) => minhas.includes(x.turmaId))) {
    const antigo = l.id === 'prova-2b'
    const tipo = l.tipo === 'prova' ? 'prova' : 'lista'
    const n = notasDoLote(l)
    itens.push({
      ...base, id: antigo ? 'notas-2b' : `notas-${l.id}`, tipo: 'notas', de: 'assistente', curto: `Notas da ${tipo}`, n,
      titulo: `Aprovar as notas da ${l.titulo.charAt(0).toLowerCase()}${l.titulo.slice(1)}`, turmaId: l.turmaId, turma: l.turma, materia: l.materia,
      detalhe: antigo ? `${n} provas, ${l.destaques.length} para conferir` : `${n} ${n === 1 ? 'entrega' : 'entregas'}`, quando: antigo ? '9h50' : (l.entregas.at(-1)?.quando ? horaDe(l.entregas.at(-1)!.quando) : ''),
      para: `/professor/aprovar/${l.id}`, ordem: antigo ? 0 : 1, ref: l.id,
      resolucao: l.estado === 'aprovado' ? 'aprovada' : l.estado === 'recusado' ? 'recusada' : undefined,
    })
  }

  // revisões que os alunos pediram ("Isso está errado?")
  const paraMim = (r: Revisao) => r.tipo === 'nota' || !r.materia || daMateriaNaTurma(f.escola.alocacoes, r.turmaId, r.materia).includes(prof.profId)
  for (const r of f.revisoes.filter((x) => minhas.includes(x.turmaId) && paraMim(x))) {
    itens.push({
      ...base, id: `revisao-${r.id}`, tipo: 'revisao', curto: r.tipo === 'nota' ? `${primeiro(r.alunoNome)} pediu revisão` : `${primeiro(r.alunoNome)} contestou a memória`,
      titulo: r.tipo === 'nota' ? `${r.alunoNome} pediu revisão da nota` : `${r.alunoNome} contestou a memória do Tutor`,
      turmaId: r.turmaId, turma: r.turma, materia: materiaDa(r.turmaId), quando: horaDe(r.quando), ordem: 0, ref: r.id,
      resolucao: r.estado === 'respondida' ? 'feita' : undefined,
    })
  }

  // o sinal do Tutor no 2ºB
  if (minhas.includes('2b')) {
    const s = f.ia.sinais['sinal-2b']
    // a revisão de massa em mol enviada ao 2ºB fecha o sinal na hora, em qualquer tela (não só no Início)
    const revisaoEnviada = f.docs.envios.some((e) => e.turmaId === '2b' && e.tipo !== 'prova' && /massa/i.test(e.titulo))
    itens.push({
      ...base, id: 'sinal-2b', curto: 'Travaram em massa → mol', n: 8, tipo: 'sinal', de: 'tutor', titulo: '8 alunos travaram em converter massa em mol',
      turmaId: '2b', turma: '2ºB', materia: 'Química', detalhe: 'p. 145', quando: '10h15', ordem: 0,
      resolucao: s === 'visto' || revisaoEnviada ? 'vista' : s === 'contestado' ? 'contestada' : undefined,
    })
  }

  // pedidos para entrar, por turma
  for (const turmaId of minhas) {
    const daTurma = f.pedidos.filter((p) => p.turmaId === turmaId)
    if (!daTurma.length) continue
    const n = daTurma.length
    itens.push({
      ...base, id: `pedidos-${turmaId}`, tipo: 'pedidos', curto: n === 1 ? 'Pedido para entrar' : 'Pedidos para entrar', n,
      titulo: n === 1 ? '1 aluno pediu para entrar' : `${n} alunos pediram para entrar`, turmaId, turma: nomeTurma(turmaId), materia: materiaDa(turmaId),
      detalhe: daTurma.some((p) => p.matriculaErrada) ? '1 com matrícula diferente' : undefined, quando: '', ordem: ['2b', '1c', '2a'].indexOf(turmaId) + 10,
    })
  }

  // versões adaptadas para aprovar
  for (const [docId, d] of Object.entries(f.docs.docs)) {
    const info = f.docs.info[docId]
    if (!d.adaptada || !info || !minhas.includes(info.turmaId)) continue
    const n = f.escola.adaptacoes.filter((a) => a.turmaId === info.turmaId).length
    itens.push({
      ...base, id: docId === 'prova-estequiometria' ? 'adaptada-2b' : `adaptada-${docId}`, tipo: 'material', de: 'assistente',
      curto: info.tipo === 'prova' ? 'Prova adaptada' : 'Versão adaptada', n, titulo: `Aprovar a versão adaptada: ${info.titulo.toLowerCase()}`,
      turmaId: info.turmaId, turma: nomeTurma(info.turmaId), materia: materiaDa(info.turmaId), detalhe: `vai para ${n} alunos`, quando: '10h44',
      para: `/professor/criados/${docId}?versao=adaptada&de=inicio`, ordem: 0, ref: docId,
      resolucao: d.adaptada.estado === 'aprovado' ? 'aprovada' : d.adaptada.estado === 'recusado' ? 'recusada' : d.adaptada.estado === 'espera' ? undefined : 'feita',
    })
  }

  // turmas para confirmar
  for (const a of f.escola.alocacoes.filter((x) => x.professorId === prof.profId)) {
    if (a.estado === 'encerrado' && a.id !== 'v4') continue
    itens.push({
      ...base, id: a.id === 'v4' ? 'turma-3a' : `turma-${a.id}`, tipo: 'turma', curto: 'Confirme sua turma', titulo: `Confirme sua turma: ${a.turma} · ${a.disciplina}`,
      turmaId: a.turmaId, turma: a.turma, materia: a.disciplina, detalhe: 'a coordenação pôs você aqui', quando: a.quando.replace(/^\D+/, '').split(' ')[0] ?? '',
      ordem: 0, ref: a.id,
      resolucao: a.estado === 'confirmado' ? 'confirmada' : a.estado === 'contestado' ? 'contestada' : a.estado === 'encerrado' ? 'feita' : undefined,
    })
  }
  return itens
}

function daCoordenacao(f: Fontes): Calculado[] {
  const base = { papel: 'coordenacao' as const }
  const itens: Calculado[] = []
  const aviso = (a: Aviso) => `/coordenacao/registros?aba=avisos&aviso=${a.id}`
  const feito = (a: Aviso): Resolucao | undefined => (a.situacao === 'concluido' ? 'feita' : undefined)

  for (const a of f.avisos) {
    if (a.tipo === 'risco') {
      itens.push({ ...base, id: `risco-${a.numero}`, tipo: 'risco', curto: 'Encaminhamento', titulo: `Encaminhamento de ${a.alunoNome ?? 'aluno'}: assunto delicado`,
        turmaId: a.turmaId, turma: a.turma, materia: materiaDa(a.turmaId), urgente: true, quando: horaDe(a.recebido), para: aviso(a), ordem: a.numero, ref: a.id, resolucao: feito(a) })
    } else if (a.tipo === 'aviso' && a.numero >= 31) {
      // o canal público (sem conta) diz de onde veio: quem avisou pode não ser aluno
      const semConta = a.origem === 'Canal da escola · sem conta'
      itens.push({ ...base, id: a.numero === 31 ? 'aviso-0031' : `aviso-${a.numero}`, tipo: 'aviso', curto: semConta ? 'Aviso sem conta' : 'Aviso de aluno', turma: a.turma ?? 'Sem conta',
        turmaId: a.turmaId, materia: materiaDa(a.turmaId), prazo: a.prazo, urgente: true, titulo: `Aviso ${a.numero} · responder ${a.prazo}`,
        detalhe: semConta ? `Canal da escola · sem conta · ${a.categoria}` : a.categoria, quando: horaDe(a.recebido), para: aviso(a), ordem: a.numero, ref: a.id, resolucao: feito(a) })
    } else if (a.tipo === 'titular' && a.numero >= 33) {
      itens.push({ ...base, id: `titular-${a.numero}`, tipo: 'titular', curto: 'Pedido sobre dados', turma: a.turma ?? 'Sem conta', prazo: a.prazo,
        turmaId: a.turmaId, materia: materiaDa(a.turmaId), titulo: `Pedido ${a.numero}: ${a.categoria.toLowerCase()}`, detalhe: a.origem, quando: a.recebido, para: aviso(a), ordem: a.numero, ref: a.id, resolucao: feito(a) })
    }
  }

  // a memória do Tutor contestada numa matéria que ninguém dá na turma: a coordenação responde
  for (const r of f.revisoes.filter((x) => x.tipo === 'memoria' && x.materia && daMateriaNaTurma(f.escola.alocacoes, x.turmaId, x.materia).length === 0)) {
    itens.push({
      ...base, id: `revisao-${r.id}`, tipo: 'revisao', curto: `${primeiro(r.alunoNome)} contestou a memória`,
      titulo: `${r.alunoNome} contestou a memória do Tutor · ${r.materia}`, detalhe: `${r.turma} não tem professor de ${r.materia} no Turmma`,
      turmaId: r.turmaId, turma: r.turma, materia: r.materia, quando: horaDe(r.quando), ordem: 0, ref: r.id,
      resolucao: r.estado === 'respondida' ? 'feita' : undefined,
    })
  }

  // pedidos de nome de turma SEM professor confirmado (decisão do dono: só aí a coordenação decide)
  const porTurma = new Map<string, number>()
  for (const p of f.pedidos) porTurma.set(p.turmaId, (porTurma.get(p.turmaId) ?? 0) + 1)
  for (const [turmaId, n] of porTurma) {
    const comProfessor = f.escola.alocacoes.some((a) => a.turmaId === turmaId && a.estado === 'confirmado')
    if (comProfessor) continue
    itens.push({ ...base, id: `pedidos-${turmaId}`, tipo: 'pedidos-nome', curto: n === 1 ? 'Pedido sem professor' : 'Pedidos sem professor', n,
      titulo: `${n} ${n === 1 ? 'aluno pediu' : 'alunos pediram'} para entrar · turma sem professor`, turmaId, turma: nomeTurma(turmaId),
      quando: '', para: `/coordenacao/escola/turmas/${turmaId}`, ordem: 0 })
  }

  // contestações de professor
  for (const a of f.escola.alocacoes.filter((x) => x.contestacao || x.estado === 'contestado')) {
    const nome = a.professor
    itens.push({ ...base, id: a.id === 'v6' ? 'contestacao-paulo' : `contestacao-${a.id}`, tipo: 'contestacao', curto: `${nome} contestou`,
      titulo: `${nome} diz que ${a.turma} · ${a.disciplina} não é a turma certa`, turma: a.turma, turmaId: a.turmaId, materia: a.disciplina,
      detalhe: a.contestacao?.complemento, quando: a.quando.replace(/^\D+/, ''), para: `/coordenacao/escola?aba=professores&prof=${a.professorId}`, ordem: 0, ref: a.id,
      resolucao: a.estado === 'contestado' ? undefined : 'feita' })
  }

  // alertas do Analista
  for (const a of ALERTAS) itens.push({ ...a, resolucao: f.ia.alertasVistos.includes(a.id) ? 'vista' : undefined })

  // material que não carregou
  const bio = f.escola.material.find((m) => m.id === 'bio')
  if (bio) itens.push({ ...base, id: 'material-bio', curto: 'Biologia 1 não carregou', tipo: 'material-falhou', titulo: 'Biologia 1 não carregou',
    detalhe: 'páginas 40 a 72 sem texto', quando: '', para: '/coordenacao/escola?aba=material', ordem: 0, ref: 'bio', resolucao: bio.estado === 'falhou' ? undefined : 'feita' })

  // convites vencidos
  for (const p of f.escola.professores.filter((x) => x.id === 'p-jonas' || x.estado === 'vencido')) {
    const primeiroNome = primeiro(p.nome)
    itens.push({ ...base, id: p.id === 'p-jonas' ? 'convite-jonas' : `convite-${p.id}`, tipo: 'convite', curto: `Convite do ${primeiroNome} venceu`,
      titulo: `O convite de ${p.nome} venceu`, detalhe: p.disciplina, quando: '17/09', para: `/coordenacao/escola?aba=professores&prof=${p.id}`, ordem: 0, ref: p.id,
      resolucao: p.estado === 'vencido' ? undefined : 'feita' })
  }
  return itens
}

function ordenar(itens: ItemFila[], papel: PapelFila): ItemFila[] {
  const ordem = papel === 'professor' ? ORDEM_PROFESSOR : ORDEM_COORDENACAO
  return [...itens].sort((a, b) =>
    Number(!!b.urgente) - Number(!!a.urgente)
    || Number(b.tipo === 'risco') - Number(a.tipo === 'risco')
    || Number(!!b.prazo) - Number(!!a.prazo)
    || (ordem[a.tipo] ?? 9) - (ordem[b.tipo] ?? 9)
    || a.ordem - b.ordem)
    .map((x, i) => ({ ...x, ordem: i + 1 }))
}

/** O último jeito de cada item (o painel ainda mostra o que acabou de ser resolvido, mesmo quando ele some do cálculo). */
const ULTIMOS = new Map<string, ItemFila>()

function useTodos(): { professor: Calculado[]; coordenacao: Calculado[] } {
  const prof = useProfessorAtual()
  const acesso = useEstadoAcesso()
  const escola = useEscolaEstado()
  const docs = useEstadoEnvios()
  const lotes = fatiaLotes.useValor()
  const revisoes = useRevisoes()
  const avisos = useEstadoAvisos().avisos
  const ia = useEstadoIA()
  return useMemo(() => {
    const pedidos = acesso.pedidos.filter((p) => p.estado === 'esperando')
    const f: Fontes = { prof, pedidos, escola, docs, lotes, revisoes, avisos, ia }
    const r = { professor: doProfessor(f), coordenacao: daCoordenacao(f) }
    for (const i of [...r.professor, ...r.coordenacao]) ULTIMOS.set(i.id, i)
    return r
  }, [prof, acesso, escola, docs, lotes, revisoes, avisos, ia])
}

/** Os itens que ainda esperam, na ordem: urgente, prazo e tipo. Com `turmaId`, só os daquela turma. */
export function useFila(papel: PapelFila, turmaId?: string): ItemFila[] {
  const todos = useTodos()
  const m = manuais.useValor()
  return useMemo(() => ordenar(
    todos[papel].filter((i) => !i.resolucao && !m[i.id] && (!turmaId || i.turmaId === turmaId)).map(({ resolucao, ...i }) => { void resolucao; return i }),
    papel,
  ), [todos, m, papel, turmaId])
}

/** Como o cartão aparece no Início: os pedidos do professor de turmas diferentes viram UM cartão, "Pedidos para entrar". */
function agrupar(itens: ItemFila[], papel: PapelFila): ItemFila[] {
  if (papel !== 'professor') return itens
  const pedidos = itens.filter((i) => i.tipo === 'pedidos')
  if (!pedidos.length) return itens
  const n = pedidos.reduce((s, i) => s + (i.n ?? 0), 0)
  const um = pedidos.length === 1 ? pedidos[0] : undefined
  const cartao: ItemFila = {
    id: 'pedidos', papel, tipo: 'pedidos', curto: 'Pedidos para entrar', n,
    titulo: `${n} ${n === 1 ? 'aluno pediu' : 'alunos pediram'} para entrar`,
    turma: um ? um.turma : `${pedidos.length} turmas`, turmaId: um?.turmaId, materia: um?.materia,
    quando: '', ordem: pedidos[0].ordem, subitens: pedidos, professorId: pedidos[0].professorId,
  }
  const primeiroIndice = itens.findIndex((i) => i.tipo === 'pedidos')
  const sem = itens.filter((i) => i.tipo !== 'pedidos')
  sem.splice(primeiroIndice, 0, cartao)
  ULTIMOS.set('pedidos', cartao)
  return sem
}

/** Os cartões do Início: como `useFila`, com os pedidos do professor agrupados num cartão só (`id: 'pedidos'`). */
export function useCartoesDaFila(papel: PapelFila): ItemFila[] {
  const itens = useFila(papel)
  return useMemo(() => agrupar(itens, papel), [itens, papel])
}

/** O tamanho da fila: é o contador do Início, na lateral e na barra de baixo (conta os cartões). */
export function useContagemFila(papel: PapelFila): number {
  return useCartoesDaFila(papel).length
}

/** Um item pelo id, resolvido ou não (o painel ainda mostra o que acabou de ser resolvido). Acha também `'pedidos'`. */
export function useItemFila(id: string | null): ItemFila | undefined {
  const todos = useTodos()
  const prof = useFila('professor')
  return useMemo(() => {
    if (!id) return undefined
    if (id === 'pedidos') return agrupar(prof, 'professor').find((i) => i.id === 'pedidos') ?? ULTIMOS.get('pedidos')
    const achado = [...todos.professor, ...todos.coordenacao].find((i) => i.id === id)
    if (achado) { const { resolucao, ...item } = achado; void resolucao; return item }
    return ULTIMOS.get(id)
  }, [id, todos, prof])
}

/** Como o item foi resolvido; `undefined` enquanto espera. Lê o estado de domínio e, depois, a marcação manual. */
export function useResolucao(id: string): Resolucao | undefined {
  const todos = useTodos()
  const m = manuais.useValor()
  return useMemo(() => {
    if (m[id]) return m[id]
    const achado = [...todos.professor, ...todos.coordenacao].find((i) => i.id === id)
    if (achado) return achado.resolucao
    return id && ULTIMOS.has(id) ? 'feita' : undefined
  }, [id, todos, m])
}

/* ── Marcações manuais e a ponte para as telas que ainda resolvem por id ──────────────────────────────── */

export const fila = {
  /** Resolve um item. Quando o item tem domínio, chama a ação de domínio (que registra o evento); senão, só marca. */
  resolver(id: string, como: Resolucao = 'feita') {
    if (id === 'notas-2b') { if (como === 'aprovada') acoesLotes.aprovar('prova-2b'); else if (como === 'recusada') acoesLotes.recusar('prova-2b', 'Recusada pela professora'); else marcar(id, como); return }
    if (id === 'turma-3a') { if (como === 'confirmada') acoesAlocacoes.confirmar('v4'); else if (como === 'contestada') acoesAlocacoes.contestar('v4', 'turma_errada'); else marcar(id, como); return }
    if (id === 'atencao-2b' && como === 'vista') { acoesAvisos.vistoPeloProfessor('N-2026-0032'); return }
    if (id === 'sinal-2b' && (como === 'vista' || como === 'contestada')) { acoesIA.marcarSinal('sinal-2b', como === 'vista' ? 'visto' : 'contestado'); return }
    if (id.startsWith('alerta-') && como === 'vista') { acoesIA.marcarAlertaVisto(id); return }
    if (id === 'adaptada-2b' && (como === 'aprovada' || como === 'recusada')) {
      if (como === 'aprovada') acoesEnvios.aprovarEEnviar({ docId: 'prova-estequiometria', versao: 'adaptada', titulo: 'Prova de estequiometria', tipo: 'prova', turmaId: '2b' })
      else acoesEnvios.recusar('prova-estequiometria', 'adaptada', 'Recusada pela professora')
      return
    }
    marcar(id, como)
  },
  /** Desfaz a marcação manual (e, na versão adaptada, volta a pedir a aprovação). */
  reabrir(id: string) {
    if (id === 'adaptada-2b') acoesEnvios.gerarAdaptada('prova-estequiometria')
    if (!(id in manuais.ler())) return
    manuais.mudar((m) => { const n = { ...m }; delete n[id]; return n })
  },
}

function marcar(id: string, como: Resolucao) {
  if (manuais.ler()[id] === como) return
  manuais.mudar((m) => ({ ...m, [id]: como }))
}

/** Leitura fora do React (um item pelo id, do jeito que apareceu por último ou no começo da demonstração). */
export const itemDaFila = (id: string): ItemFila | undefined => ULTIMOS.get(id) ?? EXEMPLOS.find((i) => i.id === id)

/* Os itens do começo da demonstração, para a prancha de Fundamentos (fora do React). */
const EXEMPLOS: ItemFila[] = [
  { id: 'atencao-2b', curto: 'Olívia precisa de atenção', papel: 'professor', tipo: 'atencao', de: 'tutor', urgente: true, titulo: 'Olívia Ramos precisa de atenção',
    turmaId: '2b', turma: '2ºB', materia: 'Química', detalhe: 'assunto pessoal; você não vê o texto', quando: '8h55', ordem: 1 },
  { id: 'notas-2b', curto: 'Notas da prova', n: 26, papel: 'professor', tipo: 'notas', de: 'assistente', titulo: 'Aprovar as notas da prova de mol e massa molar',
    turmaId: '2b', turma: '2ºB', materia: 'Química', detalhe: '26 provas, 5 para conferir', quando: '9h50', para: '/professor/aprovar/prova-2b', ordem: 2 },
  { id: 'aviso-0031', curto: 'Aviso de aluno', turma: '2ºB', prazo: 'até 23/09', papel: 'coordenacao', tipo: 'aviso', urgente: true, titulo: 'Aviso 31 · responder até 23/09',
    detalhe: 'Resposta da IA que pareceu errada', quando: '9h12', para: '/coordenacao/registros?aba=avisos&aviso=N-2026-0031', ordem: 1 },
  ...ALERTAS,
]
