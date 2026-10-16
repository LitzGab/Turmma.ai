import * as React from 'react'
import { Check, Clock3, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { familia as estiloFamilia, type Familia } from './familia'
import { materiaDe } from './cores'

/* SELO, CONTADOR E PONTO (11ª rodada; seção 3.5).
   · Selo: altura 24 (o `p`, 20 px e letra de 12), canto 8, t-selo, fundo claro e texto no tom texto da família.
     O neutro vai em fundo-suave com apoio.
   · SeloIA: "IA", neutro de propósito: informa e não chama. Vai sempre ao lado do nome do agente.
   · SeloTurma: "2ºB", na cor da matéria quando ela é conhecida; neutro quando não.
   · Contador: pílula de 22 a 28 px, face da família, texto tinta em 700, tabular. É o único número laranja da casca (R9).
   · Ponto: o estado de um aluno num círculo de 20 px com glifo — nunca só cor (tabela 2.1.6). */

export function Selo({ familia = 'neutro', tamanho = 'm', icone, children, className, title }: {
  familia?: Familia | 'neutro'
  tamanho?: 'm' | 'p'
  icone?: React.ReactNode
  children: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <span title={title} style={familia === 'neutro' ? undefined : estiloFamilia(familia)}
      className={cn(
        't-selo inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[8px] [&_svg]:shrink-0',
        tamanho === 'p' ? 'h-5 px-1.5 text-[12px] leading-none [&_svg]:size-3.5' : 'h-6 px-2 leading-none [&_svg]:size-4',
        familia === 'neutro' ? 'bg-fundo-suave text-apoio' : 'bg-(--claro) text-(--texto)',
        className,
      )}>
      {icone}{children}
    </span>
  )
}

export function SeloIA({ tamanho = 'm', className }: { tamanho?: 'm' | 'p'; className?: string }) {
  return <Selo tamanho={tamanho} className={cn('normal-case tracking-normal', className)} title="Feito por inteligência artificial">IA</Selo>
}

export function SeloTurma({ turma, materia, tamanho = 'm', className }: {
  turma: string
  materia?: string
  tamanho?: 'm' | 'p'
  className?: string
}) {
  const m = materia ? materiaDe(materia) : undefined
  return (
    <Selo familia={m?.familia ?? 'neutro'} tamanho={tamanho} className={cn('normal-case', className)}
      title={m ? `${turma} · ${m.nome}` : turma}>
      {turma}
    </Selo>
  )
}

export function Contador({ n, familia = 'laranja', tamanho = 'm', rotulo = 'esperando você', className }: {
  n: number
  familia?: Familia
  /** p 22 px · m 24 px · g 28 px */
  tamanho?: 'p' | 'm' | 'g'
  /** o que o número conta, para o leitor de tela ("8 esperando você") */
  rotulo?: string
  className?: string
}) {
  return (
    <span role="img" aria-label={`${n} ${rotulo}`} style={estiloFamilia(familia)}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full bg-(--face) font-bold leading-none text-sobre-cor tabular-nums',
        tamanho === 'p' && 'h-[22px] min-w-[22px] px-1.5 text-[13px]',
        tamanho === 'm' && 'h-6 min-w-6 px-2 text-[14px]',
        tamanho === 'g' && 'h-7 min-w-7 px-2.5 text-[15px]',
        className,
      )}>
      {n}
    </span>
  )
}

export type EstadoPonto = 'feito' | 'esperando' | 'vazio' | 'perdeu' | 'rascunho'

const PONTO: Record<EstadoPonto, { rotulo: string; classe: string; glifo: React.ReactNode }> = {
  feito: { rotulo: 'Feito', classe: 'bg-verde-degrau text-white', glifo: <Check strokeWidth={3.5} /> },
  esperando: { rotulo: 'Esperando', classe: 'bg-amarelo text-sobre-cor', glifo: <Clock3 strokeWidth={3} /> },
  perdeu: { rotulo: 'Perdeu o prazo', classe: 'bg-vermelho-degrau text-white', glifo: <X strokeWidth={3.5} /> },
  vazio: { rotulo: 'Não começou', classe: 'border-2 border-borda bg-white', glifo: null },
  rascunho: { rotulo: 'Rascunho', classe: 'border-2 border-borda bg-fundo-suave text-apoio', glifo: <Pencil strokeWidth={3} /> },
}

export function Ponto({ estado, className }: { estado: EstadoPonto; className?: string }) {
  const p = PONTO[estado]
  return (
    <span role="img" aria-label={p.rotulo} title={p.rotulo}
      className={cn('inline-grid size-5 shrink-0 place-items-center rounded-full [&_svg]:size-3', p.classe, className)}>
      {p.glifo}
    </span>
  )
}
