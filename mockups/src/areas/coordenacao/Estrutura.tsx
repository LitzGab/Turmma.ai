import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, FileSpreadsheet, Lock, Plus, Trash2 } from 'lucide-react'
import {
  Aviso, Balao, Botao, BotaoIcone, Busca, CabecalhoPagina, CampoTexto, Cartao, Dialogo, FaixaResultado, Linha, Pagina, Passos,
  Segmentado, Selo, Toque,
} from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import { Onca } from '@/components/duo/onca'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { listaDe, listas } from '@/dados/acesso'
import { ANOS_LETIVOS, DISCIPLINAS, ROTEIRO, SERIES, SITUACAO_DO_ANO } from '@/dados/estrutura'
import {
  turmas as acoesTurmas, useAlocacoes, useProfessoresDaEscola, useTurmasDaEscola, type TurmaViva,
} from '@/dados/escola-estado'
import { cn } from '@/lib/utils'
import { CABECALHO_NO_SINO, CorpoNoSino, Escolha, porSerie, semAcento, TabelaGrade, type ColunaGrade } from './_estrutura-pecas'
import { Material } from './Material'
import { Professores } from './Professores'

/* ESCOLA (12ª rodada, 04/10/2026; plano 5.3; 14ª rodada, 05/10/2026: plano ux-composicao, 5.2): /coordenacao/escola.
   Página de painel com o cabeçalho de sempre. Turmas numa tabela de linhas de 48 (Turma · Turno · Nomes ·
   Professores · Situação, o selo à direita), a série como linha de grupo de 32, "Para terminar" numa faixa de 48 e
   filtros, busca e NOVA TURMA numa linha só.

   Cabeçalho "Escola" com o ⋯ (Ano letivo e disciplinas · Grade e calendário · Importar listas), cada um ao lado.
   Abas TURMAS · PROFESSORES · MATERIAL (R3).
   · Turmas: a linha de montagem SÓ enquanto falta e SÓ com o que é montagem ("Para terminar: 3ºA sem lista · Jonas sem
     convite"; a contestação mora na fila do Início). VER O QUE FALTA abre os 7 passos com a onça. O filtro de situação,
     a busca, NOVA TURMA (cheio enquanto a montagem não termina) e a lista por série, rolando por dentro.
   · Saíram "Nova série" (as séries ficam travadas do 6º ao 3º EM; D43), "Abrir o ano letivo 2027" (beco sem saída)
     e o painel "Conta da escola" (mora em Configurações).
   O estado mora na base (dados/escola-estado.ts e dados/acesso.ts): vale nas outras abas e nos outros papéis. */

const ABAS = [
  { id: 'turmas', rotulo: 'Turmas' },
  { id: 'professores', rotulo: 'Professores' },
  { id: 'material', rotulo: 'Material' },
]
type Painel = 'ano' | 'grade' | 'importar' | 'roteiro'
const PAINEIS: Painel[] = ['ano', 'grade', 'importar', 'roteiro']
const TITULO: Record<Painel, string> = { ano: 'Ano letivo e disciplinas', grade: 'Grade e calendário', importar: 'Importar listas', roteiro: 'O que falta' }
const LARGURA: Record<Painel, number> = { ano: 520, grade: 600, importar: 640, roteiro: 480 }

type Filtro = 'todas' | 'semlista' | 'semprof' | 'adaptacao'
const FILTROS = [
  { id: 'todas', rotulo: 'Todas' }, { id: 'semlista', rotulo: 'Sem lista' },
  { id: 'semprof', rotulo: 'Sem professor' }, { id: 'adaptacao', rotulo: 'Com adaptação' },
]

/** Sem professor: ninguém alocado (ou só quem disse que não é dele), numa turma que precisa (pedido esperando, contestação
    ou turma nova). As turmas sem alocação nenhuma são as dos 24 professores fora da demonstração. */
const semProfessor = (t: TurmaViva) => t.nomes > 0 && t.professores.every((p) => p.estado === 'contestado') && (t.pedidos > 0 || t.professores.length > 0 || !!t.criada)

function seloDa(t: TurmaViva) {
  if (t.nomes === 0) return <Selo familia="amarelo" tamanho="p">Sem lista</Selo>
  if (semProfessor(t)) return <Selo familia="vermelho" tamanho="p">Sem professor</Selo>
  return <Selo familia="verde" tamanho="p">Lista completa</Selo>
}

/* ── A montagem: o que falta, numa fonte só ────────────────────────────────────────────────────────────── */

function useMontagem() {
  const turmas = useTurmasDaEscola()
  const profs = useProfessoresDaEscola()
  const semLista = turmas.filter((t) => t.nomes === 0)
  const semConvite = profs.filter((p) => p.estado === 'vencido')
  const semAlocacao = turmas.filter((t) => (t.criada || t.id === 'au-3a') && t.professores.length === 0)
  const falta = [
    ...semLista.map((t) => `${t.nome} sem lista`),
    ...semConvite.map((p) => `${p.nome.split(' ')[0]} sem convite`),
    ...semAlocacao.map((t) => `${t.nome} sem professor`),
  ]
  const feitos = [true, true, true, turmas.length > 0, semLista.length === 0, semConvite.length === 0, semAlocacao.length === 0]
  return { turmas, falta, feitos, semLista, semConvite, terminou: falta.length === 0 }
}

export function Estrutura() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const aba = ['professores', 'material'].includes(params.get('aba') ?? '') ? params.get('aba')! : 'turmas'
  const [painelUrl, setPainel] = useParametro('painel')
  const painel = PAINEIS.includes(painelUrl as Painel) ? (painelUrl as Painel) : null
  const m = useMontagem()
  const [disciplinas, setDisciplinas] = useState<string[]>(DISCIPLINAS)
  const [novaTurma, setNovaTurma] = useState(false)

  // endereços antigos: ?aba=ano|grade → o painel; ?aba=conta → Configurações; ?aba=alocacao → Professores
  useEffect(() => {
    const antiga = params.get('aba')
    if (!antiga || ABAS.some((a) => a.id === antiga)) return
    if (antiga === 'conta' || antiga === 'contas') { navigate('/coordenacao/configuracoes', { replace: true }); return }
    setParams((atual) => {
      const p = new URLSearchParams(atual)
      p.delete('aba')
      if (antiga === 'ano' || antiga === 'grade') p.set('painel', antiga)
      if (antiga === 'alocacao') p.set('aba', 'professores')
      return p
    }, { replace: true })
  }, [params, setParams, navigate])

  const irAba = (id: string) => setParams((atual) => {
    const p = new URLSearchParams(atual)
    for (const k of ['painel', 'prof', 'fonte', 'filtro']) p.delete(k)
    if (id === 'turmas') p.delete('aba'); else p.set('aba', id)
    return p
  }, { replace: true })

  const abrirPasso = (i: number) => {
    const id = ROTEIRO[i].id
    if (id === 'ano' || id === 'series' || id === 'disciplinas') return setPainel('ano')
    if (id === 'listas' && m.semLista[0]) return navigate(`/coordenacao/escola/turmas/${m.semLista[0].id}`)
    if (id === 'professores' || id === 'alocacao') {
      return setParams((atual) => {
        const p = new URLSearchParams(atual)
        p.delete('painel'); p.set('aba', 'professores')
        if (id === 'professores' && m.semConvite[0]) p.set('prof', m.semConvite[0].id)
        return p
      }, { replace: true })
    }
    irAba('turmas')
  }

  return (
    <Pagina tipo="painel" rolagem="nenhuma" cabecalho={(
      <CabecalhoPagina titulo="Escola" complemento="Colégio Aurora · 2026" className={CABECALHO_NO_SINO}
        menu={[
          { rotulo: 'Ano letivo e disciplinas', aoEscolher: () => setPainel('ano') },
          { rotulo: 'Grade e calendário', aoEscolher: () => setPainel('grade') },
          { rotulo: 'Importar listas', aoEscolher: () => setPainel('importar') },
        ]}
        abas={{ abas: ABAS, valor: aba, aoMudar: irAba }} />
    )}>
      <CorpoNoSino>
        {aba === 'turmas' && <AbaTurmas m={m} aoVerFalta={() => setPainel('roteiro')} aoNova={() => setNovaTurma(true)} />}
        {aba === 'professores' && <Professores />}
        {aba === 'material' && <Material />}
      </CorpoNoSino>

      <PainelLado aberto={!!painel} aoFechar={() => setPainel(null)} titulo={painel ? TITULO[painel] : ''} largura={painel ? LARGURA[painel] : 480}>
        {painel === 'roteiro' && <Roteiro feitos={m.feitos} falta={m.falta.length} aoAbrir={abrirPasso} />}
        {painel === 'ano' && <AnoLetivo disciplinas={disciplinas} setDisciplinas={setDisciplinas} aoConvidar={() => irAba('professores')} />}
        {painel === 'grade' && <Grade />}
        {painel === 'importar' && <ImportarListas aoFechar={() => setPainel(null)} />}
      </PainelLado>

      <DialogoNovaTurma aberto={novaTurma} aoMudar={setNovaTurma} turmas={m.turmas}
        aoCriar={(id) => navigate(`/coordenacao/escola/turmas/${id}`)} />
    </Pagina>
  )
}

/* ── Turmas ────────────────────────────────────────────────────────────────────────────────────────────── */

/** Os professores da turma, curtos: "Camila, Rafael +3". */
function nomesDosProfessores(t: TurmaViva) {
  const vivos = t.professores.filter((p) => p.estado !== 'encerrado' && p.estado !== 'contestado')
  if (!vivos.length) return null
  const primeiros = [...new Set(vivos.map((p) => p.nome.split(' ')[0]))]
  return primeiros.length > 2 ? `${primeiros.slice(0, 2).join(', ')} +${primeiros.length - 2}` : primeiros.join(', ')
}

function AbaTurmas({ m, aoVerFalta, aoNova }: { m: ReturnType<typeof useMontagem>; aoVerFalta: () => void; aoNova: () => void }) {
  const [filtroUrl, setFiltro] = useParametro('filtro', 'todas')
  const filtro = (FILTROS.some((f) => f.id === filtroUrl) ? filtroUrl : 'todas') as Filtro
  const [busca, setBusca] = useState('')

  const visiveis = m.turmas
    .filter((t) => filtro === 'todas' || (filtro === 'semlista' ? t.nomes === 0 : filtro === 'semprof' ? semProfessor(t) : t.adaptacoes > 0))
    .filter((t) => !busca.trim() || semAcento(t.nome).includes(semAcento(busca)))
    .sort(porSerie)
  const series = [...new Set(visiveis.map((t) => t.serie))]
  const adaptacao = (t: TurmaViva) => t.adaptacoes > 0 && <Selo familia="roxo" tamanho="p" title="Alunos com adaptação registrada">{t.adaptacoes} com adaptação</Selo>

  const colunas: ColunaGrade<TurmaViva>[] = [
    { titulo: 'Turma', largura: 'minmax(0,1.6fr)', celula: (t) => (
      <span className="flex min-w-0 items-center gap-2.5"><b className="font-bold tabular-nums">{t.nome}</b>{adaptacao(t)}</span>
    ) },
    { titulo: 'Turno', largura: 'minmax(0,.8fr)', celula: (t) => <span className="text-apoio">{t.turno}</span> },
    { titulo: 'Nomes', largura: 'minmax(0,.8fr)', celula: (t) => <span className={cn('tabular-nums', t.nomes ? 'text-apoio' : 'text-sutil')}>{t.nomes || '—'}</span> },
    { titulo: 'Professores', largura: 'minmax(0,1.8fr)', celula: (t) => {
      const n = nomesDosProfessores(t)
      if (n) return <span className="truncate text-apoio">{n}</span>
      return semProfessor(t) || t.criada ? <span className="text-sutil">—</span> : <span className="truncate text-sutil" title="Os professores vêm da grade horária">Pela grade horária</span>
    } },
    { titulo: 'Situação', largura: '148px', alinhar: 'fim', celula: (t) => seloDa(t) },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 max-md:overflow-y-auto">
      {!m.terminou && (
        <div className="flex min-h-12 shrink-0 items-center gap-3 rounded-[16px] border-2 border-amarelo-borda bg-amarelo-claro py-1.5 pl-3 pr-1.5">
          <span className="max-sm:hidden"><Icone id="escola" tamanho={28} /></span>
          <p className="min-w-0 flex-1 text-[15px] font-medium leading-5 text-tinta"><b className="font-bold">Para terminar:</b> {m.falta.join(' · ')}</p>
          <Botao variante="fantasma" tamanho="p" onClick={aoVerFalta}>Ver o que falta</Botao>
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Segmentado opcoes={FILTROS} valor={filtro} aoMudar={(v) => setFiltro(v)} rotulo="Situação" className="max-md:hidden" />
        <Escolha id="tu-filtro" rotulo="Situação" valor={filtro} aoMudar={(v) => setFiltro(v)} className="w-[140px] shrink-0 md:hidden [&_label]:sr-only"
          opcoes={FILTROS.map((f) => ({ valor: f.id, rotulo: f.rotulo }))} />
        <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar turma" className="w-auto min-w-0 flex-1 md:w-56 md:flex-none" />
        <Botao variante={m.terminou ? 'secundario' : 'primario'} tamanho="m" icone={<Plus strokeWidth={2.5} />} className="ml-auto max-sm:w-full" onClick={aoNova}>Nova turma</Botao>
      </div>

      <TabelaGrade rotulo="Turmas" colunas={colunas} altura={48} chave={(t) => t.id} para={(t) => `/coordenacao/escola/turmas/${t.id}`}
        grupos={series.map((s) => ({ id: s, titulo: s, linhas: visiveis.filter((t) => t.serie === s) }))} vazio="Nenhuma turma aqui."
        celular={(t) => ({
          titulo: t.nome,
          apoio: [t.turno, t.nomes ? `${t.nomes} nomes` : 'Nenhum nome', nomesDosProfessores(t)].filter(Boolean).join(' · '),
          fim: seloDa(t),
        })} />
    </div>
  )
}

function DialogoNovaTurma({ aberto, aoMudar, turmas, aoCriar }: {
  aberto: boolean; aoMudar: (v: boolean) => void; turmas: TurmaViva[]; aoCriar: (id: string) => void
}) {
  const [nome, setNome] = useState('')
  const [serie, setSerie] = useState('')
  const [turno, setTurno] = useState<'Manhã' | 'Tarde'>('Manhã')
  const [erro, setErro] = useState('')
  const normalizar = (s: string) => s.trim().replace(/\s+/g, '').replace(/(\d)[oº°]?/i, '$1º').toUpperCase()
  const fechar = (v: boolean) => { aoMudar(v); if (!v) { setNome(''); setSerie(''); setTurno('Manhã'); setErro('') } }
  const criar = () => {
    const n = normalizar(nome)
    if (!/^\dº[A-Z]$/.test(n)) return setErro('Escreva como 7ºD.')
    if (turmas.some((t) => t.nome === n)) return setErro('Esta turma já existe.')
    if (!serie) return setErro('Escolha a série.')
    const t = acoesTurmas.criar({ nome: n, serie, turno })
    fechar(false)
    aoCriar(t.id)
  }
  return (
    <Dialogo aberto={aberto} aoMudar={fechar} titulo="Nova turma" largura={460} rodape={<Botao tamanho="m" onClick={criar}>Criar turma</Botao>}>
      <form className="grid gap-4" noValidate onSubmit={(e) => { e.preventDefault(); criar() }}>
        <CampoTexto rotulo="Nome" valor={nome} aoMudar={(v) => { setNome(v); setErro('') }} placeholder="7ºD" autoFocus erro={erro && erro !== 'Escolha a série.' ? erro : undefined} />
        <Escolha id="nt-serie" rotulo="Série" valor={serie} aoMudar={(v) => { setSerie(v); setErro('') }} marcador="Escolha"
          opcoes={SERIES.map((s) => ({ valor: s, rotulo: s }))} erro={erro === 'Escolha a série.' ? erro : undefined} />
        <div role="group" aria-label="Turno" className="flex gap-2">
          {(['Manhã', 'Tarde'] as const).map((t) => <Toque key={t} selecionado={turno === t} aoMudar={() => setTurno(t)}>{t}</Toque>)}
        </div>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Dialogo>
  )
}

/* ── O que falta: os 7 passos, com a onça ──────────────────────────────────────────────────────────────── */

function Roteiro({ feitos, falta, aoAbrir }: { feitos: boolean[]; falta: number; aoAbrir: (i: number) => void }) {
  const atual = feitos.findIndex((f) => !f)
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3">
        <Onca pose="apontando" tamanho={72} rotulo="A onça" />
        <Balao>{falta === 0 ? 'A escola está montada!' : falta === 1 ? 'Falta 1 coisa.' : `Faltam ${falta} coisas.`}</Balao>
      </div>
      <Cartao semRespiro className="overflow-hidden">
        {ROTEIRO.map((p, i) => {
          const feito = feitos[i]
          const agora = i === atual
          return (
            <Linha key={p.id} onClick={() => aoAbrir(i)} chevron titulo={p.id === 'alocacao' ? 'Turmas do professor' : p.titulo}
              inicio={(
                <span className={cn('grid size-8 place-items-center rounded-full border-2 text-[15px] font-bold tabular-nums',
                  feito ? 'border-verde-degrau bg-verde text-sobre-cor' : agora ? 'border-azul-degrau bg-azul text-sobre-cor' : 'border-borda bg-white text-sutil')}>
                  {feito ? <Check aria-label="Feito" className="size-4" strokeWidth={3.5} /> : i + 1}
                </span>
              )} />
          )
        })}
      </Cartao>
    </div>
  )
}

/* ── Ano letivo e disciplinas ──────────────────────────────────────────────────────────────────────────── */

function AnoLetivo({ disciplinas, setDisciplinas, aoConvidar }: { disciplinas: string[]; setDisciplinas: (d: string[]) => void; aoConvidar: () => void }) {
  const alocs = useAlocacoes()
  const [nova, setNova] = useState('')
  const [erro, setErro] = useState('')
  const usadas = new Set(alocs.filter((a) => a.estado !== 'encerrado').map((a) => a.disciplina))
  const criar = () => {
    const d = nova.trim()
    if (!d) return setErro('Digite o nome.')
    if (disciplinas.some((x) => semAcento(x) === semAcento(d))) return setErro('Já existe.')
    setDisciplinas([...disciplinas, d]); setNova(''); setErro('')
  }
  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <h3 className="t-rotulo text-sutil">Ano letivo</h3>
        <Cartao semRespiro className="overflow-hidden">
          {ANOS_LETIVOS.map((a) => (
            <Linha key={a.ano} titulo={String(a.ano)} abaixo={<span className="tabular-nums">{a.inicio} a {a.fim}</span>}
              fim={<Selo familia={a.situacao === 'em_curso' ? 'verde' : a.situacao === 'planejado' ? 'amarelo' : 'neutro'} tamanho="p">{SITUACAO_DO_ANO[a.situacao]}</Selo>} />
          ))}
        </Cartao>
      </section>
      <section className="grid gap-2">
        <h3 className="t-rotulo flex items-center gap-1.5 text-sutil"><Lock aria-hidden className="size-4" strokeWidth={2.5} />Séries</h3>
        <div className="flex flex-wrap gap-2">{SERIES.map((s) => <Selo key={s} className="normal-case tracking-normal">{s}</Selo>)}</div>
      </section>
      <section className="grid gap-2">
        <h3 className="t-rotulo text-sutil">Disciplinas</h3>
        <Cartao semRespiro className="overflow-hidden">
          {disciplinas.map((d) => {
            // as da BNCC ficam travadas, como as séries; só a que a escola acabou de criar sai
            const nova = !DISCIPLINAS.includes(d)
            if (usadas.has(d)) return <Linha key={d} titulo={d} className="min-h-12" fim={<Selo familia="verde" tamanho="p">Com professor</Selo>} />
            if (nova) {
              return <Linha key={d} titulo={d} className="min-h-12"
                fim={<BotaoIcone rotulo={`Excluir ${d}`} onClick={() => setDisciplinas(disciplinas.filter((x) => x !== d))}><Trash2 strokeWidth={2.5} /></BotaoIcone>} />
            }
            return <Linha key={d} titulo={d} className="min-h-12" onClick={aoConvidar} chevron fim={<Selo familia="amarelo" tamanho="p">Sem professor</Selo>} />
          })}
        </Cartao>
        <form className="flex items-start gap-2" onSubmit={(e) => { e.preventDefault(); criar() }}>
          <CampoTexto rotulo="Nova disciplina" rotuloOculto valor={nova} aoMudar={(v) => { setNova(v); setErro('') }} placeholder="Nova disciplina" erro={erro || undefined} className="flex-1" />
          <Botao type="submit" variante="secundario" tamanho="g" icone={<Plus strokeWidth={2.5} />}>Criar</Botao>
        </form>
      </section>
    </div>
  )
}

/* ── Grade e calendário, com IMPORTAR A GRADE ──────────────────────────────────────────────────────────── */

const GRADE_2B = [['7h30', 'Mat', 'Quí', 'Port', 'Fís', 'Mat'], ['8h20', 'Mat', 'Quí', 'Hist', 'Fís', 'Bio'], ['9h10', 'Port', 'Geo', 'Quí', 'Ing', 'Bio']]
const MUDOU = [{ onde: '2ºB · qua 9h10', de: 'Quí', para: 'Bio' }, { onde: '1ºC · sex 7h30', de: 'Geo', para: 'Quí' }]
const CALENDARIO = [['3º bimestre', '03/08 a 02/10'], ['Semana de provas', '28/09 a 02/10'], ['Feriado', '12/10'], ['4º bimestre', '05/10 a 11/12']]

function TabelaHorario({ grade }: { grade: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-separate border-spacing-1 text-center text-[14px] font-bold">
        <thead><tr>{['2ºB', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((d) => <th key={d} className="t-selo pb-1 text-sutil">{d}</th>)}</tr></thead>
        <tbody>
          {grade.map((l) => (
            <tr key={l[0]}>{l.map((c, i) => (
              <td key={i} className={cn('rounded-[8px] px-1 py-2', i === 0 ? 'tabular-nums text-sutil' : c === 'Quí' ? 'bg-turquesa-claro text-turquesa-texto' : 'bg-fundo-suave text-apoio')}>{c}</td>
            ))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Grade() {
  const [etapa, setEtapa] = useState<'ver' | 'previa' | 'gravada'>('ver')
  const [arquivo, setArquivo] = useState('grade-2026.xlsx')
  const entrada = useRef<HTMLInputElement>(null)
  const nova = useMemo(() => GRADE_2B.map((l) => (l[0] === '9h10' ? l.map((c, i) => (i === 3 ? 'Bio' : c)) : l)), [])
  const ler = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setArquivo(f.name); setEtapa('previa') }
    e.target.value = ''
  }
  return (
    <div className="grid gap-6">
      <input ref={entrada} id="grade-arquivo" type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={ler} aria-label="Planilha da grade" />
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="t-cartao min-w-0 flex-1">Grade horária</h3>
          {etapa === 'previa' ? <Selo familia="azul" tamanho="p">Prévia</Selo> : <Selo familia="verde" tamanho="p">{etapa === 'gravada' ? 'Gravada agora' : 'Em uso'}</Selo>}
        </div>
        {etapa === 'gravada' && <div className="overflow-hidden rounded-[16px] border-2 border-verde-borda"><FaixaResultado tipo="certo" titulo="Grade gravada" className="border-t-0">A semana dos professores já mudou.</FaixaResultado></div>}
        <p className="t-apoio"><FileSpreadsheet aria-hidden className="mr-1.5 inline size-4 align-[-3px]" strokeWidth={2.5} />{arquivo} · 138 aulas · 22 turmas</p>
        <TabelaHorario grade={etapa === 'ver' ? GRADE_2B : nova} />
        {etapa === 'previa' && (
          <Cartao semRespiro className="overflow-hidden">
            {MUDOU.map((x) => <Linha key={x.onde} titulo={x.onde} fim={<span className="t-cartao"><span className="text-sutil line-through">{x.de}</span> → {x.para}</span>} className="min-h-12" />)}
          </Cartao>
        )}
        <div className="flex flex-wrap gap-2">
          {etapa === 'previa'
            ? <><Botao variante="secundario" tamanho="m" onClick={() => setEtapa('ver')}>Cancelar</Botao><Botao tamanho="m" onClick={() => setEtapa('gravada')}>Gravar grade</Botao></>
            : <>
              <Botao variante="secundario" tamanho="m" icone={<FileSpreadsheet strokeWidth={2.5} />} onClick={() => entrada.current?.click()}>Importar a grade</Botao>
              <Botao variante="fantasma" tamanho="m" onClick={() => { setArquivo('grade-2026-exemplo.xlsx'); setEtapa('previa') }}>Usar a de exemplo</Botao>
            </>}
        </div>
      </section>
      <section className="grid gap-2">
        <h3 className="t-cartao">Calendário letivo</h3>
        <Cartao semRespiro className="overflow-hidden">
          {CALENDARIO.map(([n, d]) => <Linha key={n} titulo={n} fim={<span className="t-apoio tabular-nums">{d}</span>} className="min-h-12" />)}
        </Cartao>
      </section>
    </div>
  )
}

/* ── Importar listas de várias turmas (4 passos) ───────────────────────────────────────────────────────── */

const PASSOS_IMPORTAR = ['Arquivo', 'Colunas', 'Turmas', 'Importar']
const COLUNAS = [{ coluna: 'A · "Nome do aluno"', vira: 'nome' }, { coluna: 'B · "Matr."', vira: 'matricula' }, { coluna: 'C · "Turma"', vira: 'turma' }, { coluna: 'D · "E-mail"', vira: 'nao' }]
const VIRA = [{ valor: 'nome', rotulo: 'Nome' }, { valor: 'matricula', rotulo: 'Matrícula' }, { valor: 'turma', rotulo: 'Turma' }, { valor: 'nao', rotulo: 'Não importar' }]
/** A planilha traz as listas de sempre de 3 turmas e um nome novo em cada. */
const PLANILHA = [
  { turmaId: 'au-1a', veio: ['1 A', '1º A'], novo: { nome: 'Otávio Prado', matricula: '2026-0951' } },
  { turmaId: 'au-2c', veio: ['2o C', '2ºC'], novo: { nome: 'Laura Bastos', matricula: '2026-0952' } },
  { turmaId: 'au-2d', veio: ['2 ano D'], novo: { nome: 'Rui Teixeira', matricula: '2026-0953' } },
]

function ImportarListas({ aoFechar }: { aoFechar: () => void }) {
  const turmas = useTurmasDaEscola()
  const [passo, setPasso] = useState(0)
  const [arquivo, setArquivo] = useState<string | null>(null)
  const [vira, setVira] = useState(COLUNAS.map((c) => c.vira))
  const [conferidas, setConferidas] = useState<string[]>([])
  const [feito, setFeito] = useState<number | null>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const linhas = PLANILHA.reduce((s, p) => s + (turmas.find((t) => t.id === p.turmaId)?.nomes ?? 0), 0) + (feito === null ? PLANILHA.length : 0)
  const novos = PLANILHA.filter((p) => !listaDe(p.turmaId).some((n) => n.matricula === p.novo.matricula))
  const nomeDe = (id: string) => turmas.find((t) => t.id === id)?.nome ?? id
  const podeSeguir = passo === 0 ? !!arquivo : passo === 2 ? conferidas.length === PLANILHA.length : true

  const importar = () => {
    for (const p of novos) listas.acrescentar(p.turmaId, [p.novo])
    setFeito(novos.length)
  }

  return (
    <div className="grid gap-5">
      <Passos passos={PASSOS_IMPORTAR} atual={feito !== null ? 4 : passo} aoIr={feito === null ? setPasso : undefined} />
      <input ref={entrada} id="listas-arquivo" type="file" accept=".xlsx,.xls,.csv" className="sr-only" aria-label="Planilha das listas"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setArquivo(f.name); e.target.value = '' }} />

      {passo === 0 && (
        <div className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Botao variante="secundario" tamanho="g" icone={<FileSpreadsheet strokeWidth={2.5} />} onClick={() => entrada.current?.click()}>
              {arquivo ?? 'Escolher planilha'}
            </Botao>
            {!arquivo && <Botao variante="fantasma" tamanho="g" onClick={() => setArquivo('listas-exemplo.xlsx')}>Usar a de exemplo</Botao>}
          </div>
          <p className="t-apoio">Só nome, matrícula e turma.</p>
        </div>
      )}
      {passo === 1 && (
        <div className="grid gap-3">
          {COLUNAS.map((c, i) => (
            <Escolha key={c.coluna} id={`col-${i}`} rotulo={`Coluna ${c.coluna}`} valor={vira[i]} aoMudar={(v) => setVira((x) => x.map((y, j) => (j === i ? v : y)))} opcoes={VIRA} />
          ))}
          <Aviso tom="info">E-mail fica de fora: aluno não tem.</Aviso>
        </div>
      )}
      {passo === 2 && (
        <Cartao semRespiro className="overflow-hidden">
          {PLANILHA.map((p) => {
            const ok = conferidas.includes(p.turmaId)
            return (
              <Linha key={p.turmaId} titulo={`${p.veio.join(' · ')} → ${nomeDe(p.turmaId)}`}
                fim={ok ? <Selo familia="verde" tamanho="p">Conferida</Selo>
                  : <Botao variante="secundario" tamanho="p" onClick={() => setConferidas((x) => [...x, p.turmaId])}>É a mesma</Botao>} />
            )
          })}
        </Cartao>
      )}
      {passo === 3 && (feito !== null
        ? <div className="overflow-hidden rounded-[16px] border-2 border-verde-borda"><FaixaResultado tipo="certo" titulo={feito ? `${feito} nomes novos` : 'Nada novo'} className="border-t-0">As listas já estão nas turmas.</FaixaResultado></div>
        : (
          <Cartao semRespiro className="overflow-hidden">
            <Linha titulo={`${linhas} linhas · ${PLANILHA.length} turmas`} abaixo={<span>{linhas - novos.length} já estavam</span>}
              fim={<Selo familia={novos.length ? 'azul' : 'neutro'} tamanho="p">{novos.length} novos</Selo>} />
            {novos.map((p) => <Linha key={p.novo.matricula} titulo={p.novo.nome} abaixo={<span className="tabular-nums">{p.novo.matricula}</span>} fim={<Selo tamanho="p">{nomeDe(p.turmaId)}</Selo>} />)}
          </Cartao>
        ))}

      <div className="flex flex-wrap justify-end gap-2">
        {feito !== null
          ? <Botao variante="secundario" tamanho="m" onClick={aoFechar}>Fechar</Botao>
          : passo < 3
            ? <Botao variante="secundario" tamanho="m" disabled={!podeSeguir} onClick={() => setPasso(passo + 1)}>Continuar</Botao>
            : <Botao tamanho="m" disabled={!novos.length} onClick={importar}>{novos.length ? `Importar ${novos.length} nomes` : 'Nada novo'}</Botao>}
      </div>
    </div>
  )
}
