import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Download, Pencil } from 'lucide-react'
import { BotaoT, CabecalhoAba, Periodo, VazioT, botaoT, tabelaT } from '@/components/turmma/teachy'
import { alunosDa, type Aluno } from '@/dados/alunos'
import { turmaDe } from '@/dados/escola'
import { atividadesDa, comNotaDa, comVirgula } from '@/dados/turma-atividades'
import { cn } from '@/lib/utils'
import { limpa } from '../_busca'
import { AlunoT, BuscaAluno, CaixaTabela, FraseDoPe, LinhaVazia, SubAbas } from './Atividades'

/* ABA NOTAS, na pele da Teachy: lá ela se chama "Boletim". O molde é o das outras abas (cabeçalho com título, apoio,
   período e os botões de 34 px; subabas que filtram; tabela de canto 8). Alunos nas linhas, em ordem de chamada; as
   atividades com nota nas colunas (nome curto e data no cabeçalho); a MÉDIA na última coluna, num selo cinza; a média
   da turma na última linha. Nota abaixo de 6 em laranja-escuro e peso 600, sem pintar a célula; "—" para quem não fez.
   "Editar" troca as notas por campos e o botão por "Salvar notas"; a coluna da prova que o Assistente corrigiu e a
   professora ainda não aprovou NÃO abre para edição: a nota só existe depois da aprovação dela.
   O 1ºC ainda não tem correção aprovada: fica o estado vazio da Teachy, com a ação de criar a diagnóstica. */

type FiltroId = 'todos' | 'abaixo' | 'faltou'

const chave = (a: Aluno, i: number) => `${a.id}:${i}`
const media = (valores: (number | null)[]) => { const v = valores.filter((x): x is number => x !== null); return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10 : null }
/** "7,5" → 7.5, entre 0 e 10, com uma casa; campo vazio = não fez */
const lerNota = (texto: string) => { const n = Number(texto.trim().replace(',', '.')); return texto.trim() === '' || Number.isNaN(n) ? null : Math.round(Math.max(0, Math.min(10, n)) * 10) / 10 }

/** O desenho do estado vazio: a folha do boletim, chapada e sem contorno, na paleta dos ícones desta rodada. */
function ArteBoletim() {
  return (
    <svg aria-hidden viewBox="0 0 120 92" className="h-[92px] w-[120px]">
      <path d="M16 10l2.4 6.1 6.1 2.4-6.1 2.4L16 27l-2.4-6.1-6.1-2.4 6.1-2.4z" fill="#F5C542" />
      <rect x="26" y="6" width="68" height="80" rx="9" fill="#E8732E" />
      <path d="M26 26h68v51a9 9 0 0 1-9 9H35a9 9 0 0 1-9-9z" fill="#E9E6E2" />
      <rect x="36" y="13" width="26" height="5" rx="2.5" fill="#F6A873" />
      {[36, 52, 68].map((y, i) => (
        <g key={y}>
          <circle cx="40" cy={y + 4} r="4" fill="#C9C4BE" />
          <rect x="48" y={y + 2} width={i === 1 ? 16 : 22} height="4" rx="2" fill="#C9C4BE" />
          <rect x="74" y={y} width="12" height="8" rx="3" fill={i === 1 ? '#F6A873' : '#FFFFFF'} />
        </g>
      ))}
      <circle cx="96" cy="74" r="13" fill="#2BA39A" />
      <path d="M90 74.5l4.2 4.2 8-8.4" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function NotasTurma({ turmaId }: { turmaId: string }) {
  const [periodo, setPeriodo] = useState('2026')
  const [filtro, setFiltro] = useState<FiltroId>('todos')
  const [busca, setBusca] = useState('')
  // o que a professora já mudou e salvou, e o que está digitando agora (só as células em que mexeu)
  const [ajustes, setAjustes] = useState<Record<string, number | null>>({})
  const [rascunho, setRascunho] = useState<Record<string, string> | null>(null)
  const editando = rascunho !== null
  const alunos = alunosDa(turmaId)
  const comNota = comNotaDa(turmaId)
  const turma = turmaDe(turmaId)

  /* ── a turma que ainda não tem correção aprovada ── */
  if (comNota.length === 0) {
    const esperam = atividadesDa(turmaId).filter((a) => a.estado === 'corrigir').length
    return (
      <section className="font-teachy-corpo text-tinta">
        <CabecalhoAba titulo="Boletim" apoio="Gerencie as notas da sua turma">
          <Periodo valor={periodo} aoMudar={setPeriodo} />
          <BotaoT variante="contorno" tamanho="m" disabled><Download aria-hidden /> Exportar</BotaoT>
          <BotaoT tamanho="m" disabled><Pencil aria-hidden /> Editar</BotaoT>
        </CabecalhoAba>
        <VazioT arte={<ArteBoletim />} titulo="Crie seu boletim de notas" texto="Ainda não há atividade corrigida nesta turma."
          acao={
            <div className="flex flex-col items-center gap-3">
              <Link to="/professor/ferramentas/diagnostica" className={botaoT('primario', 'g')}>Criar avaliação diagnóstica</Link>
              {esperam > 0 && (
                <Link to={`/professor/turmas/${turmaId}?aba=atividades`} className="font-teachy text-[14px] font-bold leading-5 text-caramelo-texto underline-offset-4 hover:underline">
                  {esperam} {esperam === 1 ? 'atividade entregue espera' : 'atividades entregues esperam'} correção
                </Link>
              )}
            </div>
          } />
        <FraseDoPe>Nota é a média das atividades que você corrigiu e aprovou.</FraseDoPe>
      </section>
    )
  }

  /* ── o boletim ── */
  const valorDe = (a: Aluno, i: number) => (chave(a, i) in ajustes ? ajustes[chave(a, i)] : a.notas[i].valor)
  const mediaDe = (a: Aluno) => media(comNota.map((c) => valorDe(a, c.indiceNota!)))

  const q = limpa(busca.trim())
  const no: Record<FiltroId, Aluno[]> = {
    todos: alunos,
    abaixo: alunos.filter((a) => { const m = mediaDe(a); return m !== null && m < 6 }),
    faltou: alunos.filter((a) => comNota.some((c) => valorDe(a, c.indiceNota!) === null)),
  }
  const visiveis = no[filtro].filter((a) => !q || limpa(a.nome).includes(q))
  const mediaDaTurma = media(alunos.map(mediaDe))

  const salvar = () => {
    const novos = Object.fromEntries(Object.entries(rascunho ?? {}).map(([k, texto]) => [k, lerNota(texto)]))
    setAjustes((antes) => ({ ...antes, ...novos }))
    setRascunho(null)
  }

  return (
    <section className="font-teachy-corpo text-tinta">
      <CabecalhoAba titulo="Boletim" apoio="Gerencie as notas da sua turma">
        <Periodo valor={periodo} aoMudar={setPeriodo} />
        {editando ? (
          <>
            <BotaoT variante="texto" tamanho="m" onClick={() => setRascunho(null)}>Cancelar</BotaoT>
            <BotaoT tamanho="m" onClick={salvar}><Check aria-hidden /> Salvar notas</BotaoT>
          </>
        ) : (
          <>
            <BotaoT variante="contorno" tamanho="m"><Download aria-hidden /> Exportar</BotaoT>
            <BotaoT tamanho="m" onClick={() => setRascunho({})}><Pencil aria-hidden /> Editar</BotaoT>
          </>
        )}
      </CabecalhoAba>

      <SubAbas rotulo="Filtrar os alunos" valor={filtro} aoMudar={setFiltro} opcoes={[
        { id: 'todos', nome: 'Todos', n: no.todos.length }, { id: 'abaixo', nome: 'Abaixo de 6', n: no.abaixo.length },
        { id: 'faltou', nome: 'Deixou de fazer alguma', n: no.faltou.length },
      ]}>
        <BuscaAluno valor={busca} aoMudar={setBusca} />
      </SubAbas>

      <CaixaTabela rotulo={`Boletim do ${turma.nome}`} minimo="min-w-[760px]">
        {/* o aluno leva 26% (150 px no celular); as atividades e a média dividem o resto em partes iguais */}
        <colgroup><col className="w-[150px] sm:w-[26%]" />{comNota.map((c) => <col key={c.id} />)}<col /></colgroup>
        <thead className={tabelaT.cabeca}>
          <tr>
            <th className={cn(tabelaT.th, 'sticky left-0 z-10 bg-[#FAFAFA]')}>Aluno</th>
            {comNota.map((c) => (
              <th key={c.id} title={c.nome} className={cn(tabelaT.th, 'px-2 py-1.5 text-center')}>
                <span className="block truncate leading-5">{c.curto}</span>
                {c.estado === 'esperando'
                  ? <span className="flex items-center justify-center gap-1 font-teachy-corpo text-[11px] font-medium leading-4 text-pendente"><i aria-hidden className="block size-1.5 shrink-0 rounded-full bg-caramelo" />{c.data} · esperando você</span>
                  : <span className="block font-teachy-corpo text-[11px] font-normal leading-4 text-inativo">{c.data}</span>}
              </th>
            ))}
            <th className={cn(tabelaT.th, 'py-1.5 text-center')}>
              <span className="block leading-5">Média</span>
              <span className="block font-teachy-corpo text-[11px] font-normal leading-4 text-inativo">3º bimestre</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visiveis.map((a) => {
            const m = mediaDe(a)
            return (
              <tr key={a.id} className={cn(tabelaT.tr, 'group')}>
                <td className={cn(tabelaT.td, 'sticky left-0 z-10 h-12 bg-superficie py-0 transition-colors duration-150 group-hover:bg-[#FAFAFA] max-sm:shadow-[inset_-1px_0_0_var(--color-linha)]')}><AlunoT aluno={a} /></td>
                {comNota.map((c) => {
                  const i = c.indiceNota!
                  const v = valorDe(a, i)
                  const k = chave(a, i)
                  if (editando && c.estado !== 'esperando') return (
                    <td key={c.id} className={cn(tabelaT.td, 'py-0 text-center')}>
                      <input inputMode="decimal" aria-label={`${c.curto}: nota de ${a.nome}`} placeholder="—"
                        value={rascunho?.[k] ?? (v === null ? '' : comVirgula(v))} onChange={(e) => setRascunho((r) => ({ ...r, [k]: e.target.value }))}
                        className="h-8 w-14 rounded-[4px] border border-borda-campo bg-superficie text-center text-[14px] leading-5 text-tinta outline-none transition-colors duration-150 placeholder:text-inativo focus-visible:border-tinta" />
                    </td>
                  )
                  return (
                    <td key={c.id} className={cn(tabelaT.td, 'py-0 text-center')} title={editando ? 'Aprove a correção para editar esta nota' : v === null ? `${a.primeiro} não fez: ${c.nome}` : undefined}>
                      {v === null ? <span className="text-inativo">—</span> : <span className={cn(v < 6 && 'font-semibold text-pendente', editando && 'opacity-50')}>{comVirgula(v)}</span>}
                    </td>
                  )
                })}
                <td className={cn(tabelaT.td, 'py-0 text-center')}>
                  {m === null ? <span className="text-inativo">—</span>
                    : <span className={cn('inline-flex h-7 min-w-[46px] items-center justify-center rounded-[4px] bg-realce-suave px-2 font-teachy text-[14px] font-bold leading-5', m < 6 ? 'text-pendente' : 'text-tinta')}>{comVirgula(m)}</span>}
                </td>
              </tr>
            )
          })}
          {visiveis.length === 0 && <LinhaVazia colunas={comNota.length + 2}>{q ? `Nenhum aluno do ${turma.nome} com esse nome.` : 'Nenhum aluno nesta situação.'}</LinhaVazia>}
        </tbody>
        <tfoot className={tabelaT.cabeca}>
          <tr className="border-t border-linha">
            <td className={cn(tabelaT.td, 'sticky left-0 z-10 h-14 bg-[#FAFAFA] py-0 font-teachy text-[14px] font-bold leading-6')}>Média da turma</td>
            {comNota.map((c) => {
              const i = c.indiceNota!
              const valores = alunos.map((a) => valorDe(a, i))
              const mc = media(valores)
              const abaixo = valores.filter((v) => v !== null && v < 6).length
              return (
                <td key={c.id} className={cn(tabelaT.td, 'py-0 text-center')}>
                  <span className={cn('block font-teachy text-[14px] font-bold leading-5', mc !== null && mc < 6 ? 'text-pendente' : 'text-tinta')}>{mc === null ? '—' : comVirgula(mc)}</span>
                  <span className="block text-[11px] leading-4 text-inativo">{abaixo} abaixo de 6</span>
                </td>
              )
            })}
            <td className={cn(tabelaT.td, 'py-0 text-center')}>
              <span className="inline-flex h-7 min-w-[46px] items-center justify-center rounded-[4px] bg-tinta px-2 font-teachy text-[14px] font-bold leading-5 text-white">{mediaDaTurma === null ? '—' : comVirgula(mediaDaTurma)}</span>
            </td>
          </tr>
        </tfoot>
      </CaixaTabela>
      <FraseDoPe>Nota é a média das atividades que você corrigiu e aprovou.</FraseDoPe>
    </section>
  )
}
