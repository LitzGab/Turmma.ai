import * as React from 'react'
import { Check, ChevronDown, Copy, Pencil, Plus, RotateCcw, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Botao } from './botao'
import { Toque } from './toque'
import { MenuMais, type ItemMenuMais } from './menu'
import { AvatarIA, type AgenteIA } from './onca'

/* AS PEÇAS DA CONVERSA COM IA (15ª rodada, 06/10/2026). "Mais parecido com o de uma IA mesmo", na pele duo.
   Um conjunto só, usado pelo Tutor (aluno), pelo Assistente (professor) e pelo Analista (coordenação e rede):
   · BoasVindas: a saudação grande ("Bom dia, Camila") com a onça pequena ao lado, sem balão; um subtítulo curto.
   · AvisoIA: a linha pequena e cinza sob a caixa ("O Tutor é uma IA e pode errar · …"). Não fecha.
   · Sugestoes: até 4 pílulas sob a caixa.
   · MensagemUsuario: o balão cinza à direita, com Copiar e Editar ao passar o mouse.
   · RespostaIA: sem balão, o cabeçalho (a assinatura) e o texto corrido; chega palavra a palavra (EmFluxo) e, pronta,
     ganha Copiar · Refazer · 👍 · 👎 (e o que a tela somar, como "Salvar em Criados").
   · PensandoIA: a onça com os três pontos e "Pensando…".
   · useGeracao / ProvedorGeracao: a tela sabe quando há texto chegando, para o enviar virar o quadrado de PARAR.
   Com prefers-reduced-motion, nada chega aos poucos: a resposta aparece inteira. */

/* ── A saudação ────────────────────────────────────────────────────────────────────────────────────────── */

/** "Bom dia" · "Boa tarde" · "Boa noite", pela hora ("10h30" ou 10). */
export function saudacao(hora: string | number): string {
  const h = typeof hora === 'number' ? hora : parseInt(hora, 10)
  if (Number.isNaN(h) || h < 12) return 'Bom dia'
  return h < 18 ? 'Boa tarde' : 'Boa noite'
}

/** A conversa vazia: a onça pequena ao lado da saudação (o h1) e, embaixo, um subtítulo curto. */
export function BoasVindas({ agente, titulo, subtitulo, className }: {
  agente: AgenteIA; titulo: React.ReactNode; subtitulo?: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 text-center', className)}>
      <div className="flex max-w-full items-center justify-center gap-3 max-md:gap-2.5">
        <AvatarIA agente={agente} tamanho={44} className="max-md:size-9" />
        <h1 className="min-w-0 text-[32px] font-bold leading-[40px] tracking-[-.02em] text-tinta max-md:text-[26px] max-md:leading-[32px]">{titulo}</h1>
      </div>
      {subtitulo && <p className="t-corpo text-sutil">{subtitulo}</p>}
    </div>
  )
}

/** A linha pequena e cinza sob a caixa: o aviso de IA. Não fecha. */
export function AvisoIA({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="note" className={cn('px-2 text-center text-[13px] font-medium leading-[18px] text-sutil',
      '[&_a]:rounded-[4px] [&_a]:font-bold [&_a]:text-sutil [&_a]:underline [&_a]:decoration-borda-forte [&_a]:underline-offset-2 [&_a:hover]:text-tinta',
      '[&_button]:rounded-[4px] [&_button]:font-bold [&_button]:underline [&_button]:decoration-borda-forte [&_button]:underline-offset-2 [&_button:hover]:text-tinta', className)}>
      {children}
    </p>
  )
}

export type Sugestao = { rotulo: string; pergunta: string; icone?: React.ReactNode }

/** As pílulas sob a caixa (até 4). Quebram em linhas centradas; no celular, no máximo 2 linhas. */
export function Sugestoes({ itens, aoEscolher, rotulo = 'Sugestões', disabled, className }: {
  itens: Sugestao[]; aoEscolher: (s: Sugestao) => void; rotulo?: string; disabled?: boolean; className?: string
}) {
  return (
    <div role="group" aria-label={rotulo}
      className={cn('-mx-1 flex min-w-0 flex-wrap justify-center gap-2 px-1 max-md:max-h-[92px] max-md:overflow-hidden', className)}>
      {itens.slice(0, 4).map((s) => (
        <Toque key={s.pergunta} selecionado={false} aoMudar={() => aoEscolher(s)} disabled={disabled} icone={s.icone}
          className="min-w-0 max-w-full [&>.face]:min-w-0 [&>.face]:max-w-full [&>.face]:gap-1.5">
          <span className="min-w-0 truncate">{s.rotulo}</span>
        </Toque>
      ))}
    </div>
  )
}

/* ── O texto chegando ──────────────────────────────────────────────────────────────────────────────────── */

type CtxGeracao = { parada: number; marcar: (id: string, ativo: boolean) => void }
const Geracao = React.createContext<CtxGeracao | null>(null)

/** A tela que conversa: `escrevendo` diz se há resposta chegando; `parar` congela o que chegou até ali. */
export function useGeracao() {
  const [ativos, setAtivos] = React.useState<string[]>([])
  const [parada, setParada] = React.useState(0)
  const marcar = React.useCallback((id: string, ativo: boolean) => setAtivos((l) => {
    if (ativo) return l.includes(id) ? l : [...l, id]
    return l.includes(id) ? l.filter((x) => x !== id) : l
  }), [])
  const valor = React.useMemo(() => ({ parada, marcar }), [parada, marcar])
  const parar = React.useCallback(() => setParada((n) => n + 1), [])
  return { escrevendo: ativos.length > 0, parar, valor }
}

export function ProvedorGeracao({ valor, children }: { valor: CtxGeracao; children: React.ReactNode }) {
  return <Geracao.Provider value={valor}>{children}</Geracao.Provider>
}

export const movimentoReduzido = () =>
  typeof window !== 'undefined' && (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches)

/** Quantas "palavras" o texto tem: cada palavra de texto conta 1; um componente (chip, gráfico) conta 1, inteiro. */
function contar(n: React.ReactNode): number {
  if (n == null || typeof n === 'boolean') return 0
  if (typeof n === 'string') return n.split(/\s+/).filter(Boolean).length
  if (typeof n === 'number') return 1
  if (Array.isArray(n)) return n.reduce<number>((s, x) => s + contar(x), 0)
  if (React.isValidElement(n)) {
    if (typeof n.type === 'string' || n.type === React.Fragment) return contar((n.props as { children?: React.ReactNode }).children)
    return 1
  }
  return 0
}

/** O texto cortado nas primeiras `resta.v` palavras, com a mesma marcação (negrito, listas, tabelas). */
function cortar(n: React.ReactNode, resta: { v: number }): React.ReactNode {
  if (n == null || typeof n === 'boolean') return n
  if (resta.v <= 0) return null
  if (typeof n === 'string') {
    let saida = ''
    for (const p of n.split(/(\s+)/)) {
      if (!p) continue
      if (!p.trim()) { saida += p; continue }
      if (resta.v <= 0) break
      saida += p
      resta.v -= 1
    }
    return resta.v <= 0 ? saida.trimEnd() : saida
  }
  if (typeof n === 'number') { resta.v -= 1; return n }
  if (Array.isArray(n)) return n.map((x, i) => <React.Fragment key={i}>{cortar(x, resta)}</React.Fragment>)
  if (React.isValidElement(n)) {
    if (typeof n.type === 'string' || n.type === React.Fragment) {
      return React.cloneElement(n, undefined, cortar((n.props as { children?: React.ReactNode }).children, resta))
    }
    resta.v -= 1
    return n
  }
  return n
}

/** A resposta chegando palavra a palavra (simulado). `depois` (o gráfico, a fonte) aparece quando o texto termina.
    PARAR (useGeracao) congela no ponto em que estava. Com movimento reduzido, tudo de uma vez. */
export function EmFluxo({ ativo, children, depois, aoTerminar }: {
  ativo: boolean; children: React.ReactNode; depois?: React.ReactNode; aoTerminar?: () => void
}) {
  const ctx = React.useContext(Geracao)
  const id = React.useId()
  const total = contar(children)
  const totalRef = React.useRef(total)
  totalRef.current = total
  const [n, setN] = React.useState(() => (ativo && !movimentoReduzido() ? 0 : Infinity))
  const [parado, setParado] = React.useState(false)
  const paradaInicial = React.useRef(ctx?.parada ?? 0)
  const correndo = n !== Infinity && !parado
  const fim = React.useRef(aoTerminar)
  fim.current = aoTerminar

  React.useEffect(() => {
    if (!correndo) return
    ctx?.marcar(id, true)
    // ~1,5 s no máximo, por mais longa que seja a resposta
    const passo = Math.max(2, Math.ceil(totalRef.current / 50))
    const t = window.setInterval(() => setN((v) => (v + passo >= totalRef.current ? Infinity : v + passo)), 30)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correndo])
  React.useEffect(() => {
    if (correndo) return
    ctx?.marcar(id, false)
    fim.current?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correndo])
  React.useEffect(() => () => ctx?.marcar(id, false), [ctx, id])
  React.useEffect(() => {
    if (ctx && ctx.parada !== paradaInicial.current && n !== Infinity) setParado(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.parada])

  if (n === Infinity) return <>{children}{depois}</>
  return <>{cortar(children, { v: n })}</>
}

/* ── As ações ──────────────────────────────────────────────────────────────────────────────────────────── */

/** Um botão de ação de 32 px, só ícone (o rótulo vira aria-label e dica). */
export function Acao({ rotulo, onClick, pressionado, children, className }: {
  rotulo: string; onClick: () => void; pressionado?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <button type="button" aria-label={rotulo} title={rotulo} onClick={onClick} aria-pressed={pressionado}
      className={cn('grid size-8 place-items-center rounded-[8px] text-sutil transition-colors duration-150 hover:bg-fundo-suave hover:text-tinta [&_svg]:size-[18px]',
        pressionado && 'text-tinta [&_svg]:fill-current', className)}>
      {children}
    </button>
  )
}

function useCopiar() {
  const [copiado, setCopiado] = React.useState(false)
  React.useEffect(() => {
    if (!copiado) return
    const t = window.setTimeout(() => setCopiado(false), 1600)
    return () => window.clearTimeout(t)
  }, [copiado])
  const copiar = (texto: string) => {
    try { void navigator.clipboard?.writeText(texto).catch(() => {}) } catch { /* sem área de transferência */ }
    setCopiado(true)
  }
  return { copiado, copiar }
}

/** Copiar · Refazer · 👍 · 👎 e o que a tela somar. Aparecem ao passar o mouse; na última resposta, sempre. */
export function AcoesResposta({ alvo, aoRefazer, extra, sempre = false }: {
  alvo: React.RefObject<HTMLElement | null>; aoRefazer?: () => void; extra?: React.ReactNode; sempre?: boolean
}) {
  const { copiado, copiar } = useCopiar()
  const [voto, setVoto] = React.useState<'bom' | 'ruim' | null>(null)
  return (
    <div role="toolbar" aria-label="Ações da resposta"
      className={cn('-mb-1 -ml-1.5 -mt-1 flex flex-wrap items-center gap-0.5 transition-opacity duration-150',
        sempre ? 'opacity-100' : 'opacity-0 focus-within:opacity-100 group-hover/resposta:opacity-100 [@media(hover:none)]:opacity-100')}>
      <Acao rotulo={copiado ? 'Copiado' : 'Copiar'} onClick={() => copiar(alvo.current?.innerText ?? '')}>
        {copiado ? <Check strokeWidth={2.5} /> : <Copy strokeWidth={2.25} />}
      </Acao>
      {aoRefazer && <Acao rotulo="Refazer" onClick={aoRefazer}><RotateCcw strokeWidth={2.25} /></Acao>}
      <Acao rotulo="Boa resposta" pressionado={voto === 'bom'} onClick={() => setVoto((v) => (v === 'bom' ? null : 'bom'))}><ThumbsUp strokeWidth={2.25} /></Acao>
      <Acao rotulo="Resposta ruim" pressionado={voto === 'ruim'} onClick={() => setVoto((v) => (v === 'ruim' ? null : 'ruim'))}><ThumbsDown strokeWidth={2.25} /></Acao>
      {extra}
      {voto && <span role="status" className="ml-1 text-[13px] font-medium text-sutil">Obrigado. Isso ajuda a escola a ajustar.</span>}
    </div>
  )
}

/* ── As mensagens ──────────────────────────────────────────────────────────────────────────────────────── */

/** Quem escreve: o balão cinza à direita. Ao passar o mouse, Copiar e (quando a tela deixa) Editar, que reabre o
    texto no lugar; ENVIAR manda a pergunta corrigida e a conversa recomeça dali. */
export function MensagemUsuario({ texto, aoEditar, anexos, calmo = false, className, ...resto }: {
  texto: string; aoEditar?: (novo: string) => void; anexos?: string[]; calmo?: boolean; className?: string
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>) {
  const { copiado, copiar } = useCopiar()
  const [editando, setEditando] = React.useState(false)
  const [rascunho, setRascunho] = React.useState(texto)
  const salvar = () => {
    const t = rascunho.trim()
    if (!t) return
    setEditando(false)
    if (t !== texto.trim()) aoEditar?.(t)
  }
  if (editando) {
    return (
      <div className={cn('flex justify-end', className)} {...resto}>
        <div className="w-full max-w-[85%] rounded-[20px] border-2 border-azul-borda bg-fundo-suave p-3">
          <label className="sr-only" htmlFor={`${resto.id ?? 'editar'}-campo`}>Editar a mensagem</label>
          <textarea id={`${resto.id ?? 'editar'}-campo`} autoFocus value={rascunho} onChange={(e) => setRascunho(e.target.value)}
            rows={Math.min(6, Math.max(1, rascunho.split('\n').length))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); salvar() }
              if (e.key === 'Escape') { setRascunho(texto); setEditando(false) }
            }}
            className="w-full resize-none bg-transparent px-1 text-[17px] font-medium leading-[25px] text-tinta outline-none" />
          <div className="mt-2 flex justify-end gap-2">
            <Botao variante="secundario" tamanho="p" onClick={() => { setRascunho(texto); setEditando(false) }}>Cancelar</Botao>
            <Botao variante="oficial" tamanho="p" disabled={!rascunho.trim()} onClick={salvar}>Enviar</Botao>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={cn('group/pergunta relative flex flex-col items-end gap-1', !calmo && 'animate-entra', className)} {...resto}>
      {anexos && anexos.length > 0 && (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
          {anexos.map((a) => <span key={a} className="rounded-[10px] border-2 border-borda px-2.5 py-1 text-[14px] font-bold text-apoio">{a}</span>)}
        </div>
      )}
      <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] bg-fundo-suave px-4 py-2.5 text-[17px] font-medium leading-[25px] text-tinta">{texto}</p>
      <div className="absolute right-0 top-full z-[1] -mr-1 mt-0.5 flex gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover/pergunta:opacity-100 [@media(hover:none)]:opacity-100">
        <Acao rotulo={copiado ? 'Copiado' : 'Copiar a mensagem'} onClick={() => copiar(texto)}>{copiado ? <Check strokeWidth={2.5} /> : <Copy strokeWidth={2.25} />}</Acao>
        {aoEditar && <Acao rotulo="Editar a mensagem" onClick={() => { setRascunho(texto); setEditando(true) }}><Pencil strokeWidth={2.25} /></Acao>}
      </div>
    </div>
  )
}

/** A IA não tem balão: o cabeçalho (a assinatura), o texto em largura total e, pronta a resposta, as ações.
    `fluxo`: chega palavra a palavra. `depois`: o que aparece quando o texto termina (o gráfico, a fonte, os botões).
    REFAZER mostra "Pensando…" por um instante e escreve de novo. */
export function RespostaIA({ cabecalho, children, depois, rodape, fluxo = false, acoes, ultima = false, calmo = false, className, agente }: {
  cabecalho?: React.ReactNode
  children: React.ReactNode
  depois?: React.ReactNode
  rodape?: React.ReactNode
  fluxo?: boolean
  /** false: sem a barra de ações (cartões que já têm os próprios botões) */
  acoes?: false | { refazer?: boolean; extra?: React.ReactNode }
  /** a última resposta mostra as ações sem passar o mouse */
  ultima?: boolean
  calmo?: boolean
  className?: string
  /** para o "Pensando…" do Refazer */
  agente?: AgenteIA
}) {
  const [versao, setVersao] = React.useState(0)
  const [refazendo, setRefazendo] = React.useState(false)
  const [pronta, setPronta] = React.useState(!fluxo)
  const corpo = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!refazendo) return
    const t = window.setTimeout(() => { setRefazendo(false); setPronta(false); setVersao((v) => v + 1) }, 800)
    return () => window.clearTimeout(t)
  }, [refazendo])
  return (
    <div data-resposta className={cn('group/resposta grid min-w-0 gap-2.5', !calmo && 'animate-entra', className)}>
      {cabecalho}
      {refazendo ? (
        <PontosPensando agente={agente} />
      ) : (
        <div ref={corpo} className="min-w-0 text-[17px] font-medium leading-[26px] text-tinta">
          <EmFluxo key={versao} ativo={fluxo || versao > 0} depois={depois} aoTerminar={() => setPronta(true)}>{children}</EmFluxo>
        </div>
      )}
      {rodape}
      {acoes && pronta && !refazendo && (
        <AcoesResposta alvo={corpo} sempre={ultima} extra={acoes.extra}
          aoRefazer={acoes.refazer === false ? undefined : () => setRefazendo(true)} />
      )}
    </div>
  )
}

/** Os três pontos dentro da resposta (o Refazer). */
function PontosPensando({ agente }: { agente?: AgenteIA }) {
  return (
    <span role="status" className="flex h-[26px] items-center gap-2 text-[16px] font-medium text-sutil">
      {agente && <span className="sr-only">Pensando</span>}
      <span aria-hidden className="brilho-pensando">Pensando…</span>
    </span>
  )
}

/** "Pensando": a onça com os três pontos (o laço que mostra trabalho acontecendo) e o texto que brilha. */
export function PensandoIA({ agente, texto = 'Pensando…', className }: { agente: AgenteIA; texto?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('flex items-center gap-2.5 animate-entra', className)}>
      <AvatarIA agente={agente} tamanho={32} pensando />
      <span className="brilho-pensando text-[16px] font-medium leading-6 text-sutil">{texto}</span>
    </div>
  )
}

/* ── O anexo ───────────────────────────────────────────────────────────────────────────────────────────── */

export type Anexo = { id: string; nome: string; tamanho?: number }

/** Os anexos da caixa (vivem só nesta conversa). */
export function useAnexos() {
  const [anexos, setAnexos] = React.useState<Anexo[]>([])
  return {
    anexos,
    anexar: (arquivos: FileList | null) => {
      if (!arquivos?.length) return
      const novos = [...arquivos].map((f) => ({ id: `${f.name}-${f.size}-${f.lastModified}`, nome: f.name, tamanho: f.size }))
      setAnexos((l) => [...l, ...novos.filter((n) => !l.some((a) => a.id === n.id))])
    },
    tirar: (id: string) => setAnexos((l) => l.filter((a) => a.id !== id)),
    limpar: () => setAnexos([]),
  }
}

/** O "+" da caixa: abre a escolha do arquivo. */
export function BotaoAnexar({ aoEscolher, aceita, rotulo = 'Anexar arquivo' }: {
  aoEscolher: (arquivos: FileList | null) => void; aceita?: string; rotulo?: string
}) {
  const campo = React.useRef<HTMLInputElement>(null)
  return (
    <>
      <button type="button" aria-label={rotulo} title={rotulo} onClick={() => campo.current?.click()}
        className="grid size-9 place-items-center rounded-full border-2 border-borda bg-campo text-apoio transition-colors duration-150 hover:border-borda-forte hover:bg-fundo-suave hover:text-tinta">
        <Plus className="size-5" strokeWidth={2.5} />
      </button>
      <input ref={campo} type="file" accept={aceita} multiple hidden tabIndex={-1}
        onChange={(e) => { aoEscolher(e.target.files); e.target.value = '' }} />
    </>
  )
}

/* ── O título da conversa ──────────────────────────────────────────────────────────────────────────────── */

/** O título no topo da conversa, com o menu (Renomear · o que a tela somar · Apagar). Renomear troca o título por um
    campo no lugar; Enter salva, Esc desiste. */
export function TituloComMenu({ titulo, aoRenomear, aoApagar, extras }: {
  titulo: string; aoRenomear?: (novo: string) => void; aoApagar?: () => void; extras?: ItemMenuMais[]
}) {
  const [editando, setEditando] = React.useState(false)
  const [valor, setValor] = React.useState(titulo)
  if (editando) {
    const salvar = () => { setEditando(false); if (valor.trim() && valor.trim() !== titulo) aoRenomear?.(valor.trim()) }
    return (
      <form className="min-w-0 flex-1" onSubmit={(e) => { e.preventDefault(); salvar() }}>
        <input autoFocus value={valor} onChange={(e) => setValor(e.target.value)} onBlur={salvar} aria-label="Nome da conversa"
          onKeyDown={(e) => { if (e.key === 'Escape') { setValor(titulo); setEditando(false) } }}
          className="t-cartao h-10 w-full max-w-[420px] rounded-[12px] border-2 border-azul-borda bg-campo px-3 text-tinta outline-none" />
      </form>
    )
  }
  const itens: ItemMenuMais[] = [
    ...(aoRenomear ? [{ rotulo: 'Renomear', icone: <Pencil strokeWidth={2.5} />, aoEscolher: () => { setValor(titulo); setEditando(true) } }] : []),
    ...(extras ?? []),
    ...(aoApagar ? [{ rotulo: 'Apagar', icone: <Trash2 strokeWidth={2.5} />, perigo: true, aoEscolher: aoApagar }] : []),
  ]
  if (!itens.length) return <span className="truncate">{titulo}</span>
  return (
    <MenuMais itens={itens} alinhar="start" rotulo={`Opções da conversa ${titulo}`}
      gatilho={(
        <button type="button" aria-label={`${titulo}, opções da conversa`}
          className="-ml-2 flex h-10 min-w-0 max-w-full items-center gap-1 rounded-[12px] px-2 text-left transition-colors duration-150 hover:bg-fundo-suave data-[state=open]:bg-fundo-suave">
          <span className="min-w-0 truncate">{titulo}</span>
          <ChevronDown aria-hidden className="size-[18px] shrink-0 text-sutil" strokeWidth={2.5} />
        </button>
      )} />
  )
}
