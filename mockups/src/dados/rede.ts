import { useMemo } from 'react'
import { criarFatia, registrar } from './demo/nucleo'

/* A REDE E A OPERAÇÃO, UMA FONTE SÓ (12ª rodada, 04/10/2026; plano de polimento, seções 1, 5.4 e 5.5).

   Antes a rede tinha 6 escolas e 3.412 alunos, e a operação mostrava a mesma secretaria com 3 escolas e outros
   números. Agora as duas telas leem daqui:
   · REDES: a rede estadual de SC (o Colégio Aurora é escola ESTADUAL, 6º ao 3º EM; painéis de gestão, 06/10/2026) e a
     Secretaria Municipal de Educação de Joinville (6 escolas). As outras estaduais da Regional Joinville moram em
     dados/gestao.ts (só o painel do Estado as mostra; a operação, por ora, só tem o Aurora);
   · ESCOLAS_DA_REDE: as 6 municipais, com a SITUAÇÃO (em uso · montando · convite enviado), os alunos com acesso
     (somam 3.412), as turmas (somam 106, a mesma conta do acerto por série) e o revisado/aprovado;
   · as escolas criadas na demonstração (a operação cria a E. M. Pirabeiraba e convida a coordenação), que a rede
     passa a ver com a situação "Convite enviado".
   Tudo AGREGADO por escola: nem a operação nem a secretaria alcançam pessoa nenhuma (regra 10, item 8; D45; D64).
   100% sintético (D71). */

export type TipoRede = 'Particular' | 'Municipal' | 'Estadual'
export type Rede = { id: string; nome: string; tipo: TipoRede; cidade: string; escolas: number; criada?: boolean }

export const REDES: Rede[] = [
  { id: 'r-aurora', nome: 'Secretaria de Estado da Educação de SC', tipo: 'Estadual', cidade: 'Joinville · SC', escolas: 1 },
  { id: 'r-jlle', nome: 'Secretaria Municipal de Educação de Joinville', tipo: 'Municipal', cidade: 'Joinville · SC', escolas: 6 },
]
export const REDE_JOINVILLE = 'r-jlle'

export type SituacaoEscola = 'em-uso' | 'montando' | 'convite' | 'nova'
export const ROTULO_SITUACAO: Record<SituacaoEscola, string> = {
  'em-uso': 'Em uso', montando: 'Montando', convite: 'Convite enviado', nova: 'Sem convite',
}

export type EscolaDaRede = {
  id: string
  nome: string
  /** o nome sem "E. M." */
  curto: string
  slug: string
  situacao: SituacaoEscola
  alunos: number
  turmas: number
  professores: number
  /** % do que a IA gerou que passou por um professor (sempre 100: nada chega sem professor) */
  revisado: number
  /** % do que passou pelo professor e foi aprovado */
  aprovado: number
  criadaEm: string
}

/* As 6 escolas da rede municipal, de A a Z. Alunos: 980 + 820 + 900 + 712 = 3.412. Turmas: 30 + 26 + 28 + 22 = 106.
   A E. M. Rio Cachoeira é a segunda escola da professora Camila (9ºA, Ciências, à tarde). */
export const ESCOLAS_DA_REDE: EscolaDaRede[] = [
  { id: 'araucaria', nome: 'E. M. Araucária', curto: 'Araucária', slug: 'araucaria', situacao: 'em-uso', alunos: 980, turmas: 30, professores: 41, revisado: 100, aprovado: 93, criadaEm: '03/02/2026' },
  { id: 'bem-te-vi', nome: 'E. M. Bem-te-vi', curto: 'Bem-te-vi', slug: 'bem-te-vi', situacao: 'montando', alunos: 0, turmas: 0, professores: 0, revisado: 100, aprovado: 0, criadaEm: '08/09/2026' },
  { id: 'figueira', nome: 'E. M. Figueira', curto: 'Figueira', slug: 'figueira', situacao: 'convite', alunos: 0, turmas: 0, professores: 0, revisado: 100, aprovado: 0, criadaEm: '18/09/2026' },
  { id: 'ipe-amarelo', nome: 'E. M. Ipê Amarelo', curto: 'Ipê Amarelo', slug: 'ipe-amarelo', situacao: 'em-uso', alunos: 820, turmas: 26, professores: 35, revisado: 100, aprovado: 96, criadaEm: '05/02/2026' },
  { id: 'manaca', nome: 'E. M. Manacá', curto: 'Manacá', slug: 'manaca', situacao: 'em-uso', alunos: 900, turmas: 28, professores: 38, revisado: 100, aprovado: 91, criadaEm: '05/02/2026' },
  { id: 'cachoeira', nome: 'E. M. Rio Cachoeira', curto: 'Rio Cachoeira', slug: 'rio-cachoeira', situacao: 'em-uso', alunos: 712, turmas: 22, professores: 29, revisado: 100, aprovado: 97, criadaEm: '14/02/2026' },
]

/** O acerto médio por série e por disciplina, só da rede, sempre em agregado. Turmas: 28 + 27 + 26 + 25 = 106. */
export type DisciplinaRede = 'matematica' | 'ciencias' | 'portugues'
export const ACERTO_POR_SERIE: Record<DisciplinaRede, { serie: string; acerto: number; turmas: number }[]> = {
  matematica: [{ serie: '6º ano', acerto: 68, turmas: 28 }, { serie: '7º ano', acerto: 61, turmas: 27 }, { serie: '8º ano', acerto: 57, turmas: 26 }, { serie: '9º ano', acerto: 63, turmas: 25 }],
  ciencias: [{ serie: '6º ano', acerto: 72, turmas: 28 }, { serie: '7º ano', acerto: 66, turmas: 27 }, { serie: '8º ano', acerto: 64, turmas: 26 }, { serie: '9º ano', acerto: 59, turmas: 25 }],
  portugues: [{ serie: '6º ano', acerto: 70, turmas: 28 }, { serie: '7º ano', acerto: 69, turmas: 27 }, { serie: '8º ano', acerto: 62, turmas: 26 }, { serie: '9º ano', acerto: 65, turmas: 25 }],
}

/** Avisos do canal da lei respondidos no prazo, na rede toda, em setembro (mínimo de 5 para mostrar). */
export const AVISOS_DA_REDE = { respondidos: 12, total: 12 }

/* ── A operação: todas as escolas, de todas as redes ───────────────────────────────────────────────────── */

export type CoordenacaoDaEscola = 'ativa' | 'convite em aberto' | 'convite vencido' | 'sem convite'

export type EscolaDaOperacao = {
  id: string
  nome: string
  slug: string
  cidade: string
  redeId: string
  rede: string
  tipo: TipoRede
  coordenacao: CoordenacaoDaEscola
  /** "vale até 28/09", quando há convite em aberto */
  conviteAte?: string
  criadaEm: string
  alunos: number
  turmas: number
  professores: number
  /** nasceu na demonstração */
  criada?: boolean
}

const COORDENACAO_POR_SITUACAO: Record<SituacaoEscola, CoordenacaoDaEscola> = {
  'em-uso': 'ativa', montando: 'ativa', convite: 'convite em aberto', nova: 'sem convite',
}

export const ESCOLAS_ESTATICAS_DA_OPERACAO: EscolaDaOperacao[] = [
  { id: 'aurora', nome: 'Colégio Aurora', slug: 'colegio-aurora', cidade: 'Joinville · SC', redeId: 'r-aurora', rede: 'Secretaria de Estado da Educação de SC', tipo: 'Estadual',
    coordenacao: 'ativa', criadaEm: '26/01/2026', alunos: 612, turmas: 22, professores: 31 },
  ...ESCOLAS_DA_REDE.map((e): EscolaDaOperacao => ({
    id: e.id, nome: e.nome, slug: e.slug, cidade: 'Joinville · SC', redeId: REDE_JOINVILLE, rede: REDES[1].nome, tipo: 'Municipal',
    coordenacao: COORDENACAO_POR_SITUACAO[e.situacao], conviteAte: e.situacao === 'convite' ? 'vale até 25/09' : undefined,
    criadaEm: e.criadaEm, alunos: e.alunos, turmas: e.turmas, professores: e.professores,
  })),
]

/** Uso de setembro, por escola: só número agregado. */
export const USO_DE_SETEMBRO: Record<string, { alunosAtivos: number; trocasTutor: number; geracoes: number; custoIA: number; tetoIA: number }> = {
  aurora: { alunosAtivos: 588, trocasTutor: 41_230, geracoes: 1_912, custoIA: 1_486.4, tetoIA: 3_060 },
  araucaria: { alunosAtivos: 941, trocasTutor: 52_610, geracoes: 2_288, custoIA: 1_802.2, tetoIA: 4_900 },
  'bem-te-vi': { alunosAtivos: 0, trocasTutor: 0, geracoes: 0, custoIA: 0, tetoIA: 0 },
  figueira: { alunosAtivos: 0, trocasTutor: 0, geracoes: 0, custoIA: 0, tetoIA: 0 },
  'ipe-amarelo': { alunosAtivos: 774, trocasTutor: 39_118, geracoes: 1_706, custoIA: 1_344.9, tetoIA: 4_100 },
  manaca: { alunosAtivos: 858, trocasTutor: 47_005, geracoes: 2_015, custoIA: 1_611.5, tetoIA: 4_500 },
  cachoeira: { alunosAtivos: 668, trocasTutor: 30_874, geracoes: 1_344, custoIA: 1_052.9, tetoIA: 3_560 },
}

/** Uso de agosto, por escola (as mesmas escolas em uso, um pouco abaixo de setembro: o ano letivo voltava das
    férias). Mudou de casa (13ª rodada): era de `operacao/_dados.ts` e agora é a fonte da operação, da rede e do Analista. */
export const USO_DE_AGOSTO: Record<string, { alunosAtivos: number; trocasTutor: number; geracoes: number; custoIA: number; tetoIA: number }> = {
  aurora: { alunosAtivos: 571, trocasTutor: 38_412, geracoes: 1_788, custoIA: 1_391.7, tetoIA: 3_060 },
  araucaria: { alunosAtivos: 902, trocasTutor: 48_930, geracoes: 2_104, custoIA: 1_676.0, tetoIA: 4_900 },
  'ipe-amarelo': { alunosAtivos: 741, trocasTutor: 36_002, geracoes: 1_590, custoIA: 1_238.6, tetoIA: 4_100 },
  manaca: { alunosAtivos: 815, trocasTutor: 43_480, geracoes: 1_861, custoIA: 1_489.3, tetoIA: 4_500 },
  cachoeira: { alunosAtivos: 640, trocasTutor: 28_105, geracoes: 1_216, custoIA: 958.4, tetoIA: 3_560 },
}

/** Materiais que a IA preparou em setembro, por escola em uso (todos revisados por professor). Soma 1.616.
    Mudou de casa (13ª rodada): era `SAIDAS` de `outras/Rede.tsx`. */
export const SAIDAS_IA: Record<string, number> = { araucaria: 402, 'ipe-amarelo': 351, manaca: 377, cachoeira: 486 }

/* ── O que nasce na demonstração ───────────────────────────────────────────────────────────────────────── */

type EstadoOperacao = {
  criadas: EscolaDaOperacao[]
  redesCriadas: Rede[]
  /** convites de coordenação: escolaId → convite */
  convites: Record<string, { token: string; email: string; ate: string; estado: 'aberto' | 'revogado' }>
}

const fatia = criarFatia<EstadoOperacao>('operacao', { criadas: [], redesCriadas: [], convites: {} })

/** Hoje é 21/09; um convite vale 7 dias. */
const VALE_ATE = '28/09'

function sortear(n = 22) {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const b = new Uint8Array(n)
  try { crypto.getRandomValues(b) } catch { for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256) }
  return Array.from(b, (x) => alfabeto[x % alfabeto.length]).join('')
}

function aplicarConvites(lista: EscolaDaOperacao[], convites: EstadoOperacao['convites']): EscolaDaOperacao[] {
  return lista.map((e) => {
    const c = convites[e.id]
    if (!c) return e
    if (c.estado === 'revogado') return { ...e, coordenacao: 'sem convite', conviteAte: undefined }
    return { ...e, coordenacao: 'convite em aberto', conviteAte: `vale até ${c.ate}` }
  })
}

/** Todas as escolas da operação: as de sempre e as criadas na demonstração. */
export function useEscolasDaOperacao(): EscolaDaOperacao[] {
  const e = fatia.useValor()
  return useMemo(() => aplicarConvites([...ESCOLAS_ESTATICAS_DA_OPERACAO, ...e.criadas], e.convites), [e])
}

/** Todas as redes (as de sempre e as criadas), com a contagem de escolas. */
export function useRedes(): Rede[] {
  const e = fatia.useValor()
  return useMemo(() => [...REDES, ...e.redesCriadas].map((r) => ({
    ...r, escolas: [...ESCOLAS_ESTATICAS_DA_OPERACAO, ...e.criadas].filter((x) => x.redeId === r.id).length,
  })), [e])
}

const slugDe = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)

export const operacao = {
  /** Cria a escola (e, se pedir, a rede nova). Devolve o id da escola. */
  criarEscola({ nome, slug, cidade, redeId, novaRede }: {
    nome: string; slug?: string; cidade?: string; redeId?: string; novaRede?: { nome: string; tipo: TipoRede }
  }): string {
    const atual = fatia.ler()
    let rede = [...REDES, ...atual.redesCriadas].find((r) => r.id === redeId)
    let redesCriadas = atual.redesCriadas
    if (!rede && novaRede) {
      rede = { id: `r-${slugDe(novaRede.nome) || Date.now().toString(36)}`, nome: novaRede.nome.trim(), tipo: novaRede.tipo, cidade: cidade ?? 'Joinville · SC', escolas: 0, criada: true }
      redesCriadas = [...redesCriadas, rede]
    }
    const s = slugDe(slug || nome) || `escola-${Date.now().toString(36)}`
    const escola: EscolaDaOperacao = {
      id: s, nome: nome.trim(), slug: s, cidade: cidade ?? 'Joinville · SC',
      redeId: rede?.id ?? `r-${s}`, rede: rede?.nome ?? nome.trim(), tipo: rede?.tipo ?? 'Particular',
      coordenacao: 'sem convite', criadaEm: '21/09/2026', alunos: 0, turmas: 0, professores: 0, criada: true,
    }
    fatia.mudar((e) => ({ ...e, redesCriadas, criadas: [...e.criadas.filter((x) => x.id !== escola.id), escola] }))
    registrar('escola-criada', { escolaId: escola.id, nome: escola.nome, redeId: escola.redeId }, { nome: 'Equipe Turmma', papel: 'operacao' })
    return escola.id
  },
  /** Gera o convite da coordenação: só o e-mail (a operação não vê pessoa). O link aparece uma vez. */
  convidarCoordenacao(escolaId: string, email: string): { link: string; ate: string } {
    const token = sortear()
    fatia.mudar((e) => ({ ...e, convites: { ...e.convites, [escolaId]: { token, email: email.trim(), ate: VALE_ATE, estado: 'aberto' } } }))
    registrar('convite-coordenacao', { escolaId }, { nome: 'Equipe Turmma', papel: 'operacao' })
    return { link: `/convite?papel=coordenacao&escola=${escolaId}#${token}`, ate: VALE_ATE }
  },
  refazerConvite(escolaId: string): { link: string; ate: string } {
    const email = fatia.ler().convites[escolaId]?.email ?? ''
    return operacao.convidarCoordenacao(escolaId, email)
  },
  revogarConvite(escolaId: string) {
    fatia.mudar((e) => {
      const c = e.convites[escolaId]
      if (!c) return e
      return { ...e, convites: { ...e.convites, [escolaId]: { ...c, estado: 'revogado' } } }
    })
  },
  /** A escola de um convite de coordenação (para `/convite?papel=coordenacao`). */
  escolaDoConvite(token: string): EscolaDaOperacao | undefined {
    const e = fatia.ler()
    const id = Object.entries(e.convites).find(([, c]) => c.token === token && c.estado === 'aberto')?.[0]
    return id ? [...ESCOLAS_ESTATICAS_DA_OPERACAO, ...e.criadas].find((x) => x.id === id) : undefined
  },
}

/* ── A rede vista pela secretaria ──────────────────────────────────────────────────────────────────────── */

export type EscolaNaRede = EscolaDaRede & { criada?: boolean }

export type VistaDaRede = {
  numeros: {
    emUso: number
    total: number
    alunos: number
    revisado: number
    aprovado: number
    avisos: { respondidos: number; total: number }
  }
  /** de A a Z */
  escolas: EscolaNaRede[]
  acertoPorSerie: typeof ACERTO_POR_SERIE
}

/** Os 4 números, as escolas (com as criadas na demonstração) e o acerto por série. Só agregado. */
export function useRede(redeId = REDE_JOINVILLE): VistaDaRede {
  const e = fatia.useValor()
  return useMemo(() => {
    const criadas: EscolaNaRede[] = e.criadas.filter((x) => x.redeId === redeId).map((x) => ({
      id: x.id, nome: x.nome, curto: x.nome.replace(/^E\.\s*M\.\s*/, ''), slug: x.slug,
      situacao: e.convites[x.id]?.estado === 'aberto' ? 'convite' : 'nova',
      alunos: 0, turmas: 0, professores: 0, revisado: 100, aprovado: 0, criadaEm: x.criadaEm, criada: true,
    }))
    const escolas = [...ESCOLAS_DA_REDE, ...criadas].sort((a, b) => a.curto.localeCompare(b.curto, 'pt-BR'))
    const emUso = escolas.filter((x) => x.situacao === 'em-uso')
    const alunos = emUso.reduce((s, x) => s + x.alunos, 0)
    const aprovado = Math.round(emUso.reduce((s, x) => s + x.aprovado * x.alunos, 0) / Math.max(1, alunos))
    return {
      numeros: { emUso: emUso.length, total: escolas.length, alunos, revisado: 100, aprovado, avisos: AVISOS_DA_REDE },
      escolas,
      acertoPorSerie: ACERTO_POR_SERIE,
    }
  }, [e, redeId])
}
