import { useMemo } from 'react'
import { agora, criarFatia, registrar, useEventos, type Evento } from './demo/nucleo'
import { NOME_DA_CONTESTACAO, type Contestacao } from './estrutura'

/* A IA DA ESCOLA, VISTA PELA COORDENAÇÃO (12ª rodada, 04/10/2026; plano de polimento, seção 4.2).

   · PAUSAS por IA e por função (antes, a memória de `coordenacao/Agentes.tsx`): a chave é o agente ("tutor") ou o
     agente e a função ("assistente:correcao"). Pausado o Tutor, o aluno vê a onça dormindo: "A escola pausou o Tutor
     por enquanto." (D60);
   · ALERTAS do Analista já vistos e os SINAIS do Tutor já vistos ou contestados pelo professor;
   · as linhas novas de "O que a IA gerou e quem aprovou" e da AUDITORIA, lidas dos eventos da demonstração.
   Nada aqui guarda conversa nem dado de aluno: só o que aconteceu, quem fez e quando. */

export type Pausa = { quando: string; por: string; motivo: string }

type EstadoIA = {
  pausas: Record<string, Pausa>
  alertasVistos: string[]
  sinais: Record<string, 'visto' | 'contestado'>
}

const fatia = criarFatia<EstadoIA>('ia', { pausas: {}, alertasVistos: [], sinais: {} })

const COORDENACAO = { nome: 'Helena Martins', papel: 'coordenacao' as const }

export function usePausas(): Record<string, Pausa> {
  return fatia.useValor().pausas
}
/** O Tutor está pausado pela escola? */
export function useTutorPausado(): Pausa | undefined {
  return fatia.useValor().pausas.tutor
}
export const tutorPausado = () => fatia.ler().pausas.tutor
export function useAlertasVistos(): string[] {
  return fatia.useValor().alertasVistos
}
export function useSinais(): Record<string, 'visto' | 'contestado'> {
  return fatia.useValor().sinais
}
export const lerIA = () => fatia.ler()
export const useEstadoIA = () => fatia.useValor()

const NOME_DA_CHAVE: Record<string, string> = { tutor: 'Tutor', assistente: 'Assistente', analista: 'Analista' }

export const ia = {
  /** Pausa uma IA ou uma função, com motivo (fica na auditoria). */
  pausar(chave: string, motivo: string) {
    const ev = registrar('ia-pausada', { chave, nome: NOME_DA_CHAVE[chave] ?? chave, motivo }, COORDENACAO)
    fatia.mudar((e) => ({ ...e, pausas: { ...e.pausas, [chave]: { quando: ev.quando.rotulo, por: COORDENACAO.nome, motivo } } }))
  },
  reativar(chave: string) {
    if (!fatia.ler().pausas[chave]) return
    fatia.mudar((e) => { const p = { ...e.pausas }; delete p[chave]; return { ...e, pausas: p } })
    registrar('ia-reativada', { chave, nome: NOME_DA_CHAVE[chave] ?? chave }, COORDENACAO)
  },
  marcarAlertaVisto(id: string) {
    if (fatia.ler().alertasVistos.includes(id)) return
    fatia.mudar((e) => ({ ...e, alertasVistos: [...e.alertasVistos, id] }))
    registrar('alerta-visto', { id }, COORDENACAO)
  },
  /** Ver o dado com nome de um alerta: só com a finalidade, que fica registrada (D64). */
  verDadosComNome(alertaId: string, finalidade: string) {
    registrar('dados-com-nome', { alertaId, finalidade }, COORDENACAO)
  },
  /** O professor marca o sinal do Tutor como visto ou diz que ele está errado. */
  marcarSinal(id: string, como: 'visto' | 'contestado' = 'visto') {
    if (fatia.ler().sinais[id] === como) return
    fatia.mudar((e) => ({ ...e, sinais: { ...e.sinais, [id]: como } }))
    registrar(como === 'visto' ? 'sinal-visto' : 'sinal-contestado', { id })
  },
}

/* ── As linhas novas da tabela "O que a IA gerou e quem aprovou" ─────────────────────────────────────── */

export type RegistroIA = {
  id: string
  /** "21/09, 10h44" */
  quando: string
  ordem: number
  /** "Prova", "Correção", "Versão adaptada", "Atividade" */
  oQue: string
  /** "estequiometria, 10 questões" */
  detalhe: string
  turma: string
  estado: 'aprovado' | 'recusado' | 'espera'
  por: string
}

const OQUE: Record<string, string> = { prova: 'Prova', lista: 'Atividade', atividade: 'Atividade', leitura: 'Leitura', material: 'Material', plano: 'Plano de aula', apresentacao: 'Apresentação' }

/** "Prova de estequiometria" → "estequiometria"; "Revisão de massa em mol" → "massa em mol". */
const assunto = (titulo: unknown) => String(titulo ?? '').replace(/^(Prova|Lista|Atividade|Revisão|Leitura)( de| do| da)?\s*/i, '').trim() || String(titulo ?? '')

function linhaIA(e: Evento): RegistroIA | null {
  const d = e.dados
  const base = { id: e.id, quando: e.quando.rotulo, ordem: e.quando.ordem, turma: String(d.turma ?? ''), por: e.quem.nome }
  if (e.tipo === 'documento-enviado') {
    const adaptada = d.versao === 'adaptada'
    const q = d.questoes ? `, ${d.questoes} questões` : ''
    return { ...base, oQue: adaptada ? 'Versão adaptada' : OQUE[String(d.tipo)] ?? 'Documento', detalhe: adaptada ? `${assunto(d.titulo)}, para ${d.para} alunos` : `${assunto(d.titulo)}${q}`, estado: 'aprovado' }
  }
  if (e.tipo === 'documento-recusado') {
    return { ...base, oQue: d.versao === 'adaptada' ? 'Versão adaptada' : OQUE[String(d.tipo)] ?? 'Documento', detalhe: assunto(d.titulo), estado: 'recusado' }
  }
  if (e.tipo === 'notas-aprovadas' || e.tipo === 'notas-recusadas') {
    const n = Number(d.n ?? 1)
    const tipo = d.tipo === 'prova' ? (n === 1 ? 'prova' : 'provas') : n === 1 ? 'entrega' : 'entregas'
    return { ...base, oQue: 'Correção', detalhe: `${n} ${tipo} de ${assunto(d.titulo)}`, estado: e.tipo === 'notas-aprovadas' ? 'aprovado' : 'recusado' }
  }
  if (e.tipo === 'adaptada-gerada') {
    return { ...base, oQue: 'Versão adaptada', detalhe: assunto(d.titulo), estado: 'espera', por: '—' }
  }
  return null
}

/** As linhas que a demonstração acrescentou, da mais nova para a mais velha. */
export function useRegistrosIADaDemo(): RegistroIA[] {
  const ev = useEventos()
  return useMemo(() => {
    // a versão adaptada que já foi decidida (enviada ou recusada) depois de gerada não fica "Para aprovar"
    const decidida = (g: Evento) => ev.some((x) => (x.tipo === 'documento-enviado' || x.tipo === 'documento-recusado')
      && x.dados.versao === 'adaptada' && x.dados.docId === g.dados.docId && x.quando.ordem > g.quando.ordem)
    return ev.filter((x) => x.tipo !== 'adaptada-gerada' || !decidida(x))
      .map(linhaIA).filter((x): x is RegistroIA => !!x).sort((a, b) => b.ordem - a.ordem)
  }, [ev])
}

/* ── As linhas novas da auditoria ──────────────────────────────────────────────────────────────────────── */

export type LinhaAuditoria = {
  id: string
  quando: string
  ordem: number
  quem: string
  papel: string
  /** o que foi feito, em poucas palavras */
  acao: string
  /** sobre o quê (turma, aviso, pedido) */
  alvo: string
  finalidade?: string
}

function linhaAuditoria(e: Evento): LinhaAuditoria | null {
  const d = e.dados
  const base = { id: e.id, quando: e.quando.rotulo, ordem: e.quando.ordem, quem: e.quem.nome, papel: e.quem.papel }
  switch (e.tipo) {
    case 'pedidos-decididos':
      return { ...base, acao: d.decisao === 'aprovar' ? `Aprovou ${d.n} ${Number(d.n) === 1 ? 'pedido' : 'pedidos'} para entrar` : `Recusou ${d.n} ${Number(d.n) === 1 ? 'pedido' : 'pedidos'} para entrar`, alvo: String(d.turma ?? '') }
    case 'trecho-aberto':
      return { ...base, acao: 'Abriu o trecho da conversa', alvo: `Aviso ${d.numero}`, finalidade: String(d.motivo ?? '') }
    case 'conversa-aberta':
      return { ...base, acao: 'Abriu a conversa de um aluno', alvo: String(d.turma ?? ''), finalidade: String(d.motivo ?? '') }
    case 'dados-com-nome':
      return { ...base, acao: 'Viu dado com nome', alvo: String(d.alertaId ?? ''), finalidade: String(d.finalidade ?? '') }
    case 'exportacao':
      // a auditoria da escola só lista o que a escola fez: a exportação da secretaria fica na trilha da rede
      if (e.quem.papel === 'rede' || d.conjunto === 'rede') return null
      return { ...base, acao: 'Exportou dados', alvo: String(d.conjunto ?? ''), finalidade: String(d.finalidade ?? '') }
    case 'alocacao-corrigida':
      return { ...base, acao: 'Corrigiu a turma de um professor', alvo: String(d.turma ?? ''), finalidade: 'O professor avisou que a turma não era dele' }
    case 'turma-contestada':
      return { ...base, acao: 'Avisou que a turma não é sua', alvo: String(d.turma ?? ''), finalidade: NOME_DA_CONTESTACAO[d.motivo as Contestacao] ?? '' }
    case 'turma-confirmada':
      return { ...base, acao: 'Confirmou a turma', alvo: String(d.turma ?? '') }
    case 'revisao-respondida':
      return d.decisao === 'mudar' ? { ...base, acao: 'Mudou uma nota', alvo: String(d.turma ?? ''), finalidade: String(d.motivo ?? '') }
        : d.decisao === 'apagar' ? { ...base, acao: 'Apagou um item da memória do Tutor', alvo: String(d.turma ?? ''), finalidade: String(d.motivo ?? '') } : null
    case 'conselho-tutelar':
      return { ...base, acao: 'Registrou a notificação ao Conselho Tutelar', alvo: `Aviso ${d.numero}`, finalidade: `${d.data ?? ''} · ${d.meio ?? ''}` }
    case 'conteudo-retirado':
      return { ...base, acao: 'Retirou o conteúdo', alvo: `Aviso ${d.numero}`, finalidade: String(d.motivo ?? '') }
    case 'ia-pausada':
      return { ...base, acao: `Pausou o ${d.nome}`, alvo: 'Escola', finalidade: String(d.motivo ?? '') }
    case 'ia-reativada':
      return { ...base, acao: `Reativou o ${d.nome}`, alvo: 'Escola' }
    case 'titular-atendido':
      return { ...base, acao: 'Atendeu um pedido sobre dados', alvo: `Pedido ${d.numero}` }
    case 'encarregado-indicado':
      return { ...base, acao: 'Indicou o encarregado de dados', alvo: String(d.nome ?? '') }
    default:
      return null
  }
}

/** As ações da demonstração que entram na auditoria, da mais nova para a mais velha. */
export function useAuditoriaDaDemo(): LinhaAuditoria[] {
  const ev = useEventos()
  return useMemo(() => ev.map(linhaAuditoria).filter((x): x is LinhaAuditoria => !!x).sort((a, b) => b.ordem - a.ordem), [ev])
}

/** O agora, para quem precisa carimbar fora de um evento. */
export const carimbo = () => agora().rotulo
