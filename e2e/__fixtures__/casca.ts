import type { Locator, Page } from '@playwright/test'
import { expect } from './perfis.ts'
import { campoCodigo } from './segundo-fator.ts'
import { codigoDoAutenticador, criarEquipeComSenha, type EquipeDeTeste } from './sessao.ts'

/**
 * A casca da escola pela tela (A1, tarefa 11.0): abaixo de 768 px a lateral é uma gaveta que abre pelo botão do menu; no
 * computador ela já está aberta. Os specs que andam pela navegação passam por aqui, para o mesmo teste valer nos
 * projetos `chromebook` e `celular` (D51).
 */

/** A casca está na largura da gaveta: a barra do topo com o botão do menu, e a lateral fechada. */
export function naGaveta(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) < 768
}

/** A gaveta aberta, o `dialog` modal com a lateral dentro. */
export const gaveta = (page: Page): Locator => page.getByRole('dialog', { name: 'Menu' })

/**
 * Onde a lateral está agora: dentro da gaveta, quando é gaveta, ou a página. Com a gaveta aberta, o "Sair" da barra do
 * topo continua na página, atrás dela: procurar a partir daqui acha o da lateral.
 */
export function lateral(page: Page): Locator {
  return naGaveta(page) ? gaveta(page) : page.locator('body')
}

/** Abre a gaveta, se a casca está nela e ela ainda está fechada; no computador não faz nada. */
export async function abrirNavegacao(page: Page, hasTouch: boolean): Promise<void> {
  if (!naGaveta(page) || (await gaveta(page).isVisible())) return
  const menu = page.getByRole('button', { name: 'Abrir o menu' })
  if (hasTouch) await menu.tap()
  else await menu.click()
  await expect(gaveta(page)).toBeVisible()
}

/** Vai a uma seção pela navegação da lateral, abrindo a gaveta antes quando é preciso. */
export async function irPelaNavegacao(page: Page, rotulo: string, hasTouch: boolean): Promise<void> {
  await abrirNavegacao(page, hasTouch)
  const item = lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: rotulo })
  if (hasTouch) await item.tap()
  else await item.click()
}

/** O Chromebook com CPU ×4 e rede Fast 3G carrega a página e ainda faz o hash da senha no servidor. */
export const PRAZO_DA_ENTRADA_MS = 20_000

/** Um passo do TOTP à frente: a ativação grava o passo usado, e só um passo maior entra depois (6.0 do F1). */
const PASSO_SEGUINTE_SEGUNDOS = 30

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

/** Entra por e-mail e senha a partir da tela de entrada já aberta, sem recarregar a página. */
export async function entrarPorEmail(page: Page, pessoa: EquipeDeTeste, hasTouch: boolean): Promise<void> {
  await page.getByLabel('E-mail').fill(pessoa.email)
  await page.getByLabel('Senha').fill(pessoa.senha)
  await acionar(page.getByRole('button', { name: /^Entrar$/ }), hasTouch)
}

/** A professora de uma escola só, na página inicial dela. */
export async function entrarComoProfessora(page: Page, hasTouch: boolean): Promise<EquipeDeTeste> {
  const professora = await criarEquipeComSenha()
  await page.goto('/entrar')
  await entrarPorEmail(page, professora, hasTouch)
  await expect(page.getByRole('heading', { name: `Olá, ${professora.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  return professora
}

/**
 * A coordenadora no primeiro acesso, a partir da tela de entrada já aberta e sem recarregar a página: configura o
 * segundo fator do jeito sem celular, volta à entrada e entra com o código. Sem recarga, o que o teste afirma sobre o
 * cache da pessoa anterior na mesma aba continua valendo.
 */
export async function entrarComoCoordenacaoNaMesmaAba(page: Page, coordenadora: EquipeDeTeste, hasTouch: boolean): Promise<void> {
  const respostaDoSegredo = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/conta/mfa/configurar')
  await entrarPorEmail(page, coordenadora, hasTouch)
  await expect(page.getByRole('heading', { name: 'Configurar o segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  const { segredo } = (await (await respostaDoSegredo).json()) as { segredo: string }
  await campoCodigo(page).fill(codigoDoAutenticador(segredo))
  await acionar(page.getByRole('button', { name: /Ativar o segundo fator|Ativando/ }), hasTouch)
  await acionar(page.getByRole('link', { name: 'Ir para a entrada' }), hasTouch)
  await entrarPorEmail(page, coordenadora, hasTouch)
  await expect(page.getByRole('heading', { name: 'Segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  await campoCodigo(page).fill(codigoDoAutenticador(segredo, PASSO_SEGUINTE_SEGUNDOS))
  await acionar(page.getByRole('button', { name: /^Entrar$/ }), hasTouch)
  await expect(page.getByRole('heading', { name: `Olá, ${coordenadora.nome}` })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
}
