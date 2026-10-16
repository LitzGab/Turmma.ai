import * as React from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Globe, Paperclip, Plus, X } from 'lucide-react'
import { Botao, Dialogo, Opcao } from '@/components/duo'
import { Icone } from '@/components/duo/icones'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileUpload, type ArquivoAnexado } from '@/components/ui/file-upload'
import { InputBar, type ChatStatus } from '@/components/ui/input-bar'
import { ModeSelector, type ModeOption } from '@/components/ui/mode-selector'
import { IconeFerramenta } from '@/components/turmma/icones-ferramenta'
import { DialogoAdaptar } from '@/components/turmma/adaptar'
import { ESCOLAS } from '@/dados/escola'
import { useEscolaAtiva } from '@/dados/escola-ativa'
import { aulaAgoraOuProxima } from '@/dados/grade'
import { useProfessorAtual } from '@/dados/sessao'
import { useTurmasDoProfessor, type TurmaProfessora } from '@/dados/turmas-professora'
import { cn } from '@/lib/utils'

/* A CAIXA DE PEDIDO DO PROFESSOR e os ATALHOS embaixo dela (12ª rodada, 04/10/2026; plano de polimento, 5.2).

   · A caixa tem UMA escolha visível, a turma, que já nasce com a da aula de agora ou da próxima (a grade da sessão).
     Quem não tem turma (o professor recém-chegado, antes de confirmar) não vê a pílula. Dentro da conversa a pílula
     sai (`semTurma`): a conversa já tem turma, e trocar no meio confundiria a origem do material.
   · O "+" leva "Anexar arquivo" (que pergunta de quem é o material, sem nada marcado, D5; apostila de terceiro sem
     licença não entra) e "Buscar também na internet" (D68: desligada; ligada, vale só para esta conversa e o que vier
     de fora sai marcado). O anexo NÃO entra no material da escola.
   · Os atalhos (14ª rodada, 05/10/2026; plano ux-composicao 1.3): pílulas de 40 px numa linha (o Botao secundário m,
     com o ícone da ferramenta a 24) — PROVA · PLANO DE AULA · ATIVIDADE · ADAPTAR · FERRAMENTAS →. Os três primeiros
     abrem a conversa nova com o cartão da ferramenta já preenchido para a turma. ADAPTAR abre a janela Adaptar
     (turmma/adaptar.tsx), que também abre com `?adaptar=1` no endereço (`&doc=` já escolhe o documento; `&turma=`
     troca a turma do pedido). FERRAMENTAS → leva à aba da lateral (/professor/ferramentas?turma=), que substituiu a
     janela "Mais". No celular, 3 + 2 centradas. */

const ORIGENS = [
  { id: 'meu', nome: 'É meu' },
  { id: 'escola', nome: 'É da escola' },
  { id: 'licenca', nome: 'De terceiro, com licença' },
]

/** A turma do pedido, para quem está dentro da caixa ou do "Mais" (os atalhos levam a turma junto). */
export const TurmaDoPedidoContext = createContext<string | null>(null)
export const useTurmaDoPedido = () => useContext(TurmaDoPedidoContext)

/** As turmas como opções do menu, por escola, com a escola ativa na frente. */
function opcoesDeTurma(escolaAtivaId: string, turmas: TurmaProfessora[]): ModeOption[] {
  const ordem = [...ESCOLAS].sort((a, b) => Number(b.id === escolaAtivaId) - Number(a.id === escolaAtivaId))
  return ordem.flatMap((e) => turmas.filter((t) => t.escolaId === e.id).map((t) => ({
    id: t.id, label: t.nome, selo: t.nome, nome: t.disciplina,
    description: `${t.serie}, ${t.alunos} alunos`, grupo: e.nome,
  })))
}

/** A turma que a caixa já traz: a da aula de agora ou da próxima; sem grade, a primeira turma da escola; sem turma, ''. */
export function useTurmaDaSessao(): string {
  const prof = useProfessorAtual()
  const escola = useEscolaAtiva()
  const turmas = useTurmasDoProfessor()
  const daGrade = aulaAgoraOuProxima(prof.id, escola.id)?.aula.turmaId
  if (daGrade && turmas.some((t) => t.id === daGrade)) return daGrade
  return turmas.find((t) => t.escolaId === escola.id)?.id ?? turmas[0]?.id ?? ''
}

export type ExtraPedido = { turmaId: string; anexos: string[]; internet?: boolean }

export function CaixaPedido({ valor, aoMudar, aoEnviar, aoParar, status = 'ready', lado = 'bottom', placeholder, autoFocus, className, turmaInicial, aoMudarTurma, semTurma = false }: {
  valor: string; aoMudar: (v: string) => void; aoEnviar: (texto: string, extra: ExtraPedido) => void; aoParar?: () => void
  /** a turma que já vem escolhida (a da conversa). Sem ela, vale a da aula de agora ou da próxima */
  turmaInicial?: string
  /** avisa quem desenha os atalhos de qual turma é o pedido */
  aoMudarTurma?: (turmaId: string) => void
  status?: ChatStatus
  /** sem efeito: a ferramenta virou atalho embaixo da caixa */
  ferramenta?: string
  /** sem efeito */
  aoMudarFerramenta?: (id: string) => void
  lado?: 'top' | 'bottom'; placeholder?: string; autoFocus?: boolean; className?: string
  /** dentro da conversa: sem a pílula de turma (a conversa já tem turma) */
  semTurma?: boolean
}) {
  const escola = useEscolaAtiva()
  const turmas = useTurmasDoProfessor()
  const daSessao = useTurmaDaSessao()
  const [internet, setInternet] = useState(false)
  // `naEscola` guarda em que escola a escolha foi feita; `null` é a turma que veio de fora e vale sempre.
  const [escolha, setEscolha] = useState<{ id: string; naEscola: string | null } | null>(turmaInicial ? { id: turmaInicial, naEscola: null } : null)
  const [anexos, setAnexos] = useState<ArquivoAnexado[]>([])
  const [escolhendo, setEscolhendo] = useState<ArquivoAnexado[] | null>(null)
  const [origem, setOrigem] = useState<string | null>(null)

  const opcoesTurma = useMemo(() => opcoesDeTurma(escola.id, turmas), [escola.id, turmas])
  const turma = escolha && (escolha.naEscola === null || escolha.naEscola === escola.id) ? escolha.id : daSessao
  useEffect(() => { aoMudarTurma?.(turma) }, [turma, aoMudarTurma])
  const fecharAnexo = () => { setEscolhendo(null); setOrigem(null) }

  return (
    <>
    <div className={className}>
    <InputBar
      attachedFiles={anexos.map((a) => ({ id: a.id, filename: a.name, size: a.size }))}
      onRemoveFile={(id) => setAnexos((l) => l.filter((a) => a.id !== id))}
      value={valor}
      onChange={aoMudar}
      status={status}
      onStop={aoParar}
      autoFocus={autoFocus}
      placeholder={placeholder ?? 'Peça uma prova, uma atividade, um plano de aula…'}
      onSend={(m) => { aoEnviar(m.content, { turmaId: turma, anexos: anexos.map((a) => a.name), internet }); setAnexos([]) }}
      leftActions={
        <>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Anexar ou buscar na internet"
                className="grid size-9 place-items-center rounded-full border-2 border-borda bg-campo text-apoio transition-colors duration-150 hover:border-borda-forte hover:bg-fundo-suave hover:text-tinta data-[state=open]:border-azul-borda data-[state=open]:bg-azul-claro data-[state=open]:text-azul-texto">
                <Plus className="size-5" strokeWidth={2.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={lado} align="start" sideOffset={8}
              className="w-72 rounded-[16px] border-2 border-borda p-1.5 shadow-[0_4px_0_0_var(--color-borda)]">
              <DropdownMenuItem className="h-11 gap-3 rounded-[10px] text-[15px] font-medium text-tinta" onSelect={() => setEscolhendo([])}>
                <Paperclip className="size-5 text-sutil" strokeWidth={2.5} /> Anexar arquivo
              </DropdownMenuItem>
              <DropdownMenuItem role="menuitemcheckbox" aria-checked={internet} className="h-11 gap-3 rounded-[10px] text-[15px] font-medium text-tinta"
                onSelect={(e) => { e.preventDefault(); setInternet((v) => !v) }}>
                <Globe className="size-5 text-sutil" strokeWidth={2.5} />
                <span className="flex-1">Buscar também na internet</span>
                <span aria-hidden className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150', internet ? 'bg-azul' : 'bg-borda')}>
                  <span className={cn('absolute top-1 size-4 rounded-full bg-white transition-transform duration-150', internet ? 'translate-x-5' : 'translate-x-1')} />
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {internet && (
            <button type="button" onClick={() => setInternet(false)} aria-label="Desligar a busca na internet"
              className="inline-flex h-9 items-center gap-1.5 rounded-[12px] border-2 border-azul-borda bg-azul-claro pl-2.5 pr-2 text-[14px] font-bold text-azul-texto transition-[filter] duration-150 hover:brightness-[.98]">
              <Globe className="size-4" strokeWidth={2.5} /> Internet <X className="size-4" strokeWidth={2.5} />
            </button>
          )}
        </>
      }
      rightActions={!semTurma && turma && opcoesTurma.length > 0 ? (
        <ModeSelector modes={opcoesTurma} value={turma} onChange={(id) => setEscolha({ id, naEscola: escola.id })} side={lado} align="end" ariaLabel="Escolher turma" titulo="Para qual turma"
          className="h-10 gap-2 rounded-[12px] border-2 border-borda bg-campo px-3 text-[15px] text-tinta hover:border-borda-forte hover:bg-fundo-suave [&>span]:font-bold [&>svg]:size-4 [&>svg]:opacity-100" />
      ) : undefined}
    />
    {internet && <p className="t-apoio mt-2 px-1">Vale só para esta conversa e sai marcado.</p>}
    </div>

    <Dialogo aberto={escolhendo !== null} aoMudar={(v) => { if (!v) fecharAnexo() }} titulo="Anexar à conversa" largura={520}
      descricao="Vale só nesta conversa. Não entra no material da escola."
      rodape={(
        <>
          <Botao variante="secundario" tamanho="m" onClick={fecharAnexo}>Cancelar</Botao>
          <Botao variante="oficial" tamanho="m" disabled={!escolhendo?.length || !origem}
            onClick={() => { setAnexos((l) => [...l, ...(escolhendo ?? []).filter((n) => !l.some((a) => a.id === n.id))]); fecharAnexo() }}>
            Anexar
          </Botao>
        </>
      )}>
      <div className="grid gap-5">
        <FileUpload files={escolhendo ?? []} onFilesChange={setEscolhendo} />
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[17px] font-bold text-tinta">De quem é este material?</legend>
          {ORIGENS.map((o) => (
            <Opcao key={o.id} tipo="radio" nome="origem" valor={o.id} marcado={origem === o.id} aoMudar={(v) => { if (v) setOrigem(o.id) }}>{o.nome}</Opcao>
          ))}
          <p className="t-apoio mt-1">Apostila de terceiro sem licença não entra.</p>
        </fieldset>
      </div>
    </Dialogo>
    </>
  )
}

/* ── Os atalhos embaixo da caixa ───────────────────────────────────────────────────────────────────────── */

const ATALHOS: { id: string; rotulo: string }[] = [
  { id: 'prova', rotulo: 'Prova' },
  { id: 'plano', rotulo: 'Plano de aula' },
  { id: 'atividade', rotulo: 'Atividade' },
]

/** Uma pílula de atalho: o botão secundário m (40 px) com o ícone ilustrado a 24. */
function Pilula({ rotulo, icone, onClick }: { rotulo: string; icone: React.ReactNode; onClick: () => void }) {
  return (
    <Botao variante="secundario" tamanho="m" onClick={onClick} icone={icone}
      className="group [&>.face]:gap-1.5 [&>.face]:pl-2 [&>.face]:pr-3">
      {rotulo}
    </Botao>
  )
}

export function AtalhosFerramenta({ turmaId, className }: { turmaId: string; className?: string }) {
  const navegar = useNavigate()
  const [params, setParams] = useSearchParams()
  const adaptar = params.get('adaptar') === '1'
  /* fechar a janela Adaptar tira do endereço tudo o que é dela, de uma vez */
  const mudarAdaptar = useCallback((v: boolean) => setParams((atual) => {
    const p = new URLSearchParams(atual)
    if (v) p.set('adaptar', '1')
    else { p.delete('adaptar'); p.delete('doc'); p.delete('turma') }
    return p
  }, { replace: true }), [setParams])
  const abrir = (id: string) => navegar(`/professor/conversa/nova?ferramenta=${encodeURIComponent(id)}${turmaId ? `&turma=${encodeURIComponent(turmaId)}` : ''}`)
  /* o botão m força os svg a 18 px; o ícone ilustrado fica a 24 */
  const icone = (id: string) => <IconeFerramenta id={id} className="size-6!" />
  return (
    <TurmaDoPedidoContext.Provider value={turmaId}>
      {/* numa linha; no celular, 2 + 2 + 1 centradas (3 pílulas de 40 px não cabem em 343 px sem encolher o toque) */}
      <nav aria-label="Atalhos" className={cn('flex flex-wrap justify-center gap-x-2 gap-y-3 max-md:mx-auto max-md:max-w-[350px]', className)}>
        {ATALHOS.map((a) => <Pilula key={a.id} rotulo={a.rotulo} onClick={() => abrir(a.id)} icone={icone(a.id)} />)}
        <Pilula rotulo="Adaptar" onClick={() => mudarAdaptar(true)} icone={icone('adaptacao')} />
        <Botao variante="secundario" tamanho="m" icone={<span aria-hidden className="grid size-6 place-items-center [&>svg]:size-6!"><Icone id="mais" tamanho={24} /></span>}
          onClick={() => navegar(`/professor/ferramentas${turmaId ? `?turma=${encodeURIComponent(turmaId)}` : ''}`)}
          className="[&>.face]:gap-1.5 [&>.face]:pl-2 [&>.face]:pr-3">
          Ferramentas <ArrowRight aria-hidden strokeWidth={2.75} />
        </Botao>
      </nav>
      <DialogoAdaptar aberto={adaptar} aoMudar={mudarAdaptar} turmaId={params.get('turma') || turmaId} docId={params.get('doc') ?? undefined} />
    </TurmaDoPedidoContext.Provider>
  )
}
