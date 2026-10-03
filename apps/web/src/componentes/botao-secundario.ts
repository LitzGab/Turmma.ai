/**
 * O botão secundário — "Cancelar", "Nova rede", "Voltar e corrigir", "Anterior", "Nova turma" —: contorno, do mesmo
 * tamanho da ação principal, porque sair ou recusar nunca é menor que seguir (D59). Alvo de toque de 44 px. Nasceu na
 * operação e veio para `componentes/` na A1 (13.0), com a Estrutura da coordenação usando o mesmo.
 */
export const CLASSES_DO_BOTAO_SECUNDARIO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-borda-campo bg-superficie px-4 py-2 text-base font-medium text-tinta enabled:hover:bg-realce-suave'

/** O mesmo contorno num link (`<a>`), que não tem `enabled`: o hover vale sempre. */
export const CLASSES_DO_LINK_SECUNDARIO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-borda-campo bg-superficie px-4 py-2 text-base font-medium text-tinta hover:bg-realce-suave'

/**
 * O botão `perigo` de linha e de cartão ("Excluir", "Retirar"; `docs/interface.md` 11.1): texto em `erro`, com o contorno
 * do secundário. O cheio em `erro` fica só dentro do diálogo de confirmação (`CLASSES_DO_BOTAO_PERIGO_CHEIO`).
 */
export const CLASSES_DO_BOTAO_PERIGO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-borda-campo bg-superficie px-4 py-2 text-base font-medium text-erro enabled:hover:bg-erro-cx'

/** O `perigo` cheio, com texto branco (6,6:1 sobre o `erro`): só o botão que confirma a exclusão, dentro do diálogo. */
export const CLASSES_DO_BOTAO_PERIGO_CHEIO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-erro px-4 py-2 text-base font-medium text-white disabled:bg-inativo disabled:text-tinta'

/**
 * O botão `oficial` (`docs/interface.md` 8.4, princípio 2, e 11.1): o preto, reservado à decisão oficial. Aprovar os
 * pedidos de nome cria a conta do aluno, e por isso não se parece com nenhum outro botão da tela (regra 50, item 8).
 */
export const CLASSES_DO_BOTAO_OFICIAL =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-noite px-4 py-2 text-base font-medium text-white enabled:hover:bg-noite-alto enabled:active:bg-noite-baixo disabled:bg-inativo disabled:text-tinta'
