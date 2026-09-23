import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Armchair, ArrowDown, ArrowUp, ArrowUpDown, Eye, Heart, Minus, MoreVertical, NotebookText, Sparkles, TrendingDown, TrendingUp, UserPlus } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { itemT, menuT } from '@/components/turmma/painel'
import { AvatarT, BotaoT, botaoT, CabecalhoAba, Periodo, tabelaT } from '@/components/turmma/teachy'
import { alunosDa, type Aluno } from '@/dados/alunos'
import { adaptacaoDe, statusDe, tendenciaDe, virgula, type StatusAluno } from '@/dados/turmas-resumo'
import { cn } from '@/lib/utils'
import { ConvidarAlunos } from './ConvidarAlunos'
import { SalaTurma } from './Sala'

/* ABA "ALUNOS" DA TURMA ABERTA — CÓPIA da aba "Alunos" da Teachy (oitava rodada, 20/09/2026: "eu quero um ctrl c e
   ctrl v da Teachy"). O cabeçalho grande ("Alunos" 20/700 + a linha de apoio), à direita o seletor de período e o
   primário "Adicionar" — é DELE que sai o convite (ConvidarAlunos.tsx), como o "Adicionar alunos" da Teachy; o botão de
   convite saiu da barra da turma. Embaixo, as subabas sublinhadas "Alunos" | "Sala":
   · "Alunos": a tabela da Teachy — caixa de seleção · Aluno ⇅ · Média ⇅ · Tendência · Status · Ações — com linha de
     56 px, ordenável por nome e por média. "Detalhes" abre a ficha do aluno na subaba Sala; "Adaptação" (em laranja)
     só aparece para quem tem adaptação registrada (dois alunos do 2ºB); "⋮" guarda o resto.
   · "Sala": a sala de carteiras que o Gabriel aprovou (Sala.tsx), num quadro de 600 px de altura.
   O endereço guarda a subaba: `?aba=alunos` é a tabela, `?aba=sala` é a sala (o endereço antigo da aba "Sala" continua
   abrindo, e `&aluno=<id>` abre a ficha daquele aluno).
   Tudo aqui é TRABALHO do aluno: média das atividades aprovadas, a evolução dela, entrega. O status é sempre um fato
   ("Em dia" · "Entrega faltando" · "Abaixo de 6"); nunca atenção, humor ou jeito do aluno (D57, D66).
   Contrato das abas (novo): bloco de altura natural dentro da coluna da turma; quem rola é o documento. */

type Ordem = { por: 'nome' | 'media'; sentido: 1 | -1 }

const STATUS: Record<StatusAluno, { nome: string; classe: string }> = {
  'em-dia': { nome: 'Em dia', classe: 'bg-ok-cx text-ok' },
  entrega: { nome: 'Entrega faltando', classe: 'bg-pendente-cx text-pendente' },
  abaixo: { nome: 'Abaixo de 6', classe: 'bg-erro-cx text-erro' },
}

const NA_ORDEM: Record<string, string> = { nome1: 'em ordem de chamada', 'nome-1': 'de Z a A', media1: 'da menor média para a maior', 'media-1': 'da maior média para a menor' }

function Tendencia({ a }: { a: Aluno }) {
  const t = tendenciaDe(a)
  if (t.sentido === 'sem') return <span className="text-inativo" title="Menos de duas notas: ainda não dá para dizer">-</span>
  const delta = `${t.delta > 0 ? '+' : t.delta < 0 ? '−' : ''}${virgula(Math.abs(t.delta))}`
  if (t.sentido === 'sobe') return <span className="inline-flex items-center gap-1.5 text-ok" title="As notas mais recentes estão acima das primeiras"><TrendingUp aria-hidden className="size-4" strokeWidth={2} /><span className="text-tinta">{delta}</span><span className="sr-only">subindo</span></span>
  if (t.sentido === 'desce') return <span className="inline-flex items-center gap-1.5 text-erro" title="As notas mais recentes estão abaixo das primeiras"><TrendingDown aria-hidden className="size-4" strokeWidth={2} /><span className="text-tinta">{delta}</span><span className="sr-only">caindo</span></span>
  return <span className="inline-flex items-center gap-1.5 text-inativo" title="As notas mais recentes estão no nível das primeiras"><Minus aria-hidden className="size-4" strokeWidth={2} /><span className="text-sutil">estável</span></span>
}

function Ordenar({ rotulo, ativo, sentido, aoClicar }: { rotulo: string; ativo: boolean; sentido: 1 | -1; aoClicar: () => void }) {
  const Icone = !ativo ? ArrowUpDown : sentido === 1 ? ArrowUp : ArrowDown
  return (
    <button type="button" onClick={aoClicar} aria-label={`Ordenar por ${rotulo.toLowerCase()}`} className="-mx-1.5 inline-flex items-center gap-1.5 rounded-[6px] px-1.5 font-teachy font-bold transition-colors duration-150 hover:bg-realce">
      {rotulo}<Icone aria-hidden className={cn('size-3.5', ativo ? 'text-tinta' : 'text-inativo')} strokeWidth={2} />
    </button>
  )
}

const subaba = (ativa: boolean) => cn('-mb-px inline-flex h-10 items-center border-b-2 px-1 text-[14px] leading-6 transition-colors duration-150',
  ativa ? 'border-caramelo font-teachy font-bold text-tinta' : 'border-transparent text-apoio hover:text-tinta')
const caixa = 'size-4 cursor-pointer rounded-[4px] accent-tinta'

export function AlunosTurma({ turmaId }: { turmaId: string }) {
  const [params, setParams] = useSearchParams()
  const naSala = params.get('aba') === 'sala'
  // as quatro atividades corrigidas cabem em qualquer uma das janelas: o período fica guardado, a média não muda
  const [periodo, setPeriodo] = useState('2026')
  const [ordem, setOrdem] = useState<Ordem>({ por: 'nome', sentido: 1 })
  const [marcados, setMarcados] = useState<Set<string>>(new Set())
  const [convite, setConvite] = useState(false)

  // A sala é tela de trabalho: ao abrir a subaba, o documento sobe até a linha das subabas, e o quadro de 600 px
  // aparece INTEIRO na janela de 780 (com o cabeçalho da aba em cima, os últimos 40 px ficavam para fora).
  // Espera um quadro: a turma, que é o pai, volta o documento ao alto quando a aba muda, e isso roda depois daqui.
  const subabas = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!naSala) return
    const q = requestAnimationFrame(() => subabas.current?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(q)
  }, [naSala])

  const alunos = alunosDa(turmaId)
  const linhas = useMemo(() => {
    const l = alunos.map((a) => ({ a, media: a.media }))
    return l.sort((x, y) => {
      if (ordem.por === 'nome') return x.a.nome.localeCompare(y.a.nome, 'pt-BR') * ordem.sentido
      // sem nota vai sempre para o fim, em qualquer sentido; no empate vale a ordem de chamada
      if (x.media === null || y.media === null) return (x.media === null ? 1 : 0) - (y.media === null ? 1 : 0) || x.a.numero - y.a.numero
      return (x.media - y.media) * ordem.sentido || x.a.numero - y.a.numero
    })
  }, [alunos, ordem])

  const ordenarPor = (por: Ordem['por']) => setOrdem((o) => (o.por === por ? { por, sentido: o.sentido === 1 ? -1 : 1 } : { por, sentido: 1 }))
  const marcar = (id: string) => setMarcados((m) => { const n = new Set(m); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const todos = marcados.size === alunos.length
  const abrir = (sub: 'alunos' | 'sala', aluno?: string) => setParams(aluno ? { aba: sub, aluno } : { aba: sub }, { replace: true })

  return (
    <div>
      <CabecalhoAba grande titulo="Alunos" apoio="Acompanhe seus alunos, obtenha insights e veja a sala">
        <Periodo valor={periodo} aoMudar={setPeriodo} />
        <BotaoT tamanho="m" onClick={() => setConvite(true)}><UserPlus aria-hidden strokeWidth={2} /> Adicionar</BotaoT>
      </CabecalhoAba>

      <div ref={subabas} className="flex min-h-10 scroll-mt-2 flex-wrap items-end justify-between gap-x-6 border-b border-linha">
        <div role="tablist" aria-label="Alunos ou sala" className="flex gap-6">
          <button type="button" role="tab" aria-selected={!naSala} onClick={() => abrir('alunos')} className={subaba(!naSala)}>Alunos</button>
          <button type="button" role="tab" aria-selected={naSala} onClick={() => abrir('sala')} className={subaba(naSala)}>Sala</button>
        </div>
        {!naSala && (
          <div className="flex h-10 items-center gap-2 text-[12px] leading-4 text-sutil">
            {marcados.size === 0 ? <span>{alunos.length} alunos · {NA_ORDEM[`${ordem.por}${ordem.sentido}`]}</span> : (
              <>
                <span className="mr-1 font-medium text-tinta">{marcados.size} {marcados.size === 1 ? 'selecionado' : 'selecionados'}</span>
                <Link to="/professor/ferramentas/atividade" className={botaoT('contorno', 'p')}>Pedir reforço</Link>
                <BotaoT variante="texto" tamanho="p" onClick={() => setMarcados(new Set())}>Limpar</BotaoT>
              </>
            )}
          </div>
        )}
      </div>

      {naSala ? <div className="pt-6"><SalaTurma key={turmaId} turmaId={turmaId} /></div> : (
        <div className={cn(tabelaT.caixa, 'mt-6 overflow-x-auto')}>
          <table className={cn(tabelaT.tabela, 'min-w-[860px]')}>
            <thead className={tabelaT.cabeca}>
              <tr>
                <th scope="col" className={cn(tabelaT.th, 'w-12 pr-0')}>
                  <input type="checkbox" className={cn(caixa, 'block')} aria-label="Selecionar todos os alunos" checked={todos} onChange={() => setMarcados(todos ? new Set() : new Set(alunos.map((a) => a.id)))} />
                </th>
                <th scope="col" className={tabelaT.th} aria-sort={ordem.por === 'nome' ? (ordem.sentido === 1 ? 'ascending' : 'descending') : 'none'}>
                  <Ordenar rotulo="Aluno" ativo={ordem.por === 'nome'} sentido={ordem.sentido} aoClicar={() => ordenarPor('nome')} />
                </th>
                <th scope="col" className={cn(tabelaT.th, 'w-[120px]')} aria-sort={ordem.por === 'media' ? (ordem.sentido === 1 ? 'ascending' : 'descending') : 'none'}>
                  <Ordenar rotulo="Média" ativo={ordem.por === 'media'} sentido={ordem.sentido} aoClicar={() => ordenarPor('media')} />
                </th>
                <th scope="col" className={cn(tabelaT.th, 'w-[140px]')}>Tendência</th>
                <th scope="col" className={cn(tabelaT.th, 'w-[180px]')}>Status</th>
                <th scope="col" className={cn(tabelaT.th, 'w-[290px]')}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ a, media }) => {
                const s = STATUS[statusDe(a)]
                const adaptacao = adaptacaoDe(a.id)
                return (
                  <tr key={a.id} className={cn(tabelaT.tr, 'h-14', marcados.has(a.id) && 'bg-[#FAFAFA]')}>
                    <td className={cn(tabelaT.td, 'pr-0')}><input type="checkbox" className={cn(caixa, 'block')} aria-label={`Selecionar ${a.nome}`} checked={marcados.has(a.id)} onChange={() => marcar(a.id)} /></td>
                    <td className={tabelaT.td}>
                      <span className="flex min-w-0 items-center gap-2.5"><AvatarT nome={a.nome} /><span className="truncate">{a.nome}</span></span>
                    </td>
                    <td className={cn(tabelaT.td, 'font-semibold')}>{media === null ? <span className="font-normal text-inativo">-</span> : virgula(media)}</td>
                    <td className={tabelaT.td}><Tendencia a={a} /></td>
                    <td className={tabelaT.td}><span className={cn('inline-flex h-6 items-center whitespace-nowrap rounded-[4px] px-2 text-[12px] font-medium leading-4', s.classe)}>{s.nome}</span></td>
                    <td className={cn(tabelaT.td, 'py-0')}>
                      <span className="flex items-center gap-2">
                        <BotaoT variante="contorno" tamanho="p" onClick={() => abrir('sala', a.id)} aria-label={`Detalhes de ${a.nome}`}><Eye aria-hidden strokeWidth={2} /> Detalhes</BotaoT>
                        {adaptacao && (
                          <Link to="/professor/ferramentas/adaptacao" title={`Adaptação registrada: ${adaptacao}`} aria-label={`Adaptação de ${a.nome}: ${adaptacao}`}
                            className={botaoT('contorno', 'p', 'border-caramelo text-caramelo-texto hover:bg-marca-cx')}><Heart aria-hidden strokeWidth={2} /> Adaptação</Link>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" aria-label={`Mais ações para ${a.nome}`} className="ml-auto grid size-7 shrink-0 place-items-center rounded-[8px] text-sutil outline-none transition-colors duration-150 hover:bg-realce-suave hover:text-tinta data-[state=open]:bg-realce-suave">
                              <MoreVertical aria-hidden className="size-4" strokeWidth={2} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={cn(menuT, 'w-60')}>
                            <DropdownMenuItem className={itemT} onSelect={() => abrir('sala', a.id)}><Armchair aria-hidden strokeWidth={1.75} /> Ver na sala</DropdownMenuItem>
                            <DropdownMenuItem className={itemT} onSelect={() => setParams({ aba: 'notas' }, { replace: true })}><NotebookText aria-hidden strokeWidth={1.75} /> Ver as notas da turma</DropdownMenuItem>
                            <DropdownMenuItem className={itemT} asChild><Link to="/professor/ferramentas/atividade"><Sparkles aria-hidden strokeWidth={1.75} /> Pedir atividade de reforço</Link></DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConvidarAlunos turmaId={turmaId} aberto={convite} aoMudar={setConvite} />
    </div>
  )
}
