import type { ReactNode } from 'react'
import { agenteDe, nomeDaAssinatura, type QuemAssina } from './assinatura'
import { AssinaturaIA, SeloIA } from './AssinaturaIA'
import { AvatarAgente } from './AvatarAgente'

type PropsDaMensagemIA = QuemAssina & {
  /** O conteúdo: texto, a pergunta da D18, o cartão de ferramenta, o aviso de fila. */
  readonly children: ReactNode
  /**
   * As ações da resposta ("Copiar", "Abrir na biblioteca", "Exportar em PDF"), em botões `discreto`. **Sempre
   * visíveis**: nada aparece só no hover (regra 50, item 2a).
   */
  readonly acoes?: ReactNode
  /**
   * `coluna` é a mensagem da conversa: **sem bolha**, na largura da coluna, com a assinatura em cima. `balao` é a do
   * Seu time, e só de lá (11.4): o agente fala em balão à esquerda, com o avatar ao lado.
   */
  readonly variante?: 'coluna' | 'balao'
}

/**
 * A mensagem da IA (`docs/interface.md` 11.3 e 11.4). Nas duas variantes ela **sempre assina**: o avatar do agente, o
 * nome da função e o selo "IA". Não existe jeito de desenhar uma mensagem de IA sem assinatura com esta peça, e é de
 * propósito (regra 70, item 4a; seção 6).
 *
 * Sem coreografia de entrada: a mensagem aparece, e pronto. Na área do aluno movimento é só resposta ao que ele fez
 * (9.5, regra 7), e a peça é a mesma nas três áreas.
 */
export function MensagemIA({ children, acoes, variante = 'coluna', ...quem }: PropsDaMensagemIA) {
  if (variante === 'balao')
    return (
      <article className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5">
          <AvatarAgente agente={agenteDe(quem)} />
        </span>
        <div className="flex max-w-[calc(100%-2.125rem)] min-w-0 flex-col items-start gap-1.5 sm:max-w-[85%]">
          <p className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 text-sm font-medium break-words text-tinta">{nomeDaAssinatura(quem)}</span>
            <SeloIA />
          </p>
          <div className="max-w-full min-w-0 rounded-cartao border border-linha bg-superficie px-4 py-3 text-base leading-normal break-words text-tinta">{children}</div>
          {acoes !== undefined && <div className="flex min-w-0 flex-wrap items-center gap-1">{acoes}</div>}
        </div>
      </article>
    )
  return (
    <article className="flex min-w-0 flex-col gap-2">
      <AssinaturaIA {...quem} />
      <div className="min-w-0 text-base leading-relaxed break-words text-tinta">{children}</div>
      {acoes !== undefined && <div className="flex min-w-0 flex-wrap items-center gap-1">{acoes}</div>}
    </article>
  )
}

interface PropsDaMensagemPessoa {
  /** O texto que a pessoa escreveu, como escreveu: as quebras de linha ficam. */
  readonly children: string
}

/**
 * A mensagem de quem escreve: à direita, em bolha `creme`, como no ChatGPT (11.3). O "Você:" é só para o leitor de
 * tela, que não vê de que lado a bolha está.
 */
export function MensagemPessoa({ children }: PropsDaMensagemPessoa) {
  return (
    <article className="flex min-w-0 justify-end">
      <p className="max-w-[85%] min-w-0 rounded-cartao bg-creme px-4 py-2.5 text-base leading-normal break-words whitespace-pre-wrap text-tinta">
        <span className="sr-only">Você: </span>
        {children}
      </p>
    </article>
  )
}
