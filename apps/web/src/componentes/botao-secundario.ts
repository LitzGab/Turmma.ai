/**
 * O botão secundário — "Cancelar", "Nova rede", "Voltar e corrigir", "Anterior", "Nova turma" —: contorno, do mesmo
 * tamanho da ação principal, porque sair ou recusar nunca é menor que seguir (D59). Alvo de toque de 44 px. Nasceu na
 * operação e veio para `componentes/` na A1 (13.0), com a Estrutura da coordenação usando o mesmo.
 *
 * Desligado, ele muda de desenho, como todo botão: a borda apaga, o fundo vira `realce-suave` e o texto, `inativo`. Sem
 * isso o "Parar" e o "Tentar de novo" desligados seriam idênticos aos ligados, e o clique que não faz nada pareceria
 * tela quebrada.
 */
export const CLASSES_DO_BOTAO_SECUNDARIO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-borda-campo bg-superficie px-4 py-2 text-base font-medium text-tinta enabled:hover:bg-realce-suave disabled:border-linha disabled:bg-realce-suave disabled:text-inativo'

/** O mesmo contorno num link (`<a>`), que não tem `enabled`: o hover vale sempre. */
export const CLASSES_DO_LINK_SECUNDARIO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-borda-campo bg-superficie px-4 py-2 text-base font-medium text-tinta hover:bg-realce-suave'

/**
 * O botão `perigo` de linha e de cartão ("Excluir", "Retirar"; `docs/interface.md` 11.1): texto em `erro`, com o contorno
 * do secundário. O cheio em `erro` fica só dentro do diálogo de confirmação (`CLASSES_DO_BOTAO_PERIGO_CHEIO`).
 */
export const CLASSES_DO_BOTAO_PERIGO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-borda-campo bg-superficie px-4 py-2 text-base font-medium text-erro enabled:hover:bg-erro-cx disabled:border-linha disabled:bg-realce-suave disabled:text-inativo'

/** O `perigo` cheio, com texto branco (6,6:1 sobre o `erro`): só o botão que confirma a exclusão, dentro do diálogo. */
export const CLASSES_DO_BOTAO_PERIGO_CHEIO =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-erro px-4 py-2 text-base font-medium text-white disabled:bg-inativo disabled:text-tinta'

/**
 * O botão `oficial` (`docs/interface.md` 8.4, princípio 2, e 11.1): o preto, reservado à decisão oficial. Aprovar os
 * pedidos de nome cria a conta do aluno, e por isso não se parece com nenhum outro botão da tela (regra 50, item 8).
 */
export const CLASSES_DO_BOTAO_OFICIAL =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-noite px-4 py-2 text-base font-medium text-white enabled:hover:bg-noite-alto enabled:active:bg-noite-baixo disabled:bg-inativo disabled:text-tinta'

/**
 * As cinco variantes de botão da 11.1 do `docs/interface.md`, **e nenhuma outra**, todas em pílula. É a tabela que o
 * `Botao` lê; as constantes de cima continuam valendo para o `<button>` e o `<a>` escritos à mão, e o teste confere que
 * as duas dizem o mesmo botão.
 *
 * - `primario`: **a** ação da tela (enviar, gerar, salvar). No máximo um por tela.
 * - `oficial`: o preto, **só** para decisão oficial (aprovar, publicar, confirmar envio). Não se parece com nenhum outro
 *   botão de propósito: é o que combate o clique reflexo (regra 50, item 8).
 * - `secundario`: a alternativa, e as duas opções de uma escolha de peso igual (D59).
 * - `discreto`: ação de linha, de barra, de cartão.
 * - `perigo`: rejeitar, excluir, revogar. O cheio em `erro` existe só dentro do diálogo de confirmação (`cheio`).
 */
export const VARIANTES_DE_BOTAO = ['primario', 'oficial', 'secundario', 'discreto', 'perigo'] as const
export type VarianteDeBotao = (typeof VARIANTES_DE_BOTAO)[number]

/**
 * `principal` tem o alvo de toque de 44 px da ação principal (regra 50, item 2a). `compacto` é o controle secundário de
 * barra e de linha (`docs/interface.md` 9.3): 36 px no computador, e 44 px abaixo de 768 px, onde tudo se toca com o
 * dedo. `icone` é o círculo de 44 px do botão só de ícone (o enviar da caixa de pedido), que leva `aria-label`.
 */
export const TAMANHOS_DE_BOTAO = ['principal', 'compacto', 'icone'] as const
export type TamanhoDeBotao = (typeof TAMANHOS_DE_BOTAO)[number]

const FORMA_DO_BOTAO = 'inline-flex items-center justify-center gap-2 rounded-full font-medium'

const TAMANHO_DO_BOTAO: Readonly<Record<TamanhoDeBotao, string>> = {
  principal: 'min-h-11 min-w-11 px-4 py-2 text-base',
  compacto: 'min-h-11 min-w-11 px-3 py-1.5 text-sm md:min-h-9 md:min-w-9',
  icone: 'size-11 shrink-0',
}

/** O desligado é sempre outro desenho, e não a mesma cor apagada: `inativo`, que só serve a controle desabilitado (9.1). */
const COR_DO_BOTAO: Readonly<Record<VarianteDeBotao, string>> = {
  primario: 'bg-caramelo text-tinta enabled:hover:bg-caramelo-claro enabled:active:bg-caramelo-fundo disabled:bg-inativo',
  oficial: 'bg-noite text-white enabled:hover:bg-noite-alto enabled:active:bg-noite-baixo disabled:bg-inativo disabled:text-tinta',
  secundario: 'border border-borda-campo bg-superficie text-tinta enabled:hover:bg-realce-suave disabled:border-linha disabled:bg-realce-suave disabled:text-inativo',
  discreto: 'text-sutil enabled:hover:bg-realce-suave enabled:hover:text-tinta enabled:active:bg-realce disabled:text-inativo',
  perigo: 'border border-borda-campo bg-superficie text-erro enabled:hover:bg-erro-cx disabled:border-linha disabled:bg-realce-suave disabled:text-inativo',
}

const COR_DO_PERIGO_CHEIO = 'bg-erro text-white disabled:bg-inativo disabled:text-tinta'

export interface AparenciaDoBotao {
  readonly variante?: VarianteDeBotao
  readonly tamanho?: TamanhoDeBotao
  /** Só com `perigo`, e só dentro do diálogo de confirmação: o botão que confirma a exclusão ou a rejeição. */
  readonly cheio?: boolean
}

/** As classes de um botão da 11.1. Sem nada, é o `primario` de 44 px, que é o que o `Botao` sempre foi. */
export function classesDoBotao({ variante = 'primario', tamanho = 'principal', cheio = false }: AparenciaDoBotao = {}): string {
  const cor = variante === 'perigo' && cheio ? COR_DO_PERIGO_CHEIO : COR_DO_BOTAO[variante]
  return `${FORMA_DO_BOTAO} ${TAMANHO_DO_BOTAO[tamanho]} ${cor}`
}
