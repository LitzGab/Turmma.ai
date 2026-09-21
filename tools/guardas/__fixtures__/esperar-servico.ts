// Fixture da guarda `esperar-servico-do-compose`. Cada linha marcada é uma violação esperada ali.
// O que não tem marca é o jeito certo de subir serviço num teste e não pode ser acusado.

declare function compose(...argumentos: string[]): { codigo: number }
declare function composeAssincronoOuFalha(...argumentos: string[]): Promise<void>
declare function aguardarSaudavel(servico: string, limiteMs?: number): Promise<void>
declare const expect: { poll: (fn: () => unknown, opcoes: unknown) => { toBe: (v: unknown) => Promise<void> } }
declare function it(nome: string, corpo: () => Promise<void>): void
declare function estado(): Promise<string>

it('sobe o serviço e mede sem esperar: a subida do container come o prazo', async () => {
  await composeAssincronoOuFalha('start', 'redis-fila') /* reprova: guardas/esperar-servico-do-compose */
  await expect.poll(() => estado(), { timeout: 30_000 }).toBe('pronto')
})

it('sobe e espera o serviço: o prazo mede só a regra', async () => {
  await composeAssincronoOuFalha('start', 'redis-fila')
  await aguardarSaudavel('redis-fila')
  await expect.poll(() => estado(), { timeout: 20_000 }).toBe('pronto')
})

it('up --detach sem espera também é acusado', async () => {
  await composeAssincronoOuFalha('up', '--detach', 'postgres') /* reprova: guardas/esperar-servico-do-compose */
  await expect.poll(() => estado(), { timeout: 30_000 }).toBe('pronto')
})

it('up --wait passa, porque quem espera a saúde é o próprio compose', async () => {
  await composeAssincronoOuFalha('up', '--detach', '--wait', 'postgres')
  await expect.poll(() => estado(), { timeout: 20_000 }).toBe('pronto')
})

it('espera em laço, com o serviço em variável, conta como espera', async () => {
  await composeAssincronoOuFalha('up', '--detach', 'redis-fila', 'postgres')
  for (const servico of ['redis-fila', 'postgres']) await aguardarSaudavel(servico)
  await expect.poll(() => estado(), { timeout: 20_000 }).toBe('pronto')
})

it('restart sem espera é acusado, porque o serviço volta do zero', async () => {
  await composeAssincronoOuFalha('restart', 'realtime-1') /* reprova: guardas/esperar-servico-do-compose */
  await expect.poll(() => estado(), { timeout: 30_000 }).toBe('pronto')
})

it('parar serviço não exige espera nenhuma', async () => {
  compose('stop', 'redis-fila')
  compose('pause', 'redis-fila')
  compose('unpause', 'redis-fila')
})
