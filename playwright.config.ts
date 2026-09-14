import { defineConfig, devices } from '@playwright/test'
import { PERFIL_CELULAR, PERFIL_CHROMEBOOK, type OpcoesDoPerfil } from './e2e/__fixtures__/perfis.ts'
import { lerAmbienteDeTeste, valorObrigatorio } from './tools/ci/compose.ts'

// O e2e roda contra o compose de teste (`npm run test:e2e` ou `npm run ci:e2e`), nunca contra servidor de dev.
const urlBase = `http://127.0.0.1:${valorObrigatorio(lerAmbienteDeTeste(), 'WEB_PORTA_HOST')}`

/**
 * Todo spec de tela roda nos dois projetos (D51), sem `testMatch` nem `testIgnore` por projeto. Os dois são
 * Chromium: a limitação de CPU e de rede vem do CDP, que só ele tem.
 */
export default defineConfig<OpcoesDoPerfil>({
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
  projects: [
    {
      // Chromebook de entrada: tela de 1366 × 768, CPU ×4 e Fast 3G.
      name: 'chromebook',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 }, perfil: PERFIL_CHROMEBOOK },
    },
    {
      // Celular de entrada: 360 × 800, toque, CPU ×4 e rede móvel lenta.
      name: 'celular',
      use: {
        browserName: 'chromium',
        userAgent: devices['Pixel 7'].userAgent,
        viewport: { width: 360, height: 800 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        perfil: PERFIL_CELULAR,
      },
    },
  ],
})
