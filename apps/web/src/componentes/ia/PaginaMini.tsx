import type { Citacao } from '@educa/shared'
import { tituloDoMaterial, type TitulosDosMateriais } from './textos-das-fontes'

interface PropsDaPaginaMini {
  readonly citacao: Citacao
  readonly materiais: TitulosDosMateriais
}

/**
 * A miniatura da página de origem, no artefato (`docs/mvp-rapido.md` 9.2): uma folha pequena com o material no
 * cabeçalho, o **trecho de verdade** no corpo e o número da página no pé. É texto, e não imagem da página: o MVP guarda
 * o texto extraído do PDF, não o arquivo (`docs/mvp-rapido.md` 4, item 3), e o que não tem licença para estar aqui não
 * aparece nem em miniatura (D5).
 *
 * Nada menor que 12 px (9.2): a folha corta o trecho que não couber, em vez de encolher a letra até não dar para ler.
 */
export function PaginaMini({ citacao, materiais }: PropsDaPaginaMini) {
  const material = tituloDoMaterial(citacao.materialId, materiais)
  return (
    <figure className="w-40 max-w-full shrink-0">
      <div className="flex aspect-[3/4] flex-col gap-2 overflow-hidden rounded-linha border border-borda-campo bg-superficie p-3">
        <p className="shrink-0 truncate border-b border-linha pb-1.5 text-xs font-medium text-sutil">{material}</p>
        <p className="min-h-0 flex-1 overflow-hidden text-xs leading-snug break-words text-apoio">{citacao.trecho}</p>
        <p aria-hidden="true" className="shrink-0 text-right text-xs text-sutil tabular-nums">
          {citacao.pagina}
        </p>
      </div>
      <figcaption className="mt-1.5 text-sm break-words text-sutil">
        Página {citacao.pagina} · {material}
      </figcaption>
    </figure>
  )
}
