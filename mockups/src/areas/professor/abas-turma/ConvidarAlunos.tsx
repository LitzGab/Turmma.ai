import { useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Check, Copy, Presentation, X } from 'lucide-react'
import { Botao, BotaoIcone, Cartao, Dialogo, DialogoConfirmar, EstadoVazio, Segmentado } from '@/components/duo'
import { acessos, listaDe, useAcesso, useAlunosDaTurma, type AcessoTurma } from '@/dados/acesso'
import { escolaDe } from '@/dados/escola'
import { codigoEmDoisGrupos, ENDERECO_DA_TURMA, rotuloDaValidade, textoDoWhatsApp, VALIDADES_DO_ACESSO, type ValidadeDoAcesso } from '@/dados/estrutura'
import { turmaDaProfessora } from '@/dados/turmas-professora'

/* CONVIDAR ALUNOS (12ª rodada, 04/10/2026; plano de polimento 5.2). A anatomia aprovada pelo Gabriel em 20/09 fica:
   o link com COPIAR e o WhatsApp, o código grande com COPIAR e PROJETAR. Agora o acesso é o da BASE (`useAcesso`,
   `acessos.gerar/revogar`): o código que a professora gera aqui é o mesmo que a página pública aceita (F1, passo 5).
   · Turma sem acesso (a 3ºA recém-confirmada, ou depois de revogar): a validade (1 · 7 · 30 dias) e GERAR O ACESSO.
   · Com acesso: link, WhatsApp (o nome da escola e o link, nunca nome de aluno), o código em 2 grupos, PROJETAR (tela
     cheia, para a sala ler), a validade em Segmentado (trocar pede confirmação: gera acesso novo), "Vale até…", GERAR NOVO e REVOGAR (os dois com confirmação).
   · Os pedidos para entrar NÃO moram aqui: moram na fila (item pedidos-<turma>) e na linha do topo da aba Alunos.
   `ConviteNaTela` é o mesmo corpo sem diálogo, para a turma em que ninguém entrou ainda. */

/** "26 de 32 entraram": os nomes da lista que já têm conta (aprovados), lidos do estado. */
export function entraramNa(turmaId: string) {
  const lista = listaDe(turmaId)
  return { entraram: lista.filter((n) => n.estado === 'aprovado').length, total: lista.length }
}

/** O mesmo, reativo: muda na hora quando a professora aprova um pedido. */
export function useEntraramNa(turmaId: string) {
  const lista = useAlunosDaTurma(turmaId)
  return { entraram: lista.filter((n) => n.situacao === 'na-turma').length, total: lista.length }
}

function WhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

/** Copia e diz "Copiado" por dois segundos. */
function useCopiar() {
  const [copiado, setCopiado] = useState<string | null>(null)
  const copiar = async (o: string, valor: string) => {
    try { await navigator.clipboard.writeText(valor) } catch { /* sem permissão: o aviso aparece do mesmo jeito */ }
    setCopiado(o)
    window.setTimeout(() => setCopiado((c) => (c === o ? null : c)), 2000)
  }
  return [copiado, copiar] as const
}

const OPCOES_VALIDADE = VALIDADES_DO_ACESSO.map((d) => ({ id: String(d), rotulo: rotuloDaValidade(d) }))

function EscolhaValidade({ dias, aoMudar }: { dias: ValidadeDoAcesso; aoMudar: (d: ValidadeDoAcesso) => void }) {
  return (
    <div className="grid gap-2">
      <p className="text-[15px] font-bold text-tinta">Vale por</p>
      <Segmentado rotulo="Por quanto tempo o acesso vale" valor={String(dias)} aoMudar={(v) => aoMudar(Number(v) as ValidadeDoAcesso)}
        opcoes={OPCOES_VALIDADE} className="w-full max-w-[360px]" />
    </div>
  )
}

/** O código em tela cheia, para projetar na sala. Esc ou o X voltam. */
function Projecao({ aberto, aoMudar, acesso, turma }: { aberto: boolean; aoMudar: (v: boolean) => void; acesso: AcessoTurma; turma: string }) {
  return (
    <DialogPrimitive.Root open={aberto} onOpenChange={aoMudar}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-white px-6 text-center text-tinta outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <DialogPrimitive.Title className="t-secao text-sutil">{turma}</DialogPrimitive.Title>
          <p className="font-bold leading-none tracking-[.12em] tabular-nums text-[clamp(56px,13vw,200px)]">{codigoEmDoisGrupos(acesso.codigo)}</p>
          <DialogPrimitive.Description className="max-w-[28ch] text-balance text-[clamp(18px,2.6vw,36px)] font-medium leading-tight sm:max-w-none">
            Abra <b className="font-bold">{ENDERECO_DA_TURMA}</b> e digite o código
          </DialogPrimitive.Description>
          <DialogPrimitive.Close asChild>
            <BotaoIcone rotulo="Fechar" variante="secundario" tamanho={48} className="absolute right-4 top-4 sm:right-6 sm:top-6"><X strokeWidth={2.5} /></BotaoIcone>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** O corpo do convite: sem acesso, gerar; com acesso, o link, o código e o que se faz com eles. */
function CorpoConvite({ turmaId }: { turmaId: string }) {
  const acesso = useAcesso(turmaId)
  const t = turmaDaProfessora(turmaId)
  const escola = escolaDe(t?.escolaId ?? 'aurora')
  const { entraram, total } = useEntraramNa(turmaId)
  const [dias, setDias] = useState<ValidadeDoAcesso>(7)
  const [novoDias, setNovoDias] = useState<ValidadeDoAcesso>(7)
  const [gerandoNovo, setGerandoNovo] = useState(false)
  const [revogando, setRevogando] = useState(false)
  const [projetando, setProjetando] = useState(false)
  const [copiado, copiar] = useCopiar()

  if (!acesso) {
    return (
      <div className="grid gap-5">
        <EscolhaValidade dias={dias} aoMudar={setDias} />
        <Botao onClick={() => acessos.gerar(turmaId, dias)} className="justify-self-start">Gerar o acesso</Botao>
        <p className="t-apoio">{entraram} de {total} entraram</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <p className="text-[15px] font-bold text-tinta">Link da turma</p>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="flex h-12 min-w-0 flex-1 max-sm:basis-full items-center truncate rounded-[12px] border-2 border-borda bg-fundo-suave px-3.5 text-[15px] font-medium text-apoio" title={`${ENDERECO_DA_TURMA}#${acesso.token}`} data-link={acesso.link}>
            {`${ENDERECO_DA_TURMA}#${acesso.token}`}
          </span>
          <Botao variante="secundario" tamanho="m" onClick={() => copiar('link', acesso.link)} icone={copiado === 'link' ? <Check strokeWidth={3} /> : <Copy strokeWidth={2.5} />}>
            <span className="max-sm:sr-only">{copiado === 'link' ? 'Copiado' : 'Copiar'}</span>
          </Botao>
          <a href={`https://wa.me/?text=${encodeURIComponent(textoDoWhatsApp(escola.nome, acesso.link))}`} target="_blank" rel="noreferrer"
            aria-label="Mandar pelo WhatsApp" title="Mandar pelo WhatsApp"
            className="grid size-12 shrink-0 place-items-center rounded-[12px] border-2 border-borda bg-white transition-colors duration-150 hover:bg-fundo-suave">
            <span className="grid size-8 place-items-center rounded-full bg-[#25D366] text-white"><WhatsApp className="size-[18px]" /></span>
          </a>
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-[15px] font-bold text-tinta">Código da turma</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="t-numero-g tracking-[.14em] text-tinta" aria-label={`Código ${acesso.codigo.split('').join(' ')}`}>{codigoEmDoisGrupos(acesso.codigo)}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Botao tamanho="m" onClick={() => copiar('codigo', acesso.codigo)} icone={copiado === 'codigo' ? <Check strokeWidth={3} /> : <Copy strokeWidth={2.5} />}>
              {copiado === 'codigo' ? 'Copiado' : 'Copiar código'}
            </Botao>
            <Botao variante="secundario" tamanho="m" onClick={() => setProjetando(true)} icone={<Presentation strokeWidth={2.5} />}>Projetar</Botao>
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <p className="text-[15px] font-bold text-tinta">Vale por</p>
        <Segmentado rotulo="Por quanto tempo o acesso vale" valor={String(acesso.dias)} opcoes={OPCOES_VALIDADE} className="w-full max-w-[360px]"
          aoMudar={(v) => { const d = Number(v) as ValidadeDoAcesso; if (d !== acesso.dias) { setNovoDias(d); setGerandoNovo(true) } }} />
        <p className="t-apoio">Vale até {acesso.ate}.</p>
      </div>

      <p className="rounded-[12px] bg-amarelo-claro px-3.5 py-2.5 text-[15px] font-medium leading-5 text-amarelo-texto">
        Quem tem o código vê os nomes livres. Mande só para a turma.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="t-apoio">{entraram} de {total} entraram</p>
        <div className="flex items-center gap-2">
          <Botao variante="secundario" tamanho="p" onClick={() => { setNovoDias(acesso.dias); setGerandoNovo(true) }}>Gerar novo</Botao>
          <Botao variante="perigo" tamanho="p" onClick={() => setRevogando(true)}>Revogar</Botao>
        </div>
      </div>

      <Projecao aberto={projetando} aoMudar={setProjetando} acesso={acesso} turma={`${t?.nome ?? ''} · ${t?.disciplina ?? ''}`} />
      <DialogoConfirmar aberto={gerandoNovo} aoMudar={setGerandoNovo} titulo="Gerar um acesso novo?"
        frase={novoDias !== acesso.dias ? `Trocar a validade gera um link e um código novos. Os de agora param de valer na hora.` : 'O link e o código de agora param de valer na hora.'}
        confirmar={{ rotulo: 'Gerar novo', aoConfirmar: () => acessos.gerar(turmaId, novoDias) }}>
        <EscolhaValidade dias={novoDias} aoMudar={setNovoDias} />
      </DialogoConfirmar>
      <DialogoConfirmar aberto={revogando} aoMudar={setRevogando} titulo="Revogar o acesso?"
        frase="Ninguém mais entra com este link nem com este código. Os pedidos já feitos continuam."
        confirmar={{ rotulo: 'Revogar', variante: 'perigoCheio', aoConfirmar: () => acessos.revogar(turmaId) }} />
    </div>
  )
}

export function ConvidarAlunos({ turmaId, aberto, aoMudar }: { turmaId: string; aberto: boolean; aoMudar: (v: boolean) => void }) {
  const t = turmaDaProfessora(turmaId)
  const acesso = useAcesso(turmaId)
  return (
    <Dialogo aberto={aberto} aoMudar={aoMudar} titulo={`Convidar alunos · ${t?.nome ?? ''}`} largura={560}
      descricao="O link e o código da turma, para os alunos pedirem o próprio nome.">
      <CorpoConvite key={`${turmaId}-${acesso ? 'com' : 'sem'}`} turmaId={turmaId} />
    </Dialogo>
  )
}

/** A turma em que ninguém entrou ainda: o convite na própria tela, sem diálogo. */
export function ConviteNaTela({ turmaId }: { turmaId: string }) {
  const lista = useAlunosDaTurma(turmaId)
  if (lista.length === 0) return <EstadoVazio titulo="A lista ainda não chegou" className="py-10" />
  return (
    <Cartao className="grid gap-4" classeCaixa="mx-auto w-full max-w-[560px]">
      <h2 className="t-secao text-tinta">Convidar alunos</h2>
      <CorpoConvite turmaId={turmaId} />
    </Cartao>
  )
}
