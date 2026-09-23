import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, BellOff, BellRing, CalendarDays, Check, ChevronDown, CornerDownRight, History, Info, ListFilter, Radio, ShieldCheck, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AcoesMensagem, AvatarIniciais, CampoResposta, Conversa, ConversaCabecalho, ConversaFaixa, ConversaRegistro, ConversaRodape,
  Digitando, Mensagem, MenuConversa, NotaSistema, PontoPresenca, SeparadorDia, itemMenuConversa, menuConversa,
} from '@/components/ui/messaging-conversation'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { AvatarAgente, ChipFonte, Estado, LinhaAprovacao, SeloIA } from '@/components/turmma/ia'
import { NotaMockup } from '@/components/turmma/tela'
import { agente, funcao, type AgenteId, type FuncaoId } from '@/dados/agentes'
import { PROFESSORA } from '@/dados/escola'
import {
  AVISO_TUTOR, MENSAGENS_ASSISTENTE, MENSAGENS_TUTOR, REPLICA_CONTESTACAO, REPLICA_REJEICAO, RESPOSTAS_RAPIDAS, respostaLivre,
  type AcaoMsg, type AnexoMsg, type MensagemTime, type Registro, type Replica, type RespostaPronta, type RespostaRapida,
} from '@/dados/mensagens-time'
import { conversaTime, useConversaTime, useResumoDo } from '@/dados/time'
import { cn } from '@/lib/utils'
import { ConversaAberta, DialogoAuditoria, Sinal } from './_pecas'

/* SEU TIME EM FORMATO DE CONVERSA (20/09/2026). O Gabriel viu a linha do tempo de cartões largos e pediu: "preciso
   que seja algo mais organizado. Faça em formato de conversa mesmo. O agente enviando mensagem", e colou a
   messaging-conversation da HextaUI (21st.dev). A peça, adotada, mora em ui/messaging-conversation; o conteúdo, em
   dados/mensagens-time; aqui fica só o que é desta tela.

   · O agente FALA: cada entrega é um balão dele, com a função que está falando e a hora em cima; os três números
     viram anexo embaixo do balão e os botões viram as ações da mensagem.
   · A professora RESPONDE: aprovar, rejeitar ou marcar como visto entra como mensagem dela, à direita, com a linha
     de registro (quem e quando). A mensagem do agente perde os botões.
   · O que pede ação fica PRESO NO ALTO, na faixa "Esperando você": clicar rola até a mensagem e dá um realce.
   · Ordem de conversa: o antigo em cima, HOJE embaixo; a tela abre no fim.
   · Um agente por pessoa (19/09/2026): correção, adaptação e "seu dia" são FUNÇÕES do Assistente e viram o seletor
     "Tudo ▾". Os endereços antigos (/corretor, /adaptador, /planejador) abrem o Assistente já filtrado. */

type Filtro = 'tudo' | Exclude<FuncaoId, 'conversa'>
type Quem = 'assistente' | 'tutor'

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: 'tudo', rotulo: 'Tudo' },
  { id: 'correcao', rotulo: 'Correção' },
  { id: 'adaptacao', rotulo: 'Adaptação' },
  { id: 'dia', rotulo: 'Seu dia' },
]

/** Endereços antigos (um agente por função) continuam abrindo: caem no Assistente, já filtrado. */
const LEGADO: Record<string, Filtro> = { corretor: 'correcao', adaptador: 'adaptacao', planejador: 'dia' }

const ICONE_ACAO: Record<NonNullable<AcaoMsg['icone']>, LucideIcon> = { seta: ArrowRight, calendario: CalendarDays, sala: Radio }

/** Responder, rejeitar e contestar passam pela caixa de resposta: o chip em cima dela diz o que está sendo feito. */
type Modo = 'responder' | 'rejeitar' | 'contestar'
const MODO: Record<Modo, { chip: string; campo: string }> = {
  responder: { chip: 'Respondendo a', campo: 'Escreva a resposta…' },
  rejeitar: { chip: 'Rejeitando', campo: 'Diga o que está errado, para ele refazer…' },
  contestar: { chip: 'Contestando', campo: 'Diga o que não bate…' },
}

/** O que fica escrito junto da hora do agente depois que ela respondeu. */
const RESOLVIDA: Record<string, string> = { 'Aprovado por': 'aprovada', 'Rejeitado por': 'rejeitada', 'Visto por': 'vista' }

/** `**assim**` vira negrito. */
function Texto({ children }: { children: string }) {
  return <>{children.split('**').map((t, i) => (i % 2 ? <b key={i} className="font-semibold">{t}</b> : t))}</>
}

const comPonto = (t: string) => (/[.!?…]$/.test(t) ? t : `${t}.`)
const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)

/** A linha de registro embaixo da resposta dela: quem e quando. Aprovação usa a peça de sempre (LinhaAprovacao). */
function LinhaRegistro({ r }: { r: Registro }) {
  if (r.tom === 'ok') return <LinhaAprovacao verbo={r.verbo} quando={r.quando} className="text-[12.5px]" />
  const Icone = r.tom === 'erro' ? X : Check
  return (
    <p className={cn('inline-flex items-center gap-1.5 rounded-linha px-2.5 py-1 text-[12.5px] font-medium', r.tom === 'erro' ? 'bg-erro-cx text-erro' : 'bg-realce-suave text-apoio')}>
      <Icone className="size-3.5" strokeWidth={2.6} />
      {r.verbo} {PROFESSORA.nome} · {r.quando}
    </p>
  )
}

/** O anexo embaixo do balão. Balão é cinza cheio; anexo é branco com fio, para não virar um balão a mais. */
function Anexo({ anexo, chave, aoMudarChave, aberta, aoPedirConversa }: {
  anexo: AnexoMsg; chave: boolean; aoMudarChave: (v: boolean) => void
  aberta: { aluno: string; motivo: string } | null; aoPedirConversa: (aluno: string) => void
}) {
  if (anexo.tipo === 'resumo') {
    return (
      <ul className="grid w-full grid-cols-3 divide-x divide-linha overflow-hidden rounded-controle border border-linha bg-superficie sm:flex sm:w-fit sm:max-w-full">
        {anexo.itens.map(([valor, rotulo]) => (
          <li key={rotulo} className="flex min-w-0 flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-baseline sm:gap-1.5">
            <b className="text-[15px] font-semibold leading-tight text-tinta">{valor}</b>
            <span className="text-[12.5px] leading-tight text-sutil">{rotulo}</span>
          </li>
        ))}
      </ul>
    )
  }
  if (anexo.tipo === 'alunos') {
    return (
      <ul className="flex max-w-full flex-wrap gap-1.5 sm:max-w-[82%]">
        {anexo.nomes.map((n) => <li key={n} className="rounded-full border border-linha bg-superficie px-2.5 py-[3px] text-[13px] text-apoio">{n}</li>)}
      </ul>
    )
  }
  if (anexo.tipo === 'conversas') {
    return (
      <>
        <ul className="w-full divide-y divide-linha overflow-hidden rounded-controle border border-linha bg-superficie sm:w-[min(100%,440px)]">
          {anexo.nomes.map((n) => (
            <li key={n} className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 px-3 text-sm font-medium text-tinta">
              {n}
              {aberta?.aluno === n
                ? <span className="text-[13px] font-normal text-sutil">Conversa aberta · em auditoria</span>
                : <Button variant="discreto" size="sm" className="-mr-2 h-8 px-2.5" onClick={() => aoPedirConversa(n)}>Abrir a conversa…</Button>}
            </li>
          ))}
        </ul>
        {/* O cabeçalho da peça (_pecas/ConversaAberta) é um flex que quebra: na coluna de 780 px a segunda linha começava
            com um "·" solto. Aqui ele vira texto corrido, com o ícone na linha, e quebra onde a frase quebra. */}
        {aberta && (
          <div id="conversa-aberta" className="w-full scroll-mb-4 [&>div>p]:block [&>div>p]:leading-relaxed [&>div>p>b]:mr-1.5 [&>div>p>svg]:mr-2 [&>div>p>svg]:inline-block [&>div>p>svg]:align-[-3px]">
            <ConversaAberta aluno={aberta.aluno} motivo={aberta.motivo} />
          </div>
        )}
      </>
    )
  }
  return (
    <label className="flex w-full items-center justify-between gap-4 rounded-controle border border-linha bg-superficie px-3 py-2 sm:w-[min(100%,440px)]">
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium leading-snug text-tinta">{anexo.titulo}</span>
        <span className="block text-[12.5px] leading-snug text-sutil">{chave ? anexo.ligada : anexo.desligada}</span>
      </span>
      <Switch checked={chave} onCheckedChange={aoMudarChave} className="data-[state=checked]:bg-noite data-[state=unchecked]:bg-borda-campo" />
    </label>
  )
}

function Lista({ titulo, itens, tom }: { titulo: string; itens: string[]; tom: string }) {
  return (
    <div>
      <p className={cn('rotulo mb-1.5', tom)}>{titulo}</p>
      <ul className="grid gap-1 text-sm leading-snug text-apoio">{itens.map((i) => <li key={i} className="flex gap-2"><span aria-hidden className="text-sutil">·</span>{i}</li>)}</ul>
    </div>
  )
}

function Autonomia({ id }: { id: AgenteId }) {
  const a = agente(id)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secundario" size="sm" aria-label={`O que o ${a.nome} faz sozinho`} className="shrink-0 px-2.5 md:px-3.5">
          <Info /> <span className="hidden md:inline">O que ele faz sozinho</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="grid max-h-[min(560px,calc(100svh-120px))] w-[min(380px,calc(100vw-32px))] gap-4 overflow-y-auto rounded-cartao border-0 p-4 shadow-flutua">
        <p className="text-sm font-semibold text-tinta">{a.nome}</p>
        {/* A autonomia é declarada POR FUNÇÃO (D9, revista): é o que a escola aponta quando perguntam "o que essa IA faz sozinha?" */}
        {a.funcoes && (
          <ul className="grid gap-px overflow-hidden rounded-controle border border-linha bg-linha">
            {a.funcoes.map((f) => {
              const Icone = f.icone
              return (
                <li key={f.id} className="flex items-start gap-2.5 bg-superficie px-3 py-2.5">
                  <span className="mt-px grid size-6 shrink-0 place-items-center rounded-[7px] bg-realce-suave text-tinta"><Icone className="size-3.5" /></span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 text-[13px] font-medium leading-snug text-tinta">{f.nome}{f.espera && <span className="text-xs font-normal text-pendente">espera você</span>}</span>
                    <span className="block text-[12.5px] leading-snug text-sutil">{f.autonomia}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {!a.funcoes && <Lista titulo="Faz sozinho" itens={a.fazSozinho} tom="text-apoio" />}
        {!a.funcoes && <Lista titulo="Espera sua aprovação" itens={a.esperaAprovacao} tom="text-pendente" />}
        <Lista titulo="Nunca faz" itens={a.nuncaFaz} tom="text-erro" />
      </PopoverContent>
    </Popover>
  )
}

/** O seletor pequeno que substitui a fileira de pílulas: a conversa inteira, ou só uma função do Assistente. */
function SeletorFiltro({ filtro, aoMudar }: { filtro: Filtro; aoMudar: (f: Filtro) => void }) {
  const atual = FILTROS.find((f) => f.id === filtro)!
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secundario" size="sm" aria-label={`Mostrar: ${atual.rotulo}`} className={cn('hidden gap-1.5 px-3 sm:inline-flex', filtro !== 'tudo' && 'border-tinta')}>
          <ListFilter strokeWidth={1.75} className="text-sutil" /> {atual.rotulo} <ChevronDown className="-mr-0.5 text-sutil" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className={menuConversa}>
        <OpcoesFiltro filtro={filtro} aoMudar={aoMudar} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function OpcoesFiltro({ filtro, aoMudar }: { filtro: Filtro; aoMudar: (f: Filtro) => void }) {
  return (
    <DropdownMenuRadioGroup value={filtro} onValueChange={(v) => aoMudar(v as Filtro)}>
      {FILTROS.map((f) => {
        const Icone = f.id === 'tudo' ? null : funcao(f.id).icone
        return (
          <DropdownMenuRadioItem key={f.id} value={f.id} className={cn(itemMenuConversa, 'pl-8')}>
            {f.rotulo}
            {Icone && <Icone className="ml-auto" strokeWidth={1.75} />}
          </DropdownMenuRadioItem>
        )
      })}
    </DropdownMenuRadioGroup>
  )
}

function ConversaDoAgente({ id, filtroInicial }: { id: Quem; filtroInicial: Filtro }) {
  const a = agente(id)
  const resumo = useResumoDo(id)
  const base = id === 'tutor' ? MENSAGENS_TUTOR : MENSAGENS_ASSISTENTE
  const hoje = base[base.length - 1].dia

  /* O que ela já fez nesta conversa mora em dados/time, e não aqui: `extras` são as mensagens que entraram e
     `resolvidas` as do agente que ela já respondeu (perdem os botões e saem da faixa). É de lá que a lateral tira o
     contador, então ele cai junto com a faixa; e a conversa não esquece a aprovação quando ela sai e volta. */
  const { extras, resolvidas } = useConversaTime(id)
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial)
  const [texto, setTexto] = useState('')
  const [respondendo, setRespondendo] = useState<{ id: string; modo: Modo } | null>(null)
  const [digitando, setDigitando] = useState(false)
  const [adiou, setAdiou] = useState(false)
  const [silenciado, setSilenciado] = useState(false)
  const [realce, setRealce] = useState<string | null>(null)
  const [chave, setChave] = useState(true)
  const [pedindo, setPedindo] = useState<string | null>(null)
  const [aberta, setAberta] = useState<{ aluno: string; motivo: string } | null>(null)

  const registro = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLInputElement>(null)
  /** as mensagens que entraram com a tela aberta: só elas ganham o movimento de entrada */
  const nascidas = useRef(new Set<string>())
  const esperas = useRef<number[]>([])
  const depois = useCallback((ms: number, f: () => void) => { esperas.current.push(window.setTimeout(f, ms)) }, [])
  useEffect(() => () => esperas.current.forEach(window.clearTimeout), [])

  const todas = [...base, ...extras]
  const visiveis = todas.filter((m) => filtro === 'tudo' || !m.funcao || m.funcao === 'conversa' || m.funcao === filtro)
  // na faixa, o mais recente primeiro
  const pendentes = base.filter((m) => m.pendente && !resolvidas[m.id]).reverse()
  // resposta rápida só vale para pendência que está na tela (com filtro, a de outra função some)
  const valeAgora = (r: RespostaRapida) => !r.enquanto || pendentes.some((p) => p.id === r.enquanto && visiveis.includes(p))
  const candidatas = adiou || respondendo || digitando ? [] : RESPOSTAS_RAPIDAS[id].filter(valeAgora)
  // sem nenhuma pendência na tela, "Depois eu vejo" sozinho não faz sentido
  const rapidas = candidatas.some((r) => r.enquanto) ? candidatas : []

  /* A conversa abre no fim, e volta para o fim a cada mensagem nova. */
  const irAoFim = useCallback(() => { const el = registro.current; if (el) el.scrollTop = el.scrollHeight }, [])
  useLayoutEffect(irAoFim, [irAoFim, filtro])
  useEffect(irAoFim, [irAoFim, extras.length, digitando, silenciado])
  useEffect(() => { if (aberta) document.getElementById('conversa-aberta')?.scrollIntoView({ block: 'nearest' }) }, [aberta])

  const suave = () => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth') as ScrollBehavior

  /** A hora da próxima mensagem dela: o relógio do mockup anda um minuto por mensagem. */
  const proximaHora = () => conversaTime.proximaHora(id)

  const entra = (m: Omit<MensagemTime, 'id' | 'dia'>) => { nascidas.current.add(conversaTime.entra(id, { ...m, dia: hoje })) }

  const replicar = (r: Replica, de: FuncaoId | undefined, hora: string) => {
    setDigitando(true)
    // fora das `esperas`: se ela sair da tela antes da réplica, a mensagem do agente chega à conversa do mesmo jeito
    window.setTimeout(() => {
      setDigitando(false)
      entra({ de: 'agente', hora, funcao: de ?? (id === 'assistente' ? 'conversa' : undefined), texto: r.texto, acoes: r.acoes })
    }, 1200)
  }

  const rotuloDe = (m: MensagemTime) => m.pendente ?? `${m.funcao ? funcao(m.funcao).nome : a.curto} · ${m.hora}`

  /** Ela clicou numa ação que responde: entra a mensagem dela com o registro, e a do agente perde os botões. */
  const responder = (origem: MensagemTime, r: RespostaPronta) => {
    const hora = proximaHora()
    conversaTime.resolve(id, origem.id, (r.registro && RESOLVIDA[r.registro.verbo]) ?? 'respondida')
    setRespondendo(null)
    // se já tem conversa entre a mensagem do agente e a resposta, ela cita o que está respondendo
    const cita = todas[todas.length - 1].id === origem.id ? undefined : rotuloDe(origem)
    entra({ de: 'professora', hora, funcao: origem.funcao, cita, texto: r.texto, registro: r.registro && { ...r.registro, quando: `21/09, ${hora}` } })
    if (r.replica) replicar(r.replica, origem.funcao, hora)
  }

  const abrirResposta = (m: MensagemTime, modo: Modo) => {
    setRespondendo({ id: m.id, modo })
    depois(60, () => campo.current?.focus())
  }

  const enviar = (bruto: string) => {
    const alvo = respondendo ? todas.find((m) => m.id === respondendo.id) : undefined
    const modo = respondendo?.modo
    const hora = proximaHora()
    setTexto('')
    setRespondendo(null)
    if (alvo && modo === 'rejeitar') {
      conversaTime.resolve(id, alvo.id, 'rejeitada')
      entra({ de: 'professora', hora, funcao: alvo.funcao, texto: comPonto(`Rejeitei: ${minuscula(bruto)}`), registro: { verbo: 'Rejeitado por', tom: 'erro', quando: `21/09, ${hora}` } })
      replicar(REPLICA_REJEICAO, alvo.funcao, hora)
    } else if (alvo && modo === 'contestar') {
      entra({ de: 'professora', hora, funcao: alvo.funcao, cita: rotuloDe(alvo), texto: comPonto(bruto), registro: { verbo: 'Contestação registrada por', tom: 'neutro', quando: `21/09, ${hora}` } })
      replicar(REPLICA_CONTESTACAO[id], alvo.funcao, hora)
    } else {
      entra({ de: 'professora', hora, funcao: alvo?.funcao, cita: alvo && rotuloDe(alvo), texto: bruto })
      replicar(respostaLivre(id, bruto), alvo?.funcao, hora)
    }
  }

  const usarRapida = (r: RespostaRapida) => {
    if (r.aciona) {
      const m = base.find((x) => x.id === r.aciona!.msg)
      const acao = m?.acoes?.find((x) => x.id === r.aciona!.acao)
      if (m && acao?.responde) responder(m, acao.responde)
      return
    }
    if (!r.texto) return
    const hora = proximaHora()
    if (r.encerra) setAdiou(true)
    entra({ de: 'professora', hora, texto: r.texto })
    if (r.replica) replicar(r.replica, undefined, hora)
  }

  /** Atalho da faixa: rola até a mensagem e dá um realce rápido nela. */
  const irPara = (idMsg: string) => {
    if (filtro !== 'tudo') setFiltro('tudo')
    requestAnimationFrame(() => {
      document.getElementById(`msg-${idMsg}`)?.scrollIntoView({ block: 'center', behavior: suave() })
      setRealce(idMsg)
      depois(1500, () => setRealce((r) => (r === idMsg ? null : r)))
    })
  }

  const copiar = (m: MensagemTime) => { navigator.clipboard?.writeText(m.texto.replaceAll('**', '')).catch(() => {}) }

  const botao = (m: MensagemTime, acao: AcaoMsg) => {
    const Icone = acao.icone ? ICONE_ACAO[acao.icone] : null
    const veste = 'h-9 px-3.5 md:h-8 md:px-3'
    if (acao.para) {
      return (
        <Button key={acao.id} variant={acao.variante} size="sm" className={veste} asChild>
          <Link to={acao.para}>{Icone && acao.icone !== 'seta' && <Icone />}{acao.rotulo}{Icone && acao.icone === 'seta' && <Icone />}</Link>
        </Button>
      )
    }
    return (
      <Button key={acao.id} variant={acao.variante} size="sm" className={veste}
        onClick={() => (acao.responde ? responder(m, acao.responde) : acao.pedeMotivo ? abrirResposta(m, 'rejeitar') : undefined)}>
        {acao.rotulo}
      </Button>
    )
  }

  const alvoDaResposta = respondendo && todas.find((m) => m.id === respondendo.id)
  const presenca = silenciado ? 'silenciado' : resumo?.ativo ? 'ativo' : 'ausente'
  const estado = digitando ? 'digitando…' : silenciado ? 'avisos silenciados até amanhã, 7h' : `${resumo?.ativo ? 'ativo agora' : 'ausente'} · ${a.autonomia}`

  let diaAnterior = ''

  return (
    <div className="h-[calc(100svh-56px)] md:h-svh">
      <Conversa aria-label={`Conversa com o ${a.nome}`}>
        <ConversaCabecalho
          avatar={<AvatarAgente id={id} tamanho={40} />}
          nome={<><span className="truncate">{a.nome}</span> <SeloIA /></>}
          /* A autonomia em português comum, nunca "nível 2" (D9) */
          estado={<><PontoPresenca estado={presenca} /><span className="truncate">{estado}</span></>}
          acoes={
            <>
              {id === 'assistente' && <SeletorFiltro filtro={filtro} aoMudar={setFiltro} />}
              <Autonomia id={id} />
              <MenuConversa rotulo={`Mais opções da conversa com o ${a.curto}`}>
                {id === 'assistente' && (
                  <div className="sm:hidden">
                    <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[13px] font-medium text-sutil">Mostrar</DropdownMenuLabel>
                    <OpcoesFiltro filtro={filtro} aoMudar={setFiltro} />
                    <DropdownMenuSeparator className="mx-1 my-1.5 bg-linha" />
                  </div>
                )}
                <DropdownMenuItem className={itemMenuConversa} onSelect={() => setSilenciado((s) => !s)}>
                  {silenciado ? <BellRing strokeWidth={1.75} /> : <BellOff strokeWidth={1.75} />}
                  {silenciado ? 'Voltar a avisar' : 'Silenciar avisos até amanhã'}
                </DropdownMenuItem>
                <DropdownMenuItem className={itemMenuConversa} onSelect={() => registro.current?.scrollTo({ top: 0, behavior: suave() })}>
                  <History strokeWidth={1.75} /> Ver o que ficou para trás
                </DropdownMenuItem>
              </MenuConversa>
            </>
          }
        />

        {pendentes.length > 0 && (
          <ConversaFaixa role="group" aria-label={`Esperando você: ${pendentes.length}`}>
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-caramelo text-[11.5px] font-semibold leading-none text-tinta">{pendentes.length}</span>
            <span className="shrink-0 text-[13px] font-medium text-tinta">Esperando você</span>
            <div className="ml-1 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {pendentes.map((m) => {
                const Icone = m.funcao ? funcao(m.funcao).icone : null
                return (
                  <button key={m.id} type="button" onClick={() => irPara(m.id)}
                    className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-borda-campo bg-superficie px-2.5 text-[12.5px] font-medium text-tinta transition-colors duration-150 hover:bg-realce-suave">
                    {Icone && <Icone className="size-3.5 text-sutil" strokeWidth={1.9} />}
                    {m.pendente}
                  </button>
                )
              })}
            </div>
          </ConversaFaixa>
        )}

        <ConversaRegistro rotulo={`Mensagens do ${a.nome}`} viewportRef={registro}>
          {id === 'tutor' && <NotaSistema icone={<ShieldCheck strokeWidth={1.75} />}><Texto>{AVISO_TUTOR}</Texto></NotaSistema>}
          {filtro !== 'tudo' && (
            <NotaSistema className="items-center">
              Só as mensagens de <b className="font-medium text-tinta">{funcao(filtro).nome}</b>.{' '}
              <button type="button" onClick={() => setFiltro('tudo')} className="font-medium text-tinta underline underline-offset-4 hover:text-sutil">Ver tudo</button>
            </NotaSistema>
          )}

          {visiveis.map((m) => {
            const separador = m.dia !== diaAnterior ? <SeparadorDia>{m.dia}</SeparadorDia> : null
            diaAnterior = m.dia
            const dela = m.de === 'professora'
            const resolvida = resolvidas[m.id]
            const espera = Boolean(m.pendente) && !resolvida
            const f = m.funcao ? funcao(m.funcao) : null
            const IconeFuncao = f?.icone

            let remetente: ReactNode = a.curto
            if (dela) remetente = 'Você'
            else if (f && IconeFuncao) remetente = <><IconeFuncao className="size-3.5 text-sutil" strokeWidth={1.9} />{f.nome}</>

            let selo: ReactNode = null
            if (m.sinal) selo = <Sinal tipo={m.sinal.tipo} detalhe={m.sinal.detalhe} className="ml-0.5" />
            else if (espera) selo = <Estado tipo="pendente" size="sm" className="ml-0.5">Esperando você</Estado>
            else if (m.soAviso) selo = <><span aria-hidden>·</span><span>só aviso</span></>
            const IconeMarca = resolvida === 'rejeitada' ? X : Check
            const marca = resolvida ? <span className="inline-flex items-center gap-1"><IconeMarca className="size-3" strokeWidth={2.4} />{resolvida}</span> : null

            return (
              <Fragment key={m.id}>
              {separador}
              <Mensagem
                id={`msg-${m.id}`}
                lado={dela ? 'direita' : 'esquerda'}
                avatar={dela ? <AvatarIniciais iniciais={PROFESSORA.iniciais} /> : <AvatarAgente id={id} tamanho={32} />}
                remetente={remetente}
                hora={m.hora}
                selo={<>{selo}{marca}</>}
                menu={<AcoesMensagem alinhar={dela ? 'end' : 'start'} aoCopiar={() => copiar(m)}
                  aoResponder={dela ? undefined : () => abrirResposta(m, 'responder')}
                  aoContestar={dela ? undefined : () => abrirResposta(m, 'contestar')} />}
                anexo={m.anexo && <Anexo anexo={m.anexo} chave={chave} aoMudarChave={setChave} aberta={aberta} aoPedirConversa={setPedindo} />}
                nota={m.nota && (
                  <>
                    {m.nota}{' '}
                    {m.contestavel && <button type="button" onClick={() => abrirResposta(m, 'contestar')} className="font-medium text-tinta underline underline-offset-4 hover:text-sutil">Contestar este sinal</button>}
                  </>
                )}
                acoes={m.acoes && !resolvida ? m.acoes.map((acao) => botao(m, acao)) : undefined}
                registro={m.registro && <LinhaRegistro r={m.registro} />}
                nova={nascidas.current.has(m.id)}
                realce={realce === m.id}
              >
                {m.cita && <span className="mb-1 block border-l-2 border-sutil pl-2 text-[12.5px] leading-snug text-inativo">{m.cita}</span>}
                <Texto>{m.texto}</Texto>
                {/* o chip de página é cinza como o balão: aqui dentro ele fica branco */}
                {m.fonte && <span className="[&>button]:bg-superficie"> <ChipFonte pagina={m.fonte} /></span>}
              </Mensagem>
              </Fragment>
            )
          })}

          {digitando && <Digitando avatar={<AvatarAgente id={id} tamanho={32} />} quem={a.curto} />}
          {silenciado && <NotaSistema icone={<BellOff strokeWidth={1.75} />} className="animate-entra">Avisos silenciados até amanhã, 7h. O que espera você continua preso aqui em cima.</NotaSistema>}
        </ConversaRegistro>

        <ConversaRodape>
          {alvoDaResposta && respondendo ? (
            <p className="flex h-8 w-fit max-w-full items-center gap-1.5 rounded-full bg-realce-suave pl-3 pr-1 text-[13px] text-sutil">
              <CornerDownRight className="size-3.5 shrink-0" strokeWidth={1.9} />
              <span className="truncate">{MODO[respondendo.modo].chip} <b className="font-medium text-tinta">{rotuloDe(alvoDaResposta)}</b></span>
              <button type="button" aria-label="Cancelar" onClick={() => setRespondendo(null)} className="grid size-6 shrink-0 place-items-center rounded-full text-sutil transition-colors duration-150 hover:bg-realce hover:text-tinta"><X className="size-3.5" /></button>
            </p>
          ) : rapidas.length > 0 ? (
            // do lado DELA (direita): é o que ela diria, e não se confunde com os botões da mensagem do agente
            <div role="group" aria-label="Respostas rápidas" className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max min-w-full justify-end gap-1.5">
                {rapidas.map((r) => (
                  <button key={r.id} type="button" onClick={() => usarRapida(r)}
                    className="inline-flex h-8 shrink-0 items-center rounded-full border border-borda-campo bg-superficie px-3 text-[13px] text-apoio transition-colors duration-150 hover:bg-realce-suave hover:text-tinta">
                    {r.rotulo}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <CampoResposta ref={campo} valor={texto} aoMudar={setTexto} aoEnviar={enviar}
            placeholder={respondendo ? MODO[respondendo.modo].campo : id === 'tutor' ? 'Perguntar ao Tutor sobre a turma…' : `Responder ao ${a.curto}…`} />
        </ConversaRodape>
      </Conversa>

      <DialogoAuditoria aluno={pedindo} aberto={pedindo !== null} aoMudar={(v) => !v && setPedindo(null)}
        aoConfirmar={(motivo) => { if (pedindo) setAberta({ aluno: pedindo, motivo }); setPedindo(null) }} />

      <NotaMockup>
        F11, com a fatia do MVP: o dia aberto (A2), a correção esperando (A3), os sinais do Tutor (A4) e a versão adaptada pendente (A2).
        Um agente por pessoa: o que eram Corretor, Adaptador e Planejador são funções do Assistente, e a autonomia (D9) e a suspensão (D60) passam a valer por função — revisão da D32 a registrar.
        D34: aluno nomeado só para o professor da turma. D36: "atenção humana" chega sem o conteúdo. Abrir conversa é ação à parte, com registro em auditoria (regra 50, item 10). D46: no MVP fala-se em acerto, não em nota.
        A caixa de resposta ao agente e o "Contestar" por mensagem são proposta do mockup: no produto, falta decidir o que o Assistente faz com uma resposta livre.
        Peças: HextaUI/messaging-conversation (21st.dev), shadcn/scroll-area, dropdown-menu, popover, alert-dialog, switch.
      </NotaMockup>
    </div>
  )
}

export function Time() {
  const { agente: param } = useParams()
  const id: Quem = param === 'tutor' ? 'tutor' : 'assistente'
  const filtroInicial: Filtro = param && LEGADO[param] ? LEGADO[param] : 'tudo'
  // a chave zera a conversa ao trocar de agente: a rota é a mesma, e sem ela o estado de um vazaria para o outro
  return <ConversaDoAgente key={`${id}-${filtroInicial}`} id={id} filtroInicial={filtroInicial} />
}
