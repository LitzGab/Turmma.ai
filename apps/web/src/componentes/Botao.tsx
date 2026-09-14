import type { ButtonHTMLAttributes } from 'react'

/**
 * Botão de ação. Alvo de toque de 44 × 44 px no mínimo (regra 50, item 2a), foco visível pelo estilo
 * global, e nenhum efeito que só exista no hover.
 */
export function Botao({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-base font-medium text-white active:bg-blue-900 ${className}`}
      {...props}
    />
  )
}
