import type { ComponentProps, ReactNode } from 'react'
import { Info, type LucideIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

/* Peças de apoio das telas de Conformidade, Denúncias, Auditoria, Exportar, Configurações, Rede e Família.
   Tudo montado sobre shadcn/alert, shadcn/switch e shadcn/table (21st.dev), vestidos com os tokens da 9.9. */

export const campo = 'h-11 rounded-controle border-borda-campo bg-superficie text-[15px] md:h-10'
export const caixaMarca = 'size-5 rounded-[6px] border-borda-campo data-[state=checked]:border-noite data-[state=checked]:bg-noite data-[state=checked]:text-white'
export const dialogo = 'max-h-[90svh] w-[calc(100%-32px)] gap-5 overflow-y-auto rounded-caixa! border-linha bg-superficie p-5 shadow-flutua sm:p-6'

/** Aviso permanente em família `info` (shadcn/alert). Não fecha. */
export function AvisoInfo({ titulo, children, icone: Icone = Info, className }: {
  titulo?: ReactNode; children: ReactNode; icone?: LucideIcon; className?: string
}) {
  return (
    <Alert className={cn('rounded-cartao border-transparent bg-info-cx text-info [&>svg]:text-info', className)}>
      <Icone className="size-4" strokeWidth={2} />
      {titulo && <AlertTitle className="mb-1 text-[15px] font-semibold leading-snug tracking-normal text-info">{titulo}</AlertTitle>}
      <AlertDescription className="text-sm leading-relaxed text-info">{children}</AlertDescription>
    </Alert>
  )
}

/** shadcn/switch com o ligado em `noite` — configuração é decisão da escola, não ação de criar. */
export function Interruptor({ className, ...props }: ComponentProps<typeof Switch>) {
  return <Switch className={cn('h-7 w-12 data-[state=checked]:bg-noite data-[state=unchecked]:bg-borda-campo [&>span]:size-6 [&>span]:bg-white [&>span]:shadow-none', className)} {...props} />
}

/** Filtro em segmentos: botões de 36 px (44 no celular), o ativo com fundo, peso e borda. */
export function Segmentos<T extends string>({ opcoes, valor, aoMudar, rotulo }: {
  opcoes: { id: T; nome: string; n?: number }[]; valor: T; aoMudar: (v: T) => void; rotulo: string
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-1.5">
      {opcoes.map((o) => {
        const ativo = o.id === valor
        return (
          <button key={o.id} type="button" aria-pressed={ativo} onClick={() => aoMudar(o.id)}
            className={cn('inline-flex h-11 items-center gap-1.5 rounded-controle border px-3.5 text-sm transition-colors duration-150 md:h-9',
              ativo ? 'border-noite bg-realce font-semibold text-tinta' : 'border-linha bg-superficie font-medium text-apoio hover:bg-realce hover:text-tinta')}>
            {o.nome}
            {o.n !== undefined && <span className="tabular-nums text-sutil">{o.n}</span>}
          </button>
        )
      })}
    </div>
  )
}

export type Coluna<T> = { titulo: string; celula: (linha: T) => ReactNode; classe?: string }

/** Tabela no computador, lista de cartões no celular (D51: a partir de 360 px, tabela vira lista).
    A primeira coluna é o título do cartão; as outras viram pares rótulo · valor. */
export function TabelaResponsiva<T>({ colunas, linhas, chave, acao, className }: {
  colunas: Coluna<T>[]; linhas: T[]; chave: (linha: T) => string; acao?: (linha: T) => ReactNode; className?: string
}) {
  const [primeira, ...resto] = colunas
  return (
    <div className={className}>
      <div className="hidden overflow-hidden rounded-cartao border border-linha bg-superficie md:block">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="border-linha hover:bg-transparent">
              {colunas.map((c) => <TableHead key={c.titulo} className={cn('rotulo h-11 px-4', c.classe)}>{c.titulo}</TableHead>)}
              {acao && <TableHead className="h-11 w-px px-4"><span className="sr-only">Ações</span></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((l) => (
              <TableRow key={chave(l)} className="border-linha hover:bg-fundo">
                {colunas.map((c) => <TableCell key={c.titulo} className={cn('px-4 py-3 align-middle text-apoio', c.classe)}>{c.celula(l)}</TableCell>)}
                {acao && <TableCell className="px-4 py-2 text-right">{acao(l)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="grid gap-2.5 md:hidden">
        {linhas.map((l) => (
          <li key={chave(l)} className="rounded-cartao border border-linha bg-superficie p-4">
            <div className="text-[15px] text-tinta">{primeira.celula(l)}</div>
            <dl className="mt-3 grid gap-2">
              {resto.map((c) => (
                <div key={c.titulo} className="flex items-start justify-between gap-4 text-sm">
                  <dt className="shrink-0 text-sutil">{c.titulo}</dt>
                  <dd className="min-w-0 text-right text-apoio">{c.celula(l)}</dd>
                </div>
              ))}
            </dl>
            {acao && <div className="mt-3 flex justify-end border-t border-linha pt-3 [&_button]:h-11">{acao(l)}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Par rótulo · valor dentro de diálogo de detalhe. */
export function Par({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="rotulo">{rotulo}</p>
      <div className="text-[15px] leading-relaxed text-tinta">{children}</div>
    </div>
  )
}
