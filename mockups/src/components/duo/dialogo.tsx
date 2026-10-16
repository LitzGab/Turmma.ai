import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Botao, BotaoIcone, type VarianteBotao } from './botao'

/* O DIÁLOGO (12ª rodada): canto 16, borda de 2 px, degrau SÓLIDO de 4 px e véu de preto a 35% — nenhuma sombra
   borrada. Cabeçalho com o título (20/700) e o X; o miolo rola por dentro; o rodapé, com borda de cima de 2 px, guarda
   as ações (no máximo um botão cheio). Fecha com Esc e com o X.
   DialogoConfirmar: a pergunta curta antes de uma decisão, com os DOIS botões do mesmo tamanho (D70: voltar pesa o
   mesmo que seguir). */

export function Dialogo({ aberto, aoMudar, titulo, children, rodape, largura = 520, descricao, className }: {
  aberto: boolean
  aoMudar: (aberto: boolean) => void
  titulo: React.ReactNode
  children?: React.ReactNode
  rodape?: React.ReactNode
  /** largura no computador, em px */
  largura?: number
  /** só para leitor de tela */
  descricao?: string
  className?: string
}) {
  return (
    <DialogPrimitive.Root open={aberto} onOpenChange={aoMudar}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-veu data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content style={{ maxWidth: largura }}
          onOpenAutoFocus={(e) => {
            // o foco vai para o primeiro campo (ou o primeiro botão do rodapé), não para o X do canto
            const raiz = e.currentTarget as HTMLElement | null
            const alvo = raiz?.querySelector<HTMLElement>('[data-miolo] input, [data-miolo] textarea, [data-miolo] select, footer button')
            if (alvo) { e.preventDefault(); alvo.focus() }
          }}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100svh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col',
            'rounded-[16px] border-2 border-borda bg-white text-tinta shadow-[0_4px_0_0_var(--color-borda)] outline-none',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
            className,
          )}>
          <header className="flex min-h-16 shrink-0 items-center gap-2 py-3 pl-6 pr-3">
            <DialogPrimitive.Title className="min-w-0 flex-1 text-[20px] font-bold leading-[26px] text-tinta">{titulo}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <BotaoIcone rotulo="Fechar" dica={false}><X strokeWidth={2.5} /></BotaoIcone>
            </DialogPrimitive.Close>
          </header>
          <DialogPrimitive.Description className="sr-only">{descricao ?? 'Janela. Feche com Esc.'}</DialogPrimitive.Description>
          {children !== undefined && <div data-miolo className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>}
          {rodape && (
            <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t-2 border-borda px-6 py-4">{rodape}</footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function DialogoConfirmar({ aberto, aoMudar, titulo, frase, confirmar, voltar = 'Voltar', children }: {
  aberto: boolean
  aoMudar: (aberto: boolean) => void
  titulo: React.ReactNode
  /** o efeito, numa frase */
  frase?: React.ReactNode
  confirmar: { rotulo: string; variante?: VarianteBotao; aoConfirmar: () => void; desligado?: boolean }
  voltar?: string
  /** um campo a mais (o motivo, por exemplo) */
  children?: React.ReactNode
}) {
  return (
    <Dialogo aberto={aberto} aoMudar={aoMudar} titulo={titulo} largura={460}
      rodape={(
        <div className="grid w-full grid-cols-2 gap-3">
          <Botao variante="secundario" largura="cheia" onClick={() => aoMudar(false)}>{voltar}</Botao>
          <Botao variante={confirmar.variante ?? 'oficial'} largura="cheia" disabled={confirmar.desligado}
            onClick={() => { confirmar.aoConfirmar(); aoMudar(false) }}>{confirmar.rotulo}</Botao>
        </div>
      )}>
      {(frase || children) && (
        <div className="grid gap-4">
          {frase && <p className="t-corpo text-apoio">{frase}</p>}
          {children}
        </div>
      )}
    </Dialogo>
  )
}
