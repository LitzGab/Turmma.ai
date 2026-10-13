import { expect, test } from './__fixtures__/perfis.ts'
import { abrirGaleria, acionar, caixa, conferirQueOFocoNaoCaiu, desenho, secao } from './__fixtures__/galeria.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, focoVisivel, larguraExcedenteDoDialogo, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * As peças do MVP de apresentação (`docs/mvp-rapido.md` 9.3; `docs/interface.md` 11.1 e 11.3), na galeria (`/galeria`),
 * nos projetos `chromebook` e `celular`: o que a regra de cada peça promete, visto no navegador. A galeria não chama a
 * API e não tem sessão; o dado é inventado, escrito nela.
 *
 * Este arquivo é o grupo `sobrepor` do antigo `pecas.spec.ts` (tarefa 2.0 da X1): cada caso veio inteiro, com a mesma
 * asserção, e só mudou de arquivo. Os auxiliares comuns estão em `__fixtures__/galeria.ts`.
 */

/** Os hex da 9.1 do `docs/interface.md`, como o navegador os devolve no estilo calculado: só os que este arquivo afirma. */
const RGB = {
  noite: 'rgb(13, 13, 13)',
  erro: 'rgb(180, 35, 24)',
  superficie: 'rgb(255, 255, 255)',
} as const

test.describe('peças do MVP de apresentação, na galeria', () => {
  test('abas e menu pelo teclado: uma parada só no Tab, setas, item desligado pulado, e o Esc devolve o foco', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const abas = secao(page, 'abas')
    const lista = abas.getByRole('tablist', { name: 'Seções da turma' })
    const painel = abas.getByRole('tabpanel').first()
    await expect(lista.getByRole('tab')).toHaveCount(3)
    await expect(lista.getByRole('tab', { name: 'Visão geral' })).toHaveAttribute('aria-selected', 'true')
    await expect(painel).toHaveText('Conteúdo de Visão geral.')
    // As três abas estão à vista, também a 360 px: a lista quebra de linha em vez de esconder a que não coube.
    const largura = page.viewportSize()?.width ?? 0
    for (const aba of await lista.getByRole('tab').all()) {
      const medida = await caixa(aba)
      expect(medida.x).toBeGreaterThanOrEqual(0)
      expect(medida.x + medida.width).toBeLessThanOrEqual(largura)
    }

    // Só a aba ativa está na ordem do Tab; as setas trocam de aba e levam o foco junto.
    expect(await lista.getByRole('tab').evaluateAll((guias) => guias.map((guia) => (guia as HTMLElement).tabIndex))).toEqual([0, -1, -1])
    await lista.getByRole('tab', { name: 'Visão geral' }).focus()
    await page.keyboard.press('ArrowRight')
    const alunos = lista.getByRole('tab', { name: /Alunos/ })
    await expect(alunos).toHaveAttribute('aria-selected', 'true')
    await expect(alunos).toBeFocused()
    expect(await focoVisivel(page)).toBe(true)
    await expect(painel).toHaveText('Conteúdo de Alunos.')
    // O contador diz o que conta, e quem usa a peça é que diz o quê.
    await expect(alunos).toHaveText(/2 pedidos de nome/)
    await page.keyboard.press('End')
    await expect(lista.getByRole('tab', { name: 'Atividades' })).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('ArrowRight')
    await expect(lista.getByRole('tab', { name: 'Visão geral' })).toHaveAttribute('aria-selected', 'true')
    // O Tab seguinte entra no painel, e não na aba ao lado.
    await page.keyboard.press('Tab')
    await expect(painel).toBeFocused()

    // Com a aba ativa fora da lista, nenhuma está selecionada, e a primeira continua alcançável pelo Tab.
    const semAtiva = abas.locator('[data-abas="sem-ativa"]').getByRole('tab')
    expect(await semAtiva.evaluateAll((guias) => guias.map((guia) => [(guia as HTMLElement).tabIndex, guia.getAttribute('aria-selected')]))).toEqual([
      [0, 'false'],
      [-1, 'false'],
      [-1, 'false'],
    ])

    // O menu: a seta para baixo abre com o foco no primeiro item, e as setas pulam o desligado.
    const bloco = secao(page, 'selecao-e-menu')
    const botao = bloco.getByRole('button', { name: 'Ações da atividade' })
    await botao.focus()
    await page.keyboard.press('ArrowDown')
    const menu = page.getByRole('menu', { name: 'Ações da atividade' })
    await expect(menu.getByRole('menuitem', { name: 'Exportar em PDF' })).toBeFocused()
    expect(await focoVisivel(page)).toBe(true)
    // A letra com Ctrl é atalho do navegador, e não busca no menu; sozinha, leva ao item que começa por ela.
    await page.keyboard.press('Control+g')
    await expect(menu.getByRole('menuitem', { name: 'Exportar em PDF' })).toBeFocused()
    await page.keyboard.press('g')
    await expect(menu.getByRole('menuitem', { name: 'Gerar versão adaptada' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    // "Aplicar à turma" está desligado: a seta vai direto ao "Excluir".
    await expect(menu.getByRole('menuitem', { name: 'Excluir' })).toBeFocused()
    await expect(menu.getByRole('menuitem', { name: /Aplicar à turma/ })).toHaveAttribute('aria-disabled', 'true')
    expect(await violacoesGraves(page)).toEqual([])
    await page.keyboard.press('Home')
    await expect(menu.getByRole('menuitem', { name: 'Exportar em PDF' })).toBeFocused()

    // O Esc fecha sem escolher e devolve o foco ao botão.
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(botao).toBeFocused()
    await expect(bloco.locator('[data-acao]')).toHaveText('')

    // O toque fora fecha, e só fecha: o botão vizinho, que estava embaixo do toque, não é acionado junto. O toque vai
    // pela coordenada, como o dedo: para o Playwright o vizinho está coberto, e ele esperaria o menu sair da frente.
    await page.keyboard.press('ArrowDown')
    await expect(menu).toBeVisible()
    // Inerte, o vizinho some da árvore de acessibilidade: aqui ele é achado pelo texto, e não pelo papel.
    const vizinho = bloco.locator('button', { hasText: 'Vizinho' })
    await expect(vizinho).toHaveAttribute('inert', '')
    const alvo = await caixa(vizinho)
    const [x, y] = [alvo.x + alvo.width / 2, alvo.y + alvo.height / 2]
    await (hasTouch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y))
    await expect(menu).toHaveCount(0)
    await expect(botao).toBeFocused()
    await expect(bloco.locator('[data-acao]')).toHaveText('')
    await expect(vizinho).not.toHaveAttribute('inert')
    // O controle: com o menu fechado, o mesmo toque aciona o vizinho.
    await acionar(vizinho, hasTouch)
    await expect(bloco.locator('[data-acao]')).toHaveText('Escolhido: vizinho')
    await botao.focus()

    // A página rola com o menu aberto: ele fecha, em vez de correr atrás do botão, e o foco volta para o botão sem
    // puxar a página de volta.
    await page.keyboard.press('ArrowDown')
    await expect(menu.getByRole('menuitem', { name: 'Exportar em PDF' })).toBeFocused()
    const antesDeRolar = await page.evaluate(() => window.scrollY)
    await page.evaluate(() => window.scrollBy(0, 120))
    await expect(menu).toHaveCount(0)
    await expect(botao).toBeFocused()
    expect(await page.evaluate(() => window.scrollY)).toBe(antesDeRolar + 120)
    await expect(vizinho).not.toHaveAttribute('inert')

    // Enter abre, e Enter no item escolhe.
    await page.keyboard.press('Enter')
    await expect(menu.getByRole('menuitem', { name: 'Exportar em PDF' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(menu).toHaveCount(0)
    await expect(bloco.locator('[data-acao]')).toHaveText('Escolhido: exportar')
    await expect(botao).toBeFocused()
  })

  test('o menu que abre logo depois de uma rolagem fica aberto: o evento de rolagem que sobrou de antes do clique não o fecha', async ({ page }) => {
    await abrirGaleria(page)
    const bloco = secao(page, 'selecao-e-menu')
    const botao = bloco.getByRole('button', { name: 'Ações da atividade' })
    const menu = page.getByRole('menu', { name: 'Ações da atividade' })
    await botao.scrollIntoViewIfNeeded()

    // A página rola e o botão é acionado no mesmo instante, como o Playwright faz ao trazer o botão para a tela e como
    // faz quem solta a rolagem e clica: o navegador entrega o evento de rolagem no quadro seguinte, com o menu já aberto.
    // O botão não saiu do lugar depois da abertura, e o menu não tem por que fechar.
    for (const repeticao of [1, 2, 3]) {
      await botao.evaluate((elemento) => {
        window.scrollBy(0, 40)
        ;(elemento as HTMLElement).click()
      })
      // Dois quadros: o evento de rolagem pendente já foi entregue.
      await page.evaluate(() => new Promise((resolver) => requestAnimationFrame(() => requestAnimationFrame(() => resolver(null)))))
      await expect(menu, `abertura ${String(repeticao)}`).toBeVisible()
      await expect(menu.getByRole('menuitem', { name: 'Exportar em PDF' })).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(menu).toHaveCount(0)
    }

    // O controle: com o menu aberto, a rolagem que tira o botão do lugar continua fechando.
    await botao.focus()
    await page.keyboard.press('Enter')
    await expect(menu).toBeVisible()
    await page.evaluate(() => window.scrollBy(0, -60))
    await expect(menu).toHaveCount(0)
    await expect(botao).toBeFocused()
  })

  test('o diálogo de confirmação: o que vai acontecer e o aviso são lidos ao abrir, o foco não começa em confirmar e volta para onde dá', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const bloco = secao(page, 'confirmacao')
    const gatilho = bloco.getByRole('button', { name: 'Aprovar 32 correções' })
    const decisao = bloco.locator('[data-decisao]')

    await acionar(gatilho, hasTouch)
    const oficial = page.getByRole('alertdialog', { name: 'Aprovar 32 correções' })
    await expect(oficial).toBeVisible()
    // O que vai acontecer, antes de confirmar: a atividade, a turma, quantas correções, e o efeito (regra 50, item 8).
    await expect(oficial).toContainText('Estequiometria: lista 3')
    await expect(oficial).toContainText('2ºB')
    await expect(oficial).toContainText('O diagnóstico por habilidade chega aos alunos da turma.')
    const aprovar = oficial.getByRole('button', { name: 'Aprovar 32 correções' })
    const cancelar = oficial.getByRole('button', { name: 'Cancelar' })
    // O foco começa no texto: um Enter a mais não aprova nada.
    await expect(aprovar).not.toBeFocused()
    await page.keyboard.press('Enter')
    await expect(oficial).toBeVisible()
    await expect(decisao).toHaveText('')
    // O botão que confirma é o preto, e o de cancelar tem a mesma altura (D59).
    expect(await desenho(aprovar)).toMatchObject({ fundo: RGB.noite })
    expect((await caixa(cancelar)).height).toBe((await caixa(aprovar)).height)
    expect((await caixa(cancelar)).height).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    // O Esc cancela, sem decidir, e o foco volta ao botão que abriu.
    await page.keyboard.press('Escape')
    await expect(oficial).toHaveCount(0)
    await expect(decisao).toHaveText('')
    await expect(gatilho).toBeFocused()

    // Em andamento: o botão que confirma desliga e diz o que está fazendo; cancelar continua valendo.
    await acionar(bloco.getByRole('button', { name: 'Ver a confirmação em andamento' }), hasTouch)
    await expect(oficial.getByRole('button', { name: 'Aprovando…' })).toBeDisabled()
    await expect(oficial.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
    await page.keyboard.press('Escape')
    await expect(bloco.getByRole('button', { name: 'Ver a confirmação em andamento' })).toBeFocused()

    // Com falha: o texto diz o que fazer, e dá para tentar de novo.
    await acionar(bloco.getByRole('button', { name: 'Ver a confirmação com falha' }), hasTouch)
    await expect(oficial.getByRole('alert')).toHaveText('Não foi possível aprovar. Tente de novo em instantes.')
    await expect(oficial.getByRole('button', { name: 'Aprovar 32 correções' })).toBeEnabled()
    await page.keyboard.press('Escape')

    // Rejeitar pede o motivo: sem ele, de 8 a 500 caracteres, o botão que confirma fica desligado.
    await acionar(bloco.getByRole('button', { name: 'Rejeitar o lote' }), hasTouch)
    const rejeicao = page.getByRole('alertdialog', { name: 'Rejeitar 32 correções' })
    const rejeitar = rejeicao.getByRole('button', { name: 'Rejeitar 32 correções' })
    const motivo = rejeicao.getByLabel('Motivo da rejeição')
    await expect(rejeitar).toBeDisabled()
    await expect(rejeicao.getByText('Motivo da rejeição (obrigatório)')).toBeVisible()
    await expect(motivo).toHaveAttribute('aria-required', 'true')
    // A marca "(obrigatório)" é para quem vê: o nome do campo não a leva, e o leitor de tela não ouve "obrigatório" duas vezes.
    await expect(rejeicao.getByRole('textbox', { name: 'Motivo da rejeição', exact: true })).toHaveCount(1)
    // O limite do campo é o do contador, e não o `maxlength` do navegador, que contaria o espaço das pontas.
    await expect(motivo).not.toHaveAttribute('maxlength')
    await expect(rejeicao.getByText('0 de 500')).toBeVisible()
    await motivo.fill('  errada  ')
    // O contador conta sem o espaço das pontas, como a API.
    await expect(rejeicao.getByText('6 de 500')).toBeVisible()
    await expect(rejeitar).toBeDisabled()
    await motivo.fill('A questão 3 não é do capítulo 7.')
    await expect(rejeitar).toBeEnabled()
    expect(await desenho(rejeitar)).toMatchObject({ fundo: RGB.erro })
    expect(await larguraExcedenteDoDialogo(page)).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await acionar(rejeitar, hasTouch)
    await expect(decisao).toHaveText('Rejeitado')

    // A ação de perigo com aviso: o cheio em erro só existe aqui dentro, e o aviso da auditoria faz parte do que o
    // leitor de tela ouve ao abrir (a descrição do diálogo), e não só do que se vê.
    const suspender = bloco.getByRole('button', { name: 'Suspender a função' })
    expect(await desenho(suspender)).toMatchObject({ fundo: RGB.superficie, texto: RGB.erro })
    await acionar(suspender, hasTouch)
    const perigo = page.getByRole('alertdialog', { name: 'Suspender a correção de objetiva' })
    await expect(perigo).toContainText('A suspensão fica na auditoria da escola.')
    const descricao = await perigo.evaluate((dialogo) => document.getElementById(dialogo.getAttribute('aria-describedby') ?? '')?.textContent ?? '')
    expect(descricao).toContain('O Assistente para de corrigir atividades nesta escola')
    expect(descricao).toContain('A suspensão fica na auditoria da escola.')
    const confirmar = perigo.getByRole('button', { name: 'Suspender a função' })
    expect(await desenho(confirmar)).toMatchObject({ fundo: RGB.erro })
    await acionar(confirmar, hasTouch)
    await expect(perigo).toHaveCount(0)
    await expect(decisao).toHaveText('Suspensa')

    // Aprovar pelo teclado. O botão que abriu desliga depois da aprovação: o foco não volta para ele, e também não cai
    // no `body` — vai para o resultado.
    await gatilho.focus()
    await page.keyboard.press('Enter')
    await aprovar.focus()
    await page.keyboard.press('Enter')
    await expect(oficial).toHaveCount(0)
    await expect(decisao).toHaveText('Aprovado')
    await expect(gatilho).toBeDisabled()
    await expect(decisao).toBeFocused()
    await conferirQueOFocoNaoCaiu(page)
  })
})
