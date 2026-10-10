import { LogOut } from 'lucide-react'
import { NOME_DO_MENU_DA_PESSOA, type ItemDaNavegacao } from '../areas/navegacao'
import { ALTURA_DO_ITEM_ABERTO, CLASSE_DO_ITEM, Dica, ListaDeItens } from './itens-da-lateral'

interface Props {
  /** O nome e o papel de quem está na sessão; sem eles ainda (o `/v1/eu` não chegou), fica só o "Sair". */
  readonly nome?: string | undefined
  readonly papel?: string | undefined
  readonly aoSair: () => void
  readonly saindo: boolean
  /** Os links da pessoa, antes do "Sair" (`MENU_DA_PESSOA`): o professor tem "Meus dados". Sem eles, só o "Sair". */
  readonly itens?: readonly ItemDaNavegacao[]
  /** No trilho de 56 px sobra só o ícone de cada um, com o nome dele para o leitor de tela e a dica. */
  readonly trilho?: boolean
}

/**
 * O menu da pessoa, no rodapé da lateral (P18; `docs/interface.md` 11.1): o nome, o papel, os links dela (o professor tem
 * "Meus dados") e **Sair**. Nada fica atrás de um clique a mais: os links e o "Sair" estão à vista, com o mesmo tamanho e o
 * mesmo desenho dos itens da navegação, e o "Sair" é sempre o último (D59, "sair nunca é mais difícil que entrar"). As
 * outras entradas do menu do ChatGPT nascem cada uma com a fase dela (P09).
 */
export function MenuDaPessoa({ nome, papel, aoSair, saindo, itens = [], trilho = false }: Props) {
  const rotulo = saindo ? 'Saindo…' : 'Sair'
  if (trilho)
    return (
      <div className="flex flex-col items-center gap-0.5">
        <ListaDeItens itens={itens} rotulo={NOME_DO_MENU_DA_PESSOA} trilho />
        <button type="button" onClick={aoSair} disabled={saindo} className={`${CLASSE_DO_ITEM} group relative size-11 justify-center px-0`}>
          <LogOut aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0" />
          <span className="sr-only">{rotulo}</span>
          <Dica>{rotulo}</Dica>
        </button>
      </div>
    )
  return (
    <div className="flex flex-col gap-1 border-t border-linha pt-2">
      {nome !== undefined && (
        <p className="flex min-w-0 flex-col px-3 py-1">
          <span className="font-medium break-words text-tinta">{nome}</span>
          {papel !== undefined && <span className="text-sm text-sutil">{papel}</span>}
        </p>
      )}
      <ListaDeItens itens={itens} rotulo={NOME_DO_MENU_DA_PESSOA} trilho={false} />
      <button type="button" onClick={aoSair} disabled={saindo} className={`${CLASSE_DO_ITEM} ${ALTURA_DO_ITEM_ABERTO} w-full`}>
        <LogOut aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0" />
        {rotulo}
      </button>
    </div>
  )
}
