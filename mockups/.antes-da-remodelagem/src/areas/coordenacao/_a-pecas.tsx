import { useState, type ReactNode } from 'react'
import { Info, Lock, TriangleAlert } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { COORDENADORA, hoje } from '@/dados/escola'
import { cn } from '@/lib/utils'

/* Peças compartilhadas pelas seis telas da coordenação deste lote (Governança, Analista, Agentes,
   Estrutura, Material, Adaptações). Tudo montado sobre shadcn/table, shadcn/alert e shadcn/alert-dialog. */

/** Canto de 24 px em diálogo (9.3). Valor literal porque o `sm:rounded-lg` de fábrica só sai por conflito direto. */
export const CANTO_DIALOGO = 'rounded-[24px] border-linha bg-superficie p-5 shadow-flutua sm:rounded-[24px] sm:p-6 max-sm:w-[calc(100%-24px)]'

export type Coluna<T> = {
  titulo: string
  celula: (linha: T) => ReactNode
  /** vira o título do item quando a tabela vira lista no celular */
  principal?: boolean
  className?: string
}

/** shadcn/table no computador; no celular a tabela vira lista (regra 50, D51). */
export function TabelaLista<T>({ colunas, linhas, chave, rotuloVazio = 'Nada por aqui ainda.' }: {
  colunas: Coluna<T>[]; linhas: T[]; chave: (linha: T) => string; rotuloVazio?: string
}) {
  if (linhas.length === 0) return <p className="rounded-controle border border-dashed border-linha p-6 text-center text-[15px] text-sutil">{rotuloVazio}</p>
  const principal = colunas.find((c) => c.principal) ?? colunas[0]
  return (
    <>
      <div className="hidden md:block">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="border-linha hover:bg-transparent">
              {colunas.map((c) => <TableHead key={c.titulo} className={cn('rotulo h-10 px-3', c.className)}>{c.titulo}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((l) => (
              <TableRow key={chave(l)} className="border-linha hover:bg-fundo">
                {colunas.map((c) => <TableCell key={c.titulo} className={cn('px-3 py-3 text-apoio', c.className)}>{c.celula(l)}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-2 md:hidden">
        {linhas.map((l) => (
          <li key={chave(l)} className="rounded-controle border border-linha p-3">
            <div className="text-[15px] font-semibold text-tinta">{principal.celula(l)}</div>
            <dl className="mt-2 grid gap-1.5">
              {colunas.filter((c) => c !== principal).map((c) => (
                <div key={c.titulo} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="shrink-0 text-sutil">{c.titulo}</dt>
                  <dd className="min-w-0 text-right text-apoio">{c.celula(l)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

const TOM = {
  info: { caixa: 'border-transparent bg-info-cx text-info [&>svg]:text-info', Icone: Info },
  pendente: { caixa: 'border-transparent bg-pendente-cx text-pendente [&>svg]:text-pendente', Icone: TriangleAlert },
  erro: { caixa: 'border-transparent bg-erro-cx text-erro [&>svg]:text-erro', Icone: TriangleAlert },
  trava: { caixa: 'border-linha bg-ia-cx text-apoio [&>svg]:text-apoio', Icone: Lock },
} as const

/** shadcn/alert nas famílias da 9.1. Aviso permanente e explicação, nunca enfeite. */
export function Aviso({ tom = 'info', titulo, children, className }: { tom?: keyof typeof TOM; titulo?: ReactNode; children: ReactNode; className?: string }) {
  const { caixa, Icone } = TOM[tom]
  return (
    <Alert className={cn('rounded-controle p-3.5 [&>svg]:left-3.5 [&>svg]:top-3.5 [&>svg]:size-[18px]', caixa, className)}>
      <Icone strokeWidth={1.9} />
      {titulo && <AlertTitle className="mb-1 text-[15px] font-semibold leading-snug tracking-normal">{titulo}</AlertTitle>}
      <AlertDescription className="text-sm leading-relaxed [&_b]:font-semibold">{children}</AlertDescription>
    </Alert>
  )
}

export const FINALIDADES = [
  'Conversa pedagógica com o professor, a pedido dele',
  'Apoio a um aluno em risco, com o professor da turma',
  'Atender pedido do titular do dado (LGPD)',
  'Apurar denúncia recebida no canal da escola',
]

/** Abrir dado nominal é decisão oficial: diz o que vai acontecer, pede a finalidade e fica em auditoria (D45, D34). */
export function DialogoNominal({ aberto, aoMudar, oQue, aoConfirmar }: {
  aberto: boolean; aoMudar: (v: boolean) => void; oQue: string; aoConfirmar: (finalidade: string) => void
}) {
  const [finalidade, setFinalidade] = useState('')
  return (
    <AlertDialog open={aberto} onOpenChange={(v) => { aoMudar(v); if (!v) setFinalidade('') }}>
      <AlertDialogContent className={CANTO_DIALOGO}>
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="font-titulo text-[20px] font-semibold tracking-[-0.02em] text-tinta">Abrir dado nominal</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] leading-relaxed text-apoio">
            Você vai ver <b className="font-semibold text-tinta">{oQue}</b>. O acesso fica registrado em auditoria com seu nome, a data e a
            finalidade, e a pessoa pode pedir para saber quem viu. Nenhum indicador daqui serve para decisão sobre professor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset>
          <legend className="rotulo mb-2.5">Finalidade do acesso</legend>
          <RadioGroup value={finalidade} onValueChange={setFinalidade} className="gap-2">
            {FINALIDADES.map((f, i) => (
              <Label key={f} htmlFor={`fin-${i}`} className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-controle border p-3 text-[15px] font-normal leading-snug text-tinta transition-colors duration-150',
                finalidade === f ? 'border-noite bg-info-cx' : 'border-linha hover:bg-realce')}>
                <RadioGroupItem id={`fin-${i}`} value={f} className="border-borda-campo text-noite" />
                {f}
              </Label>
            ))}
          </RadioGroup>
        </fieldset>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={!finalidade} className={buttonVariants({ variant: 'oficial' })} onClick={() => aoConfirmar(finalidade)}>
            Abrir e registrar em auditoria
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** A linha que prova que o acesso nominal ficou registrado. */
export function RegistroAuditoria({ finalidade, className }: { finalidade: string; className?: string }) {
  return (
    <p className={cn('rounded-linha bg-info-cx px-3 py-2 text-[13px] leading-snug text-info', className)}>
      <b className="font-semibold">Acesso registrado em auditoria</b> · {COORDENADORA.nome} · {hoje.curta}, {hoje.hora} · finalidade: {finalidade.toLowerCase()}
    </p>
  )
}

/** Lista curta com marcador de ícone: usada em "faz sozinho / espera aprovação / nunca faz" e em resumos. */
export function ListaMarcada({ itens, icone, cor }: { itens: string[]; icone: ReactNode; cor: string }) {
  return (
    <ul className="grid gap-1.5">
      {itens.map((t) => (
        <li key={t} className="flex items-start gap-2 text-sm leading-snug text-apoio">
          <span className={cn('mt-0.5 shrink-0 [&_svg]:size-4', cor)}>{icone}</span>
          {t}
        </li>
      ))}
    </ul>
  )
}
