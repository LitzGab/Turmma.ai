import { useMemo, useState } from 'react'
import { Globe, LayoutGrid, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileUpload, type ArquivoAnexado } from '@/components/ui/file-upload'
import { InputBar, type ChatStatus } from '@/components/ui/input-bar'
import { ModeSelector, type ModeOption } from '@/components/ui/mode-selector'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ESCOLAS, TURMAS } from '@/dados/escola'
import { useEscolaAtiva } from '@/dados/escola-ativa'
import { CATALOGO } from '@/dados/ferramentas'
import { cn } from '@/lib/utils'

/* A caixa de pedido do professor (11.2): serafimcloud/input-bar + serafimcloud/mode-selector.
   À esquerda, o que muda o pedido — Ferramenta (D18) e Web (D68, desligada por padrão e dizendo isso).
   À direita, o contexto — a TURMA, no lugar onde o ChatGPT põe o modelo — e enviar.
   O menu de ferramentas é um retângulo de tamanho fixo com rolagem por dentro (ver ui/mode-selector).
   ANEXAR DOCUMENTO (20/09/2026): o clipe abre a área de soltar arquivo (ui/file-upload) e o que entra aparece no
   campo como folhinha (ui/file-card-collections). O anexo vale só para a conversa e NÃO entra na base da escola;
   e, como em todo material, a professora declara de quem ele é — apostila de terceiro sem licença não entra por
   nenhum caminho, nem por aqui (D5).
   O MENU "PARA QUAL TURMA" (20/09/2026, "melhore a visualização"): eram quatro linhas só de texto. Agora cada turma
   é uma linha com o código num ladrilho ("2ºB", preto na escolhida), a disciplina em cima e "série · alunos · turno"
   embaixo, AGRUPADAS POR ESCOLA — a escola ativa (dados/escola-ativa) primeiro, a outra embaixo, com o nome dela.
   A pílula na caixa continua curta ("2ºB · Química"). Na Home, onde ninguém diz a turma de início, ela acompanha a
   escola: trocar de escola na lateral leva a caixa para a primeira turma de lá. */

const ORIGENS = [
  { id: 'meu', nome: 'É meu', apoio: 'Eu que fiz' },
  { id: 'escola', nome: 'É da escola', apoio: 'Material próprio' },
  { id: 'licenca', nome: 'De terceiro, com licença', apoio: 'A escola tem o direito de uso' },
]

/* O menu da caixa é o MESMO catálogo da página de Ferramentas (dados/ferramentas): uma fonte só. Fica de fora a
   Correção de objetiva, que não nasce de um pedido — quem dispara é a entrega da turma, e ela chega em "Esperando você". */
export const FERRAMENTAS: (ModeOption & { exemplo: string })[] = [
  { id: 'conversa', label: 'Só conversar', icon: MessageSquare, description: 'Responde aqui, sem salvar artefato', exemplo: '' },
  ...CATALOGO.filter((f) => !f.para).map((f) => ({ id: f.id, label: f.nome, icon: f.icon, description: f.curta, exemplo: f.exemplo })),
]

/** As turmas como opções do menu, por escola, com a escola ativa na frente. */
function opcoesDeTurma(escolaAtivaId: string): ModeOption[] {
  const ordem = [...ESCOLAS].sort((a, b) => Number(b.id === escolaAtivaId) - Number(a.id === escolaAtivaId))
  return ordem.flatMap((e) => TURMAS.filter((t) => t.escolaId === e.id).map((t) => ({
    id: t.id, label: `${t.nome} · ${t.disciplina}`, selo: t.nome, nome: t.disciplina,
    description: `${t.serie} · ${t.alunos} alunos · ${t.turno}`, grupo: e.nome,
  })))
}

export type ExtraPedido = { turmaId: string; anexos: string[] }

export function CaixaPedido({ valor, aoMudar, aoEnviar, aoParar, status = 'ready', ferramenta, aoMudarFerramenta, lado = 'bottom', placeholder, autoFocus, className, turmaInicial }: {
  valor: string; aoMudar: (v: string) => void; aoEnviar: (texto: string, extra: ExtraPedido) => void; aoParar?: () => void
  /** a turma que já vem escolhida: a do projeto, ou a da conversa. Sem ela, vale a primeira turma da escola ativa */
  turmaInicial?: string
  status?: ChatStatus; ferramenta: string; aoMudarFerramenta: (id: string) => void
  lado?: 'top' | 'bottom'; placeholder?: string; autoFocus?: boolean; className?: string
}) {
  const escola = useEscolaAtiva()
  const [web, setWeb] = useState(false)
  // `naEscola` guarda em que escola a escolha foi feita; `null` é a turma que veio de fora e vale sempre.
  const [escolha, setEscolha] = useState<{ id: string; naEscola: string | null } | null>(turmaInicial ? { id: turmaInicial, naEscola: null } : null)
  const [anexos, setAnexos] = useState<ArquivoAnexado[]>([])
  const [escolhendo, setEscolhendo] = useState<ArquivoAnexado[] | null>(null)
  const [origem, setOrigem] = useState('meu')

  const opcoesTurma = useMemo(() => opcoesDeTurma(escola.id), [escola.id])
  const turma = escolha && (escolha.naEscola === null || escolha.naEscola === escola.id) ? escolha.id : opcoesTurma[0].id

  return (
    <>
    <InputBar
      className={className}
      onAttach={() => setEscolhendo([])}
      attachedFiles={anexos.map((a) => ({ id: a.id, filename: a.name, size: a.size }))}
      onRemoveFile={(id) => setAnexos((l) => l.filter((a) => a.id !== id))}
      value={valor}
      onChange={aoMudar}
      status={status}
      onStop={aoParar}
      autoFocus={autoFocus}
      placeholder={placeholder ?? 'Peça uma prova, uma atividade, um plano de aula…'}
      onSend={(m) => { aoEnviar(m.content, { turmaId: turma, anexos: anexos.map((a) => a.name) }); setAnexos([]) }}
      leftActions={
        <>
          <ModeSelector modes={FERRAMENTAS} value={ferramenta} onChange={aoMudarFerramenta} side={lado} ariaLabel="Escolher ferramenta"
            titulo="Ferramentas" neutro={{ id: 'conversa', label: 'Ferramenta', icon: LayoutGrid }} separarPrimeira
            className={cn('border border-borda-campo', ferramenta !== 'conversa' && 'border-caramelo bg-pendente-cx font-medium text-pendente hover:bg-pendente-cx hover:text-pendente')} />
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" role="switch" aria-checked={web} onClick={() => setWeb((w) => !w)}
                  className={cn('inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13.5px] transition-colors duration-150 hover:bg-realce-suave',
                    web ? 'border-tinta bg-tinta font-medium text-white hover:bg-noite-alto' : 'border-borda-campo text-sutil hover:text-tinta')}>
                  <Globe className="size-4" strokeWidth={1.75} /> Web: {web ? 'ligada' : 'desligada'}
                </button>
              </TooltipTrigger>
              <TooltipContent side={lado} className="max-w-64 rounded-linha bg-noite px-3 py-2 text-[13px] leading-snug text-white">
                Vale só para esta conversa. O que vier de fora sai rotulado "da web" e não entra na base da escola.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      }
      rightActions={<ModeSelector modes={opcoesTurma} value={turma} onChange={(id) => setEscolha({ id, naEscola: escola.id })} side={lado} align="end" ariaLabel="Escolher turma" titulo="Para qual turma" className="text-tinta" />}
    />

    <Dialog open={escolhendo !== null} onOpenChange={(v) => { if (!v) setEscolhendo(null) }}>
      <DialogContent className="max-h-[calc(100svh-32px)] w-[calc(100vw-32px)] max-w-lg gap-4 overflow-y-auto rounded-[24px] border-0 bg-superficie p-5 shadow-flutua sm:rounded-[24px] sm:p-6">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="font-corpo text-lg font-semibold tracking-normal text-tinta">Anexar à conversa</DialogTitle>
          <DialogDescription className="text-[13.5px] leading-snug text-sutil">O Assistente lê o arquivo só nesta conversa. Ele não entra na base de material da escola.</DialogDescription>
        </DialogHeader>
        <FileUpload files={escolhendo ?? []} onFilesChange={setEscolhendo} />
        <fieldset>
          <legend className="rotulo mb-1.5">De quem é este material?</legend>
          <div className="grid gap-1.5 sm:grid-cols-3">
            {ORIGENS.map((o) => (
              <label key={o.id} className={cn('flex cursor-pointer flex-col rounded-controle border px-3 py-2 transition-colors duration-150', origem === o.id ? 'border-tinta bg-realce-suave' : 'border-linha hover:bg-realce-suave')}>
                <input type="radio" name="origem" value={o.id} checked={origem === o.id} onChange={() => setOrigem(o.id)} className="sr-only" />
                <span className="text-[13.5px] font-medium leading-snug text-tinta">{o.nome}</span>
                <span className="text-xs leading-snug text-sutil">{o.apoio}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs leading-snug text-sutil">Apostila ou livro de terceiro sem licença não pode ser usado aqui, nem anexado.</p>
        </fieldset>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-0">
          <Button variant="secundario" onClick={() => setEscolhendo(null)}>Cancelar</Button>
          <Button variant="oficial" disabled={!escolhendo?.length} onClick={() => { setAnexos((l) => [...l, ...(escolhendo ?? []).filter((n) => !l.some((a) => a.id === n.id))]); setEscolhendo(null) }}>
            Anexar{escolhendo?.length ? ` ${escolhendo.length} ${escolhendo.length === 1 ? 'arquivo' : 'arquivos'}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
