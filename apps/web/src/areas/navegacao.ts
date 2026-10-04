import { NOMES_DOS_AGENTES, type Agente, type PapelDeUsuario } from '@educa/shared'
import { Blocks, GraduationCap, LayoutGrid, MessagesSquare, School, SquarePen, UsersRound, type LucideIcon } from 'lucide-react'
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
  /**
   * Outros endereços, pela raiz, em que o item também fica selecionado: a conversa aberta dentro de "Nova conversa", o
   * artefato aberto dentro de "Ferramentas". Sem isto a lateral não diria onde a pessoa está nessas telas.
   */
  readonly tambemEm?: readonly string[]
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
  // A2 (D73): Nova conversa, Ferramentas e Turmas. Calendário nasce com a grade (F8) e Histórico, com o F5: nenhum
  // aparece antes da tela dele.
  professor: [
    { rotulo: 'Nova conversa', caminho: ROTAS.novaConversa, icone: SquarePen, tambemEm: [ROTAS.conversa] },
    { rotulo: 'Ferramentas', caminho: ROTAS.ferramentas, icone: LayoutGrid, tambemEm: [ROTAS.artefatos] },
    { rotulo: 'Turmas', caminho: ROTAS.turmas, icone: UsersRound },
  ],
  aluno: [{ rotulo: 'Minha turma', caminho: ROTAS.minhaTurma, icone: School }],
}

/** Uma linha de "Seu time": o agente, o endereço da conversa dele e o ícone do avatar (círculo com ícone, nunca rosto: D58). */
export interface AgenteDaLateral {
  readonly agente: Agente
  readonly rotulo: string
  readonly caminho: string
  readonly icone: LucideIcon
}

/**
 * "Seu time", o grupo da lateral com os agentes que a pessoa acompanha (D73; `docs/interface.md` 11.1 e 11.4). Como os
 * itens, **cada linha nasce com a tela dela**: na A2 o professor tem a do Assistente de ensino; a do Tutor chega com os
 * sinais (A4). Coordenação e aluno não têm o grupo.
 */
export const SEU_TIME: Readonly<Record<PapelDeUsuario, readonly AgenteDaLateral[]>> = {
  coordenador: [],
  professor: [{ agente: 'assistente_de_ensino', rotulo: NOMES_DOS_AGENTES.assistente_de_ensino, caminho: ROTAS.timeDoAssistente, icone: MessagesSquare }],
  aluno: [],
}

/**
 * O item está selecionado no endereço dele e em qualquer um abaixo dele (a turma aberta dentro de Turmas, na 15.0), e
 * nos endereços que ele declara em `tambemEm`, do mesmo jeito.
 */
export function estaNoItem(caminho: string, item: Pick<ItemDaNavegacao, 'caminho' | 'tambemEm'>): boolean {
  return [item.caminho, ...(item.tambemEm ?? [])].some((base) => caminho === base || caminho.startsWith(`${base}/`))
}
