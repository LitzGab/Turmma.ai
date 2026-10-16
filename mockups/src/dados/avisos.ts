import { useMemo } from 'react'
import { agora, criarFatia, registrar } from './demo/nucleo'
import { fatiaSessao } from './demo/sessao-base'
import { alunoDaSessao, LUCAS } from './sessao'
import { TRECHO_TUTOR_ASSUNTO_DELICADO } from './mensagens-time'
import { conversasAluno, respostaParaAvisar } from './conversas-aluno'
import { arquivoDoAluno, O_QUE_NAO_TEMOS } from './avaliacoes'

/* O CANAL DA ESCOLA (12ª rodada, 04/10/2026; plano de polimento, seção 4.2 e fluxos F5, F6, F7, F14).

   Tudo o que chega à coordenação por um canal de pessoa para pessoa, num lugar só (antes, a memória de
   `coordenacao/Denuncias.tsx`):
   · AVISO: o "Avisar um adulto" do aluno (também de dentro da prova) e o canal público da escola, sem conta
     (ECA Digital, art. 28 — lei). Quem lê é a orientação; no toque "O Tutor disse algo errado", a coordenação, que
     pode ver o trecho e RETIRAR o conteúdo (ECA Digital, arts. 29 e 30 — lei);
   · RISCO: o assunto delicado na conversa do Tutor vira encaminhamento à orientação (Lei 13.819/2019, art. 6º — lei),
     só para quem tem a atribuição "Recebe risco à vida" (D78). O professor recebe um sinal SEM o texto;
   · TITULAR: o pedido de dados do aluno ou da família (LGPD, art. 18 — lei), com prazo de 15 dias.
   A numeração é curta e segue: 31, 32, 33 já existem; os da demonstração são 34, 35, 36…
   "Responder e concluir" pede o texto que quem avisou vai ler: a escola não conclui sem responder (ECA Digital,
   art. 29 — lei). Os 5 avisos iniciais são COPIADOS de `coordenacao/Denuncias.tsx`. */

export type TipoAviso = 'aviso' | 'risco' | 'titular'
export type SituacaoAviso = 'aberto' | 'analise' | 'concluido'
export type Passo = { quando: string; oQue: string }
export type OQueTitular = 'ver' | 'corrigir' | 'apagar' | 'levar'
export const ROTULO_TITULAR: Record<OQueTitular, string> = { ver: 'Ver os dados', corrigir: 'Corrigir algo', apagar: 'Apagar os dados', levar: 'Levar os dados' }

export type Aviso = {
  /** "N-2026-0031" */
  id: string
  /** 31 (o número curto que quem avisou vê) */
  numero: number
  tipo: TipoAviso
  /** "Avisar um adulto · aluno do 2ºB", "Canal da escola · sem conta", "Tutor · assunto delicado" */
  origem: string
  categoria: string
  recebido: string
  /** "até 23/09" */
  prazo: string
  analise: 'humana' | 'automatizada'
  situacao: SituacaoAviso
  /** o que foi escrito (ou o que o sistema apontou) */
  apontado: string
  feito: Passo[]
  /** o id do item na fila do Início, quando há (os de sempre) */
  filaId?: string
  trecho?: { quem: string; texto: string }[]
  /** de onde veio o trecho: a conversa do aluno e a fala do Tutor (para "Retirar o conteúdo" tirar a fala de lá) */
  conversa?: { alunoId: string; conversaId: string; indice: number }
  /** quem avisou, quando é aluno com conta */
  alunoId?: string
  alunoNome?: string
  turmaId?: string
  turma?: string
  /** o toque escolhido no Avisar ("tratou-mal", "assustou", "tutor-errado", "outra") */
  toque?: string
  /** o contato para a resposta (canal público e família) */
  contato?: string
  /** canal público: o código de conferência que vai junto do número no Acompanhar (o número é sequencial) */
  codigo?: string
  resposta?: { texto: string; por: string; quando: string }
  /** quem avisou já leu a resposta */
  lido?: boolean
  trechoAberto?: { motivo: string; por: string; quando: string }
  conteudoRetirado?: { motivo: string; quando: string }
  conselhoTutelar?: { data: string; meio: string; quando: string }
  /** risco: o professor da turma já marcou o sinal como visto */
  vistoPeloProfessor?: boolean
  /** titular: o que pediu e se o arquivo já foi gerado */
  pedidoTitular?: { oQue: OQueTitular; arquivo?: boolean }
}

const ALUNO_2B = 'Avisar um adulto · aluno do 2ºB'

const INICIAIS: Aviso[] = [
  { id: 'N-2026-0027', numero: 27, tipo: 'titular', origem: 'Família · canal da escola', categoria: 'Dúvida sobre o uso do dado do aluno', recebido: '11/09, 13h15', prazo: 'até 15/09', analise: 'humana', situacao: 'concluido',
    apontado: 'A responsável perguntou se a conversa do filho com o Tutor treina a IA.',
    feito: [{ quando: '12/09, 10h00', oQue: 'Respondido por escrito: não treina modelo, fica 90 dias e só o professor da turma vê.' }],
    resposta: { texto: 'Não treina modelo. A conversa fica 90 dias e só o professor da turma vê.', por: 'Helena Martins', quando: '12/09, 10h00' }, lido: true },
  { id: 'N-2026-0028', numero: 28, tipo: 'aviso', origem: 'Professor · pela Ajuda', categoria: 'Questão gerada com erro de conteúdo', recebido: '15/09, 11h03', prazo: 'até 17/09', analise: 'humana', situacao: 'concluido',
    apontado: 'Uma questão de prova citava a página certa, mas com o balanceamento errado. O professor não chegou a usar.',
    feito: [{ quando: '15/09, 11h03', oQue: 'Recebido.' }, { quando: '16/09, 9h20', oQue: 'A tabela da página tinha sido lida torta. Trecho reprocessado e questão gerada de novo.' }],
    resposta: { texto: 'A tabela da página tinha sido lida torta. Refizemos o trecho e a questão.', por: 'Helena Martins', quando: '16/09, 9h20' }, lido: true },
  { id: 'N-2026-0029', numero: 29, tipo: 'aviso', origem: 'Filtro de conteúdo do Tutor', categoria: 'Pedido fora do conteúdo da turma', recebido: '17/09, 10h22', prazo: 'até 19/09', analise: 'automatizada', situacao: 'concluido',
    apontado: 'O filtro barrou um pedido fora do conteúdo da turma. O Tutor respondeu com a mensagem fixa e não seguiu no assunto.',
    feito: [{ quando: '17/09, 10h22', oQue: 'Barrado sozinho. Nada foi gerado.' }, { quando: '17/09, 16h30', oQue: 'Revisto por Helena Martins: bloqueio correto, sem outra medida.' }] },
  { id: 'N-2026-0030', numero: 30, tipo: 'aviso', origem: 'Avisar um adulto · aluno do 9ºA', categoria: 'Algo no sistema me deixou desconfortável', recebido: '18/09, 14h40', prazo: 'até 22/09', analise: 'humana', situacao: 'analise',
    apontado: 'O aluno escolheu "outra coisa" e pediu para falar com alguém. Não escreveu o motivo.', turma: '9ºA',
    feito: [{ quando: '18/09, 14h40', oQue: 'Recebido e encaminhado à orientação educacional.' }, { quando: '19/09, 8h05', oQue: 'A orientadora conversou com o aluno em sala. Esperando a família.' }] },
  { id: 'N-2026-0031', numero: 31, tipo: 'aviso', filaId: 'aviso-0031', origem: ALUNO_2B, categoria: 'Resposta da IA que pareceu errada', recebido: '21/09, 9h12', prazo: 'até 23/09', analise: 'humana', situacao: 'aberto',
    apontado: 'O aluno marcou "o Tutor disse uma coisa que parece errada" numa sessão de estequiometria.', turmaId: '2b', turma: '2ºB', toque: 'tutor-errado',
    feito: [{ quando: '21/09, 9h12', oQue: 'Recebido. A orientação educacional foi avisada no horário da escola.' }],
    trecho: [
      { quem: 'Aluno', texto: 'quantos gramas tem 1 mol de H₂?' },
      { quem: 'Tutor', texto: 'Olha a massa de um átomo de H na tabela, p. 142. Quanto dá 1 mol de H₂?' },
      { quem: 'Aluno', texto: '1 g?' },
      { quem: 'Tutor', texto: 'Isso, 1 g.' },
    ] },
  // o encaminhamento de risco à vida da Olívia (2ºB): aberto nos dois lados, para mostrar sem digitar (Lei 13.819)
  { id: 'N-2026-0032', numero: 32, tipo: 'risco', origem: 'Tutor · assunto delicado', categoria: 'Encaminhamento à orientação', recebido: '21/09, 8h55', prazo: 'hoje', analise: 'humana', situacao: 'aberto',
    apontado: 'Na conversa com o Tutor, a aluna falou de um assunto pessoal. O Tutor respondeu com a mensagem combinada com a escola e o 188, e a conversa não seguiu no assunto.',
    alunoNome: 'Olívia Ramos', turmaId: '2b', turma: '2ºB', vistoPeloProfessor: false,
    feito: [
      { quando: '21/09, 8h55', oQue: 'Recebido. Encaminhado à orientação educacional (Helena Martins).' },
      { quando: '21/09, 8h55', oQue: 'O professor da turma recebeu um sinal, sem o texto.' },
    ],
    trecho: [
      { quem: 'Aluna', texto: 'hoje não tô legal, tá tudo pesado em casa' },
      { quem: 'Tutor', texto: TRECHO_TUTOR_ASSUNTO_DELICADO },
    ] },
  // o pedido de uma família do 7ºA, pelo canal público (LGPD, art. 18): prazo de 15 dias
  { id: 'N-2026-0033', numero: 33, tipo: 'titular', origem: 'Canal da escola · sem conta', categoria: 'Ver os dados do filho', recebido: '21/09, 7h40', prazo: 'até 06/10', analise: 'humana', situacao: 'aberto',
    apontado: 'A família de um aluno do 7ºA pediu para ver os dados que o sistema guarda do filho.', turma: '7ºA', contato: 'familia.7a@exemplo.com.br', codigo: 'R4KT',
    pedidoTitular: { oQue: 'ver' },
    feito: [{ quando: '21/09, 7h40', oQue: 'Recebido pelo canal da escola.' }] },
]

type EstadoAvisos = { avisos: Aviso[]; proximo: number }
const fatia = criarFatia<EstadoAvisos>('avisos', { avisos: INICIAIS, proximo: 34 })

const COORDENACAO = { nome: 'Helena Martins', papel: 'coordenacao' as const }
/** O código de conferência do canal público: 4 letras e números, sem os que se confundem (0/O, 1/I/L, 5/S, 8/B). */
const LETRAS = 'ACDEFHJKMNPRTUVWXY3479'
const novoCodigo = () => Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('')
const idDe = (n: number) => `N-2026-${String(n).padStart(4, '0')}`
/** Hoje é 21/09: o aviso de aluno se responde em 2 dias; o canal público, em 5 dias úteis; o titular, em 15 dias. */
const PRAZO = { aviso: 'até 23/09', publico: 'até 28/09', titular: 'até 06/10', risco: 'hoje' }

export const TOQUES = [
  { id: 'tratou-mal', rotulo: 'Alguém me tratou mal', categoria: 'Alguém me tratou mal' },
  { id: 'assustou', rotulo: 'Vi algo que me assustou', categoria: 'Vi algo que me assustou' },
  { id: 'tutor-errado', rotulo: 'O Tutor disse algo errado', categoria: 'O Tutor disse algo errado' },
  { id: 'outra', rotulo: 'Outra coisa', categoria: 'Outra coisa' },
] as const
export type Toque = (typeof TOQUES)[number]['id']

/** Quem lê, dito antes de enviar (ECA Digital, art. 29, § 2º — lei; D79). */
export const quemLe = (toque?: string) => toque === 'tutor-errado'
  ? `Quem lê: a coordenação. Ela vê o seu nome e o trecho da conversa, e responde aqui ${PRAZO.aviso}.`
  : `Quem lê: a orientação da escola. Ela vê o seu nome e responde aqui ${PRAZO.aviso}. Seus colegas, não.`

/** O que o aluno lê depois de enviar: a mesma pessoa, o mesmo prazo e onde a resposta chega (coerente com `quemLe`). */
export const depoisDeEnviar = (toque?: string) => toque === 'tutor-errado'
  ? `Recebido. A coordenação responde ${PRAZO.aviso}.`
  : `Recebido. A orientação responde ${PRAZO.aviso}.`

function novo(e: EstadoAvisos, a: Omit<Aviso, 'id' | 'numero'>): { estado: EstadoAvisos; aviso: Aviso } {
  const numero = e.proximo
  const aviso: Aviso = { ...a, id: idDe(numero), numero }
  return { estado: { avisos: [...e.avisos, aviso], proximo: numero + 1 }, aviso }
}

function mudar(id: string, f: (a: Aviso) => Aviso) {
  fatia.mudar((e) => ({ ...e, avisos: e.avisos.map((a) => (a.id === id ? f(a) : a)) }))
}
/** A data gravada é a data, nunca "hoje" (o "hoje" fica errado no dia seguinte; quem desenha decide se diz "hoje"). */
const semHoje = (data: string) => data.replace(/^\s*hoje,?\s*/i, '').trim() || agora().dia
const anotar = (a: Aviso, oQue: string, quando = agora().rotulo): Aviso => ({ ...a, feito: [...a.feito, { quando, oQue }] })

/* ── Leituras ──────────────────────────────────────────────────────────────────────────────────────────── */

export function useAvisos(): Aviso[] {
  return fatia.useValor().avisos
}
export function useAviso(id: string | null | undefined): Aviso | undefined {
  const l = fatia.useValor().avisos
  return id ? l.find((a) => a.id === id) : undefined
}
export function useAvisoPorNumero(n: number | null | undefined): Aviso | undefined {
  const l = fatia.useValor().avisos
  return n ? l.find((a) => a.numero === n) : undefined
}
/** Os avisos e pedidos do aluno (o da sessão, quando não passado), do mais novo para o mais velho. */
export function useAvisosDoAluno(alunoId?: string): Aviso[] {
  const s = fatiaSessao.useValor()
  const l = fatia.useValor().avisos
  const id = alunoId ?? s.alunoId
  return useMemo(() => l.filter((a) => a.alunoId === id).sort((a, b) => b.numero - a.numero), [l, id])
}
/** Quantas respostas de AVISO o aluno ainda não leu (o contador de AVISAR na lateral). O pedido de dados fica de fora:
    ele é lido em Eu › Privacidade, e o contador dele é `usePedidosDadosNaoLidos`. */
export function useRespostasNaoLidas(alunoId?: string): number {
  return useAvisosDoAluno(alunoId).filter((a) => a.tipo !== 'titular' && a.resposta && !a.lido).length
}
/** Quantas respostas de pedido de dados (LGPD, art. 18 — lei) o aluno ainda não leu (o contador de EU). */
export function usePedidosDadosNaoLidos(alunoId?: string): number {
  return useAvisosDoAluno(alunoId).filter((a) => a.tipo === 'titular' && a.resposta && !a.lido).length
}
export const lerAvisos = () => fatia.ler().avisos
export const useEstadoAvisos = () => fatia.useValor()

/* ── Ações ─────────────────────────────────────────────────────────────────────────────────────────────── */

export const avisos = {
  /** O aluno avisa (pelo Avisar um adulto ou de dentro da prova) ou alguém sem conta usa o canal público. Devolve o número. */
  enviar({ texto, toque, origem = 'aluno', turma, contato, conversaId }: {
    texto?: string; toque?: string; origem?: 'aluno' | 'prova' | 'publico'; turma?: string; contato?: string
    /** a conversa de onde o aluno avisou (o trecho é a última fala do Tutor nela; sem ela, a última de todas) */
    conversaId?: string
  }): number {
    const publico = origem === 'publico'
    const aluno = publico ? null : alunoDaSessao()
    const categoria = TOQUES.find((t) => t.id === toque)?.categoria ?? (publico ? 'Aviso pelo canal da escola' : 'Aviso de aluno')
    // "O Tutor disse algo errado": o trecho é a última resposta do Tutor nas conversas do aluno, e o aviso sabe de onde veio
    const resposta = toque === 'tutor-errado' && aluno && origem !== 'prova' ? respostaParaAvisar(aluno.id, conversaId) : null
    const ev = registrar('aviso-enviado', { origem, toque, turma: aluno?.turma ?? turma, numero: fatia.ler().proximo },
      aluno ? { nome: aluno.nome, papel: 'aluno' } : { nome: 'Sem conta', papel: 'publico' })
    let numero = 0
    fatia.mudar((e) => {
      const r = novo(e, {
        tipo: 'aviso',
        origem: publico ? 'Canal da escola · sem conta' : origem === 'prova' ? `Avisar um adulto, na prova · aluno do ${aluno!.turma}` : `Avisar um adulto · aluno do ${aluno!.turma}`,
        categoria, recebido: ev.quando.rotulo, prazo: publico ? PRAZO.publico : PRAZO.aviso, analise: 'humana', situacao: 'aberto',
        apontado: texto?.trim() || (toque ? `Tocou em "${categoria}".` : 'Sem texto.'),
        feito: [{ quando: ev.quando.rotulo, oQue: toque === 'tutor-errado' ? 'Recebido. A coordenação foi avisada.' : 'Recebido. A orientação educacional foi avisada.' }],
        alunoId: aluno?.id, alunoNome: aluno?.nome, turmaId: aluno?.turmaId, turma: aluno?.turma ?? (turma?.trim() || undefined),
        toque, contato: contato?.trim() || undefined, codigo: publico ? novoCodigo() : undefined,
        trecho: resposta?.trecho,
        conversa: resposta && aluno ? { alunoId: aluno.id, conversaId: resposta.conversaId, indice: resposta.indice } : undefined,
      })
      numero = r.aviso.numero
      return r.estado
    })
    return numero
  },

  /** O pedido do titular (LGPD, art. 18 — lei): do aluno, na Privacidade, ou da família, pelo canal público. Devolve o número. */
  pedirDados({ oQue, texto, origem = 'aluno', alunoNome, turma, contato }: {
    oQue: OQueTitular; texto?: string; origem?: 'aluno' | 'publico'; alunoNome?: string; turma?: string; contato?: string
  }): number {
    const aluno = origem === 'aluno' ? alunoDaSessao() : null
    const ev = registrar('titular-pedido', { oQue, origem, numero: fatia.ler().proximo, turma: aluno?.turma ?? turma },
      aluno ? { nome: aluno.nome, papel: 'aluno' } : { nome: 'Família · sem conta', papel: 'publico' })
    let numero = 0
    fatia.mudar((e) => {
      const r = novo(e, {
        tipo: 'titular', origem: aluno ? `Privacidade · aluno do ${aluno.turma}` : 'Canal da escola · sem conta',
        categoria: ROTULO_TITULAR[oQue], recebido: ev.quando.rotulo, prazo: PRAZO.titular, analise: 'humana', situacao: 'aberto',
        apontado: texto?.trim() || (aluno ? `${aluno.primeiro} pediu: ${ROTULO_TITULAR[oQue].toLowerCase()}.` : `Pedido sobre ${alunoNome?.trim() || 'um aluno'}: ${ROTULO_TITULAR[oQue].toLowerCase()}.`),
        feito: [{ quando: ev.quando.rotulo, oQue: 'Recebido. Quem atende é quem tem a atribuição "Atende o titular".' }],
        alunoId: aluno?.id, alunoNome: aluno?.nome ?? (alunoNome?.trim() || undefined), turmaId: aluno?.turmaId, turma: aluno?.turma ?? (turma?.trim() || undefined),
        contato: contato?.trim() || undefined, codigo: aluno ? undefined : novoCodigo(), pedidoTitular: { oQue },
      })
      numero = r.aviso.numero
      return r.estado
    })
    return numero
  },

  /** O assunto delicado na conversa do Tutor: encaminhamento de risco à orientação (Lei 13.819 — lei) e um sinal ao
      professor da turma, SEM o texto. Devolve o número. */
  assuntoDelicado(texto?: string): number {
    const aluno = alunoDaSessao()
    const ev = registrar('assunto-delicado', { turma: aluno.turma, turmaId: aluno.turmaId, numero: fatia.ler().proximo }, { nome: aluno.nome, papel: 'aluno' })
    let numero = 0
    fatia.mudar((e) => {
      const r = novo(e, {
        tipo: 'risco', origem: 'Tutor · assunto delicado', categoria: 'Encaminhamento à orientação', recebido: ev.quando.rotulo, prazo: PRAZO.risco,
        analise: 'humana', situacao: 'aberto',
        apontado: 'Na conversa com o Tutor, o aluno falou de um assunto pessoal. O Tutor respondeu com a mensagem combinada com a escola e o 188, e a conversa não seguiu no assunto.',
        feito: [
          { quando: ev.quando.rotulo, oQue: 'Recebido. Encaminhado à orientação educacional (Helena Martins).' },
          { quando: ev.quando.rotulo, oQue: 'O professor da turma recebeu um sinal, sem o texto.' },
        ],
        alunoId: aluno.id, alunoNome: aluno.nome, turmaId: aluno.turmaId, turma: aluno.turma, vistoPeloProfessor: false,
        trecho: [
          { quem: 'Aluno', texto: texto?.trim() || 'não tô bem, briguei em casa' },
          { quem: 'Tutor', texto: TRECHO_TUTOR_ASSUNTO_DELICADO },
        ],
      })
      numero = r.aviso.numero
      return r.estado
    })
    return numero
  },

  registrarAcao(id: string, texto: string) {
    if (!texto.trim()) return
    mudar(id, (a) => ({ ...anotar(a, `${texto.trim()} (${COORDENACAO.nome})`), situacao: a.situacao === 'aberto' ? 'analise' : a.situacao }))
  },

  /** Ver o trecho da conversa: com motivo de lista fechada, que fica na auditoria. */
  verTrecho(id: string, motivo: string) {
    const a = fatia.ler().avisos.find((x) => x.id === id)
    if (!a) return
    const ev = registrar('trecho-aberto', { id, numero: a.numero, motivo }, COORDENACAO)
    mudar(id, (x) => ({ ...anotar(x, `Trecho aberto por ${COORDENACAO.nome} · motivo: ${motivo.toLowerCase()}`, ev.quando.rotulo), situacao: x.situacao === 'aberto' ? 'analise' : x.situacao, trechoAberto: { motivo, por: COORDENACAO.nome, quando: ev.quando.rotulo } }))
  },

  /** Responde quem avisou e conclui. O texto é o que a pessoa vai ler. */
  responderEConcluir(id: string, texto: string) {
    const a = fatia.ler().avisos.find((x) => x.id === id)
    if (!a || !texto.trim()) return
    const ev = registrar('aviso-respondido', { id, numero: a.numero, tipo: a.tipo, turma: a.turma }, COORDENACAO)
    mudar(id, (x) => ({
      ...anotar(x, 'Resposta enviada · análise feita por uma pessoa', ev.quando.rotulo),
      situacao: 'concluido', resposta: { texto: texto.trim(), por: COORDENACAO.nome, quando: ev.quando.rotulo }, lido: false,
    }))
  },

  /** Retira o conteúdo gerado (ECA Digital, arts. 29 e 30 — lei), com motivo. */
  retirarConteudo(id: string, motivo: string) {
    const a = fatia.ler().avisos.find((x) => x.id === id)
    if (!a) return
    const ev = registrar('conteudo-retirado', { id, numero: a.numero, motivo, conversaId: a.conversa?.conversaId }, COORDENACAO)
    // a resposta sai da conversa do aluno: no lugar dela, "Esta resposta foi retirada pela escola."
    if (a.conversa) conversasAluno.retirarResposta(a.conversa.alunoId, a.conversa.conversaId, a.conversa.indice, ev.quando.rotulo)
    mudar(id, (x) => ({ ...anotar(x, `Conteúdo retirado · motivo: ${motivo.toLowerCase()}`, ev.quando.rotulo), conteudoRetirado: { motivo, quando: ev.quando.rotulo } }))
  },

  /** Registra a notificação ao Conselho Tutelar, com a data e o meio (Lei 13.819/2019, art. 6º — lei). */
  registrarConselhoTutelar(id: string, { data, meio }: { data: string; meio: string }) {
    const a = fatia.ler().avisos.find((x) => x.id === id)
    if (!a) return
    const ev = registrar('conselho-tutelar', { id, numero: a.numero, data, meio }, COORDENACAO)
    mudar(id, (x) => ({ ...anotar(x, `Notificação ao Conselho Tutelar registrada · ${semHoje(data)}, ${meio}`, ev.quando.rotulo), situacao: x.situacao === 'aberto' ? 'analise' : x.situacao, conselhoTutelar: { data: semHoje(data), meio, quando: ev.quando.rotulo } }))
  },

  /** Atende o pedido do titular: gera o arquivo com os dados (depois, Responder e concluir). */
  atenderTitular(id: string) {
    const a = fatia.ler().avisos.find((x) => x.id === id)
    if (!a || a.tipo !== 'titular') return
    const ev = registrar('titular-atendido', { id, numero: a.numero }, COORDENACAO)
    mudar(id, (x) => ({ ...anotar(x, 'Arquivo com os dados gerado', ev.quando.rotulo), situacao: x.situacao === 'aberto' ? 'analise' : x.situacao, pedidoTitular: { oQue: x.pedidoTitular?.oQue ?? 'ver', arquivo: true } }))
  },

  /** Quem avisou leu a resposta (o NOVO e o contador somem). */
  marcarLido(id: string) {
    const a = fatia.ler().avisos.find((x) => x.id === id)
    if (!a || a.lido || !a.resposta) return
    mudar(id, (x) => ({ ...x, lido: true }))
  },

  /** O professor da turma marcou como visto o sinal de atenção (ele não vê o texto). */
  vistoPeloProfessor(id: string) {
    const a = fatia.ler().avisos.find((x) => x.id === id)
    if (!a || a.vistoPeloProfessor) return
    const ev = registrar('atencao-vista', { id, numero: a.numero, turma: a.turma })
    mudar(id, (x) => ({ ...anotar(x, 'O professor da turma marcou o sinal como visto.', ev.quando.rotulo), vistoPeloProfessor: true }))
  },
}

/** O que o sistema guarda de um aluno: o arquivo do pedido do titular (um JSON de verdade, sem conversa de outros). */
/** O arquivo do pedido do titular, o MESMO que o aluno baixa em Eu › Privacidade (`arquivoDoAluno`, em
    dados/avaliacoes.ts). No pedido sem conta (canal da escola), ficam o nome e a turma que a família digitou. */
/** O aluno de um pedido da família sem conta: o nome digitado (e a turma, se veio) batem com um aluno dos dados. */
const normal = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
export function alunoDoPedido(a: Aviso): { id: string; nome: string; turma: string } | null {
  if (a.alunoId) return { id: a.alunoId, nome: a.alunoNome ?? '', turma: a.turma ?? '' }
  if (!a.alunoNome) return null
  const nome = normal(a.alunoNome)
  const bateNome = nome === normal(LUCAS.nome) || nome === normal(LUCAS.primeiro)
  const bateTurma = !a.turma || normal(a.turma).replace(/[º°o]/g, '') === normal(LUCAS.turma).replace(/[º°o]/g, '')
  return bateNome && bateTurma ? { id: LUCAS.id, nome: LUCAS.nome, turma: LUCAS.turma } : null
}

export function arquivoDoTitular(a: Aviso): string {
  if (a.alunoId) return arquivoDoAluno(a.alunoId, { numero: a.numero, atendidoEm: a.resposta?.quando ?? agora().rotulo })
  // a família conferida na secretaria: se o nome e a turma batem com um aluno, o arquivo é o dele, o mesmo do aluno
  const achado = alunoDoPedido(a)
  if (achado) return arquivoDoAluno(achado.id, { numero: a.numero, atendidoEm: a.resposta?.quando ?? agora().rotulo })
  return JSON.stringify({
    pedido: `Pedido ${a.numero}`,
    atendidoEm: a.resposta?.quando ?? agora().rotulo,
    escola: 'Colégio Aurora',
    aluno: { nome: a.alunoNome ?? 'Aluno', turma: a.turma ?? '' },
    tarefas: [],
    conversasComOTutor: [],
    oQueOTutorLembra: [],
    observacao: 'O nome e a turma informados não batem com nenhum aluno desta escola. Nenhum dado foi juntado; a escola fala com a família pelo contato deixado.',
    oQueNaoTemos: O_QUE_NAO_TEMOS,
  }, null, 2)
}
