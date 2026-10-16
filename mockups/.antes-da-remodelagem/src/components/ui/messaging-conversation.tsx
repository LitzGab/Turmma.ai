"use client"

/* HextaUI · messaging-conversation (21st.dev), colada pelo Gabriel em 20/09/2026 como MODELO da conversa do time
   ("faça em formato de conversa mesmo. O agente enviando mensagem").

   A ANATOMIA É A DA PEÇA: cabeçalho fixo (avatar, nome, estado, menu ⋮) · registro rolando por dentro (role="log",
   sobre ui/scroll-area) · cada mensagem com avatar de 32 px, BALÃO — o meu à direita e escuro, o do outro à
   esquerda e claro —, a hora e o menu ⋯ (Responder, Copiar…) que só aparece no hover.

   O QUE MUDOU NA ADOÇÃO, E POR QUÊ
   · Parametrizada: a peça vinha com DEMO_USER, DEMO_OTHER e DEMO_MESSAGES dentro; aqui é só moldura e slots.
   · ui/card saiu: a conversa ocupa a janela inteira (padrão de tela de trabalho), não é um cartão de 75vh.
   · Coluna de leitura de 780 px, centrada: cabeçalho, faixa, registro e caixa de resposta no mesmo eixo.
   · Cores: `bg-primary`/`bg-accent` viram `bg-tinta` (balão dela) e `bg-realce-suave` (balão do agente). Canto de
     18 px, com o canto de cima do lado de quem fala em 6 px (a peça tinha `rounded-md` nos quatro).
   · "online" em verde-500 vira o ponto `bg-ok` com "ativo agora": o único verde da tela. "dnd" vermelho vira
     "silenciado" em cinza (vermelho é erro); "offline" vira "ausente".
   · Avatar com foto (AvatarImage + cdn.21st.dev) saiu: agente não tem rosto e ninguém tem foto. O slot recebe o
     AvatarAgente; o dela é `AvatarIniciais`, as iniciais no círculo laranja, como na lateral.
   · A hora SUBIU para cima do balão, junto de quem fala (no nosso caso, a FUNÇÃO do agente) e do selo de estado;
     o ⋯ continua na mesma linha da hora, como na peça.
   · Menu ⋮ do cabeçalho: "Block User / Delete Conversation / Report User" saíram (não fazem sentido para agente);
     o conteúdo agora é slot. Menu ⋯ da mensagem: "Delete" saiu (o que ela respondeu é registro) e "Report" em
     amarelo virou "Contestar", sem cor, só na mensagem do agente.
   · ENTROU o que a peça não tinha: separador de dia, nota do sistema, ANEXO embaixo do balão, AÇÕES (botões) da
     mensagem, linha de registro, faixa fixa embaixo do cabeçalho, "digitando" e a caixa de resposta em pílula.
   · Movimento: só o `animate-entra` na mensagem nova e a opacidade do ⋯ e do realce. Os três pontos do
     "digitando" são a peça jakobhoeg/message-loading, que a conversa principal já usa. */

import * as React from "react"
import { ArrowUp, Copy, Flag, MoreHorizontal, MoreVertical, Reply } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MessageLoading } from "@/components/ui/message-loading"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

/** A coluna de leitura: tudo na conversa mora neste eixo. */
const COLUNA = "mx-auto w-full max-w-[780px]"
const MARGEM = "px-4 md:px-6"

/** Vestes dos menus (iguais às da lateral): canto de 16, sem borda, a sombra do que flutua; item de 36 px. */
export const menuConversa = "min-w-44 rounded-cartao border-0 p-1.5 shadow-flutua"
export const itemMenuConversa = "h-9 gap-2.5 rounded-linha text-[13.5px] text-tinta [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sutil"

/** A moldura: ocupa a altura que o pai der e rola só no registro. */
export function Conversa({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-fundo", className)} {...props} />
}

/** Cabeçalho fixo de 64 px: avatar, nome, estado e, à direita, as ações. */
export function ConversaCabecalho({ avatar, nome, estado, acoes, className }: {
  avatar: React.ReactNode; nome: React.ReactNode; estado?: React.ReactNode; acoes?: React.ReactNode; className?: string
}) {
  return (
    <header className={cn("z-10 shrink-0 border-b border-linha bg-fundo", MARGEM, className)}>
      <div className={cn("flex h-16 items-center justify-between gap-3", COLUNA)}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">{avatar}</div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="flex min-w-0 items-center gap-2 font-corpo text-[15px] font-semibold leading-tight text-tinta">{nome}</h1>
            {estado && <div className="flex min-w-0 items-center gap-1.5 text-[13px] leading-tight text-sutil">{estado}</div>}
          </div>
        </div>
        {acoes && <div className="flex shrink-0 items-center gap-1.5">{acoes}</div>}
      </div>
    </header>
  )
}

export type Presenca = "ativo" | "silenciado" | "ausente"

const PONTO: Record<Presenca, string> = {
  ativo: "bg-ok",
  silenciado: "bg-inativo",
  ausente: "border border-inativo bg-fundo",
}

/** O ponto de estado do cabeçalho. Estado nunca é só cor: vem sempre com o texto ao lado. */
export function PontoPresenca({ estado, className }: { estado: Presenca; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", PONTO[estado], className)} />
}

/** O menu ⋮ do cabeçalho. Os itens são de quem usa (DropdownMenuItem com `itemMenuConversa`). */
export function MenuConversa({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={rotulo} size="icon-sm" type="button" variant="secundario">
          <MoreVertical aria-hidden focusable="false" strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className={cn(menuConversa, "min-w-60")}>{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Faixa fixa embaixo do cabeçalho (44 px), no eixo da coluna: o que pede ação fica preso aqui. */
export function ConversaFaixa({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("z-10 shrink-0 border-b border-linha bg-fundo", MARGEM)} {...props}>
      <div className={cn("flex h-11 items-center gap-2", COLUNA, className)}>{children}</div>
    </div>
  )
}

/** O registro de mensagens: rola por dentro. `viewportRef` é a porta para abrir no fim e rolar até uma mensagem. */
export function ConversaRegistro({ rotulo, viewportRef, className, children }: {
  rotulo: string; viewportRef?: React.Ref<HTMLDivElement>; className?: string; children: React.ReactNode
}) {
  return (
    // `[&>div]:!block`: o Radix embrulha o conteúdo numa tabela, que deixa texto longo alargar a coluna.
    <ScrollArea aria-label={rotulo} role="log" className="min-h-0 flex-1" viewportRef={viewportRef} viewportClassName="[&>div]:!block">
      <div className={MARGEM}>
        <div className={cn("flex flex-col gap-5 pb-6 pt-5", COLUNA, className)}>{children}</div>
      </div>
    </ScrollArea>
  )
}

/** Separador de dia: o nome do dia no meio de um fio. */
export function SeparadorDia({ children }: { children: React.ReactNode }) {
  return (
    <div role="separator" className="flex items-center gap-3 text-[12.5px] font-medium leading-none text-sutil">
      <span aria-hidden className="h-px flex-1 bg-linha" />
      <span>{children}</span>
      <span aria-hidden className="h-px flex-1 bg-linha" />
    </div>
  )
}

/** Nota do sistema: discreta e centrada. Não é de ninguém, então não tem avatar nem balão. */
export function NotaSistema({ icone, children, className }: { icone?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mx-auto flex max-w-[620px] items-start gap-2 rounded-cartao bg-lateral px-3.5 py-2.5 text-[13px] leading-relaxed text-sutil [&_svg]:mt-[3px] [&_svg]:size-3.5 [&_svg]:shrink-0", className)}>
      {icone}
      <span className="min-w-0">{children}</span>
    </p>
  )
}

/** O avatar de quem não é agente: as iniciais, nunca foto. */
export function AvatarIniciais({ iniciais, tamanho = 32, className }: { iniciais: string; tamanho?: number; className?: string }) {
  return (
    <Avatar aria-hidden className={className} style={{ width: tamanho, height: tamanho }}>
      <AvatarFallback className="bg-caramelo text-[11.5px] font-semibold text-tinta">{iniciais}</AvatarFallback>
    </Avatar>
  )
}

const BALAO = {
  esquerda: "rounded-tl-[6px] bg-realce-suave text-tinta",
  direita: "rounded-tr-[6px] bg-tinta text-white",
}

/** "9h50" → "09:50", para o atributo dateTime. */
const paraDateTime = (hora: string) => hora.replace("h", ":").padStart(5, "0")

export type MensagemProps = {
  /** agente à esquerda, quem escreve à direita */
  lado: "esquerda" | "direita"
  avatar: React.ReactNode
  /** quem fala, em cima do balão: o nome ou a função, com ícone */
  remetente?: React.ReactNode
  hora: string
  /** selo de estado junto da hora ("Esperando você", o sinal do Tutor) */
  selo?: React.ReactNode
  /** o menu ⋯, que aparece no hover (ver `AcoesMensagem`) */
  menu?: React.ReactNode
  /** o texto, dentro do balão */
  children?: React.ReactNode
  /** embaixo do balão: resumo, arquivo, lista de alunos */
  anexo?: React.ReactNode
  /** texto pequeno embaixo do anexo */
  nota?: React.ReactNode
  /** os botões da mensagem, alinhados ao balão */
  acoes?: React.ReactNode
  /** a linha de registro embaixo do balão ("Aprovado por…") */
  registro?: React.ReactNode
  /** mensagem que acabou de chegar: entra com o `animate-entra` */
  nova?: boolean
  /** realce rápido, quando se chega nela por um atalho */
  realce?: boolean
  id?: string
  className?: string
}

export function Mensagem({ lado, avatar, remetente, hora, selo, menu, children, anexo, nota, acoes, registro, nova, realce, id, className }: MensagemProps) {
  const direita = lado === "direita"
  return (
    <article id={id} data-lado={lado} className={cn("group/msg relative flex items-start gap-2.5", direita && "flex-row-reverse", nova && "animate-entra", className)}>
      <span aria-hidden className={cn("pointer-events-none absolute -inset-x-2.5 -inset-y-2.5 rounded-cartao bg-pendente-cx opacity-0 transition-opacity duration-300", realce && "opacity-100")} />
      <div className="relative shrink-0">{avatar}</div>
      <div className={cn("relative flex min-w-0 flex-1 flex-col gap-1.5", direita ? "items-end" : "items-start")}>
        <div className={cn("flex min-h-6 max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] leading-none text-sutil", direita && "flex-row-reverse")}>
          {remetente && <span className="inline-flex items-center gap-1.5 font-medium text-apoio">{remetente}</span>}
          {remetente && <span aria-hidden>·</span>}
          <time aria-label={`Enviada às ${hora}`} dateTime={paraDateTime(hora)}>{hora}</time>
          {selo}
          {menu}
        </div>
        {children && (
          <div className={cn("w-fit max-w-full rounded-[18px] px-3.5 py-2.5 text-[15px] leading-[1.55] sm:max-w-[82%]", BALAO[lado])}>{children}</div>
        )}
        {anexo}
        {nota && <div className="max-w-full text-[12.5px] leading-relaxed text-sutil sm:max-w-[82%]">{nota}</div>}
        {acoes && <div className={cn("flex max-w-full flex-wrap items-center gap-1.5 pt-0.5", direita && "justify-end")}>{acoes}</div>}
        {registro}
      </div>
    </article>
  )
}

/** O menu ⋯ da mensagem. No mouse aparece no hover; no toque e no teclado está sempre lá. */
export function AcoesMensagem({ aoResponder, aoCopiar, aoContestar, alinhar = "start" }: {
  aoResponder?: () => void; aoCopiar?: () => void; aoContestar?: () => void; alinhar?: "start" | "center" | "end"
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Ações da mensagem"
          className="grid size-6 place-items-center rounded-[7px] text-sutil transition-opacity duration-150 hover:bg-realce-suave hover:text-tinta focus-visible:opacity-100 data-[state=open]:bg-realce-suave data-[state=open]:text-tinta data-[state=open]:opacity-100 md:opacity-0 md:group-hover/msg:opacity-100">
          <MoreHorizontal aria-hidden focusable="false" className="size-4" />
        </button>
      </DropdownMenuTrigger>
      {/* o foco não volta para o ⋯: "Responder" e "Contestar" levam o cursor para a caixa de resposta */}
      <DropdownMenuContent align={alinhar} className={menuConversa} onCloseAutoFocus={(e) => e.preventDefault()}>
        {aoResponder && <DropdownMenuItem className={itemMenuConversa} onSelect={aoResponder}><Reply aria-hidden strokeWidth={1.75} /> Responder</DropdownMenuItem>}
        {aoCopiar && <DropdownMenuItem className={itemMenuConversa} onSelect={aoCopiar}><Copy aria-hidden strokeWidth={1.75} /> Copiar</DropdownMenuItem>}
        {aoContestar && <DropdownMenuItem className={itemMenuConversa} onSelect={aoContestar}><Flag aria-hidden strokeWidth={1.75} /> Contestar</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "digitando…": os três pontos dentro do balão do agente. */
export function Digitando({ avatar, quem }: { avatar: React.ReactNode; quem: string }) {
  return (
    <div className="flex animate-entra items-start gap-2.5" role="status">
      <div className="shrink-0">{avatar}</div>
      <div className={cn("flex h-10 items-center rounded-[18px] px-3.5 [&_svg]:text-sutil", BALAO.esquerda)}>
        <MessageLoading />
        <span className="sr-only">{quem} está digitando…</span>
      </div>
    </div>
  )
}

/** O pé fixo, no eixo da coluna: respostas rápidas em cima, a caixa embaixo. */
export function ConversaRodape({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <footer className={cn("relative z-10 shrink-0 bg-fundo pb-4 pt-1", MARGEM)}>
      {/* a mensagem que passa por baixo do pé some num degradê, em vez de ser cortada a seco */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-5 h-5 bg-linear-to-t from-fundo to-transparent" />
      <div className={cn("flex flex-col gap-2", COLUNA, className)}>{children}</div>
    </footer>
  )
}

/** A caixa de resposta: o desenho da caixa de pedido (sombra suave, enviar redondo), numa pílula de 44 px. */
export const CampoResposta = React.forwardRef<HTMLInputElement, {
  valor: string; aoMudar: (v: string) => void; aoEnviar: (texto: string) => void; placeholder: string; className?: string
}>(({ valor, aoMudar, aoEnviar, placeholder, className }, ref) => {
  const pronto = valor.trim().length > 0
  return (
    <form className={cn("flex h-11 items-center gap-2 rounded-full bg-superficie pl-[18px] pr-1.5 shadow-caixa", className)}
      onSubmit={(e) => { e.preventDefault(); if (pronto) aoEnviar(valor.trim()) }}>
      <input ref={ref} value={valor} onChange={(e) => aoMudar(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        autoComplete="off" enterKeyHint="send"
        className="h-full min-w-0 flex-1 border-0 bg-transparent text-base text-tinta outline-none placeholder:text-sutil focus-visible:outline-none md:text-[15px]" />
      <button type="submit" aria-label="Enviar" disabled={!pronto}
        className={cn("grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-150", pronto ? "bg-caramelo text-tinta hover:bg-caramelo-claro" : "bg-realce text-inativo")}>
        <ArrowUp aria-hidden className="size-[17px]" strokeWidth={2.2} />
      </button>
    </form>
  )
})
CampoResposta.displayName = "CampoResposta"
