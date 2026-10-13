import { expect, test } from './__fixtures__/perfis.ts'
import { abrirGaleria, acionar, caixa, conferirQueCabeNaJanela, secao } from './__fixtures__/galeria.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * As peças do MVP de apresentação (`docs/mvp-rapido.md` 9.3; `docs/interface.md` 11.1 e 11.3), na galeria (`/galeria`),
 * nos projetos `chromebook` e `celular`: o que a regra de cada peça promete, visto no navegador. A galeria não chama a
 * API e não tem sessão; o dado é inventado, escrito nela.
 *
 * Este arquivo é o grupo `superficies` do antigo `pecas.spec.ts` (tarefa 2.0 da X1): cada caso veio inteiro, com a mesma
 * asserção, e só mudou de arquivo. Os auxiliares comuns estão em `__fixtures__/galeria.ts`.
 */

test.describe('peças do MVP de apresentação, na galeria', () => {
  test('a Tela não põe margem dentro da casca; fora dela, com `comMargem`, põe a da página', async ({ page }) => {
    await abrirGaleria(page)
    // A galeria está fora da casca e pede a margem: 16 px no celular, 24 px a partir de 768 px, dos dois lados.
    const tela = page.locator('[data-tela]').first()
    const esperada = (page.viewportSize()?.width ?? 0) >= 768 ? '24px' : '16px'
    expect(await tela.evaluate((elemento) => [getComputedStyle(elemento).paddingLeft, getComputedStyle(elemento).paddingRight])).toEqual([esperada, esperada])
  })

  test('a barra presa não cobre o último item, a tabela vira lista no celular, o menu não é cortado dentro dela, e "preparando a resposta" não se mexe', async ({ page, hasTouch }) => {
    await abrirGaleria(page)

    // A barra presa: gruda no pé da caixa que rola, com a lista por trás, e no fim da rolagem o último item fica inteiro
    // acima dela.
    const rolagem = secao(page, 'barra-presa').locator('[data-rolagem]')
    const barra = rolagem.getByRole('group', { name: 'Aprovação do lote' })
    await rolagem.scrollIntoViewIfNeeded()
    await expect(barra).toContainText('3 de 5 destaques abertos')
    await expect(barra.getByRole('button', { name: 'Aprovar 32 correções' })).toBeDisabled()
    const [daRolagem, daBarraNoTopo] = [await caixa(rolagem), await caixa(barra)]
    expect(await rolagem.evaluate((elemento) => elemento.scrollHeight > elemento.clientHeight)).toBe(true)
    // Com a lista no começo, a barra já está no pé da caixa, e não lá embaixo, depois do último item.
    expect(daBarraNoTopo.y + daBarraNoTopo.height).toBeLessThanOrEqual(daRolagem.y + daRolagem.height)
    expect(daBarraNoTopo.y + daBarraNoTopo.height).toBeGreaterThan(daRolagem.y + daRolagem.height - 4)
    await rolagem.evaluate((elemento) => elemento.scrollTo(0, elemento.scrollHeight))
    const ultimo = rolagem.locator('li').last()
    await expect.poll(async () => (await caixa(ultimo)).y + (await caixa(ultimo)).height).toBeLessThanOrEqual((await caixa(barra)).y + 0.5)
    // Pelo Tab, no meio da lista: o controle que recebe o foco para acima da barra, e não escondido atrás dela (WCAG
    // 2.4.11). A barra reservou a altura dela no bloco que rola.
    expect(await rolagem.evaluate((elemento) => elemento.style.scrollPaddingBottom)).toBe(`${String(Math.ceil((await caixa(barra)).height))}px`)
    await rolagem.evaluate((elemento) => elemento.scrollTo(0, 0))
    const abrir = rolagem.locator('li').getByRole('button', { name: 'Abrir' })
    await expect(abrir).toHaveCount(6)
    await abrir.first().focus()
    for (let indice = 0; indice < 6; indice++) {
      if (indice > 0) await page.keyboard.press('Tab')
      await expect(abrir.nth(indice)).toBeFocused()
      const [focado, daBarra, daCaixa] = [await caixa(abrir.nth(indice)), await caixa(barra), await caixa(rolagem)]
      expect(focado.y + focado.height, `item ${String(indice + 1)} atrás da barra`).toBeLessThanOrEqual(daBarra.y + 0.5)
      expect(focado.y, `item ${String(indice + 1)} acima da caixa`).toBeGreaterThanOrEqual(daCaixa.y - 0.5)
    }
    // O Tab seguinte chega à barra: ela é o fim da lista, na ordem do teclado também.
    await page.keyboard.press('Tab')
    await expect(barra.getByRole('button', { name: 'Rejeitar' })).toBeFocused()

    // A 360 px os dois botões da barra continuam com o alvo de toque e dentro da caixa.
    for (const botao of await barra.getByRole('button').all()) {
      const medida = await caixa(botao)
      expect(medida.height).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
      expect(medida.x + medida.width).toBeLessThanOrEqual(daRolagem.x + daRolagem.width)
    }

    // A tabela: de verdade a partir de 768 px, com cabeçalho de coluna e de linha; lista abaixo disso, com o rótulo de
    // cada valor escrito. Uma estrutura só no documento.
    const tabela = secao(page, 'tabela')
    const larga = (page.viewportSize()?.width ?? 0) >= 768
    if (larga) {
      const principal = tabela.locator('[data-tabela="tabela"]').first()
      await expect(tabela.getByRole('table', { name: 'O que a IA gerou e quem aprovou' })).toBeVisible()
      await expect(principal.getByRole('columnheader')).toHaveText(['O quê', 'Agente e função', 'Turma', 'Aprovação', 'Ações'])
      await expect(principal.getByRole('rowheader')).toHaveText(['Correção da lista 3', 'Versão com fonte ampliada', 'Atividade de estequiometria'])
      await expect(tabela.locator('[data-tabela="lista"]')).toHaveCount(0)
      // A tabela que cabe não é uma parada a mais no Tab; a que não cabe rola dentro dela mesma, e aí recebe foco e nome.
      expect(await principal.evaluate((elemento) => elemento.scrollWidth > elemento.clientWidth)).toBe(false)
      await expect(principal).not.toHaveAttribute('tabindex')
      await expect(principal).not.toHaveAttribute('role')
      const estreita = tabela.locator('[data-tabela-estreita] [data-tabela="tabela"]')
      expect(await estreita.evaluate((elemento) => elemento.scrollWidth > elemento.clientWidth)).toBe(true)
      await expect(estreita).toHaveAttribute('tabindex', '0')
      await expect(tabela.getByRole('region', { name: 'Tabela que não cabe' })).toHaveCount(1)
    } else {
      await expect(tabela.locator('table')).toHaveCount(0)
      const itens = tabela.getByRole('list', { name: 'O que a IA gerou e quem aprovou' }).locator('> li')
      await expect(itens).toHaveCount(3)
      await expect(itens.first().locator('dt')).toHaveText(['Agente e função', 'Turma', 'Aprovação', 'Ações'])
      await expect(itens.first()).toContainText('Correção da lista 3')
    }
    // Para a coordenação, a pendente diz por quem espera.
    await expect(tabela.locator('[data-aprovacao="pendente"]').first()).toHaveText('Esperando o professor')

    // O menu de uma linha, dentro do contêiner que rola ou corta: abre inteiro, por cima, sem ser cortado.
    const acoes = tabela.getByRole('button', { name: 'Ações de Correção da lista 3' })
    await acionar(acoes, hasTouch)
    const menu = page.getByRole('menu', { name: 'Ações de Correção da lista 3' })
    await expect(menu).toBeVisible()
    await conferirQueCabeNaJanela(page, menu)
    // Perto dos quatro cantos do menu, o que está por cima é o próprio menu: nada dele ficou atrás da tabela. Os pontos
    // ficam 20 px para dentro, depois da curva do canto de 16 px, onde a caixa do menu ainda não é o menu.
    const cortado = await menu.evaluate((elemento) => {
      const caixaDoMenu = elemento.getBoundingClientRect()
      const pontos = [
        [caixaDoMenu.left + 20, caixaDoMenu.top + 20],
        [caixaDoMenu.right - 20, caixaDoMenu.top + 20],
        [caixaDoMenu.left + 20, caixaDoMenu.bottom - 20],
        [caixaDoMenu.right - 20, caixaDoMenu.bottom - 20],
      ] as const
      return pontos.filter(([x, y]) => !elemento.contains(document.elementFromPoint(x, y))).length
    })
    expect(cortado).toBe(0)
    expect(await violacoesGraves(page)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(acoes).toBeFocused()

    // "Preparando a resposta": um texto, anunciado com calma, sem nada animado; a demora troca o texto, uma vez.
    const conversa = secao(page, 'conversa')
    const registro = conversa.getByRole('log', { name: 'Conversa com o Assistente de ensino' })
    await expect(registro).toHaveAttribute('aria-live', 'polite')
    await expect(registro).toHaveAttribute('aria-busy', 'false')
    const pensando = conversa.locator('[data-pensando]')
    await expect(pensando.locator('[aria-live="polite"]')).toHaveText('Preparando a resposta…')
    expect(await pensando.evaluate((elemento) => [elemento, ...elemento.querySelectorAll('*')].filter((no) => getComputedStyle(no).animationName !== 'none').length)).toBe(0)
    await acionar(conversa.getByRole('button', { name: 'Simular a demora' }), hasTouch)
    await expect(pensando.locator('[aria-live="polite"]')).toHaveText('Ainda preparando a resposta. Você não precisa pedir de novo.')
    // Enquanto a resposta chega, a conversa está ocupada: o leitor de tela espera para ler o que entrou.
    await expect(registro).toHaveAttribute('aria-busy', 'true')

    // O campo de várias linhas: rótulo, contador em texto e o limite no próprio campo.
    const observacao = secao(page, 'selecao-e-menu').getByLabel('Observação')
    await observacao.fill('linha um\nlinha dois')
    await expect(secao(page, 'selecao-e-menu').getByText('19 de 200')).toBeVisible()
    // O campo corta no limite pela mesma conta do contador: o espaço das pontas não gasta o limite, e nada trava antes.
    await observacao.fill(`  ${'x'.repeat(205)}`)
    await expect(observacao).toHaveValue(`  ${'x'.repeat(200)}`)
    await expect(secao(page, 'selecao-e-menu').getByText('200 de 200')).toBeVisible()
    // Só cresce para baixo: arrastado para o lado, estouraria a largura da tela.
    expect(await observacao.evaluate((elemento) => getComputedStyle(elemento).resize)).toBe('vertical')
    // A seleção obrigatória diz que é, em texto e para o leitor de tela.
    await expect(secao(page, 'selecao-e-menu').getByText('Turma (obrigatório)')).toBeVisible()
    await expect(secao(page, 'selecao-e-menu').getByLabel('Turma')).toHaveAttribute('aria-required', 'true')
  })
})
