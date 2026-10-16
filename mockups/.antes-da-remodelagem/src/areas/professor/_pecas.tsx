import { useState, type ReactNode } from 'react'
import { AlertTriangle, CircleHelp, HandHelping, Repeat2, ShieldAlert } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge-2'
import { buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MensagemIA, MensagemPessoa } from '@/components/turmma/conversa'
import { ChipFonte } from '@/components/turmma/ia'
import { cn } from '@/lib/utils'

/* Peças que só a área do professor usa. Tudo aqui é montado sobre peças do 21st.dev
   (shadcn/tabs, alert-dialog, radio-group, sean0205/badge-2) e vestido com os tokens. */

/** Vestes das abas (shadcn/tabs): controle segmentado em pílula, como os do ChatGPT — trilho cinza-claro,
    aba ativa branca com um fio de sombra. 40 px no toque, 32 px com mouse. */
export const abasLista = 'h-auto w-full justify-start gap-0.5 rounded-full bg-realce-suave p-1 text-sutil sm:w-auto'
export const abaGatilho = 'h-10 flex-1 rounded-full px-4 text-[13.5px] font-medium text-sutil shadow-none transition-colors duration-150 hover:text-tinta data-[state=active]:bg-superficie data-[state=active]:text-tinta data-[state=active]:shadow-[0_0_0_1px_rgba(0,0,0,.06),0_1px_2px_rgba(0,0,0,.06)] sm:h-8 sm:flex-none'

/** Veste dos diálogos: canto de 24 px, linha fina, a única sombra do produto (9.3). */
export const dialogo = 'max-h-[calc(100svh-32px)] w-[calc(100vw-32px)] gap-5 overflow-y-auto rounded-[24px] border-linha bg-superficie p-5 shadow-flutua sm:rounded-[24px] sm:p-6'

export const campo = 'h-11 rounded-controle border-borda-campo bg-superficie text-[15px] md:h-10'

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
      <Icone strokeWidth={2.2} />
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
  return (
    <AlertDialog open={aberto} onOpenChange={aoMudar}>
      <AlertDialogContent className={dialogo}>
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="font-corpo text-lg font-semibold text-tinta">Abrir a conversa de {aluno} com o Tutor?</AlertDialogTitle>
          <AlertDialogDescription className="text-[15px] leading-relaxed text-apoio">
            Você vê os sinais sem abrir a conversa. Abrir fica registrado em auditoria: quem abriu, quando e por quê.
            O aluno sabe que o professor acompanha o uso do Tutor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-apoio">Por que você está abrindo</legend>
          <RadioGroup value={motivo} onValueChange={setMotivo} className="gap-1.5">
            {MOTIVOS.map((m) => (
              <Label key={m} className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-controle border px-3 text-[15px] font-normal text-tinta transition-colors duration-150',
                motivo === m ? 'border-noite bg-info-cx' : 'border-linha hover:bg-realce')}>
                <RadioGroupItem value={m} className="border-borda-campo text-noite" /> {m}
              </Label>
            ))}
          </RadioGroup>
        </fieldset>
        <AlertDialogFooter className="gap-2 sm:space-x-0">
          <AlertDialogCancel className="mt-0">Não abrir</AlertDialogCancel>
          <AlertDialogAction className={buttonVariants({ variant: 'oficial' })} onClick={() => aoConfirmar(motivo)}>Abrir e registrar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** O trecho da conversa, depois de aberta com registro. Só leitura. */
export function ConversaAberta({ aluno, motivo }: { aluno: string; motivo: string }) {
  return (
    <div className="animate-entra rounded-cartao border border-linha bg-superficie">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-linha px-4 py-3 text-[13px] text-apoio">
        <CircleHelp className="size-4 text-sutil" />
        <b className="font-semibold text-tinta">Conversa de {aluno}</b>· aberta por Camila Souza · 21/09, 10h47 · motivo: {motivo.toLowerCase()} · registrado em auditoria
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
    <div className="flex items-baseline justify-between gap-4 border-b border-linha py-2.5 last:border-0">
      <dt className="text-sm text-sutil">{rotulo}</dt>
      <dd className="text-right text-[15px] font-medium text-tinta">{children}</dd>
    </div>
  )
}
