import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, FileCheck2, FileUp, Info, Lock, Plus, RefreshCw, Search, TriangleAlert, UserMinus } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { Estado } from '@/components/turmma/ia'
import { NotaMockup, Tela } from '@/components/turmma/tela'
import {
  COLAGEM_DE_EXEMPLO, EFEITO_DA_DECISAO, MAXIMO_DE_PEDIDOS_POR_DECISAO, TEXTO_DA_AUDITORIA_DA_DECISAO,
  TEXTO_DA_AUDITORIA_DA_LEITURA, TEXTO_DA_MATRICULA_ERRADA, TEXTO_DE_COMO_DECIDIR, TEXTO_DO_ERRO_DA_LINHA, TEXTO_DO_NOME,
  TEXTO_DO_RESULTADO,
  type EstadoDoNome, type NomeDaLista, type PedidoDeNome, type TurmaDaEscola,
} from '@/dados/estrutura'
import { cn } from '@/lib/utils'
import { Aviso, CANTO_DIALOGO } from './_a-pecas'
import {
  acharTurma, Anuncio, areaRolavel, caixaMarca, Campo, campo, guardarLista, guardarPedidos, lerColagem, listaAtual,
  matriculasDeOutrasTurmas, MensagemCampo, pareceDocumento, pedidosAtuais, Pilulas, TabelaFixa, TEXTO_PARECE_DOCUMENTO,
  textoDialogo, tituloDialogo, type ColunaFixa, type LinhaDaPrevia,
} from './_estrutura-pecas'

/* A lista de nomes de uma turma (tela de objeto), como o produto real: à esquerda a lista, com filtro, busca, retirar
   (só nome livre) e acrescentar; à direita os pedidos de nome, que a coordenação também decide, marcando um a um — não
   existe "aprovar todos". A leitura dos pedidos só acontece no clique em Atualizar, porque cada leitura vai para a
   auditoria. Turma sem lista (o 3ºA) mostra no lugar o painel de colar a lista, com a prévia linha a linha: só grava
   sem erro nenhum. */

const TOM_DO_NOME: Record<EstadoDoNome, 'contorno' | 'pendente' | 'ok'> = { livre: 'contorno', reivindicado: 'pendente', aprovado: 'ok' }
const CURTO_DO_NOME: Record<EstadoDoNome, string> = { livre: 'Livre', reivindicado: 'Pedido esperando', aprovado: 'Aprovado' }
const POR_QUE_NAO_SAI: Record<Exclude<EstadoDoNome, 'livre'>, string> = {
  reivindicado: 'Há um pedido esperando decisão neste nome, por isso ele não sai por aqui. Decida o pedido ao lado: recusado, o nome volta a ficar livre e pode ser retirado.',
  aprovado: 'Este nome já é a conta de um aluno aprovado, e conta de aluno não sai pela lista. O fim da conta segue o pedido do titular ou o fim do ano letivo.',
}
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR')
const porNome = (a: NomeDaLista, b: NomeDaLista) => a.nome.localeCompare(b.nome, 'pt-BR')

export function ListaDaTurma() {
  const { turma: id = '' } = useParams()
  const turma = acharTurma(id)
  if (!turma) {
    return (
      <Tela titulo="Turma não encontrada" objeto largura="media">
        <Aviso tom="erro">
          Esta turma não está no ano letivo em curso: ela pode ter sido excluída. <Link to="/coordenacao/estrutura" className="font-semibold underline underline-offset-4">Volte para Estrutura.</Link>
        </Aviso>
      </Tela>
    )
  }
  return <Turma key={id} turma={turma} />
}

function Turma({ turma }: { turma: TurmaDaEscola }) {
  const [lista, setLista] = useState<NomeDaLista[]>(() => listaAtual(turma.id))
  const [pedidos, setPedidos] = useState<PedidoDeNome[]>(() => pedidosAtuais(turma.id))
  const [anuncio, setAnuncio] = useState<ReactNode>(null)

  const mudarLista = (nova: NomeDaLista[]) => { setLista(nova); guardarLista(turma.id, nova) }
  const mudarPedidos = (novos: PedidoDeNome[]) => { setPedidos(novos); guardarPedidos(turma.id, novos) }

  return (
    <Tela objeto titulo={<span className="flex items-center gap-1">
        <Link to="/coordenacao/estrutura" className="-ml-1.5 inline-flex h-8 items-center rounded-full pl-1 pr-2.5 text-[15px] font-medium text-sutil transition-colors hover:bg-realce-suave hover:text-tinta">
          <ChevronLeft className="size-4" />Estrutura
        </Link>
        <span aria-hidden className="text-inativo">/</span>
        <span className="ml-1.5">Turma {turma.nome}</span>
      </span>}
      descricao={`${turma.serie} · ${turma.turno} · ${lista.length ? `${lista.length} nomes` : 'lista ainda não enviada'}`}
      className="md:flex md:h-svh md:flex-col md:pb-5 [&>header]:mb-3 [&>header]:shrink-0">
      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {lista.length
          ? <Lista turma={turma} lista={lista} mudarLista={mudarLista} anuncio={anuncio} setAnuncio={setAnuncio} />
          : <Colar turma={turma} aoGravar={(nova) => {
              mudarLista(nova); mudarPedidos([])
              setAnuncio(<>Lista gravada: <b>{nova.length} nomes</b> no {turma.nome}. Agora o professor gera o acesso da turma.</>)
            }} />}
        <Pedidos turma={turma} pedidos={pedidos} aoDecidir={(ids, aprovar) => {
          const decididos = pedidos.filter((p) => ids.includes(p.id))
          const nomes = new Set(decididos.map((p) => p.nome))
          mudarPedidos(pedidos.filter((p) => !ids.includes(p.id)))
          mudarLista(lista.map((n) => (nomes.has(n.nome) && n.estado === 'reivindicado' ? { ...n, estado: aprovar ? 'aprovado' : 'livre' } : n)))
          const q = decididos.length
          setAnuncio(aprovar
            ? <>{q === 1 ? '1 pedido aprovado' : `${q} pedidos aprovados`}: {decididos.map((p) => p.nome).join(', ')}. {q === 1 ? 'O aluno já entra' : 'Os alunos já entram'} com a matrícula e a senha que criou.</>
            : <>{q === 1 ? '1 pedido recusado' : `${q} pedidos recusados`}: {decididos.map((p) => p.nome).join(', ')}. {q === 1 ? 'O nome voltou' : 'Os nomes voltaram'} à lista, livre para ser pedido de novo.</>)
        }} />
      </div>
      <NotaMockup>
        Lista da turma do produto real (A1): a lista leva só nome e matrícula (regra 20, item 2); retirar só nome livre; o pedido de
        nome é decidido por uma pessoa, marcando um a um, até {MAXIMO_DE_PEDIDOS_POR_DECISAO} por vez (D3); a leitura dos pedidos vai para a auditoria.
      </NotaMockup>
    </Tela>
  )
}

/* ── A lista de nomes ──────────────────────────────────────────────────────────────────────────────────── */

type Filtro = 'todos' | EstadoDoNome

function Lista({ turma, lista, mudarLista, anuncio, setAnuncio }: {
  turma: TurmaDaEscola; lista: NomeDaLista[]; mudarLista: (l: NomeDaLista[]) => void; anuncio: ReactNode; setAnuncio: (a: ReactNode) => void
}) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [busca, setBusca] = useState('')
  const [retirando, setRetirando] = useState<NomeDaLista | null>(null)
  const [acrescentando, setAcrescentando] = useState(false)
  const numero = useMemo(() => new Map(lista.map((n, i) => [n.id, i + 1])), [lista])
  const conta = (e: EstadoDoNome) => lista.filter((n) => n.estado === e).length
  const visiveis = lista.filter((n) => (filtro === 'todos' || n.estado === filtro) && (!busca.trim() || semAcento(n.nome).includes(semAcento(busca.trim()))))

  const colunas: ColunaFixa<NomeDaLista>[] = [
    { titulo: 'Nº', className: 'w-12 tabular-nums text-sutil', soComputador: true, celula: (n) => numero.get(n.id) },
    { titulo: 'Nome', principal: true, celula: (n) => <span className="font-medium text-tinta">{n.nome}</span> },
    { titulo: 'Matrícula', className: 'tabular-nums', celula: (n) => n.matricula },
    { titulo: 'Situação', celula: (n) => <span title={TEXTO_DO_NOME[n.estado]}><Estado tipo={TOM_DO_NOME[n.estado]} size="sm">{CURTO_DO_NOME[n.estado]}</Estado></span> },
    { titulo: ' ', className: 'w-[120px] text-right', celula: (n) => n.estado === 'livre'
      ? <Button size="sm" variant="discreto" className="h-8 px-3 hover:bg-erro-cx hover:text-erro" onClick={() => setRetirando(n)}><UserMinus /> Retirar</Button>
      : (
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon-sm" variant="discreto" className="size-8 text-inativo" aria-label={`Por que ${n.nome} não sai da lista`}><Lock className="!size-3.5" /></Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 rounded-controle border-linha p-3.5 text-[13.5px] leading-relaxed text-apoio shadow-flutua">
            {POR_QUE_NAO_SAI[n.estado]}
          </PopoverContent>
        </Popover>
      ) },
  ]

  return (
    <section aria-label="Lista de nomes" className="flex min-h-0 flex-col overflow-hidden rounded-cartao border border-linha max-md:h-[640px]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-linha px-3 py-2.5">
        <Pilulas rotulo="Mostrar" valor={filtro} aoMudar={setFiltro} opcoes={[
          { valor: 'todos', rotulo: 'Todos', n: lista.length },
          { valor: 'livre', rotulo: 'Livres', n: conta('livre') },
          { valor: 'reivindicado', rotulo: 'Pedidos', n: conta('reivindicado') },
          { valor: 'aprovado', rotulo: 'Aprovados', n: conta('aprovado') },
        ]} />
        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <label className="relative min-w-[150px] max-w-56 flex-1">
            <span className="sr-only">Buscar nome</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-inativo" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome" className={cn(campo, 'h-8 rounded-full pl-9 text-sm')} />
          </label>
          <Button size="sm" variant="secundario" className="h-8" onClick={() => setAcrescentando(true)}><Plus /> Acrescentar um nome</Button>
        </div>
      </div>
      {anuncio && <div className="shrink-0 px-3 pt-2.5"><Anuncio aoFechar={() => setAnuncio(null)}>{anuncio}</Anuncio></div>}
      <div className={areaRolavel}>
        <TabelaFixa colunas={colunas} linhas={visiveis} chave={(n) => n.id} vazio={busca ? 'Nenhum nome com esta busca.' : 'Nenhum nome nesta situação.'} />
      </div>
      <p className="flex shrink-0 items-center gap-2 border-t border-linha px-4 py-2.5 text-[13px] text-sutil">
        <Lock className="size-3.5 shrink-0" />
        A lista leva só nome e matrícula. O Turmma não guarda e-mail, telefone, CPF, foto nem data de nascimento de aluno.
      </p>

      <AlertDialog open={!!retirando} onOpenChange={(v) => !v && setRetirando(null)}>
        <AlertDialogContent className={cn(CANTO_DIALOGO, 'outline-none max-w-md')}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className={tituloDialogo}>Retirar o nome da lista</AlertDialogTitle>
            <AlertDialogDescription className={textoDialogo}>
              <b className="font-semibold text-tinta">{retirando?.nome}</b> (matrícula {retirando?.matricula}) sai da lista do {turma.nome}.
              Ninguém pediu este nome ainda. Se foi engano, é só acrescentar de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'perigo', className: 'bg-erro-cx' })} onClick={() => {
              if (!retirando) return
              mudarLista(lista.filter((n) => n.id !== retirando.id))
              setAnuncio(<><b>{retirando.nome}</b> saiu da lista do {turma.nome}.</>)
              setRetirando(null)
            }}>Retirar o nome</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogoAcrescentar aberto={acrescentando} aoMudar={setAcrescentando} turma={turma} lista={lista} aoAcrescentar={(nome, matricula) => {
        mudarLista([...lista, { id: `${turma.id}-n${Date.now().toString(36)}`, nome, matricula, estado: 'livre' as const }].sort(porNome))
        setFiltro('todos'); setBusca('')
        setAnuncio(<><b>{nome}</b> entrou na lista do {turma.nome}, livre para o aluno pedir.</>)
      }} />
    </section>
  )
}

function DialogoAcrescentar({ aberto, aoMudar, turma, lista, aoAcrescentar }: {
  aberto: boolean; aoMudar: (v: boolean) => void; turma: TurmaDaEscola; lista: NomeDaLista[]; aoAcrescentar: (nome: string, matricula: string) => void
}) {
  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [erro, setErro] = useState('')
  const fechar = (v: boolean) => { aoMudar(v); if (!v) { setNome(''); setMatricula(''); setErro('') } }
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    const n = nome.trim().replace(/\s+/g, ' ')
    const m = matricula.trim()
    if (!n) return setErro(TEXTO_DO_ERRO_DA_LINHA.sem_nome)
    if (!m) return setErro(TEXTO_DO_ERRO_DA_LINHA.sem_matricula)
    if (pareceDocumento(m)) return setErro(TEXTO_PARECE_DOCUMENTO)
    if (lista.some((x) => x.matricula === m)) return setErro(`Esta matrícula já está na lista do ${turma.nome}.`)
    if (matriculasDeOutrasTurmas(turma.id).has(m)) return setErro(TEXTO_DO_ERRO_DA_LINHA.matricula_em_uso)
    aoAcrescentar(n, m); fechar(false)
  }
  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent className={cn(CANTO_DIALOGO, 'outline-none max-w-md')}>
        <form onSubmit={enviar} className="grid gap-4" noValidate>
          <DialogHeader className="text-left">
            <DialogTitle className={tituloDialogo}>Acrescentar um nome</DialogTitle>
            <DialogDescription className={textoDialogo}>O nome entra livre na lista do {turma.nome}: o aluno pede o nome pelo acesso da turma, e uma pessoa aprova.</DialogDescription>
          </DialogHeader>
          <Campo id="ac-nome" rotulo="Nome do aluno">
            <Input id="ac-nome" value={nome} onChange={(e) => { setNome(e.target.value); setErro('') }} autoFocus className={campo} />
          </Campo>
          <Campo id="ac-mat" rotulo="Matrícula">
            <Input id="ac-mat" value={matricula} onChange={(e) => { setMatricula(e.target.value); setErro('') }} placeholder="2026-0000" className={cn(campo, 'tabular-nums')} />
          </Campo>
          {erro && <MensagemCampo>{erro}</MensagemCampo>}
          <DialogFooter className="gap-2 sm:space-x-0">
            <Button type="button" variant="discreto" onClick={() => fechar(false)}>Cancelar</Button>
            <Button type="submit" variant="oficial">Acrescentar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Colar a lista (turma sem lista) ───────────────────────────────────────────────────────────────────── */

function Colar({ turma, aoGravar }: { turma: TurmaDaEscola; aoGravar: (l: NomeDaLista[]) => void }) {
  const [texto, setTexto] = useState('')
  const [arquivo, setArquivo] = useState(false)
  const [previa, setPrevia] = useState<{ texto: string; linhas: LinhaDaPrevia[] } | null>(null)
  const [soErros, setSoErros] = useState<'todas' | 'erro'>('todas')
  const erros = previa?.linhas.filter((l) => l.erro) ?? []
  const entram = (previa?.linhas.length ?? 0) - erros.length
  const desatualizada = !!previa && previa.texto !== texto
  const podeGravar = !!previa && !desatualizada && erros.length === 0 && entram > 0
  const motivo = !previa ? 'Veja a prévia antes de gravar.'
    : desatualizada ? 'O texto mudou depois da prévia: veja a prévia de novo.'
    : erros.length ? 'Corrija as linhas com erro no texto e veja a prévia de novo: a lista só é gravada sem erro nenhum.'
    : entram === 0 ? 'O texto está vazio.' : null

  const colunas: ColunaFixa<LinhaDaPrevia>[] = [
    { titulo: 'Linha', className: 'w-14 tabular-nums', celula: (l) => <span className={l.erro ? 'font-semibold text-erro' : 'text-sutil'}>{l.linha}</span> },
    { titulo: 'Nome', principal: true, celula: (l) => <span className="font-medium text-tinta">{l.nome || <span className="text-inativo">—</span>}</span> },
    { titulo: 'Matrícula', className: 'whitespace-nowrap tabular-nums', celula: (l) => l.matricula || <span className="text-inativo">—</span> },
    { titulo: 'Resultado', celula: (l) => l.erro
      ? <span className="inline-flex items-start gap-1.5 text-[13px] leading-snug text-erro"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" />{TEXTO_DO_ERRO_DA_LINHA[l.erro]}</span>
      : <span className="text-[13px] text-ok">{TEXTO_DO_RESULTADO.entra}</span> },
  ]

  return (
    <section aria-label="Colar a lista" className="flex min-h-0 flex-col overflow-hidden rounded-cartao border border-linha max-md:min-h-[640px]">
      <div className="shrink-0 border-b border-linha px-4 py-2.5">
        <h2 className="text-[15px] font-semibold text-tinta">Colar a lista</h2>
        <p className="text-[13px] text-sutil">O {turma.nome} ainda não tem lista. A prévia aponta o erro linha a linha antes de gravar.</p>
      </div>
      <div className="grid shrink-0 gap-2 px-4 pt-3">
        <Label htmlFor="colagem" className="text-[13px] font-medium text-apoio">Cole a lista: nome; matrícula, um aluno por linha</Label>
        <Textarea id="colagem" value={texto} onChange={(e) => { setTexto(e.target.value); setArquivo(false) }} spellCheck={false}
          placeholder={'Alice Monteiro; 2026-0801\nBernardo Pires; 2026-0802'}
          className="h-[112px] resize-none rounded-controle border-borda-campo bg-superficie font-mono text-[13px] leading-[1.55] focus-visible:ring-0 focus-visible:ring-offset-0" />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secundario" className="h-8" onClick={() => { setTexto(COLAGEM_DE_EXEMPLO); setArquivo(true); setPrevia(null) }}><FileUp /> Enviar arquivo CSV</Button>
          <Button size="sm" className="h-8" disabled={!texto.trim()} onClick={() => { setPrevia({ texto, linhas: lerColagem(texto, turma.id) }); setSoErros('todas') }}>Ver a prévia</Button>
          {arquivo && <span className="inline-flex items-center gap-1.5 text-[13px] text-sutil"><FileCheck2 className="size-4 text-ok" />Arquivo lido: lista-3A.csv. O texto dele está no campo acima.</span>}
        </div>
      </div>

      {previa ? (
        <>
          <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2 border-y border-linha px-3 py-2">
            <p className="mr-auto pl-1 text-sm text-tinta">
              <b className="font-semibold text-ok">{entram} entram</b>
              <span className="text-sutil"> · </span>
              <b className={cn('font-semibold', erros.length ? 'text-erro' : 'text-sutil')}>{erros.length} com erro</b>
              {desatualizada && <span className="ml-2 text-[13px] text-pendente">· o texto mudou depois desta prévia</span>}
            </p>
            {erros.length > 0 && <Pilulas rotulo="Linhas da prévia" valor={soErros} aoMudar={setSoErros} opcoes={[
              { valor: 'todas', rotulo: 'Todas as linhas', n: previa.linhas.length }, { valor: 'erro', rotulo: 'Só com erro', n: erros.length },
            ]} />}
          </div>
          <div className={areaRolavel}>
            <TabelaFixa colunas={colunas} linhas={soErros === 'erro' ? erros : previa.linhas} chave={(l) => String(l.linha)} classeDaLinha={(l) => (l.erro ? 'bg-erro-cx' : undefined)} />
          </div>
        </>
      ) : (
        <div className="m-4 grid flex-1 place-items-center rounded-controle border border-dashed border-linha p-6 text-center text-sm text-sutil">
          A prévia aparece aqui, linha a linha, antes de qualquer nome entrar na lista.
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-t border-linha px-4 py-2.5">
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-sutil">{motivo ?? `${entram} nomes entram, todos livres, esperando o aluno pedir o nome.`}</p>
        <Button size="sm" variant="oficial" className="h-9" disabled={!podeGravar} onClick={() => {
          if (!previa) return
          aoGravar(previa.linhas.map((l) => ({ id: `${turma.id}-${l.linha}`, nome: l.nome, matricula: l.matricula, estado: 'livre' as const })).sort(porNome))
        }}>Gravar lista</Button>
      </div>
    </section>
  )
}

/* ── Pedidos de nome ───────────────────────────────────────────────────────────────────────────────────── */

function Pedidos({ turma, pedidos, aoDecidir }: { turma: TurmaDaEscola; pedidos: PedidoDeNome[]; aoDecidir: (ids: string[], aprovar: boolean) => void }) {
  const [lido, setLido] = useState(false)
  const [lendo, setLendo] = useState(false)
  const [marcados, setMarcados] = useState<string[]>([])
  const [decisao, setDecisao] = useState<'aprovar' | 'recusar' | null>(null)
  const n = marcados.length
  const atualizar = () => { setLendo(true); window.setTimeout(() => { setLendo(false); setLido(true); setMarcados((m) => m.filter((id) => pedidos.some((p) => p.id === id))) }, 450) }
  const alternar = (id: string) => setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : m.length >= MAXIMO_DE_PEDIDOS_POR_DECISAO ? m : [...m, id]))
  const plural = (q: number) => (q === 1 ? '1 pedido' : `${q} pedidos`)
  const escolhidos = pedidos.filter((p) => marcados.includes(p.id))

  return (
    <section aria-label="Pedidos de nome" className="flex min-h-0 flex-col overflow-hidden rounded-cartao border border-linha max-md:min-h-[420px]">
      <div className="shrink-0 border-b border-linha px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-tinta">Pedidos de nome {lido && <span className="ml-1 font-normal tabular-nums text-sutil">{pedidos.length}</span>}</h2>
          <Button size="sm" variant="secundario" className="h-8" onClick={atualizar} disabled={lendo}><RefreshCw className={cn(lendo && 'animate-spin')} /> Atualizar</Button>
        </div>
        <p className="mt-1.5 flex gap-1.5 text-[12.5px] leading-snug text-sutil"><Info className="mt-px size-3.5 shrink-0" />{TEXTO_DA_AUDITORIA_DA_LEITURA}</p>
      </div>

      <div className={cn(areaRolavel, 'p-3')}>
        {!lido ? (
          <p className="grid h-full min-h-32 place-items-center px-4 text-center text-sm leading-relaxed text-sutil">Clique em Atualizar para ver os pedidos que esperam a decisão nesta turma.</p>
        ) : pedidos.length === 0 ? (
          <div className="grid h-full min-h-32 place-content-center gap-1 px-4 text-center">
            <p className="text-sm font-semibold text-tinta">Nenhum pedido esperando</p>
            <p className="text-[13px] leading-relaxed text-sutil">Os pedidos chegam quando o professor da turma gerar o acesso e os alunos pedirem o nome.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            <p className="text-[12.5px] text-sutil">Lido agora · a consulta ficou registrada na auditoria.</p>
            <ul className="grid gap-2">
              {pedidos.map((p) => {
                const marcado = marcados.includes(p.id)
                return (
                  <li key={p.id}>
                    <label htmlFor={`ped-${p.id}`} className={cn('flex cursor-pointer gap-3 rounded-controle border p-3 transition-colors duration-150',
                      marcado ? 'border-noite bg-realce-suave' : 'border-linha hover:bg-realce-suave')}>
                      <Checkbox id={`ped-${p.id}`} checked={marcado} onCheckedChange={() => alternar(p.id)} className={cn(caixaMarca, 'mt-0.5')} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold leading-snug text-tinta">{p.nome}</span>
                        <span className="block text-[13px] text-sutil">Pediu {p.quando}</span>
                        {p.matriculaErrada && (
                          <span className="mt-1.5 flex gap-1.5 rounded-linha bg-pendente-cx px-2 py-1.5 text-[12.5px] leading-snug text-pendente">
                            <TriangleAlert className="mt-px size-3.5 shrink-0" />{TEXTO_DA_MATRICULA_ERRADA}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {lido && pedidos.length > 0 && (
        <div className="shrink-0 border-t border-linha px-3 py-2.5">
          {n === 0
            ? <p className="text-[12.5px] leading-snug text-sutil">{TEXTO_DE_COMO_DECIDIR}</p>
            : (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="oficial" className="h-9" onClick={() => setDecisao('aprovar')}>Aprovar {plural(n)}</Button>
                <Button size="sm" variant="perigo" className="h-9" onClick={() => setDecisao('recusar')}>Recusar {n}</Button>
                <Button size="sm" variant="discreto" className="ml-auto h-9" onClick={() => setMarcados([])}>Desmarcar</Button>
              </div>
            )}
        </div>
      )}

      <AlertDialog open={!!decisao} onOpenChange={(v) => !v && setDecisao(null)}>
        <AlertDialogContent className={cn(CANTO_DIALOGO, 'outline-none max-w-lg')}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className={tituloDialogo}>{decisao === 'aprovar' ? 'Aprovar pedidos' : 'Recusar pedidos'}</AlertDialogTitle>
            <AlertDialogDescription className={textoDialogo}>
              Você vai {decisao === 'aprovar' ? 'aprovar' : 'recusar'} {plural(n)} da turma {turma.nome}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="grid gap-1 rounded-controle bg-realce-suave p-3 text-[14px] text-tinta">
            {escolhidos.map((p) => <li key={p.id} className="font-medium">{p.nome}{p.matriculaErrada && <span className="font-normal text-pendente"> · houve tentativa com matrícula errada</span>}</li>)}
          </ul>
          <p className={textoDialogo}>{decisao === 'recusar' ? EFEITO_DA_DECISAO.recusar : EFEITO_DA_DECISAO.aprovar}</p>
          <p className="flex gap-1.5 text-[13px] leading-snug text-sutil"><Info className="mt-px size-3.5 shrink-0" />{TEXTO_DA_AUDITORIA_DA_DECISAO}</p>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel className="mt-0">Voltar</AlertDialogCancel>
            <AlertDialogAction
              className={decisao === 'aprovar' ? buttonVariants({ variant: 'oficial' }) : buttonVariants({ variant: 'perigo', className: 'bg-erro-cx' })}
              onClick={() => { aoDecidir(marcados, decisao === 'aprovar'); setMarcados([]); setDecisao(null) }}>
              {decisao === 'aprovar' ? `Aprovar ${plural(n)}` : `Recusar ${plural(n)}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
