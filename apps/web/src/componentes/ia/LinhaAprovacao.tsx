import { Check, Clock, X } from 'lucide-react'
import { CORES_DO_ESTADO } from '../SeloDeEstado'
import { motivoDaRejeicao, textoDaAprovacao, type Aprovacao } from './aprovacao'

interface PropsDaLinha {
  readonly aprovacao: Aprovacao
  /** O verbo da aprovada, com o gênero do que foi aprovado: "Aprovada por", "Validação registrada por". */
  readonly verbo?: string
  /** O que a pendente diz a quem não é o professor: na Governança, "Esperando o professor". */
  readonly espera?: string
}

const DESENHO = {
  pendente: { familia: 'pendente', icone: Clock },
  aprovada: { familia: 'ok', icone: Check },
  rejeitada: { familia: 'erro', icone: X },
} as const

/**
 * A linha da aprovação humana, a terceira parte do selo de IA (`docs/interface.md` 11.3): **"Aprovado por Camila Souza ·
 * 19/09, 10h42"**, em família `ok`. É a resposta da tela a "o que a IA gerou, quem aprovou e quando" (regra 70, item 6),
 * e metade do argumento do produto é que um humano aprovou.
 *
 * As outras duas situações usam a mesma linha: pendente ("Esperando você", em `pendente`) e rejeitada, em `erro`, com o
 * **motivo** logo embaixo. O estado vem com ícone e texto, nunca só com a cor (regra 50, item 11).
 */
export function LinhaAprovacao({ aprovacao, verbo, espera }: PropsDaLinha) {
  const { familia, icone: Icone } = DESENHO[aprovacao.estado]
  const motivo = motivoDaRejeicao(aprovacao)
  return (
    <div data-aprovacao={aprovacao.estado} className={`inline-flex max-w-full min-w-0 flex-col gap-0.5 rounded-linha px-2.5 py-1.5 text-[13px] leading-snug ${CORES_DO_ESTADO[familia]}`}>
      <p className="flex min-w-0 items-start gap-1.5 font-medium">
        <Icone aria-hidden="true" size={14} strokeWidth={2.4} className="mt-0.5 shrink-0" />
        <span className="min-w-0 break-words">
          {textoDaAprovacao(aprovacao, { ...(verbo === undefined ? {} : { verbo }), ...(espera === undefined ? {} : { espera }) })}
        </span>
      </p>
      {motivo !== undefined && <p className="min-w-0 pl-5 break-words">{motivo}</p>}
    </div>
  )
}
