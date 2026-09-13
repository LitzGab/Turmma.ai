import { defineConfig, devices } from '@playwright/test'
import { lerAmbienteDeTeste, valorObrigatorio } from './tools/ci/compose.ts'

// O e2e roda contra o compose de teste (`npm run test:e2e` ou `npm run ci:e2e`), nunca contra servidor de dev.
const urlBase = `http://127.0.0.1:${valorObrigatorio(lerAmbienteDeTeste(), 'WEB_PORTA_HOST')}`

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: process.env['CI'] === 'true',
  retries: 0,
  reporter: process.env['CI'] === 'true' ? [['list'], ['github']] : 'list',
  use: {
    baseURL: urlBase,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
