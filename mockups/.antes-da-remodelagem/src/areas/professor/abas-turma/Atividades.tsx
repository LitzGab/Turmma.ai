import { useRef, useState, type ReactNode, type Ref } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Check, CircleDashed, ClipboardList, Clock3, FilePlus2, ListChecks, PenLine, PencilLine, Search, Timer, type LucideIcon } from 'lucide-react'
import { ChipFonte, LinhaAprovacao } from '@/components/turmma/ia'
import { Trilho } from '@/components/turmma/painel'
import { AvatarT, CabecalhoAba, CartaoT, ChipT, Periodo, botaoT, tabelaT, tipo as tipoT } from '@/components/turmma/teachy'
import { alunosDa, type Aluno } from '@/dados/alunos'
import { turmaDe } from '@/dados/escola'
import { atividadesDa, comVirgula, materialDa, type AtividadeTurma, type EstadoAtividade, type TipoAtividade } from '@/dados/turma-atividades'
import { cn } from '@/lib/utils'

/* ABA ATIVIDADES da turma aberta, e as PEÇAS QUE AS CINCO ABAS DIVIDEM (Atividades, Notas, Uso de IA, Frequência e
   Ranking), na PELE DA TEACHY (oitava rodada, 20/09/2026: "eu quero um ctrl c e ctrl v da Teachy").
   O molde é o dela, igual em toda aba: `CabecalhoAba` (título Quicksand 16/700 + uma linha de apoio cinza; à direita o
   seletor de período e o botão primário de 34 px), as subabas sublinhadas que filtram, e embaixo a tabela de canto 8
   com cabeçalho de 49 px em cinza muito claro. A aba é um BLOCO DE ALTURA NATURAL: quem rola é a página da turma.
   Tabela larga rola de lado dentro da própria caixa, no celular. As cores são as nossas: bordas e fundos neutros, e o
   laranja só no botão primário, no sublinhado da subaba, em link e no ícone pequeno de rótulo. */

/* ── Peças comuns ────────────────────────────────────────────────────────────────────────────────────────── */

export type OpcaoFiltro<T extends string> = { id: T; nome: string; n?: number }

/** As subabas sublinhadas: o filtro da aba. À direita, na mesma linha, cabe a busca de aluno. */
export function SubAbas<T extends string>({ rotulo, valor, aoMudar, opcoes, children }: {
  rotulo: string; valor: T; aoMudar: (v: T) => void; opcoes: OpcaoFiltro<T>[]; children?: ReactNode
}) {
  return (
    <div className="mb-6 flex min-h-10 flex-wrap items-end justify-between gap-x-6 border-b border-linha">
      <div role="group" aria-label={rotulo} className="-mb-px flex min-w-0 max-w-full gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {opcoes.map((o) => {
          const ativo = o.id === valor
          return (
            <button key={o.id} type="button" aria-pressed={ativo} onClick={() => aoMudar(o.id)}
              className={cn('inline-flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-1 text-[14px] leading-6 transition-colors duration-150',
                ativo ? 'border-caramelo font-teachy font-bold text-tinta' : 'border-transparent text-apoio hover:text-tinta')}>
              {o.nome}
              {o.n !== undefined && <span className={cn('rounded-[4px] px-1.5 font-teachy-corpo text-[11px] font-normal leading-4', ativo ? 'bg-realce text-tinta' : 'bg-realce-suave text-sutil')}>{o.n}</span>}
            </button>
          )
        })}
      </div>
      {children && <div className="flex h-10 items-center gap-2 max-sm:w-full">{children}</div>}
    </div>
  )
}

/** A busca de aluno, no desenho da busca da Teachy: fundo cinza claro, canto 8 e a lupa à direita. */
export function BuscaAluno({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  return (
    <label className="relative block w-full sm:w-56">
      <input value={valor} onChange={(e) => aoMudar(e.target.value)} placeholder="Buscar aluno" aria-label="Buscar aluno"
        className="h-8 w-full rounded-[8px] border border-linha bg-realce-suave pl-3 pr-8 text-[13px] leading-5 text-tinta outline-none transition-colors duration-150 placeholder:text-inativo focus-visible:border-borda-campo focus-visible:bg-superficie" />
      <Search aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-inativo" strokeWidth={1.75} />
    </label>
  )
}

/** A caixa da tabela: canto 8 e fio de 1 px. Se a tabela for mais larga que a caixa (celular), rola de lado aqui dentro. */
export function CaixaTabela({ rotulo, minimo, fixa = true, className, rolagem, children }: {
  rotulo: string; minimo?: string; fixa?: boolean; className?: string; /** a área que rola de lado, para quem precisa levá-la até uma coluna */ rolagem?: Ref<HTMLDivElement>; children: ReactNode
}) {
  return (
    <div className={cn(tabelaT.caixa, className)}>
      <div ref={rolagem} className="overflow-x-auto overscroll-x-contain">
        <table aria-label={rotulo} className={cn(tabelaT.tabela, fixa && 'table-fixed', minimo)}>{children}</table>
      </div>
    </div>
  )
}

/** Aluno = número de chamada + círculo com a inicial + nome. Não tem foto no sistema. */
export function AlunoT({ aluno, className }: { aluno: Aluno; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span className="w-[18px] shrink-0 text-right text-[12px] leading-4 text-inativo">{aluno.numero}</span>
      <AvatarT nome={aluno.nome} className="max-sm:hidden" />
      <span className="truncate text-[14px] leading-6 text-tinta">{aluno.nome}</span>
    </span>
  )
}

/** Quando o filtro ou a busca não acham nada: uma linha, dentro da tabela. */
export function LinhaVazia({ colunas, children }: { colunas: number; children: ReactNode }) {
  return <tr className="border-t border-linha"><td colSpan={colunas} className="px-4 py-10 text-center text-[14px] leading-6 text-inativo">{children}</td></tr>
}

/** A frase pequena embaixo da tabela: uma regra do produto, dita uma vez. */
export function FraseDoPe({ children }: { children: ReactNode }) {
  return <p className={cn(tipoT.apoio, 'mt-3')}>{children}</p>
}

/** O cabeçalho de um cartão da Teachy: ícone de 16 px em laranja + rótulo Inter 14/500 e, embaixo, uma linha miúda cinza. */
export function RotuloCartao({ icone: Icone, titulo, apoio, lado }: { icone: LucideIcon; titulo: string; apoio?: string; lado?: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-[14px] font-medium leading-5 text-tinta"><Icone aria-hidden className="size-4 shrink-0 text-caramelo" strokeWidth={2} /><span className="truncate">{titulo}</span></p>
        {lado}
      </div>
      {apoio && <p className="mt-0.5 text-[11px] leading-4 text-inativo">{apoio}</p>}
    </div>
  )
}

/* ── A aba ───────────────────────────────────────────────────────────────────────────────────────────────── */

const TIPO: Record<TipoAtividade, { nome: string; icone: LucideIcon }> = {
  prova: { nome: 'Prova', icone: ClipboardList },
  lista: { nome: 'Lista', icone: ListChecks },
  atividade: { nome: 'Atividade', icone: PenLine },
}

function IconeTipo({ tipo, className }: { tipo: TipoAtividade; className?: string }) {
  const Icone = TIPO[tipo].icone
  return (
    <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-[8px] bg-realce-suave text-tinta', className)}>
      <Icone className="size-4" strokeWidth={1.9} />
    </span>
  )
}

const ESTADO: Record<EstadoAtividade, { icone: LucideIcon; chip: string; cor: string }> = {
  esperando: { icone: Clock3, chip: 'bg-pendente-cx font-medium text-pendente', cor: 'text-pendente' },
  aprovada: { icone: Check, chip: '', cor: 'text-ok' },
  corrigir: { icone: CircleDashed, chip: '', cor: 'text-tinta' },
  aberta: { icone: Timer, chip: '', cor: 'text-tinta' },
  agendada: { icone: CalendarClock, chip: '', cor: 'text-sutil' },
  rascunho: { icone: PencilLine, chip: 'text-inativo', cor: 'text-inativo' },
}

/** O estado é o chip da Teachy (canto 4, cinza claro). Só o que espera a professora vem em laranja. */
function SeloEstado({ a, naEscolhida = false }: { a: AtividadeTurma; /** a linha escolhida já é cinza: o chip vai para o branco */ naEscolhida?: boolean }) {
  const e = ESTADO[a.estado]
  const Icone = e.icone
  return <ChipT className={cn('h-6 whitespace-nowrap', naEscolhida && a.estado !== 'esperando' && 'bg-superficie', e.chip)}><Icone aria-hidden className={e.cor} strokeWidth={2.2} />{a.selo}</ChipT>
}

type FiltroId = 'todas' | 'abertas' | 'corrigir' | 'corrigidas'
const NO_FILTRO: Record<FiltroId, EstadoAtividade[]> = {
  todas: ['esperando', 'aprovada', 'corrigir', 'aberta', 'agendada', 'rascunho'],
  abertas: ['aberta', 'agendada'], corrigir: ['esperando', 'corrigir'], corrigidas: ['aprovada'],
}
const VAZIO: Record<FiltroId, string> = {
  todas: 'Nenhuma atividade nesta turma ainda.', abertas: 'Nenhuma atividade aberta nesta turma.',
  corrigir: 'Nada esperando correção nesta turma.', corrigidas: 'Ainda não há atividade corrigida nesta turma.',
}

export function AtividadesTurma({ turmaId }: { turmaId: string }) {
  const todas = atividadesDa(turmaId)
  const [periodo, setPeriodo] = useState('2026')
  const [filtro, setFiltro] = useState<FiltroId>('todas')
  const [escolhida, setEscolhida] = useState<string | null>(null)
  const detalhe = useRef<HTMLDivElement>(null)
  const visiveis = todas.filter((a) => NO_FILTRO[filtro].includes(a.estado))
  // abre na que espera a professora; sem nenhuma, na mais recente que já tem número
  const atual = visiveis.find((a) => a.id === escolhida) ?? visiveis.find((a) => a.estado === 'esperando') ?? visiveis.find((a) => a.entregas) ?? visiveis[0]
  const conta = (f: FiltroId) => todas.filter((a) => NO_FILTRO[f].includes(a.estado)).length
  // o detalhe mora embaixo da tabela: quem clica numa linha é levado até ele
  const abrir = (id: string) => { setEscolhida(id); requestAnimationFrame(() => detalhe.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })) }

  return (
    <section className="font-teachy-corpo text-tinta">
      <CabecalhoAba titulo="Atividades" apoio="Acompanhe o que você enviou para a turma e a correção de cada atividade">
        <Periodo valor={periodo} aoMudar={setPeriodo} />
        <Link to="/professor/ferramentas/prova" className={botaoT('primario', 'm')}><FilePlus2 aria-hidden /> Criar avaliação</Link>
      </CabecalhoAba>

      <SubAbas rotulo="Filtrar as atividades" valor={filtro} aoMudar={setFiltro} opcoes={[
        { id: 'todas', nome: 'Todas', n: conta('todas') }, { id: 'abertas', nome: 'Abertas', n: conta('abertas') },
        { id: 'corrigir', nome: 'Para corrigir', n: conta('corrigir') }, { id: 'corrigidas', nome: 'Corrigidas', n: conta('corrigidas') },
      ]} />

      <CaixaTabela rotulo={`Atividades do ${turmaDe(turmaId).nome}`} minimo="min-w-[980px]">
        <colgroup><col /><col className="w-[92px]" /><col className="w-[160px]" /><col className="w-[116px]" /><col className="w-[188px]" /><col className="w-[170px]" /></colgroup>
        <thead className={tabelaT.cabeca}>
          <tr>
            <th className={tabelaT.th}>Atividade</th><th className={tabelaT.th}>Data</th><th className={tabelaT.th}>Entregas</th>
            <th className={tabelaT.th}>Acerto médio</th><th className={tabelaT.th}>Estado</th><th className={cn(tabelaT.th, 'text-right')}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {visiveis.map((a) => {
            const aberta = a.id === atual?.id
            const pct = a.entregas ? Math.round((a.entregas.feitas / a.entregas.total) * 100) : 0
            return (
              <tr key={a.id} aria-selected={aberta} onClick={() => abrir(a.id)} className={cn(tabelaT.tr, 'cursor-pointer', aberta && 'bg-realce-suave hover:bg-realce-suave')}>
                <td className={cn(tabelaT.td, 'h-[60px] py-0')}>
                  <span className="flex min-w-0 items-center gap-3">
                    <IconeTipo tipo={a.tipo} className={cn(aberta && 'bg-superficie')} />
                    <span className="min-w-0">
                      <button type="button" aria-expanded={aberta} onClick={(e) => { e.stopPropagation(); abrir(a.id) }} className="block max-w-full truncate rounded-[4px] text-left text-[14px] font-medium leading-5 text-tinta">{a.nome}</button>
                      <span className="block truncate text-[12px] leading-4 text-sutil">{TIPO[a.tipo].nome} · {a.detalhe}</span>
                    </span>
                  </span>
                </td>
                <td className={cn(tabelaT.td, 'py-0')}>
                  <span className="block text-[14px] leading-5 text-tinta">{a.data}</span>
                  <span className="block text-[12px] leading-4 text-sutil">{a.rotuloData.toLowerCase()}</span>
                </td>
                <td className={cn(tabelaT.td, 'py-0 text-sutil')}>
                  {a.entregas
                    ? <span className="flex items-center gap-3"><span className="w-[60px] shrink-0 whitespace-nowrap"><b className="font-semibold text-tinta">{a.entregas.feitas}</b> de {a.entregas.total}</span><Trilho valor={pct} className="h-1.5 w-16" /></span>
                    : <span className="text-inativo">—</span>}
                </td>
                <td className={cn(tabelaT.td, 'py-0', a.acerto === null ? 'text-inativo' : a.acerto < 50 ? 'font-semibold text-pendente' : 'font-semibold text-tinta')}>{a.acerto === null ? '—' : `${a.acerto}%`}</td>
                <td className={cn(tabelaT.td, 'py-0')}><SeloEstado a={a} naEscolhida={aberta} /></td>
                <td className={cn(tabelaT.td, 'py-0 text-right')}>
                  <Link to={a.acao.para} onClick={(e) => e.stopPropagation()} className={botaoT(a.estado === 'esperando' ? 'primario' : 'contorno', 'p')}>{a.acao.rotulo}</Link>
                </td>
              </tr>
            )
          })}
          {visiveis.length === 0 && <LinhaVazia colunas={6}>{VAZIO[filtro]}</LinhaVazia>}
        </tbody>
      </CaixaTabela>

      {atual && <div ref={detalhe} className="scroll-mb-6 scroll-mt-4"><Detalhe key={atual.id} a={atual} turmaId={turmaId} /></div>}
    </section>
  )
}

/* ── O detalhe da atividade escolhida: quem fez, como foi e o que falta, num cartão logo abaixo da tabela ─── */

const diasAte = (data: string) => { const n = Number(data.slice(0, 2)) - 21; return n <= 0 ? 'hoje' : n === 1 ? 'amanhã' : `em ${n} dias` }

function Par({ rotulo, valor, sufixo }: { rotulo: string; valor: ReactNode; sufixo?: ReactNode }) {
  return (
    <div>
      <p className="text-[12px] leading-4 text-sutil">{rotulo}</p>
      <p className="mt-0.5 text-[24px] font-semibold leading-8 tracking-[-0.01em] text-tinta">{valor}{sufixo && <span className="ml-1.5 text-[12px] font-normal leading-4 tracking-normal text-sutil">{sufixo}</span>}</p>
    </div>
  )
}

function ListaAlunos({ titulo, itens, colunas = false, suave = false }: { titulo: string; itens: { aluno: Aluno; valor?: ReactNode }[]; colunas?: boolean; suave?: boolean }) {
  return (
    <div>
      <p className={cn(tipoT.rotulo, 'mb-1 flex items-baseline gap-1.5')}>{titulo}<span className="font-teachy-corpo text-[12px] font-normal text-inativo">{itens.length}</span></p>
      {itens.length === 0
        ? <p className="py-1.5 text-[13px] text-inativo">Ninguém.</p>
        : (
          <ul className={cn('grid gap-x-4 sm:gap-x-6', colunas && 'grid-cols-2 xl:grid-cols-3')}>
            {itens.map(({ aluno, valor }) => (
              <li key={aluno.id} className="flex h-8 min-w-0 items-center gap-2">
                <AvatarT nome={aluno.nome} className={cn('size-5 text-[10px]', suave && 'bg-inativo')} />
                <span className={cn('min-w-0 flex-1 truncate text-[13px] leading-5', suave ? 'text-sutil' : 'text-tinta')}>{aluno.nome}</span>
                {valor}
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}

/** O número que ainda não existe: um traço leve, e não um traço de 24 px em negrito. */
const semNumero = <span className="font-normal text-inativo">—</span>

const coluna = 'min-w-0 border-linha p-4 max-lg:border-t lg:border-l first:lg:border-l-0 first:max-lg:border-t-0'

function Detalhe({ a, turmaId }: { a: AtividadeTurma; turmaId: string }) {
  const alunos = alunosDa(turmaId)
  const material = materialDa(turmaId)
  const i = a.indiceNota
  const notas = i === null ? [] : alunos.map((aluno) => ({ aluno, v: aluno.notas[i].valor })).filter((x): x is { aluno: Aluno; v: number } => x.v !== null)
  const faixas: [string, number, 'caramelo' | 'tinta'][] = [
    ['Abaixo de 6', notas.filter((x) => x.v < 6).length, 'caramelo'], ['De 6 a 8', notas.filter((x) => x.v >= 6 && x.v < 8).length, 'tinta'], ['8 ou mais', notas.filter((x) => x.v >= 8).length, 'tinta'],
  ]
  const abaixo = notas.filter((x) => x.v < 6).sort((x, y) => x.v - y.v)
  // sem nota lançada, a coluna larga mostra os dois lados da chamada: quem falta e, mais claro, quem já fez
  const falta = new Set(a.quem.map((x) => x.id))
  const jaFez = alunos.filter((x) => !falta.has(x.id))
  const rotuloJaFez = a.estado === 'aberta' ? 'Já entregou' : a.estado === 'agendada' ? `Fez a prova em ${alunos[0].notas[3].data}` : a.tipo === 'prova' ? 'Fez a prova' : 'Entregou'

  return (
    <CartaoT className="mt-5 p-0">
      <section aria-label={a.nome} className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.62fr)_minmax(0,1fr)_minmax(0,1.08fr)]">
        <div className={cn(coluna, 'flex flex-col')}>
          <div className="flex items-start gap-3">
            <IconeTipo tipo={a.tipo} className="size-10 [&>svg]:size-5" />
            <div className="min-w-0">
              <h3 className={tipoT.aba}>{a.nome}</h3>
              <p className="text-[12px] leading-4 text-sutil">{TIPO[a.tipo].nome} · {a.detalhe} · {a.rotuloData.toLowerCase()} {a.rotuloData === 'Agendada' ? 'para' : a.rotuloData === 'Prazo' ? 'até' : 'em'} {a.data}</p>
            </div>
          </div>
          {a.habilidade && <p className="mt-3 text-[13px] leading-[22px] text-apoio">{a.habilidade.nome} <ChipFonte pagina={a.habilidade.pagina} material={material.titulo} capitulo={material.capitulo} /></p>}
          <p className={cn('mt-2 text-[13px] leading-5', a.estado === 'esperando' ? 'rounded-[8px] bg-pendente-cx px-3 py-2 text-pendente' : 'text-apoio')}>{a.nota}</p>
          {a.aprovadaEm && <LinhaAprovacao verbo="Aprovada por" quando={a.aprovadaEm} className="mt-2.5 self-start !rounded-[4px] text-[12px]" />}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* a ação laranja já está na linha da tabela, logo acima: aqui o botão é o de contorno, para não haver dois laranjas iguais na tela */}
            <Link to={a.acao.para} className={botaoT('contorno', 'm')}>{a.acao.rotulo}</Link>
            {a.estado === 'esperando' && <Link to="/professor/biblioteca/prova-estequiometria" className={botaoT('texto', 'm')}>Abrir a prova</Link>}
            {a.estado === 'agendada' && <Link to="/professor/time/assistente" className={botaoT('texto', 'm')}>Ver a versão adaptada</Link>}
          </div>
        </div>

        <div className={cn(coluna, 'grid content-start gap-4 max-lg:grid-cols-2 sm:max-lg:grid-cols-3')}>
          {a.entregas && <Par rotulo="Entregas" valor={a.entregas.feitas} sufixo={`de ${a.entregas.total}`} />}
          {i !== null && <><Par rotulo="Acerto médio" valor={`${a.acerto}%`} /><Par rotulo="Nota média" valor={comVirgula(a.media!)} /></>}
          {a.estado === 'corrigir' && <><Par rotulo="Acerto médio" valor={semNumero} /><Par rotulo="Nota média" valor={semNumero} /></>}
          {a.estado === 'aberta' && <Par rotulo="Prazo" valor={a.data} sufixo={diasAte(a.data)} />}
          {a.estado === 'agendada' && <><Par rotulo="Agendada para" valor={a.data} sufixo={diasAte(a.data)} /><Par rotulo="Horário" valor="8h20" sufixo="quinta-feira" /></>}
          {a.estado === 'rascunho' && <><Par rotulo="Editado em" valor={a.data} /><Par rotulo="Prazo" valor={semNumero} sufixo="a definir" /></>}
        </div>

        {i !== null ? (
          <>
            <div className={coluna}>
              <p className={cn(tipoT.rotulo, 'mb-2')}>Como a turma foi</p>
              <ul className="grid gap-3">
                {faixas.map(([nome, n, tom]) => (
                  <li key={nome} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                    <span className="text-[13px] leading-5 text-tinta">{nome}</span>
                    <span className="text-[13px] leading-5 text-sutil"><b className={cn('font-semibold', tom === 'caramelo' && n > 0 ? 'text-pendente' : 'text-tinta')}>{n}</b> {n === 1 ? 'aluno' : 'alunos'}</span>
                    <Trilho valor={notas.length ? (n / notas.length) * 100 : 0} tom={tom} className="col-span-2 h-1.5" />
                  </li>
                ))}
              </ul>
            </div>
            <div className={cn(coluna, 'grid content-start gap-3')}>
              {a.quem.length > 0 && <ListaAlunos titulo={a.rotuloQuem} itens={a.quem.map((aluno) => ({ aluno, valor: <span className="text-[13px] text-inativo">—</span> }))} />}
              <ListaAlunos titulo="Abaixo de 6" itens={abaixo.map(({ aluno, v }) => ({ aluno, valor: <b className="text-[13px] font-semibold text-pendente">{comVirgula(v)}</b> }))} />
            </div>
          </>
        ) : (
          <div className={cn(coluna, 'grid content-start gap-3 lg:col-span-2')}>
            {a.estado === 'rascunho'
              ? <ListaAlunos colunas suave titulo="Vão receber quando você atribuir" itens={alunos.map((aluno) => ({ aluno }))} />
              : <><ListaAlunos colunas titulo={a.rotuloQuem} itens={a.quem.map((aluno) => ({ aluno }))} /><ListaAlunos colunas suave titulo={rotuloJaFez} itens={jaFez.map((aluno) => ({ aluno }))} /></>}
          </div>
        )}
      </section>
    </CartaoT>
  )
}
