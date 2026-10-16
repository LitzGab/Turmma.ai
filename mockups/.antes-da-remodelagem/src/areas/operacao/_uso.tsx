import { useMemo, useState, type ReactNode } from 'react'
import { Gauge } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { NotaMockup } from '@/components/turmma/tela'
import { cn } from '@/lib/utils'
import { TabelaLista, type Coluna } from '../coordenacao/_a-pecas'
import { NASCEU_DEPOIS, USO_DO_MES, usoPorDia, type Dia, type EscolaNaTela, type Periodo, type UsoDaEscola } from './_dados'

/* Aba Uso: só número agregado por escola (alunos ativos, trocas com o Tutor, gerações do Assistente, custo de IA
   e o consumo do teto). Nunca por pessoa: não existe linha, filtro nem ordenação por aluno ou professor. */

const inteiro = (n: number) => n.toLocaleString('pt-BR')
const reais = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const Traco = () => <span className="text-inativo">—</span>

const PERIODOS: { id: Periodo; nome: string; curto: string }[] = [
  { id: 'setembro', nome: 'Setembro de 2026', curto: 'Setembro' },
  { id: 'agosto', nome: 'Agosto de 2026', curto: 'Agosto' },
  { id: 'dia', nome: 'Por dia', curto: 'Por dia' },
]

/** O consumo do teto de IA da escola: barra fina e percentual. Âmbar a partir de 80%, vermelho acima de 100%. */
function Teto({ custo, teto }: { custo: number; teto: number }) {
  const pct = teto ? Math.round((custo / teto) * 100) : 0
  const cor = pct > 100 ? 'bg-erro' : pct >= 80 ? 'bg-pendente' : 'bg-noite'
  return (
    <span className="inline-flex items-center gap-2.5" title={`R$ ${reais(custo)} de R$ ${reais(teto)}`}>
      <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-realce" aria-hidden>
        <span className={cn('absolute inset-y-0 left-0 rounded-full', cor)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </span>
      <span className={cn('w-9 text-right text-sm font-medium tabular-nums', pct >= 80 ? 'text-pendente' : 'text-tinta')}>{pct}%</span>
      <span className="whitespace-nowrap text-[13px] tabular-nums text-sutil max-lg:hidden">de R$ {inteiro(teto)}</span>
    </span>
  )
}

type Linha = { escola: EscolaNaTela; uso?: UsoDaEscola; depois: boolean }

export function AbaUso({ escolas }: { escolas: EscolaNaTela[] }) {
  const [periodo, setPeriodo] = useState<Periodo>('setembro')
  const [escolaDoDia, setEscolaDoDia] = useState('todas')
  const mes = periodo === 'agosto' ? 'agosto' : 'setembro'

  const linhas: Linha[] = useMemo(() => escolas.map((e) => {
    const uso = USO_DO_MES[mes].find((u) => u.escolaId === e.id && u.custoIA > 0)
    return { escola: e, uso, depois: NASCEU_DEPOIS[mes](e.criadaEm) }
  }), [escolas, mes])
  const comUso = linhas.filter((l) => l.uso && (periodo !== 'dia' || escolaDoDia === 'todas' || l.escola.id === escolaDoDia)).map((l) => l.uso!)
  const soma = (f: (u: UsoDaEscola) => number) => comUso.reduce((a, u) => a + f(u), 0)
  const total = { alunos: soma((u) => u.alunosAtivos), trocas: soma((u) => u.trocasTutor), geracoes: soma((u) => u.geracoes), custo: soma((u) => u.custoIA), teto: soma((u) => u.tetoIA) }
  const existiam = linhas.filter((l) => !l.depois).length

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div role="radiogroup" aria-label="Período" className="grid w-full grid-cols-3 rounded-full bg-realce-suave p-1 sm:inline-flex sm:w-auto">
          {PERIODOS.map((p) => (
            <button key={p.id} type="button" role="radio" aria-checked={periodo === p.id} onClick={() => setPeriodo(p.id)}
              className={cn('h-9 shrink-0 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors duration-150 md:h-7',
                periodo === p.id ? 'bg-superficie text-tinta shadow-sm' : 'text-sutil hover:text-tinta')}>
              <span className="sm:hidden">{p.curto}</span><span className="max-sm:hidden">{p.nome}</span>
            </button>
          ))}
        </div>
        {periodo === 'dia' && (
          <Select value={escolaDoDia} onValueChange={setEscolaDoDia}>
            <SelectTrigger aria-label="Escola" className="h-11 w-full rounded-full border-borda-campo bg-superficie px-4 text-sm sm:w-[240px] md:h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-controle">
              <SelectItem value="todas" className="rounded-linha">Todas as escolas</SelectItem>
              {USO_DO_MES.setembro.filter((u) => u.custoIA > 0).map((u) => (
                <SelectItem key={u.escolaId} value={u.escolaId} className="rounded-linha">{escolas.find((e) => e.id === u.escolaId)?.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="ml-auto text-[13px] text-sutil max-md:w-full">
          {periodo === 'dia' ? 'Setembro de 2026, dia a dia' : periodo === 'agosto' ? 'Mês fechado em 31/08' : 'Mês fechado em 30/09'} · valores em reais
        </p>
      </div>

      <dl className="grid shrink-0 grid-cols-2 gap-px overflow-hidden rounded-cartao border border-linha bg-linha lg:grid-cols-4">
        <Numero rotulo="Escolas ativas" valor={inteiro(comUso.length)} apoio={`de ${existiam} ${existiam === 1 ? 'escola que já existia' : 'escolas que já existiam'} no mês`} />
        <Numero rotulo="Alunos ativos" valor={inteiro(total.alunos)} apoio="com ao menos um uso no mês" />
        <Numero rotulo="Trocas com o Tutor" valor={inteiro(total.trocas)} apoio={total.alunos ? `${Math.round(total.trocas / total.alunos)} por aluno ativo` : 'sem uso'} />
        <Numero rotulo="Custo de IA no mês" valor={`R$ ${reais(total.custo)}`} apoio={total.teto ? `${Math.round((total.custo / total.teto) * 100)}% do teto somado das escolas` : 'sem uso'} />
      </dl>

      <section aria-label={periodo === 'dia' ? 'Uso por dia' : 'Uso por escola'} className="flex min-h-0 flex-col overflow-hidden rounded-cartao border border-linha bg-superficie">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {periodo === 'dia' ? <TabelaDia escolaId={escolaDoDia} /> : <TabelaEscolas linhas={linhas} total={total} />}
        </div>
        <p className="flex items-start gap-2 border-t border-linha px-4 py-2.5 text-[13px] leading-snug text-sutil">
          <Gauge className="mt-px size-4 shrink-0" strokeWidth={1.9} />
          A escola recebe aviso em 80% do teto de IA; acima de 100%, o corte é suave e nunca no meio de uma aula.
        </p>
      </section>
      <NotaMockup>
        Custo de IA é o que a escola gastou com os modelos no mês, contra o teto do contrato dela (D14, D39). O painel só soma por escola:
        não há recorte por turma, professor nem aluno. Agosto tem só o Colégio Aurora porque a E. M. Rio Cachoeira nasceu em 14/09.
      </NotaMockup>
    </div>
  )
}

function Numero({ rotulo, valor, apoio }: { rotulo: string; valor: ReactNode; apoio: ReactNode }) {
  return (
    <div className="min-w-0 bg-superficie px-4 py-3">
      <dt className="rotulo">{rotulo}</dt>
      <dd className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-tinta">{valor}</dd>
      <dd className="mt-0.5 text-[13px] leading-snug text-sutil sm:truncate">{apoio}</dd>
    </div>
  )
}

const DIREITA = 'text-right tabular-nums'

function TabelaEscolas({ linhas, total }: { linhas: Linha[]; total: { alunos: number; trocas: number; geracoes: number; custo: number; teto: number } }) {
  const n = (l: Linha, f: (u: UsoDaEscola) => ReactNode) => (l.uso ? f(l.uso) : <Traco />)
  const colunas: Coluna<Linha>[] = [
    { titulo: 'Escola', principal: true, celula: (l) => (
      <span className="grid">
        <span className="font-medium text-tinta">{l.escola.nome}</span>
        <span className="truncate text-[13px] font-normal text-sutil">{l.depois ? `criada em ${l.escola.criadaEm}` : l.escola.rede === l.escola.nome ? l.escola.tipo : l.escola.rede}</span>
      </span>
    ) },
    { titulo: 'Alunos ativos', className: DIREITA, celula: (l) => n(l, (u) => inteiro(u.alunosAtivos)) },
    { titulo: 'Trocas com o Tutor', className: DIREITA, celula: (l) => n(l, (u) => inteiro(u.trocasTutor)) },
    { titulo: 'Gerações do Assistente', className: DIREITA, celula: (l) => n(l, (u) => inteiro(u.geracoes)) },
    { titulo: 'Custo de IA (R$)', className: DIREITA, celula: (l) => n(l, (u) => <span className="font-medium text-tinta">{reais(u.custoIA)}</span>) },
    { titulo: 'Por aluno no mês (R$)', className: DIREITA, celula: (l) => n(l, (u) => reais(u.custoIA / u.alunosAtivos)) },
    { titulo: 'Teto de IA da escola', className: 'w-[1%] whitespace-nowrap', celula: (l) => n(l, (u) => <Teto custo={u.custoIA} teto={u.tetoIA} />) },
  ]
  return (
    <>
      <Table className="hidden text-sm md:table">
        <TableHeader className="sticky top-0 z-10 bg-superficie shadow-[inset_0_-1px_0_var(--color-linha)]">
          <TableRow className="border-0 hover:bg-transparent">
            {colunas.map((c) => <TableHead key={c.titulo} className={cn('rotulo h-10 px-3 first:pl-4 last:pr-4', c.className)}>{c.titulo}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((l) => (
            <TableRow key={l.escola.id} className="border-linha hover:bg-lateral/60">
              {colunas.map((c) => <TableCell key={c.titulo} className={cn('h-14 px-3 py-1.5 text-apoio first:pl-4 last:pr-4', c.className)}>{c.celula(l)}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="border-linha bg-lateral font-normal">
          <TableRow className="hover:bg-lateral">
            <TableCell className="h-12 px-3 pl-4 font-semibold text-tinta">Total</TableCell>
            <TableCell className={cn(DIREITA, 'px-3 font-semibold text-tinta')}>{inteiro(total.alunos)}</TableCell>
            <TableCell className={cn(DIREITA, 'px-3 font-semibold text-tinta')}>{inteiro(total.trocas)}</TableCell>
            <TableCell className={cn(DIREITA, 'px-3 font-semibold text-tinta')}>{inteiro(total.geracoes)}</TableCell>
            <TableCell className={cn(DIREITA, 'px-3 font-semibold text-tinta')}>{reais(total.custo)}</TableCell>
            <TableCell className={cn(DIREITA, 'px-3 font-semibold text-tinta')}>{total.alunos ? reais(total.custo / total.alunos) : '—'}</TableCell>
            <TableCell className="px-3 pr-4">{total.teto ? <Teto custo={total.custo} teto={total.teto} /> : <Traco />}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div className="grid gap-2 p-3 md:hidden">
        <TabelaLista colunas={colunas} linhas={linhas} chave={(l) => l.escola.id} />
        <dl className="grid gap-1.5 rounded-controle bg-lateral p-3 text-sm">
          <dt className="text-[15px] font-semibold text-tinta">Total</dt>
          {([['Alunos ativos', inteiro(total.alunos)], ['Trocas com o Tutor', inteiro(total.trocas)], ['Gerações do Assistente', inteiro(total.geracoes)],
            ['Custo de IA (R$)', reais(total.custo)], ['Por aluno no mês (R$)', total.alunos ? reais(total.custo / total.alunos) : '—']] as const).map(([r, v]) => (
            <div key={r} className="flex justify-between gap-3"><dt className="text-sutil">{r}</dt><dd className="font-semibold tabular-nums text-tinta">{v}</dd></div>
          ))}
        </dl>
      </div>
    </>
  )
}

function TabelaDia({ escolaId }: { escolaId: string }) {
  const dias = useMemo(() => usoPorDia(escolaId), [escolaId])
  const acumulado = dias.reduce<number[]>((a, d) => [...a, Math.round(((a.at(-1) ?? 0) + d.custoIA) * 100) / 100], [])
  const colunas: Coluna<Dia & { acumulado: number }>[] = [
    { titulo: 'Dia', principal: true, celula: (d) => <span className={cn('tabular-nums', d.fimDeSemana ? 'text-sutil' : 'font-medium text-tinta')}>{d.rotulo}</span> },
    { titulo: 'Alunos ativos no dia', className: DIREITA, celula: (d) => d.alunosAtivos ? inteiro(d.alunosAtivos) : <Traco /> },
    { titulo: 'Trocas com o Tutor', className: DIREITA, celula: (d) => d.trocasTutor ? inteiro(d.trocasTutor) : <Traco /> },
    { titulo: 'Gerações do Assistente', className: DIREITA, celula: (d) => d.geracoes ? inteiro(d.geracoes) : <Traco /> },
    { titulo: 'Custo de IA (R$)', className: DIREITA, celula: (d) => d.custoIA ? <span className="font-medium text-tinta">{reais(d.custoIA)}</span> : <Traco /> },
    { titulo: 'Acumulado no mês (R$)', className: DIREITA, celula: (d) => reais(d.acumulado) },
  ]
  const linhas = dias.map((d, i) => ({ ...d, acumulado: acumulado[i] }))
  return (
    <>
      <Table className="hidden text-sm md:table">
        <TableHeader className="sticky top-0 z-10 bg-superficie shadow-[inset_0_-1px_0_var(--color-linha)]">
          <TableRow className="border-0 hover:bg-transparent">
            {colunas.map((c) => <TableHead key={c.titulo} className={cn('rotulo h-10 px-3 first:pl-4 last:pr-4', c.className)}>{c.titulo}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((d) => (
            <TableRow key={d.dia} className={cn('border-linha hover:bg-lateral/60', d.fimDeSemana && 'bg-lateral/50')}>
              {colunas.map((c) => <TableCell key={c.titulo} className={cn('h-9 px-3 py-1 text-apoio first:pl-4 last:pr-4', c.className)}>{c.celula(d)}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-3 md:hidden"><TabelaLista colunas={colunas} linhas={linhas} chave={(d) => String(d.dia)} /></div>
    </>
  )
}
