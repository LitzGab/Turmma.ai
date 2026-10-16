import * as React from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { familia as estiloFamilia, type Familia } from './familia'
import { Selo } from './selo'

/* PEÇAS DE PESSOA E DE REGISTRO (12ª rodada).
   · Avatar: as iniciais num círculo na face de uma família SORTEADA pelo nome (não quer dizer nada; nunca laranja,
     que é ação, nem vermelho, que é problema). Aluno não tem foto (regra 20, item 2).
   · SeloNovo: "Novo", em azul, calmo, sem número. Some quando a pessoa abre (não é recompensa; D59).
   · Carimbo: quem aprovou e quando, em verde com o visto ("Aprovado por Camila Souza · 21/09, 10h44"). É o registro
     da decisão humana (regra 70; D56).
   · Recolhivel: o que existe mas não precisa estar aberto ("As outras 25", "Ver por série"). */

const CORES: Familia[] = ['azul', 'verde', 'roxo', 'turquesa', 'rosa', 'lima', 'amarelo', 'anil']
const corDoNome = (nome: string) => CORES[[...nome].reduce((s, c) => (s * 31 + c.charCodeAt(0)) % 9973, 0) % CORES.length]
const iniciais = (nome: string) => { const p = nome.trim().split(/\s+/); return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() }

export function Avatar({ nome, tamanho = 40, className }: { nome: string; tamanho?: 24 | 32 | 40 | 48 | 56; className?: string }) {
  return (
    <span role="img" aria-label={nome} title={nome} style={{ ...estiloFamilia(corDoNome(nome)), width: tamanho, height: tamanho, fontSize: Math.round(tamanho * 0.38) }}
      className={cn('inline-grid shrink-0 place-items-center rounded-full bg-(--face) font-bold leading-none text-sobre-cor', className)}>
      {iniciais(nome)}
    </span>
  )
}

export function SeloNovo({ className, tamanho }: { className?: string; tamanho?: 'm' | 'p' }) {
  return <Selo familia="azul" tamanho={tamanho} className={className}>Novo</Selo>
}

export function Carimbo({ por, quando, verbo = 'Aprovado por', extra, className }: {
  por: string
  quando?: string
  verbo?: string
  /** depois do quando: "chegou ao 2ºB agora" */
  extra?: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn('inline-flex min-h-8 max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-[8px] bg-verde-claro px-2.5 py-1 text-[14px] font-bold leading-5 text-verde-texto', className)}>
      <Check aria-hidden className="size-4 shrink-0" strokeWidth={3.5} />
      <span>{verbo} {por}{quando ? ` · ${quando}` : ''}{extra ? <> · {extra}</> : null}</span>
    </p>
  )
}

export function Recolhivel({ titulo, apoio, children, aberto: inicial = false, className }: {
  titulo: React.ReactNode
  apoio?: React.ReactNode
  children: React.ReactNode
  /** começa aberto */
  aberto?: boolean
  className?: string
}) {
  const [aberto, setAberto] = React.useState(inicial)
  return (
    <Collapsible.Root open={aberto} onOpenChange={setAberto} className={cn('rounded-[16px] border-2 border-borda bg-white', className)}>
      <Collapsible.Trigger className="flex min-h-14 w-full items-center gap-3 rounded-[14px] px-4 py-2 text-left transition-colors duration-150 hover:bg-fundo-suave">
        <ChevronDown aria-hidden strokeWidth={2.5} className={cn('size-5 shrink-0 text-sutil transition-transform duration-200', !aberto && '-rotate-90')} />
        <span className="min-w-0 flex-1">
          <span className="t-cartao block text-tinta">{titulo}</span>
          {apoio && <span className="t-apoio block">{apoio}</span>}
        </span>
      </Collapsible.Trigger>
      <Collapsible.Content className="border-t-2 border-borda px-4 py-3">{children}</Collapsible.Content>
    </Collapsible.Root>
  )
}
