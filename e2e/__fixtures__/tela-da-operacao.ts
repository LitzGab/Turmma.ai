import type { Page } from '@playwright/test'
import { codigoDoOperador, type OperadorDeTeste } from './operacao.ts'
import { expect } from './perfis.ts'

/** O Chromebook com CPU ×4 e Fast 3G carrega o chunk da operação, e o servidor ainda faz o hash da senha. */
export const PRAZO_DA_ENTRADA_MS = 20_000

/** Toque no celular, clique no Chromebook: a mesma ação pela entrada que cada aparelho tem. */
export async function acionar(page: Page, nome: string | RegExp, hasTouch: boolean): Promise<void> {
  const alvo = page.getByRole('button', { name: nome })
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

/** A casca da operação com a sessão aberta: o nome de quem entrou na faixa, em `/operacao`. */
export async function esperarCasca(page: Page, operador: Pick<OperadorDeTeste, 'nome'>): Promise<void> {
  await expect(page.getByRole('banner')).toContainText(operador.nome, { timeout: PRAZO_DA_ENTRADA_MS })
  await expect(page).toHaveURL(/\/operacao(\?.*)?$/)
}

/** O operador entra pela tela: e-mail e senha, depois o código do aplicativo, até a casca da operação. */
export async function entrarNaOperacao(page: Page, operador: OperadorDeTeste, hasTouch: boolean): Promise<void> {
  await page.goto('/operacao/entrar')
  await expect(page.getByRole('heading', { name: 'Entrar na operação' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  await page.getByLabel('E-mail').fill(operador.email)
  await page.getByLabel('Senha').fill(operador.senha)
  await acionar(page, /^Entrar$/, hasTouch)
  await expect(page.getByRole('heading', { name: 'Segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  await page.getByLabel('Código do aplicativo').fill(codigoDoOperador(operador))
  await acionar(page, /^Entrar$/, hasTouch)
  await esperarCasca(page, operador)
}
