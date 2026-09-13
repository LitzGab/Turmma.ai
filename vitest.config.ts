import { defaultServerConditions } from 'vite'
import { defineConfig } from 'vitest/config'

const ignorados = ['**/node_modules/**', '**/dist/**', 'e2e/**', 'tools/ci/fixtures/**']

export default defineConfig({
  // Pacotes do monorepo resolvem para `src` nos testes, sem depender de `dist` construído antes.
  resolve: { conditions: ['source', ...defaultServerConditions] },
  ssr: { resolve: { conditions: ['source', ...defaultServerConditions] } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unidade',
          include: ['**/*.test.ts'],
          exclude: [...ignorados, '**/*.int.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integracao',
          include: ['**/*.int.test.ts'],
          exclude: ignorados,
          globalSetup: ['tools/testes/integracao.setup.ts'],
          // Os testes param e religam serviços do compose: um arquivo por vez.
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
})
