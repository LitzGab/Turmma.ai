import type { ButtonHTMLAttributes } from 'react'

/**
 * Botão de ação primária, na pele da D72 (`docs/interface.md` 9.1): pílula em `caramelo` com texto `tinta` (6,4:1),
 * porque branco em cima do laranja dá 3,0:1 e reprova. Hover em `caramelo-claro`, pressionado em `caramelo-fundo` e
 * desligado em `inativo`, com o texto ainda em `tinta`. O preto (`noite`) é da ação oficial e não é daqui.
 *
 * Alvo de toque de 44 × 44 px no mínimo (regra 50, item 2a), foco visível pelo estilo global, e nenhum efeito que só
 * exista no hover: o pressionado muda a cor também no toque.
 */
export function Botao({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-caramelo px-4 py-2 text-base font-medium text-tinta enabled:hover:bg-caramelo-claro enabled:active:bg-caramelo-fundo disabled:bg-inativo ${className}`}
      {...props}
    />
  )
}
