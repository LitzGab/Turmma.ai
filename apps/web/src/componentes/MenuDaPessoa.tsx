import { LogOut } from 'lucide-react'
import { ALTURA_DO_ITEM_ABERTO, CLASSE_DO_ITEM, Dica } from './itens-da-lateral'

interface Props {
  /** O nome e o papel de quem está na sessão; sem eles ainda (o `/v1/eu` não chegou), fica só o "Sair". */
  readonly nome?: string | undefined
  readonly papel?: string | undefined
  readonly aoSair: () => void
  readonly saindo: boolean
  /** No trilho de 56 px sobra só o ícone do "Sair", com o nome dele para o leitor de tela e a dica. */
  readonly trilho?: boolean
}

/**
 * O menu da pessoa, no rodapé da lateral (P18; `docs/interface.md` 11.1): o nome, o papel e **Sair**. Nada fica atrás
 * de um clique a mais: "Sair" está à vista, a um clique, com o mesmo tamanho e o mesmo desenho dos itens da navegação
 * (D59, "sair nunca é mais difícil que entrar"). As outras entradas do menu do ChatGPT nascem cada uma com a fase dela
 * (P09).
 */
export function MenuDaPessoa({ nome, papel, aoSair, saindo, trilho = false }: Props) {
  const rotulo = saindo ? 'Saindo…' : 'Sair'
  if (trilho)
    return (
      <button type="button" onClick={aoSair} disabled={saindo} className={`${CLASSE_DO_ITEM} group relative size-11 justify-center px-0`}>
        <LogOut aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0" />
        <span className="sr-only">{rotulo}</span>
        <Dica>{rotulo}</Dica>
      </button>
    )
  return (
    <div className="flex flex-col gap-1 border-t border-linha pt-2">
      {nome !== undefined && (
        <p className="flex min-w-0 flex-col px-3 py-1">
          <span className="font-medium break-words text-tinta">{nome}</span>
          {papel !== undefined && <span className="text-sm text-sutil">{papel}</span>}
        </p>
      )}
      <button type="button" onClick={aoSair} disabled={saindo} className={`${CLASSE_DO_ITEM} ${ALTURA_DO_ITEM_ABERTO} w-full`}>
        <LogOut aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0" />
        {rotulo}
      </button>
    </div>
  )
}
