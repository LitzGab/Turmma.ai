import { useMemo } from 'react'
import { agora, criarFatia, registrar, type Momento } from './demo/nucleo'
import { proximaAulaDe } from './grade'
import { adaptacoesDe } from './escola-estado'
import { professorDaSessao } from './sessao'
import { turmaPorId } from './demo/turmas-base'
import { TURMAS } from './escola'

/* A APROVAÇÃO E O ENVIO DOS DOCUMENTOS (12ª rodada, 04/10/2026; plano de polimento, seção 4.2 e fluxos F2, F11, F12).

   Nada chega à turma sem um professor aprovar (regra 70). Este módulo guarda:
   · o ESTADO de aprovação de cada documento que espera (o original e a versão adaptada): Para aprovar → Aprovado ou
     Recusado. Só os que esperam nascem aqui: a "Prova de estequiometria" de hoje, com o original e a adaptada (fonte
     ampliada e enunciado direto) Para aprovar. Os outros documentos devolvem `undefined`, e a tela usa o estado do
     próprio `biblioteca.ts`;
   · os ENVIOS à turma: "Aprovar e enviar" registra quem aprovou (o professor da sessão) e a hora, e cria a tarefa do
     aluno (o id da tarefa é o id do documento), que chega "agora" ou "na próxima aula" (terça, 7h30, no 2ºB).
   No produto, isto é estado de servidor com trilha de aprovação (D56). */

export type EstadoVersao = 'rascunho' | 'espera' | 'aprovado' | 'recusado'
export type Versao = 'original' | 'adaptada'
export type TipoDoc = 'prova' | 'lista' | 'atividade' | 'leitura' | 'material' | 'plano' | 'apresentacao'

export type EstadoDaVersao = {
  estado: EstadoVersao
  /** "21/09, 10h44" */
  quando?: string
  /** a ordem do momento (minutos da demonstração): logo depois de aprovar, a tela diz "agora" */
  ordem?: number
  /** quem aprovou ou recusou */
  por?: string
  /** "agora" ou "terça, 7h30" */
  chega?: string
  motivo?: string
  /** os tipos de adaptação (só na adaptada): 'fonte', 'direto'… */
  tipos?: string[]
  /** para quem vai a adaptada (os nomes escolhidos no Adaptar). Sem ele, os alunos com adaptação da turma */
  para?: string[]
}

export type EstadoDocumento = { original?: EstadoDaVersao; adaptada?: EstadoDaVersao }

/** O que se sabe de um documento gerado na demonstração (para a tarefa do aluno e a linha de Criados). */
export type InfoDocumento = { titulo: string; tipo: TipoDoc; turmaId: string; questoes?: number; materia?: string; criadoEm?: string }

export type Envio = {
  id: string
  docId: string
  versao: Versao
  titulo: string
  tipo: TipoDoc
  turmaId: string
  turma: string
  materia: string
  /** a turma toda, ou os nomes escolhidos */
  para: 'turma' | string[]
  quando: 'agora' | 'proxima'
  /** quando abre, se for na próxima aula: "terça, 7h30" e o selo "Terça 7h30" */
  abre?: { rotulo: string; selo: string }
  por: string
  em: Momento
  questoes: number
}

type EstadoEnvios = {
  docs: Record<string, EstadoDocumento>
  info: Record<string, InfoDocumento>
  envios: Envio[]
}

const fatia = criarFatia<EstadoEnvios>('envios', {
  docs: {
    'prova-estequiometria': {
      original: { estado: 'espera' },
      adaptada: { estado: 'espera', tipos: ['fonte', 'direto', 'tempo'] },
    },
  },
  info: {
    'prova-estequiometria': { titulo: 'Prova de estequiometria', tipo: 'prova', turmaId: '2b', questoes: 10, materia: 'Química', criadoEm: '21/09, 10h38' },
  },
  envios: [],
})

const materiaDaTurma = (turmaId: string) => TURMAS.find((t) => t.id === turmaId)?.disciplina ?? 'Química'
const nomeDaTurma = (turmaId: string) => TURMAS.find((t) => t.id === turmaId)?.nome ?? turmaPorId(turmaId)?.nome ?? turmaId

/** O estado de aprovação de um documento; `undefined` para os que não esperam (a tela usa o de biblioteca.ts). */
export function useEstadoDocumento(docId: string | undefined): EstadoDocumento | undefined {
  const e = fatia.useValor()
  return docId ? e.docs[docId] : undefined
}

/** O que se sabe de um documento gerado na demonstração. */
export function useInfoDocumento(docId: string | undefined): InfoDocumento | undefined {
  const e = fatia.useValor()
  return docId ? e.info[docId] : undefined
}

/** Os envios (de uma turma, quando passada), do mais novo para o mais velho. */
export function useEnvios(turmaId?: string): Envio[] {
  const e = fatia.useValor()
  return useMemo(() => [...e.envios].filter((x) => !turmaId || x.turmaId === turmaId).sort((a, b) => b.em.ordem - a.em.ordem), [e, turmaId])
}

/** O momento de uma aprovação ou recusa, como a tela diz: "agora" logo depois (até 10 minutos da demonstração), "hoje,
    10h44" no mesmo dia, e a data nos antigos. */
export function quandoFoi(v: Pick<EstadoDaVersao, 'quando' | 'ordem'> | undefined, agoraOrdem: number, hojeDia: string): string | undefined {
  if (!v?.quando) return undefined
  if (v.ordem !== undefined && agoraOrdem - v.ordem <= 10) return 'agora'
  const [dia, hora] = v.quando.split(', ')
  return dia === hojeDia && hora ? `hoje, ${hora}` : v.quando
}

/** Leitura fora do React. */
export const lerEnvios = () => fatia.ler()
export const useEstadoEnvios = () => fatia.useValor()

/** Os alunos com adaptação registrada numa turma (é para eles que vai a versão adaptada). */
export const alunosComAdaptacao = (turmaId: string) => adaptacoesDe(turmaId).map((a) => a.aluno)

function mudarVersao(docId: string, versao: Versao, f: (v: EstadoDaVersao | undefined) => EstadoDaVersao) {
  fatia.mudar((e) => ({ ...e, docs: { ...e.docs, [docId]: { ...(e.docs[docId] ?? {}), [versao]: f(e.docs[docId]?.[versao]) } } }))
}

export const envios = {
  /** Aprova e envia: registra quem aprovou e quando, e a tarefa chega ao aluno (agora ou na próxima aula). */
  aprovarEEnviar({ docId, versao = 'original', titulo, tipo, turmaId, para = 'turma', quando = 'agora', questoes }: {
    docId: string; versao?: Versao; titulo: string; tipo: TipoDoc; turmaId: string
    para?: 'turma' | string[]; quando?: 'agora' | 'proxima'; questoes?: number
  }): Envio {
    const prof = professorDaSessao()
    const prox = quando === 'proxima' ? proximaAulaDe(turmaId) : null
    /* a adaptada vai para quem o professor escolheu no Adaptar; sem escolha guardada, para os alunos com adaptação */
    const guardado = fatia.ler().docs[docId]?.adaptada?.para
    const destino = versao === 'adaptada' && para === 'turma' ? (guardado && guardado.length > 0 ? guardado : alunosComAdaptacao(turmaId)) : para
    const ev = registrar('documento-enviado', {
      docId, versao, titulo, tipo, turmaId, turma: nomeDaTurma(turmaId), quando, questoes: questoes ?? fatia.ler().info[docId]?.questoes,
      para: destino === 'turma' ? 'turma' : destino.length,
    }, { nome: prof.nome, papel: 'professor' })
    const envio: Envio = {
      id: `env-${ev.quando.ordem}-${docId}`, docId, versao, titulo, tipo, turmaId, turma: nomeDaTurma(turmaId), materia: materiaDaTurma(turmaId),
      para: destino, quando, abre: prox ? { rotulo: prox.rotulo, selo: prox.selo } : undefined, por: prof.nome, em: ev.quando,
      questoes: questoes ?? fatia.ler().info[docId]?.questoes ?? (tipo === 'prova' ? 10 : 8),
    }
    fatia.mudar((e) => ({
      ...e,
      envios: [...e.envios, envio],
      docs: { ...e.docs, [docId]: { ...(e.docs[docId] ?? {}), [versao]: {
        ...(e.docs[docId]?.[versao] ?? {}), estado: 'aprovado', quando: ev.quando.rotulo, ordem: ev.quando.ordem, por: prof.nome, chega: prox ? prox.rotulo : 'agora',
        /* a adaptada guarda QUEM recebeu: quem ganhar adaptação depois aparece à parte ("ainda não recebeu"), e um
           envio a mais soma à lista em vez de trocá-la */
        ...(versao === 'adaptada' && destino !== 'turma' ? { para: [...new Set([...(e.docs[docId]?.adaptada?.estado === 'aprovado' ? e.docs[docId]?.adaptada?.para ?? [] : []), ...destino])] } : {}),
      } } },
      info: { ...e.info, [docId]: { ...(e.info[docId] ?? { titulo, tipo, turmaId }), titulo, tipo, turmaId } },
    }))
    return envio
  },
  /** Recusa com motivo: nada chega à turma. */
  recusar(docId: string, versao: Versao, motivo: string) {
    const prof = professorDaSessao()
    const info = fatia.ler().info[docId]
    const ev = registrar('documento-recusado', { docId, versao, motivo, titulo: info?.titulo, tipo: info?.tipo, turmaId: info?.turmaId, turma: info ? nomeDaTurma(info.turmaId) : undefined }, { nome: prof.nome, papel: 'professor' })
    mudarVersao(docId, versao, (v) => ({ ...(v ?? {}), estado: 'recusado', motivo, por: prof.nome, quando: ev.quando.rotulo, ordem: ev.quando.ordem }))
  },
  /** Pede a versão adaptada (fonte ampliada, enunciado direto…) para quem o professor escolheu: nasce Para aprovar.
      `para` são os nomes (só alunos com adaptação registrada); sem ele, vão todos os da turma que têm. */
  gerarAdaptada(docId: string, tipos: string[] = ['fonte', 'direto', 'tempo'], para?: string[]) {
    const info = fatia.ler().info[docId]
    /* a versão que já esperava (a que veio nos dados, ou uma gerada antes) é TROCADA pela nova, desde o GERAR: no
       registro da IA fica uma linha só "Para aprovar" para esta prova, e o total gerado não volta para trás ao aprovar */
    const trocaAPendente = fatia.ler().docs[docId]?.adaptada?.estado === 'espera'
    if (!trocaAPendente) registrar('adaptada-gerada', { docId, tipos, titulo: info?.titulo, turmaId: info?.turmaId, turma: info ? nomeDaTurma(info.turmaId) : undefined, para: para?.length })
    mudarVersao(docId, 'adaptada', () => ({ estado: 'espera', tipos, ...(para ? { para } : {}) }))
  },
  /** Um documento novo, gerado pelo Assistente na conversa: nasce Para aprovar (só o professor vê). */
  novoRascunho(docId: string, info: InfoDocumento, estado: EstadoVersao = 'espera') {
    fatia.mudar((e) => ({
      ...e,
      docs: { ...e.docs, [docId]: { ...(e.docs[docId] ?? {}), original: { estado } } },
      info: { ...e.info, [docId]: { ...info, criadoEm: info.criadoEm ?? agora().rotulo } },
    }))
    registrar('documento-gerado', { docId, titulo: info.titulo, tipo: info.tipo, turmaId: info.turmaId })
  },
}
