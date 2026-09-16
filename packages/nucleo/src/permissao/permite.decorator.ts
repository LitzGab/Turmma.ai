import type { AcaoDe, Recurso } from '@educa/shared'
import { SetMetadata, type CustomDecorator } from '@nestjs/common'

export const METADADO_PERMITE = 'educa:permite'

export interface CelulaPermitida {
  readonly recurso: Recurso
  readonly acao: string
}

/**
 * Declara qual célula da `MATRIZ` (`packages/shared`) a rota atende. A `GuardaDePermissao` barra o papel cujo
 * alcance nessa célula é `nunca`, com a mesma resposta de rota inexistente (regra 10, item 6). O resto do alcance
 * (a turma dele, a própria pessoa) é conferido no repository, por objeto (regra 10, item 4).
 *
 * Toda rota autenticada precisa desta marcação, no método ou no controller: rota sem `@Permite` e sem
 * `@RotaAnonima` derruba o boot da API (`ConferenciaDasPermissoes`), e endpoint novo nasce fechado.
 */
export function Permite<R extends Recurso>(recurso: R, acao: AcaoDe<R>): CustomDecorator<string> {
  const celula: CelulaPermitida = { recurso, acao }
  return SetMetadata(METADADO_PERMITE, celula)
}
