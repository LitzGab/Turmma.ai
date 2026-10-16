import type { ReactNode } from 'react'
import { Check, Clock, FileText, Globe, Info, X } from 'lucide-react'
import { Carimbo, Contador as ContadorDuo, Selo, SeloIA as SeloIADuo } from '@/components/duo'
import { AvatarIA, type AgenteIA } from '@/components/duo/onca'
import type { BadgeProps } from '@/components/ui/badge-2'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { agente, type AgenteId } from '@/dados/agentes'
import { cn } from '@/lib/utils'

/* "A IA sempre assina" (8.4, princípio 3): o rosto da onça com o anel do agente, o nome da FUNÇÃO, o selo "IA", a
   fonte com página e, depois de aprovada, quem aprovou. 12ª rodada (04/10/2026): tudo no desenho duo — a assinatura
   com o AvatarIA e a função em 15/700, o estado num Selo com glifo, o registro num Carimbo verde e o chip de página
   em pílula de borda 2 (também exportado como `ChipPagina`). */

/** O rosto da IA: a cabeça da onça num círculo com o anel da cor do agente (sistema Turmma × Duolingo, 4.6).
    O nome da função vai sempre ao lado (AssinaturaIA): a onça não tem nome próprio nem se passa por pessoa (D17, D58).
    Os ids antigos (corretor, adaptador, planejador) são funções do Assistente e caem nele. */
export function AvatarAgente({ id, tamanho = 24, className }: { id: AgenteId; tamanho?: 20 | 24 | 32 | 40 | 48; className?: string }) {
  const rosto: AgenteIA = id === 'tutor' ? 'tutor' : id === 'analista' ? 'analista' : 'assistente'
  return <AvatarIA agente={rosto} tamanho={tamanho} className={className} />
}

/** O selo "IA": neutro de propósito — informa, não chama. */
export function SeloIA({ className }: { className?: string }) {
  return <SeloIADuo tamanho="p" className={className} />
}

/** A assinatura que abre toda saída de IA: o rosto, o nome da função (15/700), o selo e, quando há, o quando. */
export function AssinaturaIA({ id, tamanho = 32, extra, quando, className }: {
  id: AgenteId; tamanho?: 24 | 32 | 40; extra?: ReactNode; quando?: string; className?: string
}) {
  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <AvatarAgente id={id} tamanho={tamanho} />
      <span className="truncate text-[15px] font-bold leading-5 text-tinta">{agente(id).nome}</span>
      <SeloIA />
      {quando && <span className="t-apoio shrink-0">{quando}</span>}
      {extra}
    </div>
  )
}

type TipoEstado = NonNullable<BadgeProps['variant']>
const ESTADO: Record<TipoEstado, { familia: 'amarelo' | 'verde' | 'vermelho' | 'azul' | 'neutro'; icone: ReactNode }> = {
  pendente: { familia: 'amarelo', icone: <Clock strokeWidth={3} /> },
  ok: { familia: 'verde', icone: <Check strokeWidth={3.5} /> },
  erro: { familia: 'vermelho', icone: <X strokeWidth={3.5} /> },
  info: { familia: 'azul', icone: <Info strokeWidth={3} /> },
  ia: { familia: 'neutro', icone: null },
  contorno: { familia: 'neutro', icone: null },
}

/** Selo de estado. Estado nunca é só cor: vem com glifo e texto (regra 50, item 11). */
export function Estado({ tipo, children, size = 'md', className }: {
  tipo: TipoEstado; children: ReactNode; size?: BadgeProps['size']; className?: string
}) {
  const e = ESTADO[tipo]
  return <Selo familia={e.familia} tamanho={size === 'sm' ? 'p' : 'm'} icone={e.icone} className={className}>{children}</Selo>
}

/** Contador de não lidos / entregas esperando (amarelo: o laranja é só o do Início, R9). */
export function Contador({ n, className }: { n: number; className?: string }) {
  if (!n) return null
  return <ContadorDuo n={n} familia="amarelo" tamanho="p" className={className} />
}

/** Chip de fonte dentro do texto: abre material, página e trecho. Por clique e teclado, funciona no toque. */
export function ChipFonte({ pagina, material = 'Química 2 — Material próprio do Colégio Aurora', capitulo = 'cap. 7 · Estequiometria', trecho }: {
  pagina: number; material?: string; capitulo?: string; trecho?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="mx-0.5 inline-flex h-7 translate-y-[-1px] items-center gap-1 rounded-full border-2 border-borda bg-white px-2.5 align-middle text-[14px] font-bold text-apoio transition-colors duration-150 hover:border-azul-borda hover:bg-azul-claro hover:text-azul-texto">
          <FileText className="size-3.5" strokeWidth={2.5} />p. {pagina}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-4">
        <p className="t-selo text-sutil">Material da escola</p>
        <p className="mt-2 text-[15px] font-bold text-tinta">{material}</p>
        <p className="t-apoio">{capitulo} · página {pagina}</p>
        <p className="mt-3 rounded-[12px] bg-fundo-suave p-3 text-[15px] font-medium leading-[21px] text-apoio">
          {trecho ?? '“A proporção entre as quantidades de matéria de reagentes e produtos é dada pelos coeficientes da equação balanceada.”'}
        </p>
        <button type="button" className="mt-3 text-[15px] font-bold text-azul-texto hover:underline">Abrir a página no material</button>
      </PopoverContent>
    </Popover>
  )
}

/** O mesmo chip, com o nome do sistema duo. */
export const ChipPagina = ChipFonte

/** Fonte de fora leva o chip "da web", de desenho diferente do chip de página (D68). */
export function ChipWeb({ dominio }: { dominio: string }) {
  return (
    <span className="mx-0.5 inline-flex h-7 items-center gap-1 rounded-full border-2 border-dashed border-borda bg-white px-2.5 align-middle text-[14px] font-bold text-sutil">
      <Globe className="size-3.5" strokeWidth={2.5} />da web · {dominio}
    </span>
  )
}

/** Depois da aprovação: quem aprovou e quando, no Carimbo verde. */
export function LinhaAprovacao({ por = 'Camila Souza', quando = '21/09, 10h42', verbo = 'Aprovado por', className }: {
  por?: string; quando?: string; verbo?: string; className?: string
}) {
  return <Carimbo por={por} quando={quando} verbo={verbo} className={className} />
}
