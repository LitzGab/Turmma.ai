import type { APIRequestContext, Page } from '@playwright/test'
import { codigoDoAutenticador, type EquipeDeTeste } from './sessao.ts'
import { expect } from './perfis.ts'

/**
 * O segundo fator da coordenação, para os specs que precisam de uma conta com MFA ativo (a 6.0 do F1 e o W10 da A0b):
 * entrar com a senha e configurar o app autenticador do jeito sem celular, pela tela (`configurarSegundoFator`) ou, quando
 * a configuração só prepara a conta, pela API (`configurarSegundoFatorPelaApi`).
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

/** A entrada com a senha pela API, em contexto de requisição à parte, que não entrega cookie à aba. Devolve o desafio da etapa esperada. */
async function entrarPelaApi(request: APIRequestContext, equipe: EquipeDeTeste, etapaEsperada: 'configurar_mfa' | 'mfa'): Promise<string> {
  const entrada = await request.post('/v1/sessao/email', { data: { email: equipe.email, senha: equipe.senha } })
  expect(entrada.ok(), 'a entrada pela API').toBe(true)
  const { etapa, desafio } = (await entrada.json()) as { etapa: string; desafio: string }
  expect(etapa).toBe(etapaEsperada)
  return desafio
}

/**
 * O mesmo segundo fator, configurado pela API em vez de pela tela: o que o caso quer provar vem depois da configuração, e a
 * tela de configuração custa uns 8 s de um prazo de 30 s. Quem precisa provar a própria tela chama `configurarSegundoFator`.
 */
export async function configurarSegundoFatorPelaApi(request: APIRequestContext, equipe: EquipeDeTeste): Promise<SegundoFatorConfigurado> {
  const desafio = await entrarPelaApi(request, equipe, 'configurar_mfa')
  const porDesafio = { Authorization: `Bearer ${desafio}` }
  const configurado = await request.post('/v1/conta/mfa/configurar', { headers: porDesafio })
  expect(configurado.ok(), 'a configuração pela API').toBe(true)
  const { segredo } = (await configurado.json()) as { segredo: string }

  const ativado = await request.post('/v1/conta/mfa/ativar', { headers: porDesafio, data: { codigo: codigoDoAutenticador(segredo) } })
  expect(ativado.ok(), 'a ativação pela API').toBe(true)
  const { codigosRecuperacao } = (await ativado.json()) as { codigosRecuperacao: string[] }
  return { segredo, codigosDeRecuperacao: codigosRecuperacao }
}

/** Gasta um código de recuperação pela API (entra com a senha e informa o código no segundo fator): a aba só vê o que vem depois. */
export async function gastarCodigoDeRecuperacaoPelaApi(request: APIRequestContext, equipe: EquipeDeTeste, codigo: string): Promise<void> {
  const desafio = await entrarPelaApi(request, equipe, 'mfa')
  const gasto = await request.post('/v1/sessao/mfa', { headers: { Authorization: `Bearer ${desafio}` }, data: { recuperacao: codigo } })
  expect(gasto.ok(), 'o código de recuperação gasto pela API').toBe(true)
}
