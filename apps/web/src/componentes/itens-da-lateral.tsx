import { useContext, type ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { estaNoItem, type ItemDaNavegacao } from '../areas/navegacao'
import { ContextoDaGaveta } from './gaveta'

/**
 * A linha da lateral como botão, a do "Sair" (`docs/interface.md` 11.1 e 9.3): canto de 10 px, ícone de 18 px com o
 * rótulo, e texto `apoio` que vira `tinta` no hover. A altura vem de quem usa: a linha inteira na lateral aberta, o
 * quadrado de 44 px no trilho. O item de navegação (`ItemDaLateral`) tem o mesmo desenho escrito para link: sem o
 * `enabled:` e o `disabled:`, que link não tem, e com o estado de selecionado, que botão não tem.
 */
export const CLASSE_DO_ITEM =
  'flex items-center gap-3 rounded-linha px-3 text-left text-base text-apoio enabled:hover:bg-realce-suave enabled:hover:text-tinta disabled:text-inativo'

/**
 * A altura da linha na lateral aberta: 44 px, também no computador, e não os 36 px da 11.1. O "Sair" é ação principal
 * (D59, alvo de 44 px da regra 50, item 2a) e tem de ter o mesmo tamanho dos outros itens (P18): as linhas acompanham
 * ele, e não o contrário.
 */
export const ALTURA_DO_ITEM_ABERTO = 'min-h-11'

/**
 * A dica do trilho: o rótulo que o ícone sozinho não diz, ao passar o mouse **e** ao chegar pelo teclado. Para o leitor
 * de tela o nome já está no próprio controle, e a dica é só visual.
 */
export function Dica({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-full z-20 ml-2 hidden -translate-y-1/2 rounded-linha bg-noite px-2 py-1 text-sm font-normal whitespace-nowrap text-white shadow-flutua group-hover:block group-focus-visible:block"
    >
      {children}
    </span>
  )
}

/**
 * Um item da navegação. O selecionado tem **três pistas, não uma** (`docs/interface.md` 11.1): o fundo `realce`, o texto
 * `tinta` em peso 600 e o filete de 3 px em `caramelo` na borda esquerda — o fundo sozinho dá 1,1:1 e some na tela de um
 * Chromebook de entrada. E o `aria-current`, que o leitor de tela anuncia.
 *
 * Tocar num item fecha a gaveta, também quando o item é o da tela aberta e o endereço não muda.
 */
export function ItemDaLateral({ item, trilho }: { item: ItemDaNavegacao; trilho: boolean }) {
  const [caminho] = useLocation()
  const { fechar } = useContext(ContextoDaGaveta)
  const aqui = estaNoItem(caminho, item)
  const Icone = item.icone
  return (
    <li>
      <Link
        to={item.caminho}
        onClick={fechar}
        aria-current={aqui ? 'page' : undefined}
        className={`group relative flex items-center gap-3 rounded-linha text-base ${trilho ? 'size-11 justify-center' : `${ALTURA_DO_ITEM_ABERTO} px-3`} ${aqui ? 'bg-realce font-semibold text-tinta' : 'text-apoio hover:bg-realce-suave hover:text-tinta'}`}
      >
        {aqui && <span aria-hidden="true" data-filete="" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-caramelo" />}
        <Icone aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0" />
        {trilho ? (
          <>
            <span className="sr-only">{item.rotulo}</span>
            <Dica>{item.rotulo}</Dica>
          </>
        ) : (
          <span className="min-w-0 break-words">{item.rotulo}</span>
        )}
      </Link>
    </li>
  )
}
