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
