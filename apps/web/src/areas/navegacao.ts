import type { PapelDeUsuario } from '@educa/shared'
import { Blocks, GraduationCap, School, UsersRound, type LucideIcon } from 'lucide-react'
import { ROTAS } from '../caminhos'

/*
 * COMO ENTRA UMA TELA NOVA NUMA ÁREA (MVP de apresentação; `apps/web/nome-dos-chunks.ts` e o teste dele sobre o build):
 * 1. A tela é um arquivo em `areas/<area>/` com `export default`, declarada no `rotas.tsx` da área por `const Tela = lazy(() => import('./Tela'))`; o `Suspense` e a fronteira de erro da área já a cobrem. Sai em `tela-<area>-<Tela>-*.js`, com teto de 30 kB em brotli.
 * 2. Tela nova nunca entra por `import` direto no `rotas.tsx`: o teto da fachada (`<area>-*.js`) é o das telas da A1, que ficam como estão.
 * 3. Peça se importa pelo arquivo dela (`../../componentes/ia/CaixaPedido`, `../../componentes/Cartao`), sem arquivo-barril.
 * 4. Nada da entrada (`src/rotas.tsx`, `paginas/`, a casca, este arquivo) importa peça de `componentes/ia/` ou da lista `PECAS_FORA_DA_ENTRADA`, nem módulo de `areas/<area>/`.
 * 5. Tela de uma área não importa módulo de outra área: o que duas áreas dividem mora em `componentes/`. O build reprova a tela do professor que o aluno baixaria.
 */

/** Um item da lateral: o rótulo, o endereço pela raiz e o ícone de 18 px (`docs/interface.md` 9.4). */
export interface ItemDaNavegacao {
  readonly rotulo: string
  readonly caminho: string
  readonly icone: LucideIcon
}

/**
 * A navegação de cada papel (D73; `docs/interface.md` 11.1), numa tabela só. **Cada item nasce com a tela dele**, e
 * nenhum antes: item que leva a tela inexistente é o que o W2 reprova. A tarefa que entrega a tela acrescenta a linha
 * aqui — "Minha turma" do aluno veio na 12.0, "Estrutura" da coordenação na 13.0 e "Professores" na 14.0 — e na lista
 * do papel em `e2e/areas.spec.ts`, que o W2 percorre.
 *
 * É só o que a tela mostra. Quem decide o que cada papel alcança é a API, pela matriz de permissão: esconder um item não
 * protege nada (regra 00, item 1).
 */
export const NAVEGACAO: Readonly<Record<PapelDeUsuario, readonly ItemDaNavegacao[]>> = {
  coordenador: [
    { rotulo: 'Estrutura', caminho: ROTAS.estrutura, icone: Blocks },
    { rotulo: 'Professores', caminho: ROTAS.professores, icone: GraduationCap },
  ],
  professor: [{ rotulo: 'Turmas', caminho: ROTAS.turmas, icone: UsersRound }],
  aluno: [{ rotulo: 'Minha turma', caminho: ROTAS.minhaTurma, icone: School }],
}

/** O item está selecionado no endereço dele e em qualquer um abaixo dele (a turma aberta dentro de Turmas, na 15.0). */
export function estaNoItem(caminho: string, item: Pick<ItemDaNavegacao, 'caminho'>): boolean {
  return caminho === item.caminho || caminho.startsWith(`${item.caminho}/`)
}
