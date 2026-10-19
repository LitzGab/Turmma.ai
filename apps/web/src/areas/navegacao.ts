import type { PapelDeUsuario } from '@educa/shared'
import { FolderLock, Lock, MessageCircleQuestion, School, type LucideIcon } from 'lucide-react'
import { ROTAS } from '../caminhos'
// Só tipos, que o compilador apaga: o `Contador` e os ícones ilustrados são peças da entrada ou fora dela, e este arquivo
// não importa nenhuma (o item 4 do guia acima). O que ele diz é qual ícone e qual família, e a casca é quem desenha.
import type { FamiliaDeCor } from '../componentes/Contador'
import type { NomeDoLugar } from '../componentes/icones/lugares'

/*
 * COMO ENTRA UMA TELA NOVA NUMA ÁREA (MVP de apresentação; `apps/web/nome-dos-chunks.ts` e o teste dele sobre o build):
 * 1. A tela é um arquivo em `areas/<area>/` com `export default`, declarada no `rotas.tsx` da área por `const Tela = lazy(() => import('./Tela'))`; o `Suspense` e a fronteira de erro da área já a cobrem. Sai em `tela-<area>-<Tela>-*.js`, com teto de 30 kB em brotli.
 * 2. Tela nova nunca entra por `import` direto no `rotas.tsx`: o teto da fachada (`<area>-*.js`) é o das telas da A1, que ficam como estão.
 * 3. Peça se importa pelo arquivo dela (`../../componentes/ia/CaixaPedido`, `../../componentes/Cartao`), sem arquivo-barril.
 * 4. Nada da entrada (`src/rotas.tsx`, `paginas/`, a casca, este arquivo) importa peça de `componentes/ia/` ou da lista `PECAS_FORA_DA_ENTRADA`, nem módulo de `areas/<area>/`.
 * 5. Tela de uma área não importa módulo de outra área: o que duas áreas dividem mora em `componentes/`. O build reprova a tela do professor que o aluno baixaria.
 * Como usar cada peça (aprovação, conversa, barra presa, o que a peça não dá): `src/componentes/ia/README.md`.
 */

/**
 * O ícone de um lugar (`docs/interface.md` 9.4): o ilustrado, onde a D80 desenhou um (Início, Turmas, Ferramentas e
 * Atividades, que usa o `tarefas`), ou o do `lucide` dentro de um `Ladrilho`, na família do lugar. A família é categoria,
 * e nunca julgamento: os três agentes têm a deles (Assistente azul, Tutor laranja, Analista anil), e a gestão, a escola e os
 * registros, a que a 9.4 dá aos lugares correspondentes.
 */
export type IconeDoItem = { readonly lugar: NomeDoLugar } | { readonly lucide: LucideIcon; readonly familia: FamiliaDeCor }

/** Um item da lateral: o rótulo, o endereço pela raiz e o ícone (`docs/interface.md` 9.4). */
export interface ItemDaNavegacao {
  readonly rotulo: string
  readonly caminho: string
  readonly icone: IconeDoItem
  /**
   * Outros endereços, pela raiz, em que o item também fica selecionado: a conversa aberta dentro de "Início", o
   * artefato aberto dentro de "Ferramentas". Sem isto a lateral não diria onde a pessoa está nessas telas.
   */
  readonly tambemEm?: readonly string[]
}

/**
 * A navegação de cada papel (D73; `docs/interface.md` 11.1), numa tabela só. **Cada item nasce com a tela dele**, e
 * nenhum antes: item que leva a tela inexistente é o que o W2 reprova. A tarefa que entrega a tela acrescenta a linha
 * aqui — "Minha turma" do aluno veio na 12.0 e os quatro lugares da coordenação, na X2 — e na lista do papel em
 * `e2e/areas.spec.ts`, que o W2 percorre.
 *
 * É só o que a tela mostra. Quem decide o que cada papel alcança é a API, pela matriz de permissão: esconder um item não
 * protege nada (regra 00, item 1).
 */
export const NAVEGACAO: Readonly<Record<PapelDeUsuario, readonly ItemDaNavegacao[]>> = {
  // X2 (D80; `docs/interface.md` 11.1): quatro lugares, Painel, Analista, Escola e Registros. O Painel é onde a coordenação abre.
  // Escola e Registros são molduras com abas (`areas/coordenacao/Escola.tsx` e `Registros.tsx`) que ficam nos endereços de
  // hoje: o lugar fica aceso por `caminho` e `tambemEm`, e nenhum endereço mudou. A Estrutura abre a lista da turma abaixo
  // dela, e a Governança é a aba IA de Registros; os Agentes ficam acesos em Registros.
  coordenador: [
    { rotulo: 'Painel', caminho: ROTAS.painel, icone: { lugar: 'painel' } },
    { rotulo: 'Analista', caminho: ROTAS.analista, icone: { lugar: 'ia' } },
    { rotulo: 'Escola', caminho: ROTAS.estrutura, icone: { lugar: 'escola' }, tambemEm: [ROTAS.professores, ROTAS.material] },
    { rotulo: 'Registros', caminho: ROTAS.governanca, icone: { lugar: 'registros' }, tambemEm: [ROTAS.agentes, ROTAS.privacidade] },
  ],
  // A2 (D73): Início, Turmas e Ferramentas. Calendário nasce com a grade (F8) e Histórico, com o F5: nenhum aparece antes da
  // tela dele. X1 (12.0): "Nova conversa" virou "Início", no mesmo endereço, com os ícones ilustrados da D80. X3 (2.0): a ordem
  // é a da D80, e "Seu time" saiu da lateral: o Assistente e o Tutor abrem pelo pé do sino (`areas/professor/SinoDoProfessor.tsx`). X3 (5.0): Criados é o quarto lugar,
  // o último dos quatro que cabem na barra de baixo. O artefato aberto ainda fica acendendo Ferramentas; o documento em folha (6.0) o passa a Criados.
  // As telas deles (`/professor/time/assistente` e `/professor/time/tutor`) não são lugar de nenhum item.
  professor: [
    { rotulo: 'Início', caminho: ROTAS.novaConversa, icone: { lugar: 'inicio' }, tambemEm: [ROTAS.conversa] },
    { rotulo: 'Turmas', caminho: ROTAS.turmas, icone: { lugar: 'turmas' } },
    { rotulo: 'Ferramentas', caminho: ROTAS.ferramentas, icone: { lugar: 'ferramentas' }, tambemEm: [ROTAS.artefatos] },
    { rotulo: 'Criados', caminho: ROTAS.criados, icone: { lugar: 'criados' } },
  ],
  // A3 e A4: Tutor, Atividades e Minha turma. "Meu desempenho" e "Avisar um adulto" nascem com a tela de cada um: nesta
  // fatia não existem, e por isso não aparecem. "Privacidade" é do rodapé fixo (`RODAPE_DA_LATERAL`), e não desta lista. A
  // conversa do Tutor e a atividade aberta ficam abaixo do endereço do item delas, que continua selecionado.
  aluno: [
    { rotulo: 'Tutor', caminho: ROTAS.tutor, icone: { lucide: MessageCircleQuestion, familia: 'laranja' } },
    { rotulo: 'Atividades', caminho: ROTAS.atividades, icone: { lugar: 'tarefas' } },
    { rotulo: 'Minha turma', caminho: ROTAS.minhaTurma, icone: { lucide: School, familia: 'turquesa' } },
  ],
}

/**
 * O rodapé fixo da lateral (`docs/interface.md` 11.1): os itens que ficam **embaixo**, acima da pessoa, e não entram na
 * lista de seções. Só o aluno tem rodapé, e por enquanto só com "Privacidade" (F3, 18.0), que abre "Meus dados"; "Avisar
 * um adulto" nasce com a tela dele. O item vale na lateral aberta, no trilho e na gaveta a 360 px.
 */
export const RODAPE_DA_LATERAL: Readonly<Record<PapelDeUsuario, readonly ItemDaNavegacao[]>> = {
  coordenador: [],
  professor: [],
  aluno: [{ rotulo: 'Privacidade', caminho: ROTAS.privacidadeDoAluno, icone: { lucide: Lock, familia: 'verde' } }],
}

/**
 * O que o menu da pessoa, no rodapé da lateral, leva além do "Sair" (P18; `docs/interface.md` 11.1): os links dela. O
 * "Sair" nunca entra aqui, porque é o último e está sempre à vista (D59). O professor tem "Meus dados" desde o F3 (18.0).
 * A coordenação não é titular de pedido (a API não lhe dá `meus_dados`), e o aluno acha os dados dele no rodapé fixo.
 */
export const MENU_DA_PESSOA: Readonly<Record<PapelDeUsuario, readonly ItemDaNavegacao[]>> = {
  coordenador: [],
  professor: [{ rotulo: 'Meus dados', caminho: ROTAS.meusDadosDoProfessor, icone: { lucide: FolderLock, familia: 'verde' } }],
  aluno: [],
}

/** O nome de cada um desses grupos para o leitor de tela: o que a navegação "Seções" já faz. */
export const NOME_DO_RODAPE = 'Rodapé'
export const NOME_DO_MENU_DA_PESSOA = 'Sua conta'

/**
 * O item está selecionado no endereço dele e em qualquer um abaixo dele (a turma aberta dentro de Turmas, na 15.0), e
 * nos endereços que ele declara em `tambemEm`, do mesmo jeito.
 */
export function estaNoItem(caminho: string, item: Pick<ItemDaNavegacao, 'caminho' | 'tambemEm'>): boolean {
  return [item.caminho, ...(item.tambemEm ?? [])].some((base) => caminho === base || caminho.startsWith(`${base}/`))
}
