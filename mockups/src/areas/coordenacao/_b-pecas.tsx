import { useState, type ComponentProps, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Ellipsis, Info, type LucideIcon } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { CANTO_DIALOGO, FINALIDADES as FINALIDADES_A } from './_a-pecas'

/** As finalidades de "Ver dados com nome", na palavra do glossário ("aviso de aluno", não "denúncia"). */
export const FINALIDADES = FINALIDADES_A.map((f) => (/den[uú]ncia/i.test(f) ? 'Apurar um aviso de aluno' : f))

/* Peças de apoio da coordenação (Início, IA, Registros, Configurações da escola) e também de Rede e Operação.
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

/* ── Décima rodada (04/10/2026): as peças da coordenação remodelada ─────────────────────────────────────── */

/** Os números do mês, em texto: a mesma linha no Início e em IA (sem cartões de número). */
export const NUMEROS_DO_MES = 'Setembro: a IA gerou 412 · professores aprovaram 389 · 23 esperam o professor · consumo 61% do pacote.'

export function LinhaDoMes({ comLink = false, className }: { comLink?: boolean; className?: string }) {
  return (
    <p className={cn('text-[13.5px] leading-snug text-sutil', className)}>
      {NUMEROS_DO_MES}
      {comLink && (
        <Link to="/coordenacao/ia" className="ml-1.5 inline-flex items-center gap-0.5 whitespace-nowrap font-medium text-tinta underline-offset-4 hover:underline">
          IA <ChevronRight className="size-3.5" strokeWidth={2} />
        </Link>
      )}
    </p>
  )
}

/** Linha de lista clicável inteira (R5): fundo ao passar o mouse e chevron à direita. Nada de "Ver" em cada linha. */
export function LinhaClicavel({ aoAbrir, children, className, ativa }: { aoAbrir: () => void; children: ReactNode; className?: string; ativa?: boolean }) {
  return (
    <li>
      <button type="button" onClick={aoAbrir}
        className={cn('group flex w-full items-center gap-3 rounded-linha px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-realce-suave',
          ativa && 'bg-realce-suave', className)}>
        <span className="min-w-0 flex-1">{children}</span>
        <ChevronRight aria-hidden className="size-4 shrink-0 text-inativo transition-transform duration-150 group-hover:translate-x-0.5" />
      </button>
    </li>
  )
}

/** Bloco recolhido: uma linha que abre o conteúdo no lugar. */
export function Recolhivel({ titulo, apoio, children, inicial = false, className }: {
  titulo: ReactNode; apoio?: ReactNode; children: ReactNode; inicial?: boolean; className?: string
}) {
  const [aberto, setAberto] = useState(inicial)
  return (
    <section className={cn('border-t border-linha', className)}>
      <button type="button" aria-expanded={aberto} onClick={() => setAberto((a) => !a)}
        className="flex min-h-11 w-full items-center gap-2 rounded-linha px-2.5 py-2 text-left transition-colors duration-150 hover:bg-realce-suave">
        <ChevronDown aria-hidden className={cn('size-4 shrink-0 text-sutil transition-transform duration-150', !aberto && '-rotate-90')} />
        <span className="min-w-0 flex-1 text-[14.5px] font-medium text-tinta">{titulo}</span>
        {apoio && <span className="hidden shrink-0 text-[13px] text-sutil sm:inline">{apoio}</span>}
      </button>
      {aberto && <div className="px-2.5 pb-4 pt-1">{children}</div>}
    </section>
  )
}

/** O "⋯" de uma linha ou de um bloco: o raro mora aqui. */
export function MenuMais({ itens, rotulo = 'Mais opções', align = 'end', side = 'bottom' }: {
  itens: { rotulo: string; aoEscolher: () => void }[]; rotulo?: string
  /** no rodapé de um painel: align="start" side="top", para o menu abrir dentro dele */
  align?: 'start' | 'center' | 'end'; side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={rotulo} className="grid size-9 shrink-0 place-items-center rounded-full text-sutil transition-colors duration-150 hover:bg-realce hover:text-tinta data-[state=open]:bg-realce">
          <Ellipsis className="size-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-56 rounded-cartao border-0 p-1.5 shadow-flutua">
        {itens.map((m) => <DropdownMenuItem key={m.rotulo} onSelect={m.aoEscolher} className="h-9 rounded-linha">{m.rotulo}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "Ver dados com nome": a única porta para o dado com nome. Pede a finalidade e registra em auditoria (D45). */
export function DialogoDadosComNome({ aberto, aoMudar, oQue, aoConfirmar, finalidades = FINALIDADES }: {
  aberto: boolean; aoMudar: (v: boolean) => void; oQue: string; aoConfirmar: (finalidade: string) => void; finalidades?: string[]
}) {
  const [finalidade, setFinalidade] = useState('')
  return (
    <AlertDialog open={aberto} onOpenChange={(v) => { aoMudar(v); if (!v) setFinalidade('') }}>
      <AlertDialogContent className={cn(CANTO_DIALOGO, 'max-w-lg')}>
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-[18px] font-semibold text-tinta">Ver dados com nome</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] leading-relaxed text-apoio">
            Você vai ver <b className="font-semibold text-tinta">{oQue}</b>. Fica registrado com seu nome, a data e a finalidade.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset>
          <legend className="rotulo mb-2.5">Para quê?</legend>
          <RadioGroup value={finalidade} onValueChange={setFinalidade} className="gap-2">
            {finalidades.map((f, i) => (
              <Label key={f} htmlFor={`fin-b-${i}`} className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-controle border p-3 text-[14.5px] font-normal leading-snug text-tinta transition-colors duration-150',
                finalidade === f ? 'border-noite bg-realce-suave' : 'border-linha hover:bg-realce-suave')}>
                <RadioGroupItem id={`fin-b-${i}`} value={f} className="border-borda-campo text-noite" />
                {f}
              </Label>
            ))}
          </RadioGroup>
        </fieldset>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={!finalidade} className={buttonVariants({ variant: 'oficial' })} onClick={() => aoConfirmar(finalidade)}>
            Ver e registrar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
