import { expect, it } from 'vitest'

// Fixture de propósito vermelha: prova que a esteira não engole teste falhando.
it('falha de propósito', () => {
  expect(1 + 1).toBe(3)
})
