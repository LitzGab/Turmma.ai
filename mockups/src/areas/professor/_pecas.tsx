import { useMemo, useState, type ReactNode } from 'react'
import { AlertTriangle, HandHelping, Lock, Repeat2, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge-2'
import { Botao, Dialogo, Opcao } from '@/components/duo'
import { MensagemIA, MensagemPessoa } from '@/components/turmma/conversa'
import { ChipFonte } from '@/components/turmma/ia'
import { registrar, useAgora } from '@/dados/demo/nucleo'
import { useProfessorAtual } from '@/dados/sessao'
import { cn } from '@/lib/utils'
import { useItensDoSino } from '@/components/turmma/sino'

/* Peças que só a área do professor usa. 12ª rodada (04/10/2026): a mesma assinatura de antes, com a pele duo —
   borda de 2 px, canto de 12 a 16, degrau sólido no que flutua, letra de 14 ou mais. Abrir a conversa de um aluno
   agora REGISTRA o evento (aparece na auditoria da coordenação). */

/** Vestes das abas (shadcn/tabs), para as telas que ainda as usam: o segmentado duo (ativo em azul). */
export const abasLista = 'h-auto w-full justify-start gap-0.5 rounded-[12px] border-2 border-borda bg-white p-0.5 text-sutil sm:w-auto'
export const abaGatilho = 'h-10 flex-1 rounded-[9px] border-2 border-transparent px-4 text-[15px] font-bold text-sutil shadow-none transition-colors duration-150 hover:text-tinta data-[state=active]:border-azul-borda data-[state=active]:bg-azul-claro data-[state=active]:text-azul-texto data-[state=active]:shadow-none sm:flex-none'

/** Veste dos diálogos antigos: canto 16, borda de 2 px e degrau sólido (nenhuma sombra borrada). */
export const dialogo = 'max-h-[calc(100svh-32px)] w-[calc(100vw-32px)] gap-5 overflow-y-auto rounded-[16px] border-2 border-borda bg-white p-5 shadow-[0_4px_0_0_var(--color-borda)] sm:rounded-[16px] sm:p-6'

export const campo = 'h-12 rounded-[12px] border-2 border-borda bg-white text-[17px] font-medium focus-visible:border-azul-borda'

/* Sinais do Tutor: derivam de fato declarado — entrega, desempenho, o que o aluno escreveu.
   Nunca de emoção, atenção ou comportamento (D57, regra 70 item 7). Sempre ícone + texto. */
export type TipoSinal = 'travou' | 'pronta' | 'repetiu' | 'atencao'

const SINAL = {
  travou: { rotulo: 'Travou', icone: AlertTriangle, variante: 'pendente' },
  pronta: { rotulo: 'Pediu resposta pronta', icone: HandHelping, variante: 'info' },
  repetiu: { rotulo: 'Dúvida que se repetiu', icone: Repeat2, variante: 'contorno' },
  atencao: { rotulo: 'Precisa de atenção humana', icone: ShieldAlert, variante: 'erro' },
} as const

export function Sinal({ tipo, detalhe, className }: { tipo: TipoSinal; detalhe?: string; className?: string }) {
  const s = SINAL[tipo]
  const Icone = s.icone
  return (
    <Badge variant={s.variante} size="md" className={cn('h-auto min-h-6 whitespace-normal py-0.5 text-left', className)}>
      <Icone strokeWidth={2.5} />
      <span>{s.rotulo}{detalhe ? ` · ${detalhe}` : ''}</span>
    </Badge>
  )
}

const MOTIVOS = [
  'Entender onde o aluno travou',
  'Conferir um pedido de resposta pronta',
  'Acompanhar um sinal de atenção humana',
  'Pedido da família ou da coordenação',
]

/** Abrir a conversa de um aluno é ação explícita e fica em auditoria (regra 50, item 10; regra 20, item 10). */
export function DialogoAuditoria({ aluno, aberto, aoMudar, aoConfirmar }: {
  aluno: string | null; aberto: boolean; aoMudar: (v: boolean) => void; aoConfirmar: (motivo: string) => void
}) {
  const [motivo, setMotivo] = useState(MOTIVOS[0])
  const confirmar = () => {
    registrar('conversa-aberta', { aluno, motivo })
    aoConfirmar(motivo)
    aoMudar(false)
  }
  return (
    <Dialogo aberto={aberto} aoMudar={aoMudar} titulo={`Abrir a conversa de ${aluno ?? 'um aluno'}?`} largura={520}
      rodape={(
        <div className="grid w-full grid-cols-2 gap-3">
          <Botao variante="secundario" largura="cheia" onClick={() => aoMudar(false)}>Não abrir</Botao>
          <Botao variante="oficial" largura="cheia" onClick={confirmar}>Abrir e registrar</Botao>
        </div>
      )}>
      <div className="grid gap-4">
        <p className="flex items-start gap-2 text-[15px] font-medium leading-[21px] text-apoio">
          <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-sutil" strokeWidth={2.5} />
          Fica registrado: quem abriu, quando e por quê.
        </p>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-[15px] font-bold text-tinta">Por que você está abrindo</legend>
          {MOTIVOS.map((m) => (
            <Opcao key={m} nome="motivo-auditoria" valor={m} marcado={motivo === m} aoMudar={() => setMotivo(m)}>{m}</Opcao>
          ))}
        </fieldset>
      </div>
    </Dialogo>
  )
}

/** O trecho da conversa, depois de aberta com registro. Só leitura. */
export function ConversaAberta({ aluno, motivo }: { aluno: string; motivo: string }) {
  const prof = useProfessorAtual()
  const agora = useAgora()
  return (
    <div className="animate-entra rounded-[16px] border-2 border-borda bg-white">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b-2 border-borda px-4 py-3 text-[14px] font-medium text-apoio">
        <Lock aria-hidden className="size-4 text-sutil" strokeWidth={2.5} />
        <b className="font-bold text-tinta">Conversa de {aluno}</b>· aberta por {prof.nome} · {agora.rotulo} · motivo: {motivo.toLowerCase()} · registrado
      </p>
      <div className="grid gap-5 p-4">
        <MensagemPessoa texto="me fala a resposta da 4 que eu não tô conseguindo" />
        <MensagemIA agente="tutor">
          A resposta pronta eu não dou, mas a gente chega nela. Na questão 4 você tem 54 g de alumínio. Quantos mols isso dá, se a massa molar do Al é 27? <ChipFonte pagina={145} />
        </MensagemIA>
        <MensagemPessoa texto="2 mol?" />
        <MensagemIA agente="tutor">
          Isso. Agora olhe a equação: 2 Al reagem com 3 Cl₂. Com 2 mol de Al, de quantos mols de Cl₂ você precisaria? Compare com o que você tem. <ChipFonte pagina={151} />
        </MensagemIA>
      </div>
    </div>
  )
}

/** Linha "rótulo: valor" para resumos dentro de cartão e diálogo. */
export function Par({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b-2 border-borda py-2.5 last:border-0">
      <dt className="t-apoio">{rotulo}</dt>
      <dd className="text-right text-[15px] font-bold text-tinta">{children}</dd>
    </div>
  )
}

/** Quantos itens do sino são desta turma: o MESMO número da lista que ?sino=<turmaId> abre (a fila e os documentos
    para aprovar; um item de várias turmas conta em cada uma delas). */
export function useEsperandoNaTurma(turmaId: string): number {
  const itens = useItensDoSino('professor')
  return useMemo(() => itens.filter((i) => (i.subitens?.length ? i.subitens.some((s) => s.turmaId === turmaId) : i.turmaId === turmaId)).length, [itens, turmaId])
}
