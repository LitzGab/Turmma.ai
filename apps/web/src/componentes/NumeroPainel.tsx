import type { ReactNode } from 'react'
import { formatarNumero } from '../formatar'

interface PropsDoNumeroPainel {
  readonly rotulo: string
  /** Número vai no formato local (1.234); texto vai como veio ("61%", "—"). */
  readonly valor: number | string
  /** Uma linha embaixo do número: o que ele quer dizer, ou uma `BarraRotulada`. */
  readonly apoio?: ReactNode
}

/**
 * O número de painel (`docs/interface.md` 9.2 e 11.7): o rótulo em cima, e embaixo o número em 28 px, peso 600 e
 * `tabular-nums`, para os quatro da Governança não dançarem quando mudam. **Sem gráfico onde um número basta.**
 *
 * O rótulo vem antes do número também na leitura: quem ouve "412" precisa ter ouvido de quê.
 */
export function NumeroPainel({ rotulo, valor, apoio }: PropsDoNumeroPainel) {
  return (
    <div className="min-w-0 rounded-cartao border border-linha bg-superficie p-4 lg:p-5">
      <p className="text-[13px] leading-tight font-medium break-words text-sutil">{rotulo}</p>
      <p className="mt-3 text-[28px] leading-none font-semibold break-words text-tinta tabular-nums">{typeof valor === 'number' ? formatarNumero(valor) : valor}</p>
      {apoio !== undefined && <div className="mt-2 text-sm text-sutil">{apoio}</div>}
    </div>
  )
}
