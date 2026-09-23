import { useState } from 'react'
import { Check, Clock3, Copy, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Iniciais } from '@/components/turmma/painel'
import { alunosDa } from '@/dados/alunos'
import { escolaDe, turmaDe } from '@/dados/escola'
import { cn } from '@/lib/utils'
import { dialogo } from '../_pecas'

/* CONVIDAR ALUNOS PARA A TURMA (pedido do Gabriel, 20/09/2026, com o print do "Adicionar alunos" da Teachy):
   "quando eu convido alguém para minha turma. Precisa ser assim. Link de convite, botão para o WhatsApp e o código."
   A anatomia é a da referência: o LINK da sala com copiar, o botão do WHATSAPP ao lado, o CÓDIGO da turma com
   copiar, e o rodapé com uma ação secundária e a de concluir.
   O que é nosso, por causa do produto:
   · D3: o aluno entra pelo link da sala, REIVINDICA O PRÓPRIO NOME na lista que a coordenação subiu, e o professor
     APROVA. Por isso, no lugar do "Adicionar manualmente" da Teachy, ficam os PEDIDOS PARA ENTRAR, com aprovar e recusar;
   · regra 20, item 8: link de sala sem validade circula em grupo de WhatsApp e vira porta aberta meses depois.
     Então o link e o código dizem ATÉ QUANDO valem, e "Gerar novos" derruba os anteriores na hora;
   · o verde é só o da marca do WhatsApp, no próprio símbolo: é logotipo de terceiro, não cor da interface.
   OITAVA RODADA (20/09/2026, "ctrl c e ctrl v da Teachy"): o diálogo ficou como estava. O que saiu foi o `BotaoConvidar`
   da barra da turma: como na Teachy, o convite agora abre pelo "Adicionar" da aba Alunos (abas-turma/Alunos.tsx), pelo
   "Gerenciar" da Visão Geral e pelo primário "Convidar alunos" da lista de turmas — cada um guarda o próprio `aberto`. */

const CODIGOS: Record<string, string> = { '2b': 'K7M2QXB', '2a': 'P3XN8DL', '1c': 'W9BJ4FT', '9a': 'T5GD3RN' }

/** "Gerar novos" dá sempre um código que ainda não apareceu (um código derrubado não pode voltar). Sorteio de semente
    fixa, sem as letras que se confundem com número (I, O) nem os números que se confundem com letra (0, 1). */
function codigoDa(turmaId: string, versao: number) {
  if (versao === 0) return CODIGOS[turmaId] ?? CODIGOS['2b']
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let a = [...turmaId].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) + versao * 2654435761
  return Array.from({ length: 7 }, () => { a = (Math.imul(a ^ (a >>> 15), 0x2C1B3C6D) + 0x6D2B79F5) | 0; return letras[(a >>> 8) % letras.length] }).join('')
}

/* Quem já reivindicou um nome e espera a professora. O nome vem da lista da turma: o aluno não digita nada sobre si. */
const PEDIDOS: Record<string, [indice: number, quando: string][]> = {
  '2b': [[12, 'há 4 min'], [19, 'há 20 min'], [27, 'ontem, 19h12']],
  '2a': [[3, 'há 1 h']],
  '1c': [[8, 'há 12 min'], [30, 'hoje, 7h48']],
  '9a': [],
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
      <span className={cn('min-w-0 flex-1 truncate text-tinta', grande ? 'text-[19px] font-semibold tracking-[.18em]' : 'text-[13.5px] sm:text-[14.5px]')}>{mostra ?? valor}</span>
      <span className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2 text-[12.5px] font-medium transition-colors duration-150 sm:px-2.5', copiado ? 'bg-ok-cx text-ok' : 'text-sutil group-hover:bg-superficie group-hover:text-tinta')}>
        {copiado ? <><Check className="size-3.5" strokeWidth={2.4} /> Copiado</> : <><Copy className="size-4" strokeWidth={1.75} /> <span className="hidden sm:inline">Copiar</span></>}
      </span>
    </button>
  )
}

export function ConvidarAlunos({ turmaId, aberto, aoMudar }: { turmaId: string; aberto: boolean; aoMudar: (v: boolean) => void }) {
  const turma = turmaDe(turmaId)
  const escola = escolaDe(turma.escolaId)
  const alunos = alunosDa(turma.id)
  const [versao, setVersao] = useState(0)
  const [decididos, setDecididos] = useState<Record<number, 'aprovado' | 'recusado'>>({})

  const codigo = codigoDa(turma.id, versao)
  const link = `https://turmma.com/sala/${codigo}`
  const pedidos = (PEDIDOS[turma.id] ?? []).filter(([i]) => alunos[i])
  const esperando = pedidos.filter(([i]) => !decididos[i])
  const entraram = alunos.length - pedidos.length + Object.values(decididos).filter((d) => d === 'aprovado').length
  const recado = `Sala do ${turma.nome} · ${turma.disciplina} no Turmma (${escola.nome}).\nEntre por aqui: ${link}\nOu abra turmma.com/entrar e use o código ${codigo}.\nEscolha o seu nome na lista e espere a professora aprovar. Vale até 28/09.`

  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      {/* o foco inicial fica no diálogo, não no campo do link: senão ele abre com o contorno preto de foco */}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className={cn(dialogo, 'max-w-[520px] grid-cols-[minmax(0,1fr)] gap-4')}>
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="font-corpo text-lg font-semibold tracking-normal text-tinta">Convidar alunos</DialogTitle>
          <DialogDescription className="text-[13.5px] leading-snug text-sutil">
            {turma.nome} · {turma.disciplina} · {entraram} de {alunos.length} já entraram
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
          <p className="rotulo">Link da sala</p>
          <div className="flex min-w-0 gap-2">
            <CampoCopia key={link} rotulo="Link da sala" valor={link} mostra={link.replace('https://', '')} />
            <a href={`https://wa.me/?text=${encodeURIComponent(recado)}`} target="_blank" rel="noreferrer" aria-label="Enviar o convite pelo WhatsApp" title="Enviar pelo WhatsApp"
              className="grid size-12 shrink-0 place-items-center rounded-controle bg-realce-suave transition-colors duration-150 hover:bg-realce">
              <span className="grid size-8 place-items-center rounded-full bg-[#25D366] text-white"><WhatsApp className="size-[18px]" /></span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
          <p className="rotulo">Código da turma</p>
          <div className="flex min-w-0"><CampoCopia key={codigo} rotulo="Código da turma" valor={codigo} grande /></div>
        </div>

        <p className="-mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] leading-snug text-sutil">
          <Clock3 className="size-3.5 shrink-0" strokeWidth={1.75} />
          <span>Valem até segunda, 28/09.{versao > 0 && <b className="font-medium text-tinta"> Os anteriores deixaram de valer.</b>}</span>
          <button type="button" onClick={() => setVersao((v) => v + 1)} className="inline-flex items-center gap-1 font-medium text-tinta underline-offset-4 hover:underline">
            <RefreshCw className="size-3" strokeWidth={2} /> Gerar novos
          </button>
        </p>

        <div className="rounded-controle border border-linha">
          <p className="flex items-center justify-between gap-3 border-b border-linha px-3.5 py-2.5 text-[13px] text-sutil">
            <span className="font-medium text-tinta">Pedidos para entrar</span>
            {esperando.length > 0
              ? <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-pendente-cx px-1 text-[11px] font-semibold text-pendente">{esperando.length}</span>
              : <span>nenhum esperando</span>}
          </p>
          {pedidos.length === 0 ? (
            <p className="px-3.5 py-3 text-[13px] leading-snug text-sutil">Quem entrar pelo link escolhe o próprio nome na lista da turma e aparece aqui para você aprovar.</p>
          ) : (
            <ul>
              {pedidos.map(([i, quando]) => {
                const a = alunos[i]
                const d = decididos[i]
                return (
                  <li key={a.id} className="flex h-12 items-center gap-2.5 border-b border-linha px-3.5 last:border-0">
                    <Iniciais nome={a.nome} className="size-7 text-[10.5px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium leading-tight text-tinta">{a.nome}</span>
                      <span className="block truncate text-xs leading-tight text-sutil"><span className="hidden sm:inline">pediu para entrar · </span>{quando}</span>
                    </span>
                    {d ? (
                      <span className={cn('text-[12.5px] font-medium', d === 'aprovado' ? 'text-ok' : 'text-sutil')}>{d === 'aprovado' ? 'Aprovado' : 'Recusado'}</span>
                    ) : (
                      <>
                        <Button variant="discreto" size="sm" className="h-8 w-8 px-0 sm:w-auto sm:px-2.5" aria-label={`Recusar o pedido de ${a.nome}`} onClick={() => setDecididos((x) => ({ ...x, [i]: 'recusado' }))}>
                          <X className="sm:hidden" strokeWidth={1.75} /><span className="hidden sm:inline">Recusar</span>
                        </Button>
                        <Button variant="oficial" size="sm" className="h-8 px-3" onClick={() => setDecididos((x) => ({ ...x, [i]: 'aprovado' }))}>Aprovar</Button>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-x-0">
          <p className="text-xs leading-snug text-sutil sm:max-w-[60%]">A lista de nomes vem da coordenação. Aqui ninguém se cadastra: só escolhe o próprio nome.</p>
          <Button onClick={() => aoMudar(false)}>Concluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
