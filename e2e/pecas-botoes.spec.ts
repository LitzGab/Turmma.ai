import { expect, test } from './__fixtures__/perfis.ts'
import { abrirGaleria, caixa, desenho, secao } from './__fixtures__/galeria.ts'
import { ALVO_DE_TOQUE_PRINCIPAL_PX } from './__fixtures__/verificacoes.ts'

/**
 * As peças do MVP de apresentação (`docs/mvp-rapido.md` 9.3; `docs/interface.md` 11.1 e 11.3), na galeria (`/galeria`),
 * nos projetos `chromebook` e `celular`: o que a regra de cada peça promete, visto no navegador. A galeria não chama a
 * API e não tem sessão; o dado é inventado, escrito nela.
 *
 * Este arquivo é o grupo `botoes` do antigo `pecas.spec.ts` (tarefa 2.0 da X1): cada caso veio inteiro, com a mesma
 * asserção, e só mudou de arquivo. Os auxiliares comuns estão em `__fixtures__/galeria.ts`.
 */

/** Os hex da 9.1 do `docs/interface.md`, como o navegador os devolve no estilo calculado: só os que este arquivo afirma. */
const RGB = {
  caramelo: 'rgb(232, 115, 46)',
  noite: 'rgb(13, 13, 13)',
  erro: 'rgb(180, 35, 24)',
  superficie: 'rgb(255, 255, 255)',
} as const

test.describe('peças do MVP de apresentação, na galeria', () => {
  test('botões: cinco variantes, só a oficial em preto e só a primária em laranja, e o desligado nunca é igual ao ligado', async ({ page, hasTouch }) => {
    await abrirGaleria(page)
    const botoes = secao(page, 'botoes')
    const principais = botoes.locator('[data-tamanho="principal"] [data-variante]')
    await expect(principais).toHaveCount(5)
    const fundos: Record<string, string> = {}
    for (const botao of await principais.all()) {
      const variante = (await botao.getAttribute('data-variante')) ?? ''
      fundos[variante] = (await desenho(botao)).fundo
      const medida = await caixa(botao)
      expect(medida.height, variante).toBeGreaterThanOrEqual(ALVO_DE_TOQUE_PRINCIPAL_PX)
      // Pílula: o canto é pelo menos metade da altura.
      expect(Number.parseFloat((await desenho(botao)).canto), variante).toBeGreaterThanOrEqual(medida.height / 2)

      // A mesma variante, desligada, na fileira de baixo: outro fundo ou outro texto. O botão que não faz nada não se
      // parece com o que faz.
      const desligado = botoes.locator(`[data-tamanho="desligado"] [data-variante="${variante}"]`)
      await expect(desligado, variante).toBeDisabled()
      const [ligadoDesenho, desligadoDesenho] = [await desenho(botao), await desenho(desligado)]
      expect(ligadoDesenho.fundo !== desligadoDesenho.fundo || ligadoDesenho.texto !== desligadoDesenho.texto, variante).toBe(true)
      // E o desligado nunca fica com a cor da ação: nem laranja, nem preto, nem o vermelho do perigo.
      expect([RGB.caramelo, RGB.noite, RGB.erro], variante).not.toContain(desligadoDesenho.fundo)
      expect(desligadoDesenho.texto, variante).not.toBe(RGB.erro)
    }
    expect(Object.keys(fundos).sort()).toEqual(['discreto', 'oficial', 'perigo', 'primario', 'secundario'])
    expect(Object.entries(fundos).filter(([, fundo]) => fundo === RGB.noite).map(([variante]) => variante)).toEqual(['oficial'])
    expect(Object.entries(fundos).filter(([, fundo]) => fundo === RGB.caramelo).map(([variante]) => variante)).toEqual(['primario'])
    // O perigo fora do diálogo é texto em erro, sem o fundo de erro.
    expect(fundos['perigo']).toBe(RGB.superficie)
    expect((await desenho(principais.filter({ hasText: 'perigo' }))).texto).toBe(RGB.erro)

    // O botão que abre o menu, desligado, também muda de desenho: é o secundário desligado.
    const menuDesligado = botoes.getByRole('button', { name: 'Menu desligado' })
    await expect(menuDesligado).toBeDisabled()
    expect((await desenho(menuDesligado)).texto).toBe('rgb(143, 143, 143)')

    // O compacto tem 36 px no computador e 44 px onde se toca com o dedo.
    const compactos = botoes.locator('[data-tamanho="compacto"] [data-variante]')
    await expect(compactos).toHaveCount(5)
    for (const botao of await compactos.all()) expect((await caixa(botao)).height).toBeGreaterThanOrEqual(hasTouch ? ALVO_DE_TOQUE_PRINCIPAL_PX : 36)
  })
})
