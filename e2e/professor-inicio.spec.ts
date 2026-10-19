import { MENSAGENS_DE_ERRO } from '../packages/shared/src/erros/mensagens.ts'
import { atividadeSintetica, erroDaApi, portao, versaoAdaptada } from './__fixtures__/assistente.ts'
import { PRAZO_DA_ENTRADA_MS } from './__fixtures__/casca.ts'
import { caixa } from './__fixtures__/fluxo-do-professor.ts'
import { acionar, entrar, irPara, PRAZO_DA_TELA_MS, recarregar } from './__fixtures__/professor/cena.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'
import { carregarSemRedeLenta, expect, test } from './__fixtures__/perfis.ts'

/**
 * A Home do professor (11.2, A2, pacote W): os quatro estados. Separado de `professor-assistente.spec.ts` pela 2.5.
 */

test.describe('a Home (11.2): os quatro estados', () => {
  test('sem turma confirmada, a tela diz o que falta e leva a Turmas; não há caixa de pedido', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    await entrar(page, hasTouch, { comTurma: false })
    await irPara(page, '/professor/nova-conversa')
    await expect(page.getByText('Falta uma turma confirmada')).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(caixa(page)).toHaveCount(0)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(page.getByRole('button', { name: 'Ir para Turmas' }), hasTouch)
    await expect(page).toHaveURL(/\/professor\/turmas$/)
  })

  test('carregando, erro com "Tentar de novo" e, com dado, a saudação, a caixa com só as três ferramentas e a turma; "Esperando você" só com pendência', async ({ page, hasTouch }) => {
    // Entrada, troca de tela e recarga com a CPU ×4 e a rede lenta do perfil: o teste percorre vários estados da mesma tela.
    test.slow()
    const { api, turmaId, turmaNome, disciplinaId } = await entrar(page, hasTouch)
    const origem = atividadeSintetica(turmaId, disciplinaId)

    // Carregando e erro: as turmas dela, seguradas e depois recusadas.
    const segura = portao()
    let recusar = true
    await page.route('**/v1/meus-vinculos*', async (route) => {
      await segura.aberta
      if (recusar) {
        await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify(erroDaApi(503, 'INDISPONIVEL_TENTE_DE_NOVO').corpo) })
      } else await route.continue()
    })
    await recarregar(page)
    await expect(page.getByText('Carregando as suas turmas…')).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    segura.abrir()
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO, { timeout: PRAZO_DA_TELA_MS })
    recusar = false
    await acionar(page.getByRole('button', { name: 'Tentar de novo' }), hasTouch)

    // Com dado: a saudação pela hora, com o primeiro nome, e nada de enfeite onde não há pendência.
    await expect(page.getByText(/^(Bom dia|Boa tarde|Boa noite), Professora\.$/)).toBeVisible({ timeout: PRAZO_DA_TELA_MS })
    await expect(caixa(page)).toBeVisible()
    await expect(page.getByLabel('Turma e disciplina')).toHaveValue(`${turmaId}:${disciplinaId}`)
    await expect(page.getByLabel('Turma e disciplina').locator('option')).toHaveText([`${turmaNome} · Química`])
    await expect(page.getByRole('heading', { name: 'Esperando você' })).toHaveCount(0)
    await expect(page.locator('[data-esperando-voce]')).toHaveCount(0)
    await expect(page.getByText(/Há mais entregas esperando você/)).toHaveCount(0)

    // O menu Ferramenta: desfazer a escolha e as três ferramentas que existem, e nenhuma outra.
    await acionar(page.getByRole('button', { name: 'Ferramenta' }), hasTouch)
    await expect(page.getByRole('menuitemradio')).toHaveText([/^Sem ferramenta/, /^Plano de aula/, /^Adaptação/, /^Atividade objetiva/])
    expect(await larguraExcedente(page)).toBe(0)
    await page.keyboard.press('Escape')
    expect(await violacoesGraves(page)).toEqual([])

    // Com entrega pendente, "Esperando você" aparece, com a função, o que é e a turma, e leva à tela do Assistente.
    const pendente = versaoAdaptada(origem).entrega
    api.entregas = [pendente]
    // A página de pendências veio cheia (`proxima`): a Home diz que há mais e manda ao sino.
    api.trocar('entregas', () => ({ status: 200, corpo: { itens: [pendente], proxima: pendente.id } }))
    await carregarSemRedeLenta(page, () => recarregar(page))
    const esperando = page.locator('[data-esperando-voce]')
    await expect(page.getByRole('heading', { name: 'Esperando você' })).toBeVisible({ timeout: PRAZO_DA_ENTRADA_MS })
    await expect(esperando).toHaveCount(1)
    await expect(page.getByText('Há mais entregas esperando você. Veja no sino “Esperando você”.')).toBeVisible()
    await expect(esperando).toContainText('Adaptação')
    await expect(esperando).toContainText('Versão adaptada')
    await expect(esperando).toContainText(`Atividade de estequiometria (versão adaptada) · ${turmaNome}`)
    expect(await larguraExcedente(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await expect(page.getByText(/Seu time/)).toHaveCount(0)
    await acionar(esperando, hasTouch)
    await expect(page).toHaveURL(/\/professor\/time\/assistente$/)
  })
})
