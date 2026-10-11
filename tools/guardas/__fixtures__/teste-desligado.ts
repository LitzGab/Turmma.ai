// Fixture da guarda `teste-sem-desligar`. Cada linha marcada é uma violação esperada ali.
// O que não tem marca roda de verdade e não pode ser acusado.

interface Declarar {
  (nome: string, corpo: () => void): void
  skip: Declarar
  only: Declarar
  fixme: Declarar
  todo: (nome: string) => void
  each: (casos: readonly unknown[]) => Declarar
  skipIf: (condicao: boolean) => Declarar
  runIf: (condicao: boolean) => Declarar
  describe: Declarar
}
declare const it: Declarar
declare const test: Declarar
declare const describe: Declarar
declare const fila: { skip: (quantos: number) => void; only: string }

it.skip('desligado: a regra que ele provava fica só no papel', () => {}) /* reprova: guardas/teste-sem-desligar */
it.only('isolado: desliga o resto do arquivo', () => {}) /* reprova: guardas/teste-sem-desligar */
test.fixme('marcado para depois', () => {}) /* reprova: guardas/teste-sem-desligar */
it.todo('sem corpo') /* reprova: guardas/teste-sem-desligar */
describe.skip('o grupo inteiro', () => {}) /* reprova: guardas/teste-sem-desligar */
test.describe.skip('o grupo do Playwright', () => {}) /* reprova: guardas/teste-sem-desligar */
it.skip.each([1, 2])('em tabela', () => {}) /* reprova: guardas/teste-sem-desligar */
it.skipIf(process.platform === 'win32')('desligado por condição que ninguém confere', () => {}) /* reprova: guardas/teste-sem-desligar */
it.runIf(process.env['CI'] === 'true')('só na esteira', () => {}) /* reprova: guardas/teste-sem-desligar */

test('dentro do corpo também: o skip condicional do Playwright', () => {
  test.skip('sem celular', () => {}) /* reprova: guardas/teste-sem-desligar */
})

it('roda de verdade', () => {})
it.each([1, 2])('em tabela, rodando', () => {})
describe('grupo que roda', () => {})
test.describe('grupo do Playwright que roda', () => {})

// `skip` e `only` que não são de teste: o método de outra coisa não é acusado.
fila.skip(3)
export const modo = fila.only
