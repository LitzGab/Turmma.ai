import { useState, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, Check, Clock3, Copy, Eye, Presentation, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Iniciais } from '@/components/turmma/painel'
import { NotaMockup } from '@/components/turmma/tela'
import { escolaDe, PROFESSORA, TURMAS } from '@/dados/escola'
import {
  ALOCACOES, CODIGO_DO_2B, codigoEmDoisGrupos, EFEITO_DA_DECISAO, ENDERECO_DA_TURMA, listaDa, pedidosDa, rotuloDaValidade,
  TEXTO_DA_MATRICULA_ERRADA, TEXTO_DE_QUEM_VE_A_LISTA, TEXTO_DO_ACESSO_NOVO, TEXTO_DO_ACESSO_QUE_CAI, TEXTO_DO_REVOGAR,
  textoDoWhatsApp, turmaDaEscola, VALIDADES_DO_ACESSO, type PedidoDeNome, type ValidadeDoAcesso,
} from '@/dados/estrutura'
import { cn } from '@/lib/utils'
import { dialogo } from '../_pecas'

/* CONVIDAR ALUNOS PARA A TURMA (pedido do Gabriel, 20/09/2026, com o print do "Adicionar alunos" da Teachy):
   "quando eu convido alguém para minha turma. Precisa ser assim. Link de convite, botão para o WhatsApp e o código."
   A ANATOMIA FOI APROVADA e fica: o link da sala com copiar e o botão verde do WhatsApp ao lado, o código da turma, a
   linha da validade, os pedidos para entrar e o rodapé. O verde é só o da marca do WhatsApp, no próprio símbolo.

   O COMPORTAMENTO, desde 04/10/2026, é o do produto real (A1 · `apresentacao-escola`; textos em dados/estrutura.ts):
   · o CÓDIGO tem 8 letras e números, sem 0/O/1/I, mostrado em dois grupos de 4; "Projetar" põe o código em tela cheia,
     em fundo branco, para a sala ler no projetor (Esc fecha);
   · o LINK da sala leva à lista de nomes da turma (`turmma.com/e/<escola>/turma#<token>`); o token vai depois do #,
     então não sai do navegador do aluno em log de servidor;
   · pelo WHATSAPP vão o nome da escola e o link, nunca nome de aluno;
   · "Gerar novo" pede confirmação e a VALIDADE (1, 7 ou 30 dias): o acesso de agora cai na hora, também o que outro
     professor da turma gerou. "Revogar" derruba sem gerar outro; a turma fica "Sem acesso ativo" até gerar de novo;
   · os PEDIDOS se decidem em lote, MARCANDO um a um (não há "aprovar todos"), com confirmação que diz o efeito.
   Quando a turma ainda não tem acesso (o 3ºA recém-confirmado), o diálogo abre direto em "Sem acesso ativo". */

const HOJE = new Date(2026, 9, 4) // domingo, 04/10/2026: o "hoje" da demonstração

/** "segunda, 12/10": o dia da semana curto e a data, a partir de hoje + `dias`. */
function ateQuando(dias: number) {
  const d = new Date(HOJE.getFullYear(), HOJE.getMonth(), HOJE.getDate() + dias)
  const semana = d.toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0]
  return `${semana}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Sorteio de semente fixa: a mesma turma e a mesma versão dão sempre o mesmo valor, e uma versão nova nunca repete
    o que já caiu. O código não usa os que se confundem (0/O, 1/I). */
const SEM_CONFUSAO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ALFABETO_DO_LINK = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function sorteio(semente: string, versao: number, tamanho: number, alfabeto: string) {
  let a = [...semente].reduce((n, c) => (n * 31 + c.charCodeAt(0)) | 0, 7) + versao * 2654435761
  return Array.from({ length: tamanho }, () => { a = (Math.imul(a ^ (a >>> 15), 0x2C1B3C6D) + 0x6D2B79F5) | 0; return alfabeto[(a >>> 8) % alfabeto.length] }).join('')
}

type Acesso = { codigo: string; token: string; ate: string; dias: ValidadeDoAcesso; novo: boolean }
function acessoDa(turmaId: string, versao: number, dias: ValidadeDoAcesso, ate?: string): Acesso {
  const codigo = versao === 0 && turmaId === '2b' ? CODIGO_DO_2B : sorteio(`codigo-${turmaId}`, versao, 8, SEM_CONFUSAO)
  return { codigo, token: sorteio(`token-${turmaId}`, versao, 12, ALFABETO_DO_LINK), ate: ate ?? ateQuando(dias), dias, novo: versao > 0 }
}

/** A turma do convite: as da professora (dados/escola.ts) ou, para a recém-confirmada (3ºA), a da estrutura da escola. */
function turmaDoConvite(turmaId: string) {
  const t = TURMAS.find((x) => x.id === turmaId)
  if (t) return { id: t.id, nome: t.nome, disciplina: t.disciplina, escolaId: t.escolaId, total: t.alunos }
  const e = turmaDaEscola(turmaId)
  const alocacao = ALOCACOES.find((a) => a.turmaId === turmaId && a.professor === PROFESSORA.nome)
  if (e) return { id: e.id, nome: e.nome, disciplina: alocacao?.disciplina ?? 'Química', escolaId: 'aurora', total: e.nomes }
  const p = TURMAS[0]
  return { id: p.id, nome: p.nome, disciplina: p.disciplina, escolaId: p.escolaId, total: p.alunos }
}

function WhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

/** O campo que só se copia: o texto à esquerda, o botão de copiar à direita, e "Copiado" por dois segundos. */
function CampoCopia({ rotulo, valor, mostra, grande = false }: { rotulo: string; valor: string; mostra?: string; grande?: boolean }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try { await navigator.clipboard.writeText(valor) } catch { /* sem permissão de área de transferência: o aviso aparece do mesmo jeito */ }
    setCopiado(true)
    window.setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <button type="button" onClick={copiar} aria-label={`Copiar ${rotulo.toLowerCase()}`}
      className="group flex h-12 min-w-0 flex-1 items-center gap-1.5 rounded-controle bg-realce-suave pl-3.5 pr-1.5 text-left transition-colors duration-150 hover:bg-realce sm:gap-3 sm:pl-4 sm:pr-2">
      <span className={cn('min-w-0 flex-1 truncate text-tinta', grande ? 'text-[19px] font-semibold tracking-[.18em] tabular-nums' : 'text-[13.5px] sm:text-[14.5px]')}>{mostra ?? valor}</span>
      <span className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2 text-[12.5px] font-medium transition-colors duration-150 sm:px-2.5', copiado ? 'bg-ok-cx text-ok' : 'text-sutil group-hover:bg-superficie group-hover:text-tinta')}>
        {copiado ? <><Check className="size-3.5" strokeWidth={2.4} /> Copiado</> : <><Copy className="size-4" strokeWidth={1.75} /> <span className="hidden sm:inline">Copiar</span></>}
      </span>
    </button>
  )
}

/** Os três prazos do acesso, como rádios em pílula. */
function EscolhaDaValidade({ valor, aoMudar, nome }: { valor: ValidadeDoAcesso; aoMudar: (v: ValidadeDoAcesso) => void; nome: string }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-[13px] font-medium text-tinta">Por quanto tempo o link e o código valem?</legend>
      <div className="flex flex-wrap gap-1.5">
        {VALIDADES_DO_ACESSO.map((d) => (
          <label key={d} className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-noite',
            valor === d ? 'border-tinta bg-superficie font-medium text-tinta' : 'border-borda-campo bg-superficie text-sutil hover:text-tinta')}>
            <input type="radio" name={nome} className="sr-only" checked={valor === d} onChange={() => aoMudar(d)} />
            {valor === d && <Check className="size-3.5" strokeWidth={2.4} aria-hidden />}
            {rotuloDaValidade(d)}{d === 7 && <span className="text-inativo"> · padrão</span>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** A caixa que toma o lugar do link e do código enquanto se confirma (gerar, revogar) ou quando não há acesso. */
function Painel({ titulo, children, acoes, tom = 'neutro' }: { titulo: ReactNode; children: ReactNode; acoes: ReactNode; tom?: 'neutro' | 'perigo' }) {
  return (
    <section className={cn('grid grid-cols-[minmax(0,1fr)] gap-3 rounded-controle border p-4', tom === 'perigo' ? 'border-erro/30 bg-erro-cx/40' : 'border-linha bg-lateral')}>
      <div className="grid gap-1">
        <h3 className="text-[14.5px] font-semibold leading-snug text-tinta">{titulo}</h3>
        {children}
      </div>
      <div className="flex flex-wrap items-center gap-2">{acoes}</div>
    </section>
  )
}

/** O código em tela cheia, para projetar na sala: fundo branco, letras enormes. Esc ou "Fechar" voltam ao diálogo. */
function Projecao({ aberto, aoMudar, codigo, turma, ate, enderecoDaTurma }: { aberto: boolean; aoMudar: (v: boolean) => void; codigo: string; turma: string; ate: string; enderecoDaTurma: string }) {
  return (
    <DialogPrimitive.Root open={aberto} onOpenChange={aoMudar}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content onOpenAutoFocus={(e) => e.preventDefault()} className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-white px-6 text-center text-tinta outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <DialogPrimitive.Title className="text-[clamp(18px,2.2vw,28px)] font-medium text-sutil">{turma}</DialogPrimitive.Title>
          <p className="font-semibold leading-none tracking-[.12em] tabular-nums text-[clamp(56px,13vw,200px)]">{codigoEmDoisGrupos(codigo)}</p>
          <DialogPrimitive.Description className="max-w-[28ch] text-balance text-[clamp(18px,2.6vw,36px)] leading-tight sm:max-w-none">
            Abra <b className="font-semibold">{enderecoDaTurma}</b> e digite o código
          </DialogPrimitive.Description>
          <p className="flex items-center gap-2 text-[clamp(15px,1.6vw,22px)] text-sutil"><Clock3 className="size-[1em]" strokeWidth={1.75} aria-hidden /> Vale até {ate}</p>
          <DialogPrimitive.Close asChild>
            <Button variant="secundario" className="absolute right-4 top-4 sm:right-6 sm:top-6"><X strokeWidth={1.75} /> Fechar</Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios)

export function ConvidarAlunos({ turmaId, aberto, aoMudar }: { turmaId: string; aberto: boolean; aoMudar: (v: boolean) => void }) {
  const turma = turmaDoConvite(turmaId)
  const escola = escolaDe(turma.escolaId)
  // cada escola tem o seu endereço; o Colégio Aurora é o da demonstração
  const enderecoDaTurma = escola.id === 'aurora' ? ENDERECO_DA_TURMA : 'turmma.com/e/em-rio-cachoeira/turma'
  const lista = listaDa(turma.id)
  const semLista = turma.total === 0

  // o acesso: começa ativo (gerado na segunda passada, vale até 12/10); a turma recém-confirmada começa sem acesso
  const [versao, setVersao] = useState(0)
  const [acesso, setAcesso] = useState<Acesso | null>(() => (semLista ? null : acessoDa(turma.id, 0, 7, 'segunda, 12/10')))
  const [modo, setModo] = useState<'normal' | 'gerar' | 'revogar'>('normal')
  const [dias, setDias] = useState<ValidadeDoAcesso>(7)
  const [revogado, setRevogado] = useState(false)
  const [projetando, setProjetando] = useState(false)

  // os pedidos: marcar um a um, confirmar em lote
  const [pedidos, setPedidos] = useState<PedidoDeNome[]>(() => pedidosDa(turma.id))
  const [marcados, setMarcados] = useState<string[]>([])
  const [decisao, setDecisao] = useState<'aprovar' | 'recusar' | null>(null)
  const [feito, setFeito] = useState<{ tipo: 'aprovar' | 'recusar'; n: number } | null>(null)
  const [aprovadosAqui, setAprovadosAqui] = useState(0)

  const total = lista.length || turma.total
  const entraram = (lista.length ? lista.filter((n) => n.estado === 'aprovado').length : semLista ? 0 : turma.total) + aprovadosAqui

  const link = acesso ? `https://${enderecoDaTurma}#${acesso.token}` : ''

  const gerar = () => {
    const v = versao + 1
    setVersao(v)
    setAcesso(acessoDa(turma.id, v, dias))
    setRevogado(false)
    setModo('normal')
  }
  const revogar = () => { setAcesso(null); setRevogado(true); setModo('normal') }
  const abrirGerar = () => { setDias(7); setModo('gerar') }

  const alternar = (id: string) => { setFeito(null); setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id])) }
  const confirmarDecisao = () => {
    if (!decisao) return
    const n = marcados.length
    setPedidos((p) => p.filter((x) => !marcados.includes(x.id)))
    if (decisao === 'aprovar') setAprovadosAqui((a) => a + n)
    setFeito({ tipo: decisao, n })
    setMarcados([])
    setDecisao(null)
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      {/* o foco inicial fica no diálogo, não no campo do link: senão ele abre com o contorno preto de foco */}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={cn(dialogo, 'max-w-[540px] grid-cols-[minmax(0,1fr)] gap-4 outline-none')}>
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="font-corpo text-lg font-semibold tracking-normal text-tinta">Convidar alunos</DialogTitle>
          <DialogDescription className="text-[13.5px] leading-snug text-sutil">
            {turma.nome} · {turma.disciplina} · {semLista ? 'a lista de nomes ainda não chegou da coordenação' : `${entraram} de ${total} já entraram`}
          </DialogDescription>
        </DialogHeader>

        {/* ── O acesso da turma: o link e o código, ou a confirmação que toma o lugar deles ── */}
        {modo === 'gerar' ? (
          <Painel titulo="Gerar um acesso novo?" acoes={<>
            <Button variant="oficial" size="sm" onClick={gerar}><RefreshCw strokeWidth={2} /> Gerar novo acesso</Button>
            <Button variant="discreto" size="sm" onClick={() => setModo('normal')}>Cancelar</Button>
          </>}>
            <p className="text-[13px] leading-snug text-sutil">{TEXTO_DO_ACESSO_QUE_CAI}</p>
            <div className="mt-2"><EscolhaDaValidade valor={dias} aoMudar={setDias} nome="validade-novo" /></div>
          </Painel>
        ) : modo === 'revogar' ? (
          <Painel tom="perigo" titulo="Revogar o acesso da turma?" acoes={<>
            <Button variant="destructive" size="sm" onClick={revogar}>Revogar acesso</Button>
            <Button variant="discreto" size="sm" onClick={() => setModo('normal')}>Cancelar</Button>
          </>}>
            <p className="text-[13px] leading-snug text-sutil">{TEXTO_DO_REVOGAR}</p>
          </Painel>
        ) : !acesso ? (
          <Painel titulo={<span className="flex items-center gap-2"><span aria-hidden className="size-2 rounded-full bg-inativo" />Sem acesso ativo</span>} acoes={
            <Button size="sm" onClick={gerar}>Gerar acesso</Button>
          }>
            <p className="text-[13px] leading-snug text-sutil">{revogado && <b className="font-medium text-tinta">O acesso anterior foi revogado. </b>}{TEXTO_DO_ACESSO_NOVO}</p>
            <div className="mt-2"><EscolhaDaValidade valor={dias} aoMudar={setDias} nome="validade-primeiro" /></div>
          </Painel>
        ) : (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
              <p className="rotulo">Link da sala</p>
              <div className="flex min-w-0 gap-2">
                <CampoCopia key={link} rotulo="Link da sala" valor={link} mostra={link.replace('https://', '')} />
                <a href={`https://wa.me/?text=${encodeURIComponent(textoDoWhatsApp(escola.nome, link))}`} target="_blank" rel="noreferrer" aria-label="Enviar o link pelo WhatsApp" title="Enviar pelo WhatsApp"
                  className="grid size-12 shrink-0 place-items-center rounded-controle bg-realce-suave transition-colors duration-150 hover:bg-realce">
                  <span className="grid size-8 place-items-center rounded-full bg-[#25D366] text-white"><WhatsApp className="size-[18px]" /></span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
              <p className="rotulo">Código da turma</p>
              <div className="flex min-w-0 gap-2">
                <CampoCopia key={acesso.codigo} rotulo="Código da turma" valor={acesso.codigo} mostra={codigoEmDoisGrupos(acesso.codigo)} grande />
                <button type="button" onClick={() => setProjetando(true)} aria-label="Projetar o código na sala" title="Projetar na sala"
                  className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-controle bg-realce-suave px-3 text-[13px] font-medium text-tinta transition-colors duration-150 hover:bg-realce sm:px-3.5">
                  <Presentation className="size-4" strokeWidth={1.75} /> <span className="max-sm:sr-only">Projetar</span>
                </button>
              </div>
            </div>

            <div className="-mt-1 grid gap-1.5">
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] leading-snug text-sutil">
                <Clock3 className="size-3.5 shrink-0" strokeWidth={1.75} />
                <span>Valem até {acesso.ate} · {rotuloDaValidade(acesso.dias)}.{acesso.novo && <b className="font-medium text-tinta"> Os anteriores deixaram de valer na hora.</b>}</span>
                <span className="ml-auto inline-flex items-center gap-3">
                  <button type="button" onClick={abrirGerar} className="inline-flex items-center gap-1 font-medium text-tinta underline-offset-4 hover:underline">
                    <RefreshCw className="size-3" strokeWidth={2} /> Gerar novo
                  </button>
                  <button type="button" onClick={() => setModo('revogar')} className="font-medium text-erro underline-offset-4 hover:underline">Revogar</button>
                </span>
              </p>
              <p className="flex gap-1.5 text-[11.5px] leading-snug text-inativo">
                <Eye className="mt-px size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                <span>{TEXTO_DE_QUEM_VE_A_LISTA}</span>
              </p>
            </div>
          </>
        )}

        {/* ── Pedidos para entrar: marcar um a um, decidir em lote, com confirmação ── */}
        <div className="flex min-h-0 flex-col rounded-controle border border-linha">
          <p className="flex items-center justify-between gap-3 border-b border-linha px-3.5 py-2.5 text-[13px] text-sutil">
            <span className="font-medium text-tinta">Pedidos para entrar</span>
            {pedidos.length > 0
              ? <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-pendente-cx px-1 text-[11px] font-semibold text-pendente">{pedidos.length}</span>
              : <span>nenhum esperando</span>}
          </p>

          {feito && (
            <p role="status" className={cn('flex items-start gap-2 border-b border-linha px-3.5 py-2.5 text-[12.5px] leading-snug', feito.tipo === 'aprovar' ? 'bg-ok-cx text-ok' : 'bg-realce-suave text-apoio')}>
              <Check className="mt-px size-3.5 shrink-0" strokeWidth={2.4} aria-hidden />
              {feito.tipo === 'aprovar'
                ? <span><b className="font-semibold">{feito.n} {plural(feito.n, 'pedido aprovado', 'pedidos aprovados')}.</b> {plural(feito.n, 'O aluno já entra com a matrícula e a senha que criou.', 'Os alunos já entram com a matrícula e a senha que criaram.')}</span>
                : <span><b className="font-semibold">{feito.n} {plural(feito.n, 'pedido recusado', 'pedidos recusados')}.</b> {plural(feito.n, 'O nome volta', 'Os nomes voltam')} à lista da turma, livre{feito.n > 1 && 's'} para ser{feito.n > 1 && 'em'} pedido{feito.n > 1 && 's'} de novo.</span>}
            </p>
          )}

          {decisao ? (
            <div role="alertdialog" aria-label={decisao === 'aprovar' ? 'Confirmar a aprovação' : 'Confirmar a recusa'} className="grid gap-2 px-3.5 py-3">
              <p className="text-[14px] font-semibold leading-snug text-tinta">
                Você vai {decisao} {marcados.length} {plural(marcados.length, 'pedido', 'pedidos')} da turma {turma.nome}.
              </p>
              <p className="text-[12.5px] leading-snug text-sutil">{EFEITO_DA_DECISAO[decisao]}</p>
              <ul className="flex flex-wrap gap-1.5">
                {pedidos.filter((p) => marcados.includes(p.id)).map((p) => (
                  <li key={p.id} className="rounded-full bg-realce-suave px-2.5 py-0.5 text-[12px] text-tinta">{p.nome}</li>
                ))}
              </ul>
              <div className="mt-1 flex flex-wrap gap-2">
                <Button variant={decisao === 'aprovar' ? 'oficial' : 'destructive'} size="sm" onClick={confirmarDecisao}>Confirmar</Button>
                <Button variant="discreto" size="sm" onClick={() => setDecisao(null)}>Voltar</Button>
              </div>
            </div>
          ) : pedidos.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] leading-snug text-sutil">
              {semLista
                ? 'A lista de nomes desta turma ainda não chegou da coordenação. Quando chegar, quem entrar pelo link ou pelo código pede o próprio nome e aparece aqui.'
                : 'Quem entrar pelo link ou pelo código pede o próprio nome na lista da turma e aparece aqui para você conferir.'}
            </p>
          ) : (
            <>
              <ul className="max-h-[196px] overflow-y-auto">
                {pedidos.map((p) => {
                  const marcado = marcados.includes(p.id)
                  return (
                    <li key={p.id} className="border-b border-linha last:border-0">
                      <label className={cn('flex min-h-12 items-center gap-2.5 px-3.5 py-2 transition-colors duration-150', marcado ? 'bg-realce-suave' : 'hover:bg-lateral')}>
                        <input type="checkbox" checked={marcado} onChange={() => alternar(p.id)} aria-label={`Marcar o pedido de ${p.nome}`}
                          className="size-4 shrink-0 accent-[#0D0D0D]" />
                        <Iniciais nome={p.nome} className="size-7 text-[10.5px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium leading-tight text-tinta">{p.nome}</span>
                          <span className="block truncate text-xs leading-tight text-sutil">pediu {p.quando}</span>
                          {p.matriculaErrada && (
                            <span className="mt-1 flex items-start gap-1 rounded-[6px] bg-pendente-cx px-1.5 py-1 text-[11.5px] leading-snug text-pendente">
                              <AlertTriangle className="mt-px size-3 shrink-0" strokeWidth={2} aria-hidden />{TEXTO_DA_MATRICULA_ERRADA}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-t border-linha px-3.5 py-2">
                {marcados.length === 0 ? (
                  <p className="text-[12px] leading-snug text-sutil">Marque os que você conferiu. Não há aprovar todos.</p>
                ) : (
                  <>
                    <p className="text-[12.5px] text-sutil">{marcados.length} {plural(marcados.length, 'marcado', 'marcados')}</p>
                    <span className="flex gap-2">
                      <Button variant="secundario" size="sm" className="h-8" onClick={() => setDecisao('recusar')}>Recusar {marcados.length}</Button>
                      <Button variant="oficial" size="sm" className="h-8" onClick={() => setDecisao('aprovar')}>Aprovar {marcados.length}</Button>
                    </span>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
          <p className="text-xs leading-snug text-sutil sm:max-w-[60%]">A lista de nomes vem da coordenação. Aqui ninguém se cadastra: só escolhe o próprio nome.</p>
          <Button onClick={() => aoMudar(false)}>Concluir</Button>
        </DialogFooter>

        {acesso && <Projecao enderecoDaTurma={enderecoDaTurma} aberto={projetando} aoMudar={setProjetando} codigo={acesso.codigo} turma={`${turma.nome} · ${turma.disciplina} · ${escola.nome}`} ate={acesso.ate} />}
        <NotaMockup>
          Comportamento do produto real (A1): acesso com validade de 1/7/30 dias, "Gerar novo" e "Revogar" derrubam o anterior na hora (regra 20, item 8);
          pedidos decididos em lote por marcação, sem "aprovar todos" (D3). Até 40 por decisão no produto; aqui a lista é curta.
        </NotaMockup>
      </DialogContent>
    </Dialog>
  )
}
