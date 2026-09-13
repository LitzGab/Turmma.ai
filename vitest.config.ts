import { defaultServerConditions } from 'vite'
import { defineConfig } from 'vitest/config'

const ignorados = ['**/node_modules/**', '**/dist/**', 'e2e/**', 'tools/ci/fixtures/**']

// Pacotes do monorepo resolvem para `src` nos testes, sem depender de `dist` construído antes. Sem a
// condição `module` do Vite: o Node do container não a usa, e com ela o teste carregaria outra build da
// dependência (a `dist-es` do SDK S3, que o Node nem consegue importar) que não a de produção.
const condicoes = ['source', ...defaultServerConditions.filter((condicao) => condicao !== 'module')]

export default defineConfig({
  resolve: { conditions: condicoes },
  ssr: { resolve: { conditions: condicoes } },
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
