import { useMemo } from 'react'
import { Lock } from 'lucide-react'
import { EstadoVazio, Selo } from '@/components/duo'
import { alunosDa, PARA_APROVAR, useForaDaMedia } from '@/dados/alunos'
import { useLotes, type Lote } from '@/dados/avaliacoes'
import { useAlunosDaTurma } from '@/dados/acesso'
import { registrar } from '@/dados/demo/nucleo'
import { comNotaDa, comVirgula } from '@/dados/turma-atividades'
import { turmaDaProfessora } from '@/dados/turmas-professora'
import { cn } from '@/lib/utils'
import { limpa } from '../_busca'

/* NOTAS — o boletim da turma, um jeito de ver a aba Alunos (Lista | Notas; ?ver=notas). 12ª rodada, 04/10/2026.

   A REGRA QUE A TELA GARANTE (regra 70): a média só soma nota APROVADA.
   · As colunas de sempre (as atividades corrigidas do bimestre) vêm de `comNotaDa`. A "Prova de mol e massa molar"
     (18/09) é o lote `prova-2b`: enquanto espera a professora, a coluna fica TRAVADA (cadeado e PARA APROVAR) e fora
     da média; aprovado o lote (/professor/aprovar/prova-2b), ela destrava e entra na média na hora.
   · As colunas que NASCEM na demonstração: cada lote de notas da turma (o aluno entregou a prova de hoje, por exemplo)
     vira uma coluna travada; aprovado, mostra a nota de quem entregou (acertos de 10) e entra na média.
   · No ⋯ da aba, Exportar notas: um CSV de verdade, só com notas aprovadas, que fica na auditoria (`exportacao`).
   Saíram os filtros de falta e a edição à mão (chamada e faltas saíram do produto; a nota editada volta depois). */

export type ColunaBoletim = {
  id: string
  curto: string
  nome: string
  data: string
  /** esperando aprovação: fora da média, sem valor à vista */
  travada: boolean
  /** a nota de um aluno (pelo nome), ou null quando não fez */
  valor: (nome: string) => number | null
}

const media = (v: (number | null)[]) => {
  const n = v.filter((x): x is number => x !== null)
  return n.length ? Math.round((n.reduce((s, x) => s + x, 0) / n.length) * 10) / 10 : null
}

const curtoDe = (titulo: string) => { const r = titulo.replace(/^(Prova|Lista|Atividade) de /, ''); return r.charAt(0).toUpperCase() + r.slice(1) }

function colunasDe(turmaId: string, fora: number[], lotes: Lote[]): ColunaBoletim[] {
  const ricos = alunosDa(turmaId)
  const porNome = new Map(ricos.map((a) => [a.nome, a]))
  // a prova de 18/09 tem as notas do LOTE (as mesmas que a professora aprova em /professor/aprovar/prova-2b)
  const pendente = PARA_APROVAR[turmaId]
  const lote = pendente ? lotes.find((l) => l.id === pendente.loteId) : undefined
  const doLote = (nome: string): number | null | undefined => {
    if (!lote || lote.tirados.includes(nome)) return lote ? null : undefined
    const o = lote.outras.find((x) => x.nome === nome)
    if (o) return o.acertos
    const d = lote.destaques.find((x) => x.quem === nome)
    if (d?.id === 'branco') return 0
    const pct = d?.resumo.match(/(\d+)% de acerto/)
    return pct ? Number(pct[1]) / 10 : undefined
  }
  const fixas: ColunaBoletim[] = comNotaDa(turmaId).map((c) => ({
    id: c.id, curto: c.curto, nome: c.nome, data: c.data, travada: fora.includes(c.indiceNota!),
    valor: (nome) => {
      const v = c.indiceNota === pendente?.indice ? doLote(nome) : undefined
      return v !== undefined ? v : porNome.get(nome)?.notas[c.indiceNota!]?.valor ?? null
    },
  }))
  const daDemo: ColunaBoletim[] = lotes
    .filter((l) => l.turmaId === turmaId && l.id !== PARA_APROVAR[turmaId]?.loteId && l.entregas.length > 0)
    .map((l) => ({
      id: l.id, curto: curtoDe(l.titulo), nome: l.titulo, data: l.data, travada: l.estado !== 'aprovado',
      valor: (nome) => {
        const e = l.entregas.find((x) => x.nome === nome)
        return e && !l.tirados.includes(nome) ? Math.round((e.acertos / Math.max(1, e.total)) * 100) / 10 : null
      },
    }))
  return [...fixas, ...daDemo]
}

/** O boletim vivo da turma: as colunas e a média de cada aluno, só com notas aprovadas. */
export function useBoletim(turmaId: string) {
  const fora = useForaDaMedia(turmaId)
  const lotes = useLotes(turmaId)
  return useMemo(() => {
    const colunas = colunasDe(turmaId, fora, lotes)
    const valendo = colunas.filter((c) => !c.travada)
    const mediaDe = (nome: string) => media(valendo.map((c) => c.valor(nome)))
    return { colunas, mediaDe, temTravada: colunas.some((c) => c.travada) }
  }, [turmaId, fora, lotes])
}

/** Baixa um texto como arquivo, no navegador. */
export function baixar(nome: string, texto: string, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob(['﻿' + texto], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** O boletim em CSV, só com as colunas aprovadas (a travada sai do arquivo). Fica na auditoria. */
export function exportarNotas(turmaId: string, colunas: ColunaBoletim[], nomes: string[]) {
  const t = turmaDaProfessora(turmaId)
  const valendo = colunas.filter((c) => !c.travada)
  const linhas = nomes.map((nome, i) => {
    const v = valendo.map((c) => c.valor(nome))
    const m = media(v)
    return [i + 1, nome, ...v.map((x) => (x === null ? '' : comVirgula(x))), m === null ? '' : comVirgula(m)].join(';')
  })
  const cabeca = ['Nº', 'Aluno', ...valendo.map((c) => `${c.nome} (${c.data})`), 'Média'].join(';')
  baixar(`notas-${t?.nome ?? turmaId}-${t?.disciplina ?? ''}.csv`.replace(/\s+/g, '-'), [cabeca, ...linhas].join('\n'))
  registrar('exportacao', { o: 'notas', turmaId, turma: t?.nome ?? turmaId, linhas: nomes.length })
}

export function BoletimTurma({ turmaId, busca = '' }: { turmaId: string; busca?: string }) {
  const { colunas, mediaDe, temTravada } = useBoletim(turmaId)
  const lista = useAlunosDaTurma(turmaId)
  const t = turmaDaProfessora(turmaId)

  if (colunas.length === 0) {
    return <EstadoVazio titulo="Nenhuma nota ainda" className="rounded-[16px] border-2 border-borda py-10" />
  }

  const q = limpa(busca.trim())
  const visiveis = lista.filter((n) => !q || limpa(n.nome).includes(q))
  const mediaTurma = media(lista.map((n) => mediaDe(n.nome)))
  const th = 'sticky top-0 z-10 h-14 bg-white px-3 text-center align-middle shadow-[inset_0_-2px_0_var(--color-borda)]'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 overflow-auto overscroll-contain rounded-[16px] border-2 border-borda bg-white">
        <table aria-label={`Notas do ${t?.nome ?? ''}`} className="w-full min-w-[560px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th scope="col" className={cn(th, 'sticky left-0 z-20 w-[30%] pl-4 text-left')}><span className="t-selo text-sutil">Aluno</span></th>
              {colunas.map((c) => (
                <th key={c.id} scope="col" title={`${c.nome} · ${c.data}`} className={cn(th, c.travada && 'bg-fundo-suave')}>
                  <span className={cn('block max-w-[150px] truncate text-[14px] font-bold leading-5', c.travada ? 'text-sutil' : 'text-tinta')}>{c.curto}</span>
                  {c.travada
                    ? <Selo familia="amarelo" tamanho="p" icone={<Lock strokeWidth={3} />} className="mt-0.5">Para aprovar</Selo>
                    : <span className="block text-[13px] font-medium leading-4 text-sutil">{c.data}</span>}
                </th>
              ))}
              <th scope="col" className={cn(th, 'pr-4')}><span className="t-selo text-tinta">Média</span></th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((n, i) => {
              const m = mediaDe(n.nome)
              return (
                <tr key={n.id} className="group">
                  <td className="sticky left-0 z-[5] h-12 border-b-2 border-borda bg-white pl-4 pr-2 group-last:border-b-0 group-hover:bg-fundo-suave">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="w-5 shrink-0 text-right text-[13px] font-medium tabular-nums text-sutil">{i + 1}</span>
                      <span className="truncate text-[15px] font-medium text-tinta">{n.nome}</span>
                    </span>
                  </td>
                  {colunas.map((c) => {
                    const v = c.valor(n.nome)
                    return (
                      <td key={c.id} className={cn('h-12 border-b-2 border-borda px-3 text-center text-[15px] font-medium tabular-nums group-last:border-b-0', c.travada ? 'bg-fundo-suave' : 'group-hover:bg-fundo-suave')}>
                        {c.travada ? <span className="sr-only">Para aprovar</span>
                          : v === null ? <span className="text-sutil">—</span>
                            : <span className="text-tinta">{comVirgula(v)}</span>}
                      </td>
                    )
                  })}
                  <td className="h-12 border-b-2 border-borda pr-4 text-center group-last:border-b-0 group-hover:bg-fundo-suave">
                    {m === null ? <span className="text-sutil">—</span>
                      : <span className="inline-grid h-8 min-w-12 place-items-center rounded-[8px] bg-fundo-suave px-2 text-[15px] font-bold tabular-nums text-tinta">{comVirgula(m)}</span>}
                  </td>
                </tr>
              )
            })}
            {visiveis.length === 0 && (
              <tr><td colSpan={colunas.length + 2} className="h-24 text-center t-apoio">Nenhum aluno com esse nome.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky bottom-0 left-0 z-20 h-12 bg-fundo-suave pl-4 text-[15px] font-bold text-tinta shadow-[inset_0_2px_0_var(--color-borda)]">Média da turma</td>
              {colunas.map((c) => {
                const mc = c.travada ? null : media(lista.map((n) => c.valor(n.nome)))
                return <td key={c.id} className="sticky bottom-0 z-10 h-12 bg-fundo-suave text-center text-[15px] font-bold tabular-nums text-tinta shadow-[inset_0_2px_0_var(--color-borda)]">{mc === null ? <span className="text-sutil">—</span> : comVirgula(mc)}</td>
              })}
              <td className="sticky bottom-0 z-10 h-12 bg-fundo-suave pr-4 text-center shadow-[inset_0_2px_0_var(--color-borda)]">
                <span className="inline-grid h-8 min-w-12 place-items-center rounded-[8px] bg-grafite px-2 text-[15px] font-bold tabular-nums text-white">{mediaTurma === null ? '—' : comVirgula(mediaTurma)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="flex shrink-0 items-center gap-1.5 pt-2.5 t-apoio">
        {temTravada && <Lock aria-hidden className="size-4 shrink-0" strokeWidth={2.5} />}
        Média só com notas aprovadas.
      </p>
    </div>
  )
}
