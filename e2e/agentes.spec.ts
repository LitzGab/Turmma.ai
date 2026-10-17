import type { Locator, Page } from '@playwright/test'
import { entrarComoCoordenacaoNaMesmaAba, esperarPainel, PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { irPelaCoordenacao } from './__fixtures__/coordenacao.ts'
import { conferirAssinaturas, conferirQueAOncaNaoTemNome, conferirTamanhoDoAvatar } from './__fixtures__/avatar.ts'
import { auditoriasNoBanco, montarEscolaComEntregas, suspensoesNoBanco, type EscolaComEntregas } from './__fixtures__/governanca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { criarEquipeComSenha, type EquipeDeTeste } from './__fixtures__/sessao.ts'
import { larguraExcedente, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * Os agentes da coordenação (X2, 3.0; movido de `governanca.spec.ts` sem editar o corpo): os três cartões com as funções, a
 * suspensão da correção de objetiva pelo diálogo e a retomada, com o registro no banco, em Registros, no link "Como cada IA trabalha".
 */

const principal = (page: Page) => page.getByRole('main')

const dialogo = (page: Page) => page.getByRole('alertdialog')

async function acionar(alvo: Locator, hasTouch: boolean): Promise<void> {
  if (hasTouch) await alvo.tap()
  else await alvo.click()
}

interface Cenario {
  readonly coordenadora: EquipeDeTeste
  readonly escola: EscolaComEntregas | undefined
}

/**
 * A coordenadora entra, abre no Painel e vai à aba IA de Registros, que é a Governança. Com `comEntregas`, a escola já tem o que
 * o roteiro deixa até o passo 4.
 */
async function entrar(page: Page, hasTouch: boolean, comEntregas = true): Promise<Cenario> {
  const coordenadora = await criarEquipeComSenha('coordenador')
  const escola = comEntregas ? await montarEscolaComEntregas(coordenadora.escolaId, coordenadora.usuarioId) : undefined
  await page.goto('/entrar')
  await entrarComoCoordenacaoNaMesmaAba(page, coordenadora, hasTouch)
  await esperarPainel(page)
  await irPelaCoordenacao(page, 'IA', hasTouch)
  return { coordenadora, escola }
}

test.describe('Agentes', () => {
  test('três cartões com as funções; suspender a correção de objetiva pelo diálogo e retomar, com o registro no banco', async ({ page, hasTouch }) => {
    const { coordenadora } = await entrar(page, hasTouch, false)
    await irPelaCoordenacao(page, 'Agentes', hasTouch)
    await expect(page).toHaveURL(/\/coordenacao\/agentes$/)
    for (const agente of ['Assistente de ensino', 'Tutor', 'Analista de desempenho escolar']) await expect(principal(page).getByRole('heading', { level: 2, name: agente })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    // Cada cartão é de um agente: o título é o nome da função, e a cabeça da onça vem com ele e com o selo "IA" no mesmo
    // bloco (RF10). O atributo do cartão é próprio (`data-cartao-do-agente`): `[data-agente]` é só o avatar.
    await expect(principal(page).locator('[data-cartao-do-agente]')).toHaveCount(3)
    for (const agente of ['assistente_de_ensino', 'tutor', 'analista_de_desempenho_escolar'])
      await expect(principal(page).locator(`[data-cartao-do-agente="${agente}"] [data-agente="${agente}"]`)).toHaveCount(1)
    expect(await conferirAssinaturas(principal(page))).toBe(3)
    // O avatar do cartão é o de 48 px, e a tela inteira não chama nada de "onça" (A28).
    expect(await conferirTamanhoDoAvatar(principal(page), 48)).toBe(3)
    await conferirQueAOncaNaoTemNome(page)
    const correcao = principal(page).locator('[data-funcao="correcao_de_objetiva"]')
    await expect(correcao).toContainText('Faz sozinha')
    await expect(correcao).toContainText('Espera aprovação')
    await expect(correcao).toContainText('Alto risco')
    await expect(correcao).toContainText('Faz e avisa')
    await expect(correcao).toContainText('Funcionando')
    await expect(principal(page).getByRole('region', { name: 'O que a IA nunca faz' })).toContainText('redação e discursiva')
    expect(await violacoesGraves(page)).toEqual([])

    await acionar(correcao.getByRole('button', { name: 'Suspender esta função: Correção de objetiva' }), hasTouch)
    await expect(dialogo(page)).toContainText('fica sem correção até a função voltar')
    await expect(dialogo(page)).toContainText('continua podendo ser aprovado ou rejeitado')
    await expect(dialogo(page)).toContainText('auditoria')
    await dialogo(page).getByLabel('Motivo').selectOption({ label: 'A escola está revendo o uso pedagógico' })
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(dialogo(page).getByRole('button', { name: 'Suspender Correção de objetiva' }), hasTouch)
    await expect(dialogo(page)).toHaveCount(0)
    await expect(correcao).toContainText('Suspensa nesta escola desde', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(correcao).toContainText('Motivo: A escola está revendo o uso pedagógico')
    await expect(principal(page).getByRole('status').filter({ hasText: 'A função "Correção de objetiva" está suspensa nesta escola.' })).toBeVisible()
    // O foco vai para o botão que tomou o lugar do que abriu a confirmação.
    await expect(correcao.getByRole('button', { name: 'Retomar esta função: Correção de objetiva' })).toBeFocused()
    // Só ela: a Adaptação, do mesmo agente, continua.
    await expect(principal(page).locator('[data-funcao="adaptacao"]')).toContainText('Funcionando')
    expect(await suspensoesNoBanco(coordenadora.escolaId, 'correcao_de_objetiva')).toEqual([{ suspensaPor: coordenadora.usuarioId, motivo: 'revisao_pedagogica', retomada: false }])

    await acionar(correcao.getByRole('button', { name: 'Retomar esta função: Correção de objetiva' }), hasTouch)
    await expect(correcao).toContainText('Funcionando', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(correcao.getByRole('button', { name: 'Suspender esta função: Correção de objetiva' })).toBeFocused()
    expect(await suspensoesNoBanco(coordenadora.escolaId, 'correcao_de_objetiva')).toEqual([{ suspensaPor: coordenadora.usuarioId, motivo: 'revisao_pedagogica', retomada: true }])
    expect((await auditoriasNoBanco(coordenadora.escolaId, 'funcao.suspensa')).map((registro) => registro.autor)).toEqual([coordenadora.usuarioId])
    expect((await auditoriasNoBanco(coordenadora.escolaId, 'funcao.retomada')).map((registro) => registro.autor)).toEqual([coordenadora.usuarioId])
    expect(await larguraExcedente(page)).toBe(0)
  })
})
