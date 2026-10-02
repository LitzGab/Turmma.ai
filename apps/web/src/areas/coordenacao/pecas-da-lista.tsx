import type { ReactNode } from 'react'

/**
 * As peças das listas da coordenação, que a Estrutura (13.0) e os Professores (14.0) desenham do mesmo jeito: o item em
 * cartão e o aviso da lista que passou do teto de páginas.
 */

/** Um item da lista: o cartão, em uma coluna no celular e em linha a partir de 768 px (W12). */
export function Linha({ titulo, detalhe, children }: { titulo: string; detalhe?: string; children: ReactNode }) {
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-cartao border border-linha bg-superficie p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="font-medium break-words text-tinta">{titulo}</p>
        {detalhe !== undefined && <p className="text-sm break-words text-apoio">{detalhe}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </li>
  )
}

/** "Mostrando os primeiros 1.000": a lista passou do teto de páginas que a tela lê (`lerPaginas`). */
export function AvisoDeListaIncompleta({ completa }: { completa: boolean }) {
  if (completa) return null
  return <p className="text-sm text-apoio">A lista é maior do que esta tela mostra: aparecem só os primeiros.</p>
}
