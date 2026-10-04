import type { Page, Route } from '@playwright/test'
import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { abrirNavegacao, irPelaNavegacao, lateral, PRAZO_DA_ENTRADA_MS, esperarAtividades } from './__fixtures__/casca.ts'
import { expect, test } from './__fixtures__/perfis.ts'
import { colocarAlunoNaTurma, criarAlunoComMatricula, type AlunoDeTeste } from './__fixtures__/sessao.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * "Minha turma" do aluno (A1, tarefa 12.0; RF13): a escola, a turma e a série dele, sem colegas. Os estados do W4 —
 * carregando, com dado e erro com a rota interceptada, e nunca vazia —, o aluno sem turma no ano, e o W12 a 360 px.
 */

const ROTA_MINHA_TURMA = '**/v1/minha-turma'
const SEM_TURMA_NO_ANO = 'Você ainda não está em uma turma neste ano letivo. Fale com o seu professor ou com a coordenação.'

/** O aluno entra pelo endereço da escola, com matrícula e senha, e chega a "Atividades", onde ele abre. */
async function entrarComoAluno(page: Page, aluno: AlunoDeTeste, hasTouch: boolean): Promise<void> {
  await page.goto(`/e/${aluno.slug}`)
  await page.getByLabel('Matrícula').fill(aluno.matricula)
  await page.getByLabel('Senha').fill(aluno.senha)
  const entrar = page.getByRole('button', { name: /^Entrar$/ })
  if (hasTouch) await entrar.tap()
  else await entrar.click()
  await esperarAtividades(page, aluno.nome)
}

/** Uma porta que segura a resposta até o teste abrir. */
function portao(): { aberta: Promise<void>; abrir: () => void } {
  let abrir: () => void = () => undefined
  const aberta = new Promise<void>((resolver) => {
    abrir = resolver
  })
  return { aberta, abrir }
}

test.describe('W4: os estados de "Minha turma"', () => {
  test('carregando, com dado — a turma, a série e a escola, sem colega —, e o erro com "Tentar de novo"', async ({ page, hasTouch }) => {
    const aluno = await criarAlunoComMatricula()
    const turma = await colocarAlunoNaTurma(aluno)
    // Um colega na mesma turma: o nome dele não pode aparecer na tela do aluno (regra 50, item 9).
    const colega = await criarAlunoComMatricula({ escola: aluno })
    await colocarAlunoNaTurma(colega, turma)
    await entrarComoAluno(page, aluno, hasTouch)

    let estado: 'segurado' | 'falha' | 'normal' = 'segurado'
    const segurado = portao()
    await page.route(ROTA_MINHA_TURMA, async (rota: Route) => {
      if (estado === 'segurado') await segurado.aberta
      if (estado === 'falha')
        return rota.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ erro: { codigo: 'INDISPONIVEL_TENTE_DE_NOVO', mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } }),
        })
      return rota.continue()
    })

    // Carregando: o texto, e nada da turma ainda.
    await irPelaNavegacao(page, 'Minha turma', hasTouch)
    await expect(page.getByRole('main').getByRole('status')).toHaveText('Carregando a sua turma…', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page).toHaveTitle('Minha turma · Turmma')

    // Com dado: a turma, a série por extenso e a escola; o colega, não.
    segurado.abrir()
    const principal = page.getByRole('main')
    await expect(principal.getByRole('heading', { level: 2, name: turma.turmaNome })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal).toContainText(turma.serieNome)
    await expect(principal).toContainText(aluno.escolaNome)
    await expect(page.locator('body')).not.toContainText(colega.nome)
    await expect(principal.getByRole('button', { name: 'Tentar de novo' })).toHaveCount(0)
    await expect(principal).not.toContainText(SEM_TURMA_NO_ANO)
    expect(await violacoesGraves(page)).toEqual([])

    // Erro: a API cai, e a tela diz o que fazer, com "Tentar de novo", sem código nem status.
    estado = 'falha'
    await page.reload()
    await expect(principal.getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal).not.toContainText(turma.turmaNome)
    for (const proibido of ['503', 'INDISPONIVEL']) await expect(page.locator('body')).not.toContainText(proibido)
    expect(await violacoesGraves(page)).toEqual([])

    // A API volta: "Tentar de novo" traz a turma.
    estado = 'normal'
    const tentar = principal.getByRole('button', { name: 'Tentar de novo' })
    if (hasTouch) await tentar.tap()
    else await tentar.click()
    await expect(principal).toContainText(turma.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })
  })

  test('o aluno sem turma no ano letivo em curso vê a quem recorrer, e não um erro de rede', async ({ page, hasTouch }) => {
    // Sem vínculo confirmado no ano (a virada de ano, ou o vínculo que ainda não existe), a API responde `NAO_ENCONTRADO`.
    const aluno = await criarAlunoComMatricula()
    await entrarComoAluno(page, aluno, hasTouch)
    await irPelaNavegacao(page, 'Minha turma', hasTouch)
    const principal = page.getByRole('main')
    // Numa região de status: o leitor de tela anuncia a troca do "carregando" por este texto.
    await expect(principal.getByRole('status')).toHaveText(SEM_TURMA_NO_ANO, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(principal.getByRole('button', { name: 'Tentar de novo' })).toHaveCount(0)
    await expect(principal).not.toContainText(MENSAGENS_DE_ERRO.NAO_ENCONTRADO)
    expect(await violacoesGraves(page)).toEqual([])
  })
})

test.describe('recomeço da "Minha turma"', () => {
  test('segunda pessoa: o aluno seguinte no mesmo Chromebook vê a turma dele, e nunca a do anterior', async ({ page, hasTouch }) => {
    const primeiro = await criarAlunoComMatricula()
    const turmaDoPrimeiro = await colocarAlunoNaTurma(primeiro)
    const segundo = await criarAlunoComMatricula({ escola: primeiro })
    const turmaDoSegundo = await colocarAlunoNaTurma(segundo)
    await entrarComoAluno(page, primeiro, hasTouch)
    await irPelaNavegacao(page, 'Minha turma', hasTouch)
    await expect(page.getByRole('main')).toContainText(turmaDoPrimeiro.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })
    await abrirNavegacao(page, hasTouch)
    const sair = lateral(page).getByRole('button', { name: 'Sair' })
    if (hasTouch) await sair.tap()
    else await sair.click()
    await expect(page).toHaveURL(/\/entrar$/, { timeout: PRAZO_DA_ENTRADA_MS })

    // O segundo entra na mesma aba, sem recarregar, e com a leitura da turma segurada: é aí que a turma do anterior
    // apareceria, se tivesse ficado no cache.
    let liberar: () => void = () => undefined
    const segurada = new Promise<void>((resolver) => (liberar = resolver))
    await page.route(ROTA_MINHA_TURMA, async (rota: Route) => {
      await segurada
      await rota.continue()
    })
    await page.evaluate((slug) => {
      window.history.pushState(null, '', `/e/${slug}`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }, segundo.slug)
    await page.getByLabel('Matrícula').fill(segundo.matricula)
    await page.getByLabel('Senha').fill(segundo.senha)
    const entrar = page.getByRole('button', { name: /^Entrar$/ })
    if (hasTouch) await entrar.tap()
    else await entrar.click()
    await esperarAtividades(page, segundo.nome)
    await irPelaNavegacao(page, 'Minha turma', hasTouch)
    await expect(page.getByRole('main').getByRole('status')).toHaveText('Carregando a sua turma…', { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.locator('body')).not.toContainText(turmaDoPrimeiro.turmaNome)
    liberar()
    await expect(page.getByRole('main')).toContainText(turmaDoSegundo.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })
    await expect(page.locator('body')).not.toContainText(turmaDoPrimeiro.turmaNome)
    await expect(page.locator('body')).not.toContainText(primeiro.nome)
  })
})

test.describe('W12: "Minha turma" a 360 px', () => {
  test('sem rolagem horizontal e com o item de 44 px', async ({ page, hasTouch }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    const aluno = await criarAlunoComMatricula()
    const turma = await colocarAlunoNaTurma(aluno)
    await entrarComoAluno(page, aluno, hasTouch)

    await abrirNavegacao(page, hasTouch)
    const item = lateral(page).getByRole('navigation', { name: 'Seções' }).getByRole('link', { name: 'Minha turma' })
    const caixa = await item.boundingBox()
    expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    await irPelaNavegacao(page, 'Minha turma', hasTouch)
    await expect(page.getByRole('main')).toContainText(turma.turmaNome, { timeout: PRAZO_DA_ENTRADA_MS })
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
  })
})
