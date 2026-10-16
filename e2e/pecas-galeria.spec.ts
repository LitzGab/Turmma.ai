import { expect, test } from './__fixtures__/perfis.ts'
import { abrirGaleria, acionar, conferirQueCabeNaJanela, desenho, desenhos, medirBlocosDaGaleria, secao } from './__fixtures__/galeria.ts'
import { larguraExcedente, violacoesGraves } from './__fixtures__/verificacoes.ts'

/**
 * As peças do MVP de apresentação (`docs/mvp-rapido.md` 9.3; `docs/interface.md` 11.1 e 11.3), na galeria (`/galeria`),
 * nos projetos `chromebook` e `celular`: o que a regra de cada peça promete, visto no navegador. A galeria não chama a
 * API e não tem sessão; o dado é inventado, escrito nela.
 *
 * Este arquivo é o grupo `galeria` do antigo `pecas.spec.ts` (tarefa 2.0 da X1): cada caso veio inteiro, com a mesma
 * asserção, e só mudou de arquivo. Os auxiliares comuns estão em `__fixtures__/galeria.ts`.
 */

test.describe('peças do MVP de apresentação, na galeria', () => {
  test('nenhuma peça passa da largura da janela, com o menu aberto também, e o axe não acha violação na galeria', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    expect(await larguraExcedente(page)).toBe(0)
    // Cada bloco da galeria cabe na janela e não rola por dentro: uma peça que estourasse dentro de um contêiner com rolagem
    // passaria na conta do documento.
    const blocos = await medirBlocosDaGaleria(page)
    expect(blocos.total).toBeGreaterThanOrEqual(15)
    expect(blocos.passamDaJanela, 'blocos que passam da janela').toEqual([])
    expect(blocos.comRolagemPropria, 'blocos com rolagem horizontal própria').toEqual([])
    expect(await violacoesGraves(page)).toEqual([])

    // O menu de ferramenta da caixa de pedido: abre, cabe na janela a 360 px, e continua sem violação.
    const ferramenta = secao(page, 'caixa-pedido').getByRole('button', { name: 'Ferramenta: Só conversar' })
    await acionar(ferramenta, hasTouch)
    const menu = page.getByRole('menu', { name: 'Ferramenta: Só conversar' })
    await expect(menu).toBeVisible()
    await conferirQueCabeNaJanela(page, menu)
    expect(await violacoesGraves(page)).toEqual([])
    // A Adaptação não fica ao lado de uma caixa de texto livre: ela abre o formulário de tipos, e não leva o texto (D35).
    await expect(menu.getByRole('menuitemradio')).toHaveCount(3)
    await expect(menu.getByRole('menuitemradio', { name: /Adaptação/ })).toHaveCount(0)
    // É menu de escolha única: o item de agora vem marcado, e escolher outro troca o texto do botão.
    await expect(menu.getByRole('menuitemradio', { name: /Só conversar/ })).toHaveAttribute('aria-checked', 'true')
    await acionar(menu.getByRole('menuitemradio', { name: /Atividade objetiva/ }), hasTouch)
    await expect(menu).toHaveCount(0)
    await expect(secao(page, 'caixa-pedido').getByRole('button', { name: 'Ferramenta: Atividade objetiva' })).toBeFocused()

    // Os selos de estado dizem o estado em texto, e não só na cor.
    const estado = secao(page, 'estado')
    for (const texto of ['Esperando você', 'Aprovado', 'Rejeitado', 'Faz e avisa']) await expect(estado.getByText(texto, { exact: true })).toBeVisible()
    // A faixa do aluno não fecha: não tem botão nenhum.
    const faixa = estado.getByRole('note')
    await expect(faixa).toHaveText('Seu professor acompanha como você usa o Tutor.')
    await expect(faixa.getByRole('button')).toHaveCount(0)
    // A barra diz o valor em texto, e o número de painel vem no formato local.
    await expect(secao(page, 'painel').getByText('12 de 60 perguntas')).toBeVisible()
    await expect(secao(page, 'painel').getByText('72%')).toBeVisible()
    await expect(secao(page, 'painel').getByText('1.412')).toBeVisible()
  })
})

/**
 * Os dois verificadores em lote da galeria, com uma página montada com cada defeito (correção
 * `2026-10-16-galeria-da-onca-estoura-o-prazo`): quem confere em lote tem de continuar vendo o que o laço via.
 */
test.describe('os verificadores em lote da galeria', () => {
  test('medirBlocosDaGaleria acusa o bloco que passa da janela (largo, ou deslocado à direita), ainda que dentro de um contêiner com rolagem, e o que rola por dentro', async ({ page }) => {
    await page.setContent(`<meta name="viewport" content="width=device-width"><body>
      <div style="overflow-x:auto;width:200px"><section data-galeria="largo" style="width:2500px">x</section></div>
      <section data-galeria="com-rolagem" style="width:100px;overflow-x:auto"><div style="width:900px">y</div></section>
      <section data-galeria="deslocado" style="margin-left:1500px;width:100px">z</section>
      <section data-galeria="ok">ok</section>
    </body>`)
    expect(await medirBlocosDaGaleria(page)).toEqual({ total: 4, passamDaJanela: ['largo', 'deslocado'], comRolagemPropria: ['com-rolagem'] })
  })

  test('medirBlocosDaGaleria deixa passar o bloco que cabe, e conta os blocos', async ({ page }) => {
    await page.setContent('<meta name="viewport" content="width=device-width"><body><section data-galeria="a">a</section><section data-galeria="b">b</section></body>')
    expect(await medirBlocosDaGaleria(page)).toEqual({ total: 2, passamDaJanela: [], comRolagemPropria: [] })
  })

  test('desenhos devolve o desenho de cada peça, na ordem, com os sete campos do `desenho` de uma só', async ({ page }) => {
    // Duas peças que diferem em todos os campos: se um campo de `desenhos` for zerado, trocado de propriedade ou sair da
    // ordem, a comparação com o `desenho` de cada peça (que é o de uma ida por peça) reprova.
    await page.setContent(`<body>
      <p id="a" style="background:rgb(1, 2, 3);color:rgb(4, 5, 6);border:2px solid rgb(7, 8, 9);font-weight:700;font-size:15px;border-radius:12px;padding:3px">a</p>
      <p id="b" style="background:rgb(11, 12, 13);color:rgb(14, 15, 16);border:4px dashed rgb(17, 18, 19);font-weight:400;font-size:20px;border-radius:4px;padding:9px">b</p>
    </body>`)
    const [a, b] = [await desenho(page.locator('#a')), await desenho(page.locator('#b'))]
    for (const campo of Object.keys(a) as Array<keyof typeof a>) expect(a[campo], `o campo ${String(campo)} tem de diferir entre as duas peças, ou não prova nada`).not.toBe(b[campo])
    expect(await desenhos(page.locator('p'))).toEqual([a, b])
  })
})
