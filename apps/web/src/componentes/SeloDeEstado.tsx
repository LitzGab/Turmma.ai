import { Check, Clock, Info, X, type LucideIcon } from 'lucide-react'

/**
 * As quatro famílias de estado da 9.1 do `docs/interface.md`, cada uma com um fundo e um texto. A quinta, `ia`, é do
 * selo "IA" e do chip de fonte (`componentes/ia/`), e não é estado de nada.
 */
export const FAMILIAS_DE_ESTADO = ['pendente', 'ok', 'erro', 'info'] as const
export type FamiliaDeEstado = (typeof FAMILIAS_DE_ESTADO)[number]

/** O fundo e o texto de cada família: `pendente` é laranja (nesta marca pendência não é âmbar), `info` é cinza. */
export const CORES_DO_ESTADO: Readonly<Record<FamiliaDeEstado, string>> = {
  pendente: 'bg-pendente-cx text-pendente',
  ok: 'bg-ok-cx text-ok',
  erro: 'bg-erro-cx text-erro',
  info: 'bg-info-cx text-info',
}

const ICONE_DO_ESTADO: Readonly<Record<FamiliaDeEstado, LucideIcon>> = { pendente: Clock, ok: Check, erro: X, info: Info }

/** O que o selo `pendente` diz quando ninguém diz outra coisa: o que espera a pessoa (11.4). */
export const TEXTO_DO_PENDENTE = 'Esperando você'

type PropsDoEstado =
  /** `pendente` sem texto diz "Esperando você". */
  | { readonly familia: 'pendente'; readonly children?: string }
  | { readonly familia: Exclude<FamiliaDeEstado, 'pendente'>; readonly children: string }

/**
 * O selo de estado. A `LinhaAprovacao` de `componentes/ia/` é este mesmo selo, com o texto de quem aprovou e quando:
 * para a aprovação de saída de IA, use a linha, e não o selo solto. **Estado nunca é só cor** (regra 50, item 11; 9.1): o texto é obrigatório pelo tipo, e o ícone
 * repete a família para quem não distingue o verde do vermelho. O arquivo não se chama `Estado.tsx` porque a pasta
 * `estado/` (vazio, carregando, erro) mora ao lado, e num sistema de arquivos que não distingue maiúscula os dois
 * `import` cairiam no mesmo lugar.
 */
export function Estado(props: PropsDoEstado) {
  const Icone = ICONE_DO_ESTADO[props.familia]
  return (
    <span data-estado={props.familia} className={`inline-flex max-w-full items-start gap-1.5 rounded-lg px-2 py-1 text-[13px] leading-snug font-medium ${CORES_DO_ESTADO[props.familia]}`}>
      <Icone aria-hidden="true" size={14} strokeWidth={2.4} className="mt-0.5 shrink-0" />
      <span className="min-w-0 break-words">{props.children ?? TEXTO_DO_PENDENTE}</span>
    </span>
  )
}
