import { expect, test } from './__fixtures__/perfis.ts'
import { abrirGaleria, acionar, caixa, conferirQueCabeNaJanela, secao } from './__fixtures__/galeria.ts'
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
    // Cada bloco da galeria cabe na janela: uma peça que estourasse dentro de um contêiner com rolagem passaria na
    // conta do documento.
    const largura = page.viewportSize()?.width ?? 0
    const blocos = page.locator('[data-galeria]')
    expect(await blocos.count()).toBeGreaterThanOrEqual(15)
    for (const bloco of await blocos.all()) {
      const nome = (await bloco.getAttribute('data-galeria')) ?? ''
      const medida = await caixa(bloco)
      expect(medida.x + medida.width, nome).toBeLessThanOrEqual(largura)
      expect(await bloco.evaluate((elemento) => elemento.scrollWidth - elemento.clientWidth), nome).toBe(0)
    }
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
