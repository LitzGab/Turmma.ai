import type { Page } from '@playwright/test'
import { irPelaNavegacao } from '../casca.ts'

/**
 * "O que você já gerou": hoje mora em Ferramentas, e é para lá que a fixture aponta. Quando Criados chegar à lateral
 * (telas do professor, 5.3), só esta função muda, e os specs que a chamam continuam como estão.
 */
export async function abrirOQueFoiGerado(page: Page, hasTouch: boolean): Promise<void> {
  await irPelaNavegacao(page, 'Ferramentas', hasTouch)
}
