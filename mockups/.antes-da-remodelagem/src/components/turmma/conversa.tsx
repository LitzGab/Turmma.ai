import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronRight, FileText, Globe, type LucideIcon } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ErrorMessage } from '@/components/ui/error-message'
import { Message, MessageContent, MessageFooter, MessageHeader } from '@/components/ui/message'
import { MessageLoading } from '@/components/ui/message-loading'
import { UserMessage } from '@/components/ui/user-message'
import { AssinaturaIA } from '@/components/turmma/ia'
import type { AgenteId } from '@/dados/agentes'
import { cn } from '@/lib/utils'

/* A conversa é MONTADA com peças pequenas do 21st.dev, não adotada como bloco (10.2):
   shadcn/message é a moldura de toda mensagem; serafimcloud/user-message é a bolha de quem escreve;
   jakobhoeg/message-loading são os três pontos; shadcn/collapsible é a lista de fontes. */

/** Quem escreve fica à direita, em bolha creme. */
export function MensagemPessoa({ texto, calmo = false }: { texto: string; calmo?: boolean }) {
  // calmo: na área do aluno não há coreografia de entrada (9.5, regra 7)
  return <UserMessage className={calmo ? undefined : 'animate-entra'} message={{ id: texto, parts: [{ type: 'text', text: texto }] }} />
}

/** A IA não tem bolha: texto na largura da coluna, e no cabeçalho a assinatura (avatar, função, selo "IA"). */
export function MensagemIA({ agente, children, rodape, extra, className, calmo = false }: {
  agente: AgenteId; children: ReactNode; rodape?: ReactNode; extra?: ReactNode; className?: string; calmo?: boolean
}) {
  return (
    <Message className={cn(!calmo && 'animate-entra', className)}>
      <MessageContent className="gap-2.5">
        <MessageHeader><AssinaturaIA id={agente} extra={extra} /></MessageHeader>
        <div className="min-w-0 text-base leading-[1.6] text-tinta">{children}</div>
        {rodape && <MessageFooter className="flex-wrap gap-1 pt-1">{rodape}</MessageFooter>}
      </MessageContent>
    </Message>
  )
}

export type OpcaoEscolha = { id: string; titulo: string; descricao: string; icone: LucideIcon }

/** A pergunta da D18 ("quer usar a ferramenta?"), no desenho do theshanelevine/approval-card (21st.dev · 23595):
    um cartão ESTREITO com as opções em linha — ícone, título, uma frase — em vez de dois botões largos e vazios.
    As opções têm o MESMO peso: nenhuma é a "certa", nenhuma vem destacada (D59). Depois da escolha o cartão
    encolhe para uma linha que diz o que foi escolhido. */
export function Escolha({ pergunta, opcoes, escolhida, aoEscolher }: {
  pergunta: ReactNode; opcoes: OpcaoEscolha[]; escolhida?: string | null; aoEscolher: (id: string) => void
}) {
  const feita = opcoes.find((o) => o.id === escolhida)
  if (feita) {
    return (
      <p className="inline-flex max-w-full items-center gap-2 rounded-full bg-realce-suave py-1.5 pl-2 pr-3.5 text-[13.5px] text-sutil">
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-tinta text-white"><Check className="size-3" strokeWidth={3} /></span>
        <span className="truncate">Você escolheu <b className="font-medium text-tinta">{feita.titulo.charAt(0).toLowerCase() + feita.titulo.slice(1)}</b></span>
      </p>
    )
  }
  return (
    <div className="w-full max-w-[460px] overflow-hidden rounded-cartao bg-superficie shadow-caixa">
      <p className="px-4 pb-2 pt-3.5 text-[15px] leading-snug text-tinta">{pergunta}</p>
      <div role="group" aria-label="Como você prefere" className="grid gap-0.5 p-1.5 pt-0">
        {opcoes.map((o) => {
          const Icone = o.icone
          return (
            <button key={o.id} type="button" onClick={() => aoEscolher(o.id)}
              className="group flex w-full items-center gap-3 rounded-linha px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-realce-suave">
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-realce-suave text-tinta transition-colors duration-150 group-hover:bg-superficie"><Icone className="size-[18px]" strokeWidth={1.75} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-medium leading-snug text-tinta">{o.titulo}</span>
                <span className="block text-[13px] leading-snug text-sutil">{o.descricao}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-inativo transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-tinta" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** "Pensando": os três pontos. Laço que mostra trabalho acontecendo — o único tipo de laço permitido (9.5). */
export function Pensando({ agente, calmo = false }: { agente: AgenteId; calmo?: boolean }) {
  return (
    <MensagemIA agente={agente} calmo={calmo}>
      <span className="inline-flex h-7 items-center text-sutil motion-reduce:[&_*]:animate-none" role="status" aria-label="Pensando">
        <MessageLoading />
      </span>
    </MensagemIA>
  )
}

/** Fila cheia ou provedor lento vira aviso dentro da conversa, nunca erro cru (regra 80, item 4). */
export function AvisoFila() {
  return <ErrorMessage title="Muita gente usando agora" message="Sua resposta sai em instantes. Você não precisa pedir de novo." className="[&>div]:rounded-controle [&>div]:border-linha [&>div]:bg-pendente-cx [&_div]:text-pendente" />
}

export type Fonte = { tipo: 'material'; titulo: string; pagina: number } | { tipo: 'web'; titulo: string; dominio: string }

/** Lista de fontes ao fim da resposta. Duas variantes de linha: "material da escola, p. X" e "da web" (D68). */
export function Fontes({ itens }: { itens: Fonte[] }) {
  return (
    <Collapsible className="group/fontes mt-4">
      <CollapsibleTrigger className="flex h-9 items-center gap-1.5 rounded-linha px-1.5 text-sm font-medium text-apoio hover:bg-realce">
        <ChevronRight className="size-4 transition-transform duration-[260ms] group-data-[state=open]/fontes:rotate-90" />
        Fontes ({itens.length})
        <span className="font-normal text-sutil">
          : {itens.map((f) => (f.tipo === 'material' ? `p. ${f.pagina}` : f.dominio)).join(' · ')}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-1.5 grid gap-1.5">
          {itens.map((f, i) => (
            <li key={i} className={cn('flex items-center gap-2.5 rounded-controle px-3 py-2 text-sm',
              f.tipo === 'material' ? 'bg-ia-cx text-apoio' : 'border border-dashed border-borda-campo text-apoio')}>
              {f.tipo === 'material' ? <FileText className="size-4 shrink-0" /> : <Globe className="size-4 shrink-0" />}
              <span className="min-w-0 flex-1 truncate">{f.titulo}</span>
              <span className="shrink-0 font-medium text-tinta">{f.tipo === 'material' ? `material da escola, p. ${f.pagina}` : `da web · ${f.dominio}`}</span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Simula o texto chegando em fluxo: devolve quantos blocos já chegaram. Sem efeito por letra (9.5). */
export function useFluxo(total: number, ativo: boolean, intervalo = 420) {
  const [n, setN] = useState(ativo ? 0 : total)
  const parado = useRef(false)
  useEffect(() => {
    if (!ativo) return
    parado.current = false
    setN(0)
    const t = window.setInterval(() => {
      setN((v) => {
        if (parado.current || v >= total) { window.clearInterval(t); return v }
        return v + 1
      })
    }, intervalo)
    return () => window.clearInterval(t)
  }, [ativo, total, intervalo])
  return { chegou: n, fim: n >= total || parado.current, parar: () => { parado.current = true; setN((v) => v) } }
}

/** Mantém a lista rolada até o fim quando chega conteúdo novo. O ref vai no contêiner que rola. */
export function useRolarAoFim(dep: unknown) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const calmo = document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: calmo ? 'auto' : 'smooth' }), 40)
    return () => window.clearTimeout(id)
  }, [dep])
  return ref
}
