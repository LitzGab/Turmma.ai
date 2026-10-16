"use client"

/* vaib215/event-manager (21st.dev · 9127) — o template de calendário que o Gabriel escolheu (19/09/2026), redesenhado
   em 20/09/2026 sobre o calendário da Teachy (dois prints dele: mês e semana).
   Fica do template: título com hoje / anterior / próximo, troca de visão (mês, semana, dia), busca, filtros com selo
   de contagem, e o diálogo ao clicar no evento.
   O que é nosso:
   · português, semana começando na segunda;
   · a paleta do produto: aula em cinza, avaliação em preto, entrega em laranja, o que o time fez e o recado da
     escola em anel vazio. Laranja só na pendência e no "agora";
   · SAIU criar evento e arrastar: a grade vem da escola, o professor não monta nem move aula (regra 60, item 8;
     F8: "vê o que precisa fazer sem cadastrar nada"). No diálogo da aula, a única coisa editável é O QUE VAI DAR;
   · conserto do original: a semana era calculada com `setDate(getDay())`, que cai no dia errado;
   · MÊS: número do dia centralizado, hoje em círculo preto, e cada evento é UMA linha (pontinho + texto truncado).
     As semanas dividem a altura por igual e a célula mede quantas linhas cabem: o resto vira "+N mais". Nada estoura;
   · SEMANA: uma coluna por dia, de segunda a sexta (sábado e domingo só entram, mais estreitos, quando têm evento).
     No alto as etiquetas do que não tem hora; embaixo as aulas como cartões empilhados, em ordem de horário.
     Aula em branco mostra "A preencher" (é o nosso "Pendente"); avaliação é cartão preto; a aula de agora tem fio laranja;
   · DIA: os mesmos cartões numa coluna de leitura, com a hora à esquerda e a descrição inteira, e ao lado o painel
     "Falta preencher" com as próximas aulas da semana sem conteúdo. A lista continua no próximo dia que tem alguma
     coisa (o título leva a ele), para a leitura não acabar num buraco;
   · no celular a semana vira uma agenda por dia (D51) e o mês mostra só os pontinhos. */

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Check, ChevronLeft, ChevronRight, ClipboardList, Clock, Filter, Inbox, Megaphone, Pencil, Radio, Rows3, Search, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export type TipoEvento = "aula" | "avaliacao" | "entrega" | "time" | "recado"

export interface Evento {
  id: string
  titulo: string
  descricao?: string
  inicio: Date
  fim: Date
  tipo: TipoEvento
  turma?: string
  escola?: string
  /** sem hora marcada: entrega, recado do dia, o que o time concluiu */
  diaInteiro?: boolean
  atraso?: boolean
  agora?: boolean
  /** para onde o botão do diálogo leva */
  para?: string
  acao?: string
}

type Visao = "mes" | "semana" | "dia"
type Abrir = (e: Evento) => void

/* `chip` é o selo do diálogo; `ponto` é o pontinho de 6 px do mês, das etiquetas e do filtro. */
const TIPOS: Record<TipoEvento, { nome: string; icone: typeof Clock; chip: string; ponto: string }> = {
  aula: { nome: "Aula", icone: Rows3, chip: "bg-realce-suave text-tinta", ponto: "bg-inativo" },
  avaliacao: { nome: "Avaliação", icone: ClipboardList, chip: "bg-tinta text-white", ponto: "bg-tinta" },
  entrega: { nome: "Entrega", icone: Inbox, chip: "bg-pendente-cx text-pendente", ponto: "bg-caramelo" },
  time: { nome: "Seu time", icone: Sparkles, chip: "bg-superficie text-apoio ring-1 ring-inset ring-borda-campo", ponto: "bg-superficie ring-[1.5px] ring-inset ring-inativo" },
  recado: { nome: "Recado da escola", icone: Megaphone, chip: "bg-superficie text-sutil ring-1 ring-inset ring-linha", ponto: "bg-superficie ring-[1.5px] ring-inset ring-inativo" },
}

const SEMANA_CURTA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]
const VISOES: { id: Visao; nome: string }[] = [{ id: "mes", nome: "Mês" }, { id: "semana", nome: "Semana" }, { id: "dia", nome: "Dia" }]

const mesmoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const hora = (d: Date) => `${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}`
const soma = (d: Date, dias: number) => { const n = new Date(d); n.setDate(n.getDate() + dias); return n }
const segunda = (d: Date) => soma(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7))
const diaCurto = (d: Date) => SEMANA_CURTA[(d.getDay() + 6) % 7]
const dataLonga = (d: Date) => d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).replace("-feira", "")
const mesLongo = (d: Date) => d.toLocaleDateString("pt-BR", { month: "long" })
const mesCurto = (d: Date) => d.toLocaleDateString("pt-BR", { month: "short" })
const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const ordem = (a: Evento, b: Evento) => Number(!!b.diaInteiro) - Number(!!a.diaInteiro) || a.inicio.getTime() - b.inicio.getTime()
const disciplina = (e: Evento) => e.titulo.split(" · ")[1]
const resumo = (e: Evento) => [e.diaInteiro ? null : `${hora(e.inicio)} às ${hora(e.fim)}`, e.tipo === "aula" ? e.turma : e.titulo, e.tipo === "aula" ? e.descricao || "A preencher" : e.descricao].filter(Boolean).join(" · ")

export function EventManager({ eventos: iniciais, hoje, turmas, visaoInicial = "semana", className }: {
  eventos: Evento[]; hoje: Date; turmas: string[]; visaoInicial?: Visao; className?: string
}) {
  const [eventos, setEventos] = useState(iniciais)
  const [data, setData] = useState(hoje)
  const [visao, setVisao] = useState<Visao>(visaoInicial)
  const [aberto, setAberto] = useState<Evento | null>(null)
  const [rascunho, setRascunho] = useState("")
  const [busca, setBusca] = useState("")
  const [fTurmas, setFTurmas] = useState<string[]>([])
  const [fTipos, setFTipos] = useState<TipoEvento[]>([])

  const filtrados = useMemo(() => eventos.filter((e) => {
    const q = busca.trim().toLowerCase()
    if (q && ![e.titulo, e.descricao, e.turma, TIPOS[e.tipo].nome].some((t) => t?.toLowerCase().includes(q))) return false
    if (fTurmas.length && !(e.turma && fTurmas.includes(e.turma))) return false
    if (fTipos.length && !fTipos.includes(e.tipo)) return false
    return true
  }).sort(ordem), [eventos, busca, fTurmas, fTipos])

  /* "Falta preencher": as aulas da semana à vista que ainda vão acontecer e estão sem conteúdo. */
  const faltam = useMemo(() => {
    const de = segunda(data), ate = soma(de, 7)
    return eventos.filter((e) => e.tipo === "aula" && !e.descricao && e.fim >= hoje && e.inicio >= de && e.inicio < ate
      && (!fTurmas.length || (e.turma !== undefined && fTurmas.includes(e.turma)))).sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
  }, [eventos, data, hoje, fTurmas])

  const doDia = (d: Date) => filtrados.filter((e) => mesmoDia(e.inicio, d))
  const temFiltro = fTurmas.length > 0 || fTipos.length > 0
  const abrir: Abrir = (e) => { setAberto(e); setRascunho(e.descricao ?? "") }
  const irPara = (d: Date) => { setData(d); setVisao("dia") }

  const navegar = (sentido: 1 | -1) => setData((d) => {
    if (visao === "mes") return new Date(d.getFullYear(), d.getMonth() + sentido, 1)
    return soma(d, sentido * (visao === "semana" ? 7 : 1))
  })

  /* A visão Dia continua no próximo dia que tem alguma coisa (até uma semana à frente): a leitura não acaba num buraco. */
  const depois = visao === "dia" ? Array.from({ length: 7 }, (_, i) => soma(data, i + 1)).find((d) => doDia(d).length > 0) : undefined

  const ini = segunda(data), sex = soma(ini, 4)
  const titulo = visao === "mes" ? `${maiuscula(mesLongo(data))} de ${data.getFullYear()}`
    : visao === "dia" ? maiuscula(dataLonga(data))
    : ini.getMonth() === sex.getMonth() ? `${ini.getDate()} a ${sex.getDate()} de ${mesLongo(sex)}`
    : `${ini.getDate()} de ${mesCurto(ini)} a ${sex.getDate()} de ${mesCurto(sex)}`

  const filtro = <T extends string>(rotulo: string, opcoes: { id: T; nome: string; ponto?: string }[], sel: T[], set: (v: T[]) => void) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secundario" size="sm" className="shrink-0 gap-1.5">
          <Filter /> {rotulo}
          {sel.length > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-tinta px-1 text-[11px] font-semibold text-white">{sel.length}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-cartao p-1.5">
        <DropdownMenuLabel className="rotulo px-2 py-1.5">Filtrar por {rotulo.toLowerCase()}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opcoes.map((o) => (
          <DropdownMenuCheckboxItem key={o.id} checked={sel.includes(o.id)} className="h-9 rounded-linha"
            onCheckedChange={(v) => set(v ? [...sel, o.id] : sel.filter((x) => x !== o.id))}>
            <span className="flex items-center gap-2">{o.ponto && <span className={cn("size-2 rounded-full", o.ponto)} />}{o.nome}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-3", className)}>
      {/* Uma barra só, de 36 px: hoje e andar no tempo em volta do título · busca, filtros e as três visões.
          Abaixo de 1280 px o grupo da direita desce inteiro para a segunda linha, e a busca ocupa o que sobra. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex w-full min-w-0 items-center gap-1 sm:w-auto">
          <Button variant="secundario" size="sm" className="mr-1" onClick={() => setData(hoje)}>Hoje</Button>
          <Button variant="discreto" size="icon-sm" className="size-8" onClick={() => navegar(-1)} aria-label="Anterior"><ChevronLeft /></Button>
          <h2 className="min-w-0 flex-1 truncate text-center font-corpo text-[16px] font-semibold leading-tight tracking-[-0.01em] text-tinta sm:min-w-[200px] sm:flex-none">{titulo}</h2>
          <Button variant="discreto" size="icon-sm" className="size-8" onClick={() => navegar(1)} aria-label="Próximo"><ChevronRight /></Button>
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 xl:w-auto">
          <div className="relative min-w-0 flex-1 xl:w-44 xl:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-inativo" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar" aria-label="Buscar no calendário"
              className="h-9 rounded-full border-borda-campo bg-superficie pl-9 pr-8 text-[13px]" />
            {busca && <button type="button" onClick={() => setBusca("")} aria-label="Limpar a busca" className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-sutil hover:bg-realce-suave"><X className="size-4" /></button>}
          </div>
          {filtro("Turma", turmas.map((t) => ({ id: t, nome: t })), fTurmas, setFTurmas)}
          {filtro("Tipo", (Object.keys(TIPOS) as TipoEvento[]).map((t) => ({ id: t, nome: TIPOS[t].nome, ponto: TIPOS[t].ponto })), fTipos, setFTipos)}
          <div role="group" aria-label="Visão do calendário" className="order-first grid w-full grid-cols-3 items-center gap-0.5 rounded-full bg-realce-suave p-1 sm:order-none sm:w-auto">
            {VISOES.map((v) => (
              <button key={v.id} type="button" aria-pressed={visao === v.id} onClick={() => setVisao(v.id)}
                className={cn("h-7 rounded-full px-3 text-[13px] font-medium transition-colors duration-150",
                  visao === v.id ? "bg-superficie text-tinta shadow-[0_0_0_1px_rgba(0,0,0,.06),0_1px_2px_rgba(0,0,0,.06)]" : "text-sutil hover:text-tinta")}>
                {v.nome}
              </button>
            ))}
          </div>
        </div>
      </div>
      {temFiltro && (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <span className="text-[13px] text-sutil">Filtrando por</span>
          {[...fTurmas.map((t) => ({ k: t, n: t, tira: () => setFTurmas(fTurmas.filter((x) => x !== t)) })),
            ...fTipos.map((t) => ({ k: t, n: TIPOS[t].nome, tira: () => setFTipos(fTipos.filter((x) => x !== t)) }))].map((f) => (
            <span key={f.k} className="inline-flex h-7 items-center gap-1 rounded-full bg-realce-suave pl-2.5 pr-1 text-[12.5px] font-medium text-tinta">
              {f.n}<button type="button" onClick={f.tira} aria-label={`Tirar o filtro ${f.n}`} className="grid size-5 place-items-center rounded-full text-sutil hover:bg-realce"><X className="size-3" /></button>
            </span>
          ))}
          <button type="button" onClick={() => { setFTurmas([]); setFTipos([]) }} className="px-1.5 text-[12.5px] font-medium text-sutil underline-offset-4 hover:text-tinta hover:underline">Limpar</button>
        </div>
      )}

      {/* A visão ocupa o que sobra da janela e nada empurra a página. No celular rola aqui; no computador, por dentro de cada coluna. */}
      <div className="min-h-0 flex-1 overflow-y-auto md:overflow-hidden">
        {visao === "mes" && <Mes data={data} hoje={hoje} doDia={doDia} abrir={abrir} irPara={irPara} />}
        {visao === "semana" && <Semana inicio={ini} hoje={hoje} doDia={doDia} abrir={abrir} irPara={irPara} />}
        {visao === "dia" && <DiaUnico evs={doDia(data)} depois={depois ? { dia: depois, evs: doDia(depois) } : null} hoje={hoje} faltam={faltam} abrir={abrir} irPara={irPara} />}
      </div>

      {/* O diálogo do evento. Na aula, só uma coisa se edita: o que vai dar. */}
      <Dialog open={aberto !== null} onOpenChange={(v) => { if (!v) setAberto(null) }}>
        <DialogContent className="max-h-[calc(100svh-32px)] w-[calc(100vw-32px)] max-w-md gap-4 overflow-y-auto rounded-[24px] border-0 bg-superficie p-5 shadow-flutua sm:rounded-[24px] sm:p-6">
          {aberto && (() => {
            const T = TIPOS[aberto.tipo]
            return (
              <>
                <DialogHeader className="space-y-2 text-left">
                  <span className={cn("inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-xs font-medium", T.chip)}><T.icone className="size-3.5" /> {T.nome}{aberto.atraso && " em atraso"}</span>
                  <DialogTitle className="font-corpo text-lg font-semibold leading-snug tracking-normal text-tinta">{aberto.titulo}</DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13.5px] text-sutil">
                    <Clock className="size-3.5" /> {maiuscula(dataLonga(aberto.inicio))}{!aberto.diaInteiro && ` · ${hora(aberto.inicio)} às ${hora(aberto.fim)}`}{aberto.escola && ` · ${aberto.escola}`}
                  </DialogDescription>
                </DialogHeader>
                {aberto.tipo === "aula" ? (
                  <div className="grid gap-1.5">
                    <Label htmlFor="o-que-vou-dar" className="text-[13px] font-medium text-apoio">O que vou dar</Label>
                    <Textarea id="o-que-vou-dar" rows={3} value={rascunho} onChange={(e) => setRascunho(e.target.value)} placeholder="Ex.: Reagente limitante · aula 1 do plano"
                      className="min-h-[84px] rounded-controle border-borda-campo bg-superficie text-[15px]" />
                    <p className="text-[12.5px] leading-snug text-sutil">Horário e turma vêm da grade da escola e não mudam aqui.</p>
                  </div>
                ) : aberto.descricao ? <p className="text-[15px] leading-relaxed text-apoio">{aberto.descricao}</p> : null}
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-0">
                  <Button variant="secundario" onClick={() => setAberto(null)}>Fechar</Button>
                  {aberto.tipo === "aula" && aberto.agora && <Button variant="secundario" asChild><Link to="/professor/sala"><Radio /> Abrir modo sala</Link></Button>}
                  {aberto.tipo === "aula"
                    ? <Button variant="oficial" onClick={() => { setEventos((l) => l.map((e) => e.id === aberto.id ? { ...e, descricao: rascunho } : e)); setAberto(null) }}>Salvar</Button>
                    : aberto.para && <Button variant="oficial" asChild><Link to={aberto.para}>{aberto.acao ?? "Abrir"}</Link></Button>}
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ─── As peças ─────────────────────────────────────────────────────────────────────────────────────────────── */

const Moldura = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn("h-full overflow-hidden rounded-cartao border border-linha bg-linha", className)}>{children}</div>
const Ponto = ({ tipo }: { tipo: TipoEvento }) => <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", TIPOS[tipo].ponto)} />
const Agora = () => <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pendente-cx px-1.5 text-[10.5px] font-semibold leading-4 text-caramelo-texto"><span className="size-1.5 rounded-full bg-caramelo" />agora</span>
const Escola = ({ nome }: { nome: string }) => <span className="shrink-0 rounded-full px-1.5 text-[10.5px] font-medium leading-4 text-sutil ring-1 ring-inset ring-linha">{nome}</span>
const APreencher = () => <span className="flex items-center gap-1 whitespace-nowrap text-inativo"><Pencil className="size-3 shrink-0" strokeWidth={1.75} /> A preencher</span>

/** A altura de um elemento, medida: o mês usa para saber quantas linhas cabem na célula. */
function useAltura<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [altura, setAltura] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const mede = () => setAltura(el.clientHeight)
    mede()
    const ro = new ResizeObserver(mede)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, altura] as const
}

/** O evento no mês: UMA linha, pontinho + texto truncado. */
function Linha({ e, abrir, altura }: { e: Evento; abrir: Abrir; altura: number }) {
  return (
    <button type="button" onClick={() => abrir(e)} title={resumo(e)} style={{ height: altura }}
      className="flex w-full min-w-0 items-center gap-1.5 rounded-[6px] px-1 text-left text-[12.5px] leading-none text-apoio transition-colors duration-150 hover:bg-realce-suave">
      <Ponto tipo={e.tipo} />
      <span className={cn("min-w-0 truncate leading-[18px]", e.tipo === "avaliacao" && "font-semibold text-tinta")}>
        {e.tipo === "aula" ? (
          <><span className="text-sutil">{hora(e.inicio)}</span> <span className="font-medium text-tinta">{e.turma}</span>{e.descricao && ` · ${e.descricao}`}</>
        ) : e.tipo === "avaliacao" ? `${hora(e.inicio)} ${e.turma} · ${e.titulo}`
          : <>{!e.diaInteiro && <span className="text-sutil">{hora(e.inicio)} </span>}{e.titulo}</>}
      </span>
    </button>
  )
}

/** O que não tem hora (entrega, recado, o que o time fez): etiqueta de uma linha. */
function Etiqueta({ e, abrir }: { e: Evento; abrir: Abrir }) {
  return (
    <button type="button" onClick={() => abrir(e)} title={resumo(e)}
      className={cn("flex h-6 w-full min-w-0 shrink-0 items-center gap-1.5 rounded-[8px] px-2 text-left text-[12px] font-medium transition-colors duration-150",
        e.atraso ? "bg-pendente-cx text-pendente hover:brightness-[.97]" : "bg-realce-suave text-apoio hover:bg-realce")}>
      <Ponto tipo={e.tipo} /><span className="min-w-0 truncate">{e.titulo}</span>
    </button>
  )
}

/** O cartão do que tem hora. Compacto na semana (hora dentro, conteúdo em até duas linhas; no computador todos têm a mesma altura);
    `amplo` no dia (a hora fica à esquerda, fora do cartão, e a descrição vem inteira). */
function CartaoEvento({ e, abrir, amplo = false }: { e: Evento; abrir: Abrir; amplo?: boolean }) {
  const aula = e.tipo === "aula"
  const escuro = e.tipo === "avaliacao"
  const apagado = escuro ? "opacity-70" : "text-sutil"
  return (
    <button type="button" onClick={() => abrir(e)}
      className={cn("block w-full min-w-0 shrink-0 overflow-hidden rounded-controle border text-left transition-colors duration-150", amplo ? "px-3.5 py-3" : "p-2.5 xl:p-3",
        escuro ? "border-tinta bg-tinta text-white hover:bg-noite-alto" : "border-linha bg-superficie text-tinta hover:border-borda-campo hover:bg-lateral",
        e.agora && "border-caramelo shadow-[0_0_0_.5px_var(--color-caramelo)] hover:border-caramelo")}>
      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 leading-[18px]">
        {!amplo && <span className={cn("shrink-0 text-[12px]", apagado)}>{e.turma ? hora(e.inicio) : `${hora(e.inicio)} às ${hora(e.fim)}`}</span>}
        {e.turma && <span className={cn("shrink-0 font-semibold", amplo ? "text-[14px]" : "text-[13px]")}>{e.turma}</span>}
        {amplo && aula && <span className="truncate text-[13px] text-sutil">{disciplina(e)}</span>}
        {escuro && <span className={cn("truncate text-[12px]", apagado)}>Avaliação</span>}
        {amplo && !e.turma && <span className="truncate text-[12.5px] text-sutil">{TIPOS[e.tipo].nome}</span>}
        {(e.escola || e.agora) && <span className="ml-auto flex shrink-0 items-center gap-1">{e.escola && <Escola nome={e.escola} />}{e.agora && <Agora />}</span>}
      </span>
      {amplo ? (
        <span className="mt-1 block text-[14px] leading-[20px]">
          {aula ? (e.descricao || <APreencher />) : <><span className="block font-medium">{e.titulo}</span>{e.descricao && <span className={cn("mt-0.5 block text-[13px] leading-[19px]", apagado)}>{e.descricao}</span>}</>}
        </span>
      ) : (
        <span className="mt-0.5 block text-[13px] leading-[18px] md:min-h-9">
          {aula && !e.descricao ? <APreencher /> : <span className="line-clamp-2 break-words">{aula ? e.descricao : e.titulo}</span>}
        </span>
      )}
    </button>
  )
}

/** A pilha de um dia: primeiro as etiquetas, depois os cartões em ordem de horário. */
function Pilha({ evs, abrir }: { evs: Evento[]; abrir: Abrir }) {
  const inteiros = evs.filter((e) => e.diaInteiro)
  return (
    <>
      {inteiros.length > 0 && <div className="grid shrink-0 grid-cols-[minmax(0,1fr)] gap-1">{inteiros.map((e) => <Etiqueta key={e.id} e={e} abrir={abrir} />)}</div>}
      {evs.filter((e) => !e.diaInteiro).map((e) => <CartaoEvento key={e.id} e={e} abrir={abrir} />)}
    </>
  )
}

/* ─── Mês ──────────────────────────────────────────────────────────────────────────────────────────────────── */

const CABECALHO = 28, NUMERO = 30, MAIS = 16

function Mes({ data, hoje, doDia, abrir, irPara }: { data: Date; hoje: Date; doDia: (d: Date) => Evento[]; abrir: Abrir; irPara: (d: Date) => void }) {
  const [ref, altura] = useAltura<HTMLDivElement>()
  const inicio = segunda(new Date(data.getFullYear(), data.getMonth(), 1))
  const dias = Array.from({ length: 42 }, (_, i) => soma(inicio, i))
  const semanas = [4, 5, 6].find((n) => n === 6 || dias[n * 7].getMonth() !== data.getMonth())!
  /* As semanas dividem a altura por igual; a célula mede quantas linhas cabem (no máximo 4) e o resto vira "+N mais". */
  const linha = semanas === 6 ? 18 : 20
  const livre = altura ? (altura - CABECALHO - semanas) / semanas - NUMERO - 4 : 0
  const cabe = (reserva: number) => (altura ? Math.max(1, Math.min(4, Math.floor((livre - reserva) / linha))) : 4)
  return (
    <Moldura className="min-h-[420px] md:min-h-0">
      <div ref={ref} className="grid h-full grid-cols-7 gap-px sm:grid-cols-[repeat(5,minmax(0,1fr))_repeat(2,minmax(0,.6fr))]" style={{ gridTemplateRows: `${CABECALHO}px repeat(${semanas}, minmax(0, 1fr))` }}>
        {SEMANA_CURTA.map((s) => <div key={s} className="grid place-items-center bg-superficie text-[12px] text-sutil">{s}</div>)}
        {dias.slice(0, semanas * 7).map((d) => {
          const evs = doDia(d)
          const fora = d.getMonth() !== data.getMonth()
          const ehHoje = mesmoDia(d, hoje)
          const mostra = evs.length <= cabe(0) ? evs.length : cabe(MAIS)
          return (
            <div key={d.getTime()} className="relative flex min-h-0 flex-col overflow-hidden bg-superficie px-1 pb-1 pt-1">
              {/* no celular a célula inteira leva ao dia */}
              <button type="button" onClick={() => irPara(d)} aria-label={`Abrir ${dataLonga(d)}`}
                className={cn("mx-auto mb-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-semibold leading-none transition-colors duration-150 after:absolute after:inset-0 sm:after:hidden",
                  ehHoje ? "bg-tinta text-white" : fora ? "text-inativo hover:bg-realce-suave" : "text-tinta hover:bg-realce-suave")}>{d.getDate()}</button>
              <div className={cn("flex flex-wrap justify-center gap-[3px] px-0.5 pt-0.5 sm:hidden", fora && "opacity-50")}>{evs.slice(0, 8).map((e) => <Ponto key={e.id} tipo={e.tipo} />)}</div>
              <div className={cn("hidden min-w-0 sm:block", fora && "opacity-50")}>
                {evs.slice(0, mostra).map((e) => <Linha key={e.id} e={e} abrir={abrir} altura={linha} />)}
                {evs.length > mostra && <button type="button" onClick={() => irPara(d)} className="block h-4 pl-4 text-left text-[11px] font-medium leading-4 text-sutil hover:text-tinta">+{evs.length - mostra} mais</button>}
              </div>
            </div>
          )
        })}
      </div>
    </Moldura>
  )
}

/* ─── Semana ───────────────────────────────────────────────────────────────────────────────────────────────── */

function Semana({ inicio, hoje, doDia, abrir, irPara }: { inicio: Date; hoje: Date; doDia: (d: Date) => Evento[]; abrir: Abrir; irPara: (d: Date) => void }) {
  /* segunda a sexta sempre; sábado e domingo só quando têm evento, e mais estreitos */
  const fds = [5, 6].map((i) => soma(inicio, i)).filter((d) => doDia(d).length > 0)
  const dias = [...Array.from({ length: 5 }, (_, i) => soma(inicio, i)), ...fds]
  return (
    <>
      <Moldura className="hidden md:block">
        <div className="grid h-full gap-px" style={{ gridTemplateColumns: `repeat(5, minmax(0, 1fr))${fds.map(() => " minmax(0, .62fr)").join("")}` }}>
          {dias.map((d) => {
            const ehHoje = mesmoDia(d, hoje)
            return (
              <div key={d.getTime()} className="flex min-h-0 flex-col bg-superficie">
                <button type="button" onClick={() => irPara(d)} aria-label={`Abrir ${dataLonga(d)}`} className="group flex shrink-0 flex-col items-center gap-0.5 pb-1.5 pt-2.5">
                  <span className="text-[12px] leading-4 text-sutil">{diaCurto(d)}</span>
                  <span className={cn("grid size-9 place-items-center rounded-full text-[20px] font-semibold leading-none transition-colors duration-150", ehHoje ? "bg-tinta text-white" : "text-tinta group-hover:bg-realce-suave")}>{d.getDate()}</span>
                </button>
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 pt-1"><Pilha evs={doDia(d)} abrir={abrir} /></div>
              </div>
            )
          })}
        </div>
      </Moldura>
      {/* No celular a semana vira uma agenda por dia (D51), com os mesmos cartões */}
      <div className="grid gap-5 pb-2 md:hidden">
        {dias.map((d) => {
          const evs = doDia(d)
          const ehHoje = mesmoDia(d, hoje)
          return (
            <section key={d.getTime()}>
              <button type="button" onClick={() => irPara(d)} className="mb-2 flex items-center gap-2 text-left">
                <span className={cn("grid size-9 place-items-center rounded-full text-[20px] font-semibold leading-none", ehHoje ? "bg-tinta text-white" : "text-tinta")}>{d.getDate()}</span>
                <span className="text-[13px] text-sutil">{d.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "")}{ehHoje && " · hoje"}</span>
              </button>
              <div className="flex flex-col gap-2">{evs.length === 0 ? <p className="px-1 text-[13px] text-inativo">Nada neste dia</p> : <Pilha evs={evs} abrir={abrir} />}</div>
            </section>
          )
        })}
      </div>
    </>
  )
}

/* ─── Dia ──────────────────────────────────────────────────────────────────────────────────────────────────── */

function DiaUnico({ evs, depois, hoje, faltam, abrir, irPara }: { evs: Evento[]; depois: { dia: Date; evs: Evento[] } | null; hoje: Date; faltam: Evento[]; abrir: Abrir; irPara: (d: Date) => void }) {
  const LINHA = "grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3"
  /* As linhas de um dia: primeiro o que não tem hora, depois os cartões com a hora à esquerda. */
  const linhas = (lista: Evento[]) => {
    const inteiros = lista.filter((e) => e.diaInteiro)
    return (
      <>
        {inteiros.length > 0 && (
          <li className={LINHA}>
            <span className="pt-2.5 text-right text-[12px] leading-4 text-inativo">o dia</span>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
              {inteiros.map((e) => (
                <button key={e.id} type="button" onClick={() => abrir(e)}
                  className={cn("flex w-full min-w-0 items-start gap-2 rounded-linha px-3 py-2 text-left text-[13px] leading-[19px] transition-colors duration-150",
                    e.atraso ? "bg-pendente-cx text-pendente hover:brightness-[.97]" : "bg-realce-suave text-apoio hover:bg-realce")}>
                  <span className="flex h-[19px] shrink-0 items-center"><Ponto tipo={e.tipo} /></span>
                  <span className="min-w-0"><span className={cn("font-semibold", !e.atraso && "text-tinta")}>{e.titulo}</span>{e.descricao && <span> · {e.descricao}</span>}</span>
                </button>
              ))}
            </div>
          </li>
        )}
        {lista.filter((e) => !e.diaInteiro).map((e) => (
          <li key={e.id} className={LINHA}>
            <span className="pt-3 text-right leading-[18px]">
              <span className={cn("block text-[13px] font-semibold", e.agora ? "text-caramelo-texto" : "text-tinta")}>{hora(e.inicio)}</span>
              <span className="block text-[12px] text-inativo">{hora(e.fim)}</span>
            </span>
            <CartaoEvento e={e} abrir={abrir} amplo />
          </li>
        ))}
      </>
    )
  }
  return (
    <div className="grid gap-4 md:h-full md:grid-rows-[minmax(0,1fr)] min-[1100px]:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-h-0 md:overflow-y-auto">
        <ul className="grid max-w-[800px] gap-2 pb-1">
          {evs.length === 0 && <li className={LINHA}><span /><p className={cn("rounded-controle border border-dashed border-borda-campo text-center text-[13px] text-sutil", depois ? "py-5" : "py-10")}>Nada neste dia</p></li>}
          {linhas(evs)}
          {/* a seguir: o próximo dia com alguma coisa, nos mesmos cartões; o título leva a ele */}
          {depois && (
            <>
              <li className={cn(LINHA, "mt-2")}>
                <span />
                <button type="button" onClick={() => irPara(depois.dia)} className="group flex h-6 min-w-0 items-center gap-3 text-left">
                  <span className="shrink-0 text-[13px] font-semibold text-tinta underline-offset-4 group-hover:underline">{mesmoDia(depois.dia, hoje) ? `Hoje · ${dataLonga(depois.dia)}` : mesmoDia(depois.dia, soma(hoje, 1)) ? `Amanhã · ${dataLonga(depois.dia)}` : maiuscula(dataLonga(depois.dia))}</span>
                  <span aria-hidden className="h-px min-w-0 flex-1 bg-linha" />
                </button>
              </li>
              {linhas(depois.evs)}
            </>
          )}
        </ul>
      </div>
      <aside aria-label="Falta preencher" className="hidden max-h-full min-h-0 flex-col self-start overflow-hidden rounded-cartao border border-linha bg-superficie min-[1100px]:flex">
        <header className="flex shrink-0 items-center justify-between gap-2 px-4 pb-1.5 pt-3.5">
          <h3 className="font-corpo text-[14px] font-semibold leading-tight text-tinta">Falta preencher</h3>
          {faltam.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pendente-cx px-1.5 text-[11.5px] font-semibold text-pendente">{faltam.length}</span>}
        </header>
        {faltam.length === 0 ? (
          <p className="flex items-center gap-1.5 px-4 pb-4 pt-1 text-[13px] text-sutil"><Check className="size-3.5" strokeWidth={1.75} /> Nada a preencher nesta semana</p>
        ) : (
          <ul className="min-h-0 overflow-y-auto px-2 pb-2">
            {faltam.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => abrir(e)} className="group flex h-10 w-full min-w-0 items-center gap-2 rounded-linha px-2 text-left transition-colors duration-150 hover:bg-realce-suave">
                  <span className="w-[5.75rem] shrink-0 text-[12.5px] text-sutil">{mesmoDia(e.inicio, hoje) ? "hoje" : `${diaCurto(e.inicio)} ${e.inicio.getDate()}`} · {hora(e.inicio)}</span>
                  <span className="shrink-0 text-[13px] font-semibold text-tinta">{e.turma}</span>
                  {e.escola && <Escola nome={e.escola} />}
                  <Pencil className="ml-auto size-3.5 shrink-0 text-inativo transition-colors duration-150 group-hover:text-tinta" strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
