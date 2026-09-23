import { useId, type InputHTMLAttributes } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  /** O rótulo visível, sempre: rótulo só no `placeholder` some quando a pessoa começa a digitar (regra 50, item 11). */
  rotulo: string
  /** O que ajuda a preencher, ligado ao campo por `aria-describedby`: "pelo menos 12 caracteres". */
  dica?: string
}

/**
 * Campo de formulário com rótulo visível, dica descrita para o leitor de tela e altura de 44 px, que é o alvo de toque
 * do celular (regra 50, itens 2a e 11). O `inputmode` e o `autocomplete` ficam a cargo de quem usa, porque mudam por
 * campo: matrícula é numérica, senha é `current-password`, código do aplicativo é `one-time-code`.
 */
export function Campo({ rotulo, dica, ...props }: Props) {
  const campo = useId()
  const descricao = useId()
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={campo} className="font-medium">
        {rotulo}
      </label>
      {dica !== undefined && (
        <p id={descricao} className="text-sm text-apoio">
          {dica}
        </p>
      )}
      <input
        id={campo}
        {...(dica === undefined ? {} : { 'aria-describedby': descricao })}
        {...props}
        className="min-h-11 rounded-controle border border-borda-campo bg-superficie px-3 py-2 text-base text-tinta"
      />
    </div>
  )
}
