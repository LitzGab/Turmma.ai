import type { Locator, Page } from '@playwright/test'
import { expect } from './perfis.ts'
import { larguraExcedente } from './verificacoes.ts'

/**
 * O que os `e2e/pecas-*.spec.ts` dividem: abrir a galeria (`/galeria`), achar um bloco dela, medir uma peça. O que cada
 * grupo afirma de cor mora no arquivo do grupo, para a tarefa da peça não editar o arquivo de outra (tarefa 2.0 da X1).
 */

/** A galeria baixa o pedaço dela com a CPU ×4 e a rede lenta do perfil. */
export const PRAZO_DA_GALERIA_MS = 20_000

/** O bloco da galeria pelo nome que a `Secao` dá (`data-galeria`). */
export const secao = (page: Page, nome: string) => page.locator(`[data-galeria="${nome}"]`)

export async function abrirGaleria(page: Page): Promise<void> {
  await page.goto('/galeria')
  await expect(page.getByRole('heading', { level: 1, name: 'Galeria de peças' })).toBeVisible({ timeout: PRAZO_DA_GALERIA_MS })
}

/** Clica ou toca, conforme o projeto: no celular não existe clique de mouse. */
export async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  await (hasTouch ? alvo.tap() : alvo.click())
}

export function desenho(alvo: Locator): Promise<{ fundo: string; texto: string; borda: string; peso: string; fonte: string; canto: string; enchimento: string }> {
  return alvo.evaluate((elemento) => {
    const estilo = getComputedStyle(elemento)
    return {
      fundo: estilo.backgroundColor,
      texto: estilo.color,
      borda: `${estilo.borderTopWidth} ${estilo.borderTopStyle} ${estilo.borderTopColor}`,
      peso: estilo.fontWeight,
      fonte: estilo.fontSize,
      canto: estilo.borderTopLeftRadius,
      enchimento: estilo.padding,
    }
  })
}

export async function caixa(alvo: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const medida = await alvo.boundingBox()
  if (medida === null) throw new Error('a peça não está na tela')
  return medida
}

/** O que flutua aberto fica inteiro dentro da janela, e a página não ganha rolagem horizontal por causa dele. */
export async function conferirQueCabeNaJanela(page: Page, flutuante: Locator): Promise<void> {
  const medida = await caixa(flutuante)
  const largura = page.viewportSize()?.width ?? 0
  expect(medida.x).toBeGreaterThanOrEqual(0)
  expect(medida.x + medida.width).toBeLessThanOrEqual(largura)
  expect(await larguraExcedente(page)).toBe(0)
}

/** O foco está em algum controle ou texto da página, e não perdido no `body` (regra 50, item 11). */
export async function conferirQueOFocoNaoCaiu(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.activeElement === null || document.activeElement === document.body)).toBe(false)
}
