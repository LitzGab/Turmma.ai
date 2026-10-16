import { useCallback, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { BotaoIcone, Contador, EstadoVazio, LadrilhoIcone, Selo, TIPO_FILA, Toque } from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Onca } from '@/components/duo/onca'
import { PainelLado } from '@/components/turmma/painel-lado'
import { TURMAS } from '@/dados/escola'
import { TURMAS_DA_ESCOLA } from '@/dados/estrutura'
import { useCartoesDaFila, type ItemFila, type PapelFila } from '@/dados/fila'
import { useTurmasDoProfessor } from '@/dados/turmas-professora'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/* O SINO (14ª rodada, 05/10/2026; plano ux-composicao, seção 1.7). "Esperando você" sai do Início e vira um sino no
   canto de cima, em TODA tela do professor e da coordenação.
   · O número é o tamanho da fila (os cartões: os pedidos de turmas diferentes contam um), num Contador laranja p no
     canto do sino. É o único número laranja da casca (R9). Sem item, sem número.
   · A lista: popover de 400 px ancorado no sino, até a altura livre da janela (até 720), rolando por dentro; no celular, um
     painel de altura cheia. Cabeçalho "Esperando você" e o contador; o filtro por turma quando há itens de 2 ou mais
     turmas; grupos na ordem Urgente → por turma (na ordem das turmas do professor; na coordenação, na da escola) →
     De várias turmas → Da escola. Linha de 56 px. Vazio: a onça dormindo e "Tudo em dia".
   · Abrir um item fecha a lista: o que tem rota navega; o que não tem abre o painel do item POR CIMA da tela atual
     (?item=<id>), desenhado pela Casca.
   · Pelo endereço: ?sino=1 abre; ?sino=<turmaId> abre filtrado (o "5 esperando" da turma). Esc fecha e devolve o foco.
   Os rótulos curtos (curtoDoCartao, urgenteMaisNovoPrimeiro, comNumero) foram COPIADOS do antigo Início do professor
   e do da coordenação, que saem da fila. */

type PapelSino = Extract<PapelFila, 'professor' | 'coordenacao'>

/* ── Os rótulos curtos ───────────────────────────────────────────────────────────────────────────────────── */

/** O título curto do professor: duas provas em espera não se confundem ("Notas · prova de mol") e a atenção não se
    corta ("Olívia · atenção"). */
export function curtoDoCartao(i: ItemFila): ItemFila {
  if (i.tipo === 'notas') {
    const doc = i.titulo.replace(/^Aprovar as notas d[ao] /i, '')
    const nome = doc.replace(/^(prova|lista)( de)? /i, '').split(' e ')[0]
    const tipo = /^lista/i.test(doc) ? 'lista' : 'prova'
    const longo = `Notas · ${tipo} de ${nome}`
    return { ...i, curto: longo.length <= 22 ? longo : `Notas · ${nome}` }
  }
  if (i.tipo === 'atencao') return { ...i, curto: `${i.titulo.replace(/ precisa de atenção$/, '').split(' ')[0]} · atenção` }
  if (i.tipo === 'material' && /adaptad/i.test(i.curto ?? i.titulo)) return { ...i, curto: 'Prova adaptada' }
  // o cartão dos pedidos de várias turmas diz quantas ("Pedidos para entrar · 3 turmas")
  if (i.tipo === 'pedidos' && i.subitens && new Set(i.subitens.map((x) => x.turmaId)).size > 1) {
    return { ...i, curto: `${i.curto ?? 'Pedidos para entrar'} · ${new Set(i.subitens.map((x) => x.turmaId)).size} turmas` }
  }
  return i
}

/** Entre os urgentes, o mais novo primeiro (o caso que acabou de chegar fica no topo). */
export function urgenteMaisNovoPrimeiro(itens: ItemFila[]): ItemFila[] {
  const urgentes = itens.filter((i) => i.urgente)
  return urgentes.length > 1 ? [...[...urgentes].reverse(), ...itens.filter((i) => !i.urgente)] : itens
}

/** Na coordenação: com dois ou mais do mesmo tipo, o número na frente ("Encaminhamento 32", "Pedido 34"). */
export function comNumero(itens: ItemFila[], largo = true): ItemFila[] {
  const quantos = (t: ItemFila['tipo']) => itens.filter((i) => i.tipo === t).length
  return itens.map((i) => {
    const n = /(?:aviso|risco|titular)-0*(\d+)$/.exec(i.id)?.[1]
    if (i.tipo === 'titular') return { ...i, curto: n && quantos('titular') > 1 ? `Pedido ${n}` : largo ? 'Pedido sobre dados' : 'Pedido de dados' }
    if (!n) return i
    if (i.tipo === 'risco') {
      if (!largo && quantos('risco') < 2) return i
      return { ...i, curto: largo ? `Encaminhamento ${n}` : `${n} · Encaminh.` }
    }
    if (i.tipo === 'aviso' && itens.filter((x) => x.curto === i.curto).length > 1) return { ...i, curto: `Aviso ${n}` }
    return i
  })
}

/** Os itens do sino, já com os rótulos curtos. */
export function useItensDoSino(papel: PapelSino): ItemFila[] {
  // O número é o tamanho da fila (useCartoesDaFila), só: os documentos para aprovar moram no filtro "Para aprovar"
  // de Criados (a prova original e a adaptada apareciam como duas linhas da mesma prova).
  const brutos = useCartoesDaFila(papel)
  return useMemo(() => (papel === 'professor' ? urgenteMaisNovoPrimeiro(brutos).map(curtoDoCartao) : comNumero(brutos)), [brutos, papel])
}

/* ── Abrir pelo endereço ─────────────────────────────────────────────────────────────────────────────────── */

/** Abre a lista: `?sino=1`, ou `?sino=<turmaId>` já filtrada. */
export function useAbrirSino(): (turmaId?: string) => void {
  const [, setParams] = useSearchParams()
  return useCallback((turmaId?: string) => {
    setParams((a) => { const p = new URLSearchParams(a); p.set('sino', turmaId ?? '1'); return p }, { replace: true })
  }, [setParams])
}

/** Abre um item: com rota, navega; sem rota, põe ?item=<id> no endereço atual (a Casca desenha o painel). */
export function useAbrirItemDoSino(): (item: ItemFila) => void {
  const navegar = useNavigate()
  const { pathname, search } = useLocation()
  return useCallback((item: ItemFila) => {
    const p = new URLSearchParams(search)
    p.delete('sino')
    if (item.para) { navegar(item.para); return }
    p.set('item', item.id)
    p.delete('contestar')
    navegar(`${pathname}?${p.toString()}`, { replace: true })
  }, [navegar, pathname, search])
}

/* ── Os grupos ───────────────────────────────────────────────────────────────────────────────────────────── */

type GrupoSino = { id: string; titulo: string; itens: ItemFila[] }

const turmasDoItem = (i: ItemFila): string[] => {
  if (i.subitens?.length) return [...new Set(i.subitens.map((s) => s.turmaId).filter((x): x is string => !!x))]
  return i.turmaId ? [i.turmaId] : []
}

const nomeDaTurma = (id: string) => TURMAS.find((t) => t.id === id)?.nome ?? TURMAS_DA_ESCOLA.find((t) => t.id === id)?.nome ?? id
const materiaDaTurma = (id: string, itens: ItemFila[]) => TURMAS.find((t) => t.id === id)?.disciplina ?? itens.find((i) => i.turmaId === id)?.materia

function agrupar(itens: ItemFila[], ordemTurmas: string[]): GrupoSino[] {
  const urgentes = itens.filter((i) => i.urgente || i.prazo)
  const resto = itens.filter((i) => !(i.urgente || i.prazo))
  const varias = resto.filter((i) => turmasDoItem(i).length > 1)
  const daEscola = resto.filter((i) => turmasDoItem(i).length === 0)
  const porTurma = new Map<string, ItemFila[]>()
  for (const i of resto) {
    const ts = turmasDoItem(i)
    if (ts.length !== 1) continue
    porTurma.set(ts[0], [...(porTurma.get(ts[0]) ?? []), i])
  }
  const pos = (id: string) => { const k = ordemTurmas.indexOf(id); return k < 0 ? 999 : k }
  const turmas = [...porTurma.keys()].sort((a, b) => pos(a) - pos(b) || nomeDaTurma(a).localeCompare(nomeDaTurma(b), 'pt-BR'))
  const grupos: GrupoSino[] = []
  if (urgentes.length) grupos.push({ id: 'urgente', titulo: 'Urgente', itens: urgentes })
  for (const t of turmas) {
    const m = materiaDaTurma(t, itens)
    grupos.push({ id: t, titulo: m ? `${nomeDaTurma(t)} · ${m}` : nomeDaTurma(t), itens: porTurma.get(t)! })
  }
  if (varias.length) grupos.push({ id: 'varias', titulo: 'De várias turmas', itens: varias })
  if (daEscola.length) grupos.push({ id: 'escola', titulo: 'Da escola', itens: daEscola })
  return grupos
}

/* ── A linha ─────────────────────────────────────────────────────────────────────────────────────────────── */

function LinhaSino({ item, aoAbrir }: { item: ItemFila; aoAbrir: (i: ItemFila) => void }) {
  const tipo = TIPO_FILA[item.tipo]
  return (
    <li>
      <button type="button" onClick={() => aoAbrir(item)} title={item.titulo}
        aria-label={[item.titulo, item.turma, item.prazo, item.urgente ? 'urgente' : null].filter(Boolean).join(' · ')}
        className="flex h-14 w-full items-center gap-3 rounded-[12px] px-3 text-left transition-colors duration-150 hover:bg-fundo-suave">
        <LadrilhoIcone familia={tipo.familia} tamanho={32} icone={<Icone id={tipo.icone} tamanho={24} familia={tipo.familia} />} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="t-cartao truncate text-tinta">{item.curto ?? item.titulo}</span>
          {item.urgente && item.quando && <span className="truncate text-[14px] font-medium leading-[18px] text-sutil">{item.turma ? `${item.turma} · ` : ''}{item.quando}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {item.n !== undefined && !item.prazo && !item.urgente && <Contador n={item.n} tamanho="p" familia={tipo.familia} rotulo="" />}
          {item.prazo
            ? <Selo familia="vermelho" tamanho="p">{item.prazo}</Selo>
            : item.urgente ? <Selo familia="vermelho" tamanho="p">Urgente</Selo> : null}
        </span>
      </button>
    </li>
  )
}

/* ── A lista ─────────────────────────────────────────────────────────────────────────────────────────────── */

function ListaSino({ papel, itens, filtro, aoFiltrar, aoAbrir, aoFechar, celular }: {
  papel: PapelSino
  itens: ItemFila[]
  filtro: string | null
  aoFiltrar: (t: string | null) => void
  aoAbrir: (i: ItemFila) => void
  aoFechar: () => void
  celular: boolean
}) {
  const turmasProf = useTurmasDoProfessor()
  const ordem = papel === 'professor' ? turmasProf.map((t) => t.id) : TURMAS_DA_ESCOLA.map((t) => t.id)
  const todasTurmas = [...new Set(itens.flatMap(turmasDoItem))]
    .sort((a, b) => { const pa = ordem.indexOf(a), pb = ordem.indexOf(b); return (pa < 0 ? 999 : pa) - (pb < 0 ? 999 : pb) })
  const visiveis = filtro ? itens.filter((i) => turmasDoItem(i).includes(filtro)) : itens
  const grupos = agrupar(visiveis, ordem)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!celular && (
        <header className="flex h-14 shrink-0 items-center gap-2.5 border-b-2 border-borda pl-4 pr-2">
          <h2 className="t-cartao text-tinta">Esperando você</h2>
          {itens.length > 0 && <Contador n={itens.length} tamanho="p" rotulo="esperando você" />}
          <BotaoIcone rotulo="Fechar" dica={false} className="ml-auto" onClick={aoFechar}><X strokeWidth={2.5} /></BotaoIcone>
        </header>
      )}
      {todasTurmas.length >= 2 && (
        <div role="group" aria-label="Filtrar por turma"
          className={cn('flex shrink-0 gap-2 border-b-2 border-borda px-4 py-3', 'flex-wrap')}>
          <Toque selecionado={!filtro} aoMudar={() => aoFiltrar(null)}>Todas</Toque>
          {todasTurmas.map((t) => <Toque key={t} selecionado={filtro === t} aoMudar={() => aoFiltrar(t)}>{nomeDaTurma(t)}</Toque>)}
        </div>
      )}
      {/* uma margem só, de 16 px, para o título, o filtro, os grupos e as linhas: 4 da lista + 12 do grupo e da linha */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2">
        {grupos.length === 0
          ? <EstadoVazio ilustracao={<Onca pose="dormindo" tamanho={72} />} titulo="Tudo em dia" className="gap-2 py-8" />
          : grupos.map((g) => (
            <section key={g.id} aria-label={g.titulo}>
              <h3 className="t-selo flex h-8 items-end px-3 pb-1 text-sutil">{g.titulo}</h3>
              <ul>{g.itens.map((i) => <LinhaSino key={i.id} item={i} aoAbrir={aoAbrir} />)}</ul>
            </section>
          ))}
      </div>
    </div>
  )
}

/* ── O sino ──────────────────────────────────────────────────────────────────────────────────────────────── */

export function Sino({ papel }: { papel: PapelSino }) {
  const [params, setParams] = useSearchParams()
  const valor = params.get('sino')
  const aberto = valor !== null
  const filtro = valor && valor !== '1' ? valor : null
  const itens = useItensDoSino(papel)
  const abrirItem = useAbrirItemDoSino()
  const celular = useIsMobile()
  const gatilho = useRef<HTMLButtonElement>(null)
  const caixa = useRef<HTMLDivElement>(null)
  // abrir um item fecha a lista sem devolver o foco ao sino (na tela de destino ele ficava com o anel azul);
  // só Esc, o X ou o clique fora devolvem
  const abrindoItem = useRef(false)
  const n = itens.length

  const definir = useCallback((v: string | null) => {
    setParams((a) => { const p = new URLSearchParams(a); if (v === null) p.delete('sino'); else p.set('sino', v); return p }, { replace: true })
  }, [setParams])
  const fechar = () => definir(null)
  const rotulo = n > 0 ? `Esperando você, ${n}` : 'Esperando você, nada'

  const botao = (
    <span data-sino-botao className="relative inline-grid">
      <BotaoIcone ref={gatilho} rotulo={rotulo} dica={false} tamanho={celular ? 44 : 40} aria-expanded={aberto} aria-haspopup="dialog"
        onClick={() => definir(aberto ? null : '1')} className={cn('text-tinta', aberto && '[&>.face]:bg-fundo-suave')}>
        <Bell strokeWidth={2.5} />
      </BotaoIcone>
      {n > 0 && (
        <Contador n={n} tamanho="p" rotulo="esperando você"
          className="pointer-events-none absolute -right-1.5 -top-1 h-5 min-w-5 px-1 text-[12px] ring-2 ring-fundo" />
      )}
    </span>
  )

  const lista = (
    <ListaSino papel={papel} itens={itens} filtro={filtro} celular={celular} aoFechar={fechar}
      aoFiltrar={(t) => definir(t ?? '1')} aoAbrir={(i) => { abrindoItem.current = true; abrirItem(i) }} />
  )

  if (celular) {
    return (
      <>
        {botao}
        <PainelLado aberto={aberto} aoFechar={fechar}
          /* a folha cobre o sino: o total vai em cinza, como o número de uma seção (o laranja é só do sino) */
          titulo={<>Esperando você{n > 0 && <span className="tabular-nums text-sutil"> ({n})</span>}</>}
          className="h-[100svh] max-h-[100svh] rounded-none [&>div]:p-0 [&>div]:pt-2 [&>header]:pl-4">
          {lista}
        </PainelLado>
      </>
    )
  }

  return (
    <PopoverPrimitive.Root open={aberto} onOpenChange={(v) => definir(v ? (valor ?? '1') : null)}>
      <PopoverPrimitive.Anchor asChild>{botao}</PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content ref={caixa} role="dialog" aria-label={rotulo} align="end" side="bottom" sideOffset={8} collisionPadding={16}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            if (!abrindoItem.current) gatilho.current?.focus()
            abrindoItem.current = false
          }}
          // o foco entra na lista, não no X (o anel no X chamava mais atenção que o título)
          onOpenAutoFocus={(e) => { e.preventDefault(); caixa.current?.focus({ preventScroll: true }) }}
          tabIndex={-1}
          onInteractOutside={(e) => { if (gatilho.current?.contains(e.target as Node)) e.preventDefault() }}
          style={{ maxHeight: 'min(720px, var(--radix-popover-content-available-height, calc(100svh - 96px)))' }}
          className="z-40 flex w-[400px] flex-col overflow-hidden rounded-[16px] border-2 border-borda bg-white text-tinta shadow-[0_4px_0_0_var(--color-borda)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0">
          {lista}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
