import { agenteDe, nomeDaAssinatura, type QuemAssina } from './assinatura'
import { AvatarAgente, type TamanhoDoAvatar } from './AvatarAgente'

/**
 * O selo "IA", em família `ia` (`docs/interface.md` 9.1 e 11.3): cinza, neutro de propósito. O selo informa, não chama.
 * **É um só, igual em todo o produto**: toda saída de IA é rotulada como tal (seção 6; Decreto 12.880, art. 11), e quem
 * aprendeu a reconhecê-lo numa tela o reconhece em todas. Não aceita cor, tamanho nem texto de quem usa.
 */
export function SeloIA() {
  return (
    <span title="Gerado por inteligência artificial" className="inline-flex shrink-0 items-center rounded-lg bg-ia-cx px-1.5 py-0.5 text-xs leading-tight font-medium text-ia">
      IA
    </span>
  )
}

type PropsDaAssinatura = QuemAssina & {
  /** 24 px na linha da mensagem (o padrão), 32 ou 48 px no cabeçalho de uma conversa ou de um cartão de agente. */
  readonly tamanho?: TamanhoDoAvatar
}

/**
 * A assinatura que abre toda saída de IA: o avatar do agente, o **nome da função** e o selo "IA" — "a IA sempre assina"
 * (8.4, princípio 3). Nunca um texto de IA solto na tela.
 *
 * Quem assina é um agente (`agente`) ou uma função dele (`funcao`): com a função, o nome sai "Assistente · correção de
 * objetiva" e o avatar é o do agente que a declara (`@educa/shared`).
 */
export function AssinaturaIA({ tamanho = 24, ...quem }: PropsDaAssinatura) {
  return (
    <p className="flex min-w-0 items-center gap-2">
      <AvatarAgente agente={agenteDe(quem)} tamanho={tamanho} />
      <span className="min-w-0 text-sm font-medium break-words text-tinta">{nomeDaAssinatura(quem)}</span>
      <SeloIA />
    </p>
  )
}
