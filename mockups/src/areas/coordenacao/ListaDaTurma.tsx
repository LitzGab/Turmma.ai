import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, FileUp, MessageCircleQuestion, Plus, TriangleAlert } from 'lucide-react'
import {
  Aviso, Avatar, Botao, Busca, CabecalhoPagina, CampoTexto, CelulaLimiar, Dialogo, DialogoConfirmar, FaixaResultado, Opcao, Pagina, Selo, Toque,
} from '@/components/duo'
import { useParametro } from '@/components/turmma/tela'
import { listas, pedidos as acoesPedidos, usePedidos, type AlunoDaTurma, type PedidoNome } from '@/dados/acesso'
import { painelDa, passaDoLimiar, valorDaColuna } from '@/dados/gestao'
import { ehColunaComNome, type ColunaComNome } from '@/dados/gestao-escola'
import { MAXIMO_DE_PEDIDOS_POR_DECISAO } from '@/dados/estrutura'
import { TIPOS_ADAPTACAO } from '@/dados/ferramentas'
import { useAdaptacoes, useProfessoresDaEscola, useTurmaDaEscola, useTurmasDaEscola, type TurmaViva } from '@/dados/escola-estado'
import { cn } from '@/lib/utils'
import { CABECALHO_NO_SINO, CorpoNoSino, ERRO_DA_LINHA, lerColagem, matriculasDeOutras, semAcento, TabelaGrade, useAlunosVivos, type ColunaGrade, type LinhaDaPrevia } from './_estrutura-pecas'
import { PainelAluno } from './Adaptacoes'
import { ListaComMotivo, type PedidoDeLista } from './_lista-com-motivo'

/* A TURMA, vista pela coordenação (12ª rodada, 04/10/2026; plano 5.3): ‹ Escola · "3ºA" · "3º ano EM · Manhã".
   · PEDIDOS PARA ENTRAR só quando a turma não tem professor confirmado (decisão do dono: quem aprova é o professor;
     a coordenação, só na turma sem professor, como a 6ºB). Com professor, uma linha: "3 pedidos esperando a Prof. Camila."
   · A LISTA: busca, ACRESCENTAR NOMES (um ou vários, colando, com prévia) e a tabela nome · matrícula · situação.
     Saíram a coluna Nº e os cadeados (a explicação foi para o painel do aluno).
   · Turma sem lista (a 3ºA) abre em COLAR A LISTA: a prévia aponta o erro linha a linha e GRAVAR LISTA só acende limpa.
   · Ao lado, os professores com CONFIRMOU ou FALTA CONFIRMAR. A linha do aluno abre o painel (?aluno=).
   · 14ª rodada (plano ux-composicao, 5.2): o aviso (pedidos, lista gravada) na largura toda, acima das duas colunas;
     busca, "N de M entraram" e ACRESCENTAR NOMES numa linha, também na largura toda; a tabela e "Professores" com o
     cabeçalho de 40 na mesma altura. O ‹ ESCOLA dentro da coluna, na linha de cima do título: a página começa
     na mesma borda da Escola (288 a 1440).
   · ⋯ › Exportar lista leva a Registros › Exportar, com finalidade e registro (auditoria T3). */

const COORDENACAO = { nome: 'Helena Martins', papel: 'coordenacao' as const }
const SITUACAO: Record<AlunoDaTurma['situacao'], { texto: string; familia: 'verde' | 'amarelo' | 'neutro' }> = {
  'na-turma': { texto: 'Na turma', familia: 'verde' },
  pediu: { texto: 'Pediu para entrar', familia: 'amarelo' },
  livre: { texto: 'Livre', familia: 'neutro' },
}
const ESTADO_DO_PROFESSOR = {
  confirmado: { texto: 'Confirmou', familia: 'verde' },
  pendente: { texto: 'Falta confirmar', familia: 'amarelo' },
  contestado: { texto: 'Contestou', familia: 'vermelho' },
  encerrado: { texto: 'Encerrada', familia: 'neutro' },
} as const
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
/** "Enunciado direto, Menos itens por página" (a lista fechada, por extenso). */
const nomesDaAdaptacao = (tipos: string[]) => tipos.map((t, i) => { const n = TIPOS_ADAPTACAO.find((x) => x.id === t)?.nome ?? t; return i ? n.toLowerCase() : n }).join(', ')

const PAINEL_ESCOLA = painelDa('escola')

export function ListaDaTurma() {
  const { turma: id = '' } = useParams()
  const turma = useTurmaDaEscola(id)
  if (!turma) {
    return (
      <Pagina tipo="painel" cabecalho={<CabecalhoPagina voltar={{ para: '/coordenacao/escola', rotulo: 'Escola' }} titulo="Turma não encontrada" />}>
        <Aviso tom="erro">Esta turma não está no ano letivo em curso.</Aviso>
      </Pagina>
    )
  }
  return <Turma key={id} turma={turma} />
}

function Turma({ turma }: { turma: TurmaViva }) {
  const navigate = useNavigate()
  const alunos = useAlunosVivos(turma.id)
  const esperando = usePedidos(turma.id)
  const profs = useProfessoresDaEscola()
  const [alunoId, setAlunoId] = useParametro('aluno')
  const [gravada, setGravada] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [acrescentando, setAcrescentando] = useState(false)
  const aluno = alunos.find((n) => n.id === alunoId) ?? null
  const vazia = alunos.length === 0
  const confirmado = turma.professores.find((p) => p.estado === 'confirmado')
  const tratamento = confirmado ? profs.find((p) => p.id === confirmado.profId)?.tratamento : undefined
  const prof = confirmado ? `${tratamento === 'professor' ? 'o Prof.' : 'a Prof.'} ${confirmado.nome.split(' ')[0]}` : ''
  const entraram = alunos.filter((n) => n.situacao === 'na-turma').length

  return (
    <Pagina tipo="painel" rolagem="nenhuma" cabecalho={(
      <CabecalhoPagina voltar={{ para: '/coordenacao/escola', rotulo: 'Escola' }} titulo={turma.nome} className={CABECALHO_NO_SINO}
        complemento={`${turma.serie} · ${turma.turno}${vazia ? '' : ` · ${plural(alunos.length, 'nome', 'nomes')}`}`}
        menu={vazia ? undefined : [{ rotulo: 'Exportar lista', aoEscolher: () => navigate(`/coordenacao/registros?exportar=1&conjunto=lista:${turma.id}`) }]} />
    )}>
      <CorpoNoSino className="gap-3 max-md:overflow-y-auto">
        <NoPainel turma={turma} />
        {/* o aviso vale para a turma inteira: na largura toda, acima das duas colunas */}
        {gravada !== null && (
          <div className="shrink-0 overflow-hidden rounded-[16px] border-2 border-verde-borda">
            <FaixaResultado tipo="certo" titulo={`Lista gravada · ${gravada} nomes`} className="border-t-0"
              acao={<Botao variante="fantasma" tamanho="p" onClick={() => setGravada(null)}>Fechar</Botao>} />
          </div>
        )}
        {esperando.length > 0 && (confirmado
          ? <Aviso tom="info" className="shrink-0">{plural(esperando.length, 'pedido esperando', 'pedidos esperando')} {prof}.</Aviso>
          : <Pedidos turma={turma} pedidos={esperando} />)}

        {!vazia && (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar nome ou matrícula" className="min-w-0 max-sm:basis-full sm:w-72 sm:flex-none" />
            <p className="t-apoio"><b className="font-bold tabular-nums text-tinta">{entraram}</b> de {alunos.length} entraram</p>
            <Botao variante="secundario" tamanho="m" icone={<Plus strokeWidth={2.5} />} className="ml-auto max-sm:w-full" onClick={() => setAcrescentando(true)}>Acrescentar nomes</Botao>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-3 max-md:flex-none md:grid md:grid-cols-[minmax(0,1fr)_340px] md:grid-rows-[minmax(0,1fr)] md:items-start md:gap-6">
          {vazia
            ? <Colar turma={turma} aoGravar={setGravada} />
            : <Lista turma={turma} alunos={alunos} busca={busca} ativa={alunoId} aoAbrir={(n) => setAlunoId(n.id)} />}
          <div className="flex min-h-0 flex-col gap-3 md:max-h-full">
            <Professores turma={turma} />
            {!vazia && <NestaTurma turma={turma} alunos={alunos} aoAbrir={(id) => setAlunoId(id)} />}
          </div>
        </div>
      </CorpoNoSino>

      {!vazia && <DialogoAcrescentar aberto={acrescentando} aoMudar={setAcrescentando} turma={turma} alunos={alunos} />}
      <PainelAluno turma={turma} aluno={aluno} aoFechar={() => setAlunoId(null)} />
    </Pagina>
  )
}

/** A linha da turma no Painel (as mesmas contagens da tabela "Por turma", dados/gestao.ts), numa faixa de 48: quem
    chega pela linha do Painel reconhece a turma. A contagem com nome abre a lista depois do MOTIVO (D34); a célula
    só ganha cor ao passar do limiar. Nenhuma média. */
function NoPainel({ turma }: { turma: TurmaViva }) {
  const [lista, setLista] = useState<PedidoDeLista | null>(null)
  const linha = PAINEL_ESCOLA.linhas.find((l) => l.id === turma.id)
  if (!linha?.dados) return null
  const pergunta = turma.id === '2b' ? 'O que fazer com o 2ºB?' : `Quantos alunos do ${turma.nome} estão abaixo de 75% de frequência?`
  return (
    <section aria-label={`${turma.nome} no Painel`}
      className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-4 gap-y-1 rounded-[16px] border-2 border-borda bg-white py-1 pl-4 pr-1">
      <span className="t-selo text-sutil">No Painel</span>
      {PAINEL_ESCOLA.colunas.map((c) => {
        const v = valorDaColuna(linha, c.id)
        const passou = passaDoLimiar(c, v, linha.alunos)
        const celula = <CelulaLimiar valor={v} passou={passou} titulo={c.limiar} className="h-6 text-[15px]" />
        return (
          <span key={c.id} title={c.titulo} className="flex items-center gap-1 whitespace-nowrap text-[13px] font-bold uppercase tracking-[.04em] text-sutil">
            {c.rotulo}
            {v && ehColunaComNome(c.id)
              ? <button type="button" onClick={() => setLista({ coluna: c.id as ColunaComNome, turmaId: turma.id })} aria-label={`${c.titulo}: ${v}. Ver os nomes, com motivo`}
                  className="rounded-[8px] transition-colors hover:bg-fundo-suave focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-azul">{celula}</button>
              : celula}
          </span>
        )
      })}
      <Botao variante="fantasma" tamanho="p" asChild icone={<MessageCircleQuestion strokeWidth={2.5} />} className="ml-auto max-sm:-ml-3">
        <Link to={`/coordenacao/analista?pergunta=${encodeURIComponent(pergunta)}`}>Perguntar ao Analista</Link>
      </Botao>
      <ListaComMotivo pedido={lista} aoFechar={() => setLista(null)} />
    </section>
  )
}

/** Os professores da turma, com o cabeçalho na altura do da tabela (40 px). */
function Professores({ turma }: { turma: TurmaViva }) {
  return (
    <aside aria-label="Professores da turma" className="flex shrink-0 flex-col overflow-hidden rounded-[16px] border-2 border-borda bg-white md:max-h-full">
      <h2 className="t-selo flex h-10 shrink-0 items-center border-b-2 border-borda px-4 text-sutil">Professores · {turma.professores.length}</h2>
      {turma.professores.length === 0
        ? <p className="t-apoio px-4 py-4">Nenhum professor ainda.</p>
        : (
          <ul className="min-h-0 overflow-y-auto">
            {turma.professores.map((p) => {
              const e = ESTADO_DO_PROFESSOR[p.estado]
              return (
                <li key={`${p.profId}-${p.disciplina}`} className="border-t-2 border-borda first:border-t-0">
                  <Link to={`/coordenacao/escola?aba=professores&prof=${p.profId}`}
                    className="flex h-16 items-center gap-3 px-4 transition-colors duration-150 hover:bg-fundo-suave">
                    <Avatar nome={p.nome} tamanho={32} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-bold leading-5 text-tinta">{p.nome}</span>
                      <span className="t-apoio truncate">{p.disciplina}</span>
                    </span>
                    <Selo familia={e.familia} tamanho="p">{e.texto}</Selo>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
    </aside>
  )
}

/** Sob os professores: quem tem adaptação nesta turma, por extenso (abre o painel do aluno). Os pedidos já estão no
    aviso do topo e "entraram" na linha da busca: aqui não se repetem. */
function NestaTurma({ turma, alunos, aoAbrir }: { turma: TurmaViva; alunos: AlunoDaTurma[]; aoAbrir: (id: string) => void }) {
  const adapt = useAdaptacoes(turma.id)
  return (
    <section aria-label="Com adaptação" className="flex min-h-0 shrink flex-col overflow-hidden rounded-[16px] border-2 border-borda bg-white">
      <h2 className="t-selo flex h-10 shrink-0 items-center border-b-2 border-borda px-4 text-sutil">Com adaptação · {adapt.length}</h2>
      {adapt.length === 0
        ? <p className="t-apoio px-4 py-4">Ninguém nesta turma.</p>
        : (
          <ul className="min-h-0 overflow-y-auto">
            {adapt.map((a) => {
              const n = alunos.find((x) => x.nome === a.aluno)
              return (
                <li key={a.aluno} className="border-t-2 border-borda first:border-t-0">
                  <button type="button" disabled={!n} onClick={() => n && aoAbrir(n.id)}
                    className="group/linha flex min-h-16 w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-150 hover:bg-fundo-suave">
                    <Avatar nome={a.aluno} tamanho={32} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-bold leading-5 text-tinta">{a.aluno}</span>
                      <span className="t-apoio line-clamp-2">{nomesDaAdaptacao(a.tipos)}</span>
                    </span>
                    <ChevronRight aria-hidden strokeWidth={2.5} className="size-5 shrink-0 text-apagado transition-transform duration-150 group-hover/linha:translate-x-0.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
    </section>
  )
}

/* ── Pedidos para entrar (só na turma sem professor confirmado) ─────────────────────────────────────────── */

function Pedidos({ turma, pedidos }: { turma: TurmaViva; pedidos: PedidoNome[] }) {
  const [marcados, setMarcados] = useState<string[]>([])
  const [decisao, setDecisao] = useState<'aprovar' | 'recusar' | null>(null)
  const [feito, setFeito] = useState<string | null>(null)
  const n = marcados.filter((id) => pedidos.some((p) => p.id === id)).length
  const marcar = (id: string, m: boolean) => setMarcados((x) => (m ? (x.length >= MAXIMO_DE_PEDIDOS_POR_DECISAO ? x : [...x, id]) : x.filter((y) => y !== id)))
  const decidir = () => {
    if (!decisao) return
    acoesPedidos.decidir(turma.id, marcados, decisao, COORDENACAO)
    setFeito(decisao === 'aprovar' ? plural(n, 'aprovado', 'aprovados') : plural(n, 'recusado', 'recusados'))
    setMarcados([])
  }
  return (
    <section aria-label="Pedidos para entrar" className="flex max-h-[40%] shrink-0 flex-col overflow-hidden rounded-[16px] border-2 border-borda bg-white max-md:max-h-none">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b-2 border-borda px-4 py-2">
        <h2 className="t-cartao min-w-0 flex-1 text-tinta">Pedidos para entrar · {pedidos.length}</h2>
        {feito && <Selo familia="verde">{feito}</Selo>}
        <Botao variante="perigo" tamanho="p" disabled={n === 0} onClick={() => setDecisao('recusar')}>Recusar</Botao>
        <Botao variante="oficial" tamanho="p" disabled={n === 0} onClick={() => setDecisao('aprovar')}>Aprovar marcados</Botao>
      </header>
      <div className="grid min-h-0 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
        {pedidos.map((p) => (
          <Opcao key={p.id} tipo="checkbox" marcado={marcados.includes(p.id)} aoMudar={(m) => marcar(p.id, m)}>
            <span className="grid gap-0.5">
              <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                {p.nome}
                {p.matriculaErrada && <Selo familia="amarelo" tamanho="p">Matrícula diferente</Selo>}
              </span>
              <span className="t-apoio tabular-nums">{p.matricula ? `${p.matricula} · ` : ''}{p.quando}</span>
            </span>
          </Opcao>
        ))}
      </div>
      <DialogoConfirmar aberto={!!decisao} aoMudar={(v) => { if (!v) setDecisao(null) }}
        titulo={`${decisao === 'aprovar' ? 'Aprovar' : 'Recusar'} ${plural(n, 'pedido', 'pedidos')} do ${turma.nome}?`}
        frase={decisao === 'aprovar'
          ? `${n === 1 ? 'Passa' : 'Passam'} a entrar com a matrícula e a senha que ${n === 1 ? 'criou' : 'criaram'}.`
          : `O nome volta à lista, livre para pedir de novo.`}
        confirmar={{ rotulo: decisao === 'aprovar' ? `Aprovar ${plural(n, 'pedido', 'pedidos')}` : 'Recusar', variante: decisao === 'aprovar' ? 'oficial' : 'perigoCheio', aoConfirmar: decidir }} />
    </section>
  )
}

/* ── A lista de nomes ──────────────────────────────────────────────────────────────────────────────────── */

function Lista({ turma, alunos, busca, ativa, aoAbrir }: { turma: TurmaViva; alunos: AlunoDaTurma[]; busca: string; ativa: string | null; aoAbrir: (n: AlunoDaTurma) => void }) {
  const adapt = useAdaptacoes(turma.id)
  const comAdaptacao = new Set(adapt.map((a) => a.aluno))
  const visiveis = alunos.filter((n) => !busca.trim() || semAcento(n.nome).includes(semAcento(busca)) || n.matricula.includes(busca.trim()))
  const selo = (n: AlunoDaTurma) => <Selo familia={SITUACAO[n.situacao].familia} tamanho="p">{SITUACAO[n.situacao].texto}</Selo>
  const adaptacao = (n: AlunoDaTurma) => comAdaptacao.has(n.nome) && <Selo familia="roxo" tamanho="p">Adaptação</Selo>

  const colunas: ColunaGrade<AlunoDaTurma>[] = [
    { titulo: 'Nome', largura: 'minmax(0,2.4fr)', celula: (n) => (
      <span className="flex min-w-0 items-center gap-2.5"><span className="truncate font-bold">{n.nome}</span>{adaptacao(n)}</span>
    ) },
    { titulo: 'Matrícula', largura: 'minmax(0,1fr)', celula: (n) => <span className="tabular-nums text-apoio">{n.matricula}</span> },
    { titulo: 'Situação', largura: '156px', alinhar: 'fim', celula: selo },
  ]

  return (
    <TabelaGrade rotulo={`Lista do ${turma.nome}`} colunas={colunas} grupos={[{ id: 'todos', linhas: visiveis }]} chave={(n) => n.id} altura={48}
      aoAbrir={aoAbrir} ativa={ativa} vazio="Nenhum nome com esta busca." className="md:max-h-full max-md:shrink-0"
      celular={(n) => ({ titulo: n.nome, apoio: n.matricula, fim: <>{adaptacao(n)}{selo(n)}</> })} />
  )
}

/** A prévia linha a linha, com a linha de erro em vermelho. */
function Previa({ linhas, soErro, className }: { linhas: LinhaDaPrevia[]; soErro: boolean; className?: string }) {
  const lista = soErro ? linhas.filter((l) => l.erro) : linhas
  return (
    <ol className={cn('min-h-0 overflow-y-auto rounded-[16px] border-2 border-borda bg-white', className)} aria-label="Prévia">
      {lista.map((l) => (
        <li key={l.linha} className={cn('grid min-h-12 grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 border-t-2 border-borda px-4 py-2 first:border-t-0 sm:grid-cols-[40px_minmax(0,1fr)_120px_minmax(0,220px)]',
          l.erro && 'bg-vermelho-claro')}>
          <span className={cn('tabular-nums', l.erro ? 'font-bold text-vermelho-texto' : 't-apoio')}>{l.linha}</span>
          <span className="truncate text-[15px] font-bold text-tinta">{l.nome || '—'}</span>
          <span className={cn('text-[15px] font-medium tabular-nums', l.erro ? 'text-vermelho-texto' : 'text-apoio')}>{l.matricula || '—'}</span>
          {l.erro && (
            <span className="col-span-3 flex items-center gap-1.5 text-[14px] font-bold text-vermelho-texto sm:col-span-1">
              <TriangleAlert aria-hidden className="size-4 shrink-0" strokeWidth={2.5} />{ERRO_DA_LINHA[l.erro]}
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

/** O que a prévia diz e se a lista pode ser gravada. */
function usePrevia(turmaId: string, extras: string[] = []) {
  const todas = useTurmasDaEscola()
  const [texto, setTexto] = useState('')
  const [previa, setPrevia] = useState<{ texto: string; linhas: LinhaDaPrevia[] } | null>(null)
  const [soErro, setSoErro] = useState(false)
  const erros = previa?.linhas.filter((l) => l.erro).length ?? 0
  const atual = !!previa && previa.texto === texto
  const ver = () => {
    const usadas = matriculasDeOutras(turmaId, todas.map((t) => t.id))
    for (const m of extras) usadas.add(m)
    setPrevia({ texto, linhas: lerColagem(texto, usadas) })
    setSoErro(false)
  }
  const pronta = atual && erros === 0 && (previa?.linhas.length ?? 0) > 0
  return { texto, setTexto, previa, ver, erros, atual, pronta, soErro, setSoErro, zerar: () => { setTexto(''); setPrevia(null) } }
}

function Contagem({ p }: { p: ReturnType<typeof usePrevia> }) {
  if (!p.previa) return null
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3">
      <p className="t-cartao">
        {plural(p.previa.linhas.length, 'linha', 'linhas')}
        <span className="text-sutil"> · </span>
        <span className={p.erros ? 'text-vermelho-texto' : 'text-verde-texto'}>{p.erros ? plural(p.erros, 'com erro', 'com erro') : 'nenhum erro'}</span>
      </p>
      {!p.atual && <Selo familia="amarelo" tamanho="p">O texto mudou</Selo>}
      {p.erros > 0 && <Toque selecionado={p.soErro} aoMudar={() => p.setSoErro(!p.soErro)} className="ml-auto">Só com erro</Toque>}
    </div>
  )
}

/* ── Colar a lista (turma sem lista) ───────────────────────────────────────────────────────────────────── */

function Colar({ turma, aoGravar }: { turma: TurmaViva; aoGravar: (n: number) => void }) {
  const p = usePrevia(turma.id)
  const arquivo = useRef<HTMLInputElement>(null)
  const ler = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) p.setTexto((await f.text()).trim())
    e.target.value = ''
  }
  const gravar = () => {
    if (!p.previa || !p.pronta) return
    listas.gravar(turma.id, p.previa.linhas.map((l) => ({ nome: l.nome, matricula: l.matricula })))
    aoGravar(p.previa.linhas.length)
  }
  return (
    <section aria-label="Colar a lista" className="flex min-h-0 flex-col overflow-hidden rounded-[16px] border-2 border-borda bg-white max-md:shrink-0 md:max-h-full">
      <header className="flex h-10 shrink-0 items-center gap-3 border-b-2 border-borda px-4">
        <h2 className="t-selo min-w-0 flex-1 text-sutil">Colar a lista</h2>
        <Selo familia="amarelo" tamanho="p">Sem lista</Selo>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <CampoTexto rotulo="Um aluno por linha: nome; matrícula" valor={p.texto} aoMudar={p.setTexto} linhas={4} spellCheck={false}
          placeholder={'Alice Monteiro; 2026-0801\nBernardo Pires; 2026-0802'}
          className={cn('[&_textarea]:font-mono [&_textarea]:text-[15px]', p.previa
            ? 'shrink-0 [&_textarea]:h-[104px] [&_textarea]:min-h-0'
            : 'shrink-0 [&_textarea]:h-[288px] [&_textarea]:min-h-0')} />
        <div className="flex shrink-0 flex-wrap gap-2">
          <input ref={arquivo} type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={ler} aria-label="Arquivo CSV" />
          <Botao variante="secundario" tamanho="m" icone={<FileUp strokeWidth={2.5} />} onClick={() => arquivo.current?.click()}>Enviar arquivo CSV</Botao>
          <Botao variante="secundario" tamanho="m" disabled={!p.texto.trim()} onClick={p.ver}>Ver a prévia</Botao>
          <Botao tamanho="m" className="ml-auto" disabled={!p.pronta} onClick={gravar}>Gravar lista</Botao>
        </div>
        <Contagem p={p} />
        {p.previa
          ? <Previa linhas={p.previa.linhas} soErro={p.soErro} className="flex-1 max-md:max-h-[420px]" />
          : (
            <div className="grid shrink-0 gap-1 rounded-[12px] bg-fundo-suave px-4 py-3">
              <p className="t-selo text-sutil">O formato</p>
              <p className="t-corpo text-tinta">Um aluno por linha: o nome, ponto e vírgula, a matrícula.</p>
              <p className="t-apoio">Do sistema da secretaria, exporte em CSV com as colunas Nome e Matrícula. A prévia aponta o erro linha a linha antes de gravar.</p>
            </div>
          )}
      </div>
    </section>
  )
}

/* ── Acrescentar nomes: um ou vários, colando ──────────────────────────────────────────────────────────── */

function DialogoAcrescentar({ aberto, aoMudar, turma, alunos }: { aberto: boolean; aoMudar: (v: boolean) => void; turma: TurmaViva; alunos: AlunoDaTurma[] }) {
  const daTurma = useMemo(() => alunos.map((a) => a.matricula), [alunos])
  const p = usePrevia(turma.id, daTurma)
  const fechar = (v: boolean) => { aoMudar(v); if (!v) p.zerar() }
  const n = p.previa?.linhas.length ?? 0
  return (
    <Dialogo aberto={aberto} aoMudar={fechar} titulo={`Acrescentar nomes ao ${turma.nome}`} largura={600}
      rodape={(
        <>
          <Botao variante="secundario" tamanho="m" disabled={!p.texto.trim()} onClick={p.ver}>Ver a prévia</Botao>
          <Botao tamanho="m" disabled={!p.pronta} onClick={() => {
            if (!p.previa) return
            listas.acrescentar(turma.id, p.previa.linhas.map((l) => ({ nome: l.nome, matricula: l.matricula })))
            fechar(false)
          }}>{p.pronta ? `Acrescentar ${plural(n, 'nome', 'nomes')}` : 'Acrescentar'}</Botao>
        </>
      )}>
      <div className="grid gap-3">
        <CampoTexto rotulo="Um por linha: nome; matrícula" valor={p.texto} aoMudar={p.setTexto} linhas={4} spellCheck={false} autoFocus
          placeholder="Nome do aluno; 2026-0000" className="[&_textarea]:font-mono [&_textarea]:text-[15px]" />
        <Contagem p={p} />
        {p.previa && <Previa linhas={p.previa.linhas} soErro={p.soErro} className="max-h-60" />}
      </div>
    </Dialogo>
  )
}
