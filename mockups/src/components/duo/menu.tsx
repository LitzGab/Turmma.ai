import * as React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Ellipsis } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BotaoIcone } from './botao'

/* O ⋯, MENU DO RARO (12ª rodada; R11): o BotaoIcone com as reticências e o menu que flutua com borda de 2 px e degrau
   sólido de 4 px (nenhuma sombra borrada). Itens de 44 px, letra de 15/500; o perigoso em `vermelho-texto`.
   Para o que a pessoa faz uma vez na vida (Revogar, Apagar, Exportar), nunca para a ação principal. */

export type ItemMenuMais = { rotulo: string; aoEscolher: () => void; perigo?: boolean; icone?: React.ReactNode; desligado?: boolean }

export const CLASSE_FLUTUA = 'rounded-[16px] border-2 border-borda bg-white text-tinta shadow-[0_4px_0_0_var(--color-borda)]'

export function MenuMais({ itens, rotulo = 'Mais opções', alinhar = 'end', lado = 'bottom', className, gatilho }: {
  itens: ItemMenuMais[]
  rotulo?: string
  alinhar?: 'start' | 'center' | 'end'
  lado?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  /** troca o botão ⋯ por outro gatilho */
  gatilho?: React.ReactNode
}) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        {gatilho ?? <BotaoIcone rotulo={rotulo} className={className}><Ellipsis strokeWidth={2.5} /></BotaoIcone>}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align={alinhar} side={lado} sideOffset={8} collisionPadding={12}
          className={cn(CLASSE_FLUTUA, 'z-50 min-w-56 p-1.5 data-[state=open]:animate-in data-[state=open]:fade-in-0')}>
          {itens.map((i) => (
            <DropdownMenu.Item key={i.rotulo} disabled={i.desligado} onSelect={() => i.aoEscolher()}
              className={cn(
                'flex h-11 cursor-pointer select-none items-center gap-2.5 rounded-[10px] px-3 text-[15px] font-medium outline-none',
                'data-[highlighted]:bg-fundo-suave data-[disabled]:cursor-not-allowed data-[disabled]:text-apagado [&_svg]:size-[18px] [&_svg]:shrink-0',
                i.perigo ? 'text-vermelho-texto' : 'text-tinta [&_svg]:text-sutil',
              )}>
              {i.icone}{i.rotulo}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
