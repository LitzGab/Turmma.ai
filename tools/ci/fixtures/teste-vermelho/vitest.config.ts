import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { include: ['tools/ci/fixtures/teste-vermelho/*.test.ts'] },
})
