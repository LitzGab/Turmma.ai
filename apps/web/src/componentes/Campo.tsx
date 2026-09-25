import { useId, type InputHTMLAttributes, type Ref } from 'react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  /** O rótulo visível, sempre: rótulo só no `placeholder` some quando a pessoa começa a digitar (regra 50, item 11). */
  rotulo: string
  /** O que ajuda a preencher, ligado ao campo por `aria-describedby`: "pelo menos 12 caracteres". */
  dica?: string
  /**
   * O que está errado neste campo e como corrigir, embaixo dele: o campo fica `aria-invalid` e o texto entra no
   * `aria-describedby`, depois da dica, para o leitor de tela ler os dois ao chegar no campo.
   */
  erro?: string | undefined
  /** O campo em si, para quem precisa pôr o foco nele (o erro que volta do servidor, por exemplo). */
  ref?: Ref<HTMLInputElement>
}

/**
 * Campo de formulário com rótulo visível, dica descrita para o leitor de tela e altura de 44 px, que é o alvo de toque
 * do celular (regra 50, itens 2a e 11). O `inputmode` e o `autocomplete` ficam a cargo de quem usa, porque mudam por
 * campo: matrícula é numérica, senha é `current-password`, código do aplicativo é `one-time-code`.
 */
export function Campo({ rotulo, dica, erro, ...props }: Props) {
  const campo = useId()
  const descricao = useId()
  const idDoErro = useId()
  const descritoPor = [dica === undefined ? undefined : descricao, erro === undefined ? undefined : idDoErro].filter((valor) => valor !== undefined).join(' ')
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
        {...(descritoPor === '' ? {} : { 'aria-describedby': descritoPor })}
        {...(erro === undefined ? {} : { 'aria-invalid': true })}
        {...props}
        className="min-h-11 rounded-controle border border-borda-campo bg-superficie px-3 py-2 text-base text-tinta"
      />
      {erro !== undefined && (
        <p id={idDoErro} className="text-sm text-erro">
          {erro}
        </p>
      )}
    </div>
  )
}
