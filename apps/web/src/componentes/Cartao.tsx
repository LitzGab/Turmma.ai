import { useId, type ReactNode } from 'react'

interface PropsDoCartao {
  /** Com título, o cartão é uma região com nome (`section` rotulada por ele); sem título, é só a caixa. */
  readonly titulo?: string
  /** Uma ação à direita do título. */
  readonly acao?: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

/**
 * O cartão do produto (`docs/interface.md` 9.3): **linha fina, sem sombra**, canto de 16 px, 16 px por dentro e 20 px a
 * partir de 1024 px. A hierarquia vem de tom e de linha, não de elevação: sombra em cada cartão custa pintura no
 * computador fraco da escola e não diz nada (regra 50, item 1).
 */
export function Cartao({ titulo, acao, children, className = '' }: PropsDoCartao) {
  const idDoTitulo = useId()
  const classes = `min-w-0 rounded-cartao border border-linha bg-superficie p-4 lg:p-5 ${className}`
  if (titulo === undefined) return <div className={classes}>{children}</div>
  return (
    <section aria-labelledby={idDoTitulo} className={classes}>
      <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id={idDoTitulo} className="min-w-0 text-base leading-snug font-semibold break-words text-tinta">
          {titulo}
        </h2>
        {acao}
      </div>
      {children}
    </section>
  )
}
