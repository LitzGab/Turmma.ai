import { CATEGORIAS_DE_DADO_DO_INCIDENTE, type IncidenteDaEscola } from '@educa/shared'
import { textoDoAviso, textoDoConhecimento, textoDoRisco, textoDosTitulares } from './textos-dos-incidentes'

/**
 * Todos os campos do aviso de incidente, na ordem em que a coordenação os lê (F3, 10.0; Tech Spec do F3, seção 9): o que
 * aconteceu, o que foi alcançado, quantas pessoas, o risco, e o que a Turmma fez para conter e para corrigir. É a mesma lista
 * no diálogo da casca e na aba, para a coordenação ler a mesma coisa nos dois lugares.
 *
 * Os textos são da operação, escritos sem dado de titular, e podem ter quebra de linha: `whitespace-pre-line` as mostra, e
 * `break-words` impede que uma palavra comprida empurre a largura a 360 px (regra 50, item 2a). Texto é renderizado como texto:
 * nunca como HTML.
 */
export function DetalhesDoIncidente({ incidente }: { readonly incidente: IncidenteDaEscola }) {
  const linhas: ReadonlyArray<readonly [rotulo: string, valor: string]> = [
    ['O que aconteceu', incidente.circunstancias],
    ['Dados alcançados', incidente.categorias.map((categoria) => CATEGORIAS_DE_DADO_DO_INCIDENTE[categoria]).join('; ')],
    ['Pessoas alcançadas', textoDosTitulares(incidente.titularesEstimados)],
    ['Risco para as pessoas', textoDoRisco(incidente.risco)],
    ['O que a Turmma fez para conter', incidente.contencao],
    ['O que a Turmma faz para corrigir', incidente.correcao],
    ['Quando a Turmma soube', textoDoConhecimento(incidente)],
    ['Quando o aviso chegou à escola', textoDoAviso(incidente)],
  ]
  return (
    <dl className="flex min-w-0 flex-col gap-3">
      {linhas.map(([rotulo, valor]) => (
        <div key={rotulo} className="min-w-0">
          <dt className="text-sm text-sutil">{rotulo}</dt>
          <dd className="font-medium break-words whitespace-pre-line text-tinta">{valor}</dd>
        </div>
      ))}
    </dl>
  )
}
