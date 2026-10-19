import { expect, type Page } from '@playwright/test'
import { irPeloPeDoSino } from './cena.ts'

/** Os sinais do Tutor, a atenção humana, o uso por aluno e as funções dele. Pelo pé do sino (telas do professor, 2.0); só termina quando a tela chegou. */
export async function abrirSinaisDoTutor(page: Page, hasTouch: boolean): Promise<void> {
  await irPeloPeDoSino(page, 'O que o Tutor viu', hasTouch)
  await expect(page).toHaveURL(/\/professor\/time\/tutor$/)
}
