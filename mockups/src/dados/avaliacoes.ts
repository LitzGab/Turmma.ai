import { useMemo } from 'react'
import { contaDeAluno, useContasDeAluno } from './acesso'
import { conversasDoAlunoAgora } from './conversas-aluno'
import { agora, criarFatia, registrar } from './demo/nucleo'
import { fatiaLotes, loteDaTarefa, type EntregaNoLote, type Lote } from './demo/lotes-base'
import { fatiaSessao } from './demo/sessao-base'
import { lerEnvios, useEstadoEnvios, type Envio } from './envios'
import { useTemQuemRecebeRisco } from './escola-estado'
import { useTutorPausado } from './ia'
import { bancoDaTarefa, corrigir, GABARITO_MOL_TROCADO, LETRAS } from './questoes'
import { LUCAS, professorDaSessao, useAlunoAtual, useVistos, type AlunoAtual } from './sessao'
import { TAREFAS_ALUNO, type Devolutiva, type MateriaAluno, type TarefaAluno } from './tarefas-aluno'

export type { Destaque, EntregaNoLote, Lote, EstadoLote } from './demo/lotes-base'

/* O TRABALHO DO ALUNO E A NOTA (12ª rodada, 04/10/2026; plano de polimento, seção 4.2 e fluxos F2, F3, F4, F11).

   · As RESPOSTAS de cada aluno em cada tarefa ("Salvo" a cada toque), a ENTREGA, a leitura marcada e as SAÍDAS da
     aba durante a prova (só o professor vê; D70);
   · as TAREFAS do aluno, VIVAS: as de sempre do Lucas (dados/tarefas-aluno.ts) mais as que a professora aprovou e
     enviou à turma dele (dados/envios.ts), com o estado (pra fazer, aberta, abre terça, entregue, corrigida), o
     progresso que tem fim ("3 de 8") e o selo NOVO, que some ao abrir;
   · os LOTES de notas: o de 26 da prova de 18/09 (dados/demo/lotes-base.ts) e um por tarefa entregue na
     demonstração ("lote-<tarefa>"), com as respostas, os acertos pelo gabarito e o recado em modelo. A nota só chega
     ao aluno depois que a professora APROVA (regra 70; D56);
   · as REVISÕES que o aluno pede ("Isso está errado?"), da nota ou da memória do Tutor, e a resposta da professora;
   · se o Tutor está TRAVADO para o aluno: na prova aberta "agora", pausado pela escola ou sem ninguém que receba o
     encaminhamento de risco à vida (D78). */

/* ── Estado ────────────────────────────────────────────────────────────────────────────────────────────── */

export type Revisao = {
  id: string
  tipo: 'nota' | 'memoria'
  alunoId: string
  alunoNome: string
  turmaId: string
  turma: string
  /** nota: a tarefa e a questão (índice) */
  tarefaId?: string
  tarefaTitulo?: string
  questao?: number
  marcou?: string
  certa?: string
  /** memória: o item contestado (id e a frase) */
  itemId?: string
  itemTexto?: string
  /** memória: a matéria do item (a contestação vai a quem dá essa matéria na turma; sem ninguém, à coordenação) */
  materia?: string
  motivo: string
  texto?: string
  quando: string
  estado: 'esperando' | 'respondida'
  resposta?: { decisao: 'manter' | 'mudar' | 'apagar'; motivo: string; por: string; quando: string }
}

type EstadoAvaliacoes = {
  /** "aluno:tarefa" → índice → letra */
  respostas: Record<string, Record<number, string>>
  /** "aluno:tarefa" → quando entregou */
  entregas: Record<string, string>
  /** "aluno:tarefa" → quando leu */
  lidas: Record<string, string>
  /** "aluno:tarefa" → quantas vezes saiu da aba da prova */
  saidas: Record<string, number>
  revisoes: Revisao[]
}

const fatia = criarFatia<EstadoAvaliacoes>('avaliacoes', { respostas: {}, entregas: {}, lidas: {}, saidas: {}, revisoes: [] })

const chave = (alunoId: string, tarefaId: string) => `${alunoId}:${tarefaId}`

function alunoPorId(id: string): AlunoAtual {
  if (id === 'lucas') return LUCAS
  const c = contaDeAluno(id)
  return c ? { id: c.id, nome: c.nome, primeiro: c.primeiro, iniciais: c.iniciais, turmaId: c.turmaId, turma: c.turma, serie: c.serie, escola: c.escola, matricula: c.matricula, novo: true } : LUCAS
}

/* ── As tarefas vivas ──────────────────────────────────────────────────────────────────────────────────── */

export type EstadoVivo = 'pra-fazer' | 'atrasada' | 'aberta' | 'abre-em' | 'entregue' | 'corrigida'

export type ResultadoTarefa = {
  acertos: number
  total: number
  certo: boolean[]
  /** letras maiúsculas */
  gabarito: string[]
  respostas: Record<number, string>
  recado: Devolutiva
  /** a questão em que a professora mudou a nota, quando mudou */
  mudada?: number
}

export type TarefaViva = TarefaAluno & {
  estadoVivo: EstadoVivo
  /** o texto do selo (a caixa alta vem do CSS): "Até quinta", "Abre agora", "Terça 7h30", "Ainda dá", "A professora está vendo", "Corrigida" */
  selo: string
  seloFamilia: 'neutro' | 'amarelo' | 'verde' | 'azul'
  /** o progresso que tem fim: questões respondidas de quantas */
  progresso: { feitas: number; total: number }
  /** a novidade ainda não foi aberta */
  novo: boolean
  /** a chave para `sessao.marcarVisto(chaveNovo)` ao abrir ('' quando não há novidade) */
  chaveNovo: string
  /** chegou por um envio da professora */
  envio?: Envio
  loteId?: string
  resultado?: ResultadoTarefa
  /** a revisão mais recente que o aluno pediu nesta tarefa */
  revisao?: Revisao
  /** a prova enviada "na próxima aula": quando abre */
  abre?: { rotulo: string; selo: string }
}

const seloDoPrazo = (prazo: string) => {
  const m = prazo.match(/^até ([a-zçáéíóú-]+)/i)
  return m ? `Até ${m[1]}` : prazo
}

const tratamento = (por?: string) => (por ? `Prof. ${por.split(' ')[0]}` : 'Prof. Camila')

/** O recado em modelo, escrito pelo Assistente (a professora aprova junto com a nota). */
export function recadoEmModelo(acertos: number, total: number, erradas: number[], paginas: number[]): string {
  if (!erradas.length) return `Você acertou ${acertos} de ${total}. Acertou todas: siga assim.`
  const qs = erradas.map((i) => i + 1)
  const lista = qs.length === 1 ? `na questão ${qs[0]}` : `nas questões ${qs.slice(0, -1).join(', ')} e ${qs[qs.length - 1]}`
  // as páginas das erradas, sem repetir, na ordem das questões
  const pags = [...new Set(erradas.map((i) => paginas[i] ?? 145))]
  const onde = pags.length === 1 ? `a página ${pags[0]}` : `as páginas ${pags.slice(0, -1).join(', ')} e ${pags[pags.length - 1]}`
  return `Você acertou ${acertos} de ${total}. Errou ${lista}: confira ${onde}.`
}

function resultadoDoLote(lote: Lote, respostas: Record<number, string>, tarefaId: string, tipo?: string): ResultadoTarefa {
  const banco = bancoDaTarefa(tarefaId, tipo)
  const gab = lote.gabarito
  const c = corrigir(respostas, gab)
  return {
    acertos: c.acertos, total: c.total, certo: c.certo, gabarito: gab.split(''), respostas,
    recado: {
      texto: recadoEmModelo(c.acertos, c.total, c.erradas, banco.questoes.map((q) => q.pagina)),
      autor: 'tutor', aprovadoPor: tratamento(lote.por), quando: lote.quando ?? '',
    },
  }
}

function aplicarRevisao(r: ResultadoTarefa, rev?: Revisao): ResultadoTarefa {
  if (!rev || rev.tipo !== 'nota' || rev.resposta?.decisao !== 'mudar' || rev.questao === undefined || r.certo[rev.questao]) return r
  const certo = r.certo.map((x, i) => (i === rev.questao ? true : x))
  return { ...r, certo, acertos: r.acertos + 1, mudada: rev.questao }
}

type Fontes = {
  est: EstadoAvaliacoes
  lotes: Record<string, Lote>
  envios: Envio[]
  vistos: Record<string, true>
}

function montarTarefas(aluno: AlunoAtual, { est, lotes, envios, vistos }: Fontes): TarefaViva[] {
  const revDe = (tarefaId: string) => [...est.revisoes].reverse().find((r) => r.alunoId === aluno.id && r.tarefaId === tarefaId)
  const lista: TarefaViva[] = []

  // 1. as de sempre: só o Lucas tem (aluno novo começa sem tarefa, R8)
  if (aluno.id === 'lucas') {
    for (const t of TAREFAS_ALUNO) {
      const k = chave(aluno.id, t.id)
      const respostas = est.respostas[k] ?? t.respostas ?? {}
      const loteId = t.loteId ?? (lotes[loteDaTarefa(t.id)] ? loteDaTarefa(t.id) : undefined)
      const lote = loteId ? lotes[loteId] : undefined
      const leu = !!est.lidas[k]
      const entregou = !!est.entregas[k] || t.estado === 'entregue' || t.estado === 'corrigida' || leu
      const aprovadoAgora = lote?.estado === 'aprovado'
      const corrigida = t.estado === 'corrigida' || aprovadoAgora
      const rev = revDe(t.id)
      let resultado: ResultadoTarefa | undefined
      if (aprovadoAgora && lote) {
        const minha = lote.entregas.find((x) => x.alunoId === aluno.id)
        resultado = resultadoDoLote(lote, minha?.respostas ?? respostas, t.id, t.tipo)
      } else if (t.estado === 'corrigida' && t.devolutiva && t.gabarito && t.certo) {
        resultado = { acertos: t.acertos ?? 0, total: t.total ?? t.questoes, certo: t.certo, gabarito: t.gabarito, respostas, recado: t.devolutiva }
      }
      if (resultado) resultado = aplicarRevisao(resultado, rev)
      const estadoVivo: EstadoVivo = corrigida ? 'corrigida' : entregou ? 'entregue' : t.estado === 'atrasada' ? 'atrasada' : 'pra-fazer'
      const chaveNovo = rev?.resposta ? `tarefa:${t.id}:revisao-${rev.id}` : aprovadoAgora ? `tarefa:${t.id}:corrigida` : ''
      lista.push({
        ...t, estado: estadoVivo === 'corrigida' ? 'corrigida' : estadoVivo === 'entregue' ? 'entregue' : t.estado,
        respostas, feitas: Object.keys(respostas).length,
        estadoVivo,
        selo: estadoVivo === 'corrigida' ? 'Corrigida' : estadoVivo === 'entregue' ? (t.tipo === 'leitura' ? 'Lida' : 'A professora está vendo') : estadoVivo === 'atrasada' ? 'Ainda dá' : seloDoPrazo(t.prazo),
        seloFamilia: estadoVivo === 'corrigida' ? 'verde' : estadoVivo === 'entregue' ? (t.tipo === 'leitura' ? 'verde' : 'amarelo') : 'neutro',
        progresso: { feitas: Object.keys(respostas).length, total: t.questoes },
        novo: !!chaveNovo && !vistos[chaveNovo], chaveNovo,
        loteId, resultado, revisao: rev,
        prazo: est.entregas[k] ? `entregue em ${est.entregas[k].split(',')[0]}` : t.prazo,
      })
    }
  }

  // 2. as que chegaram pelo envio da professora (a adaptada vai só para quem tem adaptação)
  const meus = envios.filter((e) => e.turmaId === aluno.turmaId && (e.para === 'turma' || e.para.includes(aluno.nome)))
  const porDoc = new Map<string, Envio>()
  for (const e of meus) {
    const ja = porDoc.get(e.docId)
    if (!ja || (e.versao === 'adaptada' && e.para !== 'turma')) porDoc.set(e.docId, e)
  }
  let ordem = -100
  for (const e of [...porDoc.values()].sort((a, b) => b.em.ordem - a.em.ordem)) {
    const k = chave(aluno.id, e.docId)
    const respostas = est.respostas[k] ?? {}
    const lote = lotes[loteDaTarefa(e.docId)]
    const entregou = !!est.entregas[k] || !!est.lidas[k]
    const minha = lote?.entregas.find((x) => x.alunoId === aluno.id)
    const corrigida = entregou && lote?.estado === 'aprovado' && !!minha
    const rev = revDe(e.docId)
    const tipo: TarefaAluno['tipo'] = e.tipo === 'prova' ? 'prova' : e.tipo === 'leitura' ? 'leitura' : 'lista'
    const abreDepois = e.quando === 'proxima' && !!e.abre
    const estadoVivo: EstadoVivo = corrigida ? 'corrigida' : entregou ? 'entregue' : abreDepois ? 'abre-em' : tipo === 'prova' ? 'aberta' : 'pra-fazer'
    let resultado = corrigida && lote && minha ? resultadoDoLote(lote, minha.respostas, e.docId, e.tipo) : undefined
    if (resultado) resultado = aplicarRevisao(resultado, rev)
    const chaveNovo = rev?.resposta ? `tarefa:${e.docId}:revisao-${rev.id}` : corrigida ? `tarefa:${e.docId}:corrigida` : `tarefa:${e.docId}:enviada`
    const prazo = abreDepois ? `abre ${e.abre!.rotulo}` : tipo === 'prova' ? 'abre agora' : 'até quinta, 24/09'
    lista.push({
      id: e.docId, tipo, materia: (e.materia as MateriaAluno) ?? 'Química', titulo: e.titulo,
      prazo: est.entregas[k] ? `entregue em ${est.entregas[k].split(',')[0]}` : prazo,
      estado: corrigida ? 'corrigida' : entregou ? 'entregue' : 'pra-fazer',
      questoes: e.questoes, feitas: Object.keys(respostas).length, ordem: ordem++, minutos: tipo === 'prova' ? 50 : undefined,
      banco: 'estequiometria', questoesId: bancoDaTarefa(e.docId, e.tipo).id, respostas,
      estadoVivo,
      selo: corrigida ? 'Corrigida' : entregou ? 'A professora está vendo' : abreDepois ? e.abre!.selo : tipo === 'prova' ? 'Abre agora' : 'Até quinta',
      seloFamilia: corrigida ? 'verde' : entregou ? 'amarelo' : 'neutro',
      progresso: { feitas: Object.keys(respostas).length, total: e.questoes },
      novo: !vistos[chaveNovo], chaveNovo, envio: e, loteId: lote ? loteDaTarefa(e.docId) : undefined, resultado, revisao: rev,
      abre: abreDepois ? e.abre : undefined,
    })
  }
  return lista.sort((a, b) => a.ordem - b.ordem)
}

const ATIVA: EstadoVivo[] = ['pra-fazer', 'atrasada', 'aberta', 'abre-em']
/** Pra fazer: o que ainda não foi entregue (o que chegou agora vem primeiro). */
export const praFazer = (l: TarefaViva[]) => l.filter((t) => ATIVA.includes(t.estadoVivo))
/** Feitas: entregues (a professora está vendo) e corrigidas. */
export const feitas = (l: TarefaViva[]) => l.filter((t) => !ATIVA.includes(t.estadoVivo))

/** As tarefas do aluno (o da sessão, quando não passado), vivas. */
export function useTarefasDoAluno(alunoId?: string): TarefaViva[] {
  const atual = useAlunoAtual()
  const contas = useContasDeAluno()
  const est = fatia.useValor()
  const lotes = fatiaLotes.useValor()
  const env = useEstadoEnvios()
  const vistos = useVistos()
  return useMemo(() => {
    void contas
    const aluno = alunoId ? alunoPorId(alunoId) : atual
    return montarTarefas(aluno, { est, lotes, envios: env.envios, vistos })
  }, [alunoId, atual, contas, est, lotes, env, vistos])
}

/** Uma tarefa do aluno da sessão pelo id. */
export function useTarefa(id: string | undefined): TarefaViva | undefined {
  const todas = useTarefasDoAluno()
  return id ? todas.find((t) => t.id === id) : undefined
}

/** Uma tarefa viva fora do React (para as ações). */
function tarefaAgora(alunoId: string, tarefaId: string): TarefaViva | undefined {
  return montarTarefas(alunoPorId(alunoId), { est: fatia.ler(), lotes: fatiaLotes.ler(), envios: lerEnvios().envios, vistos: {} }).find((t) => t.id === tarefaId)
}

/* ── Ações do aluno ────────────────────────────────────────────────────────────────────────────────────── */

const sessaoAluno = () => fatiaSessao.ler().alunoId

export const avaliacoes = {
  /** Marca a resposta de uma questão (letra A a D). Fica salva na hora. */
  responder(tarefaId: string, questao: number, letra: string, alunoId = sessaoAluno()) {
    const k = chave(alunoId, tarefaId)
    if (fatia.ler().entregas[k]) return
    const t = tarefaAgora(alunoId, tarefaId)
    const antes = fatia.ler().respostas[k] ?? t?.respostas ?? {}
    if (antes[questao] === letra.toUpperCase()) return
    fatia.mudar((e) => ({ ...e, respostas: { ...e.respostas, [k]: { ...antes, [questao]: letra.toUpperCase() } } }))
    registrar('tarefa-respondida', { tarefaId, questao, alunoId })
  },
  /** Entrega a tarefa: a nota vai para a professora aprovar (o lote "Notas da …"). */
  entregar(tarefaId: string, alunoId = sessaoAluno()) {
    const k = chave(alunoId, tarefaId)
    if (fatia.ler().entregas[k]) return
    const aluno = alunoPorId(alunoId)
    const t = tarefaAgora(alunoId, tarefaId)
    const respostas = fatia.ler().respostas[k] ?? t?.respostas ?? {}
    const ev = registrar('tarefa-entregue', { tarefaId, alunoId, titulo: t?.titulo, turma: aluno.turma }, { nome: aluno.nome, papel: 'aluno' })
    fatia.mudar((e) => ({ ...e, entregas: { ...e.entregas, [k]: ev.quando.rotulo } }))
    if (t?.tipo === 'leitura') return
    // o lote da tarefa: cria ou acrescenta a entrega, corrigida pelo gabarito
    const loteId = loteDaTarefa(tarefaId)
    const banco = bancoDaTarefa(tarefaId, t?.tipo)
    const c = corrigir(respostas, banco.gabarito)
    const entrega: EntregaNoLote = {
      alunoId, nome: aluno.nome, respostas, acertos: c.acertos, total: c.total,
      saidas: fatia.ler().saidas[k] ?? 0,
      recado: recadoEmModelo(c.acertos, c.total, c.erradas, banco.questoes.map((q) => q.pagina)),
      quando: ev.quando.rotulo,
    }
    fatiaLotes.mudar((l) => {
      const antes = l[loteId]
      const lote: Lote = antes
        ? { ...antes, estado: 'espera', por: undefined, quando: undefined, entregas: [...antes.entregas.filter((x) => x.alunoId !== alunoId), entrega] }
        : {
          id: loteId, tarefaId, turmaId: aluno.turmaId, turma: aluno.turma, materia: t?.materia ?? 'Química',
          titulo: t?.titulo ?? banco.titulo, tipo: t?.tipo === 'prova' ? 'prova' : 'lista', data: ev.quando.dia, questoes: banco.questoes.length,
          gabarito: banco.gabarito, destaques: [], vistos: [], outras: [], entregas: [entrega], tirados: [], estado: 'espera',
        }
      return { ...l, [loteId]: lote }
    })
  },
  /** A leitura marcada como lida. */
  marcarLida(tarefaId: string, alunoId = sessaoAluno()) {
    const k = chave(alunoId, tarefaId)
    if (fatia.ler().lidas[k]) return
    const ev = registrar('leitura-feita', { tarefaId, alunoId })
    fatia.mudar((e) => ({ ...e, lidas: { ...e.lidas, [k]: ev.quando.rotulo } }))
  },
  /** Saiu da aba durante a prova: conta, e só o professor vê (D70). */
  saiuDaProva(tarefaId: string, alunoId = sessaoAluno()) {
    const k = chave(alunoId, tarefaId)
    fatia.mudar((e) => ({ ...e, saidas: { ...e.saidas, [k]: (e.saidas[k] ?? 0) + 1 } }))
    registrar('prova-saida', { tarefaId, alunoId })
  },
}

/** Quantas vezes o aluno saiu da aba numa prova. */
export function useSaidas(tarefaId: string, alunoId?: string): number {
  const s = fatiaSessao.useValor()
  return fatia.useValor().saidas[chave(alunoId ?? s.alunoId, tarefaId)] ?? 0
}

/* ── Lotes de notas ────────────────────────────────────────────────────────────────────────────────────── */

/** Quantas notas um lote tem (o de 26 conta os destaques e as outras, menos quem foi tirado). */
export const notasDoLote = (l: Lote) => l.destaques.length + l.outras.length + l.entregas.length - l.tirados.length

/** Os lotes (de uma turma, quando passada), do mais novo para o mais velho. */
export function useLotes(turmaId?: string): Lote[] {
  const l = fatiaLotes.useValor()
  return useMemo(() => Object.values(l).filter((x) => !turmaId || x.turmaId === turmaId), [l, turmaId])
}

export function useLote(id: string | undefined): Lote | undefined {
  const l = fatiaLotes.useValor()
  return id ? l[id] : undefined
}

export const lerLotes = () => fatiaLotes.ler()

function mudarLote(id: string, f: (l: Lote) => Lote) {
  fatiaLotes.mudar((x) => (x[id] ? { ...x, [id]: f(x[id]) } : x))
}

export const lotes = {
  /** A professora abriu um destaque (o botão de aprovar só acende depois de todos). */
  verDestaque(loteId: string, destaqueId: string) {
    mudarLote(loteId, (l) => (l.vistos.includes(destaqueId) ? l : { ...l, vistos: [...l.vistos, destaqueId] }))
  },
  /** Troca o gabarito (na prova de 18/09, a questão 7 passa de a para c) e o Assistente refaz as notas. */
  trocarGabarito(loteId: string, gabarito?: string) {
    mudarLote(loteId, (l) => ({ ...l, gabaritoTrocado: true, gabarito: (gabarito ?? (loteId === 'prova-2b' ? GABARITO_MOL_TROCADO : l.gabarito)).toUpperCase() }))
  },
  /** Tira um aluno do lote (vai refazer): a nota dele não sai agora. */
  tirar(loteId: string, nome: string) {
    mudarLote(loteId, (l) => (l.tirados.includes(nome) ? l : { ...l, tirados: [...l.tirados, nome] }))
  },
  /** Aprova as notas: elas chegam aos alunos, com o recado, e entram na média. */
  aprovar(loteId: string) {
    const l = fatiaLotes.ler()[loteId]
    if (!l || l.estado === 'aprovado') return
    const prof = professorDaSessao()
    const ev = registrar('notas-aprovadas', { loteId, titulo: l.titulo, tipo: l.tipo, n: notasDoLote(l), turma: l.turma, turmaId: l.turmaId }, { nome: prof.nome, papel: 'professor' })
    mudarLote(loteId, (x) => ({ ...x, estado: 'aprovado', por: prof.nome, quando: ev.quando.rotulo, motivo: undefined }))
  },
  recusar(loteId: string, motivo: string) {
    const l = fatiaLotes.ler()[loteId]
    if (!l) return
    const prof = professorDaSessao()
    const ev = registrar('notas-recusadas', { loteId, titulo: l.titulo, tipo: l.tipo, n: notasDoLote(l), turma: l.turma, turmaId: l.turmaId, motivo }, { nome: prof.nome, papel: 'professor' })
    mudarLote(loteId, (x) => ({ ...x, estado: 'recusado', por: prof.nome, quando: ev.quando.rotulo, motivo }))
  },
}

/* ── Revisões ("Isso está errado?") ────────────────────────────────────────────────────────────────────── */

/** As revisões pedidas (todas, ou só as de um aluno, ou de umas turmas, ou num estado). */
export function useRevisoes(filtro?: { alunoId?: string; turmaIds?: string[]; estado?: Revisao['estado'] }): Revisao[] {
  const est = fatia.useValor()
  const alunoId = filtro?.alunoId, estado = filtro?.estado
  const turmas = filtro?.turmaIds?.join(',')
  return useMemo(() => est.revisoes.filter((r) => (!alunoId || r.alunoId === alunoId) && (!estado || r.estado === estado)
    && (turmas === undefined || turmas.split(',').includes(r.turmaId))), [est, alunoId, estado, turmas])
}

export function useRevisao(id: string | undefined): Revisao | undefined {
  const est = fatia.useValor()
  return id ? est.revisoes.find((r) => r.id === id) : undefined
}

/** Os itens da memória do Tutor que a professora apagou depois da contestação do aluno. */
export function useItensMemoriaApagados(alunoId?: string): string[] {
  const s = fatiaSessao.useValor()
  const est = fatia.useValor()
  const id = alunoId ?? s.alunoId
  return useMemo(() => est.revisoes.filter((r) => r.alunoId === id && r.tipo === 'memoria' && r.resposta?.decisao === 'apagar' && r.itemId).map((r) => r.itemId!), [est, id])
}

export const lerRevisoes = () => fatia.ler().revisoes

/* ── O arquivo do pedido de dados (LGPD, art. 18 — lei) ──────────────────────────────────────────────────
   UMA montagem só, para o arquivo que a coordenação baixa (Registros › Avisos e pedidos) e o que o aluno baixa
   (Eu › Privacidade › Seus pedidos) serem o MESMO: o aluno, as tarefas, as conversas com o Tutor e o que o Tutor
   lembra (sem os itens apagados), e a mesma lista do que não temos. As frases da memória são as de
   `aluno/Privacidade.tsx` (listas fechadas: travou em… e terminou…). */

/** O que o Tutor lembra do Lucas: uma frase por conversa, montada só de campos fixos. */
export const MEMORIA_DO_TUTOR: { id: string; quando: string; materia: string; assunto: string; frase: string }[] = [
  { id: 's4', quando: 'Ontem', materia: 'Matemática', assunto: 'Frações equivalentes', frase: 'Travou em achar o número que divide os dois e depois acertou.' },
  { id: 's3', quando: '18/09', materia: 'Química', assunto: 'Reagente limitante', frase: 'Travou em achar o reagente limitante e a aula acabou antes.' },
  { id: 's2', quando: '18/09', materia: 'História', assunto: 'Revolução Francesa', frase: 'Travou em separar as causas da revolução e terminou com uma dica.' },
  { id: 's1', quando: '16/09', materia: 'Química', assunto: 'Massa molar', frase: 'Travou em passar massa para mol e depois acertou.' },
]

/** O que o Turmma não tem do aluno (a mesma lista nos dois arquivos). */
export const O_QUE_NAO_TEMOS = ['e-mail', 'telefone', 'foto', 'endereço', 'data de nascimento', 'dados de saúde']

/** O arquivo do pedido de dados de um aluno com conta, como JSON. Fora do React: lê o estado na hora. */
export function arquivoDoAluno(alunoId: string, pedido: { numero: number; atendidoEm?: string }): string {
  const aluno = alunoPorId(alunoId)
  const tarefas = montarTarefas(aluno, { est: fatia.ler(), lotes: fatiaLotes.ler(), envios: lerEnvios().envios, vistos: {} })
  const apagados = fatia.ler().revisoes.filter((r) => r.alunoId === alunoId && r.tipo === 'memoria' && r.resposta?.decisao === 'apagar' && r.itemId).map((r) => r.itemId!)
  return JSON.stringify({
    pedido: `Pedido ${pedido.numero}`,
    atendidoEm: pedido.atendidoEm,
    escola: aluno.escola,
    aluno: { nome: aluno.nome, matricula: aluno.matricula, turma: aluno.turma, serie: aluno.serie },
    tarefas: tarefas.map((t) => ({ titulo: t.titulo, materia: t.materia, situacao: t.selo, ...(t.resultado ? { nota: `${t.resultado.acertos} de ${t.resultado.total}` } : {}) })),
    // a conversa de hoje (mol) abre com 2 falas desenhadas antes de guardar; conversa sem fala não é dado guardado
    conversasComOTutor: conversasDoAlunoAgora(alunoId)
      .map((c) => ({ titulo: c.titulo, materia: c.materia, quando: c.quando, falas: c.trocas.length || (c.id === 'mol' ? 2 : 0) }))
      .filter((c) => c.falas > 0),
    oQueOTutorLembra: aluno.novo ? [] : MEMORIA_DO_TUTOR.filter((m) => !apagados.includes(m.id)).map((m) => `${m.quando} · ${m.materia} · ${m.assunto}: ${m.frase}`),
    oQueNaoTemos: O_QUE_NAO_TEMOS,
  }, null, 2)
}

export const revisoes = {
  /** O aluno pede revisão: de uma questão da nota, ou de um item da memória do Tutor. Devolve o id. */
  pedir({ tipo, tarefaId, questao, itemId, itemTexto, materia, motivo, texto }: {
    tipo: 'nota' | 'memoria'; tarefaId?: string; questao?: number; itemId?: string; itemTexto?: string; materia?: string; motivo: string; texto?: string
  }): string {
    const aluno = alunoPorId(sessaoAluno())
    const t = tarefaId ? tarefaAgora(aluno.id, tarefaId) : undefined
    const banco = tarefaId ? bancoDaTarefa(tarefaId, t?.tipo) : undefined
    const resp = t?.resultado?.respostas ?? t?.respostas ?? {}
    const id = `r${fatia.ler().revisoes.length + 1}`
    const ev = registrar('revisao-pedida', { id, tipo, tarefaId, questao, turma: aluno.turma }, { nome: aluno.nome, papel: 'aluno' })
    const r: Revisao = {
      id, tipo, alunoId: aluno.id, alunoNome: aluno.nome, turmaId: aluno.turmaId, turma: aluno.turma,
      tarefaId, tarefaTitulo: t?.titulo, questao,
      marcou: questao !== undefined ? resp[questao] : undefined,
      certa: questao !== undefined && banco ? (t?.resultado?.gabarito[questao] ?? LETRAS[banco.questoes[questao]?.certa ?? 0]) : undefined,
      itemId, itemTexto, materia: materia ?? t?.materia, motivo, texto: texto?.trim() || undefined, quando: ev.quando.rotulo, estado: 'esperando',
    }
    fatia.mudar((e) => ({ ...e, revisoes: [...e.revisoes, r] }))
    return id
  },
  /** A professora responde, sempre com um motivo curto ("O que o Lucas vai ler"). */
  responder(id: string, decisao: 'manter' | 'mudar' | 'apagar', motivo: string, quem?: { nome: string; papel: 'coordenacao' }) {
    const r = fatia.ler().revisoes.find((x) => x.id === id)
    if (!r || r.estado === 'respondida') return
    const prof = quem ?? { nome: professorDaSessao().nome, papel: 'professor' as const }
    const ev = registrar('revisao-respondida', { id, decisao, motivo, turma: r.turma, tipo: r.tipo }, prof)
    fatia.mudar((e) => ({
      ...e, revisoes: e.revisoes.map((x) => (x.id === id ? { ...x, estado: 'respondida', resposta: { decisao, motivo: motivo.trim(), por: prof.nome, quando: ev.quando.rotulo } } : x)),
    }))
  },
}

/* ── O Tutor travado ───────────────────────────────────────────────────────────────────────────────────── */

export type TutorTravado = null | { motivo: 'prova'; tarefaId: string } | { motivo: 'pausado' } | { motivo: 'sem-responsavel' }

/** Por que o Tutor não atende agora: a prova aberta "agora" e não entregue, a escola pausou, ou ninguém recebe o
    encaminhamento de risco à vida (sem isso, o Tutor fica desligado). null quando atende. */
export function useTutorTravado(alunoId?: string): TutorTravado {
  const atual = useAlunoAtual()
  const env = useEstadoEnvios()
  const est = fatia.useValor()
  const pausa = useTutorPausado()
  const temRisco = useTemQuemRecebeRisco()
  return useMemo(() => {
    const aluno = alunoId ? alunoPorId(alunoId) : atual
    const prova = env.envios.find((e) => e.tipo === 'prova' && e.quando === 'agora' && e.turmaId === aluno.turmaId
      && (e.para === 'turma' || e.para.includes(aluno.nome)) && !est.entregas[chave(aluno.id, e.docId)])
    // a pausa da escola vem antes da prova: quem apresenta a pausa precisa vê-la mesmo com uma prova aberta
    if (pausa) return { motivo: 'pausado' }
    if (prova) return { motivo: 'prova', tarefaId: prova.docId }
    if (!temRisco) return { motivo: 'sem-responsavel' }
    return null
  }, [alunoId, atual, env, est, pausa, temRisco])
}

/** O agora (para quem precisa do carimbo fora de um evento). */
export const agoraRotulo = () => agora().rotulo
