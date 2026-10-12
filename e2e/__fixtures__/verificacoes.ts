import { AxeBuilder } from '@axe-core/playwright'
import type { Page } from '@playwright/test'

/** As regras do axe que a esteira aplica. `wcag22aa` traz o `target-size` (alvo de toque de 24 px). */
export const TAGS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] as const

export const IMPACTOS_QUE_REPROVAM = ['serious', 'critical'] as const

/** Alvo de toque mínimo de ação principal, além dos 24 px que o axe cobra (regra 50, item 2a). */
export const ALVO_DE_TOQUE_PRINCIPAL_PX = 44

export interface ViolacaoGrave {
  regra: string
  impacto: string
  alvos: string[]
}

/** Violações `serious` e `critical` do axe na página como está agora. Lista vazia é a única que passa. */
export async function violacoesGraves(page: Page): Promise<ViolacaoGrave[]> {
  const resultado = await new AxeBuilder({ page }).withTags([...TAGS_WCAG]).analyze()
  return resultado.violations
    .filter((violacao) => (IMPACTOS_QUE_REPROVAM as readonly string[]).includes(violacao.impact ?? ''))
    .map((violacao) => ({
      regra: violacao.id,
      impacto: violacao.impact ?? '',
      alvos: violacao.nodes.map((no) => no.target.join(' ')),
    }))
}

/**
 * Quantos px o documento passa da largura da janela. Zero é sem rolagem horizontal. Compara com a
 * largura do viewport de layout, que o `width=device-width` fixa na largura do aparelho.
 */
export function larguraExcedente(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

/**
 * Quantos px o conteúdo do diálogo aberto passa da largura dele. O `dialog` modal fica na camada de cima, fixo, e o que
 * transborda dele não aumenta o documento: vira rolagem horizontal dentro do próprio diálogo, que a `larguraExcedente`
 * não enxerga. Zero é sem rolagem; sem diálogo aberto, falha alto.
 */
export function larguraExcedenteDoDialogo(page: Page): Promise<number> {
  return page.locator('dialog[open]').evaluate((dialogo) => dialogo.scrollWidth - dialogo.clientWidth)
}

/** O foco do elemento aparece: contorno com largura e estilo, ou sombra. */
export function focoVisivel(page: Page, seletorAtivo = ':focus-visible'): Promise<boolean> {
  return page.evaluate((seletor) => {
    const elemento = document.activeElement
    if (!elemento || !elemento.matches(seletor)) return false
    const estilo = getComputedStyle(elemento)
    const contorno = estilo.outlineStyle !== 'none' && Number.parseFloat(estilo.outlineWidth) >= 2
    return contorno || estilo.boxShadow !== 'none'
  }, seletorAtivo)
}

/**
 * O código numérico de erro (`503`, `409`, `429`) como texto cru na tela, para `not.toContainText` (regra 50, item 12:
 * erro diz o que fazer, não o código).
 *
 * Não é a substring: o nome sintético da escola e da pessoa vem de oito caracteres hexadecimais minúsculos
 * (`marca.slice(0, 8)`), e `fa5030ac` ou `a2503562` trazem "503" sem erro nenhum na tela (esteira de 12/10/2026, duas
 * vezes). Em oito caracteres, um código de três tem sempre um vizinho hexadecimal; o do erro de verdade vem entre espaço,
 * pontuação ou o texto do botão vizinho, que o `textContent` cola sem espaço ("Erro 503Tentar de novo").
 *
 * **O que a guarda deixa de ver:** o código cru colado a uma letra minúscula de `a` a `f` ou a um dígito ("503de novo",
 * "5031"), porque para a expressão ele é indistinguível de um pedaço de nome sintético. Os botões e avisos de hoje
 * começam em maiúscula, então o risco é baixo; um botão que comece em minúscula de `a` a `f` e venha logo depois do erro
 * pede outra guarda, e não o afrouxamento desta.
 */
export function codigoCru(codigo: string): RegExp {
  return new RegExp(`(?<![0-9a-f])${codigo}(?![0-9a-f])`)
}
