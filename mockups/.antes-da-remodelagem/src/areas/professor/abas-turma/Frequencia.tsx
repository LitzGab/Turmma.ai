import { useEffect, useRef, useState } from 'react'
import { Check, ClipboardCheck } from 'lucide-react'
import { BotaoT, CabecalhoAba, Periodo, tabelaT } from '@/components/turmma/teachy'
import { alunosDa, type Aluno } from '@/dados/alunos'
import { turmaDe } from '@/dados/escola'
import { aulasDa } from '@/dados/turma-atividades'
import { cn } from '@/lib/utils'
import { limpa } from '../_busca'
import { AlunoT, BuscaAluno, CaixaTabela, FraseDoPe, LinhaVazia, SubAbas } from './Atividades'

/* ABA FREQUÊNCIA, na pele da Teachy: o molde das outras abas (cabeçalho, subabas que filtram, tabela de canto 8) e,
   dentro da caixa, a chamada no desenho do diário de classe. Alunos nas linhas, as 16 aulas dadas nas colunas (um fio
   separa as semanas) e, à direita, as faltas e a presença. Presente é um ponto cinza pequeno; falta é um ponto laranja
   maior; a coluna de hoje vem num fundo um tom abaixo. Com 4 faltas em 16 aulas o aluno está nos 75% que a escola
   exige, e o número vai para o laranja-escuro.
   "Fazer a chamada" torna a coluna de hoje editável (um clique alterna presente e falta) e troca o botão por
   "Salvar chamada". Faltas ainda não existem no roadmap do produto: é proposta do mockup (ver LEIAME, tarefas futuras). */

type FiltroId = 'todos' | 'tres' | 'nenhuma'

const ORDEM_DIA = ['seg', 'ter', 'qua', 'qui', 'sex']
const celula = 'h-[46px] p-0 text-center align-middle'

export function FrequenciaTurma({ turmaId }: { turmaId: string }) {
  // a chamada em edição é da turma: trocar de turma começa de novo
  return <Chamada key={turmaId} turmaId={turmaId} />
}

function Chamada({ turmaId }: { turmaId: string }) {
  const alunos = alunosDa(turmaId)
  const aulas = aulasDa(turmaId)
  const turma = turmaDe(turmaId)
  const hoje = aulas.find((a) => a.hoje)!
  const [periodo, setPeriodo] = useState('2026')
  const [filtro, setFiltro] = useState<FiltroId>('todos')
  const [busca, setBusca] = useState('')
  const [salva, setSalva] = useState(() => new Set(alunos.filter((a) => a.datasFaltas.includes(hoje.data)).map((a) => a.id)))
  const [rascunho, setRascunho] = useState<Set<string> | null>(null)
  const [salvou, setSalvou] = useState(false)
  const editando = rascunho !== null
  // no celular a tabela rola de lado dentro da caixa: abre no fim, onde estão hoje, as faltas e a presença
  const rolagem = useRef<HTMLDivElement>(null)
  useEffect(() => { const el = rolagem.current; if (el) el.scrollLeft = el.scrollWidth }, [editando])
  const faltasHoje = rascunho ?? salva

  const faltou = (a: Aluno, data: string) => (data === hoje.data ? faltasHoje.has(a.id) : a.datasFaltas.includes(data))
  const faltasDe = (a: Aluno) => a.faltas - (a.datasFaltas.includes(hoje.data) ? 1 : 0) + (faltasHoje.has(a.id) ? 1 : 0)
  const presencaDe = (a: Aluno) => Math.round(((a.aulasDadas - faltasDe(a)) / a.aulasDadas) * 100)
  const alternar = (id: string) => setRascunho((r) => { const n = new Set(r ?? salva); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const q = limpa(busca.trim())
  const no: Record<FiltroId, Aluno[]> = { todos: alunos, tres: alunos.filter((a) => faltasDe(a) >= 3), nenhuma: alunos.filter((a) => faltasDe(a) === 0) }
  const visiveis = no[filtro].filter((a) => !q || limpa(a.nome).includes(q))
  const totalFaltas = alunos.reduce((s, a) => s + faltasDe(a), 0)
  const presencaMedia = Math.round(((alunos.length * aulas.length - totalFaltas) / (alunos.length * aulas.length)) * 100)
  const noLimite = alunos.filter((a) => faltasDe(a) >= 4).length
  // o fio que separa as semanas: a coluna em que o dia da semana volta para trás
  const abreSemana = aulas.map((a, i) => i > 0 && ORDEM_DIA.indexOf(a.dia) <= ORDEM_DIA.indexOf(aulas[i - 1].dia))

  return (
    <section className="font-teachy-corpo text-tinta">
      <CabecalhoAba titulo="Frequência" apoio="Acompanhe a presença dos seus alunos">
        <Periodo valor={periodo} aoMudar={setPeriodo} />
        {editando ? (
          <span className="flex items-center gap-2">
            <span className="mr-1 text-[12px] leading-4 text-sutil max-md:hidden"><b className="font-semibold text-tinta">{faltasHoje.size}</b> {faltasHoje.size === 1 ? 'falta' : 'faltas'} hoje</span>
            <BotaoT variante="texto" tamanho="m" onClick={() => setRascunho(null)}>Cancelar</BotaoT>
            <BotaoT tamanho="m" onClick={() => { setSalva(faltasHoje); setRascunho(null); setSalvou(true) }}><Check aria-hidden /> Salvar chamada</BotaoT>
          </span>
        ) : (
          <span className="flex items-center gap-3">
            {salvou && <span className="flex items-center gap-1.5 text-[12px] leading-4 text-sutil max-md:hidden"><Check aria-hidden className="size-3.5 text-ok" strokeWidth={2.4} />Chamada de hoje salva</span>}
            <BotaoT variante={salvou ? 'contorno' : 'primario'} tamanho="m" onClick={() => setRascunho(new Set(salva))}><ClipboardCheck aria-hidden /> {salvou ? 'Editar a chamada' : 'Fazer a chamada'}</BotaoT>
          </span>
        )}
      </CabecalhoAba>

      <SubAbas rotulo="Filtrar os alunos" valor={filtro} aoMudar={setFiltro} opcoes={[
        { id: 'todos', nome: 'Todos', n: no.todos.length }, { id: 'tres', nome: '3 faltas ou mais', n: no.tres.length }, { id: 'nenhuma', nome: 'Nenhuma falta', n: no.nenhuma.length },
      ]}>
        <BuscaAluno valor={busca} aoMudar={setBusca} />
      </SubAbas>

      <CaixaTabela rotulo={`Chamada do ${turma.nome}`} minimo="min-w-[910px]" rolagem={rolagem}>
        <colgroup><col className="w-[160px] sm:w-[208px]" />{aulas.map((a) => <col key={a.data} />)}<col className="w-[56px] sm:w-[64px]" /><col className="w-[78px] sm:w-[88px]" /></colgroup>
        <thead className={tabelaT.cabeca}>
          <tr>
            <th className={cn(tabelaT.th, 'sticky left-0 z-10 bg-[#FAFAFA]')}>Aluno</th>
            {aulas.map((aula, i) => (
              <th key={aula.data} className={cn('h-[49px] p-0 text-center align-middle font-normal', abreSemana[i] && 'border-l border-linha', aula.hoje && 'bg-realce')}>
                <span className={cn('block text-[11px] leading-[14px]', aula.hoje ? 'font-semibold text-pendente' : 'text-inativo')}>{aula.hoje ? 'hoje' : aula.dia}</span>
                <span className={cn('block text-[12px] leading-4', aula.hoje ? 'font-semibold text-tinta' : 'text-sutil')}>{aula.data}</span>
              </th>
            ))}
            <th className={cn(tabelaT.th, 'border-l border-linha px-0 text-center')}>Faltas</th>
            <th className={cn(tabelaT.th, 'px-0 text-center')}>Presença</th>
          </tr>
        </thead>
        <tbody>
          {visiveis.map((a) => {
            const n = faltasDe(a)
            return (
              <tr key={a.id} className={cn(tabelaT.tr, 'group')}>
                <td className={cn(tabelaT.td, 'sticky left-0 z-10 h-[46px] bg-superficie py-0 transition-colors duration-150 group-hover:bg-[#FAFAFA] max-lg:shadow-[inset_-1px_0_0_var(--color-linha)]')}><AlunoT aluno={a} /></td>
                {aulas.map((aula, i) => {
                  const f = faltou(a, aula.data)
                  return (
                    <td key={aula.data} aria-label={`${aula.data}: ${f ? 'falta' : 'presente'}`} className={cn(celula, abreSemana[i] && 'border-l border-linha', aula.hoje && 'bg-realce-suave')}>
                      {aula.hoje && editando ? (
                        <button type="button" aria-pressed={f} onClick={() => alternar(a.id)} title={f ? 'Falta. Clique para marcar presença' : 'Presente. Clique para marcar falta'}
                          className={cn('inline-grid h-6 w-8 place-items-center rounded-[4px] font-teachy text-[12px] font-bold leading-none transition-colors duration-150', f ? 'bg-caramelo text-tinta' : 'border border-borda-campo bg-superficie text-sutil hover:border-tinta hover:text-tinta')}>
                          {f ? 'F' : 'P'}
                        </button>
                      ) : <i aria-hidden className={cn('inline-block rounded-full align-middle', f ? 'size-2.5 bg-caramelo' : 'size-1.5 bg-borda-campo')} />}
                    </td>
                  )
                })}
                <td className={cn(celula, 'border-l border-linha text-[14px]', n >= 4 ? 'font-semibold text-pendente' : n === 0 ? 'text-inativo' : 'font-semibold text-tinta')}>{n}</td>
                <td className={cn(celula, 'text-[14px]', n >= 4 ? 'font-semibold text-pendente' : 'text-sutil')}>{presencaDe(a)}%</td>
              </tr>
            )
          })}
          {visiveis.length === 0 && <LinhaVazia colunas={aulas.length + 3}>{q ? `Nenhum aluno do ${turma.nome} com esse nome.` : 'Nenhum aluno nesta situação.'}</LinhaVazia>}
        </tbody>
        <tfoot className={tabelaT.cabeca}>
          <tr className="border-t border-linha">
            <td className={cn(tabelaT.td, 'sticky left-0 z-10 h-12 bg-[#FAFAFA] py-0 font-teachy text-[14px] font-bold leading-6')}>Presentes na aula</td>
            {aulas.map((aula, i) => (
              <td key={aula.data} className={cn(celula, 'h-12 text-[12px] text-apoio', abreSemana[i] && 'border-l border-linha', aula.hoje && 'bg-realce font-semibold text-tinta')}>
                {alunos.length - alunos.filter((a) => faltou(a, aula.data)).length}
              </td>
            ))}
            <td className={cn(celula, 'h-12 border-l border-linha font-teachy text-[14px] font-bold text-tinta')}>{totalFaltas}</td>
            <td className={cn(celula, 'h-12 font-teachy text-[14px] font-bold text-tinta')}>{presencaMedia}%</td>
          </tr>
        </tfoot>
      </CaixaTabela>
      <FraseDoPe>
        Presença média do {turma.nome}: {presencaMedia}% em {aulas.length} aulas. A escola exige 75% de presença{noLimite > 0 ? `: ${noLimite} ${noLimite === 1 ? 'aluno está' : 'alunos estão'} no limite, com 4 faltas ou mais.` : '.'}
      </FraseDoPe>
    </section>
  )
}
