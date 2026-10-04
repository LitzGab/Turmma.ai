import type { Agente } from '@educa/shared'
import { ChartColumn, MessageCircleQuestion, MessagesSquare, type LucideIcon } from 'lucide-react'

/**
 * A cor e o ícone de cada agente (`docs/interface.md` 9.7), dentro das três cores da D72. Quem conversa tem cor cheia: o
 * Assistente em preto com ícone branco (19,4:1), o Tutor no laranja da pinta com ícone `tinta` (6,4:1). O Analista, que
 * não conversa, fica no cinza do selo "IA", com ícone `tinta` (17,1:1).
 */
const APARENCIA_DO_AGENTE: Readonly<Record<Agente, { readonly icone: LucideIcon; readonly cor: string }>> = {
  assistente_de_ensino: { icone: MessagesSquare, cor: 'bg-noite text-white' },
  tutor: { icone: MessageCircleQuestion, cor: 'bg-caramelo text-tinta' },
  analista_de_desempenho_escolar: { icone: ChartColumn, cor: 'bg-ia-cx text-tinta' },
}

/** 24 px na linha da mensagem, 32 px na lateral, 48 px no cabeçalho da conversa e na tela Agentes da coordenação. */
const TAMANHO_DO_AVATAR = {
  24: { caixa: 'size-6', icone: 14 },
  32: { caixa: 'size-8', icone: 18 },
  48: { caixa: 'size-12', icone: 26 },
} as const
export type TamanhoDoAvatar = keyof typeof TAMANHO_DO_AVATAR

interface PropsDoAvatar {
  readonly agente: Agente
  readonly tamanho?: TamanhoDoAvatar
}

/**
 * O avatar do agente: **círculo com o ícone da função, nunca rosto** — nem foto, nem mascote, nem nada que pareça uma
 * pessoa (D17, D58; Decreto 12.880, art. 11). O agente tem identidade de função, e não se passa por gente.
 *
 * É enfeite para o leitor de tela (`aria-hidden`): o avatar nunca é a única identificação, e o nome da função vem sempre
 * ao lado (`AssinaturaIA`). Não tem ponto de "online": agente não fica online como gente (D59).
 */
export function AvatarAgente({ agente, tamanho = 24 }: PropsDoAvatar) {
  const { icone: Icone, cor } = APARENCIA_DO_AGENTE[agente]
  const medida = TAMANHO_DO_AVATAR[tamanho]
  return (
    <span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 items-center justify-center rounded-full ${medida.caixa} ${cor}`}>
      <Icone size={medida.icone} strokeWidth={1.75} />
    </span>
  )
}
