import { Info, type LucideIcon } from 'lucide-react'

interface PropsDaFaixa {
  /** O aviso, numa frase: "Seu professor acompanha como você usa o Tutor." */
  readonly children: string
  readonly icone?: LucideIcon
}

/**
 * A faixa fixa de aviso, em família `info` (`docs/interface.md` 9.1 e 11.6): cinza, porque aviso não é alarme. **Não
 * fecha**, e por isso não tem botão nem aceita um: o aluno não dispensa o aviso de que o professor acompanha o Tutor
 * (D8; regra 70, item 4). É uma nota, não um alerta: não interrompe o leitor de tela a cada tela que abre.
 */
export function Faixa({ children, icone: Icone = Info }: PropsDaFaixa) {
  return (
    <p role="note" className="flex min-w-0 items-start gap-2 rounded-controle bg-info-cx px-3 py-2.5 text-base text-info">
      <Icone aria-hidden="true" size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  )
}
