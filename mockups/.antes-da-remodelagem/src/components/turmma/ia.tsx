import type { ReactNode } from 'react'
import { Check, Clock, FileText, Globe, Info, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge, type BadgeProps } from '@/components/ui/badge-2'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { agente, type AgenteId } from '@/dados/agentes'
import { cn } from '@/lib/utils'

/* "A IA sempre assina" (8.4, princípio 3): avatar do agente, selo "IA", fonte com página e,
   depois de aprovada, quem aprovou. Estas peças são o conjunto único da seção 11.3,
   montadas sobre shadcn/avatar, sean0205/badge-2 e shadcn/popover. */

/** Círculo com o ícone da função. Nunca rosto, foto ou mascote (D17, D58). 24, 32 ou 48 px. */
export function AvatarAgente({ id, tamanho = 24, className }: { id: AgenteId; tamanho?: 20 | 24 | 32 | 40 | 48; className?: string }) {
  const a = agente(id)
  const Icone = a.icone
  return (
    <Avatar aria-hidden className={cn('rounded-full', className)} style={{ width: tamanho, height: tamanho }}>
      <AvatarFallback className="rounded-full" style={{ background: a.ladrilho, color: a.corIcone }}>
        <Icone style={{ width: tamanho * 0.54, height: tamanho * 0.54 }} strokeWidth={1.8} />
      </AvatarFallback>
    </Avatar>
  )
}

/** O selo "IA": neutro de propósito — informa, não chama. */
export function SeloIA({ className }: { className?: string }) {
  return <Badge variant="ia" size="sm" className={cn('font-medium', className)} title="Gerado por inteligência artificial">IA</Badge>
}

/** A assinatura que abre toda saída de IA: avatar, nome da função e selo. */
export function AssinaturaIA({ id, tamanho = 24, extra, className }: { id: AgenteId; tamanho?: 24 | 32; extra?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <AvatarAgente id={id} tamanho={tamanho} />
      <span className="truncate text-sm font-medium text-tinta">{agente(id).nome}</span>
      <SeloIA />
      {extra}
    </div>
  )
}

const ICONE_ESTADO = { pendente: Clock, ok: Check, erro: X, info: Info, ia: null, contorno: null } as const

/** Selo de estado. Estado nunca é só cor: vem com ícone e texto (regra 50, item 11). */
export function Estado({ tipo, children, size = 'md', className }: {
  tipo: NonNullable<BadgeProps['variant']>; children: ReactNode; size?: BadgeProps['size']; className?: string
}) {
  const Icone = ICONE_ESTADO[tipo]
  return (
    <Badge variant={tipo} size={size} className={className}>
      {Icone && <Icone strokeWidth={2.4} />}
      {children}
    </Badge>
  )
}

/** Contador de não lidos / entregas esperando, em família `pendente`. */
export function Contador({ n, className }: { n: number; className?: string }) {
  if (!n) return null
  return <Badge variant="pendente" size="sm" shape="circle" className={cn('font-semibold tabular-nums', className)} aria-label={`${n} esperando você`}>{n}</Badge>
}

/** Chip de fonte dentro do texto: abre material, página e trecho. Por clique e teclado, funciona no toque. */
export function ChipFonte({ pagina, material = 'Química 2 — Material próprio do Colégio Aurora', capitulo = 'cap. 7 · Estequiometria', trecho }: {
  pagina: number; material?: string; capitulo?: string; trecho?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="mx-0.5 inline-flex h-[22px] translate-y-[-1px] items-center gap-1 rounded-full bg-ia-cx px-2 align-middle text-xs font-medium text-ia transition-colors duration-150 hover:bg-tinta hover:text-white">
          <FileText className="size-3" strokeWidth={2} />p. {pagina}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 rounded-cartao border-linha p-4 shadow-flutua">
        <p className="rotulo">Material da escola</p>
        <p className="mt-2 text-sm font-semibold text-tinta">{material}</p>
        <p className="text-sm text-sutil">{capitulo} · página {pagina}</p>
        <p className="mt-3 rounded-linha bg-realce-suave p-3 text-sm leading-relaxed text-apoio">
          {trecho ?? '“A proporção entre as quantidades de matéria de reagentes e produtos é dada pelos coeficientes da equação balanceada.”'}
        </p>
        <button type="button" className="mt-3 text-sm font-medium text-tinta underline underline-offset-4 hover:text-sutil">Abrir a página no material</button>
      </PopoverContent>
    </Popover>
  )
}

/** Fonte de fora leva o chip "da web", de desenho diferente do chip de página (D68). */
export function ChipWeb({ dominio }: { dominio: string }) {
  return (
    <span className="mx-0.5 inline-flex h-[22px] items-center gap-1 rounded-full border border-borda-campo bg-superficie px-2 align-middle text-xs font-medium text-sutil">
      <Globe className="size-3" strokeWidth={2} />da web · {dominio}
    </span>
  )
}

/** Depois da aprovação: quem aprovou e quando, em família `ok`. */
export function LinhaAprovacao({ por = 'Camila Souza', quando = '21/09, 10h42', verbo = 'Aprovado por', className }: {
  por?: string; quando?: string; verbo?: string; className?: string
}) {
  return (
    <p className={cn('inline-flex items-center gap-1.5 rounded-linha bg-ok-cx px-2.5 py-1 text-[13px] font-medium text-ok', className)}>
      <Check className="size-3.5" strokeWidth={2.6} />
      {verbo} {por} · {quando}
    </p>
  )
}
