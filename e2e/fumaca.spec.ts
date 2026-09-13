import { expect, test } from '@playwright/test'

test('a web mostra o estado da API vindo da própria API, pelo compose', async ({ page }) => {
  const respostaSaude = page.waitForResponse((resposta) => new URL(resposta.url()).pathname === '/saude')
  await page.goto('/')

  const saude = await respostaSaude
  expect(saude.status()).toBe(200)
  expect(await saude.json()).toEqual({ ok: true })

  const situacao = page.getByRole('status')
  await expect(situacao).toHaveText('API respondendo, banco disponível.')
  await expect(situacao).toHaveAttribute('data-saude', 'true')
})
