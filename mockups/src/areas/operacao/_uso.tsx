import { useMemo, useState, type ReactNode } from 'react'
import { Gauge } from 'lucide-react'
import { BarraProgresso, Segmentado, Tabela, type ColunaTabela } from '@/components/duo'
import type { EscolaDaOperacao } from '@/dados/rede'
import { porAluno } from '@/dados/numeros-escola'
import { cn } from '@/lib/utils'
import { inteiro, reais, usoDe, type Mes, type UsoDaEscola } from './_dados'

/* Aba USO (12ª rodada; plano 5.5): só número agregado por escola. Nunca por pessoa: não existe linha, filtro nem
   ordenação por aluno ou professor. As trocas com o Tutor e as gerações do Assistente juntam numa coluna "Uso de
   IA" (o detalhe vai no title). A vista "por dia" saiu. */

const MESES: { id: Mes; rotulo: string }[] = [{ id: 'setembro', rotulo: 'Setembro' }, { id: 'agosto', rotulo: 'Agosto' }]
const DIREITA = 'text-right tabular-nums'
const Traco = () => <span className="text-apagado">—</span>

/* a mesma barra dos painéis da coordenação e da rede (BarraPacote): turquesa, com a marca dos 80% */
function Teto({ custo, teto }: { custo: number; teto: number }) {
  const pct = teto ? Math.round((custo / teto) * 100) : 0
  return (
    <span className="inline-flex w-full items-center justify-end gap-2.5 md:justify-start" title={`R$ ${reais(custo)} de R$ ${reais(teto)}`}>
      <span className="relative w-24 max-md:w-16">
        <BarraProgresso valor={Math.min(100, pct)} max={100} familia="turquesa" altura={12} rotulo={`${pct}% do teto`} />
        <span aria-hidden title="Aviso em 80%" className="absolute -bottom-1 -top-1 left-[80%] w-[2px] -translate-x-1/2 rounded-full bg-apoio" />
      </span>
      <span className="w-10 text-right font-bold tabular-nums">{`${pct}%`}</span>
    </span>
  )
}

/** `alunos`: os alunos COM ACESSO (a conta fixa do plano, seção 1.5), o mesmo divisor dos painéis e do Analista */
type Linha = { id: string; nome: string; abaixo: string; uso?: UsoDaEscola; alunos: number; total?: boolean }

export function AbaUso({ escolas, tetos }: { escolas: EscolaDaOperacao[]; tetos: Record<string, number> }) {
  const [mes, setMes] = useState<Mes>('setembro')

  const linhas: Linha[] = useMemo(() => {
    const porEscola: Linha[] = escolas.map((e) => {
      const u = usoDe(e.id, mes)
      return {
        id: e.id, nome: e.nome, abaixo: e.rede === e.nome ? e.tipo : e.rede, alunos: e.alunos,
        uso: u && { ...u, tetoIA: tetos[e.id] ?? u.tetoIA },
      }
    })
    const com = porEscola.filter((l) => l.uso).map((l) => l.uso!)
    const soma = (f: (u: UsoDaEscola) => number) => com.reduce((a, u) => a + f(u), 0)
    const total: Linha = {
      id: 'total', nome: 'Total', abaixo: `${com.length} escolas com uso`, total: true,
      alunos: porEscola.filter((l) => l.uso).reduce((a, l) => a + l.alunos, 0),
      uso: { alunosAtivos: soma((u) => u.alunosAtivos), trocasTutor: soma((u) => u.trocasTutor), geracoes: soma((u) => u.geracoes), custoIA: soma((u) => u.custoIA), tetoIA: soma((u) => u.tetoIA) },
    }
    return [...porEscola, total]
  }, [escolas, mes, tetos])

  const total = linhas[linhas.length - 1]
  const escolasLinhas = linhas.slice(0, -1)
  const n = (l: Linha, f: (u: UsoDaEscola) => ReactNode) => (l.uso ? f(l.uso) : <Traco />)
  const colunas: ColunaTabela<Linha>[] = [
    { titulo: 'Escola', celula: (l) => (
      <span className="grid min-w-0">
        <span className={l.total ? 'font-bold text-tinta' : 'truncate font-bold text-tinta'}>{l.nome}</span>
        <span className="truncate text-[14px] font-medium text-sutil">{l.uso || l.total ? l.abaixo : 'Sem uso no mês'}</span>
      </span>
    ) },
    { titulo: 'Alunos ativos', classe: DIREITA, celula: (l) => n(l, (u) => inteiro(u.alunosAtivos)) },
    { titulo: 'Uso de IA', classe: DIREITA, celula: (l) => n(l, (u) => (
      <span title={`${inteiro(u.trocasTutor)} trocas com o Tutor · ${inteiro(u.geracoes)} gerações do Assistente`}>{inteiro(u.trocasTutor + u.geracoes)}</span>
    )) },
    { titulo: 'Custo (R$)', classe: DIREITA, celula: (l) => n(l, (u) => <span className="font-bold">{reais(u.custoIA)}</span>) },
    { titulo: 'Por aluno (R$)', classe: DIREITA, celula: (l) => n(l, (u) => reais(porAluno(u.custoIA, l.alunos))) },
    { titulo: 'Teto', classe: 'w-[1%] whitespace-nowrap', celula: (l) => n(l, (u) => <Teto custo={u.custoIA} teto={u.tetoIA} />) },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Segmentado rotulo="Mês" opcoes={MESES} valor={mes} aoMudar={(v) => setMes(v as Mes)} />
        <span className="t-apoio">{mes === 'agosto' ? 'Fechado em 31/08' : 'Até 21/09'}</span>
        <p className="t-apoio flex items-center gap-2 max-md:hidden md:ml-auto"><Gauge aria-hidden className="size-[18px] shrink-0" strokeWidth={2.5} />Aviso em 80%. Corte suave em 100%, nunca no meio de uma aula.</p>
      </div>
      {/* computador: a lista rola por dentro e o Total fica preso no pé, sempre inteiro */}
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border-2 border-borda bg-white md:flex">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <table className="w-full border-collapse text-left" aria-label="Uso por escola">
            <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-2px_0_var(--color-borda)]">
              <tr>{colunas.map((c) => <th key={c.titulo} scope="col" className={cn('t-selo h-11 px-4 align-middle text-sutil', c.classe)}>{c.titulo}</th>)}</tr>
            </thead>
            <tbody>
              {escolasLinhas.map((l) => (
                <tr key={l.id} className="h-14 border-t-2 border-borda text-[15px] font-medium text-tinta first:border-t-0">
                  {colunas.map((c) => <td key={c.titulo} className={cn('px-4 py-1.5 align-middle', c.classe)}>{c.celula(l)}</td>)}
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-[1] bg-fundo-suave shadow-[inset_0_2px_0_var(--color-borda)]">
              <tr className="h-14 text-[15px] font-medium text-tinta">
                {colunas.map((c) => <td key={c.titulo} className={cn('px-4 py-2 align-middle', c.classe)}>{c.celula(total)}</td>)}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      {/* celular: cartões empilhados, o Total por último */}
      <Tabela colunas={colunas} linhas={linhas} chave={(l) => l.id} rotulo="Uso por escola" className="md:hidden" />
      <p className="t-apoio flex items-center gap-2 md:hidden"><Gauge aria-hidden className="size-[18px] shrink-0" strokeWidth={2.5} />Aviso em 80%. Corte suave em 100%, nunca no meio de uma aula.</p>
    </div>
  )
}
