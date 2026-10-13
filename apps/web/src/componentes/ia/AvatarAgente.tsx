import type { Agente } from '@educa/shared'
import { CabecaOnca } from '../onca/CabecaOnca'

/**
 * O anel de cada agente (`docs/interface.md` 9.7): a cor dele no produto inteiro. Quem conversa com o professor é azul, o
 * Tutor é laranja, e o Analista, que só avisa a coordenação, é anil. O mapa é literal, nome por nome: o Tailwind só gera a
 * classe que acha escrita por inteiro.
 */
const ANEL_DO_AGENTE: Readonly<Record<Agente, string>> = {
  assistente_de_ensino: 'border-azul',
  tutor: 'border-laranja',
  analista_de_desempenho_escolar: 'border-anil',
}

/** 24 px na linha da mensagem, 32 px na assinatura, 40 e 48 px no cabeçalho de uma conversa e no cartão de agente. */
const CAIXA_DO_AVATAR = {
  24: 'size-6',
  32: 'size-8',
  40: 'size-10',
  48: 'size-12',
} as const
export type TamanhoDoAvatar = keyof typeof CAIXA_DO_AVATAR

interface PropsDoAvatar {
  readonly agente: Agente
  readonly tamanho?: TamanhoDoAvatar
}

/**
 * O avatar do agente: **a cabeça da onça num círculo `fundo`, com o anel de 2 px na cor do agente** (D80, item 3). A onça
 * é animal, nunca pessoa — sem rosto de gente, sem foto, sem nome próprio (D17, D58; Decreto 12.880, art. 11) — e o agente
 * tem identidade de função: quem assina é o nome dela, ao lado.
 *
 * **As props são só `agente` e `tamanho`**, e o desenho não muda com quem usa: nenhuma pose, nenhum "pensando", nenhum
 * ponto de "online" (D59). É enfeite para o leitor de tela (`aria-hidden`): o avatar nunca é a única identificação.
 *
 * **Quem o desenha é só a `AssinaturaIA`** (e o balão da `MensagemIA`, que a usa), e é por isso que ele nunca aparece sem
 * o nome da função e o selo "IA" no mesmo bloco: `ia/avatar-so-nas-duas-pecas.test.ts` reprova outro arquivo que o importe.
 */
export function AvatarAgente({ agente, tamanho = 24 }: PropsDoAvatar) {
  return (
    <span aria-hidden="true" data-agente={agente} className={`inline-flex shrink-0 rounded-full border-2 bg-fundo ${ANEL_DO_AGENTE[agente]} ${CAIXA_DO_AVATAR[tamanho]}`}>
      <CabecaOnca tamanho={tamanho} />
    </span>
  )
}
