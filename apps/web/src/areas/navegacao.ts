import type { PapelDeUsuario } from '@educa/shared'
import { Blocks, School, UsersRound, type LucideIcon } from 'lucide-react'
import { ROTAS } from '../caminhos'

/** Um item da lateral: o rótulo, o endereço pela raiz e o ícone de 18 px (`docs/interface.md` 9.4). */
export interface ItemDaNavegacao {
  readonly rotulo: string
  readonly caminho: string
  readonly icone: LucideIcon
}

/**
 * A navegação de cada papel (D73; `docs/interface.md` 11.1), numa tabela só. **Cada item nasce com a tela dele**, e
 * nenhum antes: item que leva a tela inexistente é o que o W2 reprova. A tarefa que entrega a tela acrescenta a linha
 * aqui — "Minha turma" do aluno veio na 12.0, "Estrutura" da coordenação na 13.0; "Professores" vem na 14.0 — e na lista
 * do papel em `e2e/areas.spec.ts`, que o W2 percorre.
 *
 * É só o que a tela mostra. Quem decide o que cada papel alcança é a API, pela matriz de permissão: esconder um item não
 * protege nada (regra 00, item 1).
 */
export const NAVEGACAO: Readonly<Record<PapelDeUsuario, readonly ItemDaNavegacao[]>> = {
  coordenador: [{ rotulo: 'Estrutura', caminho: ROTAS.estrutura, icone: Blocks }],
  professor: [{ rotulo: 'Turmas', caminho: ROTAS.turmas, icone: UsersRound }],
  aluno: [{ rotulo: 'Minha turma', caminho: ROTAS.minhaTurma, icone: School }],
}

/** O item está selecionado no endereço dele e em qualquer um abaixo dele (a turma aberta dentro de Turmas, na 15.0). */
export function estaNoItem(caminho: string, item: Pick<ItemDaNavegacao, 'caminho'>): boolean {
  return caminho === item.caminho || caminho.startsWith(`${item.caminho}/`)
}
