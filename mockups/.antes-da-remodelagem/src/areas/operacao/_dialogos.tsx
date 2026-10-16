import { useState, type ReactNode } from 'react'
import { Check, Copy, KeyRound, Link2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NotaMockup } from '@/components/turmma/tela'
import { TEXTO_DA_VALIDADE_DO_CONVITE, TEXTO_DO_LINK_UMA_VEZ } from '@/dados/estrutura'
import { cn } from '@/lib/utils'
import { CANTO_DIALOGO } from '../coordenacao/_a-pecas'
import { campo } from '../coordenacao/_b-pecas'
import {
  TIPOS, enderecoCompleto, novoToken, paraEndereco, validadeDeHoje,
  type EscolaNaTela, type RedeNaTela, type Tipo,
} from './_dados'

/* Os diálogos do painel da operação: Nova rede, Nova escola (duas etapas), Convidar coordenação (o link aparece
   uma vez) e Revogar convite. Montados sobre shadcn/dialog e shadcn/alert-dialog, com o canto de 24 px (9.3).
   Cada diálogo é desenhado só enquanto está aberto: fechou, o estado dele some (nada guarda o link). */

const TITULO = 'font-titulo text-[20px] font-semibold leading-tight tracking-[-0.02em] text-tinta'
const DESCRICAO = 'text-[15px] leading-relaxed text-apoio'

function Campo({ id, rotulo, dica, erro, children }: { id: string; rotulo: string; dica?: ReactNode; erro?: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium text-sutil">{rotulo}</Label>
      {children}
      {erro ? <p id={`${id}-erro`} role="alert" className="text-[13px] leading-snug text-erro">{erro}</p>
        : dica ? <p id={`${id}-dica`} className="text-[13px] leading-snug text-sutil">{dica}</p> : null}
    </div>
  )
}

/** Enquanto digita: deixa o hífen do fim (a pessoa ainda vai escrever a próxima palavra). Ao sair do campo, limpa. */
const digitarEndereco = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-/, '').slice(0, 48)

/** Escolha de um entre poucos, em pílulas (o tipo da rede). */
function Pilulas<T extends string>({ opcoes, valor, aoMudar, rotulo }: { opcoes: T[]; valor: T; aoMudar: (v: T) => void; rotulo: string }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex w-full rounded-full bg-realce-suave p-1 sm:w-auto sm:justify-self-start">
      {opcoes.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={o === valor} onClick={() => aoMudar(o)}
          className={cn('h-9 flex-1 rounded-full px-4 text-sm font-medium transition-colors duration-150 sm:flex-none md:h-8',
            o === valor ? 'bg-superficie text-tinta shadow-sm' : 'text-sutil hover:text-tinta')}>
          {o}
        </button>
      ))}
    </div>
  )
}

/* ── Nova rede ────────────────────────────────────────────────────────────────────────────────────────── */

export function DialogoNovaRede({ redes, aoFechar, aoCriar }: {
  redes: RedeNaTela[]; aoFechar: () => void; aoCriar: (rede: RedeNaTela) => void
}) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<Tipo>('Municipal')
  const limpo = nome.trim()
  const repetida = redes.some((r) => r.nome.toLowerCase() === limpo.toLowerCase())
  const pode = limpo.length >= 3 && !repetida

  return (
    <Dialog open onOpenChange={(v) => { if (!v) aoFechar() }}>
      <DialogContent className={cn(CANTO_DIALOGO, 'max-w-lg gap-5 outline-none')}>
        <DialogHeader className="text-left">
          <DialogTitle className={TITULO}>Nova rede</DialogTitle>
          <DialogDescription className={DESCRICAO}>A rede é quem contrata. Depois dela vêm as escolas, e cada escola tem a sua coordenação.</DialogDescription>
        </DialogHeader>
        <form id="form-rede" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (pode) aoCriar({ id: `r-${paraEndereco(limpo)}`, nome: limpo, tipo }) }}>
          <Campo id="rede-nome" rotulo="Nome da rede" erro={repetida ? 'Já existe uma rede com este nome.' : undefined}
            dica="Como a rede é chamada: a prefeitura, o grupo educacional ou o próprio colégio.">
            <Input id="rede-nome" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} className={campo}
              placeholder="ex.: Secretaria Municipal de Educação de Araquari" aria-describedby={repetida ? 'rede-nome-erro' : 'rede-nome-dica'} />
          </Campo>
          <div className="grid gap-1.5">
            <p className="text-[13px] font-medium text-sutil">Tipo</p>
            <Pilulas opcoes={TIPOS} valor={tipo} aoMudar={setTipo} rotulo="Tipo da rede" />
          </div>
        </form>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="secundario" onClick={aoFechar}>Cancelar</Button>
          <Button type="submit" form="form-rede" variant="primario" disabled={!pode}>Criar rede</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Nova escola, em duas etapas ─────────────────────────────────────────────────────────────────────── */

export function DialogoNovaEscola({ redes, redeInicial, enderecosUsados, aoFechar, aoCriar }: {
  redes: RedeNaTela[]; redeInicial?: string; enderecosUsados: string[]
  aoFechar: () => void; aoCriar: (escola: { nome: string; rede: RedeNaTela; slug: string; cidade: string }) => void
}) {
  const [etapa, setEtapa] = useState<1 | 2>(1)
  const [redeId, setRedeId] = useState(redeInicial ?? '')
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [slugMexido, setSlugMexido] = useState(false)
  const [cidade, setCidade] = useState('Joinville · SC')

  const rede = redes.find((r) => r.id === redeId)
  const final = paraEndereco(slug)
  const repetido = final !== '' && enderecosUsados.includes(final)
  const pode = !!rede && nome.trim().length >= 3 && final.length >= 3 && !repetido && cidade.trim().length >= 3

  function mudarNome(v: string) {
    setNome(v)
    if (!slugMexido) setSlug(paraEndereco(v))
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v) aoFechar() }}>
      <DialogContent className={cn(CANTO_DIALOGO, 'max-h-[92svh] max-w-lg gap-5 overflow-y-auto outline-none')}>
        <DialogHeader className="text-left">
          <p className="rotulo tabular-nums">Etapa {etapa} de 2 · {etapa === 1 ? 'Dados da escola' : 'Conferência'}</p>
          <DialogTitle className={TITULO}>{etapa === 1 ? 'Nova escola' : 'Confira antes de criar'}</DialogTitle>
          <DialogDescription className={DESCRICAO}>
            {etapa === 1
              ? 'A escola nasce sem coordenação. Depois de criar, convide a coordenadora: é ela quem monta turmas, professores e alunos.'
              : 'O endereço é por onde professores e alunos chegam à escola. Confira com atenção: ele vai nos convites e no link das turmas.'}
          </DialogDescription>
        </DialogHeader>

        {etapa === 1 ? (
          <form id="form-escola" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (pode) setEtapa(2) }}>
            <Campo id="escola-rede" rotulo="Rede">
              <Select value={redeId} onValueChange={setRedeId}>
                <SelectTrigger id="escola-rede" className={cn(campo, 'w-full')}><SelectValue placeholder="Escolha a rede" /></SelectTrigger>
                <SelectContent className="rounded-controle">
                  {redes.map((r) => <SelectItem key={r.id} value={r.id} className="rounded-linha">{r.nome} <span className="text-sutil">· {r.tipo}</span></SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
            <Campo id="escola-nome" rotulo="Nome da escola">
              <Input id="escola-nome" autoFocus value={nome} onChange={(e) => mudarNome(e.target.value)} className={campo} placeholder="ex.: E. M. Vila Nova" />
            </Campo>
            <Campo id="escola-endereco" rotulo="Endereço da escola"
              erro={repetido ? 'Este endereço já é de outra escola. Escolha outro.' : undefined}
              dica="Sai do nome e pode ser mudado. Só letras minúsculas, números e hífen.">
              <div className={cn('flex h-11 items-center overflow-hidden rounded-controle border bg-superficie text-[15px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 md:h-10',
                repetido ? 'border-erro' : 'border-borda-campo')}>
                <span className="shrink-0 border-r border-linha bg-lateral px-3 leading-[2.5rem] text-sutil">turmma.com/e/</span>
                <input id="escola-endereco" value={slug} spellCheck={false} autoComplete="off"
                  aria-invalid={repetido} aria-describedby={repetido ? 'escola-endereco-erro' : 'escola-endereco-dica'}
                  onChange={(e) => { setSlugMexido(true); setSlug(digitarEndereco(e.target.value)) }}
                  onBlur={() => setSlug((s) => paraEndereco(s))}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 text-tinta outline-none placeholder:text-inativo" placeholder="nome-da-escola" />
              </div>
            </Campo>
            <Campo id="escola-cidade" rotulo="Cidade">
              <Input id="escola-cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className={campo} placeholder="Cidade · UF" />
            </Campo>
          </form>
        ) : (
          <dl className="grid divide-y divide-linha rounded-controle border border-linha text-[15px]">
            {[
              ['Rede', <span key="rede">{rede?.nome} <span className="text-sutil">· {rede?.tipo}</span></span>],
              ['Escola', nome.trim()],
              ['Endereço', <span key="end" className="font-medium">{enderecoCompleto(final)}</span>],
              ['Cidade', cidade.trim()],
              ['Coordenação', <span key="coord" className="text-sutil">sem convite; você convida depois de criar</span>],
            ].map(([r, v]) => (
              <div key={r as string} className="grid grid-cols-[110px_1fr] gap-3 px-3.5 py-2.5">
                <dt className="text-sutil">{r}</dt>
                <dd className="min-w-0 break-words text-tinta">{v}</dd>
              </div>
            ))}
          </dl>
        )}

        <DialogFooter className="gap-2 sm:space-x-0">
          {etapa === 1 ? (
            <>
              <Button variant="secundario" onClick={aoFechar}>Cancelar</Button>
              <Button type="submit" form="form-escola" variant="primario" disabled={!pode}>Revisar</Button>
            </>
          ) : (
            <>
              <Button variant="secundario" onClick={() => setEtapa(1)}>Voltar</Button>
              <Button variant="primario" onClick={() => rede && aoCriar({ nome: nome.trim(), rede, slug: final, cidade: cidade.trim() })}>Criar escola</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Convidar coordenação: o link aparece UMA vez ─────────────────────────────────────────────────────── */

export function DialogoConvite({ escola, refazer, aoFechar, aoGerar }: {
  escola: EscolaNaTela; refazer: boolean; aoFechar: () => void; aoGerar: (escolaId: string, validade: string) => void
}) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [conferir, setConferir] = useState(false)
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const pode = nome.trim().length >= 3 && emailOk

  function gerar() {
    setLink(`turmma.com/convite#${novoToken()}`)
    aoGerar(escola.id, validadeDeHoje())
  }
  async function copiar() {
    if (!link) return
    try { await navigator.clipboard.writeText(`https://${link}`) } catch { /* sem área de transferência: o campo continua selecionável */ }
    setCopiado(true)
  }
  function tentarFechar() {
    if (link && !copiado) setConferir(true)
    else aoFechar()
  }

  return (
    <>
      <Dialog open onOpenChange={(v) => { if (!v) tentarFechar() }}>
        <DialogContent className={cn(CANTO_DIALOGO, 'max-h-[92svh] max-w-xl gap-5 overflow-y-auto outline-none focus:outline-none focus-visible:ring-0')}
          onInteractOutside={(e) => { if (link && !copiado) { e.preventDefault(); setConferir(true) } }}>
          <DialogHeader className="text-left">
            <p className="rotulo">{escola.nome}</p>
            <DialogTitle className={TITULO}>{link ? 'Convite gerado' : refazer ? 'Refazer convite da coordenação' : 'Convidar coordenação'}</DialogTitle>
            <DialogDescription className={DESCRICAO}>
              {link
                ? <>Mande o link a <b className="font-semibold text-tinta">{nome.trim()}</b>. Ninguém da Turmma vê a senha nem o segundo fator dela.</>
                : 'A primeira coordenadora entra por convite. Depois, é ela quem convida o resto da equipe da escola.'}
            </DialogDescription>
          </DialogHeader>

          {!link ? (
            <form id="form-convite" className="grid gap-4" onSubmit={(e) => { e.preventDefault(); if (pode) gerar() }}>
              <Campo id="conv-nome" rotulo="Nome da coordenadora">
                <Input id="conv-nome" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} className={campo} autoComplete="off" />
              </Campo>
              <Campo id="conv-email" rotulo="E-mail da coordenadora"
                erro={email.trim() && !emailOk ? 'Confira o e-mail: falta algo no endereço.' : undefined}
                dica="Só para identificar o convite. O link vai por você, não por e-mail automático.">
                <Input id="conv-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} autoComplete="off" />
              </Campo>
            </form>
          ) : (
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="conv-link" className="text-[13px] font-medium text-sutil">Link do convite</Label>
                <div className="flex flex-wrap gap-2">
                  <div className="relative min-w-0 flex-1 basis-60">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sutil" />
                    <Input id="conv-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()}
                      className={cn(campo, 'bg-lateral pl-9 font-mono text-[13px] text-tinta')} />
                  </div>
                  <Button autoFocus variant={copiado ? 'secundario' : 'oficial'} onClick={copiar} aria-live="polite">
                    {copiado ? <><Check className="text-ok" /> Copiado</> : <><Copy /> Copiar link</>}
                  </Button>
                </div>
              </div>
              <p className="flex gap-2 rounded-controle bg-pendente-cx px-3.5 py-2.5 text-sm leading-snug text-pendente">
                <KeyRound className="mt-0.5 size-4 shrink-0" strokeWidth={2} />{TEXTO_DO_LINK_UMA_VEZ}
              </p>
              <p className="text-sm leading-relaxed text-sutil">
                A coordenadora abre o link, cria a senha e configura o segundo fator. {TEXTO_DA_VALIDADE_DO_CONVITE}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:space-x-0">
            {!link ? (
              <>
                <Button variant="secundario" onClick={aoFechar}>Cancelar</Button>
                <Button type="submit" form="form-convite" variant="primario" disabled={!pode}>Gerar convite</Button>
              </>
            ) : (
              <Button variant={copiado ? 'primario' : 'secundario'} onClick={tentarFechar}>Fechar</Button>
            )}
          </DialogFooter>
          <NotaMockup>
            O token vive só neste diálogo (o produto guarda o resumo dele, não o link). Refazer convite gera um link novo e o
            anterior deixa de valer. O e-mail serve para conferir quem aceitou; o envio é pela operação, fora do sistema.
          </NotaMockup>
        </DialogContent>
      </Dialog>

      <AlertDialog open={conferir} onOpenChange={setConferir}>
        <AlertDialogContent className={cn(CANTO_DIALOGO, 'max-w-md')}>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className={TITULO}>Fechar sem copiar?</AlertDialogTitle>
            <AlertDialogDescription className={DESCRICAO}>
              O link aparece uma vez só. Se fechar agora, ele não aparece de novo, e será preciso refazer o convite.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            <AlertDialogCancel className={cn(buttonVariants({ variant: 'oficial' }), 'mt-0 border-0')}>Voltar ao link</AlertDialogCancel>
            <AlertDialogAction className={cn(buttonVariants({ variant: 'perigo' }), 'bg-transparent hover:bg-erro-cx')} onClick={aoFechar}>Fechar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* ── Revogar convite ──────────────────────────────────────────────────────────────────────────────────── */

export function DialogoRevogar({ escola, aoFechar, aoConfirmar }: { escola: EscolaNaTela; aoFechar: () => void; aoConfirmar: () => void }) {
  return (
    <AlertDialog open onOpenChange={(v) => { if (!v) aoFechar() }}>
      <AlertDialogContent className={cn(CANTO_DIALOGO, 'max-w-md')}>
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className={TITULO}>Revogar o convite?</AlertDialogTitle>
          <AlertDialogDescription className={DESCRICAO}>
            O link do convite da <b className="font-semibold text-tinta">{escola.nome}</b> deixa de valer na hora. A escola volta a ficar sem
            coordenação, e você pode convidar de novo quando quiser.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0 rounded-full">Cancelar</AlertDialogCancel>
          <AlertDialogAction className={cn(buttonVariants({ variant: 'perigo' }), 'bg-erro text-white hover:bg-[#912018] hover:text-white')} onClick={aoConfirmar}>
            Revogar convite
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
