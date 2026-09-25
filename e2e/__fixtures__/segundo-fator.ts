import type { Page } from '@playwright/test'
import { codigoDoAutenticador, type EquipeDeTeste } from './sessao.ts'
import { expect } from './perfis.ts'

/**
 * O segundo fator da coordenação pela tela, para os specs que precisam de uma conta com MFA ativo (a 6.0 do F1 e o W10
 * da A0b): entrar com a senha e configurar o app autenticador do jeito sem celular.
 */

const PRAZO_DA_ENTRADA_MS = 20_000

export const campoCodigo = (page: Page) => page.getByLabel(/Código do aplicativo|Digite o código que o aplicativo mostra/)

/** O segundo fator e os códigos de recuperação que a configuração entregou uma vez só. */
export interface SegundoFatorConfigurado {
  readonly segredo: string
  readonly codigosDeRecuperacao: readonly string[]
}

export async function entrarComSenha(page: Page, equipe: EquipeDeTeste): Promise<void> {
  await page.goto('/entrar')
  await page.getByLabel('E-mail').fill(equipe.email)
  await page.getByLabel('Senha').fill(equipe.senha)
  await page.getByRole('button', { name: /^Entrar$/ }).click()
}

/**
 * A coordenadora configura o segundo fator pela tela, do jeito sem celular: copia o segredo em texto, cola no
 * aplicativo do computador (aqui, o `otpauth` do teste) e ativa.
 */
export async function configurarSegundoFator(page: Page, equipe: EquipeDeTeste): Promise<SegundoFatorConfigurado> {
  const respostaDoSegredo = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/conta/mfa/configurar')
  await entrarComSenha(page, equipe)
  await expect(page.getByRole('heading', { name: 'Configurar o segundo fator' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  const { segredo } = (await (await respostaDoSegredo).json()) as { segredo: string }

  const respostaDosCodigos = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/v1/conta/mfa/ativar')
  await campoCodigo(page).fill(codigoDoAutenticador(segredo))
  await page.getByRole('button', { name: /Ativar o segundo fator|Ativando/ }).click()
  const { codigosRecuperacao } = (await (await respostaDosCodigos).json()) as { codigosRecuperacao: string[] }
  await expect(page.getByRole('link', { name: 'Ir para a entrada' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
  return { segredo, codigosDeRecuperacao: codigosRecuperacao }
}
