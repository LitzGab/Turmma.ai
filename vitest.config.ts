import { defaultServerConditions } from 'vite'
import { defineConfig } from 'vitest/config'

const ignorados = ['**/node_modules/**', '**/dist/**', 'e2e/**', 'tools/ci/fixtures/**']

// Os de `infra/` provam a borda, as métricas, os alertas e os jobs contra o compose inteiro, e esperam o
// relógio real (o `for:` de 5 min do alerta, a sonda da borda, a exportação de métricas): uns 16 min dos
// ~21 da integração. Ficam num projeto próprio (D52): o portão da tarefa roda quando ela mexe em infra, e a
// esteira roda sempre.
const integracaoDeInfra = 'infra/**/*.int.test.ts'
const integracao = {
  exclude: ignorados,
  globalSetup: ['tools/testes/integracao.setup.ts'],
  // Os testes param e religam serviços do compose: um arquivo por vez.
  fileParallelism: false,
  testTimeout: 60_000,
  hookTimeout: 180_000,
}

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
          ...integracao,
          name: 'integracao',
          include: ['**/*.int.test.ts'],
          exclude: [...ignorados, integracaoDeInfra],
        },
      },
      {
        extends: true,
        test: {
          ...integracao,
          name: 'infra',
          include: [integracaoDeInfra],
        },
      },
    ],
  },
})
