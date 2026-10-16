import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Copy, Link2, Plus, RotateCw, Search } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Estado } from '@/components/turmma/ia'
import { NotaMockup, Tela } from '@/components/turmma/tela'
import {
  PROFESSORES, TEXTO_DA_VALIDADE_DO_CONVITE, TEXTO_DO_ESTADO_DO_PROFESSOR, TEXTO_DO_LINK_UMA_VEZ, TOTAL_DE_PROFESSORES,
  type EstadoDoProfessor, type ProfessorDaEscola,
} from '@/dados/estrutura'
import { cn } from '@/lib/utils'
import { Aviso, CANTO_DIALOGO } from './_a-pecas'
import {
  Anuncio, areaRolavel, Campo, campo, CONVITE_NOVO_VALE_ATE, Escolha, HOJE, MensagemCampo, sortearToken, TabelaFixa,
  textoDialogo, tituloDialogo, useCopiar, type ColunaFixa,
} from './_estrutura-pecas'

/* Professores: a lista da escola e o convite de cópia única, como o produto real (A1, 04/10/2026).
   A lista mostra só o nome: o e-mail é dado da conta, e a tela não o traz. Cadastrar gera um link que aparece UMA vez;
   refazer derruba o anterior na hora; revogar também. Quem foi revogado ou desativado volta pelo cadastro do mesmo e-mail. */

const SITUACAO: Record<EstadoDoProfessor, { curto: string; tom: 'ok' | 'pendente' | 'erro' | 'contorno' }> = {
  ativo: { curto: 'Ativo', tom: 'ok' },
  aceito: { curto: 'Convite aceito', tom: 'ok' },
  pendente: { curto: 'Convite em aberto', tom: 'pendente' },
  vencido: { curto: 'Convite vencido', tom: 'erro' },
  revogado: { curto: 'Convite revogado', tom: 'contorno' },
  desativado: { curto: 'Desativado', tom: 'contorno' },
}
type Filtro = 'todas' | 'ativos' | 'pendente' | 'vencido' | 'fora'
const FILTROS: { valor: Filtro; rotulo: string; vale: (e: EstadoDoProfessor) => boolean }[] = [
  { valor: 'todas', rotulo: 'Todas as situações', vale: () => true },
  { valor: 'ativos', rotulo: 'Ativos e aceitos', vale: (e) => e === 'ativo' || e === 'aceito' },
  { valor: 'pendente', rotulo: 'Convite em aberto', vale: (e) => e === 'pendente' },
  { valor: 'vencido', rotulo: 'Convite vencido', vale: (e) => e === 'vencido' },
  { valor: 'fora', rotulo: 'Revogados e desativados', vale: (e) => e === 'revogado' || e === 'desativado' },
]

/* O e-mail é da conta e não aparece na lista; o mockup guarda só para conferir o "e-mail já usado" no cadastro.
   Valem como em uso os de quem está ativo, aceitou ou tem convite em aberto. */
const EMAILS: Record<string, string> = {
  'p-camila': 'camila.souza@colegioaurora.com.br', 'p-rafael': 'rafael.antunes@colegioaurora.com.br',
  'p-paulo': 'paulo.ribeiro@colegioaurora.com.br', 'p-silvia': 'silvia.moraes@colegioaurora.com.br',
  'p-marta': 'marta.figueiredo@colegioaurora.com.br', 'p-jonas': 'jonas.barreto@colegioaurora.com.br',
  'p-renata': 'renata.lopes@colegioaurora.com.br',
}
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR').trim()

export function Professores() {
  const navigate = useNavigate()
  const [professores, setProfessores] = useState<ProfessorDaEscola[]>(PROFESSORES)
  const [emails, setEmails] = useState<Record<string, string>>(EMAILS)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [cadastrando, setCadastrando] = useState(false)
  const [refazendo, setRefazendo] = useState<ProfessorDaEscola | null>(null)
  const [revogando, setRevogando] = useState<ProfessorDaEscola | null>(null)
  const [novo, setNovo] = useState<string | null>(null)
  const [anuncio, setAnuncio] = useState<ReactNode>(null)

  const vale = FILTROS.find((f) => f.valor === filtro)!.vale
  const visiveis = professores.filter((p) => vale(p.estado) && (!busca.trim() || semAcento(p.nome).includes(semAcento(busca))))
  const total = TOTAL_DE_PROFESSORES + (professores.length - PROFESSORES.length)
  const mudar = (id: string, p: Partial<ProfessorDaEscola>) => setProfessores((ps) => ps.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const emUso = (email: string) => professores.some((p) => ['ativo', 'aceito', 'pendente'].includes(p.estado) && emails[p.id]?.toLowerCase() === email.trim().toLowerCase())

  const refazer = (p: ProfessorDaEscola) => {
    mudar(p.id, { estado: 'pendente', quando: `vale até ${CONVITE_NOVO_VALE_ATE}` })
    setAnuncio(<>Convite de <b>{p.nome}</b> refeito. O anterior deixou de valer; o novo vale até {CONVITE_NOVO_VALE_ATE}.</>)
    setRefazendo(p)
  }

  const colunas: ColunaFixa<ProfessorDaEscola>[] = [
    { titulo: 'Nome', principal: true, celula: (p) => <span className="font-semibold text-tinta">{p.nome}</span> },
    { titulo: 'Disciplina', celula: (p) => p.disciplinas || <span className="text-inativo">a alocar</span> },
    { titulo: 'Situação', celula: (p) => <span title={TEXTO_DO_ESTADO_DO_PROFESSOR[p.estado]}><Estado tipo={SITUACAO[p.estado].tom} size="sm">{SITUACAO[p.estado].curto}</Estado></span> },
    { titulo: 'Quando', celula: (p) => <span className="text-[13px] text-sutil">{p.quando}</span> },
    { titulo: '', className: 'text-right', celula: (p) => {
      if (p.estado === 'pendente' || p.estado === 'vencido') return (
        <span className="inline-flex gap-1">
          <Button size="sm" variant="secundario" className="h-8" onClick={() => refazer(p)}><RotateCw /> Refazer convite</Button>
          {p.estado === 'pendente' && <Button size="sm" variant="perigo" className="h-8" onClick={() => setRevogando(p)}>Revogar</Button>}
        </span>
      )
      if (p.estado === 'revogado' || p.estado === 'desativado') return <span className="text-[13px] text-sutil">Para convidar de novo, cadastre o mesmo e-mail.</span>
      return <Button size="sm" variant="discreto" className="h-8" onClick={() => navigate(`/coordenacao/estrutura?aba=alocacao&professor=${encodeURIComponent(p.nome)}`)}>Ver alocação</Button>
    } },
  ]

  return (
    <Tela titulo="Professores" className="md:flex md:h-svh md:flex-col md:pb-5">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-64">
          <span className="sr-only">Buscar professor</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-inativo" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar professor" className={cn(campo, 'h-9 rounded-full pl-9 text-sm')} />
        </label>
        <Escolha valor={filtro} aoMudar={(v) => setFiltro(v as Filtro)} className="h-9 w-52 rounded-full text-sm" opcoes={FILTROS.map((f) => ({ valor: f.valor, rotulo: f.rotulo }))} />
        <Button size="sm" className="ml-auto h-9" onClick={() => setCadastrando(true)}><Plus /> Cadastrar professor</Button>
      </div>

      {anuncio && <Anuncio aoFechar={() => setAnuncio(null)} className="mt-3 shrink-0">{anuncio}</Anuncio>}

      <section aria-label="Lista de professores" className="mt-3 flex max-h-full min-h-0 flex-col overflow-hidden rounded-cartao border border-linha">
        <div className={areaRolavel}>
          <TabelaFixa colunas={colunas} linhas={visiveis} chave={(p) => p.id} destaque={(p) => p.id === novo} vazio="Nenhum professor com esta busca." />
        </div>
        <p className="shrink-0 border-t border-linha px-4 py-2.5 text-[13px] text-sutil">
          Mostrando {visiveis.length} de {total} professores · a lista mostra só o nome: o e-mail fica na conta de cada um.
        </p>
      </section>

      <DialogoCadastro aberto={cadastrando} aoFechar={() => setCadastrando(false)} professores={professores} emUso={emUso}
        aoCadastrar={(nome, email) => {
          const id = `p-${Date.now().toString(36)}`
          setProfessores((ps) => [{ id, nome, estado: 'pendente', disciplinas: '', quando: `vale até ${CONVITE_NOVO_VALE_ATE}` }, ...ps])
          setEmails((e) => ({ ...e, [id]: email }))
          setNovo(id); setFiltro('todas'); setBusca('')
          setAnuncio(<>Cadastro feito: <b>{nome}</b>, com o convite em aberto até {CONVITE_NOVO_VALE_ATE}. Agora aloque nas turmas: a pessoa confirma pelo convite.</>)
        }} />

      <DialogoLink professor={refazendo} aoFechar={() => setRefazendo(null)} />

      <AlertDialog open={!!revogando} onOpenChange={(v) => !v && setRevogando(null)}>
        <AlertDialogContent className={cn(CANTO_DIALOGO, 'outline-none max-w-md')}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className={tituloDialogo}>Revogar o convite de {revogando?.nome}</AlertDialogTitle>
            <AlertDialogDescription className={textoDialogo}>O link deixa de valer na hora. Para convidar de novo, cadastre o mesmo e-mail.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: 'perigo', className: 'bg-erro-cx' })} onClick={() => {
              if (!revogando) return
              mudar(revogando.id, { estado: 'revogado', quando: `revogado em ${HOJE}` })
              setAnuncio(<>Convite de <b>{revogando.nome}</b> revogado. O link já não entra.</>)
              setRevogando(null)
            }}>Revogar o convite</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NotaMockup>
        Página Professores do produto real (A1): cadastro com e-mail, convite de cópia única que vale 7 dias e entra uma vez (regra 20,
        item 8), refazer derruba o anterior, revogar; a lista não mostra e-mail. "Mostrando 7 de 31": o mockup traz só sete linhas.
      </NotaMockup>
    </Tela>
  )
}

/* ── O link de cópia única (cadastro e refazer usam o mesmo passo) ─────────────────────────────────────── */

function PassoDoLink({ link, copiado, aoCopiar, extra }: { link: string; copiado: boolean; aoCopiar: () => void; extra?: ReactNode }) {
  return (
    <div className="grid gap-3">
      {extra}
      <div className="flex items-center gap-2 rounded-controle border border-borda-campo bg-realce-suave p-1.5 pl-3">
        <Link2 className="size-4 shrink-0 text-sutil" />
        <input readOnly value={link} aria-label="Link do convite" onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-tinta outline-none" />
        <Button size="sm" variant={copiado ? 'secundario' : 'oficial'} className="h-8 shrink-0" onClick={aoCopiar}>
          {copiado ? <><Check /> Copiado</> : <><Copy /> Copiar link</>}
        </Button>
      </div>
      <Aviso tom="pendente">{TEXTO_DO_LINK_UMA_VEZ}</Aviso>
      <p className="text-sm leading-relaxed text-apoio">A pessoa abre o link, cria a senha e confirma as turmas em que foi alocada.</p>
    </div>
  )
}

/** Fechar sem ter copiado pergunta antes: o link não aparece de novo. */
function ConfirmarFechar({ aberto, aoVoltar, aoFechar }: { aberto: boolean; aoVoltar: () => void; aoFechar: () => void }) {
  return (
    <AlertDialog open={aberto} onOpenChange={(v) => !v && aoVoltar()}>
      <AlertDialogContent className={cn(CANTO_DIALOGO, 'outline-none max-w-md')}>
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className={tituloDialogo}>Fechar sem copiar o link?</AlertDialogTitle>
          <AlertDialogDescription className={textoDialogo}>O link aparece uma vez só. Se fechar agora, ele não aparece de novo, e será preciso refazer o convite.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0" onClick={aoVoltar}>Voltar ao link</AlertDialogCancel>
          <AlertDialogAction className={buttonVariants({ variant: 'perigo', className: 'bg-erro-cx' })} onClick={aoFechar}>Fechar mesmo assim</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const novoLink = () => `turmma.com/convite#${sortearToken()}`

function DialogoCadastro({ aberto, aoFechar, professores, emUso, aoCadastrar }: {
  aberto: boolean; aoFechar: () => void; professores: ProfessorDaEscola[]; emUso: (email: string) => boolean
  aoCadastrar: (nome: string, email: string) => void
}) {
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState('')
  const [link, setLink] = useState('')
  const [perguntando, setPerguntando] = useState(false)
  const { copiado, jaCopiou, copiar, zerar } = useCopiar()

  const nomeRepetido = nome.trim().length > 2 && professores.some((p) => semAcento(p.nome) === semAcento(nome.replace(/\s+/g, ' ')))
  const limpar = () => { setEtapa(1); setNome(''); setEmail(''); setErro(''); setLink(''); setPerguntando(false); zerar() }
  const fechar = () => { aoFechar(); window.setTimeout(limpar, 200) }
  const pedirFechar = () => (etapa === 3 && !jaCopiou ? setPerguntando(true) : fechar())

  const continuar = (e: FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return setErro('Digite o nome do professor.')
    if (!EMAIL_VALIDO.test(email.trim())) return setErro('Digite um e-mail válido, como nome@escola.com.br.')
    if (emUso(email)) return setErro('Este e-mail já é de um professor desta escola, ativo ou com o convite em aberto. Confira o e-mail; para um link novo, use Refazer na lista.')
    setErro(''); setEtapa(2)
  }
  const gerar = () => {
    setLink(novoLink()); setEtapa(3)
    aoCadastrar(nome.trim().replace(/\s+/g, ' '), email.trim())
  }

  return (
    <>
      <Dialog open={aberto && !perguntando} onOpenChange={(v) => { if (!v) pedirFechar() }}>
        <DialogContent className={cn(CANTO_DIALOGO, 'outline-none max-w-lg')}>
          <DialogHeader className="text-left">
            <p className="text-[12.5px] font-medium tabular-nums text-sutil">Passo {etapa} de 3</p>
            <DialogTitle className={tituloDialogo}>{etapa === 1 ? 'Cadastrar professor' : etapa === 2 ? 'Confira antes de gerar' : 'O link do convite'}</DialogTitle>
            <DialogDescription className={textoDialogo}>
              {etapa === 1 ? 'O convite vai para o e-mail da pessoa. Depois de cadastrar, aloque nas turmas: ela confirma pelo convite.'
                : etapa === 2 ? 'Ao gerar, o professor entra na lista com o convite em aberto.'
                : <>Convite de <b className="font-semibold text-tinta">{nome.trim()}</b> gerado. Vale até {CONVITE_NOVO_VALE_ATE}.</>}
            </DialogDescription>
          </DialogHeader>

          {etapa === 1 && (
            <form id="form-cadastro" onSubmit={continuar} className="grid gap-3.5" noValidate>
              <Campo id="pr-nome" rotulo="Nome do professor">
                <Input id="pr-nome" value={nome} onChange={(e) => { setNome(e.target.value); setErro('') }} autoFocus className={campo} />
              </Campo>
              {nomeRepetido && <MensagemCampo tom="pendente">Já há um professor com este nome na lista. Se é a mesma pessoa voltando, pode seguir. Se é outra, acrescente um sobrenome: a lista mostra só o nome.</MensagemCampo>}
              <Campo id="pr-email" rotulo="E-mail do professor">
                <Input id="pr-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErro('') }} placeholder="nome@colegioaurora.com.br" className={campo} />
              </Campo>
              {erro && <MensagemCampo>{erro}</MensagemCampo>}
            </form>
          )}

          {etapa === 2 && (
            <dl className="grid gap-0 overflow-hidden rounded-controle border border-linha text-sm">
              {[['Nome', nome.trim()], ['E-mail', email.trim()], ['Convite', TEXTO_DA_VALIDADE_DO_CONVITE]].map(([r, v]) => (
                <div key={r} className="grid grid-cols-[88px_1fr] gap-3 border-b border-linha px-3.5 py-2.5 last:border-b-0">
                  <dt className="text-sutil">{r}</dt><dd className="min-w-0 break-words font-medium text-tinta">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {etapa === 3 && <PassoDoLink link={link} copiado={copiado} aoCopiar={() => copiar(`https://${link}`)} />}

          <DialogFooter className="gap-2 sm:space-x-0">
            {etapa === 1 && <><Button variant="discreto" onClick={fechar}>Cancelar</Button><Button type="submit" form="form-cadastro" variant="oficial">Continuar</Button></>}
            {etapa === 2 && <><Button variant="discreto" onClick={() => setEtapa(1)}>Voltar</Button><Button variant="oficial" onClick={gerar}>Cadastrar e gerar o link</Button></>}
            {etapa === 3 && <Button variant="secundario" onClick={pedirFechar}>Concluir</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmarFechar aberto={aberto && perguntando} aoVoltar={() => setPerguntando(false)} aoFechar={fechar} />
    </>
  )
}

function DialogoLink({ professor, aoFechar }: { professor: ProfessorDaEscola | null; aoFechar: () => void }) {
  const [link, setLink] = useState('')
  const [de, setDe] = useState<string | null>(null)
  const [perguntando, setPerguntando] = useState(false)
  const { copiado, jaCopiou, copiar, zerar } = useCopiar()
  // gera o link novo na hora em que o diálogo abre para outra pessoa (o anterior cai junto)
  if (professor && de !== professor.id) {
    setDe(professor.id); setLink(novoLink()); zerar(); setPerguntando(false)
  }
  const fechar = () => { aoFechar(); setDe(null) }
  const pedirFechar = () => (jaCopiou ? fechar() : setPerguntando(true))
  return (
    <>
      <Dialog open={!!professor && !perguntando} onOpenChange={(v) => { if (!v) pedirFechar() }}>
        <DialogContent className={cn(CANTO_DIALOGO, 'outline-none max-w-lg')}>
          <DialogHeader className="text-left">
            <DialogTitle className={tituloDialogo}>Convite refeito</DialogTitle>
            <DialogDescription className={textoDialogo}>
              Link novo para <b className="font-semibold text-tinta">{professor?.nome}</b>. O convite anterior deixa de valer na hora. {TEXTO_DA_VALIDADE_DO_CONVITE}
            </DialogDescription>
          </DialogHeader>
          <PassoDoLink link={link} copiado={copiado} aoCopiar={() => copiar(`https://${link}`)} />
          <DialogFooter><Button variant="secundario" onClick={pedirFechar}>Concluir</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmarFechar aberto={!!professor && perguntando} aoVoltar={() => setPerguntando(false)} aoFechar={fechar} />
    </>
  )
}
