import { useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { BotaoIcone } from '@/components/duo'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/* O PAINEL AO LADO (décima rodada, 04/10/2026; régua R2 e R11).

   O detalhe abre ao lado, sem trocar de tela: a professora decide o item da fila e continua no Início. É o segundo
   nível; não existe terceiro. A partir de 768 px ele entra pela direita, com 480 px; abaixo disso, sobe como folha
   de baixo, com até 88% da altura. Fecha com o X e com Esc (a peça shadcn/sheet, sobre o Dialog do Radix, já cuida
   do Esc e do foco).
   · O título é curto e não tem descrição visível: a descrição existe só para leitor de tela.
   · O miolo rola por dentro; o rodapé fica preso embaixo e guarda as ações, com no máximo um botão cheio (R4).
   Quem abre guarda o estado na URL (?item=, ?aluno=, ?prof=): o "voltar" do navegador fecha o painel.
   11ª rodada (pele Duolingo, seção 3.16): borda esquerda de 2 px e véu de preto a 35%, sem sombra borrada; cabeçalho de
   64 px com o título em 20/700 e o X como fantasma redondo de 40; miolo com 24 px por dentro; rodapé com borda de 2 px.
   No celular, folha de baixo com canto de 20 em cima. */

export function PainelLado({ aberto, aoFechar, titulo, children, rodape, largura = 480, descricao, className }: {
  aberto: boolean
  aoFechar: () => void
  titulo: ReactNode
  children: ReactNode
  /** as ações, presas embaixo; no máximo um botão cheio */
  rodape?: ReactNode
  /** largura no computador, em px */
  largura?: number
  /** só para leitor de tela; nunca aparece */
  descricao?: string
  className?: string
}) {
  const celular = useIsMobile()
  // o foco entra no miolo (não no X): o anel grosso de foco no X chamava mais atenção que o título
  const miolo = useRef<HTMLDivElement>(null)
  return (
    <Sheet open={aberto} onOpenChange={(v) => { if (!v) aoFechar() }}>
      <SheetContent
        side={celular ? 'bottom' : 'right'}
        overlayClassName="bg-veu"
        onOpenAutoFocus={(e) => { e.preventDefault(); miolo.current?.focus({ preventScroll: true }) }}
        style={celular ? undefined : { width: largura, maxWidth: '100vw' }}
        className={cn(
          'flex flex-col gap-0 border-0 bg-white p-0 shadow-none [&>button:last-child]:hidden',
          celular ? 'max-h-[88svh] rounded-t-[20px] border-t-2 border-borda' : 'h-svh border-l-2 border-borda sm:max-w-none',
          className,
        )}
      >
        <header className="flex h-16 shrink-0 items-center gap-2 border-b-2 border-borda pl-6 pr-3">
          <SheetTitle className="min-w-0 flex-1 truncate text-[20px] font-bold leading-[26px] text-tinta">{titulo}</SheetTitle>
          <SheetDescription className="sr-only">{descricao ?? 'Detalhe ao lado. Feche com Esc.'}</SheetDescription>
          <SheetClose asChild>
            <BotaoIcone rotulo="Fechar" dica={false}><X strokeWidth={2.5} /></BotaoIcone>
          </SheetClose>
        </header>
        <div ref={miolo} tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto p-6 outline-none">{children}</div>
        {rodape && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t-2 border-borda px-6 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
            {rodape}
          </footer>
        )}
      </SheetContent>
    </Sheet>
  )
}
