import * as React from 'react'
import { Check, CircleAlert, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { familia as estiloFamilia, type Familia } from './familia'

/* O AVISO DENTRO DA TELA (12ª rodada): uma caixa de leitura com o fundo claro da família, borda de 2 px na borda da
   família, o glifo num círculo branco de 28 px e o texto em `tinta` (o título em 17/700). Não aperta (sem degrau).
   · info (azul): "Nenhuma prova esperando você."
   · atencao (amarelo): "Sem ninguém aqui, o Tutor fica desligado."
   · erro (vermelho): "Sem licença, o material não é enviado."
   · certo (verde): "A professora olhou: manteve a nota."
   No máximo uma ação (fantasma ou secundário). */

const TOM: Record<'info' | 'atencao' | 'erro' | 'certo', { familia: Familia; glifo: React.ReactNode }> = {
  info: { familia: 'azul', glifo: <Info strokeWidth={3} /> },
  atencao: { familia: 'amarelo', glifo: <CircleAlert strokeWidth={3} /> },
  erro: { familia: 'vermelho', glifo: <X strokeWidth={3.5} /> },
  certo: { familia: 'verde', glifo: <Check strokeWidth={3.5} /> },
}

export function Aviso({ tom = 'info', titulo, children, acao, className }: {
  tom?: 'info' | 'atencao' | 'erro' | 'certo'
  titulo?: React.ReactNode
  children?: React.ReactNode
  acao?: React.ReactNode
  className?: string
}) {
  const t = TOM[tom]
  return (
    <div role={tom === 'erro' ? 'alert' : 'status'} style={estiloFamilia(t.familia)}
      className={cn('flex items-start gap-3 rounded-[12px] border-2 border-(--borda) bg-(--claro) px-4 py-3', className)}>
      <span aria-hidden className="mt-px grid size-7 shrink-0 place-items-center rounded-full bg-white text-(--texto) [&_svg]:size-4">{t.glifo}</span>
      <div className="min-w-0 flex-1">
        {titulo && <p className="t-cartao text-tinta">{titulo}</p>}
        {children && <div className={cn('text-[15px] font-medium leading-[21px] text-tinta', titulo && 'mt-0.5')}>{children}</div>}
      </div>
      {acao && <div className="shrink-0 self-center">{acao}</div>}
    </div>
  )
}
