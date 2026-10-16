import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CalendarDays, Check, ChevronRight, FileSpreadsheet, Link2, ListChecks, Pencil, Plus, RefreshCw, Trash2, Upload, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger,
} from '@/components/ui/stepper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PintaTurma } from '@/components/marca/Pinta'
import { Estado } from '@/components/turmma/ia'
import { Cartao, NotaMockup, NumeroPainel, Tela } from '@/components/turmma/tela'
import {
  ALOCACOES, ANOS_LETIVOS, DISCIPLINAS, NOME_DA_CONTESTACAO, PROFESSORES, ROTEIRO, SERIES, SITUACAO_DO_ANO,
  TEXTO_DO_VINCULO, TOTAL_DE_PROFESSORES,
  type Alocacao, type EstadoDoVinculo, type SituacaoDoAno, type TurmaDaEscola,
} from '@/dados/estrutura'
import { cn } from '@/lib/utils'
import { Aviso, CANTO_DIALOGO } from './_a-pecas'
import {
  Anuncio, areaRolavel, Campo, campo, criarTurma, Escolha, HOJE, MensagemCampo, Pilulas, TabelaFixa, textoDialogo,
  tituloDialogo, todasAsTurmas, turmaContada, type ColunaFixa,
} from './_estrutura-pecas'

/* Estrutura: a montagem da escola pela coordenação, como o produto real faz (A1 · apresentacao-escola, 04/10/2026).
   No alto, o roteiro em sete passos com o que já está feito e os números que importam; embaixo, as abas de trabalho.
   Os convites de professor foram para a página Professores. A importação em passos (originui/stepper, 21st.dev · 778)
   continua na barra. A página cabe em 1440 × 780: o que é longo rola por dentro da área da aba. */

const estiloAba = 'h-8 rounded-linha px-3 text-[13.5px] font-medium text-apoio data-[state=active]:bg-superficie data-[state=active]:font-semibold data-[state=active]:text-tinta data-[state=active]:shadow-none'

type Aba = 'turmas' | 'ano' | 'alocacao' | 'grade' | 'contas'
const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'turmas', rotulo: 'Turmas' },
  { id: 'ano', rotulo: 'Ano letivo, séries e disciplinas' },
  { id: 'alocacao', rotulo: 'Alocação' },
  { id: 'grade', rotulo: 'Grade e calendário' },
  { id: 'contas', rotulo: 'Conta da escola' },
]

/* ── Importar planilha (os quatro passos que já existiam) ──────────────────────────────────────────────── */

const PASSOS = ['Arquivo', 'Conferir colunas', 'Corrigir o que veio torto', 'Importar']
const TORTOS = [
  { veio: ['2 B', '2º B', '2ºB'], sugestao: '2ºB', linhas: 32 },
  { veio: ['1o C', '1ºC'], sugestao: '1ºC', linhas: 34 },
  { veio: ['9 ano A'], sugestao: '9ºA', linhas: 28 },
]
const COLUNAS_PLANILHA = [
  { coluna: 'Coluna A · "Nome do aluno"', vira: 'Nome' },
  { coluna: 'Coluna B · "Matr."', vira: 'Matrícula' },
  { coluna: 'Coluna C · "Turma"', vira: 'Turma' },
  { coluna: 'Coluna D · "E-mail"', vira: 'Não importar' },
]

function Importacao({ aoFechar }: { aoFechar: () => void }) {
  const [passo, setPasso] = useState(1)
  const [aceitos, setAceitos] = useState<number[]>([])
  const pronto = aceitos.length === TORTOS.length
  return (
    <div className="grid gap-5">
      <Stepper value={passo} onValueChange={setPasso} className="gap-1">
        {PASSOS.map((p, i) => (
          <StepperItem key={p} step={i + 1} className="flex-1 max-md:items-start [&:last-child]:flex-none">
            <StepperTrigger className="gap-2 rounded-linha py-1 pr-1 max-md:flex-col max-md:items-start">
              <StepperIndicator className="size-7 bg-ia-cx text-[13px] text-apoio data-[state=active]:bg-noite data-[state=completed]:bg-ok data-[state=active]:text-white data-[state=completed]:text-white" />
              <StepperTitle className="font-corpo text-[13px] font-semibold text-tinta max-md:sr-only">{p}</StepperTitle>
            </StepperTrigger>
            {i < PASSOS.length - 1 && <StepperSeparator className="mx-2 bg-linha group-data-[state=completed]/step:bg-ok" />}
          </StepperItem>
        ))}
      </Stepper>
      <p className="rotulo md:hidden">Passo {passo} de 4 · {PASSOS[passo - 1]}</p>

      {passo === 1 && (
        <div className="grid gap-3">
          <div className="flex items-center gap-3 rounded-controle border border-linha p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-linha bg-ok-cx text-ok"><FileSpreadsheet className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-tinta">listas-2026-ensino-medio.xlsx</p>
              <p className="text-[13px] text-sutil">3 abas · 94 linhas · enviado agora</p>
            </div>
            <Button variant="discreto" size="sm"><RefreshCw /> Trocar</Button>
          </div>
          <p className="text-sm leading-relaxed text-apoio">Basta a lista de nomes por turma. Não pedimos cadastro completo: aluno não tem e-mail, telefone, CPF nem foto no sistema.</p>
        </div>
      )}

      {passo === 2 && (
        <div className="grid gap-2">
          {COLUNAS_PLANILHA.map((c) => (
            <div key={c.coluna} className="grid items-center gap-2 rounded-controle border border-linha p-3 sm:grid-cols-[1fr_200px]">
              <p className="text-[15px] text-tinta">{c.coluna}</p>
              <Select defaultValue={c.vira}>
                <SelectTrigger aria-label={`O que fazer com ${c.coluna}`} className="h-11 rounded-controle border-borda-campo bg-superficie text-[15px] md:h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-controle">
                  {['Nome', 'Matrícula', 'Turma', 'Não importar'].map((o) => <SelectItem key={o} value={o} className="rounded-linha">{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
          <Aviso tom="info">A coluna de e-mail fica de fora por padrão. O contato é sempre do responsável, nunca do aluno.</Aviso>
        </div>
      )}

      {passo === 3 && (
        <div className="grid gap-2">
          <p className="text-[15px] leading-relaxed text-apoio">A turma veio escrita de três jeitos. Confirme a sugestão de cada uma antes de importar.</p>
          {TORTOS.map((t, i) => {
            const ok = aceitos.includes(i)
            return (
              <div key={t.sugestao} className={cn('flex flex-wrap items-center gap-3 rounded-controle border p-3', ok ? 'border-transparent bg-ok-cx' : 'border-linha')}>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-tinta">{t.veio.map((v) => <code key={v} className="mr-1.5 rounded-[6px] bg-ia-cx px-1.5 py-0.5 font-corpo text-sm text-apoio">{v}</code>)}<span className="text-sutil">→</span> <b className="font-semibold">{t.sugestao}</b></p>
                  <p className="text-[13px] text-sutil">{t.linhas} linhas</p>
                </div>
                {ok ? <Estado tipo="ok">Conferido</Estado>
                  : <Button variant="secundario" size="sm" onClick={() => setAceitos((a) => [...a, i])}><Check /> É a mesma turma</Button>}
              </div>
            )
          })}
          <p className="text-[13px] text-sutil">Dois alunos com o mesmo nome no 2ºB: ficam os dois, diferenciados pela matrícula.</p>
        </div>
      )}

      {passo === 4 && (
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <NumeroPainel rotulo="Turmas" valor="3" />
            <NumeroPainel rotulo="Nomes" valor="94" />
            <NumeroPainel rotulo="Ficaram de fora" valor="0" apoio="nenhuma linha recusada" />
          </div>
          <Aviso tom="info" titulo="O que acontece ao importar">As listas entram nas turmas. Cada aluno ainda precisa reivindicar o nome e ser aprovado pelo professor, ou entrar pela conta da escola. Nada aqui cria acesso sozinho.</Aviso>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2 border-t border-linha pt-4">
        <Button variant="discreto" onClick={() => (passo === 1 ? aoFechar() : setPasso(passo - 1))}>{passo === 1 ? 'Cancelar' : 'Voltar'}</Button>
        {passo < 4
          ? <Button variant="secundario" disabled={passo === 3 && !pronto} onClick={() => setPasso(passo + 1)}>{passo === 3 && !pronto ? `Faltam ${TORTOS.length - aceitos.length} para conferir` : 'Continuar'}</Button>
          : <Button onClick={aoFechar}>Importar 94 nomes</Button>}
      </div>
    </div>
  )
}

/* ── O roteiro da montagem, numa faixa ─────────────────────────────────────────────────────────────────── */

type PassoId = (typeof ROTEIRO)[number]['id']

function Roteiro({ feitos, detalhe, aoAbrir, numeros }: {
  feitos: Record<PassoId, boolean>; detalhe: Partial<Record<PassoId, string>>; aoAbrir: (id: PassoId) => void
  numeros: { valor: number; rotulo: string; tom?: 'pendente' }[]
}) {
  const quantos = ROTEIRO.filter((p) => feitos[p.id]).length
  return (
    <section aria-label={`Montagem da escola: ${quantos} de ${ROTEIRO.length} passos feitos`}
      className="flex shrink-0 flex-col gap-3 overflow-hidden rounded-cartao border border-linha px-3 py-2.5 lg:flex-row lg:items-center lg:gap-4 lg:pl-2 lg:pr-5">
      <TooltipProvider delayDuration={150}>
        <ol className="flex min-w-0 flex-1 items-start overflow-x-auto pb-0.5">
          {ROTEIRO.map((p, i) => {
            const feito = feitos[p.id]
            return (
              <li key={p.id} className="relative flex min-w-[92px] flex-1 justify-center">
                {i < ROTEIRO.length - 1 && (
                  <span aria-hidden className={cn('absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-[17px] h-px', feito ? 'bg-ok/40' : 'bg-linha')} />
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" onClick={() => aoAbrir(p.id)}
                      className="group flex w-full flex-col items-center gap-1 rounded-linha px-1 py-1.5 transition-colors duration-150 hover:bg-realce-suave">
                      <span className={cn('grid size-[22px] place-items-center rounded-full text-[11.5px] font-semibold tabular-nums',
                        feito ? 'bg-ok text-white' : 'bg-pendente-cx text-pendente ring-1 ring-inset ring-pendente/30')}>
                        {feito ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className={cn('whitespace-nowrap text-[12.5px] leading-tight', feito ? 'text-apoio' : 'font-semibold text-tinta')}>{p.titulo}</span>
                      <span className="sr-only">{feito ? 'feito' : 'falta fazer'}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-64 rounded-linha bg-noite px-3 py-2 text-[13px] leading-snug text-white">
                    <p>{p.texto}</p>
                    {detalhe[p.id] && <p className="mt-1 font-semibold text-caramelo-noite">{detalhe[p.id]}</p>}
                  </TooltipContent>
                </Tooltip>
              </li>
            )
          })}
        </ol>
      </TooltipProvider>
      <span aria-hidden className="hidden h-10 w-px shrink-0 bg-linha lg:block" />
      <dl className="flex shrink-0 flex-wrap gap-x-6 gap-y-2 px-1 lg:px-0">
        {numeros.map((n) => (
          <div key={n.rotulo} className="flex flex-col-reverse">
            <dt className="whitespace-nowrap text-[12px] leading-tight text-sutil">{n.rotulo}</dt>
            <dd className={cn('text-[20px] font-semibold leading-tight tabular-nums tracking-[-0.01em]', n.tom === 'pendente' ? 'text-pendente' : 'text-tinta')}>{n.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/* ── Aba Turmas ────────────────────────────────────────────────────────────────────────────────────────── */

type FiltroTurma = 'todas' | 'pedidos' | 'sem_lista'
const ordemDaSerie = (s: string) => { const i = SERIES.indexOf(s); return i < 0 ? 99 : i }
const normalizarTurma = (s: string) => s.trim().replace(/\s+/g, '').replace(/(\d)[oº°]/i, '$1º').toUpperCase()

function AbaTurmas({ turmas, filtro, setFiltro, serie, setSerie, nova, anuncio, setAnuncio }: {
  turmas: TurmaDaEscola[]; filtro: FiltroTurma; setFiltro: (f: FiltroTurma) => void
  serie: string; setSerie: (s: string) => void; nova: string | null; anuncio: ReactNode; setAnuncio: (a: ReactNode) => void
}) {
  const navigate = useNavigate()
  const visiveis = turmas
    .filter((t) => serie === 'todas' || t.serie === serie)
    .filter((t) => filtro === 'todas' || (filtro === 'pedidos' ? t.pedidos > 0 : t.nomes === 0))
    .sort((a, b) => ordemDaSerie(a.serie) - ordemDaSerie(b.serie) || a.nome.localeCompare(b.nome, 'pt-BR'))

  useEffect(() => {
    if (!nova) return
    requestAnimationFrame(() => document.querySelector('[data-destaque="true"]')?.scrollIntoView({ block: 'nearest' }))
  }, [nova])

  const colunas: ColunaFixa<TurmaDaEscola>[] = [
    { titulo: 'Turma', principal: true, celula: (t) => <span className="inline-flex items-center gap-2.5 font-semibold text-tinta"><PintaTurma turma={t.nome} className="size-6" />{t.nome}</span> },
    { titulo: 'Série', celula: (t) => t.serie },
    { titulo: 'Turno', celula: (t) => t.turno },
    { titulo: 'Nomes na lista', className: 'text-right', celula: (t) => t.nomes ? <span className="tabular-nums text-tinta">{t.nomes}</span> : <span className="text-inativo">—</span> },
    { titulo: 'Livres', className: 'text-right', celula: (t) => t.nomes ? <span className="tabular-nums">{t.livres}</span> : <span className="text-inativo">—</span> },
    { titulo: 'Pedidos esperando', className: 'text-right', celula: (t) => t.pedidos
      ? <Estado tipo="pendente" size="sm" className="font-semibold tabular-nums">{t.pedidos} esperando</Estado>
      : <span className="text-inativo">0</span> },
    { titulo: 'Lista enviada em', celula: (t) => t.listaEm ? <span className="tabular-nums">{t.listaEm}</span> : <Estado tipo="pendente" size="sm">Lista ainda não enviada</Estado> },
    { titulo: '', soComputador: true, className: 'w-10 text-right', celula: () => <ChevronRight className="ml-auto size-4 text-inativo transition-colors group-hover:text-tinta" /> },
  ]
  const comPedidos = turmas.filter((t) => t.pedidos > 0).length
  const semLista = turmas.filter((t) => t.nomes === 0).length

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-cartao border border-linha">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-linha px-3 py-2.5">
        <Pilulas rotulo="Mostrar" valor={filtro} aoMudar={setFiltro} opcoes={[
          { valor: 'todas', rotulo: 'Todas', n: turmas.length },
          { valor: 'pedidos', rotulo: 'Com pedidos esperando', n: comPedidos },
          { valor: 'sem_lista', rotulo: 'Sem lista', n: semLista },
        ]} />
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-[13px] text-sutil xl:inline">Ano letivo 2026 · clique numa turma para abrir a lista</span>
          <Escolha valor={serie} aoMudar={setSerie} className="h-8 w-40 text-[13px]"
            opcoes={[{ valor: 'todas', rotulo: 'Todas as séries' }, ...SERIES.map((s) => ({ valor: s, rotulo: s }))]} />
        </div>
      </div>
      {anuncio && <div className="shrink-0 px-3 pt-2.5"><Anuncio aoFechar={() => setAnuncio(null)}>{anuncio}</Anuncio></div>}
      <div className={areaRolavel}>
        <TabelaFixa colunas={colunas} linhas={visiveis} chave={(t) => t.id}
          aoClicar={(t) => navigate(`/coordenacao/estrutura/turmas/${t.id}`)} rotuloDaLinha={(t) => `Abrir a turma ${t.nome}`}
          destaque={(t) => t.id === nova} vazio="Nenhuma turma com este filtro." />
      </div>
    </div>
  )
}

function DialogoNovaTurma({ aberto, aoMudar, turmas, series, aoCriar }: {
  aberto: boolean; aoMudar: (v: boolean) => void; turmas: TurmaDaEscola[]; series: string[]; aoCriar: (t: TurmaDaEscola) => void
}) {
  const [nome, setNome] = useState('')
  const [serie, setSerie] = useState('')
  const [turno, setTurno] = useState<'Manhã' | 'Tarde'>('Manhã')
  const [erro, setErro] = useState('')
  const fechar = (v: boolean) => { aoMudar(v); if (!v) { setNome(''); setSerie(''); setTurno('Manhã'); setErro('') } }
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const n = normalizarTurma(nome)
    if (!n) return setErro('Digite o nome da turma, como 7ºA.')
    if (turmas.some((t) => normalizarTurma(t.nome) === n)) return setErro('Já existe uma turma com este nome neste ano letivo.')
    if (!serie) return setErro('Escolha a série da turma.')
    aoCriar({ id: `nova-${n.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now().toString(36)}`, nome: n, serie, turno, nomes: 0, pedidos: 0, livres: 0 })
    fechar(false)
  }
  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent className={cn(CANTO_DIALOGO, 'outline-none max-w-md')}>
        <form onSubmit={enviar} className="grid gap-4" noValidate>
          <DialogHeader className="text-left">
            <DialogTitle className={tituloDialogo}>Nova turma</DialogTitle>
            <DialogDescription className={textoDialogo}>A turma nasce no ano letivo em curso, 2026, sem lista de nomes.</DialogDescription>
          </DialogHeader>
          <Campo id="nt-nome" rotulo="Nome da turma">
            <Input id="nt-nome" value={nome} onChange={(e) => { setNome(e.target.value); setErro('') }} placeholder="7ºA" autoFocus className={campo} aria-invalid={!!erro} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo id="nt-serie" rotulo="Série">
              <Escolha id="nt-serie" valor={serie} aoMudar={(v) => { setSerie(v); setErro('') }} marcador="Escolha" opcoes={series.map((s) => ({ valor: s, rotulo: s }))} />
            </Campo>
            <Campo id="nt-turno" rotulo="Turno">
              <Escolha id="nt-turno" valor={turno} aoMudar={(v) => setTurno(v as 'Manhã' | 'Tarde')} opcoes={[{ valor: 'Manhã', rotulo: 'Manhã' }, { valor: 'Tarde', rotulo: 'Tarde' }]} />
            </Campo>
          </div>
          {erro && <MensagemCampo>{erro}</MensagemCampo>}
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="discreto" onClick={() => fechar(false)}>Cancelar</Button>
            <Button type="submit">Criar turma</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Aba Ano letivo, séries e disciplinas ──────────────────────────────────────────────────────────────── */

type Ano = { ano: number; situacao: SituacaoDoAno; inicio: string; fim: string }
const TOM_DO_ANO = { em_curso: 'ok', planejado: 'pendente', encerrado: 'contorno' } as const

function Coluna({ titulo, n, acao, children, foco, aoFechar }: { titulo: string; n: number; acao: ReactNode; children: ReactNode; foco?: boolean; aoFechar?: ReactNode }) {
  return (
    <section className={cn('flex max-h-full min-h-0 flex-col rounded-cartao border transition-colors duration-300', foco ? 'border-noite' : 'border-linha')}>
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-linha pl-4 pr-2">
        <h2 className="text-[15px] font-semibold text-tinta">{titulo} <span className="ml-1 font-normal tabular-nums text-sutil">{n}</span></h2>
        {acao}
      </header>
      <div className={cn(areaRolavel, 'p-1.5')}>{children}</div>
      {aoFechar}
    </section>
  )
}

const linhaLista = 'flex min-h-10 items-center gap-2 rounded-linha px-2.5 text-sm'

function FormInline({ rotulo, valorInicial = '', marcador, aoSalvar, aoCancelar, erro, rotuloBotao = 'Salvar' }: {
  rotulo: string; valorInicial?: string; marcador?: string; aoSalvar: (v: string) => void; aoCancelar: () => void; erro?: string; rotuloBotao?: string
}) {
  const [v, setV] = useState(valorInicial)
  return (
    <form onSubmit={(e) => { e.preventDefault(); aoSalvar(v) }} className="grid gap-1.5 rounded-linha bg-realce-suave p-1.5">
      <div className="flex items-center gap-1.5">
        <Input aria-label={rotulo} value={v} onChange={(e) => setV(e.target.value)} placeholder={marcador} autoFocus className={cn(campo, 'h-8 flex-1 text-sm')} />
        <Button type="submit" size="sm" variant="oficial" className="h-8">{rotuloBotao}</Button>
        <Button type="button" size="icon-sm" variant="discreto" className="size-8" onClick={aoCancelar} aria-label="Cancelar"><X /></Button>
      </div>
      {erro && <MensagemCampo>{erro}</MensagemCampo>}
    </form>
  )
}

function AbaAno({ anos, setAnos, series, setSeries, disciplinas, setDisciplinas, alocacoes, setAlocacoes, turmas, foco }: {
  anos: Ano[]; setAnos: (a: Ano[]) => void; series: string[]; setSeries: (s: string[]) => void
  disciplinas: string[]; setDisciplinas: (d: string[]) => void; alocacoes: Alocacao[]; setAlocacoes: (a: Alocacao[]) => void
  turmas: TurmaDaEscola[]; foco: string | null
}) {
  const [msgAno, setMsgAno] = useState<number | null>(null)
  const [novoAno, setNovoAno] = useState(false)
  const [erroAno, setErroAno] = useState('')
  const [novaSerie, setNovaSerie] = useState(false)
  const [erroSerie, setErroSerie] = useState('')
  const [novaDisc, setNovaDisc] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [erroDisc, setErroDisc] = useState<{ alvo: string; texto: string } | null>(null)
  const [anuncio, setAnuncio] = useState<ReactNode>(null)

  const ativas = alocacoes.filter((a) => a.estado !== 'encerrado')
  const igual = (a: string, b: string) => a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR')

  const criarAno = (v: string) => {
    const ano = Number(v.trim())
    if (!/^\d{4}$/.test(v.trim())) return setErroAno('Digite o ano com quatro números, como 2028.')
    if (anos.some((a) => a.ano === ano)) return setErroAno(`O ano letivo ${ano} já existe.`)
    setAnos([...anos, { ano, situacao: 'planejado' as const, inicio: `01/02/${ano}`, fim: `10/12/${ano}` }].sort((a, b) => b.ano - a.ano))
    setNovoAno(false); setErroAno('')
    setAnuncio(<>Ano letivo <b>{ano}</b> criado como planejado. As datas podem ser ajustadas até ele abrir.</>)
  }
  const criarSerie = (v: string) => {
    if (!v.trim()) return setErroSerie('Digite o nome da série, como 6º ano EF.')
    if (series.some((s) => igual(s, v))) return setErroSerie('Esta série já existe.')
    setSeries([...series, v.trim()]); setNovaSerie(false); setErroSerie('')
  }
  const salvarDisc = (antiga: string | null, v: string) => {
    const alvo = antiga ?? '__nova'
    if (!v.trim()) return setErroDisc({ alvo, texto: 'Digite o nome da disciplina.' })
    if (disciplinas.some((d) => d !== antiga && igual(d, v))) return setErroDisc({ alvo, texto: 'Esta disciplina já existe.' })
    if (antiga) {
      setDisciplinas(disciplinas.map((d) => (d === antiga ? v.trim() : d)))
      setAlocacoes(alocacoes.map((a) => (a.disciplina === antiga ? { ...a, disciplina: v.trim() } : a)))
      setEditando(null)
      setAnuncio(<>Disciplina renomeada para <b>{v.trim()}</b>. As alocações dela mudam junto.</>)
    } else {
      setDisciplinas([...disciplinas, v.trim()]); setNovaDisc(false)
    }
    setErroDisc(null)
  }
  const excluirDisc = (d: string) => {
    if (ativas.some((a) => a.disciplina === d)) return setErroDisc({ alvo: d, texto: 'Esta disciplina não pode sair: há professor alocado nela.' })
    setDisciplinas(disciplinas.filter((x) => x !== d)); setErroDisc(null)
    setAnuncio(<>Disciplina <b>{d}</b> excluída.</>)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      {anuncio && <Anuncio aoFechar={() => setAnuncio(null)} className="shrink-0">{anuncio}</Anuncio>}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.25fr_1fr_1fr] lg:items-start">
        <Coluna titulo="Anos letivos" n={anos.length} foco={foco === 'ano'}
          acao={<Button size="sm" variant="secundario" className="h-8" onClick={() => { setNovoAno(true); setErroAno('') }}><Plus /> Novo ano letivo</Button>}>
          <ul className="grid gap-1">
            {novoAno && <li><FormInline rotulo="Ano do novo ano letivo" marcador="2028" rotuloBotao="Criar" aoSalvar={criarAno} aoCancelar={() => setNovoAno(false)} erro={erroAno} /></li>}
            {anos.map((a) => (
              <li key={a.ano} className={cn('rounded-linha px-2.5 py-2.5', a.situacao === 'em_curso' && 'bg-realce-suave')}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <p className="text-[17px] font-semibold tabular-nums text-tinta">{a.ano}</p>
                  <Estado tipo={TOM_DO_ANO[a.situacao]} size="sm">{SITUACAO_DO_ANO[a.situacao]}</Estado>
                  {a.situacao === 'planejado' && (
                    <Button size="sm" variant="secundario" className="ml-auto h-8" onClick={() => setMsgAno(msgAno === a.ano ? null : a.ano)}>Abrir o ano letivo {a.ano}</Button>
                  )}
                </div>
                <p className="mt-1 text-[13px] tabular-nums text-sutil">{SITUACAO_DO_ANO[a.situacao]} · de {a.inicio} a {a.fim}
                  {a.situacao === 'em_curso' && <> · {turmas.length} turmas</>}</p>
                {msgAno === a.ano && <div className="mt-2"><MensagemCampo>Já há um ano letivo em curso na escola. Só um fica em curso por vez.</MensagemCampo></div>}
              </li>
            ))}
          </ul>
          <p className="px-2.5 pb-1 pt-3 text-[13px] leading-relaxed text-sutil">As turmas nascem no ano em curso. Ao encerrar 2026, abra o 2027 para montar as turmas novas.</p>
        </Coluna>

        <Coluna titulo="Séries" n={series.length} foco={foco === 'series'}
          acao={<Button size="sm" variant="secundario" className="h-8" onClick={() => { setNovaSerie(true); setErroSerie('') }}><Plus /> Nova série</Button>}>
          <ul className="grid">
            {novaSerie && <li className="mb-1"><FormInline rotulo="Nome da nova série" marcador="Ex.: 5º ano EF" rotuloBotao="Criar" aoSalvar={criarSerie} aoCancelar={() => setNovaSerie(false)} erro={erroSerie} /></li>}
            {series.map((s) => {
              const n = turmas.filter((t) => t.serie === s).length
              return (
                <li key={s} className={cn(linhaLista, 'justify-between hover:bg-realce-suave')}>
                  <span className="text-tinta">{s}</span>
                  <span className="text-[13px] tabular-nums text-sutil">{n === 0 ? 'sem turma' : n === 1 ? '1 turma' : `${n} turmas`}</span>
                </li>
              )
            })}
          </ul>
        </Coluna>

        <Coluna titulo="Disciplinas" n={disciplinas.length} foco={foco === 'disciplinas'}
          acao={<Button size="sm" variant="secundario" className="h-8" onClick={() => { setNovaDisc(true); setErroDisc(null) }}><Plus /> Nova disciplina</Button>}>
          <ul className="grid">
            {novaDisc && <li className="mb-1"><FormInline rotulo="Nome da nova disciplina" marcador="Ex.: Filosofia" rotuloBotao="Criar" aoSalvar={(v) => salvarDisc(null, v)} aoCancelar={() => setNovaDisc(false)} erro={erroDisc?.alvo === '__nova' ? erroDisc.texto : undefined} /></li>}
            {disciplinas.map((d) => {
              const n = ativas.filter((a) => a.disciplina === d).length
              if (editando === d) return <li key={d} className="my-0.5"><FormInline rotulo={`Novo nome para ${d}`} valorInicial={d} aoSalvar={(v) => salvarDisc(d, v)} aoCancelar={() => { setEditando(null); setErroDisc(null) }} erro={erroDisc?.alvo === d ? erroDisc.texto : undefined} /></li>
              return (
                <li key={d}>
                  <div className={cn(linhaLista, 'group pr-1 hover:bg-realce-suave')}>
                    <span className="min-w-0 flex-1 truncate text-tinta">{d}</span>
                    <span className="text-[13px] tabular-nums text-sutil">{n === 0 ? 'sem alocação' : n === 1 ? '1 alocação' : `${n} alocações`}</span>
                    <Button size="icon-sm" variant="discreto" className="size-8" aria-label={`Renomear ${d}`} onClick={() => { setEditando(d); setErroDisc(null) }}><Pencil className="!size-3.5" /></Button>
                    <Button size="icon-sm" variant="discreto" className="size-8 hover:text-erro" aria-label={`Excluir ${d}`} onClick={() => excluirDisc(d)}><Trash2 className="!size-3.5" /></Button>
                  </div>
                  {erroDisc?.alvo === d && <div className="mx-1 mb-1"><MensagemCampo>{erroDisc.texto}</MensagemCampo></div>}
                </li>
              )
            })}
          </ul>
        </Coluna>
      </div>
    </div>
  )
}

/* ── Aba Alocação ──────────────────────────────────────────────────────────────────────────────────────── */

const TOM_DO_VINCULO: Record<EstadoDoVinculo, 'ok' | 'pendente' | 'erro' | 'contorno'> = { confirmado: 'ok', pendente: 'pendente', contestado: 'erro', encerrado: 'contorno' }
type FiltroAlocacao = 'todas' | EstadoDoVinculo
type Rascunho = { corrige?: string; professor: string; turmaId: string; disciplina: string }

function AbaAlocacao({ alocacoes, professor, tirarProfessor, filtro, setFiltro, aoCorrigir, nova, anuncio, setAnuncio }: {
  alocacoes: Alocacao[]; professor: string | null; tirarProfessor: () => void
  filtro: FiltroAlocacao; setFiltro: (f: FiltroAlocacao) => void; aoCorrigir: (r: Rascunho) => void
  nova: string | null; anuncio: ReactNode; setAnuncio: (a: ReactNode) => void
}) {
  const doProfessor = professor ? alocacoes.filter((a) => a.professor === professor) : alocacoes
  const visiveis = doProfessor.filter((a) => filtro === 'todas' || a.estado === filtro)
  const conta = (e: EstadoDoVinculo) => doProfessor.filter((a) => a.estado === e).length
  const colunas: ColunaFixa<Alocacao>[] = [
    { titulo: 'Professor', principal: true, celula: (a) => <span className="font-semibold text-tinta">{a.professor}</span> },
    { titulo: 'Turma', celula: (a) => <span className="inline-flex items-center gap-2"><PintaTurma turma={a.turma} className="size-6" />{a.turma}</span> },
    { titulo: 'Disciplina', celula: (a) => a.disciplina },
    { titulo: 'Vínculo', celula: (a) => <Estado tipo={TOM_DO_VINCULO[a.estado]} size="sm">{TEXTO_DO_VINCULO[a.estado]}</Estado> },
    { titulo: 'Quando', celula: (a) => <span className="text-[13px] text-sutil">{a.quando}</span> },
  ]
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-cartao border border-linha">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-linha px-3 py-2.5">
        <Pilulas rotulo="Mostrar" valor={filtro} aoMudar={setFiltro} opcoes={[
          { valor: 'todas', rotulo: 'Todas', n: doProfessor.length },
          { valor: 'pendente', rotulo: 'Esperando confirmação', n: conta('pendente') },
          { valor: 'contestado', rotulo: 'Contestadas', n: conta('contestado') },
          { valor: 'confirmado', rotulo: 'Confirmadas', n: conta('confirmado') },
          { valor: 'encerrado', rotulo: 'Encerradas', n: conta('encerrado') },
        ]} />
        {professor && (
          <span className="ml-auto inline-flex h-8 items-center gap-1 rounded-full border border-borda-campo pl-3 pr-1 text-[13px] text-tinta">
            Professor: <b className="font-semibold">{professor}</b>
            <button type="button" onClick={tirarProfessor} aria-label="Mostrar todos os professores" className="grid size-6 place-items-center rounded-full hover:bg-realce-suave"><X className="size-3.5" /></button>
          </span>
        )}
      </div>
      {anuncio && <div className="shrink-0 px-3 pt-2.5"><Anuncio aoFechar={() => setAnuncio(null)}>{anuncio}</Anuncio></div>}
      <div className={areaRolavel}>
        <TabelaFixa colunas={colunas} linhas={visiveis} chave={(a) => a.id} destaque={(a) => a.id === nova} vazio="Nenhuma alocação com este filtro."
          depois={(a) => a.estado === 'contestado' && a.contestacao ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-controle bg-erro-cx px-3 py-2 text-[13.5px] text-erro">
              <p className="min-w-0 flex-1 leading-snug">
                <b className="font-semibold">{NOME_DA_CONTESTACAO[a.contestacao.motivo]}</b>
                {a.contestacao.complemento && <span className="text-apoio"> · “{a.contestacao.complemento}”</span>}
              </p>
              <Button size="sm" variant="oficial" className="h-8" onClick={() => aoCorrigir({ corrige: a.id, professor: a.professor, turmaId: a.turmaId, disciplina: a.disciplina })}>
                Corrigir alocação
              </Button>
            </div>
          ) : null} />
      </div>
      <p className="shrink-0 border-t border-linha px-4 py-2.5 text-[13px] text-sutil">O vínculo é definido pela escola. Vínculo declarado pelo próprio professor não dá acesso a aluno.</p>
    </div>
  )
}

function DialogoAlocar({ rascunho, aoMudar, turmas, disciplinas, alocacoes, aoAlocar }: {
  rascunho: Rascunho | null; aoMudar: (r: Rascunho | null) => void; turmas: TurmaDaEscola[]; disciplinas: string[]
  alocacoes: Alocacao[]; aoAlocar: (r: Rascunho) => void
}) {
  const [erro, setErro] = useState('')
  const r = rascunho ?? { professor: '', turmaId: '', disciplina: '' }
  const muda = (p: Partial<Rascunho>) => { setErro(''); aoMudar({ ...r, ...p }) }
  const professores = PROFESSORES.filter((p) => p.estado !== 'revogado' && p.estado !== 'desativado')
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!r.professor || !r.turmaId || !r.disciplina) return setErro('Escolha o professor, a turma e a disciplina.')
    if (alocacoes.some((a) => a.estado !== 'encerrado' && a.professor === r.professor && a.turmaId === r.turmaId && a.disciplina === r.disciplina))
      return setErro('Este professor já está alocado nesta turma e nesta disciplina.')
    aoAlocar(r); setErro('')
  }
  return (
    <Dialog open={!!rascunho} onOpenChange={(v) => { if (!v) { aoMudar(null); setErro('') } }}>
      <DialogContent className={cn(CANTO_DIALOGO, 'outline-none max-w-lg')}>
        <form onSubmit={enviar} className="grid gap-4" noValidate>
          <DialogHeader className="text-left">
            <DialogTitle className={tituloDialogo}>{r.corrige ? 'Corrigir alocação' : 'Alocar professor'}</DialogTitle>
            <DialogDescription className={textoDialogo}>
              A alocação liga um professor a uma turma e a uma disciplina. O vínculo nasce pendente: a turma abre para o professor depois que ele confirmar.
            </DialogDescription>
          </DialogHeader>
          {r.corrige && <Aviso tom="pendente">A alocação contestada é encerrada, e a corrigida vai de novo para o professor confirmar.</Aviso>}
          <Campo id="al-prof" rotulo="Professor">
            <Escolha id="al-prof" valor={r.professor} aoMudar={(v) => muda({ professor: v })} marcador="Escolha o professor"
              opcoes={professores.map((p) => ({ valor: p.nome, rotulo: `${p.nome} · ${p.disciplinas}` }))} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo id="al-turma" rotulo="Turma">
              <Escolha id="al-turma" valor={r.turmaId} aoMudar={(v) => muda({ turmaId: v })} marcador="Escolha a turma"
                opcoes={[...turmas].sort((a, b) => ordemDaSerie(a.serie) - ordemDaSerie(b.serie) || a.nome.localeCompare(b.nome)).map((t) => ({ valor: t.id, rotulo: `${t.nome} · ${t.serie}` }))} />
            </Campo>
            <Campo id="al-disc" rotulo="Disciplina">
              <Escolha id="al-disc" valor={r.disciplina} aoMudar={(v) => muda({ disciplina: v })} marcador="Escolha a disciplina"
                opcoes={disciplinas.map((d) => ({ valor: d, rotulo: d }))} />
            </Campo>
          </div>
          {erro && <MensagemCampo>{erro}</MensagemCampo>}
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="discreto" onClick={() => aoMudar(null)}>Cancelar</Button>
            <Button type="submit" variant="oficial">{r.corrige ? 'Corrigir e mandar para confirmar' : 'Alocar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── A página ──────────────────────────────────────────────────────────────────────────────────────────── */

export function Estrutura() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const pedida = params.get('aba')
  const aba: Aba = ABAS.some((a) => a.id === pedida) ? (pedida as Aba) : 'turmas'
  const professor = params.get('professor')
  const irPara = (a: Aba, extra?: Record<string, string>) => setParams(a === 'turmas' && !extra ? {} : { aba: a, ...extra }, { replace: true })

  const [importando, setImportando] = useState(false)
  const [conta, setConta] = useState<'nenhuma' | 'google'>('nenhuma')
  const [turmas, setTurmas] = useState<TurmaDaEscola[]>(() => todasAsTurmas().map(turmaContada))
  const [anos, setAnos] = useState<Ano[]>(ANOS_LETIVOS)
  const [series, setSeries] = useState<string[]>(SERIES)
  const [disciplinas, setDisciplinas] = useState<string[]>(DISCIPLINAS)
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>(ALOCACOES)

  const [filtroTurma, setFiltroTurma] = useState<FiltroTurma>('todas')
  const [serie, setSerie] = useState('todas')
  const [novaTurma, setNovaTurma] = useState(false)
  const [turmaNova, setTurmaNova] = useState<string | null>(null)
  const [anuncioTurma, setAnuncioTurma] = useState<ReactNode>(null)

  const [filtroAloc, setFiltroAloc] = useState<FiltroAlocacao>('todas')
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [alocNova, setAlocNova] = useState<string | null>(null)
  const [anuncioAloc, setAnuncioAloc] = useState<ReactNode>(null)
  const [foco, setFoco] = useState<string | null>(null)

  const pendentes = alocacoes.filter((a) => a.estado === 'pendente').length
  const contestadas = alocacoes.filter((a) => a.estado === 'contestado').length
  const semLista = turmas.filter((t) => t.nomes === 0)
  const feitos: Record<PassoId, boolean> = {
    ano: anos.some((a) => a.situacao === 'em_curso'),
    series: series.length > 0,
    disciplinas: disciplinas.length > 0,
    turmas: turmas.length > 0,
    listas: semLista.length === 0,
    professores: PROFESSORES.length > 0,
    alocacao: pendentes === 0 && contestadas === 0,
  }
  const detalhe: Partial<Record<PassoId, string>> = {
    listas: semLista.length ? `Falta a lista: ${semLista.map((t) => t.nome).join(', ')}` : undefined,
    alocacao: pendentes || contestadas ? [pendentes && `${pendentes} esperando o professor confirmar`, contestadas && `${contestadas} contestada`].filter(Boolean).join(' · ') : undefined,
  }
  const nomes = turmas.reduce((s, t) => s + t.nomes, 0)
  const pedidos = turmas.reduce((s, t) => s + t.pedidos, 0)

  const abrirPasso = (id: PassoId) => {
    if (id === 'professores') return navigate('/coordenacao/professores')
    if (id === 'alocacao') { setFiltroAloc(contestadas ? 'contestado' : 'pendente'); return irPara('alocacao') }
    if (id === 'turmas' || id === 'listas') { setFiltroTurma(id === 'listas' ? 'sem_lista' : 'todas'); setSerie('todas'); return irPara('turmas') }
    irPara('ano'); setFoco(id)
  }
  useEffect(() => {
    if (!foco) return
    const t = window.setTimeout(() => setFoco(null), 1600)
    return () => window.clearTimeout(t)
  }, [foco])

  const criar = (t: TurmaDaEscola) => {
    criarTurma(t)
    setTurmas((ts) => [...ts, t])
    setFiltroTurma('todas'); setSerie('todas'); setTurmaNova(t.id)
    setAnuncioTurma(<>Turma <b>{t.nome}</b> criada. Abra a turma para subir a lista de nomes.</>)
  }
  const alocar = (r: Rascunho) => {
    const turma = turmas.find((t) => t.id === r.turmaId)!
    const id = `v-${Date.now().toString(36)}`
    const nova: Alocacao = { id, professor: r.professor, turmaId: r.turmaId, turma: turma.nome, disciplina: r.disciplina, estado: 'pendente', quando: `alocação feita em ${HOJE}` }
    setAlocacoes((as) => [nova, ...as.map((a) => (a.id === r.corrige ? { ...a, estado: 'encerrado' as const, quando: `corrigida em ${HOJE}`, contestacao: undefined } : a))])
    setRascunho(null); setAlocNova(id); setFiltroAloc('todas')
    setAnuncioAloc(<>Alocação feita: <b>{r.professor}</b> em {turma.nome} · {r.disciplina}. A turma abre depois que quem foi alocado confirmar.</>)
  }

  const acaoPrincipal = useMemo(() => {
    if (aba === 'turmas') return <Button size="sm" className="h-9" onClick={() => setNovaTurma(true)}><Plus /> Nova turma</Button>
    if (aba === 'alocacao') return <Button size="sm" className="h-9" onClick={() => setRascunho({ professor: professor ?? '', turmaId: '', disciplina: '' })}><Plus /> Alocar</Button>
    return null
  }, [aba, professor])

  return (
    <Tela titulo="Estrutura da escola" className="md:flex md:h-svh md:flex-col md:pb-5">
      <Roteiro feitos={feitos} detalhe={detalhe} aoAbrir={abrirPasso} numeros={[
        { valor: turmas.length, rotulo: 'turmas' },
        { valor: nomes, rotulo: 'nomes nas listas' },
        { valor: pedidos, rotulo: 'pedidos esperando', tom: 'pendente' },
        { valor: TOTAL_DE_PROFESSORES, rotulo: 'professores' },
      ]} />

      <Tabs value={aba} onValueChange={(v) => irPara(v as Aba)} className="mt-3 flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <TabsList className="h-auto max-w-full justify-start gap-0.5 overflow-x-auto rounded-controle bg-ia-cx p-1">
            {ABAS.map((a) => <TabsTrigger key={a.id} value={a.id} className={estiloAba}>{a.rotulo}</TabsTrigger>)}
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="secundario" className="h-9" onClick={() => setImportando(true)}><Upload /> Importar planilha</Button>
            {acaoPrincipal}
          </div>
        </div>

        <TabsContent value="turmas" className="mt-3 min-h-0 flex-1 max-md:h-[560px]">
          <AbaTurmas turmas={turmas} filtro={filtroTurma} setFiltro={setFiltroTurma} serie={serie} setSerie={setSerie}
            nova={turmaNova} anuncio={anuncioTurma} setAnuncio={setAnuncioTurma} />
        </TabsContent>

        <TabsContent value="ano" className="mt-3 min-h-0 flex-1">
          <AbaAno anos={anos} setAnos={setAnos} series={series} setSeries={setSeries} disciplinas={disciplinas} setDisciplinas={setDisciplinas}
            alocacoes={alocacoes} setAlocacoes={setAlocacoes} turmas={turmas} foco={foco} />
        </TabsContent>

        <TabsContent value="alocacao" className="mt-3 min-h-0 flex-1 max-md:h-[560px]">
          <AbaAlocacao alocacoes={alocacoes} professor={professor} tirarProfessor={() => irPara('alocacao')}
            filtro={filtroAloc} setFiltro={setFiltroAloc} aoCorrigir={setRascunho} nova={alocNova} anuncio={anuncioAloc} setAnuncio={setAnuncioAloc} />
        </TabsContent>

        <TabsContent value="grade" className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4 lg:grid-cols-2">
            <Cartao titulo={<span className="inline-flex items-center gap-2"><ListChecks className="size-[18px] text-sutil" /> Grade horária</span>} acao={<Estado tipo="ok">Importada</Estado>}>
              <p className="text-[15px] leading-relaxed text-apoio">138 aulas por semana, em 22 turmas. Importada de <b className="font-semibold text-tinta">grade-2026.xlsx</b> em 02/02/2026.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] border-separate border-spacing-1 text-center text-[13px]">
                  <thead><tr>{['2ºB', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((d) => <th key={d} className="rotulo pb-1.5">{d}</th>)}</tr></thead>
                  <tbody>
                    {[['7h30', 'Mat', 'Quí', 'Port', 'Fís', 'Mat'], ['8h20', 'Mat', 'Quí', 'Hist', 'Fís', 'Bio'], ['9h10', 'Port', 'Geo', 'Quí', 'Ing', 'Bio']].map((l) => (
                      <tr key={l[0]}>{l.map((c, i) => <td key={i} className={cn('rounded-linha px-1 py-2', i === 0 ? 'text-sutil tabular-nums' : c === 'Quí' ? 'bg-creme font-semibold text-caramelo-texto' : 'bg-ia-cx text-apoio')}>{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Cartao>
            <Cartao titulo={<span className="inline-flex items-center gap-2"><CalendarDays className="size-[18px] text-sutil" /> Calendário letivo</span>} acao={<Estado tipo="ok">Importado</Estado>}>
              <ul className="grid gap-2 text-[15px]">
                {[['3º bimestre', '03/08 a 02/10'], ['Semana de provas', '28/09 a 02/10'], ['Feriado · Nossa Senhora Aparecida', '12/10'], ['4º bimestre', '05/10 a 11/12']].map(([n, d]) => (
                  <li key={n} className="flex justify-between gap-3 rounded-controle border border-linha px-3 py-2.5"><span className="text-tinta">{n}</span><span className="shrink-0 tabular-nums text-sutil">{d}</span></li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-sutil">É daqui que sai o calendário de cada professor. Ele preenche o que vai dar na aula; não inventa a grade.</p>
            </Cartao>
          </div>
        </TabsContent>

        <TabsContent value="contas" className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <Cartao titulo="Entrar com a conta da escola" acao={conta === 'google' ? <Estado tipo="ok">Conectada</Estado> : <Estado tipo="contorno">Opcional · desligada</Estado>}>
            <p className="max-w-[72ch] text-[15px] leading-relaxed text-apoio">
              Se a escola usa Google ou Microsoft, professor e aluno entram com a conta que já têm, e as turmas podem vir de lá.
              Guardamos <b className="font-semibold text-tinta">só o identificador da conta</b>. E-mail e foto que o provedor devolve são descartados antes de gravar.
            </p>
            {conta === 'nenhuma' ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Button variant="secundario" onClick={() => setConta('google')}><Link2 /> Conectar Google Workspace</Button>
                <Button variant="secundario"><Link2 /> Conectar Microsoft 365</Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-controle bg-ok-cx p-3.5">
                <p className="text-[15px] text-ok"><b className="font-semibold">Google Workspace</b> · domínio da escola · 684 contas de aluno reconhecidas</p>
                <Button variant="perigo" size="sm" onClick={() => setConta('nenhuma')}>Desconectar</Button>
              </div>
            )}
            <p className="mt-3 text-sm text-sutil">Sem conta da escola, o aluno entra com escola + matrícula + senha. Desconectar leva um clique, igual a conectar.</p>
          </Cartao>
        </TabsContent>
      </Tabs>

      <DialogoNovaTurma aberto={novaTurma} aoMudar={setNovaTurma} turmas={turmas} series={series} aoCriar={criar} />
      <DialogoAlocar rascunho={rascunho} aoMudar={setRascunho} turmas={turmas} disciplinas={disciplinas} alocacoes={alocacoes} aoAlocar={alocar} />

      <Dialog open={importando} onOpenChange={setImportando}>
        <DialogContent className={cn(CANTO_DIALOGO, 'outline-none max-h-[92svh] max-w-2xl overflow-y-auto')}>
          <DialogHeader className="text-left">
            <DialogTitle className={tituloDialogo}>Importar listas de nomes</DialogTitle>
            <DialogDescription className="text-[15px] text-apoio">Quatro passos. Nada entra antes de você conferir.</DialogDescription>
          </DialogHeader>
          <Importacao aoFechar={() => setImportando(false)} />
        </DialogContent>
      </Dialog>

      <NotaMockup>
        Montagem da escola como o produto real (A1, 04/10/2026): roteiro de sete passos, turmas com a lista de nomes, ano letivo,
        séries e disciplinas, alocação que o professor confirma ou contesta (D3). Os convites foram para Professores. O estado é da
        sessão (memória): a turma criada aqui abre na Lista da turma. Regra 20, item 2: a lista leva só nome e matrícula.
      </NotaMockup>
    </Tela>
  )
}
