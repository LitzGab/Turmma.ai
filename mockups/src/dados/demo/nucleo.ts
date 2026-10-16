import { useMemo, useSyncExternalStore } from 'react'

/* O NÚCLEO DO ESTADO DA DEMONSTRAÇÃO (12ª rodada, 04/10/2026; pesquisa/polimento/plano.md, seção 4).

   Um estado só para os papéis conversarem. Cada FATIA mora na memória e em localStorage['turmma-demo-v2:<nome>']:
   · recarregar não apaga nada (a demonstração continua de onde parou);
   · duas abas abertas (o aluno numa, o professor noutra) andam juntas, ao vivo, pelo evento `storage`;
   · no modo privado, ou com o armazenamento bloqueado, tudo segue só na memória (try/catch em toda leitura e escrita).
   Cada ação de um papel vira um EVENTO (`registrar`): ele avança o relógio 1 minuto ("Aprovado por Camila Souza ·
   21/09, 10h44"), guarda quem fez e é o que o Mapa lê para marcar o ✓ de cada passo.
   "Recomeçar a demonstração" apaga tudo, inclusive as chaves antigas, e recarrega todas as abas.

   SÓ NO MOCKUP. No produto, isto é estado de servidor (regra 10; regra 50, itens 3 e 7). */

const PREFIXO = 'turmma-demo-v2:'
const CHAVE_RECOMECO = `${PREFIXO}recomeco`
const CHAVES_ANTIGAS = ['turmma-mockup-conversas-v1', 'turmma-mockup-criados-v1', 'turmma-mockup-escola-v1', 'turmma-mockup-favoritas-v1']
const SESSAO_ANTIGA = ['turmma-onca-acenou']

const temJanela = typeof window !== 'undefined'

function lerArmazenado<T>(chave: string): T | undefined {
  if (!temJanela) return undefined
  try {
    const bruto = window.localStorage.getItem(chave)
    return bruto === null ? undefined : (JSON.parse(bruto) as T)
  } catch { return undefined }
}

function gravar(chave: string, valor: unknown) {
  if (!temJanela) return
  try { window.localStorage.setItem(chave, JSON.stringify(valor)) } catch { /* modo privado: fica só na memória */ }
}

export type Fatia<T> = {
  nome: string
  /** o valor de agora, fora do React */
  ler: () => T
  /** troca o valor (função pura do anterior), grava e avisa quem lê */
  mudar: (f: (anterior: T) => T) => void
  /** o hook que relê quando a fatia muda (nesta aba ou noutra) */
  useValor: () => T
}

/** Uma fatia do estado: memória + localStorage, com o evento `storage` para duas abas andarem juntas. */
export function criarFatia<T>(nome: string, inicial: T): Fatia<T> {
  const chave = PREFIXO + nome
  let valor: T = lerArmazenado<T>(chave) ?? inicial
  const ouvintes = new Set<() => void>()
  const publicar = () => ouvintes.forEach((f) => f())
  const assinar = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f) } }
  const ler = () => valor

  if (temJanela) {
    window.addEventListener('storage', (e) => {
      if (e.key !== chave) return
      try { valor = e.newValue === null ? inicial : (JSON.parse(e.newValue) as T) } catch { valor = inicial }
      publicar()
    })
  }

  return {
    nome,
    ler,
    mudar(f) {
      const proximo = f(valor)
      if (Object.is(proximo, valor)) return
      valor = proximo
      gravar(chave, valor)
      publicar()
    },
    useValor: () => useSyncExternalStore(assinar, ler, ler),
  }
}

/* ── O relógio da demonstração: segunda-feira, 21/09/2026, 10h42; anda 1 minuto a cada evento ──────────── */

export type Momento = {
  /** "21/09" */
  dia: string
  /** "10h42" */
  hora: string
  /** "21/09, 10h42" */
  rotulo: string
  /** minutos desde o começo da demonstração: serve para ordenar */
  ordem: number
}

const COMECO = new Date(2026, 8, 21, 10, 42).getTime()
const relogio = criarFatia<number>('relogio', 0)

const dois = (n: number) => String(n).padStart(2, '0')

/** O momento de uma ordem (minutos depois de 21/09, 10h42). */
export function momentoDe(ordem: number): Momento {
  const d = new Date(COMECO + ordem * 60_000)
  const dia = `${dois(d.getDate())}/${dois(d.getMonth() + 1)}`
  const hora = `${d.getHours()}h${dois(d.getMinutes())}`
  return { dia, hora, rotulo: `${dia}, ${hora}`, ordem }
}

/** O agora da demonstração. */
export function agora(): Momento {
  return momentoDe(relogio.ler())
}

/** O agora, como hook (relê quando um evento faz o relógio andar). */
export function useAgora(): Momento {
  const ordem = relogio.useValor()
  return useMemo(() => momentoDe(ordem), [ordem])
}

/* ── Os eventos ────────────────────────────────────────────────────────────────────────────────────────── */

export type TipoEvento =
  | 'pedido-nome' | 'pedidos-decididos' | 'aluno-entrou' | 'onboarding-visto' | 'introducao-vista'
  | 'lista-gravada' | 'turma-criada'
  | 'professor-convidado' | 'convite-refeito' | 'convite-revogado' | 'convite-aceito'
  | 'turma-confirmada' | 'turma-contestada' | 'alocacao-corrigida' | 'turma-acrescentada'
  | 'acesso-gerado' | 'acesso-revogado'
  | 'documento-gerado' | 'documento-enviado' | 'documento-recusado' | 'adaptada-gerada'
  | 'tarefa-respondida' | 'tarefa-entregue' | 'leitura-feita' | 'prova-saida'
  | 'notas-aprovadas' | 'notas-recusadas'
  | 'revisao-pedida' | 'revisao-respondida'
  | 'aviso-enviado' | 'aviso-respondido' | 'conteudo-retirado' | 'trecho-aberto' | 'conselho-tutelar'
  | 'assunto-delicado' | 'titular-pedido' | 'titular-atendido'
  | 'ia-pausada' | 'ia-reativada' | 'alerta-visto' | 'dados-com-nome'
  | 'sinal-visto' | 'sinal-contestado' | 'atencao-vista' | 'conversa-aberta'
  | 'material-enviado' | 'material-reenviado' | 'material-retirado'
  | 'adaptacao-registrada' | 'adaptacao-encerrada'
  | 'equipe-mudou' | 'encarregado-indicado'
  | 'escola-criada' | 'convite-coordenacao'
  | 'exportacao'

export type PapelEvento = 'aluno' | 'professor' | 'coordenacao' | 'operacao' | 'rede' | 'publico' | 'sistema'

export type QuemFez = { nome: string; papel: PapelEvento }

export type Evento = {
  id: string
  tipo: TipoEvento
  quando: Momento
  quem: QuemFez
  dados: Record<string, unknown>
}

const eventos = criarFatia<Evento[]>('eventos', [])

/** Quem fez, quando a ação não diz: a sessão (dados/sessao.ts) se registra aqui. */
let quemPadrao: (tipo: TipoEvento) => QuemFez = () => ({ nome: 'Turmma', papel: 'sistema' })
export function definirQuemPadrao(f: (tipo: TipoEvento) => QuemFez) { quemPadrao = f }

/** Registra o evento, avança o relógio 1 minuto e devolve o evento (com o momento em que aconteceu). */
export function registrar(tipo: TipoEvento, dados: Record<string, unknown> = {}, quem?: QuemFez): Evento {
  relogio.mudar((m) => m + 1)
  const quando = agora()
  const ev: Evento = { id: `e${quando.ordem}-${Math.random().toString(36).slice(2, 6)}`, tipo, quando, quem: quem ?? quemPadrao(tipo), dados }
  eventos.mudar((l) => [...l, ev])
  return ev
}

/** Todos os eventos, do mais antigo para o mais novo. */
export function useEventos(): Evento[] {
  return eventos.useValor()
}

/** Leitura fora do React. */
export const lerEventos = () => eventos.ler()

/** Já aconteceu um evento deste tipo (que passe no filtro)? É o ✓ do Mapa. */
export function useAconteceu(tipo: TipoEvento, filtro?: (e: Evento) => boolean): boolean {
  const lista = eventos.useValor()
  return lista.some((e) => e.tipo === tipo && (!filtro || filtro(e)))
}

/* ── Recomeçar ─────────────────────────────────────────────────────────────────────────────────────────── */

/** Apaga todas as fatias e as chaves antigas, avisa as outras abas e recarrega esta. */
export function recomecarDemonstracao() {
  if (!temJanela) return
  try {
    const apagar: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && (k.startsWith(PREFIXO) || CHAVES_ANTIGAS.includes(k))) apagar.push(k)
    }
    apagar.forEach((k) => window.localStorage.removeItem(k))
    window.localStorage.setItem(CHAVE_RECOMECO, String(Date.now()))
  } catch { /* modo privado: recarregar já basta */ }
  try { SESSAO_ANTIGA.forEach((k) => window.sessionStorage.removeItem(k)) } catch { /* idem */ }
  window.location.reload()
}

// as outras abas recarregam quando veem o recomeço
if (temJanela) {
  window.addEventListener('storage', (e) => { if (e.key === CHAVE_RECOMECO && e.newValue) window.location.reload() })
}

const marcaDoRecomeco = Number(lerArmazenado<number>(CHAVE_RECOMECO) ?? 0)

/** Um número que muda a cada recomeço (serve de `key` para zerar estado local de tela). */
export function useRecomeco(): number {
  return marcaDoRecomeco
}
