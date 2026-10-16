import { useMemo, useState } from 'react'
import type React from 'react'
import { ArrowUpDown, ChevronDown, ChevronRight, UserPlus } from 'lucide-react'
import { Avatar, Botao, Busca, MenuMais, Segmentado, Selo } from '@/components/duo'
import { useParametro } from '@/components/turmma/tela'
import { naoComecouDa } from '@/dados/alunos'
import { useAlunosDaTurma, usePedidos, type AlunoDaTurma } from '@/dados/acesso'
import { useAdaptacoes } from '@/dados/escola-estado'
import { comVirgula } from '@/dados/turma-atividades'
import { cn } from '@/lib/utils'
import { limpa } from '../_busca'
import { ConvidarAlunos, ConviteNaTela, useEntraramNa } from './ConvidarAlunos'
import { BoletimTurma, exportarNotas, useBoletim } from './Notas'
import { FichaDoAluno, PontoSituacao, situacaoDoNome } from './Sala'

/* ABA "ALUNOS" DA TURMA (14ª rodada, 05/10/2026; plano ux-composicao 5.2). Um grupo de alunos, dois jeitos de ver
   (Lista | Notas, ?ver=; R3).
   · Uma linha de ferramentas: o segmentado, a busca, a ordem (só na Lista: Nome · Média · Quem ainda não começou) e, à
     direita, "3 pediram para entrar ›" (abre o painel da fila, ?item=pedidos-<turma>), "26 de 32 entraram",
     CONVIDAR ALUNOS (o botão cheio enquanto falta alguém entrar; depois, no ⋯) e o ⋯ com Exportar notas.
   · LISTA: uma tabela de colunas proporcionais (Aluno 40% · Situação 25% · Entregas 15% · Média 10% · ›), linhas de
     56 px, o cabeçalho preso e a lista rolando por dentro. A situação é um fato do trabalho (`Ponto` e uma palavra);
     a média só soma nota APROVADA; o selo ADAPTAÇÃO é o que a coordenação registrou (useAdaptacoes). A linha abre a
     ficha ao lado (?aluno=). A 375: linhas de 56 (avatar · nome · o ponto da situação · a média à direita), sem
     blocos de rótulo e valor.
   · NOTAS: o boletim (Notas.tsx), com a coluna não aprovada travada e fora da média.
   Os nomes vêm de `useAlunosDaTurma`: a 3ºA mostra a lista que a coordenação gravou, e quem o professor aprova passa de
   "Pediu para entrar" a "Em dia" na hora. A aba cabe na janela (R10). */

type Ordem = 'nome' | 'media' | 'naocomecou'
const ORDENS: { id: Ordem; nome: string }[] = [{ id: 'nome', nome: 'Nome' }, { id: 'media', nome: 'Média' }, { id: 'naocomecou', nome: 'Quem ainda não começou' }]

type LinhaAluno = { n: AlunoDaTurma; numero: number; media: number | null; naoComecou: boolean; adaptacao: boolean }

export function AlunosTurma({ turmaId }: { turmaId: string }) {
  const [verParam, setVer] = useParametro('ver', 'lista')
  const ver = verParam === 'notas' ? 'notas' : 'lista'
  const [convidar, setConvidar] = useParametro('convidar')
  const [aluno, setAluno] = useParametro('aluno')
  const [, setItem] = useParametro('item')
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<Ordem>('nome')

  const lista = useAlunosDaTurma(turmaId)
  const pedidos = usePedidos(turmaId)
  const adaptacoes = useAdaptacoes(turmaId)
  const { colunas, mediaDe } = useBoletim(turmaId)
  const { entraram, total } = useEntraramNa(turmaId)
  const faltaEntrar = entraram < total

  const linhas = useMemo<LinhaAluno[]>(() => {
    const nc = new Set(naoComecouDa(turmaId).ids)
    const comAdaptacao = new Set(adaptacoes.map((a) => a.aluno))
    const q = limpa(busca.trim())
    const l = lista.map((n, i) => ({
      n, numero: i + 1, media: mediaDe(n.nome),
      naoComecou: n.situacao !== 'na-turma' || (!!n.aluno && nc.has(n.aluno.id)), adaptacao: comAdaptacao.has(n.nome),
    })).filter((x) => !q || limpa(x.n.nome).includes(q))
    if (ordem === 'media') return [...l].sort((x, y) => (x.media === null ? 1 : 0) - (y.media === null ? 1 : 0) || (x.media ?? 0) - (y.media ?? 0) || x.numero - y.numero)
    if (ordem === 'naocomecou') return [...l].sort((x, y) => Number(y.naoComecou) - Number(x.naoComecou) || x.numero - y.numero)
    return l
  }, [lista, adaptacoes, mediaDe, busca, ordem, turmaId])

  if (lista.length === 0) return <ConviteNaTela turmaId={turmaId} />

  const maisItens = [
    ...(!faltaEntrar ? [{ rotulo: 'Convidar alunos', aoEscolher: () => setConvidar('1') }] : []),
    { rotulo: 'Exportar notas', aoEscolher: () => exportarNotas(turmaId, colunas, lista.map((n) => n.nome)) },
  ]
  const atual = ORDENS.find((o) => o.id === ordem)!

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Segmentado rotulo="Ver os alunos em" valor={ver} aoMudar={(v) => setVer(v === 'lista' ? null : v)}
          opcoes={[{ id: 'lista', rotulo: 'Lista' }, { id: 'notas', rotulo: 'Notas' }]} />
        <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar aluno" className="max-sm:order-last max-sm:w-full sm:w-56" />
        {ver === 'lista' && (
          <MenuMais rotulo="Ordenar" alinhar="start" itens={ORDENS.map((o) => ({ rotulo: o.nome, aoEscolher: () => setOrdem(o.id) }))}
            gatilho={(
              <button type="button" aria-label={`Ordem: ${atual.nome}`}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[12px] border-2 border-borda bg-white px-3 text-[15px] font-bold text-apoio transition-colors duration-150 hover:bg-fundo-suave hover:text-tinta data-[state=open]:bg-fundo-suave">
                <ArrowUpDown aria-hidden className="size-4" strokeWidth={2.5} />
                <span className="max-w-[200px] truncate max-lg:hidden">{atual.nome}</span>
                <ChevronDown aria-hidden className="size-4" strokeWidth={2.5} />
              </button>
            )} />
        )}
        <div className="ml-auto flex min-w-0 items-center gap-2">
          {pedidos.length > 0 && (
            <button type="button" onClick={() => setItem(`pedidos-${turmaId}`)}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-2 text-[15px] font-bold text-tinta transition-colors duration-150 hover:bg-fundo-suave">
              <span aria-hidden className="size-2.5 rounded-full bg-amarelo" />
              {pedidos.length} {pedidos.length === 1 ? 'pediu' : 'pediram'} para entrar
              <ChevronRight aria-hidden className="size-5 text-apagado" strokeWidth={2.5} />
            </button>
          )}
          <span className="t-apoio whitespace-nowrap max-md:hidden">{entraram} de {total} entraram</span>
          {faltaEntrar && <Botao tamanho="m" onClick={() => setConvidar('1')} icone={<UserPlus strokeWidth={2.5} />} aria-label="Convidar alunos"><span className="max-xl:sr-only">Convidar alunos</span></Botao>}
          <MenuMais rotulo="Mais da aba Alunos" itens={maisItens} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {ver === 'lista'
          ? <TabelaAlunos linhas={linhas} ativa={aluno} aoAbrir={(id) => setAluno(id)} />
          : <BoletimTurma key={turmaId} turmaId={turmaId} busca={busca} />}
      </div>

      <FichaDoAluno turmaId={turmaId} alunoId={aluno} aoFechar={() => setAluno(null)} />
      <ConvidarAlunos turmaId={turmaId} aberto={convidar === '1'} aoMudar={(v) => setConvidar(v ? '1' : null)} />
    </div>
  )
}

/** A lista em colunas proporcionais (computador) e em linhas de 56 px (celular). A linha inteira abre a ficha. */
function TabelaAlunos({ linhas, ativa, aoAbrir }: { linhas: LinhaAluno[]; ativa: string | null; aoAbrir: (id: string) => void }) {
  const teclar = (e: React.KeyboardEvent, id: string) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoAbrir(id) } }
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-[16px] border-2 border-borda bg-white">
      <div className="hidden min-h-0 overflow-y-auto overscroll-contain md:block">
        <table aria-label="Alunos da turma" className="w-full table-fixed border-collapse text-left">
          <colgroup><col className="w-[40%]" /><col className="w-[25%]" /><col className="w-[15%]" /><col className="w-[10%]" /><col className="w-[10%]" /></colgroup>
          <thead className="sticky top-0 z-[1] bg-white shadow-[inset_0_-2px_0_var(--color-borda)]">
            <tr>
              <th scope="col" className="t-selo h-11 px-4 align-middle text-sutil">Aluno</th>
              <th scope="col" className="t-selo h-11 px-4 align-middle text-sutil">Situação</th>
              <th scope="col" className="t-selo h-11 px-4 align-middle text-sutil">Entregas</th>
              <th scope="col" className="t-selo h-11 px-4 text-right align-middle text-sutil">Média</th>
              <th aria-hidden />
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const s = situacaoDoNome(l.n, l.media)
              const e = l.n.aluno?.entregas
              const aberta = ativa === l.n.id
              return (
                <tr key={l.n.id} tabIndex={0} onClick={() => aoAbrir(l.n.id)} onKeyDown={(ev) => teclar(ev, l.n.id)} aria-selected={aberta}
                  className={cn('h-14 cursor-pointer border-t-2 border-borda text-[15px] font-medium text-tinta transition-colors duration-150 first:border-t-0 hover:bg-fundo-suave focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-azul-texto',
                    aberta && 'bg-azul-claro hover:bg-azul-claro')}>
                  <td className="px-4">
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar nome={l.n.nome} tamanho={32} />
                      <span className="truncate font-bold">{l.n.nome}</span>
                      {l.adaptacao && <Selo familia="roxo" tamanho="p" title="Adaptação registrada pela coordenação">Adaptação</Selo>}
                    </span>
                  </td>
                  <td className="px-4"><span className="flex min-w-0 items-center gap-2 text-apoio"><PontoSituacao s={s} /><span className="truncate">{s.rotulo}</span></span></td>
                  <td className="px-4 tabular-nums text-apoio">{e && l.n.situacao === 'na-turma' ? `${e.feitas} de ${e.total}` : <span className="text-sutil">—</span>}</td>
                  <td className="px-4 text-right">{l.media === null ? <span className="text-sutil">—</span> : <span className="font-bold tabular-nums">{comVirgula(l.media)}</span>}</td>
                  <td className="pr-4 text-right"><ChevronRight aria-hidden strokeWidth={2.5} className="ml-auto size-5 text-apagado" /></td>
                </tr>
              )
            })}
            {linhas.length === 0 && <tr><td colSpan={5} className="t-apoio h-16 px-4">Nenhum aluno com esse nome.</td></tr>}
          </tbody>
        </table>
      </div>

      <ul aria-label="Alunos da turma" className="min-h-0 overflow-y-auto overscroll-contain md:hidden">
        {linhas.map((l) => {
          const s = situacaoDoNome(l.n, l.media)
          return (
            <li key={l.n.id} className="border-t-2 border-borda first:border-t-0">
              <button type="button" onClick={() => aoAbrir(l.n.id)} aria-label={`${l.n.nome}: ${s.rotulo}${l.media !== null ? `, média ${comVirgula(l.media)}` : ''}`}
                className={cn('flex h-14 w-full min-w-0 items-center gap-3 px-4 text-left hover:bg-fundo-suave', ativa === l.n.id && 'bg-azul-claro')}>
                <Avatar nome={l.n.nome} tamanho={32} />
                <span className="min-w-0 flex-1 truncate text-[15px] font-bold text-tinta">{l.n.nome}</span>
                <PontoSituacao s={s} />
                <span className="w-9 shrink-0 text-right text-[15px] font-bold tabular-nums text-tinta">{l.media === null ? <span className="text-sutil">—</span> : comVirgula(l.media)}</span>
              </button>
            </li>
          )
        })}
        {linhas.length === 0 && <li className="t-apoio px-4 py-5">Nenhum aluno com esse nome.</li>}
      </ul>
    </div>
  )
}
